import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { auth } from "@/lib/firebase";
import { getStudySet, addAttempt } from "@/lib/firestore-db";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  Loader2,
  RotateCcw,
  Sparkles,
  Timer,
  Trophy,
  X,
  Play,
  Maximize2,
  Minimize2,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/sets/$id")({
  head: () => ({ meta: [{ title: "Spoude" }] }),
  component: SetPlayPage,
});

type Question = { prompt: string; choices?: string[]; answer: string; explanation?: string };
type SetRow = {
  id: string;
  kind: "study" | "test" | "exam";
  title: string;
  subject: string | null;
  questions: Question[];
  time_limit_minutes: number | null;
  ai_generated: boolean;
};

function SetPlayPage() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["set", id],
    queryFn: async () => {
      const data = await getStudySet(id);
      if (!data) throw new Error("Not found");
      return data as unknown as SetRow;
    },
  });

  if (isLoading)
    return (
      <div className="surface p-12 flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  if (error || !data)
    return (
      <div className="surface p-10 text-center text-sm text-muted-foreground">
        Couldn't load this set.{" "}
        <Link to="/spoude" className="text-primary hover:underline">
          Go back
        </Link>
      </div>
    );

  if (data.kind === "study") return <FlashcardPlayer set={data} />;
  if (data.kind === "exam") return <ExamShell set={data} />;
  return <QuizPlayer set={data} />;
}

function ExamShell({ set }: { set: SetRow }) {
  const [started, setStarted] = useState(false);
  const [isFs, setIsFs] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const enterFs = async () => {
    const el = containerRef.current;
    if (el?.requestFullscreen) {
      try {
        await el.requestFullscreen();
      } catch {
        /* ignored */
      }
    }
  };
  const exitFs = async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        /* ignored */
      }
    }
  };

  const start = async () => {
    setStarted(true);
    await enterFs();
  };

  if (!started) {
    const mins = set.time_limit_minutes ?? 0;
    return (
      <div className="max-w-2xl mx-auto animate-fade-up">
        <BackTo kind={set.kind} />
        <div className="surface mt-6 overflow-hidden">
          <div className="bg-primary-soft p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-elev-1">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-primary font-semibold">
                  Exam
                </div>
                <h1 className="text-2xl font-bold tracking-tight leading-tight">{set.title}</h1>
                {set.subject && (
                  <p className="text-sm text-muted-foreground mt-0.5">{set.subject}</p>
                )}
              </div>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Questions
                </div>
                <div className="mt-1 text-2xl font-bold">{set.questions.length}</div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Time limit
                </div>
                <div className="mt-1 text-2xl font-bold flex items-center gap-1.5">
                  <Timer className="h-5 w-5 text-primary" /> {mins} min
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-foreground/80 space-y-1.5">
                <p className="font-medium">Before you start:</p>
                <ul className="text-xs list-disc pl-4 space-y-0.5 text-muted-foreground">
                  <li>
                    The exam will open in fullscreen. Stay focused — leaving fullscreen won't
                    submit, but it breaks concentration.
                  </li>
                  <li>The timer auto-submits your exam when it runs out.</li>
                  <li>You can navigate freely between questions with the palette on the right.</li>
                </ul>
              </div>
            </div>
            <button
              onClick={start}
              className="ripple w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-3.5 text-sm font-semibold shadow-elev-1 hover:shadow-glow transition-all"
            >
              <Play className="h-4 w-4" /> Start exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`bg-background ${isFs ? "fixed inset-0 z-50 overflow-y-auto" : ""}`}
    >
      <div className={`${isFs ? "min-h-screen py-8 px-4 sm:px-8" : ""}`}>
        <div className="max-w-3xl mx-auto flex items-center justify-end mb-3">
          <button
            onClick={isFs ? exitFs : enterFs}
            className="ripple inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-primary/40 transition-colors"
            aria-label={isFs ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFs ? (
              <>
                <Minimize2 className="h-3.5 w-3.5" /> Exit fullscreen
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" /> Fullscreen
              </>
            )}
          </button>
        </div>
        <QuizPlayer set={set} onExit={exitFs} />
      </div>
    </div>
  );
}

function BackTo({ kind }: { kind: SetRow["kind"] }) {
  const to = kind === "study" ? "/study" : kind === "test" ? "/exams" : "/exams";
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <ChevronLeft className="h-4 w-4" /> Back
    </Link>
  );
}

function FlashcardPlayer({ set }: { set: SetRow }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const q = set.questions[i];
  const total = set.questions.length;

  const next = () => {
    setFlipped(false);
    setI((x) => Math.min(total - 1, x + 1));
  };
  const prev = () => {
    setFlipped(false);
    setI((x) => Math.max(0, x - 1));
  };

  return (
    <div className="space-y-6 animate-fade-up max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <BackTo kind={set.kind} />
        <span className="text-xs text-muted-foreground">
          {i + 1} / {total}
        </span>
      </div>
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{set.title}</h1>
        {set.subject && <p className="text-sm text-muted-foreground mt-0.5">{set.subject}</p>}
      </header>
      <button
        onClick={() => setFlipped((f) => !f)}
        className="surface-interactive w-full min-h-[260px] p-8 flex items-center justify-center text-center text-lg leading-relaxed font-medium"
      >
        <div>
          <div className="text-[10px] uppercase tracking-widest text-primary font-semibold mb-3">
            {flipped ? "Answer" : "Prompt"}
          </div>
          <div>{flipped ? q.answer : q.prompt}</div>
          {!flipped && <div className="mt-4 text-xs text-muted-foreground">Tap to flip</div>}
        </div>
      </button>
      <div className="flex items-center justify-between">
        <button
          onClick={prev}
          disabled={i === 0}
          className="ripple inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium disabled:opacity-40 hover:border-primary/40 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Prev
        </button>
        {i === total - 1 ? (
          <button
            onClick={() => {
              setI(0);
              setFlipped(false);
            }}
            className="ripple inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:shadow-glow transition-all"
          >
            <RotateCcw className="h-4 w-4" /> Start over
          </button>
        ) : (
          <button
            onClick={next}
            className="ripple inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:shadow-glow transition-all"
          >
            Next <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function QuizPlayer({ set, onExit }: { set: SetRow; onExit?: () => void }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [answers, setAnswers] = useState<(string | null)[]>(() => set.questions.map(() => null));
  const [i, setI] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const total = set.questions.length;
  const timed = set.kind === "exam" && set.time_limit_minutes;
  const [secondsLeft, setSecondsLeft] = useState(() =>
    timed ? (set.time_limit_minutes as number) * 60 : 0,
  );

  useEffect(() => {
    if (!timed || submitted) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          finalize();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timed, submitted]);

  const score = useMemo(
    () =>
      answers.reduce(
        (acc, a, idx) => acc + (a !== null && a === set.questions[idx].answer ? 1 : 0),
        0,
      ),
    [answers, set.questions],
  );

  async function finalize() {
    if (submitted) return;
    setSubmitted(true);
    const u = auth.currentUser;
    if (u) {
      await addAttempt({
        user_id: u.uid,
        set_id: set.id,
        score,
        total,
        duration_seconds: Math.round((Date.now() - startedAt) / 1000),
        answers,
      });
      qc.invalidateQueries({ queryKey: ["attempts"] });
    }
    if (onExit) await onExit();
  }

  if (submitted) {
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    return (
      <div className="space-y-6 animate-fade-up max-w-2xl mx-auto">
        <BackTo kind={set.kind} />
        <div className="surface p-8 text-center">
          <div className="h-14 w-14 mx-auto rounded-full bg-primary-soft flex items-center justify-center">
            <Trophy className="h-7 w-7 text-primary" />
          </div>
          <h2 className="mt-4 text-2xl font-bold">You scored {pct}%</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {score} correct out of {total}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setAnswers(set.questions.map(() => null));
                setI(0);
                setSubmitted(false);
              }}
              className="ripple inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary/40 transition-colors"
            >
              <RotateCcw className="h-4 w-4" /> Try again
            </button>
            <button
              onClick={() => navigate({ to: set.kind === "test" ? "/exams" : "/exams" })}
              className="ripple inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:shadow-glow transition-all"
            >
              Done
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {set.questions.map((q, idx) => {
            const correct = answers[idx] === q.answer;
            return (
              <div key={idx} className="surface p-5">
                <div className="flex items-start gap-2">
                  {correct ? (
                    <Check className="h-4 w-4 text-primary mt-1 shrink-0" />
                  ) : (
                    <X className="h-4 w-4 text-destructive mt-1 shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium">{q.prompt}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Your answer: <span className="text-foreground">{answers[idx] ?? "—"}</span>
                    </div>
                    {!correct && (
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        Correct: <span className="text-foreground">{q.answer}</span>
                      </div>
                    )}
                    {q.explanation && (
                      <div className="mt-2 text-xs text-muted-foreground italic">
                        {q.explanation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const q = set.questions[i];
  const selected = answers[i];

  return (
    <div className="space-y-6 animate-fade-up max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <BackTo kind={set.kind} />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {timed && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary-soft text-foreground font-mono">
              <Timer className="h-3.5 w-3.5" />
              {Math.floor(secondsLeft / 60)
                .toString()
                .padStart(2, "0")}
              :{(secondsLeft % 60).toString().padStart(2, "0")}
            </span>
          )}
          <span>
            {i + 1} / {total}
          </span>
        </div>
      </div>
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{set.title}</h1>
        {set.subject && <p className="text-sm text-muted-foreground mt-0.5">{set.subject}</p>}
      </header>

      <div className="surface p-6 space-y-4">
        <div className="text-[10px] uppercase tracking-widest text-primary font-semibold inline-flex items-center gap-1">
          {set.ai_generated && <Sparkles className="h-3 w-3" />} Question {i + 1}
        </div>
        <p className="text-lg font-medium leading-snug">{q.prompt}</p>
        <div className="grid gap-2">
          {(q.choices ?? []).map((c) => {
            const active = selected === c;
            return (
              <button
                key={c}
                onClick={() => setAnswers((xs) => xs.map((v, idx) => (idx === i ? c : v)))}
                className={`text-left rounded-lg border px-4 py-3 text-sm transition-all ${
                  active
                    ? "border-primary bg-primary-soft shadow-elev-1"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setI((x) => Math.max(0, x - 1))}
          disabled={i === 0}
          className="ripple inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium disabled:opacity-40 hover:border-primary/40 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Prev
        </button>
        {i === total - 1 ? (
          <button
            onClick={() => {
              if (answers.some((a) => a === null) && !confirm("Submit with unanswered questions?"))
                return;
              finalize().catch((e) => toast.error(e instanceof Error ? e.message : "Failed"));
            }}
            className="ripple inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:shadow-glow transition-all"
          >
            Submit
          </button>
        ) : (
          <button
            onClick={() => setI((x) => Math.min(total - 1, x + 1))}
            className="ripple inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:shadow-glow transition-all"
          >
            Next <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
