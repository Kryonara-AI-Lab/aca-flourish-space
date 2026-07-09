import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { BookOpen, FileText, GraduationCap, Search, Loader2 } from "lucide-react";
import { getCurrentFirebaseUser, getUserMaterials } from "@/lib/firebase-data";

const TYPE_META = {
  notes: { label: "Notes", icon: BookOpen },
  homework: { label: "Homework", icon: FileText },
  exam: { label: "Past exam", icon: GraduationCap },
} as const;

export type PickerMaterial = {
  id: string;
  title: string;
  subject: string | null;
  type: "notes" | "homework" | "exam";
  file_name: string;
  mime_type: string | null;
};

export function MaterialPicker({
  value,
  onChange,
  emptyHint,
}: {
  value: string | null;
  onChange: (id: string, m: PickerMaterial) => void;
  emptyHint?: React.ReactNode;
}) {
  const [q, setQ] = useState("");
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["materials-all"],
    queryFn: async () => {
      const user = await getCurrentFirebaseUser();
      if (!user) return [];
      const materials = await getUserMaterials(user.uid);
      return materials
        .map((m) => ({
          id: String(m.id),
          title: String(m.title ?? ""),
          subject: typeof m.subject === "string" ? m.subject : null,
          type: (m.type as PickerMaterial["type"]) ?? "notes",
          file_name: String(m.file_name ?? ""),
          mime_type: typeof m.mime_type === "string" ? m.mime_type : null,
        }))
        .sort((a, b) => String(b.id).localeCompare(String(a.id)));
    },
  });

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter(
      (m) =>
        m.title.toLowerCase().includes(t) ||
        (m.subject ?? "").toLowerCase().includes(t) ||
        m.file_name.toLowerCase().includes(t),
    );
  }, [items, q]);

  if (isLoading) {
    return (
      <div className="surface p-8 flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="surface p-8 text-center text-sm text-muted-foreground">
        {emptyHint ?? "Your library is empty — upload something first."}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40 transition-all">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search your library…"
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>
      <ul className="grid sm:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
        {filtered.map((m) => {
          const Icon = TYPE_META[m.type].icon;
          const active = value === m.id;
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onChange(m.id, m)}
                className={`w-full text-left rounded-lg border p-3 transition-all ripple ${
                  active
                    ? "border-primary bg-primary-soft shadow-elev-1"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${active ? "bg-primary text-primary-foreground" : "bg-primary-soft text-primary"}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{m.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {TYPE_META[m.type].label}
                      {m.subject ? ` · ${m.subject}` : ""}
                    </div>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
