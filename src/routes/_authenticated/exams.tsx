import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { MaterialPicker, type PickerMaterial } from "@/components/MaterialPicker";
import { generateExamFromMaterial, getUsage } from "@/lib/exam.functions";
import { planFor } from "@/lib/plans";
import { GraduationCap, Loader2, Play, Sparkles, Timer, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/exams")({
  head: () => ({ meta: [{ title: "Exams — Spoude" }] }),
  component: ExamsPage,
});

type ExamRow = {
  id: string;
  title: string;
  subject: string | null;
  questions: unknown[];
  time_limit_minutes: number | null;
  created_at: string;
};

function ExamsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const generate = useServerFn(generateExamFromMaterial);
  const [material, setMaterial] = useState<PickerMaterial | null>(null);
  const [count, setCount] = useState(15);
  const [creating, setCreating] = useState(false);

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ["sets", "exam"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_sets")
        .select("id,title,subject,questions,time_limit_minutes,created_at")
        .eq("kind", "exam")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ExamRow[];
    },
  });

  const { data: usage } = useQuery({ queryKey: ["ai-usage"], queryFn: () => getUsage() });
  const plan = planFor(usage?.plan);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!material) return toast.error("Choose a document first");
    setCreating(true);
    try {
      const res = await generate({ data: { materialId: material.id, count } });
      toast.success(`Exam ready — ${res.count} questions · ${res.time_limit_minutes} min`);
      qc.invalidateQueries({ queryKey: ["sets", "exam"] });
      qc.invalidateQueries({ queryKey: ["ai-usage"] });
      navigate({ to: "/sets/$id", params: { id: res.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create exam");
    } finally {
      setCreating(false);
    }
  };

  const remove = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    const { error } = await supabase.from("study_sets").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["sets", "exam"] });
  };

  return (
    <div className="space-y-8 animate-fade-up">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" /> Take an exam
          </h1>
          <p className="mt-1 text-muted-foreground">
            Build a timed exam straight from a document in your library.
          </p>
        </div>
        {usage && (
          <div className="text-xs text-muted-foreground">
            <span className="text-foreground font-medium">{usage.used}</span> / {usage.limit} this
            month · {plan.name}
            <Link to="/billing" className="ml-2 text-primary hover:underline">
              Manage
            </Link>
          </div>
        )}
      </header>

      <form onSubmit={create} className="surface p-6 space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          New exam
        </h2>
        <MaterialPicker
          value={material?.id ?? null}
          onChange={(_id, m) => setMaterial(m)}
          emptyHint={
            <span>
              No documents yet.{" "}
              <Link to="/library" className="text-primary hover:underline">
                Upload one
              </Link>{" "}
              to start.
            </span>
          }
        />
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Number of questions
            </label>
            <input
              type="number"
              min={5}
              max={50}
              value={count}
              onChange={(e) => setCount(Math.max(5, Math.min(50, Number(e.target.value) || 0)))}
              className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 transition-all"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Time limit is chosen for you based on how many questions you pick.
            </p>
          </div>
          <button
            type="submit"
            disabled={!material || creating}
            className="ripple inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-3 text-sm font-semibold shadow-elev-1 hover:shadow-glow transition-all disabled:opacity-50"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {creating ? "Preparing…" : "Create exam"}
          </button>
        </div>
      </form>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Your exams
        </h2>
        {isLoading ? (
          <div className="surface p-10 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : exams.length === 0 ? (
          <div className="surface p-10 text-center text-sm text-muted-foreground">
            No exams yet — create one above.
          </div>
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((s) => (
              <li key={s.id} className="surface-interactive p-5 flex flex-col">
                <h3 className="font-semibold truncate">{s.title}</h3>
                {s.subject && <p className="text-xs text-muted-foreground mt-0.5">{s.subject}</p>}
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{(s.questions as unknown[]).length} questions</span>
                  {s.time_limit_minutes && (
                    <span className="inline-flex items-center gap-1">
                      <Timer className="h-3 w-3" /> {s.time_limit_minutes} min
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Link
                    to="/sets/$id"
                    params={{ id: s.id }}
                    className="ripple flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold hover:shadow-glow transition-all"
                  >
                    <Play className="h-3.5 w-3.5" /> Start
                  </Link>
                  <button
                    onClick={() => remove(s.id, s.title)}
                    className="ripple inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
