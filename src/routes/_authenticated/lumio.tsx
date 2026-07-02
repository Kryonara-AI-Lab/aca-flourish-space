import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  Heart,
  MessageCircle,
  Flag,
  Send,
  Search,
  Loader2,
  FileText,
  Sparkles,
  MoreHorizontal,
  RefreshCw,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/lumio")({
  head: () => ({ meta: [{ title: "Lumio — Community" }] }),
  component: LumioPage,
});

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

type Post = {
  id: string;
  user_id: string;
  content: string;
  material_id: string | null;
  created_at: string;
};

type PostWithMeta = Post & {
  author: Profile | null;
  likeCount: number;
  liked: boolean;
  commentCount: number;
  material?: { id: string; title: string } | null;
};

function LumioPage() {
  const qc = useQueryClient();
  const { data: me } = useQuery({
    queryKey: ["me-profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id,username,display_name,avatar_url")
        .eq("id", u.user.id)
        .maybeSingle();
      if (error) throw error;
      return (data as Profile | null) ?? { id: u.user.id, username: null, display_name: null, avatar_url: null };
    },
  });

  const needsUsername = me && !me.username;

  if (!me) {
    return (
      <div className="surface p-12 flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (needsUsername) return <UsernameSetup onDone={() => qc.invalidateQueries({ queryKey: ["me-profile"] })} />;

  return <Feed me={me} />;
}

function UsernameSetup({ onDone }: { onDone: () => void }) {
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);

  const valid = /^[a-z0-9_]{3,20}$/i.test(username);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return toast.error("Use 3–20 letters, numbers, or underscores");
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSaving(false); return; }
    const { error } = await supabase
      .from("profiles")
      .update({ username: username.toLowerCase() })
      .eq("id", u.user.id);
    setSaving(false);
    if (error) {
      if (error.code === "23505") return toast.error("That username is taken");
      return toast.error(error.message);
    }
    toast.success("Welcome to Lumio 👋");
    onDone();
  };

  return (
    <div className="max-w-md mx-auto animate-fade-up">
      <div className="surface p-8">
        <div className="h-12 w-12 rounded-full bg-primary-soft flex items-center justify-center mx-auto">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-center">Pick a username</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Other students will find you and mention you by this handle.
        </p>
        <form onSubmit={save} className="mt-6 space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40">
            <span className="text-muted-foreground text-sm">@</span>
            <input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
              placeholder="your_handle"
              className="w-full bg-transparent outline-none text-sm"
              maxLength={20}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">3–20 characters. Letters, numbers, underscores only.</p>
          <button
            type="submit"
            disabled={!valid || saving}
            className="ripple w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold shadow-elev-1 hover:shadow-glow transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}

function Feed({ me }: { me: Profile }) {
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [q, setQ] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const { data: posts = [], isLoading, refetch } = useQuery({
    queryKey: ["lumio-feed"],
    queryFn: async () => {
      const { data: rawPosts, error } = await supabase
        .from("posts")
        .select("id,user_id,content,material_id,created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      const rows = (rawPosts ?? []) as Post[];
      if (rows.length === 0) return [] as PostWithMeta[];
      const userIds = Array.from(new Set(rows.map((p) => p.user_id)));
      const postIds = rows.map((p) => p.id);
      const materialIds = Array.from(new Set(rows.map((p) => p.material_id).filter(Boolean))) as string[];
      const [profilesRes, likesRes, commentsRes, materialsRes] = await Promise.all([
        supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", userIds),
        supabase.from("post_likes").select("post_id,user_id").in("post_id", postIds),
        supabase.from("post_comments").select("post_id").in("post_id", postIds),
        materialIds.length ? supabase.from("materials").select("id,title").in("id", materialIds) : Promise.resolve({ data: [], error: null }),
      ]);
      const profiles = new Map<string, Profile>();
      (profilesRes.data ?? []).forEach((p: unknown) => {
        const pr = p as Profile;
        profiles.set(pr.id, pr);
      });
      const likesByPost = new Map<string, string[]>();
      (likesRes.data ?? []).forEach((l: unknown) => {
        const ll = l as { post_id: string; user_id: string };
        const arr = likesByPost.get(ll.post_id) ?? [];
        arr.push(ll.user_id);
        likesByPost.set(ll.post_id, arr);
      });
      const commentsByPost = new Map<string, number>();
      (commentsRes.data ?? []).forEach((c: unknown) => {
        const cc = c as { post_id: string };
        commentsByPost.set(cc.post_id, (commentsByPost.get(cc.post_id) ?? 0) + 1);
      });
      const materialsMap = new Map<string, { id: string; title: string }>();
      (materialsRes.data ?? []).forEach((m: unknown) => {
        const mm = m as { id: string; title: string };
        materialsMap.set(mm.id, mm);
      });

      return rows.map<PostWithMeta>((p) => {
        const likes = likesByPost.get(p.id) ?? [];
        return {
          ...p,
          author: profiles.get(p.user_id) ?? null,
          likeCount: likes.length,
          liked: likes.includes(me.id),
          commentCount: commentsByPost.get(p.id) ?? 0,
          material: p.material_id ? materialsMap.get(p.material_id) ?? null : null,
        };
      });
    },
  });

  const refresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 400);
  };

  // Simple pull-to-refresh on mobile
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let startY = 0; let pulling = false;
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 4) return;
      startY = e.touches[0].clientY; pulling = true;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!pulling) return;
      const dy = e.touches[0].clientY - startY;
      if (dy > 90) { pulling = false; refresh(); }
    };
    const onTouchEnd = () => { pulling = false; };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return posts;
    return posts.filter(
      (p) =>
        p.content.toLowerCase().includes(t) ||
        (p.author?.username ?? "").toLowerCase().includes(t) ||
        (p.author?.display_name ?? "").toLowerCase().includes(t),
    );
  }, [posts, q]);

  const createPost = async () => {
    const text = content.trim();
    if (!text) return;
    if (text.length > 500) return toast.error("Keep it under 500 characters");
    setPosting(true);
    const { error } = await supabase.from("posts").insert({ user_id: me.id, content: text });
    setPosting(false);
    if (error) return toast.error(error.message);
    setContent("");
    qc.invalidateQueries({ queryKey: ["lumio-feed"] });
  };

  return (
    <div ref={scrollRef} className="animate-fade-up max-w-2xl mx-auto space-y-5 pb-8">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Lumio feed
          </h1>
          <p className="mt-1 text-muted-foreground text-xs sm:text-sm">
            Signed in as <span className="text-foreground font-medium">@{me.username}</span> · pull down or tap refresh
          </p>
        </div>
        <button
          onClick={refresh}
          className="p-2.5 rounded-full border border-border bg-card hover:border-primary/40 active:scale-95 transition-all"
          aria-label="Refresh"
        >
          <RefreshCw className={`h-4 w-4 text-primary ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </header>

      <div className="surface p-4 space-y-3">
        <div className="flex gap-3">
          <Avatar profile={me} />
          <div className="flex-1 space-y-2">
            <textarea
              ref={composerRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What are you learning today?"
              rows={3}
              maxLength={500}
              className="w-full resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 transition-all"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{content.length}/500</span>
              <button
                onClick={createPost}
                disabled={!content.trim() || posting}
                className="ripple inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold shadow-elev-1 hover:shadow-glow transition-all disabled:opacity-50"
              >
                {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search posts, users, or handles…"
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      {isLoading ? (
        <div className="surface p-10 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="surface p-10 text-center text-sm text-muted-foreground">
          Nothing here yet — be the first to post.
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((p) => <PostCard key={p.id} post={p} me={me} />)}
        </ul>
      )}

      {/* Floating quick-compose FAB (mobile only, positioned above bottom nav) */}
      <button
        onClick={() => { composerRef.current?.focus(); composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }}
        className="lg:hidden fixed bottom-24 right-4 z-30 h-12 w-12 rounded-full fab-plus flex items-center justify-center active:scale-95 transition-transform"
        aria-label="New post"
      >
        <Plus className="h-5 w-5" strokeWidth={2.6} />
      </button>
    </div>
  );
}

function Avatar({ profile }: { profile: Profile | null }) {
  const initial = (profile?.display_name || profile?.username || "?").charAt(0).toUpperCase();
  return (
    <div className="h-10 w-10 rounded-full bg-primary-soft text-primary flex items-center justify-center font-semibold shrink-0 overflow-hidden">
      {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}

function PostCard({ post, me }: { post: PostWithMeta; me: Profile }) {
  const qc = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleLike = async () => {
    if (post.liked) {
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", me.id);
    } else {
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: me.id });
    }
    qc.invalidateQueries({ queryKey: ["lumio-feed"] });
  };

  const report = async () => {
    setMenuOpen(false);
    const reason = prompt("Why are you reporting this post?");
    if (!reason) return;
    const { error } = await supabase.from("post_reports").insert({ post_id: post.id, user_id: me.id, reason });
    if (error && error.code !== "23505") return toast.error(error.message);
    toast.success("Reported. Our team will review it.");
  };

  const remove = async () => {
    setMenuOpen(false);
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["lumio-feed"] });
  };

  const isMine = post.user_id === me.id;

  return (
    <li className="surface-interactive p-4">
      <div className="flex gap-3">
        <Avatar profile={post.author} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="font-semibold text-sm">{post.author?.display_name || post.author?.username || "Student"}</span>
              {post.author?.username && (
                <span className="ml-1.5 text-xs text-muted-foreground">@{post.author.username}</span>
              )}
              <span className="ml-1.5 text-xs text-muted-foreground">· {timeAgo(post.created_at)}</span>
            </div>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="p-1 rounded hover:bg-muted transition-colors"
                aria-label="More"
              >
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-7 z-10 min-w-[140px] rounded-lg border border-border bg-popover shadow-elev-2 py-1">
                  {isMine ? (
                    <button onClick={remove} className="w-full text-left px-3 py-1.5 text-xs text-destructive hover:bg-muted">
                      Delete
                    </button>
                  ) : (
                    <button onClick={report} className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center gap-1.5">
                      <Flag className="h-3.5 w-3.5" /> Report
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <p className="mt-1.5 text-sm whitespace-pre-wrap break-words">{post.content}</p>
          {post.material && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs">
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Attached:</span>
              <span className="font-medium">{post.material.title}</span>
            </div>
          )}
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <button
              onClick={toggleLike}
              className={`inline-flex items-center gap-1.5 hover:text-primary transition-colors ${post.liked ? "text-primary" : ""}`}
            >
              <Heart className={`h-4 w-4 ${post.liked ? "fill-current" : ""}`} />
              {post.likeCount}
            </button>
            <button
              onClick={() => setShowComments((v) => !v)}
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <MessageCircle className="h-4 w-4" /> {post.commentCount}
            </button>
          </div>
          {showComments && <Comments postId={post.id} me={me} />}
        </div>
      </div>
    </li>
  );
}

function Comments({ postId, me }: { postId: string; me: Profile }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_comments")
        .select("id,user_id,content,created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as { id: string; user_id: string; content: string; created_at: string }[];
      const ids = Array.from(new Set(rows.map((r) => r.user_id)));
      if (ids.length === 0) return [];
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,username,display_name,avatar_url")
        .in("id", ids);
      const map = new Map<string, Profile>();
      (profs ?? []).forEach((p: unknown) => {
        const pr = p as Profile;
        map.set(pr.id, pr);
      });
      return rows.map((r) => ({ ...r, author: map.get(r.user_id) ?? null }));
    },
  });

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setSending(true);
    const { error } = await supabase.from("post_comments").insert({ post_id: postId, user_id: me.id, content: t });
    setSending(false);
    if (error) return toast.error(error.message);
    setText("");
    qc.invalidateQueries({ queryKey: ["comments", postId] });
    qc.invalidateQueries({ queryKey: ["lumio-feed"] });
  };

  return (
    <div className="mt-4 pt-3 border-t border-border space-y-3">
      {isLoading ? (
        <div className="text-xs text-muted-foreground flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> loading…</div>
      ) : comments.length === 0 ? (
        <div className="text-xs text-muted-foreground">No comments yet.</div>
      ) : (
        <ul className="space-y-2">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-2">
              <Avatar profile={c.author} />
              <div className="flex-1 rounded-lg bg-muted/50 px-3 py-2">
                <div className="text-xs">
                  <span className="font-semibold">{c.author?.display_name || c.author?.username || "Student"}</span>
                  <span className="ml-1.5 text-muted-foreground">· {timeAgo(c.created_at)}</span>
                </div>
                <p className="text-sm mt-0.5 whitespace-pre-wrap break-words">{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Write a comment…"
          maxLength={300}
          className="flex-1 rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 transition-all"
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className="ripple inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-3 py-2 disabled:opacity-50"
          aria-label="Send"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}