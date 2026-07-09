import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { auth, db, googleProvider } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
} from "firebase/auth";
import { SpoudeMark } from "@/components/Logo";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  Lock,
  ShieldCheck,
  ArrowRight,
  User as UserIcon,
  HelpCircle,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

type Step = "credentials";

const EXPRESSIVE_LINES = [
  "Every late night with your notes counts for something.",
  "One page, one problem set, one step closer.",
  "You showed up today. That's not nothing.",
  "Quiet effort adds up to something loud.",
  "Somewhere between the coffee and the deadline, you're growing.",
  "Your future self is already proud of this.",
];

function useRotatingLine(lines: string[], intervalMs = 4500) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      const swap = setTimeout(() => {
        setIndex((i) => (i + 1) % lines.length);
        setVisible(true);
      }, 400);
      return () => clearTimeout(swap);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [lines.length, intervalMs]);

  return { line: lines[index], visible };
}

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [step, setStep] = useState<Step>("credentials");
  const [loading, setLoading] = useState(false);
  const [isUniversity, setIsUniversity] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const { line, visible } = useRotatingLine(EXPRESSIVE_LINES);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) navigate({ to: "/spoude", replace: true });
    });
    return () => unsubscribe();
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
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          parsed.data.email,
          parsed.data.password,
        );
        await updateProfile(userCredential.user, {
          displayName: parsed.data.name,
        });

        // Set role & data in profiles
        await setDoc(doc(db, "profiles", userCredential.user.uid), {
          display_name: parsed.data.name,
          bio: isUniversity ? "Official University Library Administrator" : "",
          role: isUniversity ? "university" : "student",
          current_streak: 0,
          longest_streak: 0,
          honor_score: 0,
          plan: isUniversity ? "pro" : "free",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        toast.success("Account created. Welcome to Spoude!");
        if (isUniversity) {
          navigate({ to: "/university-dashboard", replace: true });
        } else {
          navigate({ to: "/spoude", replace: true });
        }
      } else {
        const parsed = signinSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
        await signInWithEmailAndPassword(auth, parsed.data.email, parsed.data.password);
        toast.success("Welcome back");
        navigate({ to: "/spoude", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Welcome back");
      navigate({ to: "/spoude", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* LEFT — brand + photo + rotating expressive copy (desktop only) */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-between overflow-hidden">
        {/* Background photo, faded under a dark gradient so text stays readable */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/auth-bg.mp4)" }}
          aria-hidden
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, rgba(15,20,40,0.88) 0%, rgba(20,25,55,0.72) 45%, rgba(20,25,55,0.55) 100%)",
          }}
          aria-hidden
        />

        {/* Logo + wordmark, top-left */}
        <div className="relative z-10 flex items-center gap-2.5 px-10 pt-10">
          <div className="h-10 w-10 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/15">
            <SpoudeMark size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Spoude</span>
        </div>

        {/* Rotating expressive line, bottom-left */}
        <div className="relative z-10 px-10 pb-14 max-w-md">
          <p
            className="text-[28px] leading-snug font-semibold text-white transition-opacity duration-400"
            style={{
              opacity: visible ? 1 : 0,
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}
          >
            {line}
          </p>
          <div className="mt-6 flex items-center gap-4 text-[13px] text-white/70">
            <span>AI tutor</span>
            <span className="opacity-50">·</span>
            <span>Flashcards</span>
            <span className="opacity-50">·</span>
            <span>Timed exams</span>
          </div>
        </div>
      </div>

      {/* RIGHT — the auth form */}
      <div className="relative flex flex-1 flex-col min-h-screen lg:min-h-0">
        {/* Mobile-only brand row (left panel is hidden below lg) */}
        <div className="flex lg:hidden items-center gap-2 px-6 pt-6">
          <div
            className="h-9 w-9 rounded-2xl border border-border flex items-center justify-center"
            style={{ background: "var(--popover)" }}
          >
            <SpoudeMark size={22} />
          </div>
          <span className="text-lg font-bold tracking-tight">Spoude</span>
        </div>

        <main className="flex-1 flex items-center justify-center px-4 py-10 lg:py-0">
          <div className="w-full max-w-sm">
            <div className="mb-8 animate-fade-up">
              <h1 className="text-[26px] font-bold tracking-tight leading-tight">
                {mode === "signup"
                  ? isUniversity
                    ? "Create University Account"
                    : "Create your Spoude account"
                  : "Welcome back to Spoude"}
              </h1>
              <p className="mt-1.5 text-[13px] text-muted-foreground max-w-xs">
                {mode === "signup"
                  ? isUniversitySignUp()
                    ? "Upload high-quality academic files to Spoude's global bookshelf."
                    : "One quiet space for every note, homework and past paper."
                  : "Sign in to continue where you left off."}
              </p>
            </div>

            {/* Card */}
            <div
              className="rounded-3xl border border-border shadow-elev-3 p-6 sm:p-7 animate-fade-up"
              style={{ background: "var(--popover)", animationDelay: "60ms" }}
            >
              {step === "credentials" && (
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
                      <Field
                        label={isUniversity ? "University Name" : "Name"}
                        icon={<UserIcon className="h-4 w-4" />}
                      >
                        <input
                          type="text"
                          autoComplete="name"
                          required
                          maxLength={80}
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full bg-transparent outline-none text-sm"
                          placeholder={isUniversity ? "Oxford University" : "Alex Rivera"}
                        />
                      </Field>
                    )}
                    <Field
                      label={isUniversity ? "Administrative Email" : "Email"}
                      icon={<Mail className="h-4 w-4" />}
                    >
                      <input
                        type="email"
                        autoComplete="email"
                        required
                        maxLength={255}
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full bg-transparent outline-none text-sm"
                        placeholder={isUniversity ? "admin@ox.ac.uk" : "you@school.edu"}
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
                        placeholder={
                          mode === "signup" ? "8+ chars, mixed case, number" : "••••••••"
                        }
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
                      onClick={() => {
                        setMode(mode === "signup" ? "signin" : "signup");
                        setIsUniversity(false);
                      }}
                      className="text-foreground font-semibold hover:text-primary transition-colors cursor-pointer"
                    >
                      {mode === "signup" ? "Sign in" : "Create one"}
                    </button>
                  </p>

                  {/* University Accounts Option */}
                  <div className="mt-6 pt-4 border-t border-border/40 text-center">
                    <div className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                      <button
                        type="button"
                        onClick={() => {
                          setMode("signup");
                          setIsUniversity(true);
                          setForm({ name: "", email: "", password: "" });
                        }}
                        className="font-semibold text-primary hover:underline cursor-pointer"
                      >
                        Create an account for your university
                      </button>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="p-0.5 rounded-full hover:bg-secondary cursor-help">
                              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[220px] p-2 text-xs">
                            This option is for universities that want to officially upload verified
                            study sheets and textbook guides to the public library.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </>
              )}
            </div>

            <p className="mt-5 text-center text-[11px] text-muted-foreground">
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
        </main>
      </div>
    </div>
  );

  function isUniversitySignUp(): boolean {
    return mode === "signup" && isUniversity;
  }
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
