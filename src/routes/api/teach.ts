import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { styleById } from "@/lib/teaching-styles";

type Body = {
  materialId?: unknown;
  styleId?: unknown;
  page?: unknown;
  previousSummary?: unknown;
};

export const Route = createFileRoute("/api/teach")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization") ?? "";
        if (!authHeader.toLowerCase().startsWith("bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }
        const apiKey = process.env.LOVABLE_API_KEY;
        const supaUrl = process.env.SUPABASE_URL;
        const supaKey = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!apiKey || !supaUrl || !supaKey) {
          return new Response("Server not configured", { status: 500 });
        }

        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return new Response("Bad JSON", { status: 400 });
        }
        const materialId = typeof body.materialId === "string" ? body.materialId : null;
        const styleIdRaw = typeof body.styleId === "string" ? body.styleId : null;
        if (!materialId) return new Response("materialId required", { status: 400 });
        const page =
          typeof body.page === "number" && body.page > 0 ? Math.min(20, Math.floor(body.page)) : 1;
        const previousSummary =
          typeof body.previousSummary === "string" ? body.previousSummary.slice(0, 4000) : "";

        const supabase = createClient<Database>(supaUrl, supaKey, {
          global: { headers: { Authorization: authHeader } },
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: u } = await supabase.auth.getUser();
        if (!u.user) return new Response("Unauthorized", { status: 401 });

        const { data: mat, error: matErr } = await supabase
          .from("materials")
          .select("storage_path, mime_type, file_name, title, subject")
          .eq("id", materialId)
          .maybeSingle();
        if (matErr || !mat) return new Response("Not found", { status: 404 });

        const { data: signed, error: sErr } = await supabase.storage
          .from("materials")
          .createSignedUrl(mat.storage_path, 120);
        if (sErr || !signed) return new Response("Cannot read file", { status: 500 });

        const fileRes = await fetch(signed.signedUrl);
        if (!fileRes.ok) return new Response("Could not download source", { status: 500 });
        const buf = new Uint8Array(await fileRes.arrayBuffer());
        let bin = "";
        const chunk = 0x8000;
        for (let i = 0; i < buf.length; i += chunk) {
          bin += String.fromCharCode.apply(null, Array.from(buf.subarray(i, i + chunk)));
        }
        const dataUrl = `data:${mat.mime_type || "application/pdf"};base64,${btoa(bin)}`;

        const style = styleById(styleIdRaw);
        const firstPageMsg = `Teach me everything I need to understand the attached material titled "${mat.title}"${mat.subject ? ` (${mat.subject})` : ""}. Treat me as a complete beginner.

This is **Page 1** of a multi-page lesson. Cover the foundational concepts a beginner needs first. Keep it focused (~500–800 words). End with a one-line teaser like "*Next up: …*" hinting at what page 2 will cover deeper. Do NOT try to fit everything into this page — leave room to go deeper on later pages. Follow the style and formatting rules in your instructions.`;

        const nextPageMsg = `Continue teaching the attached material titled "${mat.title}"${mat.subject ? ` (${mat.subject})` : ""}. This is **Page ${page}** of a progressive lesson.

Here is a compact summary of what has already been covered on earlier pages:
"""
${previousSummary || "(nothing yet)"}
"""

Now go DEEPER. Do not repeat what was already covered — build on it. Introduce the next layer of concepts, edge cases, worked examples, formulas, or nuances that a student should learn AFTER the previous page. Aim for ~500–800 words. End with a one-line teaser hinting at what page ${page + 1} will explore, unless the topic is fully exhausted (in which case end with "> **Lesson complete.**" instead).`;

        const userMsg = page === 1 ? firstPageMsg : nextPageMsg;

        // Log usage (fire-and-forget)
        void supabase.from("ai_usage").insert({ user_id: u.user.id, kind: "study" });

        const gwRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": apiKey,
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            stream: true,
            messages: [
              { role: "system", content: style.system },
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

        if (!gwRes.ok || !gwRes.body) {
          const text = await gwRes.text().catch(() => "");
          const status = gwRes.status === 402 ? 402 : gwRes.status === 429 ? 429 : 500;
          return new Response(text.slice(0, 500) || "Tutor unavailable", { status });
        }

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const reader = gwRes.body!.getReader();
            const decoder = new TextDecoder();
            const encoder = new TextEncoder();
            let buffer = "";
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed.startsWith("data:")) continue;
                  const payload = trimmed.slice(5).trim();
                  if (!payload || payload === "[DONE]") continue;
                  try {
                    const json = JSON.parse(payload) as {
                      choices?: { delta?: { content?: string } }[];
                    };
                    const delta = json.choices?.[0]?.delta?.content;
                    if (delta) controller.enqueue(encoder.encode(delta));
                  } catch {
                    /* ignore */
                  }
                }
              }
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});
