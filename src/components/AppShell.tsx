import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import {
  LayoutDashboard,
  FolderOpen,
  Upload,
  Settings,
  LogOut,
  Menu,
  X,
  BookOpenCheck,
  ListChecks,
  GraduationCap,
  CreditCard,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LumioWordmark } from "@/components/Logo";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "main" },
  { to: "/library", label: "Library", icon: FolderOpen, group: "main" },
  { to: "/upload", label: "Upload", icon: Upload, group: "main" },
  { to: "/study", label: "Study", icon: BookOpenCheck, group: "learn" },
  { to: "/tests", label: "Take a test", icon: ListChecks, group: "learn" },
  { to: "/exams", label: "Take an exam", icon: GraduationCap, group: "learn" },
  { to: "/billing", label: "Billing", icon: CreditCard, group: "account" },
  { to: "/settings", label: "Settings", icon: Settings, group: "account" },
] as const;

const GROUP_LABELS: Record<string, string> = {
  main: "Library",
  learn: "Learn",
  account: "Account",
};

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar px-5 py-7 sticky top-0 h-screen">
        <LumioWordmark to="/dashboard" />
        <nav className="mt-8 flex flex-col gap-5">
          {(Object.keys(GROUP_LABELS) as Array<keyof typeof GROUP_LABELS>).map((g) => (
            <div key={g}>
              <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                {GROUP_LABELS[g]}
              </div>
              <div className="flex flex-col gap-0.5">
                {NAV.filter((n) => n.group === g).map(({ to, label, icon: Icon }) => {
                  const active = pathname === to || pathname.startsWith(to + "/");
                  return (
                    <Link
                      key={to}
                      to={to}
                      className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ripple ${
                        active
                          ? "bg-primary-soft text-foreground shadow-elev-1"
                          : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 transition-transform duration-200 group-hover:scale-110 ${active ? "text-primary" : ""}`}
                      />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <button
          onClick={handleSignOut}
          className="mt-auto flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors ripple"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 h-14 bg-sidebar/95 backdrop-blur border-b border-border">
        <LumioWordmark to="/dashboard" />
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-2 rounded-md hover:bg-sidebar-accent transition-colors"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="lg:hidden fixed inset-0 top-14 z-30 bg-sidebar animate-fade-up">
          <nav className="flex flex-col p-4 gap-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-foreground hover:bg-sidebar-accent"
              >
                <Icon className="h-5 w-5" /> {label}
              </Link>
            ))}
            <button
              onClick={handleSignOut}
              className="mt-3 flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-muted-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="h-5 w-5" /> Sign out
            </button>
          </nav>
        </div>
      )}

      <main className="flex-1 min-w-0 pt-14 lg:pt-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
