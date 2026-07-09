import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import type { User } from "firebase/auth";
import {
  ArrowRight,
  BookOpenCheck,
  Building2,
  GraduationCap,
  Library,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/university-dashboard")({
  beforeLoad: ({ context }) => {
    const profile = (context as { profile?: { role?: string | null } }).profile;
    if (profile?.role !== "university") {
      throw redirect({ to: "/spoude", replace: true });
    }
  },
  head: () => ({ meta: [{ title: "University Dashboard — Spoude" }] }),
  component: UniversityDashboard,
});

function UniversityDashboard() {
  return (
    <div className="space-y-8 animate-fade-up">
      <header className="rounded-[32px] border border-border bg-card p-8 shadow-elev-2">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> University portal
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">University dashboard</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Curate a shared library for your students, track uploads, and keep your academic resources organized in one place.
              </p>
            </div>
          </div>
          <Link
            to="/spoude-library"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-elev-1 transition-all hover:shadow-glow"
          >
            Open library <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card
          icon={Library}
          title="Shared materials"
          description="Publish curated notes, past exams, and course resources for your students."
        />
        <Card
          icon={Users}
          title="Student access"
          description="Create a private, trusted knowledge base for the courses you oversee."
        />
        <Card
          icon={BookOpenCheck}
          title="Learning tools"
          description="Pair your library with study sets, exams, and AI-assisted review flows."
        />
      </section>

      <section className="rounded-[32px] border border-border bg-gradient-to-br from-primary/10 to-transparent p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> New for institutions
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">Launch your next academic collection</h2>
            <p className="text-sm text-muted-foreground">
              Your university space is ready for high-quality content, organized by course and department.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-border bg-background/70 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-4 w-4 text-primary" /> Institution portal
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-background/70 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <GraduationCap className="h-4 w-4 text-primary" /> Student-ready library
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Library;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[24px] border border-border bg-card p-6 shadow-elev-1">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
