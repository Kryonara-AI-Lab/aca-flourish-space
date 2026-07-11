import { cn } from "@/lib/utils";

export function Skel({ className }: { className?: string }) {
  return <div className={cn("skeleton-shimmer rounded-md", className)} />;
}

export function MetricSkeleton() {
  return (
    <div className="surface p-4">
      <div className="flex items-center justify-between">
        <Skel className="h-2.5 w-16" />
        <Skel className="h-3.5 w-3.5 rounded-full" />
      </div>
      <Skel className="mt-3 h-7 w-20" />
      <Skel className="mt-1.5 h-2.5 w-24" />
    </div>
  );
}

export function TileSkeleton({ big = false }: { big?: boolean }) {
  return (
    <div className="surface p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <Skel className="h-10 w-10 rounded-2xl" />
        <Skel className="h-4 w-4 rounded-full" />
      </div>
      <Skel className={cn("mt-4", big ? "h-4 w-28" : "h-3.5 w-24")} />
      <Skel className="mt-2 h-2.5 w-full" />
      <Skel className="mt-1.5 h-2.5 w-3/4" />
    </div>
  );
}

export function ActivityRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <Skel className="h-8 w-8 rounded-xl shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skel className="h-3 w-1/2" />
        <Skel className="h-2.5 w-1/3" />
      </div>
      <Skel className="h-4 w-4 rounded-full" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="surface p-5">
      <div className="flex items-center gap-2">
        <Skel className="h-8 w-8 rounded-lg" />
        <Skel className="h-2.5 w-24" />
      </div>
      <Skel className="mt-3 h-7 w-24" />
      <Skel className="mt-1.5 h-2.5 w-32" />
      <Skel className="mt-3 h-1.5 w-full rounded-full" />
    </div>
  );
}

export function MiniStatSkeleton() {
  return (
    <div className="surface p-4 flex flex-col items-center gap-2">
      <Skel className="h-4 w-4 rounded-full" />
      <Skel className="h-5 w-8" />
      <Skel className="h-2 w-14" />
    </div>
  );
}

/**
 * Empty state — one shared component so every "no data yet" surface looks the same.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "text-center flex flex-col items-center gap-3",
        compact ? "py-6 px-4" : "py-12 px-6",
      )}
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-shimmer" />
        <div className="relative h-12 w-12 rounded-2xl bg-primary/12 text-primary flex items-center justify-center">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="space-y-1 max-w-xs">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-[12px] text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
