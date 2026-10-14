import { RowActions } from "@/components/kit/RowActions";
import {
  DataTable, StatusCell, TableToolbar, useDataTable, type TableColumn, type TableFilter, type TableSegment,
} from "@/components/kit/table";
import {
  ACTIVE_STATES, MODALITY_LABEL, STATE_LABEL, STATE_TONE, formatShortDay, localDay, localTime, type Cita, type CitaState, type Modality,
} from "./agenda-api";
import { capitalizeFirst } from "./agenda-ui";

const CLOSED_STATES: CitaState[] = ["cancelada_paciente", "cancelada_ips", "no_asistio"];
const documentOf = (c: Cita) => (c.documento ? `${c.tipoDocumento ?? ""} ${c.documento}`.trim() : null);

/** Una celda, un dato, una línea. Lo demás está en el detalle de la cita. */
const COLUMNS: TableColumn<Cita>[] = [
  { id: "day", title: "Fecha", value: (c) => c.inicio, cell: (c) => capitalizeFirst(formatShortDay(localDay(c.inicio))), alwaysVisible: true },
  { id: "time", title: "Hora", value: (c) => localTime(c.inicio), className: "tabular-nums" },
  { id: "patient", title: "Paciente", value: (c) => c.paciente, primary: true, className: "min-w-[200px]" },
  { id: "document", title: "Documento", value: documentOf, cell: (c) => documentOf(c) ?? "—", className: "font-mono text-xs" },
  { id: "professional", title: "Profesional", value: (c) => c.profesional },
  { id: "modality", title: "Modalidad", value: (c) => MODALITY_LABEL[c.modalidad] },
  { id: "service", title: "Servicio", value: (c) => c.servicio, cell: (c) => c.servicio ?? "—" },
  { id: "agreement", title: "Convenio", value: (c) => c.convenio, cell: (c) => c.convenio ?? "—" },
  { id: "site", title: "Sede", value: (c) => c.sede, cell: (c) => c.sede ?? "—", hidden: true },
  { id: "phone", title: "Teléfono", value: (c) => c.telefono, cell: (c) => c.telefono ?? "—", className: "tabular-nums", hidden: true },
  {
    id: "state", title: "Estado", value: (c) => STATE_LABEL[c.estado], flush: true,
    cell: (c) => <StatusCell tone={STATE_TONE[c.estado]} text={STATE_LABEL[c.estado]} />,
  },
];

const MODALITY_OPTIONS = (Object.keys(MODALITY_LABEL) as Modality[]).map((m) => ({ value: MODALITY_LABEL[m], label: MODALITY_LABEL[m] }));
const STATE_OPTIONS = (Object.keys(STATE_LABEL) as CitaState[]).map((s) => ({ value: STATE_LABEL[s], label: STATE_LABEL[s] }));

const FILTERS: TableFilter<Cita>[] = [
  { id: "professional", title: "Profesional", value: (c) => c.profesional },
  { id: "modality", title: "Modalidad", value: (c) => MODALITY_LABEL[c.modalidad], options: MODALITY_OPTIONS },
  { id: "state", title: "Estado", value: (c) => STATE_LABEL[c.estado], options: STATE_OPTIONS },
  { id: "agreement", title: "Convenio", value: (c) => c.convenio },
];

const SEGMENTS: TableSegment<Cita>[] = [
  { id: "active", title: "Activas", match: (c) => ACTIVE_STATES.includes(c.estado) },
  { id: "attended", title: "Atendidas", match: (c) => c.estado === "atendida" },
  { id: "closed", title: "Canceladas y no asistió", match: (c) => CLOSED_STATES.includes(c.estado) },
  { id: "all", title: "Todas", match: () => true },
];

const rowKey = (c: Cita) => c.id;

interface AgendaListViewProps {
  citas: Cita[];
  loading: boolean;
  onOpen: (cita: Cita) => void;
}

/** Vista «Lista» de la agenda: tabla del kit con las citas del rango elegido. */
export function AgendaListView({ citas, loading, onOpen }: AgendaListViewProps) {
  // La búsqueda no se recuerda en el navegador: lleva nombres de pacientes.
  const t = useDataTable({ id: "agenda.list", rows: citas, columns: COLUMNS, rowKey, filters: FILTERS, segments: SEGMENTS, persistSearch: false });

  return (
    <DataTable
      t={t}
      loading={loading}
      onRowClick={onOpen}
      toolbar={<TableToolbar t={t} name={["cita", "citas"]} placeholder="Buscar por paciente, documento o profesional" fileName="agenda" />}
      actions={(c) => <RowActions name={`cita de ${c.paciente}`} onView={() => onOpen(c)} />}
      empty="No hay citas en estas fechas. Agenda una con «Nueva cita»."
    />
  );
}
