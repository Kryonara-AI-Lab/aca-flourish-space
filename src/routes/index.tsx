import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, FileText, GraduationCap, Sparkles, ShieldCheck, Upload } from "lucide-react";
import { LumioWordmark } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumio — Study, illuminated" },
      { name: "description", content: "A calm, organized home for your class notes, homework and past exams. Built for personal academic growth." },
      { property: "og:title", content: "Lumio — Study, illuminated" },
      { property: "og:description", content: "A calm, organized home for your class notes, homework and past exams." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background lumio-paper">
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <LumioWordmark />
        <nav className="flex items-center gap-2 sm:gap-4 text-sm">
          <Link to="/auth" className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors">
            Sign in
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="ripple inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold shadow-elev-1 hover:shadow-glow transition-all duration-300 hover:-translate-y-0.5"
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </nav>
      </header>

      <section className="max-w-5xl mx-auto px-6 pt-12 sm:pt-20 pb-20 text-center">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft text-foreground text-xs font-medium animate-fade-up">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Private by default · Encrypted storage
        </span>
        <h1 className="mt-6 text-4xl sm:text-6xl font-bold tracking-tight animate-fade-up" style={{ animationDelay: "60ms" }}>
          Your study, <span className="text-gradient-warm">illuminated.</span>
        </h1>
        <p className="mt-5 max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground animate-fade-up" style={{ animationDelay: "120ms" }}>
          Lumio is the calm, organized home for your class notes, homework and past exams.
          Built for steady, personal academic growth — one upload at a time.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3 animate-fade-up" style={{ animationDelay: "180ms" }}>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="ripple inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-semibold shadow-elev-2 hover:shadow-glow transition-all duration-300 hover:-translate-y-0.5"
          >
            Create a free account <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            I already have an account
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20 grid sm:grid-cols-3 gap-5">
        {[
          { icon: BookOpen, title: "Class notes", body: "Drop in lecture notes and revision summaries — organized by subject." },
          { icon: FileText, title: "Homework", body: "Track assignments and keep their reference files one tap away." },
          { icon: GraduationCap, title: "Past exams", body: "Build a personal exam vault to revise from year after year." },
        ].map(({ icon: Icon, title, body }, i) => (
          <div key={title} className="surface-interactive p-6 animate-fade-up" style={{ animationDelay: `${i * 90 + 240}ms` }}>
            <div className="h-10 w-10 rounded-lg bg-primary-soft flex items-center justify-center mb-4">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="surface p-8 sm:p-10 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium">
              <ShieldCheck className="h-3.5 w-3.5" /> Secure by design
            </div>
            <h2 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight">Sign in with confidence.</h2>
            <p className="mt-3 text-muted-foreground">
              Email & password, single-tap Google sign-in, and optional time-based 2FA.
              Files are stored privately and only readable by you.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              "Email + password with strong password rules",
              "One-tap Google sign-in",
              "Optional authenticator-app 2FA (TOTP)",
              "Row-level access policies on every file",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span className="text-foreground">{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="flex items-end justify-between mb-5">
          <h2 className="text-2xl font-bold tracking-tight">Coming soon</h2>
          <span className="text-xs text-muted-foreground animate-shimmer">In active design</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { t: "Smart summaries", d: "AI-generated study guides from your own notes." },
            { t: "Spaced repetition", d: "Auto-built flashcards from highlighted passages." },
            { t: "Study groups", d: "Share a subject folder with classmates, privately." },
            { t: "Mobile capture", d: "Snap a page and Lumio files it for you." },
          ].map((f) => (
            <div key={f.t} className="surface p-5 border-dashed">
              <div className="text-xs uppercase tracking-wider text-primary font-semibold">Soon</div>
              <div className="mt-1.5 font-semibold text-foreground">{f.t}</div>
              <div className="mt-1 text-sm text-muted-foreground">{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border bg-card/40">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row gap-6 sm:items-center sm:justify-between text-sm">
          <div className="flex items-center gap-3">
            <LumioWordmark />
            <span className="text-muted-foreground">© {new Date().getFullYear()} Lumio</span>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/disclaimer" className="hover:text-foreground transition-colors">Disclaimer</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
