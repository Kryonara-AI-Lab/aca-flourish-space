import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookOpen, FileText, GraduationCap, Upload as UploadIcon, Loader2, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/upload")({
  head: () => ({ meta: [{ title: "Upload — Lumio" }] }),
  component: UploadPage,
});

const TYPES = [
  { id: "notes", label: "Class notes", icon: BookOpen },
  { id: "homework", label: "Homework", icon: FileText },
  { id: "exam", label: "Past exam", icon: GraduationCap },
] as const;

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  subject: z.string().trim().max(80).optional(),
  description: z.string().trim().max(500).optional(),
  type: z.enum(["notes", "homework", "exam"]),
});

const MAX_SIZE = 25 * 1024 * 1024; // 25 MB

function UploadPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", subject: "", description: "", type: "notes" as "notes" | "homework" | "exam" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (!file) { toast.error("Please choose a file"); return; }
    if (file.size > MAX_SIZE) { toast.error("File must be under 25 MB"); return; }

    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${u.user.id}/${parsed.data.type}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage.from("materials").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("materials").insert({
        user_id: u.user.id,
        title: parsed.data.title,
        subject: parsed.data.subject || null,
        description: parsed.data.description || null,
        type: parsed.data.type,
        storage_path: path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || null,
      });
      if (insErr) throw insErr;

      toast.success("Uploaded");
      qc.invalidateQueries({ queryKey: ["materials"] });
      qc.invalidateQueries({ queryKey: ["materials-stats"] });
      navigate({ to: "/library", search: { type: parsed.data.type } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-up">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Upload material</h1>
        <p className="mt-1 text-muted-foreground">PDFs, images, and documents up to 25 MB. Private to your account.</p>
      </header>

      <form onSubmit={submit} className="surface p-6 sm:p-7 space-y-5">
        <div>
          <span className="block text-xs font-medium text-muted-foreground mb-2">Type</span>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map(({ id, label, icon: Icon }) => {
              const active = form.type === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setForm({ ...form, type: id })}
                  className={`ripple flex flex-col items-center gap-2 rounded-lg border px-3 py-4 text-sm font-medium transition-all ${
                    active
                      ? "border-primary bg-primary-soft text-foreground shadow-elev-1"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <Labeled label="Title">
          <input
            required
            maxLength={120}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Calc II — Series convergence"
            className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 transition-all"
          />
        </Labeled>

        <Labeled label="Subject (optional)">
          <input
            maxLength={80}
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Mathematics"
            className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 transition-all"
          />
        </Labeled>

        <Labeled label="Description (optional)">
          <textarea
            maxLength={500}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Quick context, week number, professor…"
            className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 transition-all resize-none"
          />
        </Labeled>

        <Labeled label="File">
          {file ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-input bg-card px-3 py-3">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{file.name}</div>
                <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</div>
              </div>
              <button type="button" onClick={() => setFile(null)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground" aria-label="Remove file">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="block cursor-pointer">
              <div className="rounded-lg border-2 border-dashed border-border bg-card hover:border-primary/50 hover:bg-primary-soft/30 transition-all px-6 py-10 text-center">
                <UploadIcon className="h-6 w-6 text-primary mx-auto" />
                <div className="mt-3 text-sm font-medium">Click to choose a file</div>
                <div className="text-xs text-muted-foreground mt-1">PDF, images, docs · max 25 MB</div>
              </div>
              <input
                type="file"
                className="sr-only"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                accept=".pdf,.doc,.docx,.txt,.rtf,.md,image/*,.ppt,.pptx,.xls,.xlsx"
              />
            </label>
          )}
        </Labeled>

        <button
          type="submit"
          disabled={busy}
          className="ripple w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-3 text-sm font-semibold shadow-elev-1 hover:shadow-glow transition-all disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadIcon className="h-4 w-4" />}
          {busy ? "Uploading…" : "Upload to Lumio"}
        </button>
      </form>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}
