import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, ClipboardList } from "lucide-react";
import { ModuleHeader } from "@/components/kit/ModuleHeader";
import { RowActions } from "@/components/kit/RowActions";
import { TableToolbar, DataTable, useDataTable, type TableColumn, type TableFilter, type TableSegment } from "@/components/kit/table";
import { db } from "@/integrations/data/client";
import { useToast } from "@/hooks/use-toast";

/** Fila de public.pacientes con lo que muestra la lista. */
interface PatientRow {
  id: string;
  numero_historia: string | null;
  nombres: string;
  apellidos: string;
  tipo_documento: string | null;
  numero_documento: string;
  fecha_nacimiento: string | null;
  genero: string | null;
  telefono_principal: string;
  email: string | null;
  regimen: string | null;
  zona: string | null;
  ciudad: string | null;
  fhir_extensions: Record<string, unknown> | null;
  created_at: string;
}

const fullName = (p: PatientRow) => `${p.nombres} ${p.apellidos}`.trim();

function ageOf(date: string | null): number | null {
  if (!date) return null;
  const n = new Date(date);
  if (Number.isNaN(n.getTime())) return null;
  const today = new Date();
  let years = today.getFullYear() - n.getFullYear();
  if (today.getMonth() < n.getMonth() || (today.getMonth() === n.getMonth() && today.getDate() < n.getDate())) years--;
  return years;
}

/** El género puede venir en la columna o en fhir_extensions (registros antiguos). */
const genderOf = (p: PatientRow) => p.genero || (p.fhir_extensions?.gender as string | undefined) || (p.fhir_extensions?.sexo as string | undefined) || null;

const shortDate = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" });
const rightAligned = "text-right tabular-nums";

/** Una celda, un dato, una línea. Lo demás está en el detalle del paciente. */
const COLUMNS: TableColumn<PatientRow>[] = [
  { id: "record", title: "Historia", value: (p) => p.numero_historia, className: "font-mono text-xs", alwaysVisible: true },
  { id: "patient", title: "Paciente", value: fullName, primary: true, className: "min-w-[220px]" },
  { id: "document", title: "Documento", value: (p) => `${p.tipo_documento ?? ""} ${p.numero_documento}`.trim(), className: "font-mono text-xs" },
  { id: "age", title: "Edad", value: (p) => ageOf(p.fecha_nacimiento), cell: (p) => ageOf(p.fecha_nacimiento) ?? "—", className: rightAligned },
  { id: "gender", title: "Género", value: genderOf },
  { id: "phone", title: "Teléfono", value: (p) => p.telefono_principal, className: "tabular-nums" },
  { id: "email", title: "Correo", value: (p) => p.email, hidden: true },
  { id: "regime", title: "Régimen", value: (p) => p.regimen },
  { id: "zone", title: "Zona", value: (p) => p.zona, hidden: true },
  { id: "city", title: "Ciudad", value: (p) => p.ciudad },
  {
    id: "createdAt", title: "Registrado", value: (p) => p.created_at,
    cell: (p) => shortDate.format(new Date(p.created_at)), hidden: true,
  },
];

const FILTERS: TableFilter<PatientRow>[] = [
  { id: "gender", title: "Género", value: genderOf },
  { id: "regime", title: "Régimen", value: (p) => p.regimen },
  { id: "zone", title: "Zona", value: (p) => p.zona },
  { id: "city", title: "Ciudad", value: (p) => p.ciudad },
];

const SEGMENTS: TableSegment<PatientRow>[] = [
  { id: "all", title: "Todos", match: () => true },
  { id: "minors", title: "Menores de edad", match: (p) => (ageOf(p.fecha_nacimiento) ?? 99) < 18 },
  { id: "seniors", title: "Adultos mayores", match: (p) => (ageOf(p.fecha_nacimiento) ?? 0) >= 60 },
];

const rowKey = (p: PatientRow) => p.id;

/**
 * Lista de pacientes con la convención de tablas de Ker Hub (kit de Equipo
 * Tracker/Magnet): segmentos con conteo, Filtrar, Ordenar, Opciones (columnas y
 * CSV), búsqueda desplegable, esqueleto de carga y acciones fijas a la derecha.
 */
const PatientList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data, error } = await db
          .from("pacientes")
          .select("id, numero_historia, nombres, apellidos, tipo_documento, numero_documento, fecha_nacimiento, genero, telefono_principal, email, regimen, zona, ciudad, fhir_extensions, created_at")
          .order("created_at", { ascending: false });
        if (!alive) return;
        if (error) {
          toast({ title: "No se pudieron cargar los pacientes", description: error.message, variant: "destructive" });
          setPatients([]);
        } else {
          setPatients((data ?? []) as PatientRow[]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [toast]);

  const filters = useMemo(() => FILTERS, []);
  const t = useDataTable({ id: "patients.list", rows: patients, columns: COLUMNS, rowKey, filters, segments: SEGMENTS });

  const view = (p: PatientRow) => navigate(`/app/pacientes/${p.id}`);

  return (
    <div className="mx-auto max-w-7xl space-y-5 py-6">
      <ModuleHeader
        title="Pacientes"
        secondary={[{ title: "Estadísticas", icon: BarChart3, onClick: () => navigate("/app/pacientes/dashboard") }]}
        primary={{ title: "Nueva atención", onClick: () => navigate("/app/pacientes/nueva-consulta") }}
      />
      <DataTable
        t={t}
        loading={loading}
        onRowClick={view}
        toolbar={<TableToolbar t={t} name={["paciente", "pacientes"]} placeholder="Buscar por nombre, documento o teléfono" fileName="pacientes" />}
        actions={(p) => (
          <RowActions
            name={fullName(p)}
            onView={() => view(p)}
            menu={[{ title: "Ver atenciones", icon: ClipboardList, onClick: () => navigate(`/app/pacientes/${p.id}?tab=consultations`) }]}
          />
        )}
        empty="Aún no hay pacientes. Registra uno con «Nueva atención»."
      />
    </div>
  );
};

export default PatientList;
