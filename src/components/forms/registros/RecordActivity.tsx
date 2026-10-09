import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { db } from "@/integrations/data/client";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchProfessionalNames } from "./useRecordsHistory";
import type { Provenance } from "./types";

interface AuditEvent {
  id: string;
  accion: "creado" | "actualizado";
  usuario_id: string | null;
  campos_modificados: string[] | null;
  ocurrido_en: string;
}

interface ActivityItem {
  id: string;
  at: Date;
  action: string;
  who: string;
  detail: string;
}

const PROVENANCE_ACTION: Record<Provenance["activity_type"], string> = {
  correction: "Corregido",
  "entered-in-error": "Anulado",
  amendment: "Enmendado",
};

async function fetchActivity(recordId: string): Promise<{ events: AuditEvent[]; names: Record<string, string> }> {
  const { data, error } = await db
    .from("respuestas_formularios_eventos")
    .select("id, accion, usuario_id, campos_modificados, ocurrido_en")
    .eq("respuesta_formulario_id", recordId)
    .order("ocurrido_en", { ascending: true });
  if (error) throw error;
  const events = (data ?? []) as unknown as AuditEvent[];
  const userIds = [...new Set(events.map((e) => e.usuario_id).filter((id): id is string => !!id))];
  return { events, names: await fetchProfessionalNames(userIds) };
}

const fieldsText = (n: number) => (n === 1 ? "1 campo" : `${n} campos`);

/** Bitácora del registro: quién lo creó, quién lo modificó y las correcciones formales. */
export function RecordActivity({ recordId, provenance }: { recordId: string; provenance: Provenance[] }) {
  const { data, isLoading, error } = useQuery({ queryKey: ["record-activity", recordId], queryFn: () => fetchActivity(recordId) });

  if (isLoading) {
    return (
      <div className="grid gap-2" aria-busy="true">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }
  if (error) return <p className="text-sm text-destructive">No se pudo cargar la actividad del registro.</p>;

  const items: ActivityItem[] = [
    ...(data?.events ?? []).map((e) => ({
      id: e.id,
      at: new Date(e.ocurrido_en),
      action: e.accion === "creado" ? "Creado" : "Actualizado",
      who: (e.usuario_id && data?.names[e.usuario_id]) || "Usuario del sistema",
      detail: fieldsText(e.campos_modificados?.length ?? 0),
    })),
    ...provenance.map((p) => ({
      id: p.id,
      at: new Date(p.recorded_at),
      action: PROVENANCE_ACTION[p.activity_type],
      who: p.agent_nombre_completo,
      detail: `«${p.reason_text}»`,
    })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin actividad registrada. Los registros anteriores a la bitácora no tienen historial de cambios.</p>;
  }
  return (
    <ol className="grid">
      {items.map((it) => (
        <li key={it.id} className="grid grid-cols-[104px_minmax(0,1fr)] gap-3 border-t border-border py-2 text-[13px] first:border-t-0">
          <time dateTime={it.at.toISOString()} className="tabular-nums text-muted-foreground">
            {format(it.at, "d MMM · HH:mm", { locale: es })}
          </time>
          <span className="min-w-0">
            <span className="font-semibold">{it.action}</span> por {it.who}
            <span className="text-muted-foreground"> · {it.detail}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
