import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, FileText, GraduationCap, Upload as UploadIcon, Sparkles, ArrowRight } from "lucide-react";

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

  const name = (user?.user_metadata?.display_name as string | undefined) || (user?.email?.split("@")[0] ?? "there");

  return (
    <div className="space-y-10 animate-fade-up">
      <header>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-1">
          Hi, <span className="text-gradient-warm">{name}</span>.
        </h1>
        <p className="mt-2 text-muted-foreground">Here's a quick look at your study library.</p>
      </header>

      <section className="grid sm:grid-cols-3 gap-4">
        {(Object.keys(TYPE_META) as Array<keyof typeof TYPE_META>).map((k) => {
          const Icon = TYPE_META[k].icon;
          return (
            <Link
              key={k}
              to="/library"
              search={{ type: k }}
              className="surface-interactive p-5 block group"
            >
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-lg bg-primary-soft flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="mt-4 text-3xl font-bold tracking-tight">{stats?.counts[k] ?? "—"}</div>
              <div className="text-sm text-muted-foreground">{TYPE_META[k].label}</div>
            </Link>
          );
        })}
      </section>

      <section className="grid lg:grid-cols-3 gap-5">
        <Link
          to="/upload"
          className="surface-interactive p-6 lg:col-span-2 flex items-center gap-5 group"
        >
          <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-elev-1 group-hover:shadow-glow transition-all">
            <UploadIcon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Upload a new file</h3>
            <p className="text-sm text-muted-foreground">Add notes, homework, or a past exam to your library.</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-foreground transition-all" />
        </Link>

        <div className="surface p-6">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Coming soon</span>
          </div>
          <h3 className="mt-2 font-semibold text-lg">Smart study guides</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Lumio will turn your notes into summaries and flashcards. In active design.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Recent uploads</h2>
        <div className="surface divide-y divide-border">
          {(stats?.recent ?? []).length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No uploads yet —{" "}
              <Link to="/upload" className="text-primary font-medium hover:underline">add your first file</Link>.
            </div>
          ) : (
            stats!.recent.map((m) => {
              const Icon = TYPE_META[m.type as keyof typeof TYPE_META]?.icon ?? BookOpen;
              return (
                <div key={m.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-secondary/40 transition-colors">
                  <Icon className="h-4 w-4 text-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{m.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(m.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Link to="/library" search={{ type: m.type as "notes" | "homework" | "exam" }} className="text-xs text-muted-foreground hover:text-foreground">
                    Open
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
