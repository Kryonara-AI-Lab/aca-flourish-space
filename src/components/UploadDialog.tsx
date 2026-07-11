import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { auth, storage } from "@/lib/firebase";
import { ref, uploadBytes } from "firebase/storage";
import { addMaterial } from "@/lib/firestore-db";
import { toast } from "sonner";
import { Upload as UploadIcon, Loader2, X, BookOpen, FileText, GraduationCap } from "lucide-react";

const TYPES = [
  { id: "notes", label: "Notes", icon: BookOpen },
  { id: "homework", label: "Homework", icon: FileText },
  { id: "exam", label: "Past exam", icon: GraduationCap },
] as const;

const MAX_SIZE = 25 * 1024 * 1024;

export function UploadDialog({
  defaultType = "notes",
  onClose,
  onDone,
}: {
  defaultType?: "notes" | "homework" | "exam";
  onClose: () => void;
  onDone?: () => void;
}) {
  const qc = useQueryClient();
  const [type, setType] = useState<"notes" | "homework" | "exam">(defaultType);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Add a title");
    if (!file) return toast.error("Choose a file");
    if (file.size > MAX_SIZE) return toast.error("File must be under 25 MB");
    setBusy(true);
    try {
      const u = auth.currentUser;
      if (!u) throw new Error("Not signed in");
      const safe = file.name.replace(/[^\w.-]+/g, "_");
      const path = `materials/${u.uid}/${type}/${Date.now()}-${safe}`;

      const fileRef = ref(storage, path);
      await uploadBytes(fileRef, file);

      await addMaterial({
        user_id: u.uid,
        title: title.trim().slice(0, 120),
        subject: subject.trim() || null,
        type,
        storage_path: path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || null,
        description: null,
      });

      toast.success("Uploaded");
      qc.invalidateQueries({ queryKey: ["materials"] });
      qc.invalidateQueries({ queryKey: ["materials-stats"] });
      qc.invalidateQueries({ queryKey: ["materials-all"] });
      onDone?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-up">
      <div className="w-full max-w-lg surface p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UploadIcon className="h-4 w-4 text-primary" /> Upload to library
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <span className="block text-xs font-medium text-muted-foreground mb-2">Type</span>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map(({ id, label, icon: Icon }) => {
                const active = type === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setType(id)}
                    className={`ripple flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-xs font-medium transition-all ${
                      active
                        ? "border-primary bg-primary-soft text-foreground shadow-elev-1"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            maxLength={120}
            className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 transition-all"
          />
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (optional)"
            maxLength={80}
            className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 transition-all"
          />
          {file ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-input bg-card px-3 py-3">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{file.name}</div>
                <div className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(0)} KB
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="p-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="block cursor-pointer">
              <div className="rounded-lg border-2 border-dashed border-border bg-card hover:border-primary/50 hover:bg-primary-soft/30 transition-all px-6 py-8 text-center">
                <UploadIcon className="h-5 w-5 text-primary mx-auto" />
                <div className="mt-2 text-sm font-medium">Choose a file</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  PDF, docs, images · max 25 MB
                </div>
              </div>
              <input
                type="file"
                className="sr-only"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                accept=".pdf,.doc,.docx,.txt,.rtf,.md,image/*,.ppt,.pptx,.xls,.xlsx"
              />
            </label>
          )}
          <button
            type="submit"
            disabled={busy}
            className="ripple w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-semibold shadow-elev-1 hover:shadow-glow transition-all disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UploadIcon className="h-4 w-4" />
            )}
            {busy ? "Uploading…" : "Upload"}
          </button>
        </form>
      </div>
    </div>
  );
}
