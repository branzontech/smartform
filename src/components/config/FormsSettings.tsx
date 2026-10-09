import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Eye, Plus } from "lucide-react";
import { RowActions } from "@/components/kit/RowActions";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  StatusCell,
  TableToolbar,
  primaryButtonClass,
  useDataTable,
  type StatusTone,
  type TableColumn,
  type TableFilter,
  type TableSegment,
} from "@/components/kit/table";
import { useCountry } from "@/config/country/useCountry";
import { db } from "@/integrations/data/client";

interface FormRow {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipo: string | null;
  estado: "activo" | "inactivo" | "borrador";
  preguntas: unknown[] | null;
  respuestas_count: number | null;
  fhir_extensions: { base?: boolean } | null;
  created_at: string;
  updated_at: string;
}

/** Tipos que guarda el creador (FormsPage) más los heredados de la base. */
const TYPE_LABELS: Record<string, string> = {
  historia_clinica: "Historia clínica",
  formato: "Formato",
  escala: "Escala",
  encuesta: "Encuesta",
  forms: "Formulario",
};
const typeOf = (f: FormRow) => f.tipo || "historia_clinica";
/** Escala = tipo «escala» o un formato con preguntas puntuadas (Barthel, Glasgow, EVA…). */
const SCORED_TYPES = new Set(["scored_checkbox", "score_total"]);
const isScale = (f: FormRow) =>
  typeOf(f) === "escala" ||
  (Array.isArray(f.preguntas) && f.preguntas.some((q) => SCORED_TYPES.has((q as { type?: string } | null)?.type ?? "")));
const typeLabel = (f: FormRow) => (isScale(f) ? "Escala" : TYPE_LABELS[typeOf(f)] ?? typeOf(f));
const isBase = (f: FormRow) => f.fhir_extensions?.base === true;

const STATUS: Record<FormRow["estado"], { text: string; tone: StatusTone }> = {
  activo: { text: "Activo", tone: "success" },
  borrador: { text: "Borrador", tone: "warning" },
  inactivo: { text: "Inactivo", tone: "neutral" },
};

const questionsOf = (f: FormRow) => (Array.isArray(f.preguntas) ? f.preguntas.length : 0);
const rightAligned = "text-right tabular-nums";

const SEGMENTS: TableSegment<FormRow>[] = [
  { id: "all", title: "Todos", match: () => true },
  { id: "clinical", title: "Historia clínica", match: (f) => typeOf(f) === "historia_clinica" },
  { id: "templates", title: "Formatos", match: (f) => (typeOf(f) === "formato" || typeOf(f) === "forms") && !isScale(f) },
  { id: "scales", title: "Escalas", match: isScale },
  { id: "surveys", title: "Encuestas", match: (f) => typeOf(f) === "encuesta" },
];

const FILTERS: TableFilter<FormRow>[] = [
  {
    id: "status",
    title: "Estado",
    value: (f) => f.estado,
    options: (Object.keys(STATUS) as FormRow["estado"][]).map((k) => ({ value: k, label: STATUS[k].text })),
  },
  {
    id: "usage",
    title: "Uso",
    value: (f) => ((f.respuestas_count ?? 0) > 0 ? "used" : "unused"),
    options: [
      { value: "used", label: "Con registros" },
      { value: "unused", label: "Sin registros" },
    ],
  },
  {
    id: "origin",
    title: "Origen",
    value: (f) => (isBase(f) ? "base" : "own"),
    options: [
      { value: "base", label: "Base del sistema" },
      { value: "own", label: "Creados por la institución" },
    ],
  },
];

const rowKey = (f: FormRow) => f.id;

async function fetchForms(): Promise<FormRow[]> {
  const { data, error } = await db
    .from("formularios")
    .select("id, titulo, descripcion, tipo, estado, preguntas, respuestas_count, fhir_extensions, created_at, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as FormRow[];
}

/**
 * Formularios en Configuración, con la convención de tablas de Ker Hub:
 * segmentos por tipo con conteo, Filtrar (estado, uso, origen), búsqueda,
 * orden, columnas, CSV y paginación. Las acciones van fijas a la derecha.
 */
export function FormsSettings() {
  const navigate = useNavigate();
  const { format } = useCountry();
  const { data: forms = [], isLoading, error } = useQuery({ queryKey: ["config", "forms"], queryFn: fetchForms });

  const columns = useMemo<TableColumn<FormRow>[]>(() => [
    { id: "title", title: "Nombre", value: (f) => f.titulo, primary: true, alwaysVisible: true, className: "min-w-[240px]" },
    { id: "type", title: "Tipo", value: (f) => (isBase(f) ? `${typeLabel(f)} (base)` : typeLabel(f)) },
    { id: "questions", title: "Preguntas", value: questionsOf, className: rightAligned },
    {
      id: "status", title: "Estado", value: (f) => STATUS[f.estado]?.text ?? f.estado, flush: true,
      cell: (f) => <StatusCell tone={STATUS[f.estado]?.tone ?? "neutral"} text={STATUS[f.estado]?.text ?? f.estado} />,
    },
    { id: "records", title: "Registros", value: (f) => f.respuestas_count ?? 0, className: rightAligned },
    { id: "updatedAt", title: "Actualizado", value: (f) => f.updated_at, cell: (f) => format.date(f.updated_at) },
    { id: "createdAt", title: "Creado", value: (f) => f.created_at, cell: (f) => format.date(f.created_at), hidden: true },
    { id: "description", title: "Descripción", value: (f) => f.descripcion, hidden: true, unsortable: true },
  ], [format]);

  const t = useDataTable({ id: "config.forms", rows: forms, columns, rowKey, filters: FILTERS, segments: SEGMENTS, initialPageSize: 10 });

  const edit = (f: FormRow) => navigate(`/app/crear/${f.id}`);

  return (
    <DataTable
      t={t}
      loading={isLoading}
      onRowClick={edit}
      toolbar={
        <TableToolbar
          t={t}
          name={["formulario", "formularios"]}
          placeholder="Buscar por nombre o descripción"
          fileName="formularios"
          actions={
            <Button size="sm" className={primaryButtonClass} onClick={() => navigate("/app/crear")}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Nuevo formulario
            </Button>
          }
        />
      }
      actions={(f) => (
        <RowActions
          name={f.titulo}
          onView={() => edit(f)}
          menu={[
            { title: "Vista previa", icon: Eye, onClick: () => navigate(`/app/ver/${f.id}`) },
            { title: "Ver registros", icon: BarChart3, onClick: () => navigate(`/app/formulario/${f.id}/respuestas`) },
          ]}
        />
      )}
      empty={error ? "No se pudieron cargar los formularios. Recarga la página." : "Aún no hay formularios. Crea uno con «Nuevo formulario»."}
    />
  );
}
