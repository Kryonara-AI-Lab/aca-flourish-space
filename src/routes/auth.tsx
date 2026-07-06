import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { LumioWordmark } from "@/components/Logo";
import { toast } from "sonner";
import { Loader2, Mail, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import authDesk from "@/assets/auth-desk.png";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Lumio" },
      { name: "description", content: "Sign in or create your Lumio account." },
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

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [step, setStep] = useState<Step>("credentials");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [mfa, setMfa] = useState({ factorId: "", code: "" });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/lumio", replace: true });
    });
  }, [navigate]);

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
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { display_name: parsed.data.name },
          },
        });
        if (error) throw error;
        toast.success("Account created. Welcome to Lumio!");
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
        // Check if MFA is required (aal2)
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
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: mfa.factorId });
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
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (result.error) {
      toast.error(result.error.message ?? "Google sign-in failed");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/lumio", replace: true });
  };

  return (
    <div className="min-h-screen bg-background lumio-paper flex flex-col overflow-hidden">
      <header className="max-w-6xl w-full mx-auto px-6 py-6 relative z-10">
        <LumioWordmark />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-16 relative">
        {/* Ambient orbs */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-32 -left-24 h-96 w-96 rounded-full blur-3xl opacity-60"
            style={{ background: "radial-gradient(circle, var(--aurora-1), transparent 60%)" }}
          />
          <div
            className="absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-60"
            style={{ background: "radial-gradient(circle, var(--aurora-2), transparent 60%)" }}
          />
        </div>

        <div className="relative w-full max-w-5xl grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 items-center">
          {/* Illustration side */}
          <div className="hidden lg:flex flex-col items-center text-center animate-fade-up">
            <div className="relative">
              <div
                aria-hidden
                className="absolute inset-0 rounded-full blur-3xl opacity-70"
                style={{ background: "radial-gradient(circle at 50% 55%, var(--aurora-1), transparent 65%)" }}
              />
              <img
                src={authDesk}
                alt=""
                width={520}
                height={520}
                className="relative w-[440px] h-[440px] object-contain float-slow select-none"
                draggable={false}
              />
            </div>
            <p className="mt-2 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Your study, illuminated</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight max-w-sm">
              A calm home for your notes, homework and past exams.
            </h2>
            <div className="mt-6 flex items-center gap-6 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> AI tutor</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Flashcards</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Timed exams</span>
            </div>
          </div>

          {/* Form side */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            {/* Mobile illustration */}
            <div className="lg:hidden flex justify-center mb-4 animate-fade-up">
              <img
                src={authDesk}
                alt=""
                width={220}
                height={220}
                className="w-40 h-40 object-contain float-slow select-none"
                draggable={false}
              />
            </div>
            <div className="glass-strong p-7 sm:p-8 animate-fade-up rounded-3xl">
            {step === "credentials" ? (
              <>
                <h1 className="text-2xl font-bold tracking-tight">
                  {mode === "signup" ? "Create your Lumio account" : "Welcome back"}
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {mode === "signup" ? "Start organizing your study materials in minutes." : "Sign in to continue your studies."}
                </p>

                <button
                  type="button"
                  onClick={google}
                  disabled={loading}
                  className="ripple mt-6 w-full flex items-center justify-center gap-2.5 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:border-primary/40 hover:shadow-elev-1 transition-all"
                >
                  <GoogleIcon /> Continue with Google
                </button>

                <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="h-px flex-1 bg-border" />
                  or with email
                  <div className="h-px flex-1 bg-border" />
                </div>

                <form onSubmit={submit} className="space-y-3">
                  {mode === "signup" && (
                    <Field label="Name" icon={<Mail className="h-4 w-4" />}>
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
                    className="ripple w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-semibold shadow-elev-1 hover:shadow-glow transition-all disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    {mode === "signup" ? "Create account" : "Sign in"}
                  </button>
                </form>

                <p className="mt-5 text-center text-sm text-muted-foreground">
                  {mode === "signup" ? "Already have an account?" : "New to Lumio?"}{" "}
                  <button
                    onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                    className="text-foreground font-medium hover:text-primary transition-colors"
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
                <h1 className="mt-4 text-2xl font-bold tracking-tight">Two-factor verification</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Enter the 6-digit code from your authenticator app.
                </p>
                <form onSubmit={verifyMfa} className="mt-6 space-y-3">
                  <input
                    autoFocus
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    value={mfa.code}
                    onChange={(e) => setMfa({ ...mfa, code: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                    className="w-full text-center text-2xl font-mono tracking-[0.5em] bg-secondary rounded-lg py-3 outline-none focus:ring-2 focus:ring-ring"
                    placeholder="000000"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="ripple w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-semibold shadow-elev-1 hover:shadow-glow transition-all disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    Verify
                  </button>
                </form>
              </>
            )}
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By continuing you agree to our{" "}
              <Link to="/terms" className="underline underline-offset-2 hover:text-foreground">Terms</Link> and{" "}
              <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>
      <div className="flex items-center gap-2.5 rounded-lg border border-input bg-card px-3 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40 transition-all">
        <span className="text-muted-foreground">{icon}</span>
        {children}
      </div>
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84A4.14 4.14 0 0112 13.55v2.27h2.92A8.77 8.77 0 0017.64 9.2z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.27c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 009 18z" fill="#34A853"/>
      <path d="M3.97 10.71A5.4 5.4 0 013.68 9c0-.59.1-1.17.29-1.71V4.96H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.04l3.01-2.33z" fill="#FBBC05"/>
      <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 00.96 4.96L3.97 7.3C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
