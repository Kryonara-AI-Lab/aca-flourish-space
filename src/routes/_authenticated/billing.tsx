import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PLANS, planFor, type PlanId } from "@/lib/plans";
import { getUsage } from "@/lib/exam.functions";
import { Check, Loader2, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({ meta: [{ title: "Billing — Spoude" }] }),
  component: Billing,
});

function Billing() {
  const qc = useQueryClient();
  const { data: usage, isLoading } = useQuery({
    queryKey: ["ai-usage"],
    queryFn: () => getUsage(),
  });
  const [switching, setSwitching] = useState<PlanId | null>(null);

  const currentPlan = planFor(usage?.plan);
  const pct =
    usage && usage.limit > 0 ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0;

  const upgrade = async (id: PlanId) => {
    setSwitching(id);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setSwitching(null);
      return toast.error("Sign in first");
    }
    const { error } = await supabase.from("profiles").update({ plan: id }).eq("id", u.user.id);
    setSwitching(null);
    if (error) return toast.error(error.message);
    toast.success(`Switched to ${PLANS[id].name}`);
    qc.invalidateQueries({ queryKey: ["ai-usage"] });
  };

  return (
    <div className="space-y-10 animate-fade-up">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Billing & plan</h1>
        <p className="mt-1 text-muted-foreground">Manage your subscription and AI usage.</p>
      </header>

      <section className="surface p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Current plan
            </div>
            <div className="mt-1 flex items-center gap-2">
              <h2 className="text-2xl font-bold">{currentPlan.name}</h2>
              {currentPlan.id !== "free" && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary-soft text-foreground font-medium">
                  Active
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {currentPlan.price}{" "}
              <span className="text-muted-foreground/70">{currentPlan.priceNote}</span>
            </p>
          </div>
          <div className="sm:min-w-[280px] sm:max-w-sm w-full">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground inline-flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-primary" /> AI usage this month
              </span>
              <span className="font-medium">
                {isLoading ? "…" : `${usage?.used ?? 0} / ${usage?.limit ?? 0}`}
              </span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Resets on the 1st of each month
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Plans</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {(Object.keys(PLANS) as PlanId[]).map((id) => {
            const p = PLANS[id];
            const current = usage?.plan === id;
            return (
              <div
                key={id}
                className={`relative rounded-2xl border bg-card p-6 transition-all ${
                  p.highlight
                    ? "border-primary/60 shadow-elev-2"
                    : "border-border shadow-elev-1 hover:shadow-elev-2"
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary text-primary-foreground shadow-elev-1">
                    <Sparkles className="h-3 w-3" /> Most popular
                  </span>
                )}
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight">{p.price}</span>
                  <span className="text-xs text-muted-foreground">{p.priceNote}</span>
                </div>
                <ul className="mt-5 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <button
                  disabled={current || switching === id}
                  onClick={() => upgrade(id)}
                  className={`ripple mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                    current
                      ? "bg-secondary text-muted-foreground cursor-default"
                      : p.highlight
                        ? "bg-primary text-primary-foreground hover:shadow-glow"
                        : "border border-border bg-card hover:border-primary/40"
                  }`}
                >
                  {switching === id && <Loader2 className="h-4 w-4 animate-spin" />}
                  {current ? "Current plan" : id === "free" ? "Downgrade" : "Upgrade"}
                </button>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted-foreground text-center">
          Pricing is a preview — payments are not yet processed. You can switch freely to test
          limits.
        </p>
      </section>
    </div>
  );
}
