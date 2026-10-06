import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccionesFila } from "@/components/kit/AccionesFila";
import { BarraTabla, TablaDatos, botonPrimario, useTablaDatos, type ColumnaTabla, type FiltroTabla, type SegmentoTabla } from "@/components/kit/tabla";
import { useToast } from "@/hooks/use-toast";
import type { Patient } from "@/types/patient-types";
import { getDoctorPatients } from "@/utils/doctor-utils";

interface DoctorPatientsProps {
  doctorId: string;
}

function edad(fecha: string): number | null {
  const n = new Date(fecha);
  if (Number.isNaN(n.getTime())) return null;
  const hoy = new Date();
  let anios = hoy.getFullYear() - n.getFullYear();
  if (hoy.getMonth() < n.getMonth() || (hoy.getMonth() === n.getMonth() && hoy.getDate() < n.getDate())) anios--;
  return anios;
}

const derecha = "text-right tabular-nums";

const COLUMNAS: ColumnaTabla<Patient>[] = [
  { id: "nombre", titulo: "Paciente", valor: (p) => p.name, principal: true, fija: true, className: "min-w-[220px]" },
  { id: "documento", titulo: "Documento", valor: (p) => p.documentId, className: "font-mono text-xs" },
  { id: "edad", titulo: "Edad", valor: (p) => edad(p.dateOfBirth), celda: (p) => edad(p.dateOfBirth) ?? "—", className: derecha },
  { id: "genero", titulo: "Género", valor: (p) => p.gender },
  { id: "telefono", titulo: "Teléfono", valor: (p) => p.contactNumber, className: "tabular-nums" },
  { id: "correo", titulo: "Correo", valor: (p) => p.email, oculta: true },
];

const FILTROS: FiltroTabla<Patient>[] = [{ id: "genero", titulo: "Género", valor: (p) => p.gender }];

const SEGMENTOS: SegmentoTabla<Patient>[] = [
  { id: "todos", titulo: "Todos", cumple: () => true },
  { id: "menores", titulo: "Menores de edad", cumple: (p) => (edad(p.dateOfBirth) ?? 99) < 18 },
  { id: "mayores", titulo: "Adultos mayores", cumple: (p) => (edad(p.dateOfBirth) ?? 0) >= 60 },
];

const claveFila = (p: Patient) => p.id;

/**
 * Pacientes asignados a un profesional (pestaña del detalle del médico).
 * Fuente: getDoctorPatients (datos simulados guardados en localStorage).
 */
const DoctorPatients = ({ doctorId }: DoctorPatientsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pacientes, setPacientes] = useState<Patient[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;
    (async () => {
      try {
        const data = await getDoctorPatients(doctorId);
        if (vigente) setPacientes(data);
      } catch (error) {
        if (vigente) {
          toast({
            title: "No se pudieron cargar los pacientes",
            description: error instanceof Error ? error.message : undefined,
            variant: "destructive",
          });
        }
      } finally {
        if (vigente) setCargando(false);
      }
    })();
    return () => { vigente = false; };
  }, [doctorId, toast]);

  const t = useTablaDatos({ id: "medicos.pacientes", filas: pacientes, columnas: COLUMNAS, claveFila, filtros: FILTROS, segmentos: SEGMENTOS });

  const ver = (p: Patient) => navigate(`/app/pacientes/${p.id}`);
  const asignar = () => navigate(`/app/admisiones?doctorId=${doctorId}`);

  return (
    <TablaDatos
      t={t}
      cargando={cargando}
      onFilaClick={ver}
      barra={
        <BarraTabla
          t={t}
          nombre={["paciente", "pacientes"]}
          placeholder="Buscar por nombre o documento"
          nombreArchivo="pacientes-asignados"
          acciones={
            <Button size="sm" className={botonPrimario} onClick={asignar}>
              <UserPlus className="h-4 w-4" /> Asignar paciente
            </Button>
          }
        />
      }
      acciones={(p) => (
        <AccionesFila
          nombre={p.name}
          onVer={() => ver(p)}
          menu={[{ titulo: "Nueva cita", icono: Calendar, onClick: () => navigate(`/app/citas/nueva?patientId=${p.id}&doctorId=${doctorId}`) }]}
        />
      )}
      vacio="Este profesional aún no tiene pacientes asignados. Usa «Asignar paciente»."
    />
  );
};

export default DoctorPatients;
