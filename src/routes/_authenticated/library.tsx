import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { auth } from "@/lib/firebase";
import { getMaterials, updateMaterial, deleteMaterial } from "@/lib/firestore-db";
import {
  BookOpen,
  FileText,
  GraduationCap,
  Download,
  Trash2,
  Loader2,
  Search,
  Upload as UploadIcon,
  Pin,
  PinOff,
  Globe,
  Lock as LockIcon,
  Copy,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { UploadDialog } from "@/components/UploadDialog";

const searchSchema = z.object({ type: z.enum(["notes", "homework", "exam"]).optional() });

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({ meta: [{ title: "Library — Spoude" }] }),
  validateSearch: searchSchema,
  component: Library,
});

const TABS = [
  {
    id: "notes",
    label: "Class notes",
    icon: BookOpen,
    spineTint: "from-amber-300/40 to-amber-500/10",
  },
  {
    id: "homework",
    label: "Homework",
    icon: FileText,
    spineTint: "from-emerald-300/40 to-emerald-500/10",
  },
  {
    id: "exam",
    label: "Past exams",
    icon: GraduationCap,
    spineTint: "from-violet-300/40 to-violet-500/10",
  },
] as const;

type Material = {
  id: string;
  title: string;
  subject: string | null;
  type: "notes" | "homework" | "exam";
  description: string | null;
  storage_path: string;
  file_name: string;
  file_size: number;
  mime_type: string | null;
  is_pinned: boolean;
  is_public: boolean;
  pinned_at: string | null;
  created_at: string;
};

function Library() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const qc = useQueryClient();
  const activeType = search.type ?? "notes";
  const [query, setQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [menu, setMenu] = useState<{ material: Material; x: number; y: number } | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["materials", activeType],
    enabled: !!auth.currentUser?.uid,
    queryFn: async () => {
      return (await getMaterials(auth.currentUser!.uid, activeType)) as Material[];
    },
  });

  const filtered = items.filter((m) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      m.title.toLowerCase().includes(q) ||
      (m.subject ?? "").toLowerCase().includes(q) ||
      (m.description ?? "").toLowerCase().includes(q)
    );
  });

  const pinned = filtered.filter((m) => m.is_pinned);
  const rest = filtered.filter((m) => !m.is_pinned);

  const download = async (m: Material) => {
    // For Firebase Cloud Storage, we can use getDownloadURL from client SDK (which is public by design or standard rules)
    // or simulate signed url by getting current download url.
    // Let's import getDownloadURL from firebase/storage
    const { ref, getDownloadURL } = await import("firebase/storage");
    const { storage } = await import("@/lib/firebase");
    try {
      const fileRef = ref(storage, m.storage_path);
      const url = await getDownloadURL(fileRef);
      window.open(url, "_blank");
    } catch (err) {
      toast.error("Could not generate download link");
    }
  };

  const togglePin = async (m: Material) => {
    const next = !m.is_pinned;
    try {
      await updateMaterial(m.id, {
        is_pinned: next,
        pinned_at: next ? new Date().toISOString() : null,
      });
      toast.success(next ? "Pinned to top" : "Unpinned");
      qc.invalidateQueries({ queryKey: ["materials"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to toggle pin");
    }
  };

  const togglePublic = async (m: Material) => {
    const next = !m.is_public;
    try {
      await updateMaterial(m.id, { is_public: next });
      toast.success(next ? "Now public — anyone with the link can view" : "Set back to private");
      qc.invalidateQueries({ queryKey: ["materials"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update public status");
    }
  };

  const copyPublicLink = async (m: Material) => {
    if (!m.is_public) {
      toast.error("Turn on public first");
      return;
    }
    const url = `${window.location.origin}/library?type=${m.type}#m=${m.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const remove = async (m: Material) => {
    if (!confirm(`Delete "${m.title}"?`)) return;
    try {
      const { ref, deleteObject } = await import("firebase/storage");
      const { storage } = await import("@/lib/firebase");
      const fileRef = ref(storage, m.storage_path);
      await deleteObject(fileRef).catch(() => {}); // ignore storage deletion failures if file not found
      await deleteMaterial(m.id);
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["materials"] });
      qc.invalidateQueries({ queryKey: ["materials-stats"] });
    } catch (error) {
      toast.error("Could not delete");
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your bookshelf — tap and hold a book for more.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 rounded-full border border-input bg-card px-3 py-2 flex-1 sm:w-72 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40 transition-all">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, subject…"
              className="w-full bg-transparent outline-none text-sm"
            />
          </div>
          <button
            onClick={() => setUploadOpen(true)}
            className="ripple inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-semibold shadow-elev-1 hover:shadow-glow transition-all"
          >
            <UploadIcon className="h-4 w-4" /> Upload
          </button>
        </div>
      </header>

      {uploadOpen && <UploadDialog defaultType={activeType} onClose={() => setUploadOpen(false)} />}

      {/* Shelf tabs */}
      <div className="flex gap-2 border-b border-border">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = activeType === id;
          return (
            <button
              key={id}
              onClick={() => navigate({ search: { type: id } })}
              className={`group relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon className="h-4 w-4" />
              {label}
              <span
                className={`absolute left-3 right-3 -bottom-px h-0.5 rounded-full bg-primary transition-transform duration-300 origin-left ${active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}
              />
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <BookshelfSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyShelf onUpload={() => setUploadOpen(true)} query={query} />
      ) : (
        <>
          {pinned.length > 0 && (
            <ShelfSection title="Pinned" count={pinned.length}>
              <Bookshelf
                items={pinned}
                onOpenMenu={setMenu}
                onTogglePin={togglePin}
                activeType={activeType}
              />
            </ShelfSection>
          )}
          <ShelfSection title={pinned.length ? "All books" : "Your shelf"} count={rest.length}>
            <Bookshelf
              items={rest}
              onOpenMenu={setMenu}
              onTogglePin={togglePin}
              activeType={activeType}
            />
          </ShelfSection>
        </>
      )}

      {menu && (
        <ContextMenu
          material={menu.material}
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          onDownload={() => {
            download(menu.material);
            setMenu(null);
          }}
          onDelete={() => {
            remove(menu.material);
            setMenu(null);
          }}
          onTogglePin={() => {
            togglePin(menu.material);
            setMenu(null);
          }}
          onTogglePublic={() => {
            togglePublic(menu.material);
            setMenu(null);
          }}
          onCopyLink={() => {
            copyPublicLink(menu.material);
            setMenu(null);
          }}
        />
      )}
    </div>
  );
}

function ShelfSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-3 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h2>
        <span className="text-[11px] text-muted-foreground">
          {count} {count === 1 ? "book" : "books"}
        </span>
      </div>
      {children}
    </section>
  );
}

/**
 * Wooden-shelf style grid. Each row of books sits on a subtle shelf-plank.
 */
function Bookshelf({
  items,
  onOpenMenu,
  onTogglePin,
  activeType,
}: {
  items: Material[];
  onOpenMenu: (v: { material: Material; x: number; y: number }) => void;
  onTogglePin: (m: Material) => void;
  activeType: "notes" | "homework" | "exam";
}) {
  const tint = TABS.find((t) => t.id === activeType)?.spineTint ?? "from-primary/40 to-primary/10";
  return (
    <div className="relative">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
        {items.map((m) => (
          <BookCard
            key={m.id}
            m={m}
            tint={tint}
            onOpenMenu={onOpenMenu}
            onTogglePin={onTogglePin}
          />
        ))}
      </div>
    </div>
  );
}

function BookCard({
  m,
  tint,
  onOpenMenu,
  onTogglePin,
}: {
  m: Material;
  tint: string;
  onOpenMenu: (v: { material: Material; x: number; y: number }) => void;
  onTogglePin: (m: Material) => void;
}) {
  const pressTimer = useRef<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const openMenuAt = (clientX: number, clientY: number) => {
    onOpenMenu({ material: m, x: clientX, y: clientY });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    pressTimer.current = window.setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(10);
      openMenuAt(touch.clientX, touch.clientY);
    }, 450);
  };
  const clearPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openMenuAt(e.clientX, e.clientY);
  };

  return (
    <div className="flex flex-col items-center">
      <div
        ref={ref}
        onContextMenu={onContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={clearPress}
        onTouchMove={clearPress}
        onTouchCancel={clearPress}
        className="book relative w-full aspect-[3/4] cursor-pointer select-none"
      >
        {/* Book body */}
        <div
          className={`absolute inset-0 rounded-l-md rounded-r-lg bg-gradient-to-b ${tint} border border-border shadow-elev-2 overflow-hidden`}
          style={{ transform: "perspective(600px) rotateY(-6deg)", transformOrigin: "left center" }}
        >
          {/* Spine highlight */}
          <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-b from-black/20 via-transparent to-black/25" />
          {/* Page edge */}
          <div className="absolute inset-y-1 right-0 w-1 rounded-sm bg-gradient-to-b from-white/70 via-white/40 to-white/70" />
          {/* Cover content */}
          <div className="relative h-full flex flex-col justify-between p-3">
            <div className="flex items-start justify-between gap-2">
              {m.subject && (
                <span className="text-[9px] uppercase tracking-widest font-semibold text-foreground/70 line-clamp-1">
                  {m.subject}
                </span>
              )}
              <div className="flex flex-col items-end gap-1">
                {m.is_pinned && (
                  <Pin className="h-3 w-3 text-primary drop-shadow" fill="currentColor" />
                )}
                {m.is_public && <Globe className="h-3 w-3 text-emerald-500" />}
              </div>
            </div>
            <div>
              <div className="text-[12px] font-bold leading-tight text-foreground line-clamp-3">
                {m.title}
              </div>
              <div className="mt-1.5 text-[9px] text-foreground/50 truncate">
                {(m.file_size / 1024).toFixed(0)} KB
              </div>
            </div>
          </div>
        </div>
        {/* Pin quick action (visible on hover for desktop) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(m);
          }}
          aria-label={m.is_pinned ? "Unpin" : "Pin"}
          className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-popover border border-border shadow-elev-1 opacity-0 group-hover:opacity-100 hover:opacity-100 hidden sm:flex items-center justify-center text-muted-foreground hover:text-primary transition-all"
        >
          {m.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
        </button>
      </div>
      {/* Shelf plank */}
      <div
        aria-hidden
        className="w-[110%] h-1.5 rounded-b-sm -mt-0.5"
        style={{
          background:
            "linear-gradient(to bottom, color-mix(in oklch, var(--color-foreground) 18%, transparent), color-mix(in oklch, var(--color-foreground) 4%, transparent))",
          boxShadow:
            "0 6px 12px -6px color-mix(in oklch, var(--color-foreground) 30%, transparent)",
        }}
      />
    </div>
  );
}

function ContextMenu({
  material: m,
  x,
  y,
  onClose,
  onDownload,
  onDelete,
  onTogglePin,
  onTogglePublic,
  onCopyLink,
}: {
  material: Material;
  x: number;
  y: number;
  onClose: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onTogglePublic: () => void;
  onCopyLink: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // Clamp position so menu never overflows viewport (mobile long-press)
  const width = 240;
  const height = 260;
  const left = Math.min(x, window.innerWidth - width - 12);
  const top = Math.min(y, window.innerHeight - height - 12);

  return (
    <>
      <div
        className="fixed inset-0 z-[70] bg-foreground/30 backdrop-blur-sm animate-fade-up"
        onClick={onClose}
      />
      <div
        ref={ref}
        className="fixed z-[80] w-60 rounded-2xl border border-border shadow-elev-3 overflow-hidden animate-fade-up"
        style={{ left, top, background: "var(--popover)" }}
      >
        <div className="px-3 py-2.5 border-b border-border/70 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[12px] font-semibold truncate">{m.title}</div>
            <div className="text-[10px] text-muted-foreground truncate">{m.file_name}</div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-0.5"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <MenuItem
          icon={m.is_pinned ? PinOff : Pin}
          label={m.is_pinned ? "Unpin" : "Pin to top"}
          onClick={onTogglePin}
        />
        <MenuItem icon={Download} label="Download" onClick={onDownload} />
        <MenuItem
          icon={m.is_public ? LockIcon : Globe}
          label={m.is_public ? "Make private" : "Make public"}
          hint={m.is_public ? "Anyone can view" : "Share with anyone"}
          onClick={onTogglePublic}
        />
        {m.is_public && <MenuItem icon={Copy} label="Copy public link" onClick={onCopyLink} />}
        <div className="h-px bg-border/70" />
        <MenuItem icon={Trash2} label="Delete" danger onClick={onDelete} />
      </div>
    </>
  );
}

function MenuItem({
  icon: Icon,
  label,
  hint,
  onClick,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] text-left transition-colors ${
        danger
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-sidebar-accent"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{label}</div>
        {hint && <div className="text-[10px] text-muted-foreground truncate">{hint}</div>}
      </div>
    </button>
  );
}

function EmptyShelf({ onUpload, query }: { onUpload: () => void; query: string }) {
  return (
    <div className="relative rounded-3xl border border-dashed border-border p-10 text-center overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, color-mix(in oklch, var(--color-foreground) 6%, transparent) 0 2px, transparent 2px 22px)",
          maskImage: "linear-gradient(to bottom, black, transparent)",
        }}
      />
      <div className="relative">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <BookOpen className="h-6 w-6 text-primary" />
        </div>
        <h3 className="mt-4 text-base font-semibold">
          {query ? "No matches" : "This shelf is empty"}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {query
            ? "Try a different search."
            : "Upload a document to place the first book on the shelf."}
        </p>
        {!query && (
          <button
            onClick={onUpload}
            className="ripple mt-5 inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-semibold shadow-elev-1 hover:shadow-glow transition-all"
          >
            <UploadIcon className="h-4 w-4" /> Upload your first
          </button>
        )}
      </div>
    </div>
  );
}

function BookshelfSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="w-full aspect-[3/4] rounded-l-md rounded-r-lg bg-muted animate-pulse" />
          <div className="w-[110%] h-1.5 -mt-0.5 rounded-b-sm bg-foreground/10" />
        </div>
      ))}
    </div>
  );
}
