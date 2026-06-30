import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MaterialPicker, type PickerMaterial } from "@/components/MaterialPicker";
import { TEACHING_STYLES, styleById } from "@/lib/teaching-styles";
import { Markdown } from "@/components/Markdown";
import { SpeakButton } from "@/components/SpeakButton";
import { getUsage } from "@/lib/exam.functions";
import { planFor } from "@/lib/plans";
import { BookOpenCheck, Sparkles, Loader2, ArrowLeft, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/study")({
  head: () => ({ meta: [{ title: "Study — Lumio" }] }),
  component: StudyPage,
});

type Stage = "pick" | "lesson";

function StudyPage() {
  const [stage, setStage] = useState<Stage>("pick");
  const [material, setMaterial] = useState<PickerMaterial | null>(null);
  const [styleId, setStyleId] = useState<string>(TEACHING_STYLES[0].id);
  const [text, setText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { data: usage } = useQuery({ queryKey: ["ai-usage"], queryFn: () => getUsage() });

  useEffect(() => () => abortRef.current?.abort(), []);

  const start = async () => {
    if (!material) return toast.error("Pick a document first");
    setStage("lesson");
    setText("");
    setError(null);
    setStreaming(true);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Not signed in");
      const res = await fetch("/api/teach", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ materialId: material.id, styleId }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `Failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) setText((t) => t + chunk);
      }
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Lesson failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setStreaming(false);
    }
  };

  const restart = () => {
    abortRef.current?.abort();
    setStage("pick");
    setText("");
    setError(null);
  };

  if (stage === "lesson" && material) {
    const style = styleById(styleId);
    return (
      <div className="space-y-6 animate-fade-up max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <button onClick={restart} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <SpeakButton text={text} disabled={!text} />
            <button onClick={start} disabled={streaming} className="ripple inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-primary/40 transition-colors disabled:opacity-50">
              <RotateCcw className="h-3.5 w-3.5" /> New lesson
            </button>
          </div>
        </div>
        <header className="surface p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="text-base">{style.emoji}</span>
            <span className="font-medium text-foreground">{style.label}</span>
            <span>·</span>
            <span className="truncate">{material.title}</span>
          </div>
        </header>

        {error ? (
          <div className="surface p-6 text-sm text-destructive">{error}</div>
        ) : (
          <article className="surface p-6 sm:p-8 min-h-[300px]">
            {text ? (
              <Markdown>{text}</Markdown>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Reading your document and preparing the lesson…
              </div>
            )}
            {streaming && text && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" /> writing…
              </div>
            )}
          </article>
        )}
      </div>
    );
  }

  const plan = planFor(usage?.plan);
  return (
    <div className="space-y-8 animate-fade-up max-w-4xl">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookOpenCheck className="h-7 w-7 text-primary" /> Study
          </h1>
          <p className="mt-1 text-muted-foreground">Pick a document and a teaching style. Your tutor will read it and teach you.</p>
        </div>
        {usage && (
          <div className="text-xs text-muted-foreground">
            <span className="text-foreground font-medium">{usage.used}</span> / {usage.limit} lessons & exams this month · {plan.name}
            <Link to="/billing" className="ml-2 text-primary hover:underline">Manage</Link>
          </div>
        )}
      </header>

      <section className="surface p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">1. Choose a document</h2>
        <MaterialPicker
          value={material?.id ?? null}
          onChange={(_id, m) => setMaterial(m)}
          emptyHint={<span>Your library is empty. <Link to="/library" className="text-primary hover:underline">Upload one</Link> to begin.</span>}
        />
      </section>

      <section className="surface p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">2. Pick a teaching style</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {TEACHING_STYLES.map((s) => {
            const active = styleId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStyleId(s.id)}
                className={`text-left rounded-lg border p-3 transition-all ripple ${active ? "border-primary bg-primary-soft shadow-elev-1" : "border-border bg-card hover:border-primary/40"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg leading-none">{s.emoji}</span>
                  <span className="text-sm font-semibold">{s.label}</span>
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{s.blurb}</div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex items-center justify-end">
        <button
          onClick={start}
          disabled={!material}
          className="ripple inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-3 text-sm font-semibold shadow-elev-1 hover:shadow-glow transition-all disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" /> Start lesson
        </button>
      </div>
    </div>
  );
}
