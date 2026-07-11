import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { SpoudeMark } from "@/components/Logo";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  Lock,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  User as UserIcon,
} from "lucide-react";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Spoude" },
      { name: "description", content: "Sign in or create your Spoude account." },
    ],
  }),
  validateSearch: searchSchema,
  component: AuthPage,
});

const signupSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .max(72, "Too long")
    .regex(/[A-Z]/, "Add an uppercase letter")
    .regex(/[a-z]/, "Add a lowercase letter")
    .regex(/\d/, "Add a number"),
  name: z.string().trim().min(1, "Required").max(80),
});

const signinSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(1, "Required").max(72),
});

type Step = "credentials" | "mfa";

const WORDS = [
  {
    title: "Personalized Learning",
    desc: "Convert lecture notes, slides, and papers into custom lessons.",
  },
  {
    title: "Smart Flashcards",
    desc: "Self-generate study decks to lock in key definitions and concepts.",
  },
  {
    title: "Timed Exams",
    desc: "Assess yourself with custom practice exams under realistic conditions.",
  },
  {
    title: "Interactive AI Tutor",
    desc: "Chat with a conversational tutor ready to clarify complex topics 24/7.",
  },
];

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [step, setStep] = useState<Step>("credentials");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [mfa, setMfa] = useState({ factorId: "", code: "" });

  // Carousel word index state
  const [wordIdx, setWordIdx] = useState(0);
  const [wordFade, setWordFade] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/lumio", replace: true });
    });
  }, [navigate]);

  // Word slider interval
  useEffect(() => {
    const interval = setInterval(() => {
      setWordFade(false);
      setTimeout(() => {
        setWordIdx((prev) => (prev + 1) % WORDS.length);
        setWordFade(true);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const parsed = signupSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/lumio`,
            data: { display_name: parsed.data.name },
          },
        });
        if (error) throw error;
        toast.success("Account created. Welcome to Spoude!");
        navigate({ to: "/lumio", replace: true });
      } else {
        const parsed = signinSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aal?.nextLevel === "aal2" && aal.nextLevel !== aal.currentLevel) {
          const { data: factors } = await supabase.auth.mfa.listFactors();
          const totp = factors?.totp?.[0];
          if (totp) {
            setMfa({ factorId: totp.id, code: "" });
            setStep("mfa");
            return;
          }
        }
        toast.success("Welcome back");
        navigate({ to: "/lumio", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const verifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mfa.code.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({
        factorId: mfa.factorId,
      });
      if (cErr) throw cErr;
      const { error } = await supabase.auth.mfa.verify({
        factorId: mfa.factorId,
        challengeId: challenge.id,
        code: mfa.code,
      });
      if (error) throw error;
      toast.success("Verified");
      navigate({ to: "/lumio", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
    });
    if (result.error) {
      toast.error(result.error.message ?? "Google sign-in failed");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/lumio", replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row overflow-hidden relative w-full">
      {/* LEFT PANEL: Auth Form (Full width on mobile, 45% width on desktop) */}
      <div className="flex-1 lg:max-w-lg xl:max-w-xl flex flex-col justify-between p-6 sm:p-10 relative z-10 bg-background/50 backdrop-blur-md">
        {/* Layered aurora backdrop for form side */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute -top-40 left-1/2 -translate-x-1/2 h-[42rem] w-[42rem] rounded-full blur-3xl opacity-70"
            style={{ background: "radial-gradient(circle, var(--aurora-1), transparent 60%)" }}
          />
          <div
            className="absolute bottom-[-14rem] left-[-8rem] h-[26rem] w-[26rem] rounded-full blur-3xl opacity-60"
            style={{ background: "radial-gradient(circle, var(--aurora-3), transparent 65%)" }}
          />
          {/* Fine grid */}
          <div
            className="absolute inset-0 opacity-[0.35] dark:opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(to right, color-mix(in oklch, var(--color-foreground) 6%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklch, var(--color-foreground) 6%, transparent) 1px, transparent 1px)",
              backgroundSize: "42px 42px",
              maskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
            }}
          />
        </div>

        {/* Small top header branding */}
        <div className="flex items-center gap-2">
          <SpoudeMark size={28} />
          <span
            className="font-bold text-lg tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Spoude
          </span>
        </div>

        {/* Auth form center content */}
        <div className="my-auto py-10 w-full max-w-sm mx-auto">
          {/* Tagline */}
          <div className="flex flex-col items-center text-center mb-8 animate-fade-up">
            <h1 className="flex items-center gap-2 text-[26px] font-bold tracking-tight leading-tight">
              Welcome to
              <img
                src="/logo_1.png"
                alt="Spoude"
                className="inline-block h-[1em] w-auto align-middle"
              />
            </h1>
            <p className="mt-1.5 text-[13px] text-muted-foreground max-w-xs">
              {mode === "signup"
                ? "One quiet space for every note, homework and past paper."
                : "Sign in to continue where you left off."}
            </p>
          </div>

          {/* Card */}
          <div
            className="rounded-3xl border border-border shadow-elev-3 p-6 sm:p-7 animate-fade-up"
            style={{ background: "var(--popover)", animationDelay: "60ms" }}
          >
            {step === "credentials" ? (
              <>
                <button
                  type="button"
                  onClick={google}
                  disabled={loading}
                  className="ripple w-full flex items-center justify-center gap-2.5 rounded-full border border-border bg-card px-4 py-2.5 text-[13px] font-medium hover:border-primary/40 hover:shadow-elev-1 transition-all"
                >
                  <GoogleIcon /> Continue with Google
                </button>

                <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground">
                  <div className="h-px flex-1 bg-border" />
                  or email
                  <div className="h-px flex-1 bg-border" />
                </div>

                <form onSubmit={submit} className="space-y-3">
                  {mode === "signup" && (
                    <Field label="Name" icon={<UserIcon className="h-4 w-4" />}>
                      <input
                        type="text"
                        autoComplete="name"
                        required
                        maxLength={80}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full bg-transparent outline-none text-sm"
                        placeholder="Alex Rivera"
                      />
                    </Field>
                  )}
                  <Field label="Email" icon={<Mail className="h-4 w-4" />}>
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={255}
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-transparent outline-none text-sm"
                      placeholder="you@school.edu"
                    />
                  </Field>
                  <Field label="Password" icon={<Lock className="h-4 w-4" />}>
                    <input
                      type="password"
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      required
                      maxLength={72}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full bg-transparent outline-none text-sm"
                      placeholder={mode === "signup" ? "8+ chars, mixed case, number" : "••••••••"}
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={loading}
                    className="ripple w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-full px-4 py-3 text-[13px] font-semibold shadow-elev-1 hover:shadow-glow transition-all disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                    {mode === "signup" ? "Create account" : "Sign in"}
                  </button>
                </form>

                <p className="mt-5 text-center text-[13px] text-muted-foreground">
                  {mode === "signup" ? "Already have an account?" : "New to Spoude?"}{" "}
                  <button
                    onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                    className="text-foreground font-semibold hover:text-primary transition-colors"
                  >
                    {mode === "signup" ? "Sign in" : "Create one"}
                  </button>
                </p>
              </>
            ) : (
              <>
                <div className="h-10 w-10 rounded-full bg-primary-soft flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <h2 className="mt-4 text-xl font-bold tracking-tight">Two-factor verification</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Enter the 6-digit code from your authenticator.
                </p>
                <form onSubmit={verifyMfa} className="mt-5 space-y-3">
                  <input
                    autoFocus
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    value={mfa.code}
                    onChange={(e) =>
                      setMfa({ ...mfa, code: e.target.value.replace(/\D/g, "").slice(0, 6) })
                    }
                    className="w-full text-center text-2xl font-mono tracking-[0.5em] bg-secondary rounded-lg py-3 outline-none focus:ring-2 focus:ring-ring"
                    placeholder="000000"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="ripple w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-full px-4 py-3 text-[13px] font-semibold shadow-elev-1 hover:shadow-glow transition-all disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                    Verify
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Feature strip for mobile only */}
          <div
            className="mt-5 flex lg:hidden items-center justify-center gap-4 text-[11px] text-muted-foreground animate-fade-up"
            style={{ animationDelay: "120ms" }}
          >
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" /> AI tutor
            </span>
            <span className="opacity-40">·</span>
            <span>Flashcards</span>
            <span className="opacity-40">·</span>
            <span>Timed exams</span>
          </div>
        </div>

        {/* Small footer */}
        <p className="text-center text-[11px] text-muted-foreground w-full">
          By continuing you agree to our{" "}
          <Link to="/terms" className="underline underline-offset-2 hover:text-foreground">
            Terms
          </Link>
          {" · "}
          <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">
            Privacy
          </Link>
        </p>
      </div>

      {/* RIGHT PANEL: Immersive Video & Dynamic Word Showcase (Desktop only) */}
      <div className="hidden lg:flex flex-1 relative bg-black flex-col justify-end p-12 xl:p-16 overflow-hidden">
        {/* Background Looping Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-lighten transition-opacity duration-1000"
          src="https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-student-taking-notes-on-a-notebook-41843-large.mp4"
        />

        {/* Ambient background glows for video overlay depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent z-10 pointer-events-none" />

        <div className="relative z-20 max-w-lg space-y-4">
          {/* Quick aesthetic pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary backdrop-blur-md animate-shimmer">
            <Sparkles className="h-3.5 w-3.5" /> Core Workspace
          </div>

          {/* Dynamically changing words / highlights with smooth transitions */}
          <div className="min-h-[140px] flex flex-col justify-end">
            <div
              className={`transition-all duration-300 transform ${
                wordFade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              }`}
            >
              <h2 className="text-3xl font-bold tracking-tight text-foreground select-none">
                {WORDS[wordIdx].title}
              </h2>
              <p className="mt-2 text-base text-muted-foreground leading-relaxed select-none max-w-md">
                {WORDS[wordIdx].desc}
              </p>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5 pt-2">
            {WORDS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setWordFade(false);
                  setTimeout(() => {
                    setWordIdx(idx);
                    setWordFade(true);
                  }, 200);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  wordIdx === idx
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-muted-foreground/35 hover:bg-muted-foreground/60"
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
        {label}
      </span>
      <div className="flex items-center gap-2.5 rounded-xl border border-input bg-card/60 px-3 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40 transition-all">
        <span className="text-muted-foreground">{icon}</span>
        {children}
      </div>
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84A4.14 4.14 0 0112 13.55v2.27h2.92A8.77 8.77 0 0017.64 9.2z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.27c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.97 10.71A5.4 5.4 0 013.68 9c0-.59.1-1.17.29-1.71V4.96H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.04l3.01-2.33z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 00.96 4.96L3.97 7.3C4.68 5.16 6.66 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
