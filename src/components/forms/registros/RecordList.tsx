import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BarChart3, ClipboardList, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATE_LABEL, STATE_TEXT, type ClinicalRecord } from "./types";

interface RecordListProps {
  records: ClinicalRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  empty: ReactNode;
}

/** Agrupa en el orden en que llegan: cada atención aparece donde está su primer registro. */
function groupsOf(records: ClinicalRecord[]) {
  const groups = new Map<string, { label: string; items: ClinicalRecord[] }>();
  for (const r of records) {
    const g = groups.get(r.groupKey);
    if (g) g.items.push(r);
    else groups.set(r.groupKey, { label: r.groupLabel, items: [r] });
  }
  return [...groups.entries()];
}

function RecordIcon({ record }: { record: ClinicalRecord }) {
  const Icon = record.isClinicalHistory ? FileText : record.score ? BarChart3 : ClipboardList;
  return <Icon className="h-[18px] w-[18px]" aria-hidden />;
}

/**
 * Lista del historial: registros agrupados por atención. Se recorre con las
 * flechas ↑ ↓; el registro seleccionado se marca con un tinte, sin barra lateral.
 */
export function RecordList({ records, selectedId, onSelect, empty }: RecordListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const groups = groupsOf(records);
  // Las flechas siguen el orden en pantalla (agrupado), no el de llegada.
  const ordered = groups.flatMap(([, g]) => g.items);

  const move = (e: KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const i = ordered.findIndex((r) => r.id === selectedId);
    const next = ordered[Math.max(0, Math.min(ordered.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)))];
    if (!next) return;
    onSelect(next.id);
    listRef.current?.querySelector<HTMLElement>(`[data-record="${next.id}"]`)?.focus();
  };

  if (records.length === 0) return <div className="px-4 py-12 text-center text-sm text-muted-foreground">{empty}</div>;

  return (
    <div ref={listRef} role="listbox" aria-label="Registros" onKeyDown={move} className="grid gap-0.5 px-2 pb-3 pt-1">
      {groups.map(([key, group]) => (
        <div key={key} role="group" aria-label={group.label} className="grid gap-0.5">
          <div className="flex items-baseline justify-between gap-2 px-2 pb-1.5 pt-3 text-xs text-muted-foreground">
            <span className="truncate font-semibold text-foreground">{group.label}</span>
            <span className="shrink-0 tabular-nums">{group.items.length} {group.items.length === 1 ? "registro" : "registros"}</span>
          </div>
          {group.items.map((r) => {
            const selected = r.id === selectedId;
            return (
              <button
                key={r.id}
                type="button"
                role="option"
                aria-selected={selected}
                data-record={r.id}
                tabIndex={selected || (!selectedId && r === ordered[0]) ? 0 : -1}
                onClick={() => onSelect(r.id)}
                className={cn(
                  "grid w-full grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  selected ? "bg-primary/10" : "hover:bg-[hsl(var(--field))]",
                )}
              >
                <span className={cn("grid h-9 w-9 place-items-center rounded-[10px] text-primary", selected ? "bg-card" : "bg-[hsl(var(--field))]")}>
                  <RecordIcon record={r} />
                </span>
                <span className="min-w-0">
                  <span className={cn("block truncate text-sm font-semibold", r.state !== "active" && "text-muted-foreground")}>{r.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{r.professional}</span>
                </span>
                <span className="text-right text-xs tabular-nums text-muted-foreground">
                  {r.score ? (
                    <span className="block text-[13px] font-semibold text-foreground">{r.score.value}{r.score.max ? `/${r.score.max}` : ""}</span>
                  ) : null}
                  {/* Un ingreso puede durar varios días: ahí la fila lleva también el día. */}
                  <span className="block">{format(r.createdAt, r.groupKey.startsWith("a:") ? "d MMM · HH:mm" : "HH:mm", { locale: es })}</span>
                  {r.state !== "active" && <span className={cn("block font-medium", STATE_TEXT[r.state])}>{STATE_LABEL[r.state]}</span>}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
