import { createServerFn } from "@tanstack/react-start";
import { requireFirebaseAuth } from "@/lib/firebase-auth-middleware";
import { z } from "zod";
import { PLANS, type PlanId } from "./plans";
import { adminDb } from "@/lib/firebase.server";
import { addUsageEvent } from "@/lib/firebase-data";

const Input = z.object({
  materialId: z.string().uuid(),
  count: z.number().int().min(5).max(50),
});

const QuestionSchema = z.object({
  prompt: z.string(),
  choices: z.array(z.string()).min(2).max(6),
  answer: z.string(),
  explanation: z.string().optional(),
});

function startOfMonthISO() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

export const generateExamFromMaterial = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const profileSnap = await adminDb.collection("profiles").doc(userId).get();
    const profile = profileSnap.data();
    const planId: PlanId = (profile?.plan as PlanId) in PLANS ? (profile?.plan as PlanId) : "free";
    const plan = PLANS[planId];
    if (data.count > plan.maxQuestionsPerSet) {
      throw new Error(
        `Your ${plan.name} plan caps exams at ${plan.maxQuestionsPerSet} questions. Upgrade in Billing.`,
      );
    }

    const usageSnap = await adminDb
      .collection("ai_usage")
      .where("user_id", "==", userId)
      .get();
    const used = usageSnap.docs.filter((doc) => {
      const createdAt = doc.data().created_at as string | undefined;
      return createdAt && createdAt >= startOfMonthISO();
    }).length;
    if (used >= plan.aiPerMonth) {
      throw new Error(
        `You've used all ${plan.aiPerMonth} lessons & exams on the ${plan.name} plan this month.`,
      );
    }

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Tutor is not configured");

    const materialSnap = await adminDb.collection("materials").doc(data.materialId).get();
    const mat = materialSnap.data();
    if (!materialSnap.exists || !mat) throw new Error("Material not found");

    const storagePath = mat.storage_path as string;
    const fileRes = await fetch(
      `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_PROJECT_ID || "spoude"}.firebasestorage.app/o/${encodeURIComponent(storagePath)}?alt=media`,
    );
    if (!fileRes.ok) throw new Error("Could not download source");
    const buf = new Uint8Array(await fileRes.arrayBuffer());
    let bin = "";
    const chunk = 0x8000;
    for (let i = 0; i < buf.length; i += chunk) {
      bin += String.fromCharCode.apply(null, Array.from(buf.subarray(i, i + chunk)));
    }
    const dataUrl = `data:${mat.mime_type || "application/pdf"};base64,${btoa(bin)}`;

    const system = `You are an expert exam writer creating a fair, well-graded exam strictly based on the attached document. Output ONLY valid JSON with this exact shape:
{
  "title": "string (<= 70 chars)",
  "time_limit_minutes": number (an integer you choose based on difficulty and number of questions; typically 1–2.5 minutes per question),
  "items": [ { "prompt": "string", "choices": ["A","B","C","D"], "answer": "exact text of one choice", "explanation": "short" } ]
}
Make exactly ${data.count} multiple-choice questions. All facts must come from the document. Vary difficulty. Each question must have 4 plausible choices and one correct answer that matches one of the choices verbatim.`;

    const userMsg = `Create a ${data.count}-question exam from the attached material "${mat.title}"${mat.subject ? ` (${mat.subject})` : ""}. Pick a fair time limit yourself.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: [
              { type: "text", text: userMsg },
              { type: "file", file: { filename: mat.file_name, file_data: dataUrl } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      if (res.status === 402) throw new Error("Credits exhausted. Try again later.");
      if (res.status === 429) throw new Error("Tutor busy — try again in a moment.");
      throw new Error(`Exam generation failed: ${t.slice(0, 200)}`);
    }
    const payload = (await res.json()) as { choices: { message: { content: string } }[] };
    const content = payload.choices?.[0]?.message?.content ?? "{}";

    let parsed: { title?: string; time_limit_minutes?: number; items?: unknown };
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("Exam returned invalid JSON");
    }
    const items = (Array.isArray(parsed.items) ? parsed.items : [])
      .map((it) => QuestionSchema.safeParse(it))
      .filter((r): r is { success: true; data: z.infer<typeof QuestionSchema> } => r.success)
      .map((r) => r.data)
      .slice(0, data.count);
    if (items.length === 0) throw new Error("Couldn't extract questions from this material.");

    const title =
      (typeof parsed.title === "string" && parsed.title.trim()) || mat.title.slice(0, 60);
    const timeLimit = Math.max(
      5,
      Math.min(180, Math.round(parsed.time_limit_minutes ?? items.length * 1.5)),
    );

    const insertedRef = await adminDb.collection("study_sets").add({
      user_id: userId,
      kind: "exam",
      title,
      subject: mat.subject ?? null,
      source_material_id: data.materialId,
      questions: items,
      time_limit_minutes: timeLimit,
      ai_generated: true,
      created_at: new Date().toISOString(),
    });

    await addUsageEvent(userId, "exam");
    return { id: insertedRef.id, title, count: items.length, time_limit_minutes: timeLimit };
  });

export const getUsage = createServerFn({ method: "GET" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const profileSnap = await adminDb.collection("profiles").doc(userId).get();
    const profile = profileSnap.data();
    const planId: PlanId = (profile?.plan as PlanId) in PLANS ? (profile?.plan as PlanId) : "free";
    const usageSnap = await adminDb.collection("ai_usage").where("user_id", "==", userId).get();
    const used = usageSnap.docs.filter((doc) => {
      const createdAt = doc.data().created_at as string | undefined;
      return createdAt && createdAt >= startOfMonthISO();
    }).length;
    const limit = PLANS[planId].aiPerMonth;
    return { plan: planId, used, limit, remaining: Math.max(0, limit - used) };
  });
