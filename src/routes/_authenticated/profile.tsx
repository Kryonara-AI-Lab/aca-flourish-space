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
} from "lucide-react";
import { getUsage } from "@/lib/exam.functions";
import { planFor } from "@/lib/plans";
import { useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Lumio" }] }),
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

  const { data: me, isLoading } = useQuery({
    queryKey: ["me-full-profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("id,username,display_name,avatar_url,bio,plan,honor_score,current_streak,longest_streak")
        .eq("id", u.user.id)
        .maybeSingle();
      return { user: u.user, profile: (data as Profile | null) };
    },
  });

  const { data: usage } = useQuery({ queryKey: ["ai-usage"], queryFn: () => getUsage() });
  const plan = planFor(usage?.plan ?? me?.profile?.plan);

  const { data: counts } = useQuery({
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
      setDisplayName(me.profile.display_name ?? (me.user.user_metadata?.display_name as string | undefined) ?? "");
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
        <div className="absolute inset-0 opacity-40 pointer-events-none"
          style={{ background: "radial-gradient(circle at 20% 0%, oklch(0.85 0.18 96 / 0.35), transparent 55%), radial-gradient(circle at 90% 100%, oklch(0.55 0.15 260 / 0.4), transparent 60%)" }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="relative shrink-0">
            <div className="h-24 w-24 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-bold text-3xl overflow-hidden ring-2 ring-primary/40">
              {p?.avatar_url ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover" /> : avatarInitial}
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
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                      style={{ background: "linear-gradient(135deg,var(--gold-2),var(--gold-3))", color: "oklch(0.2 0.05 60)" }}>
                      Pro
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {p?.username ? <>@{p.username}</> : <span className="italic">no username yet</span>}
                  <span className="mx-1.5">·</span>
                  {me.user.email}
                </p>
                {p?.bio && <p className="mt-3 text-sm text-foreground/90 whitespace-pre-wrap">{p.bio}</p>}
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
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
        <StatCard
          icon={Zap}
          tone="primary"
          label="AI credits"
          value={usage ? `${usage.remaining}` : "—"}
          sub={`left of ${usage?.limit ?? "—"} · ${plan.name}`}
          progress={usage && usage.limit > 0 ? 100 - Math.round((usage.used / usage.limit) * 100) : 0}
          href="/billing"
        />
      </section>

      {/* ==== Activity grid ==== */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">Activity</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MiniStat icon={BookOpenCheck} label="Materials"  value={counts?.materials ?? "—"} />
          <MiniStat icon={GraduationCap}  label="Sets"       value={counts?.sets ?? "—"} />
          <MiniStat icon={Trophy}         label="Exam runs"  value={counts?.attempts ?? "—"} />
          <MiniStat icon={Heart}          label="Posts"      value={counts?.posts ?? "—"} />
        </div>
      </section>

      {/* ==== Actions ==== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link to="/account" className="surface-interactive p-5 group flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">Account & security</div>
            <div className="text-xs text-muted-foreground">Take a break, change password, 2FA, login logs</div>
          </div>
          <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Open →</span>
        </Link>
        <Link to="/settings" className="surface-interactive p-5 group flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <SettingsIcon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">Settings</div>
            <div className="text-xs text-muted-foreground">Voice, notifications, preferences</div>
          </div>
          <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Open →</span>
        </Link>
        <Link to="/billing" className="surface-interactive p-5 group flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <CreditCard className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">Billing & plan</div>
            <div className="text-xs text-muted-foreground">You're on {plan.name}{isPro ? " ✨" : ""}</div>
          </div>
          <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Manage →</span>
        </Link>
        <button
          onClick={logout}
          className="surface-interactive p-5 group flex items-center gap-4 text-left"
        >
          <div className="h-11 w-11 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center">
            <LogOut className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">Sign out</div>
            <div className="text-xs text-muted-foreground">End this session on this device</div>
          </div>
        </button>
      </section>
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
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
      {typeof progress === "number" && (
        <div className="mt-3 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <div className="h-full bg-primary transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
  if (href) return <Link to={href as "/billing"}>{Inner}</Link>;
  return Inner;
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof UserIcon; label: string; value: number | string }) {
  return (
    <div className="surface p-4 text-center">
      <Icon className="h-4 w-4 text-primary mx-auto" />
      <div className="mt-2 text-lg font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}