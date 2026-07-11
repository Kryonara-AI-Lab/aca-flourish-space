import { Link, useRouterState } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import {
  FolderOpen,
  Settings,
  BookOpenCheck,
  GraduationCap,
  CreditCard,
  Home,
  Plus,
  User,
  X,
  Wifi,
  Search,
  Bell,
  Sun,
  Moon,
} from "lucide-react";
import { SpoudeMark, SpoudeWordmark } from "@/components/Logo";
import { useQuery } from "@tanstack/react-query";
import { auth } from "@/lib/firebase";
import { useTheme } from "@/lib/theme";
import { Onboarding } from "@/components/Onboarding";

type NavItem = {
  to: "/spoude" | "/library" | "/study" | "/exams" | "/billing" | "/settings" | "/profile";
  label: string;
  icon: typeof Home;
  group: "learn" | "library" | "account";
};

const TRAY_NAV: NavItem[] = [
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
  useEffect(() => {
    setTray(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background lumio-paper flex flex-col">
      {/* ==== Desktop top bar (MySchool-style) ==== */}
      <DesktopTopBar />

      <div className="flex-1 flex min-h-0">
        {/* Desktop sidebar */}
        <DesktopSidebar pathname={pathname} />

        {/* Content */}
        <main className="flex-1 min-w-0 pt-14 lg:pt-0 pb-24 lg:pb-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-8">{children}</div>
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

      {/* First-visit welcome + tips (mounted once, self-hides) */}
      <Onboarding />
    </div>
  );
}

function DesktopTopBar() {
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: async () => auth.currentUser,
  });
  const name = user?.displayName ?? user?.email?.split("@")[0] ?? "there";
  return (
    <header className="pc-topbar hidden lg:flex sticky top-0 z-30 items-center justify-between px-6 h-12">
      <div className="flex items-center gap-4">
        <SpoudeWordmark to="/spoude" />
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
          Study workspace
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden xl:flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 w-72 backdrop-blur">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            placeholder="Search Spoude…"
            className="w-full bg-transparent outline-none text-xs placeholder:text-muted-foreground/70"
          />
        </div>
        <ThemeToggle />
        <button
          className="p-1.5 rounded-full hover:bg-sidebar-accent text-muted-foreground transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>
        <Link
          to="/profile"
          className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-sidebar-accent transition-colors"
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
  const [now, setNow] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  );
  useEffect(() => {
    const t = setInterval(
      () => setNow(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })),
      1000 * 30,
    );
    return () => clearInterval(t);
  }, []);
  return (
    <footer className="pc-statusbar hidden lg:flex items-center justify-between px-5 h-6">
      <div className="flex items-center gap-4">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_currentColor]" />
          Ready
        </span>
        <span>Spoude v1.0</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="inline-flex items-center gap-1">
          <Wifi className="h-3 w-3" /> Online
        </span>
        <span>{now}</span>
      </div>
    </footer>
  );
}

function DesktopSidebar({ pathname }: { pathname: string }) {
  const items: NavItem[] = [
    { to: "/spoude", label: "Home", icon: Home, group: "library" },
    ...TRAY_NAV,
    { to: "/profile", label: "Profile", icon: User, group: "account" },
  ];
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border/60 bg-sidebar backdrop-blur-xl px-4 py-6 sticky top-12 h-[calc(100vh-3rem-1.5rem)]">
      <nav className="flex flex-col gap-5">
        {(["library", "learn", "account"] as const).map((g) => (
          <div key={g}>
            <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              {GROUP_LABELS[g]}
            </div>
            <div className="flex flex-col gap-0.5">
              {items
                .filter((n) => n.group === g)
                .map(({ to, label, icon: Icon }) => {
                  const active = pathname === to || pathname.startsWith(to + "/");
                  return (
                    <Link
                      key={to}
                      to={to}
                      className={`group flex items-center gap-3 px-3 py-2 rounded-full text-[13px] font-medium transition-all ripple ${
                        active
                          ? "bg-primary/12 text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--color-primary)_35%,transparent)]"
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
  const { theme, toggle } = useTheme();
  return (
    <div className="lg:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 h-14 bg-background/75 backdrop-blur-xl border-b border-border/70">
      <div className="flex items-center gap-2">
        <SpoudeMark size={24} />
        <span
          className="font-bold text-lg tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Spoude
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <Link
          to="/spoude"
          className="p-2 rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}

function MobileBottomNav({ pathname, onPlus }: { pathname: string; onPlus: () => void }) {
  const homeActive = pathname === "/spoude";
  const profileActive = pathname.startsWith("/profile");
  return (
    <div className="lg:hidden fixed bottom-4 inset-x-4 z-40 pointer-events-none">
      <nav className="pointer-events-auto mx-auto max-w-sm h-16 rounded-full border border-border/70 bg-background/70 backdrop-blur-2xl shadow-elev-2 grid grid-cols-3 items-center px-6">
        <Link
          to="/spoude"
          className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${homeActive ? "text-primary" : "text-muted-foreground"}`}
        >
          <Home className="h-5 w-5" strokeWidth={homeActive ? 2.4 : 1.8} />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <div className="flex justify-center">
          <button
            onClick={onPlus}
            aria-label="Open menu"
            className="fab-plus -mt-8 h-14 w-14 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          >
            <Plus className="h-6 w-6" strokeWidth={2.6} />
          </button>
        </div>
        <Link
          to="/profile"
          className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${profileActive ? "text-primary" : "text-muted-foreground"}`}
        >
          <User className="h-5 w-5" strokeWidth={profileActive ? 2.4 : 1.8} />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </nav>
    </div>
  );
}

function MobileTray({ onClose }: { onClose: () => void }) {
  return (
    <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end animate-fade-up">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-md"
      />
      <div className="relative glass-strong rounded-t-[28px] p-5 pb-10">
        <div className="mx-auto h-1.5 w-10 rounded-full bg-muted-foreground/40 mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Jump to
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {TRAY_NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border/70 bg-background/40 backdrop-blur-md hover:border-primary/40 hover:bg-background/60 active:scale-95 transition-all"
            >
              <div className="h-10 w-10 rounded-2xl bg-primary/12 text-primary flex items-center justify-center">
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

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="p-1.5 rounded-full hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
