import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { TableToolbar, useDataTable, type TableColumn, type TableFilter, type TableSegment } from "@/components/kit/table";
import { cn } from "@/lib/utils";
import { RecordList } from "./RecordList";
import { RecordPreview } from "./RecordPreview";
import { printRecords } from "./print";
import { recordsKey, useRecordsHistory } from "./useRecordsHistory";
import { STATE_LABEL, type ClinicalRecord } from "./types";

const DAY = 86_400_000;

/** Un registro cae en todos los periodos que lo contienen (hoy también está en «últimos 7 días»). */
function periodsOf(r: ClinicalRecord): string[] {
  const age = Date.now() - r.createdAt.getTime();
  const out: string[] = [];
  if (r.createdAt.toDateString() === new Date().toDateString()) out.push("today");
  if (age <= 7 * DAY) out.push("7d");
  if (age <= 30 * DAY) out.push("30d");
  if (r.createdAt.getFullYear() === new Date().getFullYear()) out.push("year");
  return out;
}

const COLUMNS: TableColumn<ClinicalRecord>[] = [
  { id: "date", title: "Fecha", value: (r) => r.createdAt.getTime() },
  { id: "title", title: "Formato", value: (r) => r.title },
  { id: "professional", title: "Profesional", value: (r) => r.professional },
  { id: "group", title: "Atención", value: (r) => r.groupLabel, unsortable: true },
  { id: "content", title: "Contenido", value: (r) => r.content, unsortable: true, hidden: true },
];

const FILTERS: TableFilter<ClinicalRecord>[] = [
  { id: "professional", title: "Profesional", value: (r) => r.professional },
  {
    id: "period",
    title: "Fecha",
    value: periodsOf,
    options: [
      { value: "today", label: "Hoy" },
      { value: "7d", label: "Últimos 7 días" },
      { value: "30d", label: "Últimos 30 días" },
      { value: "year", label: "Este año" },
    ],
  },
  {
    id: "state",
    title: "Estado",
    value: (r) => r.state,
    options: Object.entries(STATE_LABEL).map(([value, label]) => ({ value, label })),
  },
];

const SEGMENTS: TableSegment<ClinicalRecord>[] = [
  { id: "all", title: "Todos", match: () => true },
  { id: "history", title: "Historias", match: (r) => r.isClinicalHistory },
  { id: "forms", title: "Formatos", match: (r) => !r.isClinicalHistory },
];

function ListSkeleton() {
  return (
    <div className="grid gap-2 p-3" aria-busy="true" aria-label="Cargando registros">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-1.5">
          <Skeleton className="h-9 w-9 rounded-[10px]" />
          <div className="grid flex-1 gap-1.5">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface RecordsHistoryProps {
  patientId: string;
  headerConfig?: unknown;
}

/**
 * Historial de registros del paciente (maestro-detalle): a la izquierda la lista
 * con la barra del kit (segmentos, Filtrar, Ordenar, búsqueda); a la derecha la
 * vista previa del registro seleccionado. Cada columna se desplaza por su cuenta
 * y el contenedor le da el alto que queda, así que la página no hace scroll doble.
 */
export function RecordsHistory({ patientId, headerConfig }: RecordsHistoryProps) {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const { records, provenanceByRecord, isLoading, error } = useRecordsHistory(patientId);
  const t = useDataTable({
    id: "consult.records",
    rows: records,
    columns: COLUMNS,
    rowKey: (r) => r.id,
    filters: FILTERS,
    segments: SEGMENTS,
    // La búsqueda lleva texto clínico: solo en memoria, nunca en el navegador.
    persistSearch: false,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDetailOnPhone, setShowDetailOnPhone] = useState(false);

  // Sin elección (o si los filtros la ocultan), se muestra el registro más reciente.
  const visible = t.filtered;
  const selected = visible.find((r) => r.id === selectedId) ?? visible[0] ?? null;
  const filtering = !!t.search || t.activeFilterCount > 0;

  const select = (id: string) => {
    setSelectedId(id);
    setShowDetailOnPhone(true);
  };
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: recordsKey(patientId) });
    queryClient.invalidateQueries({ queryKey: ["records-history-provenance", patientId] });
    if (selected) queryClient.invalidateQueries({ queryKey: ["record-activity", selected.id] });
  };

  const empty = records.length === 0
    ? "Este paciente aún no tiene registros clínicos. Aparecerán aquí al guardar un formato de la consulta."
    : (
      <span className="grid justify-items-center gap-2">
        Ningún registro coincide con la búsqueda o los filtros.
        {filtering && (
          <Button variant="ghost" size="sm" className="h-8 text-[13px] text-primary" onClick={() => { t.setSearch(""); t.clearFilters(); }}>
            Quitar búsqueda y filtros
          </Button>
        )}
      </span>
    );

  return (
    <div className="grid md:h-full md:grid-cols-[340px_minmax(0,1fr)]">
      <div className={cn("flex min-h-0 flex-col md:border-r md:border-border", showDetailOnPhone && selected && "hidden md:flex")}>
        <div className="border-b border-border px-3 py-2.5">
          <TableToolbar
            t={t}
            name={["registro", "registros"]}
            placeholder="Buscar en registros…"
            compact
            showOptions={false}
            actions={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Más acciones" className="h-8 w-8 rounded-lg text-muted-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem
                    disabled={visible.length === 0}
                    onClick={() => void printRecords(visible, { patientId, headerConfig })}
                    className="gap-2 text-[13px]"
                  >
                    <Printer className="h-4 w-4" />
                    {filtering ? `Imprimir lo filtrado (${visible.length})` : `Imprimir todo (${visible.length})`}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            }
          />
        </div>
        <div className="md:min-h-0 md:flex-1 md:overflow-y-auto">
          {isLoading ? (
            <ListSkeleton />
          ) : error ? (
            <p className="px-4 py-12 text-center text-sm text-destructive">No se pudieron cargar los registros. Revisa la conexión y vuelve a abrir la pestaña.</p>
          ) : (
            <RecordList records={visible} selectedId={selected?.id ?? null} onSelect={select} empty={empty} />
          )}
        </div>
      </div>

      <div className={cn("min-w-0 md:overflow-y-auto", !(showDetailOnPhone && selected) && "hidden md:block")}>
        {selected ? (
          <RecordPreview
            key={selected.id}
            record={selected}
            provenance={provenanceByRecord[selected.id] ?? []}
            canCorrect={hasRole("doctor") || hasRole("admin")}
            onPrint={() => void printRecords([selected], { patientId, headerConfig })}
            onCorrected={refresh}
            onBack={() => setShowDetailOnPhone(false)}
          />
        ) : (
          !isLoading && <p className="px-6 py-16 text-center text-sm text-muted-foreground">Selecciona un registro para verlo aquí.</p>
        )}
      </div>
    </div>
  );
}
