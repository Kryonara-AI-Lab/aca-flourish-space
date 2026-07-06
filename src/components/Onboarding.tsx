import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { Sparkles, Home, Plus, Moon, User, ArrowRight, X } from "lucide-react";
import { LumioMark } from "@/components/Logo";

const KEY = "lumio-onboarding-v1";

export function shouldRunOnboarding(): boolean {
  if (typeof window === "undefined") return false;
  try { return localStorage.getItem(KEY) !== "done"; } catch { return true; }
}

export function resetOnboarding() {
  try { localStorage.removeItem(KEY); } catch {}
  window.dispatchEvent(new Event("lumio:onboarding:replay"));
}

export function Onboarding() {
  const [open, setOpen] = useState(false);
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    if (shouldRunOnboarding()) setOpen(true);
    const replay = () => setOpen(true);
    window.addEventListener("lumio:onboarding:replay", replay);
    return () => window.removeEventListener("lumio:onboarding:replay", replay);
  }, []);

  const finish = () => {
    try { localStorage.setItem(KEY, "done"); } catch {}
    setOpen(false);
    setShowTips(true);
    // auto-dismiss tips after 12s so we don't nag
    window.setTimeout(() => setShowTips(false), 12000);
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      {open && <WelcomeModal onDone={finish} onSkip={finish} />}
      {showTips && <TipPulses onDismiss={() => setShowTips(false)} />}
    </>,
    document.body,
  );
}

function WelcomeModal({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 animate-fade-up">
      <button
        aria-label="Skip"
        onClick={onSkip}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-md"
      />
      <div className="relative glass-strong w-full max-w-md p-6 sm:p-7 rounded-3xl">
        <button
          onClick={onSkip}
          aria-label="Close"
          className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-lg animate-shimmer" />
            <div className="relative h-11 w-11 rounded-2xl bg-primary/12 flex items-center justify-center">
              <LumioMark size={22} />
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Welcome to</p>
            <h2 className="text-lg font-semibold tracking-tight">Lumio</h2>
          </div>
        </div>

        <p className="text-[13px] text-muted-foreground leading-relaxed">
          Your study, illuminated. Here's what to know in 20 seconds — three things you'll use every day.
        </p>

        <ul className="mt-5 space-y-3">
          <Row icon={Home} tone="primary" title="Home hub" desc="Progress, jump-in tiles, and recent activity — all in one place." />
          <Row icon={Plus} tone="violet" title="Bottom nav +" desc="Tap the glowing plus to reach Library, Study, Exams and Billing." />
          <Row icon={Moon} tone="gold" title="Light or dark" desc="Toggle any time from the top bar. Your choice is remembered." />
          <Row icon={User} tone="emerald" title="Your profile" desc="Honor score, streak, credits and account controls live under Profile." />
        </ul>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={onSkip}
            className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip
          </button>
          <div className="flex items-center gap-2">
            <Link
              to="/library"
              onClick={onDone}
              className="text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Upload later
            </Link>
            <button
              onClick={onDone}
              className="ripple inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-[12px] font-semibold shadow-elev-1 hover:shadow-glow transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Let's go
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>,
  );
}

function Row({
  icon: Icon, tone, title, desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "gold" | "violet" | "emerald";
  title: string; desc: string;
}) {
  const toneCls: Record<string, string> = {
    primary: "bg-primary/12 text-primary",
    gold: "bg-amber-400/15 text-amber-500 dark:text-amber-300",
    violet: "bg-violet-500/15 text-violet-500 dark:text-violet-300",
    emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  };
  return (
    <li className="flex items-start gap-3">
      <div className={`h-9 w-9 rounded-2xl flex items-center justify-center shrink-0 ${toneCls[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold">{title}</div>
        <div className="text-[12px] text-muted-foreground leading-relaxed">{desc}</div>
      </div>
    </li>
  );
}

/**
 * Subtle glow rings anchored to the mobile bottom-nav plus button and the
 * top-bar theme toggle. Non-blocking; auto-dismisses.
 */
function TipPulses({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[90]">
      {/* Mobile plus button — bottom center */}
      <div className="lg:hidden absolute bottom-[3.75rem] left-1/2 -translate-x-1/2 flex flex-col items-center">
        <div className="tip-bubble">Tap + to open more</div>
        <div className="tip-ring" />
      </div>
      {/* Desktop theme toggle — top right area */}
      <div className="hidden lg:block absolute top-9 right-[8.75rem]">
        <div className="flex flex-col items-center gap-1">
          <div className="tip-bubble">Switch light / dark</div>
          <div className="tip-ring" />
        </div>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss tips"
        className="pointer-events-auto absolute top-2 right-2 text-[10px] text-muted-foreground bg-background/70 backdrop-blur px-2 py-1 rounded-full border border-border"
      >
        got it
      </button>
    </div>
  );
}