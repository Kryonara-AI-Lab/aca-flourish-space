import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft,
  ShieldCheck,
  Coffee,
  KeyRound,
  History,
  Trash2,
  AlertTriangle,
  Loader2,
  Mail,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Account & security — Lumio" }] }),
  component: AccountPage,
});

function AccountPage() {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [changing, setChanging] = useState(false);
  const [breakDays, setBreakDays] = useState(7);
  const [taking, setTaking] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  const { data: events = [] } = useQuery({
    queryKey: ["account-events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("account_events")
        .select("id,event_type,detail,created_at,ip,user_agent")
        .order("created_at", { ascending: false })
        .limit(25);
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
    setPw(""); setPw2("");
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
    <div className="max-w-3xl space-y-8 animate-fade-up">
      <header className="flex items-center gap-3">
        <Link to="/profile" className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Account & security</h1>
          <p className="text-sm text-muted-foreground">Special actions for your account.</p>
        </div>
      </header>

      {/* Take a break */}
      <section className="surface p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Coffee className="h-4 w-4 text-primary" /> Take a break</h2>
        <p className="mt-1 text-sm text-muted-foreground">Pause streaks and notifications for a while. Your data stays safe.</p>
        <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-end">
          <label className="text-xs font-medium text-muted-foreground flex-1">
            Duration ({breakDays} days)
            <input type="range" min={1} max={30} value={breakDays} onChange={(e) => setBreakDays(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-primary)]" />
          </label>
          <button onClick={takeBreak} disabled={taking} className="ripple rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:shadow-glow disabled:opacity-50">
            {taking && <Loader2 className="inline h-4 w-4 mr-1 animate-spin" />} Start break
          </button>
        </div>
      </section>

      {/* Change password */}
      <section className="surface p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" /> Change password</h2>
        <form onSubmit={changePw} className="mt-4 grid sm:grid-cols-2 gap-3">
          <input
            type="password" value={pw} onChange={(e) => setPw(e.target.value)}
            placeholder="New password" autoComplete="new-password"
            className="rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
          />
          <input
            type="password" value={pw2} onChange={(e) => setPw2(e.target.value)}
            placeholder="Confirm password" autoComplete="new-password"
            className="rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
          />
          <button type="submit" disabled={changing} className="sm:col-span-2 ripple rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:shadow-glow disabled:opacity-50">
            {changing && <Loader2 className="inline h-4 w-4 mr-1 animate-spin" />} Update password
          </button>
        </form>
        <button onClick={sendReset} className="mt-3 text-xs text-primary hover:underline inline-flex items-center gap-1">
          <Mail className="h-3.5 w-3.5" /> Email me a reset link instead
        </button>
      </section>

      {/* 2FA quick link */}
      <section className="surface p-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Two-factor authentication</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage 2FA (TOTP) in Settings.</p>
        </div>
        <Link to="/settings" className="rounded-md border border-border px-3 py-2 text-xs font-medium hover:border-primary/40">Go to settings</Link>
      </section>

      {/* Login logs */}
      <section className="surface p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2"><History className="h-4 w-4 text-primary" /> Account activity</h2>
        <p className="mt-1 text-sm text-muted-foreground">Recent security events on your account.</p>
        {events.length === 0 ? (
          <div className="mt-4 text-sm text-muted-foreground">No events yet.</div>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {events.map((e) => (
              <li key={e.id} className="py-3 flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{formatEvent(e.event_type)}</div>
                  {e.detail && <div className="text-xs text-muted-foreground">{e.detail}</div>}
                  <div className="text-[11px] text-muted-foreground mt-0.5">{new Date(e.created_at).toLocaleString()}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Danger */}
      <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-destructive"><AlertTriangle className="h-4 w-4" /> Danger zone</h2>
        <p className="mt-1 text-sm text-muted-foreground">Request account deletion. Contents will be permanently removed.</p>
        <button onClick={deleteAccount} className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-background px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10">
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