import { useEffect, useState, useRef } from "react";
import { Bell, X, Check, Volume2, BookOpen, GraduationCap, Info } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  link?: string;
  type?: "exam" | "library" | "broadcast" | "general";
};

export function NotificationBell({ size = "desktop" }: { size?: "desktop" | "mobile" }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, "notifications"), where("user_id", "in", [user.uid, "all"]));

    const unsubscribe = onSnapshot(q, (snap) => {
      const list: NotificationItem[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as NotificationItem);
      });
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setNotifications(list);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    try {
      const batch = writeBatch(db);
      unread.forEach((n) => {
        batch.update(doc(db, "notifications", n.id), { read: true });
      });
      await batch.commit();
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark notifications read");
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark notification read");
    }
  };

  const IconType = ({ type }: { type?: string }) => {
    switch (type) {
      case "exam":
        return <GraduationCap className="h-4 w-4 text-violet-500" />;
      case "library":
        return <BookOpen className="h-4 w-4 text-emerald-500" />;
      case "broadcast":
        return <Volume2 className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-full hover:bg-sidebar-accent text-muted-foreground hover:text-foreground relative transition-colors cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className={size === "desktop" ? "h-4 w-4" : "h-5 w-5"} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive ring-2 ring-background animate-pulse" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border shadow-elev-3 bg-popover text-popover-foreground z-50 overflow-hidden animate-fade-up">
          <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-widest">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-border/50">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`p-4 flex gap-3 text-left transition-colors cursor-pointer ${
                    !n.read ? "bg-primary/5 hover:bg-primary/8" : "hover:bg-secondary/40"
                  }`}
                >
                  <div className="h-8 w-8 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    <IconType type={n.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-xs truncate">{n.title}</h4>
                      <span className="text-[9px] text-muted-foreground shrink-0">
                        {new Date(n.created_at).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                      {n.message}
                    </p>
                    {n.link && (
                      <Link
                        to={n.link}
                        onClick={() => setOpen(false)}
                        className="text-[10px] text-primary hover:underline font-bold mt-2 block"
                      >
                        View details
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
