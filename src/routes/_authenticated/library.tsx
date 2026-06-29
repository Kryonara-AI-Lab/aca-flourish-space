import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, FileText, GraduationCap, Download, Trash2, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

const searchSchema = z.object({ type: z.enum(["notes", "homework", "exam"]).optional() });

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({ meta: [{ title: "Library — Lumio" }] }),
  validateSearch: searchSchema,
  component: Library,
});

const TABS = [
  { id: "notes", label: "Class notes", icon: BookOpen },
  { id: "homework", label: "Homework", icon: FileText },
  { id: "exam", label: "Past exams", icon: GraduationCap },
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
  created_at: string;
};

function Library() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const qc = useQueryClient();
  const activeType = search.type ?? "notes";
  const [query, setQuery] = useState("");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["materials", activeType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .eq("type", activeType)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Material[];
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

  const download = async (m: Material) => {
    const { data, error } = await supabase.storage.from("materials").createSignedUrl(m.storage_path, 60);
    if (error || !data) {
      toast.error("Could not generate download link");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const remove = async (m: Material) => {
    if (!confirm(`Delete "${m.title}"?`)) return;
    const { error: sErr } = await supabase.storage.from("materials").remove([m.storage_path]);
    const { error } = await supabase.from("materials").delete().eq("id", m.id);
    if (error || sErr) {
      toast.error("Could not delete");
      return;
    }
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["materials"] });
    qc.invalidateQueries({ queryKey: ["materials-stats"] });
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Library</h1>
          <p className="mt-1 text-muted-foreground">All your uploaded study materials in one place.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 w-full sm:w-72 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40 transition-all">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, subject…"
            className="w-full bg-transparent outline-none text-sm"
          />
        </div>
      </header>

      <div className="flex gap-2 border-b border-border">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = activeType === id;
          return (
            <button
              key={id}
              onClick={() => navigate({ search: { type: id } })}
              className={`group relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              <span
                className={`absolute left-3 right-3 -bottom-px h-0.5 rounded-full bg-primary transition-transform duration-300 origin-left ${
                  active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                }`}
              />
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="surface p-10 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="surface p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {query ? "No matches for your search." : "Nothing here yet — try uploading something."}
          </p>
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <li key={m.id} className="surface-interactive p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{m.title}</h3>
                  {m.subject && <p className="text-xs text-muted-foreground mt-0.5">{m.subject}</p>}
                </div>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-primary-soft text-foreground">
                  {m.type}
                </span>
              </div>
              {m.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{m.description}</p>
              )}
              <div className="mt-3 text-xs text-muted-foreground">
                {m.file_name} · {(m.file_size / 1024).toFixed(0)} KB
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => download(m)}
                  className="ripple flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-secondary text-secondary-foreground px-3 py-2 text-xs font-medium hover:bg-primary-soft transition-colors"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
                <button
                  onClick={() => remove(m)}
                  className="ripple inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
