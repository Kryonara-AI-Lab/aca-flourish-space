import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  BookOpen,
  FileText,
  GraduationCap,
  Upload as UploadIcon,
  Sparkles,
  ArrowRight,
  BookOpenCheck,
  ListChecks,
  Zap,
  TrendingUp,
  CreditCard,
} from "lucide-react";
import { getAiUsage } from "@/lib/sets.functions";
import { planFor } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Lumio" }] }),
  component: Dashboard,
});

const TYPE_META = {
  notes: { label: "Notes", icon: BookOpen },
  homework: { label: "Homework", icon: FileText },
  exam: { label: "Past exams", icon: GraduationCap },
} as const;

function Dashboard() {
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });

  const { data: stats } = useQuery({
    queryKey: ["materials-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("materials").select("type, created_at, title, id").order("created_at", { ascending: false });
      if (error) throw error;
      const counts = { notes: 0, homework: 0, exam: 0 };
      data.forEach((m) => { counts[m.type as keyof typeof counts] += 1; });
      return { counts, recent: data.slice(0, 5) };
    },
  });

  const { data: setsStats } = useQuery({
    queryKey: ["sets-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_sets")
        .select("id,kind,title,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const counts = { study: 0, test: 0, exam: 0 };
      data.forEach((s) => { counts[s.kind as keyof typeof counts] += 1; });
      return { counts, recent: data.slice(0, 4) };
    },
  });

  const { data: attempts } = useQuery({
    queryKey: ["attempts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attempts")
        .select("score,total,completed_at")
        .order("completed_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: usage } = useQuery({ queryKey: ["ai-usage"], queryFn: () => getAiUsage() });
  const plan = planFor(usage?.plan);

  const avgScore =
    attempts && attempts.length > 0
      ? Math.round(
          (attempts.reduce((a, b) => a + (b.total ? b.score / b.total : 0), 0) / attempts.length) * 100,
        )
      : null;

  const name = (user?.user_metadata?.display_name as string | undefined) || (user?.email?.split("@")[0] ?? "there");
  const pct = usage && usage.limit > 0 ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0;

  return (
    <div className="space-y-8 animate-fade-up">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-1">
            Hi, <span className="text-gradient-warm">{name}</span>.
          </h1>
        </div>
        <Link
          to="/upload"
          className="ripple inline-flex items-center gap-2 self-start bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-semibold shadow-elev-1 hover:shadow-glow transition-all"
        >
          <UploadIcon className="h-4 w-4" /> Upload file
        </Link>
      </header>

      {/* Top metrics */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Materials"
          value={
            stats
              ? stats.counts.notes + stats.counts.homework + stats.counts.exam
              : "—"
          }
          hint="files in library"
          to="/library"
          icon={FileText}
        />
        <MetricCard
          label="Study sets"
          value={setsStats ? setsStats.counts.study + setsStats.counts.test + setsStats.counts.exam : "—"}
          hint="decks, tests, exams"
          to="/study"
          icon={BookOpenCheck}
        />
        <MetricCard
          label="Avg. score"
          value={avgScore !== null ? `${avgScore}%` : "—"}
          hint={`${attempts?.length ?? 0} recent attempts`}
          to="/tests"
          icon={TrendingUp}
        />
        <MetricCard
          label="AI used"
          value={usage ? `${usage.used}` : "—"}
          hint={`of ${usage?.limit ?? "—"} on ${plan.name}`}
          to="/billing"
          icon={Zap}
        />
      </section>

      {/* Quick actions */}
      <section className="grid md:grid-cols-3 gap-4">
        <ActionCard
          to="/study"
          icon={BookOpenCheck}
          title="Study with flashcards"
          desc="Memorize key concepts fast — AI-generated or your own."
        />
        <ActionCard
          to="/tests"
          icon={ListChecks}
          title="Take a quick test"
          desc="Multiple-choice quizzes from any topic in seconds."
        />
        <ActionCard
          to="/exams"
          icon={GraduationCap}
          title="Sit a timed exam"
          desc="Full-length practice exams with instant grading."
        />
      </section>

      {/* AI usage + recent activity */}
      <section className="grid lg:grid-cols-3 gap-5">
        <div className="surface p-6 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <Zap className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">AI this month</span>
            </div>
            <Link to="/billing" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <CreditCard className="h-3.5 w-3.5" /> Plan
            </Link>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">{usage?.used ?? 0}</span>
              <span className="text-sm text-muted-foreground">/ {usage?.limit ?? "—"}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{plan.name} plan</p>
          </div>
          <div className="mt-4 h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          {usage && usage.remaining <= 2 && (
            <p className="mt-3 text-xs text-destructive">
              You're nearly out. <Link to="/billing" className="underline">Upgrade</Link> for more.
            </p>
          )}
        </div>

        <div className="surface lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent activity</h2>
            <Link to="/library" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-border -mx-2">
            {((stats?.recent ?? []).length + (setsStats?.recent ?? []).length) === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Nothing yet —{" "}
                <Link to="/upload" className="text-primary font-medium hover:underline">upload a file</Link>{" "}
                or{" "}
                <Link to="/study" className="text-primary font-medium hover:underline">create a study set</Link>.
              </div>
            ) : (
              <>
                {(setsStats?.recent ?? []).slice(0, 3).map((s) => (
                  <ActivityRow
                    key={`set-${s.id}`}
                    icon={s.kind === "study" ? BookOpenCheck : s.kind === "test" ? ListChecks : GraduationCap}
                    title={s.title}
                    sub={`${s.kind === "study" ? "Study set" : s.kind === "test" ? "Test" : "Exam"} · ${new Date(s.created_at).toLocaleDateString()}`}
                    href={{ to: "/sets/$id", params: { id: s.id } }}
                  />
                ))}
                {(stats?.recent ?? []).slice(0, 3).map((m) => {
                  const Icon = TYPE_META[m.type as keyof typeof TYPE_META]?.icon ?? BookOpen;
                  return (
                    <ActivityRow
                      key={`mat-${m.id}`}
                      icon={Icon}
                      title={m.title}
                      sub={`${TYPE_META[m.type as keyof typeof TYPE_META]?.label} · ${new Date(m.created_at).toLocaleDateString()}`}
                      href={{ to: "/library", search: { type: m.type as "notes" | "homework" | "exam" } }}
                    />
                  );
                })}
              </>
            )}
          </div>
        </div>
      </section>

      <section className="surface p-6 border-dashed">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Coming soon</span>
        </div>
        <h3 className="mt-2 font-semibold text-lg">Generate sets straight from your uploads</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Point Lumio at a PDF in your library and it'll spin up flashcards, tests, and exams for you.
        </p>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  to,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  to: "/library" | "/study" | "/tests" | "/billing";
  icon: typeof BookOpen;
}) {
  return (
    <Link to={to} className="surface-interactive p-4 sm:p-5 block group">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{hint}</div>
    </Link>
  );
}

function ActionCard({
  to,
  icon: Icon,
  title,
  desc,
}: {
  to: "/study" | "/tests" | "/exams";
  icon: typeof BookOpen;
  title: string;
  desc: string;
}) {
  return (
    <Link to={to} className="surface-interactive p-5 block group">
      <div className="flex items-center justify-between">
        <div className="h-10 w-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </Link>
  );
}

type ActivityHref =
  | { to: "/sets/$id"; params: { id: string } }
  | { to: "/library"; search: { type: "notes" | "homework" | "exam" } };

function ActivityRow({
  icon: Icon,
  title,
  sub,
  href,
}: {
  icon: typeof BookOpen;
  title: string;
  sub: string;
  href: ActivityHref;
}) {
  return (
    <Link
      {...(href as never)}
      className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-secondary/50 transition-colors"
    >
      <div className="h-8 w-8 rounded-md bg-primary-soft flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
