import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { PLANS, type PlanId } from "./plans";

const GenerateInput = z.object({
  kind: z.enum(["study", "test", "exam"]),
  topic: z.string().trim().min(2).max(200),
  subject: z.string().trim().max(80).optional(),
  count: z.number().int().min(3).max(50),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  source_material_id: z.string().uuid().optional(),
});

const QuestionSchema = z.object({
  prompt: z.string(),
  choices: z.array(z.string()).min(2).max(6).optional(),
  answer: z.string(),
  explanation: z.string().optional(),
});

function startOfMonthISO() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

export const getAiUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .maybeSingle();
    const plan = ((profile?.plan as PlanId) ?? "free") in PLANS ? (profile?.plan as PlanId) : "free";
    const { count } = await supabase
      .from("ai_usage")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonthISO());
    const limit = PLANS[plan].aiPerMonth;
    const used = count ?? 0;
    return { plan, used, limit, remaining: Math.max(0, limit - used) };
  });

export const generateSet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => GenerateInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Resolve plan + usage
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .maybeSingle();
    const planId: PlanId = ((profile?.plan as PlanId) in PLANS ? (profile?.plan as PlanId) : "free");
    const plan = PLANS[planId];

    if (data.count > plan.maxQuestionsPerSet) {
      throw new Error(
        `Your ${plan.name} plan allows up to ${plan.maxQuestionsPerSet} questions per set. Upgrade for more.`,
      );
    }

    const { count } = await supabase
      .from("ai_usage")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonthISO());
    if ((count ?? 0) >= plan.aiPerMonth) {
      throw new Error(
        `You've used all ${plan.aiPerMonth} AI generations on the ${plan.name} plan this month. Upgrade in Billing.`,
      );
    }

    // Build prompt
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured");

    const kindInstr =
      data.kind === "study"
        ? `Create ${data.count} flashcards. Each item must have a short "prompt" (the front of the card), an "answer" (the back), and no "choices". Keep prompts focused and answers concise.`
        : data.kind === "test"
          ? `Create ${data.count} multiple-choice quiz questions. Each item: "prompt" (the question), "choices" (exactly 4 plausible options), "answer" (must equal one of the choices verbatim), and a brief "explanation".`
          : `Create a ${data.count}-question exam. Mix difficulty around ${data.difficulty}. Each item: "prompt" (the question), "choices" (exactly 4 plausible options), "answer" (must equal one of the choices verbatim), and a brief "explanation".`;

    const system = `You are an expert tutor generating high-quality study materials. Output ONLY valid JSON: an object with a "title" string (<= 70 chars) and an "items" array. ${kindInstr}`;
    const userMsg = `Topic: ${data.topic}\nSubject: ${data.subject ?? "general"}\nDifficulty: ${data.difficulty}\nReturn JSON now.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMsg },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      if (res.status === 402) throw new Error("AI credits exhausted. Please try again later.");
      if (res.status === 429) throw new Error("AI is busy — please retry in a moment.");
      throw new Error(`AI error: ${txt.slice(0, 200)}`);
    }

    const payload = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    const content = payload.choices?.[0]?.message?.content ?? "{}";

    let parsed: { title?: string; items?: unknown };
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("AI returned invalid JSON. Please try again.");
    }

    const itemsArr = Array.isArray(parsed.items) ? parsed.items : [];
    const items = itemsArr
      .map((it) => {
        const r = QuestionSchema.safeParse(it);
        return r.success ? r.data : null;
      })
      .filter((x): x is z.infer<typeof QuestionSchema> => x !== null)
      .slice(0, data.count);

    if (items.length === 0) throw new Error("AI returned no usable questions. Try a more specific topic.");

    const title =
      typeof parsed.title === "string" && parsed.title.trim().length > 0
        ? parsed.title.slice(0, 70)
        : `${data.topic.slice(0, 60)}`;

    const timeLimit = data.kind === "exam" ? Math.max(10, items.length * 2) : null;

    const { data: inserted, error } = await supabase
      .from("study_sets")
      .insert({
        user_id: userId,
        kind: data.kind,
        title,
        subject: data.subject ?? null,
        source_material_id: data.source_material_id ?? null,
        questions: items,
        time_limit_minutes: timeLimit,
        ai_generated: true,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await supabase.from("ai_usage").insert({ user_id: userId, kind: data.kind });

    return { id: inserted.id, title, count: items.length };
  });
