import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RowActions } from "@/components/kit/RowActions";
import { TableToolbar, DataTable, primaryButtonClass, useDataTable, type TableColumn, type TableFilter, type TableSegment } from "@/components/kit/table";
import { useToast } from "@/hooks/use-toast";
import type { Patient } from "@/types/patient-types";
import { getDoctorPatients } from "@/utils/doctor-utils";

interface DoctorPatientsProps {
  doctorId: string;
}

function ageOf(date: string): number | null {
  const n = new Date(date);
  if (Number.isNaN(n.getTime())) return null;
  const today = new Date();
  let years = today.getFullYear() - n.getFullYear();
  if (today.getMonth() < n.getMonth() || (today.getMonth() === n.getMonth() && today.getDate() < n.getDate())) years--;
  return years;
}

const rightAligned = "text-right tabular-nums";

const COLUMNS: TableColumn<Patient>[] = [
  { id: "patient", title: "Paciente", value: (p) => p.name, primary: true, alwaysVisible: true, className: "min-w-[220px]" },
  { id: "document", title: "Documento", value: (p) => p.documentId, className: "font-mono text-xs" },
  { id: "age", title: "Edad", value: (p) => ageOf(p.dateOfBirth), cell: (p) => ageOf(p.dateOfBirth) ?? "—", className: rightAligned },
  { id: "gender", title: "Género", value: (p) => p.gender },
  { id: "phone", title: "Teléfono", value: (p) => p.contactNumber, className: "tabular-nums" },
  { id: "email", title: "Correo", value: (p) => p.email, hidden: true },
];

const FILTERS: TableFilter<Patient>[] = [{ id: "gender", title: "Género", value: (p) => p.gender }];

const SEGMENTS: TableSegment<Patient>[] = [
  { id: "all", title: "Todos", match: () => true },
  { id: "minors", title: "Menores de edad", match: (p) => (ageOf(p.dateOfBirth) ?? 99) < 18 },
  { id: "seniors", title: "Adultos mayores", match: (p) => (ageOf(p.dateOfBirth) ?? 0) >= 60 },
];

const rowKey = (p: Patient) => p.id;

/**
 * Pacientes asignados a un profesional (pestaña del detalle del médico).
 * Fuente: getDoctorPatients (datos simulados guardados en localStorage).
 */
const DoctorPatients = ({ doctorId }: DoctorPatientsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getDoctorPatients(doctorId);
        if (alive) setPatients(data);
      } catch (error) {
        if (alive) {
          toast({
            title: "No se pudieron cargar los pacientes",
            description: error instanceof Error ? error.message : undefined,
            variant: "destructive",
          });
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [doctorId, toast]);

  const t = useDataTable({ id: "doctors.patients", rows: patients, columns: COLUMNS, rowKey, filters: FILTERS, segments: SEGMENTS });

  const view = (p: Patient) => navigate(`/app/pacientes/${p.id}`);
  const assign = () => navigate(`/app/admisiones?doctorId=${doctorId}`);

  return (
    <DataTable
      t={t}
      loading={loading}
      onRowClick={view}
      toolbar={
        <TableToolbar
          t={t}
          name={["paciente", "pacientes"]}
          placeholder="Buscar por nombre o documento"
          fileName="pacientes-asignados"
          actions={
            <Button size="sm" className={primaryButtonClass} onClick={assign}>
              <UserPlus className="h-4 w-4" /> Asignar paciente
            </Button>
          }
        />
      }
      actions={(p) => (
        <RowActions
          name={p.name}
          onView={() => view(p)}
          menu={[{ title: "Nueva cita", icon: Calendar, onClick: () => navigate(`/app/citas/nueva?patientId=${p.id}&doctorId=${doctorId}`) }]}
        />
      )}
      empty="Este profesional aún no tiene pacientes asignados. Usa «Asignar paciente»."
    />
  );
};

export default DoctorPatients;
