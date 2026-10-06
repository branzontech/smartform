import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, ClipboardList } from "lucide-react";
import { EncabezadoModulo } from "@/components/kit/EncabezadoModulo";
import { AccionesFila } from "@/components/kit/AccionesFila";
import { BarraTabla, TablaDatos, useTablaDatos, type ColumnaTabla, type FiltroTabla, type SegmentoTabla } from "@/components/kit/tabla";
import { baseDatos } from "@/integrations/datos/cliente";
import { useToast } from "@/hooks/use-toast";

/** Fila de public.pacientes con lo que muestra la lista. */
interface PacienteFila {
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

const nombreCompleto = (p: PacienteFila) => `${p.nombres} ${p.apellidos}`.trim();

function edad(fecha: string | null): number | null {
  if (!fecha) return null;
  const n = new Date(fecha);
  if (Number.isNaN(n.getTime())) return null;
  const hoy = new Date();
  let anios = hoy.getFullYear() - n.getFullYear();
  if (hoy.getMonth() < n.getMonth() || (hoy.getMonth() === n.getMonth() && hoy.getDate() < n.getDate())) anios--;
  return anios;
}

/** El género puede venir en la columna o en fhir_extensions (registros antiguos). */
const genero = (p: PacienteFila) => p.genero || (p.fhir_extensions?.gender as string | undefined) || (p.fhir_extensions?.sexo as string | undefined) || null;

const fechaCorta = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" });
const derecha = "text-right tabular-nums";

/** Una celda, un dato, una línea. Lo demás está en el detalle del paciente. */
const COLUMNAS: ColumnaTabla<PacienteFila>[] = [
  { id: "historia", titulo: "Historia", valor: (p) => p.numero_historia, className: "font-mono text-xs", fija: true },
  { id: "paciente", titulo: "Paciente", valor: nombreCompleto, principal: true, className: "min-w-[220px]" },
  { id: "documento", titulo: "Documento", valor: (p) => `${p.tipo_documento ?? ""} ${p.numero_documento}`.trim(), className: "font-mono text-xs" },
  { id: "edad", titulo: "Edad", valor: (p) => edad(p.fecha_nacimiento), celda: (p) => edad(p.fecha_nacimiento) ?? "—", className: derecha },
  { id: "genero", titulo: "Género", valor: genero },
  { id: "telefono", titulo: "Teléfono", valor: (p) => p.telefono_principal, className: "tabular-nums" },
  { id: "correo", titulo: "Correo", valor: (p) => p.email, oculta: true },
  { id: "regimen", titulo: "Régimen", valor: (p) => p.regimen },
  { id: "zona", titulo: "Zona", valor: (p) => p.zona, oculta: true },
  { id: "ciudad", titulo: "Ciudad", valor: (p) => p.ciudad },
  {
    id: "registro", titulo: "Registrado", valor: (p) => p.created_at,
    celda: (p) => fechaCorta.format(new Date(p.created_at)), oculta: true,
  },
];

const FILTROS: FiltroTabla<PacienteFila>[] = [
  { id: "genero", titulo: "Género", valor: genero },
  { id: "regimen", titulo: "Régimen", valor: (p) => p.regimen },
  { id: "zona", titulo: "Zona", valor: (p) => p.zona },
  { id: "ciudad", titulo: "Ciudad", valor: (p) => p.ciudad },
];

const SEGMENTOS: SegmentoTabla<PacienteFila>[] = [
  { id: "todos", titulo: "Todos", cumple: () => true },
  { id: "menores", titulo: "Menores de edad", cumple: (p) => (edad(p.fecha_nacimiento) ?? 99) < 18 },
  { id: "mayores", titulo: "Adultos mayores", cumple: (p) => (edad(p.fecha_nacimiento) ?? 0) >= 60 },
];

const claveFila = (p: PacienteFila) => p.id;

/**
 * Lista de pacientes con la convención de tablas de Ker Hub (kit de Equipo
 * Tracker/Magnet): segmentos con conteo, Filtrar, Ordenar, Opciones (columnas y
 * CSV), búsqueda desplegable, esqueleto de carga y acciones fijas a la derecha.
 */
const PatientList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pacientes, setPacientes] = useState<PacienteFila[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;
    (async () => {
      try {
        const { data, error } = await baseDatos
          .from("pacientes")
          .select("id, numero_historia, nombres, apellidos, tipo_documento, numero_documento, fecha_nacimiento, genero, telefono_principal, email, regimen, zona, ciudad, fhir_extensions, created_at")
          .order("created_at", { ascending: false });
        if (!vigente) return;
        if (error) {
          toast({ title: "No se pudieron cargar los pacientes", description: error.message, variant: "destructive" });
          setPacientes([]);
        } else {
          setPacientes((data ?? []) as PacienteFila[]);
        }
      } finally {
        if (vigente) setCargando(false);
      }
    })();
    return () => { vigente = false; };
  }, [toast]);

  const filtros = useMemo(() => FILTROS, []);
  const t = useTablaDatos({ id: "pacientes.lista", filas: pacientes, columnas: COLUMNAS, claveFila, filtros, segmentos: SEGMENTOS });

  const ver = (p: PacienteFila) => navigate(`/app/pacientes/${p.id}`);

  return (
    <div className="mx-auto max-w-7xl space-y-5 py-6">
      <EncabezadoModulo
        titulo="Pacientes"
        secundarias={[{ titulo: "Estadísticas", icono: BarChart3, onClick: () => navigate("/app/pacientes/dashboard") }]}
        primaria={{ titulo: "Nueva atención", onClick: () => navigate("/app/pacientes/nueva-consulta") }}
      />
      <TablaDatos
        t={t}
        cargando={cargando}
        onFilaClick={ver}
        barra={<BarraTabla t={t} nombre={["paciente", "pacientes"]} placeholder="Buscar por nombre, documento o teléfono" nombreArchivo="pacientes" />}
        acciones={(p) => (
          <AccionesFila
            nombre={nombreCompleto(p)}
            onVer={() => ver(p)}
            menu={[{ titulo: "Ver atenciones", icono: ClipboardList, onClick: () => navigate(`/app/pacientes/${p.id}?tab=consultations`) }]}
          />
        )}
        vacio="Aún no hay pacientes. Registra uno con «Nueva atención»."
      />
    </div>
  );
};

export default PatientList;
