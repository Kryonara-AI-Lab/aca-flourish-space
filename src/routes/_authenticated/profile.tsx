import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  User as UserIcon,
  Sparkles,
  Flame,
  Trophy,
  Zap,
  LogOut,
  Settings as SettingsIcon,
  ShieldCheck,
  Pencil,
  Loader2,
  Crown,
  BookOpenCheck,
  GraduationCap,
  Heart,
  CreditCard,
  KeyRound,
  Coffee,
  Mail,
  History,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { getUsage } from "@/lib/exam.functions";
import { planFor } from "@/lib/plans";
import { useRouter } from "@tanstack/react-router";
import { StatCardSkeleton, MiniStatSkeleton } from "@/components/Skeletons";
import { resetOnboarding } from "@/components/Onboarding";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Spoude" }] }),
  component: ProfilePage,
});

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  plan: string | null;
  honor_score: number;
  current_streak: number;
  longest_streak: number;
};

function ProfilePage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [showSecurity, setShowSecurity] = useState(false);

  const { data: me, isLoading } = useQuery({
    queryKey: ["me-full-profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select(
          "id,username,display_name,avatar_url,bio,plan,honor_score,current_streak,longest_streak",
        )
        .eq("id", u.user.id)
        .maybeSingle();
      return { user: u.user, profile: data as Profile | null };
    },
  });

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ["ai-usage"],
    queryFn: () => getUsage(),
  });
  const plan = planFor(usage?.plan ?? me?.profile?.plan);

  const { data: counts, isLoading: countsLoading } = useQuery({
    queryKey: ["profile-counts"],
    queryFn: async () => {
      const [mats, sets, atts, posts] = await Promise.all([
        supabase.from("materials").select("id", { count: "exact", head: true }),
        supabase.from("study_sets").select("id", { count: "exact", head: true }),
        supabase.from("attempts").select("id", { count: "exact", head: true }),
        supabase.from("posts").select("id", { count: "exact", head: true }),
      ]);
      return {
        materials: mats.count ?? 0,
        sets: sets.count ?? 0,
        attempts: atts.count ?? 0,
        posts: posts.count ?? 0,
      };
    },
  });

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (me?.profile) {
      setDisplayName(
        me.profile.display_name ??
          (me.user.user_metadata?.display_name as string | undefined) ??
          "",
      );
      setBio(me.profile.bio ?? "");
    }
  }, [me]);

  if (isLoading || !me?.user) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const p = me.profile ?? null;
  const isPro = (usage?.plan ?? p?.plan) && (usage?.plan ?? p?.plan) !== "free";
  const honor = p?.honor_score ?? 0;
  const honorPct = Math.min(100, Math.round((honor / 10000) * 100));
  const streak = p?.current_streak ?? 0;
  const longest = p?.longest_streak ?? 0;

  const displayed = displayName.trim() || me.user.email?.split("@")[0] || "Student";

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() || null, bio: bio.trim() || null })
      .eq("id", me.user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    setEditing(false);
    qc.invalidateQueries({ queryKey: ["me-full-profile"] });
  };

  const logout = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.navigate({ to: "/auth", replace: true });
  };

  const avatarInitial = displayed.charAt(0).toUpperCase();

  return (
    <div className="space-y-6 animate-fade-up">
      {/* ==== Identity card ==== */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 20% 0%, oklch(0.85 0.18 96 / 0.35), transparent 55%), radial-gradient(circle at 90% 100%, oklch(0.55 0.15 260 / 0.4), transparent 60%)",
          }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="relative shrink-0">
            <div className="h-24 w-24 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-bold text-3xl overflow-hidden ring-2 ring-primary/40">
              {p?.avatar_url ? (
                <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                avatarInitial
              )}
            </div>
            {isPro && (
              <span className="absolute -bottom-1 -right-1 rounded-full bg-background p-1 shadow-elev-2">
                <Crown className="h-4 w-4" style={{ color: "var(--gold-3)" }} />
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {!editing ? (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  {isPro ? (
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight gold-name inline-flex items-center gap-2">
                      {displayed}
                      <Sparkles className="h-4 w-4 gold-sparkle" />
                    </h1>
                  ) : (
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{displayed}</h1>
                  )}
                  {isPro && (
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                      style={{
                        background: "linear-gradient(135deg,var(--gold-2),var(--gold-3))",
                        color: "oklch(0.2 0.05 60)",
                      }}
                    >
                      Pro
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {p?.username ? (
                    <>@{p.username}</>
                  ) : (
                    <span className="italic">no username yet</span>
                  )}
                  <span className="mx-1.5">·</span>
                  {me.user.email}
                </p>
                {p?.bio && (
                  <p className="mt-3 text-sm text-foreground/90 whitespace-pre-wrap">{p.bio}</p>
                )}
                <button
                  onClick={() => setEditing(true)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-background/60 px-3 py-1.5 text-xs font-medium hover:border-primary/40 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit profile
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display name"
                  maxLength={80}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
                />
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="A short bio (max 200 chars)"
                  maxLength={200}
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 resize-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={save}
                    disabled={saving}
                    className="ripple inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:shadow-glow disabled:opacity-50"
                  >
                    {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==== Score tray (streak, honor, credits) ==== */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 stagger">
        <StatCard
          icon={Flame}
          tone="orange"
          label="Study streak"
          value={`${streak} ${streak === 1 ? "day" : "days"}`}
          sub={`Longest: ${longest}`}
        />
        <StatCard
          icon={Trophy}
          tone="gold"
          label="Honor score"
          value={honor.toLocaleString()}
          sub={`of 10,000  ·  ${honorPct}%`}
          progress={honorPct}
        />
        {usageLoading ? (
          <StatCardSkeleton />
        ) : (
          <StatCard
            icon={Zap}
            tone="primary"
            label="AI credits"
            value={usage ? `${usage.remaining}` : "—"}
            sub={`left of ${usage?.limit ?? "—"} · ${plan.name}`}
            progress={
              usage && usage.limit > 0 ? 100 - Math.round((usage.used / usage.limit) * 100) : 0
            }
            href="/billing"
          />
        )}
      </section>

      {/* ==== Activity grid ==== */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
          Activity
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger">
          {countsLoading ? (
            <>
              <MiniStatSkeleton />
              <MiniStatSkeleton />
              <MiniStatSkeleton />
              <MiniStatSkeleton />
            </>
          ) : (
            <>
              <MiniStat icon={BookOpenCheck} label="Materials" value={counts?.materials ?? 0} />
              <MiniStat icon={GraduationCap} label="Sets" value={counts?.sets ?? 0} />
              <MiniStat icon={Trophy} label="Exam runs" value={counts?.attempts ?? 0} />
              <MiniStat icon={Heart} label="Posts" value={counts?.posts ?? 0} />
            </>
          )}
        </div>
      </section>

      {/* ==== Actions ==== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Actions
          </h2>
          <button
            onClick={() => resetOnboarding()}
            className="text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            <Sparkles className="h-3 w-3" /> Replay welcome tour
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setShowSecurity((v) => !v)}
            className="surface-interactive p-5 group flex items-center gap-4 text-left"
          >
            <div className="h-11 w-11 rounded-2xl bg-primary/12 text-primary flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">Account & security</div>
              <div className="text-xs text-muted-foreground">
                Take a break, change password, activity log
              </div>
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
              {showSecurity ? "Hide" : "Open"}
            </span>
          </button>
          <Link to="/settings" className="surface-interactive p-5 group flex items-center gap-4">
            <div className="h-11 w-11 rounded-2xl bg-primary/12 text-primary flex items-center justify-center">
              <SettingsIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">Settings</div>
              <div className="text-xs text-muted-foreground">Voice, notifications, preferences</div>
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
              Open →
            </span>
          </Link>
          <Link to="/billing" className="surface-interactive p-5 group flex items-center gap-4">
            <div className="h-11 w-11 rounded-2xl bg-primary/12 text-primary flex items-center justify-center">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">Billing & plan</div>
              <div className="text-xs text-muted-foreground">
                You're on {plan.name}
                {isPro ? " ✨" : ""}
              </div>
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
              Manage →
            </span>
          </Link>
          <button
            onClick={logout}
            className="surface-interactive p-5 group flex items-center gap-4 text-left"
          >
            <div className="h-11 w-11 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center">
              <LogOut className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">Sign out</div>
              <div className="text-xs text-muted-foreground">End this session on this device</div>
            </div>
          </button>
        </div>
      </section>

      {showSecurity && <SecurityPanel email={me.user.email ?? ""} />}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  progress,
  tone,
  href,
}: {
  icon: typeof UserIcon;
  label: string;
  value: string;
  sub: string;
  progress?: number;
  tone: "orange" | "gold" | "primary";
  href?: string;
}) {
  const toneStyles: Record<string, string> = {
    orange: "text-orange-400 bg-orange-400/10",
    gold: "text-[color:var(--gold-3)] bg-[oklch(0.35_0.1_90/0.2)]",
    primary: "text-primary bg-primary/15",
  };
  const Inner = (
    <div className="surface p-5 h-full">
      <div className="flex items-center gap-2">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${toneStyles[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
      {typeof progress === "number" && (
        <div className="mt-3 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
  if (href) return <Link to={href as "/billing"}>{Inner}</Link>;
  return Inner;
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserIcon;
  label: string;
  value: number | string;
}) {
  return (
    <div className="surface p-4 text-center">
      <Icon className="h-4 w-4 text-primary mx-auto" />
      <div className="mt-2 text-lg font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function SecurityPanel({ email }: { email: string }) {
  const qc = useQueryClient();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [changing, setChanging] = useState(false);
  const [breakDays, setBreakDays] = useState(7);
  const [taking, setTaking] = useState(false);

  const { data: events = [] } = useQuery({
    queryKey: ["account-events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("account_events")
        .select("id,event_type,detail,created_at")
        .order("created_at", { ascending: false })
        .limit(15);
      return data ?? [];
    },
  });

  const logEvent = async (event_type: string, detail?: string) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase.from("account_events").insert({
      user_id: u.user.id,
      event_type,
      detail: detail ?? null,
      user_agent: navigator.userAgent,
    });
    qc.invalidateQueries({ queryKey: ["account-events"] });
  };

  const changePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Use at least 8 characters");
    if (pw !== pw2) return toast.error("Passwords don't match");
    setChanging(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setChanging(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    setPw("");
    setPw2("");
    await logEvent("password_changed");
  };

  const sendReset = async () => {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) return toast.error(error.message);
    toast.success("Reset link sent to your email");
  };

  const takeBreak = async () => {
    setTaking(true);
    await logEvent("break_started", `${breakDays} days`);
    setTaking(false);
    toast.success(`Break noted — we'll ease notifications for ${breakDays} days.`);
  };

  const deleteAccount = async () => {
    if (!confirm("This will sign you out and mark your account for deletion. Continue?")) return;
    await logEvent("account_delete_requested");
    toast.success("Deletion requested. Support will follow up by email.");
  };

  return (
    <div className="space-y-4 animate-fade-up">
      <section className="glass p-6">
        <h2 className="text-[13px] font-semibold flex items-center gap-2">
          <Coffee className="h-4 w-4 text-primary" /> Take a break
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Pause streaks and notifications for a while. Your data stays safe.
        </p>
        <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-end">
          <label className="text-[11px] font-medium text-muted-foreground flex-1">
            Duration ({breakDays} days)
            <input
              type="range"
              min={1}
              max={30}
              value={breakDays}
              onChange={(e) => setBreakDays(Number(e.target.value))}
              className="mt-2 w-full accent-[var(--color-primary)]"
            />
          </label>
          <button
            onClick={takeBreak}
            disabled={taking}
            className="ripple rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:shadow-glow disabled:opacity-50"
          >
            {taking && <Loader2 className="inline h-4 w-4 mr-1 animate-spin" />} Start break
          </button>
        </div>
      </section>

      <section className="glass p-6">
        <h2 className="text-[13px] font-semibold flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" /> Change password
        </h2>
        <form onSubmit={changePw} className="mt-4 grid sm:grid-cols-2 gap-3">
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="New password"
            autoComplete="new-password"
            className="rounded-xl border border-input bg-background/60 px-3 py-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
          />
          <input
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            placeholder="Confirm password"
            autoComplete="new-password"
            className="rounded-xl border border-input bg-background/60 px-3 py-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
          />
          <button
            type="submit"
            disabled={changing}
            className="sm:col-span-2 ripple rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:shadow-glow disabled:opacity-50"
          >
            {changing && <Loader2 className="inline h-4 w-4 mr-1 animate-spin" />} Update password
          </button>
        </form>
        <button
          onClick={sendReset}
          className="mt-3 text-[11px] text-primary hover:underline inline-flex items-center gap-1"
        >
          <Mail className="h-3.5 w-3.5" /> Email me a reset link instead
        </button>
      </section>

      <section className="glass p-6">
        <h2 className="text-[13px] font-semibold flex items-center gap-2">
          <History className="h-4 w-4 text-primary" /> Account activity
        </h2>
        {events.length === 0 ? (
          <div className="mt-3 text-xs text-muted-foreground">No events yet.</div>
        ) : (
          <ul className="mt-3 divide-y divide-border/60">
            {events.map((e) => (
              <li key={e.id} className="py-2.5 flex items-start gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium">{formatEvent(e.event_type)}</div>
                  {e.detail && <div className="text-[11px] text-muted-foreground">{e.detail}</div>}
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(e.created_at).toLocaleString()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[22px] border border-destructive/30 bg-destructive/5 p-6 backdrop-blur">
        <h2 className="text-[13px] font-semibold flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4" /> Danger zone
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Request account deletion. Contents will be permanently removed.
        </p>
        <button
          onClick={deleteAccount}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-destructive/40 bg-background px-3 py-1.5 text-[11px] font-medium text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" /> Request deletion
        </button>
      </section>
    </div>
  );
}

function formatEvent(t: string) {
  const map: Record<string, string> = {
    password_changed: "Password changed",
    break_started: "Break started",
    account_delete_requested: "Deletion requested",
    login: "Signed in",
  };
  return map[t] ?? t.replace(/_/g, " ");
}
