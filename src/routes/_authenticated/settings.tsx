import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldCheck, ShieldOff, Loader2, Mail, User as UserIcon, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Lumio" }] }),
  component: Settings,
});

function Settings() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [factorId, setFactorId] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollData, setEnrollData] = useState<{ factorId: string; qr: string; secret: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [loadingFactors, setLoadingFactors] = useState(true);

  const refreshFactors = async () => {
    setLoadingFactors(true);
    const { data } = await supabase.auth.mfa.listFactors();
    const verified = data?.totp?.find((f) => f.status === "verified");
    setFactorId(verified?.id ?? null);
    setLoadingFactors(false);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      setName((data.user?.user_metadata?.display_name as string | undefined) ?? "");
    });
    refreshFactors();
  }, []);

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingName(true);
    const { error } = await supabase.auth.updateUser({ data: { display_name: name.trim() } });
    setSavingName(false);
    if (error) toast.error(error.message); else toast.success("Profile updated");
  };

  const startEnroll = async () => {
    setEnrolling(true);
    try {
      // Clean up any unverified factors first
      const { data: list } = await supabase.auth.mfa.listFactors();
      for (const f of list?.totp ?? []) {
        if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Lumio TOTP" });
      if (error) throw error;
      setEnrollData({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start enrollment");
    } finally {
      setEnrolling(false);
    }
  };

  const confirmEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollData) return;
    if (verifyCode.length !== 6) { toast.error("Enter the 6-digit code"); return; }
    setEnrolling(true);
    try {
      const { data: ch, error: cErr } = await supabase.auth.mfa.challenge({ factorId: enrollData.factorId });
      if (cErr) throw cErr;
      const { error } = await supabase.auth.mfa.verify({
        factorId: enrollData.factorId,
        challengeId: ch.id,
        code: verifyCode,
      });
      if (error) throw error;
      toast.success("Two-factor authentication enabled");
      setEnrollData(null);
      setVerifyCode("");
      await refreshFactors();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setEnrolling(false);
    }
  };

  const disable = async () => {
    if (!factorId) return;
    if (!confirm("Turn off two-factor authentication?")) return;
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) { toast.error(error.message); return; }
    toast.success("Two-factor authentication disabled");
    await refreshFactors();
  };

  return (
    <div className="max-w-3xl space-y-8 animate-fade-up">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your profile and security.</p>
      </header>

      {/* Profile */}
      <section className="surface p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2"><UserIcon className="h-4 w-4 text-primary" /> Profile</h2>
        <form onSubmit={saveName} className="mt-4 space-y-4">
          <div>
            <span className="block text-xs font-medium text-muted-foreground mb-1.5">Email</span>
            <div className="flex items-center gap-2 rounded-lg border border-input bg-secondary/40 px-3 py-2.5">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{email}</span>
            </div>
          </div>
          <div>
            <span className="block text-xs font-medium text-muted-foreground mb-1.5">Display name</span>
            <input
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={savingName}
            className="ripple inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-semibold shadow-elev-1 hover:shadow-glow transition-all disabled:opacity-60"
          >
            {savingName && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </button>
        </form>
      </section>

      {/* Security */}
      <section className="surface p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Two-factor authentication</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add an extra layer of security with an authenticator app (Authy, 1Password, Google Authenticator…).
        </p>

        <div className="mt-5">
          {loadingFactors ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
          ) : factorId ? (
            <div className="flex items-center justify-between gap-4 rounded-lg bg-primary-soft px-4 py-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm font-medium">2FA is enabled</div>
                  <div className="text-xs text-muted-foreground">You'll be asked for a code at sign-in.</div>
                </div>
              </div>
              <button
                onClick={disable}
                className="ripple inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-destructive/40 hover:text-destructive transition-colors"
              >
                <ShieldOff className="h-3.5 w-3.5" /> Disable
              </button>
            </div>
          ) : enrollData ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-4 flex flex-col sm:flex-row items-center gap-5">
                <img src={enrollData.qr} alt="Scan with your authenticator app" className="h-40 w-40 rounded-md bg-white p-2" />
                <div className="flex-1 text-sm">
                  <p className="text-muted-foreground">Scan with your authenticator app, or enter this secret manually:</p>
                  <code className="mt-2 block text-xs bg-secondary rounded px-2 py-1.5 break-all font-mono">{enrollData.secret}</code>
                </div>
              </div>
              <form onSubmit={confirmEnroll} className="flex flex-col sm:flex-row gap-3">
                <input
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6-digit code"
                  className="flex-1 rounded-lg border border-input bg-card px-3 py-2.5 text-sm font-mono tracking-widest text-center outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 transition-all"
                />
                <button
                  type="submit"
                  disabled={enrolling}
                  className="ripple inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-semibold shadow-elev-1 hover:shadow-glow transition-all disabled:opacity-60"
                >
                  {enrolling && <Loader2 className="h-4 w-4 animate-spin" />} Verify & enable
                </button>
              </form>
            </div>
          ) : (
            <button
              onClick={startEnroll}
              disabled={enrolling}
              className="ripple inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-semibold shadow-elev-1 hover:shadow-glow transition-all disabled:opacity-60"
            >
              {enrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Set up 2FA
            </button>
          )}
        </div>
      </section>

      <section className="surface p-6 border-dashed">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Coming soon</span>
        </div>
        <h2 className="mt-2 text-lg font-semibold">Backup codes & passkeys</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          One-time recovery codes and passkey support are on the way.
        </p>
      </section>
    </div>
  );
}
