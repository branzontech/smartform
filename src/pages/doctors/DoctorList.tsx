import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ModuleHeader } from "@/components/kit/ModuleHeader";
import { RowActions } from "@/components/kit/RowActions";
import {
  TableToolbar, StatusCell, DataTable, useDataTable,
  type TableColumn, type TableFilter, type TableSegment, type StatusTone,
} from "@/components/kit/table";
import { useToast } from "@/hooks/use-toast";
import { getAllDoctors } from "@/utils/doctor-utils";
import type { Doctor } from "@/types/patient-types";

const STATUS_TONE: Record<Doctor["status"], StatusTone> = {
  Activo: "success",
  Vacaciones: "warning",
  Inactivo: "error",
};

/** Una celda, un dato, una línea. Lo demás está en el perfil del profesional. */
const COLUMNS: TableColumn<Doctor>[] = [
  { id: "doctor", title: "Profesional", value: (d) => d.name, primary: true, alwaysVisible: true, className: "min-w-[220px]" },
  { id: "specialty", title: "Especialidad", value: (d) => d.specialty },
  { id: "license", title: "Registro", value: (d) => d.licenseNumber, className: "font-mono text-xs" },
  { id: "document", title: "Documento", value: (d) => d.documentId, className: "font-mono text-xs", hidden: true },
  { id: "phone", title: "Teléfono", value: (d) => d.contactNumber, className: "tabular-nums" },
  { id: "email", title: "Correo", value: (d) => d.email, hidden: true },
  {
    id: "status", title: "Estado", value: (d) => d.status, flush: true,
    cell: (d) => <StatusCell tone={STATUS_TONE[d.status] ?? "neutral"} text={d.status} />,
  },
];

const specialtiesOf = (d: Doctor) => (d.specialties?.length ? d.specialties : [d.specialty]);

const FILTERS: TableFilter<Doctor>[] = [{ id: "specialty", title: "Especialidad", value: specialtiesOf }];

const SEGMENTS: TableSegment<Doctor>[] = [
  { id: "all", title: "Todos", match: () => true },
  { id: "active", title: "Activos", match: (d) => d.status === "Activo" },
  { id: "onVacation", title: "En vacaciones", match: (d) => d.status === "Vacaciones" },
  { id: "inactive", title: "Inactivos", match: (d) => d.status === "Inactivo" },
];

const rowKey = (d: Doctor) => d.id;

/**
 * Médicos y profesionales. Fuente: getAllDoctors (datos simulados guardados en
 * localStorage hasta que exista la tabla de profesionales).
 */
const DoctorList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getAllDoctors();
        if (alive) setDoctors(data);
      } catch (error) {
        if (alive) {
          toast({
            title: "No se pudieron cargar los profesionales",
            description: error instanceof Error ? error.message : undefined,
            variant: "destructive",
          });
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [toast]);

  const t = useDataTable({ id: "doctors.list", rows: doctors, columns: COLUMNS, rowKey, filters: FILTERS, segments: SEGMENTS });

  const view = (d: Doctor) => navigate(`/app/medicos/${d.id}`);

  return (
    <div className="mx-auto max-w-7xl space-y-5 py-6">
      <ModuleHeader
        title="Médicos y profesionales"
        primary={{ title: "Nuevo profesional", onClick: () => navigate("/app/medicos/nuevo") }}
      />
      <DataTable
        t={t}
        loading={loading}
        onRowClick={view}
        toolbar={<TableToolbar t={t} name={["profesional", "profesionales"]} placeholder="Buscar por nombre o especialidad" fileName="profesionales" />}
        actions={(d) => <RowActions name={d.name} onView={() => view(d)} />}
        empty="Aún no hay profesionales. Registra uno con «Nuevo profesional»."
      />
    </div>
  );
};

export default DoctorList;
