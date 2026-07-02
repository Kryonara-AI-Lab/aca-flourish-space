import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import {
  LayoutDashboard,
  FolderOpen,
  Settings,
  BookOpenCheck,
  GraduationCap,
  CreditCard,
  Users,
  Home,
  Plus,
  User,
  X,
  Wifi,
  Search,
  Bell,
} from "lucide-react";
import { LumioMark, LumioWordmark } from "@/components/Logo";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type NavItem = {
  to:
    | "/lumio" | "/dashboard" | "/library" | "/study" | "/exams"
    | "/billing" | "/settings" | "/profile";
  label: string;
  icon: typeof Home;
  group: "learn" | "library" | "account";
};

const TRAY_NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "library" },
  { to: "/library", label: "Library", icon: FolderOpen, group: "library" },
  { to: "/study", label: "Study", icon: BookOpenCheck, group: "learn" },
  { to: "/exams", label: "Take an exam", icon: GraduationCap, group: "learn" },
  { to: "/billing", label: "Billing", icon: CreditCard, group: "account" },
  { to: "/settings", label: "Settings", icon: Settings, group: "account" },
];

const GROUP_LABELS: Record<string, string> = {
  library: "Library",
  learn: "Learn",
  account: "Account",
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [tray, setTray] = useState(false);
  useEffect(() => { setTray(false); }, [pathname]);

  return (
    <div className="min-h-screen bg-background lumio-paper flex flex-col">
      {/* ==== Desktop top bar (MySchool-style) ==== */}
      <DesktopTopBar />

      <div className="flex-1 flex min-h-0">
        {/* Desktop sidebar */}
        <DesktopSidebar pathname={pathname} />

        {/* Content */}
        <main className="flex-1 min-w-0 pt-14 lg:pt-0 pb-24 lg:pb-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>

      {/* ==== Desktop status bar ==== */}
      <DesktopStatusBar />

      {/* ==== Mobile Instagram-style header ==== */}
      <MobileHeader />

      {/* ==== Mobile bottom nav (3 buttons) ==== */}
      <MobileBottomNav pathname={pathname} onPlus={() => setTray(true)} />

      {/* Tray sheet */}
      {tray && <MobileTray onClose={() => setTray(false)} />}
    </div>
  );
}

function DesktopTopBar() {
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });
  const name = (user?.user_metadata?.display_name as string | undefined) ?? user?.email?.split("@")[0] ?? "there";
  return (
    <header className="pc-topbar hidden lg:flex sticky top-0 z-30 items-center justify-between px-6 h-12">
      <div className="flex items-center gap-4">
        <LumioWordmark to="/lumio" />
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Study workspace</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden xl:flex items-center gap-2 rounded-md border border-border bg-card/60 px-2.5 py-1.5 w-72">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input placeholder="Search Lumio…" className="w-full bg-transparent outline-none text-xs" />
        </div>
        <button className="p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </button>
        <Link
          to="/profile"
          className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-sidebar-accent transition-colors"
        >
          <div className="h-6 w-6 rounded-full bg-primary/20 text-primary text-[11px] font-semibold flex items-center justify-center">
            {name.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-medium">{name}</span>
        </Link>
      </div>
    </header>
  );
}

function DesktopStatusBar() {
  const [now, setNow] = useState<string>(() => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  useEffect(() => {
    const t = setInterval(() => setNow(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })), 1000 * 30);
    return () => clearInterval(t);
  }, []);
  return (
    <footer className="pc-statusbar hidden lg:flex items-center justify-between px-5 h-6">
      <div className="flex items-center gap-4">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_currentColor]" />
          Ready
        </span>
        <span>Lumio v1.0</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="inline-flex items-center gap-1"><Wifi className="h-3 w-3" /> Online</span>
        <span>{now}</span>
      </div>
    </footer>
  );
}

function DesktopSidebar({ pathname }: { pathname: string }) {
  const items: NavItem[] = [
    { to: "/lumio", label: "Home", icon: Home, group: "library" },
    ...TRAY_NAV,
    { to: "/profile", label: "Profile", icon: User, group: "account" },
  ];
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-sidebar/70 px-4 py-6 sticky top-12 h-[calc(100vh-3rem-1.5rem)]">
      <nav className="flex flex-col gap-5">
        {(["library", "learn", "account"] as const).map((g) => (
          <div key={g}>
            <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              {GROUP_LABELS[g]}
            </div>
            <div className="flex flex-col gap-0.5">
              {items.filter((n) => n.group === g).map(({ to, label, icon: Icon }) => {
                const active = pathname === to || pathname.startsWith(to + "/");
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ripple ${
                      active
                        ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_oklch(0.88_0.19_96/0.35)]"
                        : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

function MobileHeader() {
  return (
    <div className="lg:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 h-14 bg-background/90 backdrop-blur border-b border-border">
      <div className="flex items-center gap-2">
        <LumioMark size={24} />
        <span className="font-bold text-lg tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Lumio</span>
      </div>
      <Link to="/lumio" className="p-2 rounded-md text-muted-foreground hover:text-foreground" aria-label="Notifications">
        <Bell className="h-5 w-5" />
      </Link>
    </div>
  );
}

function MobileBottomNav({ pathname, onPlus }: { pathname: string; onPlus: () => void }) {
  const homeActive = pathname === "/lumio";
  const profileActive = pathname.startsWith("/profile");
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-[72px] bg-background/95 backdrop-blur border-t border-border">
      <div className="grid grid-cols-3 h-full items-center px-6">
        <Link to="/lumio" className={`flex flex-col items-center justify-center gap-0.5 ${homeActive ? "text-primary" : "text-muted-foreground"}`}>
          <Home className={`h-6 w-6 ${homeActive ? "fill-primary/20" : ""}`} strokeWidth={homeActive ? 2.4 : 1.8} />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <div className="flex justify-center">
          <button
            onClick={onPlus}
            aria-label="Open menu"
            className="fab-plus -mt-6 h-14 w-14 rounded-2xl flex items-center justify-center active:scale-95 transition-transform"
          >
            <Plus className="h-7 w-7" strokeWidth={2.6} />
          </button>
        </div>
        <Link to="/profile" className={`flex flex-col items-center justify-center gap-0.5 ${profileActive ? "text-primary" : "text-muted-foreground"}`}>
          <User className={`h-6 w-6`} strokeWidth={profileActive ? 2.4 : 1.8} />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  );
}

function MobileTray({ onClose }: { onClose: () => void }) {
  return (
    <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end animate-fade-up">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-card border-t border-border rounded-t-3xl p-5 pb-8">
        <div className="mx-auto h-1 w-10 rounded-full bg-muted-foreground/40 mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Jump to</h3>
          <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {TRAY_NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-background/60 hover:border-primary/40 active:scale-95 transition-all"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-medium text-center">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}