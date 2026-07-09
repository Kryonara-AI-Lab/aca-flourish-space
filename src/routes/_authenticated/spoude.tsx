import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import {
  BookOpenCheck,
  GraduationCap,
  FolderOpen,
  Sparkles,
  Timer,
  Flame,
  Brain,
  Volume2,
  Wand2,
  Layers,
  ArrowRight,
  Zap,
  TrendingUp,
  FileText,
  BookOpen,
  ListChecks,
  Trophy,
  Upload as UploadIcon,
} from "lucide-react";
import { getUsage } from "@/lib/exam.functions";
import { planFor } from "@/lib/plans";
import { MetricSkeleton, ActivityRowSkeleton, EmptyState, Skel } from "@/components/Skeletons";
import { getCurrentFirebaseUser } from "@/lib/firebase-data";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";

export const Route = createFileRoute("/_authenticated/spoude")({
  head: () => ({ meta: [{ title: "Home — Spoude" }] }),
  component: HomePage,
});

type Tile = {
  to?: "/study" | "/exams" | "/library" | "/billing";
  label: string;
  desc: string;
  icon: typeof BookOpenCheck;
  accent?: "primary" | "gold" | "violet" | "emerald" | "rose";
  soon?: boolean;
};

const PRIMARY: Tile[] = [
  {
    to: "/study",
    label: "Study mode",
    desc: "AI lessons, flashcards & deep dives.",
    icon: BookOpenCheck,
    accent: "primary",
  },
  {
    to: "/exams",
    label: "Take an exam",
    desc: "Timed practice with instant grading.",
    icon: GraduationCap,
    accent: "violet",
  },
  {
    to: "/library",
    label: "Library",
    desc: "Upload notes, homework & past papers.",
    icon: FolderOpen,
    accent: "emerald",
  },
  {
    to: "/billing",
    label: "Plan & credits",
    desc: "Manage your AI credits and Pro plan.",
    icon: Zap,
    accent: "gold",
  },
];

const LEARN_MORE: Tile[] = [
  {
    to: "/study",
    label: "AI tutor chat",
    desc: "Ask anything, get taught step-by-step.",
    icon: Sparkles,
    accent: "primary",
  },
  {
    to: "/study",
    label: "Flashcard decks",
    desc: "Auto-generated from your material.",
    icon: Layers,
    accent: "violet",
  },
  {
    to: "/study",
    label: "Read aloud",
    desc: "Listen to lessons hands-free.",
    icon: Volume2,
    accent: "emerald",
  },
  {
    label: "Focus timer",
    desc: "Pomodoro sessions that award honor.",
    icon: Timer,
    soon: true,
    accent: "rose",
  },
  {
    label: "Daily challenge",
    desc: "One curated question every day.",
    icon: Flame,
    soon: true,
    accent: "gold",
  },
  {
    label: "Concept explainer",
    desc: "Break any topic into simple parts.",
    icon: Brain,
    soon: true,
    accent: "primary",
  },
];

const TYPE_META = {
  notes: { label: "Notes", icon: BookOpen },
  homework: { label: "Homework", icon: FileText },
  exam: { label: "Past exams", icon: GraduationCap },
} as const;

function HomePage() {
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => getCurrentFirebaseUser(),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["materials-stats"],
    queryFn: async () => {
      const user = await getCurrentFirebaseUser();
      if (!user) return { counts: { notes: 0, homework: 0, exam: 0 }, recent: [] };
      const q = query(collection(db, "materials"), where("user_id", "==", user.uid), orderBy("created_at", "desc"));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));
      const counts = { notes: 0, homework: 0, exam: 0 };
      data.forEach((m) => {
        const type = (m.type as keyof typeof counts | undefined) ?? "notes";
        if (type in counts) counts[type] += 1;
      });
      return { counts, recent: data.slice(0, 5) };
    },
  });

  const { data: setsStats, isLoading: setsLoading } = useQuery({
    queryKey: ["sets-stats"],
    queryFn: async () => {
      const user = await getCurrentFirebaseUser();
      if (!user) return { counts: { study: 0, test: 0, exam: 0 }, recent: [] };
      const q = query(collection(db, "study_sets"), where("user_id", "==", user.uid), orderBy("created_at", "desc"));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));
      const counts = { study: 0, test: 0, exam: 0 };
      data.forEach((s) => {
        const kind = (s.kind as keyof typeof counts | undefined) ?? "study";
        if (kind in counts) counts[kind] += 1;
      });
      return { counts, recent: data.slice(0, 4) };
    },
  });

  const { data: attempts, isLoading: attemptsLoading } = useQuery({
    queryKey: ["attempts"],
    queryFn: async () => {
      const user = await getCurrentFirebaseUser();
      if (!user) return [];
      const q = query(collection(db, "attempts"), where("user_id", "==", user.uid), orderBy("completed_at", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Record<string, unknown>),
      })) as Array<Record<string, unknown> & { id: string; score?: number; total?: number }>;
    },
  });

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ["ai-usage"],
    queryFn: () => getUsage(),
  });
  const plan = planFor(usage?.plan);

  const name = user?.displayName?.trim() || user?.email?.split("@")[0] || "there";

  const avgScore =
    attempts && attempts.length > 0
      ? Math.round(
          (attempts.reduce((a, b) => {
            const total = typeof b.total === "number" ? b.total : 0;
            const score = typeof b.score === "number" ? b.score : 0;
            return a + (total > 0 ? score / total : 0);
          }, 0) / attempts.length) *
            100,
        )
      : null;

  const materials = stats ? stats.counts.notes + stats.counts.homework + stats.counts.exam : null;
  const setCount = setsStats
    ? setsStats.counts.study + setsStats.counts.test + setsStats.counts.exam
    : null;
  const activityLoading = statsLoading || setsLoading;
  const activityEmpty =
    !activityLoading && (stats?.recent ?? []).length + (setsStats?.recent ?? []).length === 0;

  return (
    <div className="space-y-10 animate-fade-up">
      {/* Hero */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Welcome back
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Hi,{" "}
            <span className="text-gradient-warm">
              {user ? name : <Skel className="h-8 w-32 inline-block align-middle" />}
            </span>
            .
          </h1>
          <p className="text-[13px] text-muted-foreground max-w-md">
            Pick how you want to learn today.
          </p>
        </div>
        <Link
          to="/library"
          className="ripple inline-flex items-center gap-2 self-start bg-primary text-primary-foreground rounded-full px-4 py-2 text-[13px] font-medium shadow-elev-1 hover:shadow-glow transition-all"
        >
          <UploadIcon className="h-4 w-4" strokeWidth={1.5} /> Upload file
        </Link>
      </header>

      {/* Progress strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
        {statsLoading ? (
          <MetricSkeleton />
        ) : (
          <Metric
            label="Materials"
            value={materials ?? 0}
            hint="files"
            to="/library"
            icon={FileText}
          />
        )}
        {setsLoading ? (
          <MetricSkeleton />
        ) : (
          <Metric
            label="Study sets"
            value={setCount ?? 0}
            hint="decks & tests"
            to="/study"
            icon={BookOpenCheck}
          />
        )}
        {attemptsLoading ? (
          <MetricSkeleton />
        ) : (
          <Metric
            label="Avg. score"
            value={avgScore !== null ? `${avgScore}%` : "—"}
            hint={`${attempts?.length ?? 0} recent`}
            to="/exams"
            icon={TrendingUp}
          />
        )}
        {usageLoading ? (
          <MetricSkeleton />
        ) : (
          <Metric
            label="AI used"
            value={usage ? `${usage.used}` : "—"}
            hint={`of ${usage?.limit ?? "—"} · ${plan.name}`}
            to="/billing"
            icon={Zap}
          />
        )}
      </section>

      {/* Primary tiles */}
      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Jump in
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
          {PRIMARY.map((t) => (
            <TileCard key={t.label} tile={t} big />
          ))}
        </div>
      </section>

      {/* Recent activity */}
      <section className="glass p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Recent activity
          </h2>
          <Link to="/library" className="text-[11px] text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="divide-y divide-border/60 -mx-1">
          {activityLoading ? (
            <>
              <ActivityRowSkeleton />
              <ActivityRowSkeleton />
              <ActivityRowSkeleton />
            </>
          ) : activityEmpty ? (
            <EmptyState
              icon={UploadIcon}
              title="Nothing here yet"
              description="Upload your first file or spin up a study set — we'll organize it for you."
              action={
                <div className="flex items-center gap-2">
                  <Link
                    to="/library"
                    className="ripple inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3.5 py-1.5 text-[11.5px] font-semibold shadow-elev-1 hover:shadow-glow transition-all"
                  >
                    <UploadIcon className="h-3.5 w-3.5" /> Upload file
                  </Link>
                  <Link
                    to="/study"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-[11.5px] font-medium hover:border-primary/40 transition-colors"
                  >
                    New study set
                  </Link>
                </div>
              }
            />
          ) : (
            <>
              {(setsStats?.recent ?? []).slice(0, 3).map((s) => {
                const kind = s.kind ?? "study";
                return (
                  <ActivityRow
                    key={`set-${s.id}`}
                    icon={
                      kind === "study"
                        ? BookOpenCheck
                        : kind === "test"
                          ? ListChecks
                          : GraduationCap
                    }
                    title={s.title ?? "Untitled set"}
                    sub={`${kind === "study" ? "Study set" : kind === "test" ? "Test" : "Exam"} · ${new Date(s.created_at ?? new Date().toISOString()).toLocaleDateString()}`}
                    href={{ kind: "set", id: s.id }}
                  />
                );
              })}
              {(stats?.recent ?? []).slice(0, 3).map((m) => {
                const type = (m.type as keyof typeof TYPE_META | undefined) ?? "notes";
                const Icon = TYPE_META[type]?.icon ?? BookOpen;
                return (
                  <ActivityRow
                    key={`mat-${m.id}`}
                    icon={Icon}
                    title={m.title ?? "Untitled material"}
                    sub={`${TYPE_META[type]?.label ?? "Note"} · ${new Date(m.created_at ?? new Date().toISOString()).toLocaleDateString()}`}
                    href={{ kind: "material", type: type as "notes" | "homework" | "exam" }}
                  />
                );
              })}
            </>
          )}
        </div>
      </section>

      {/* More ways */}
      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          More ways to learn
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger">
          {LEARN_MORE.map((t) => (
            <TileCard key={t.label} tile={t} />
          ))}
        </div>
      </section>

      {/* Tip */}
      <section className="glass p-5 sm:p-6 border-dashed">
        <div className="flex items-center gap-2 text-primary">
          <Wand2 className="h-4 w-4" />
          <span className="text-[11px] font-semibold uppercase tracking-widest">Tip</span>
        </div>
        <h3 className="mt-2 font-semibold">Upload a file, get a full study kit</h3>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Drop a PDF into your library and Spoude will build lessons, flashcards, and exams from it.
        </p>
        <Link
          to="/library"
          className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:underline"
        >
          Open library <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>
    </div>
  );
}

const ACCENT: Record<NonNullable<Tile["accent"]>, string> = {
  primary: "bg-primary/12 text-primary",
  gold: "bg-amber-400/15 text-amber-500 dark:text-amber-300",
  violet: "bg-violet-500/15 text-violet-500 dark:text-violet-300",
  emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  rose: "bg-rose-500/15 text-rose-500 dark:text-rose-300",
};

function TileCard({ tile, big = false }: { tile: Tile; big?: boolean }) {
  const Icon = tile.icon;
  const accent = ACCENT[tile.accent ?? "primary"];
  const body = (
    <>
      <div className="flex items-center justify-between">
        <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${accent}`}>
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </div>
        {tile.soon ? (
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground border border-border rounded-full px-2 py-0.5">
            Soon
          </span>
        ) : (
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <h3 className={`mt-4 font-semibold ${big ? "text-[14px]" : "text-[13px]"}`}>{tile.label}</h3>
      <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">{tile.desc}</p>
    </>
  );
  const cls = `surface-interactive p-4 sm:p-5 block group ${tile.soon ? "opacity-70 cursor-not-allowed" : ""}`;
  if (!tile.to || tile.soon) return <div className={cls}>{body}</div>;
  return (
    <Link to={tile.to} className={cls}>
      {body}
    </Link>
  );
}

function Metric({
  label,
  value,
  hint,
  to,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  to: "/library" | "/study" | "/exams" | "/billing";
  icon: typeof BookOpenCheck;
}) {
  return (
    <Link to={to} className="surface-interactive p-4 block group">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{hint}</div>
    </Link>
  );
}

function ActivityRow({
  icon: Icon,
  title,
  sub,
  href,
}: {
  icon: typeof BookOpen;
  title: string;
  sub: string;
  href: { kind: "set"; id: string } | { kind: "material"; type: "notes" | "homework" | "exam" };
}) {
  const cls =
    "flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-sidebar-accent/60 transition-colors";
  const inner = (
    <>
      <div className="h-8 w-8 rounded-xl bg-primary/12 text-primary flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium truncate">{title}</div>
        <div className="text-[11px] text-muted-foreground">{sub}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </>
  );
  if (href.kind === "set") {
    return (
      <Link to="/sets/$id" params={{ id: href.id }} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <Link to="/library" search={{ type: href.type }} className={cls}>
      {inner}
    </Link>
  );
}

// Trophy import used above for icons in future extensions; keep tree-shakable.
void Trophy;
