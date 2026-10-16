import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, UserPlus } from "lucide-react";
import {
  fetchProfessionals, MODALITY_LABEL, PRO_TYPE_LABEL, type ProfessionalRow,
} from "@/components/agenda/agenda-api";
import { ModuleHeader } from "@/components/kit/ModuleHeader";
import { RowActions } from "@/components/kit/RowActions";
import {
  DataTable, StatusCell, TableToolbar, useDataTable,
  type StatusTone, type TableColumn, type TableFilter, type TableSegment,
} from "@/components/kit/table";
import { EnableProfessionalDialog } from "@/components/professionals/EnableProfessionalDialog";
import { professionalKeys } from "@/components/professionals/professional-form";
import { useAuth } from "@/contexts/AuthContext";

type Status = "active" | "inactive" | "disabled";

const STATUS_LABEL: Record<Status, string> = { active: "Activo", inactive: "Inactivo", disabled: "No habilitado" };
const STATUS_TONE: Record<Status, StatusTone> = { active: "success", inactive: "warning", disabled: "neutral" };

const statusOf = (r: ProfessionalRow): Status => (r.id === null ? "disabled" : r.activo ? "active" : "inactive");
const typeLabel = (r: ProfessionalRow) => (r.id === null ? "No habilitado" : PRO_TYPE_LABEL[r.tipo ?? ""] ?? r.tipo ?? "—");
const modalitiesText = (r: ProfessionalRow) => (r.modalidades?.length ? r.modalidades.map((m) => MODALITY_LABEL[m]).join(", ") : null);
const scheduleText = (r: ProfessionalRow) => {
  if (r.id === null) return null;
  if (!r.bloquesHorario) return "Sin horario";
  return `${r.bloquesHorario} ${r.bloquesHorario === 1 ? "bloque" : "bloques"}`;
};

const COLUMNS: TableColumn<ProfessionalRow>[] = [
  { id: "name", title: "Nombre", value: (r) => r.nombre, primary: true, alwaysVisible: true, className: "min-w-[200px]" },
  { id: "type", title: "Tipo", value: typeLabel },
  { id: "specialty", title: "Especialidad", value: (r) => r.especialidad },
  { id: "registry", title: "Registro", value: (r) => r.registroProfesional, className: "font-mono text-xs" },
  { id: "modalities", title: "Modalidades", value: modalitiesText },
  { id: "schedule", title: "Horario", value: scheduleText, className: "tabular-nums" },
  { id: "duration", title: "Duración de cita", value: (r) => r.duracionCitaMin, cell: (r) => (r.duracionCitaMin ? `${r.duracionCitaMin} min` : "—"), className: "tabular-nums", hidden: true },
  {
    id: "status", title: "Estado", value: (r) => STATUS_LABEL[statusOf(r)], flush: true,
    cell: (r) => <StatusCell tone={STATUS_TONE[statusOf(r)]} text={STATUS_LABEL[statusOf(r)]} />,
  },
];

const FILTERS: TableFilter<ProfessionalRow>[] = [
  { id: "type", title: "Tipo", value: typeLabel },
  { id: "modality", title: "Modalidad", value: (r) => (r.modalidades ?? []).map((m) => MODALITY_LABEL[m]) },
  { id: "status", title: "Estado", value: (r) => STATUS_LABEL[statusOf(r)] },
];

const SEGMENTS: TableSegment<ProfessionalRow>[] = [
  { id: "all", title: "Todos", match: () => true },
  { id: "professionals", title: "Profesionales", match: (r) => r.id !== null },
  { id: "disabled", title: "No habilitados", match: (r) => r.id === null },
];

const rowKey = (r: ProfessionalRow) => r.userId;

const ProfessionalsPage = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const [enabling, setEnabling] = useState<ProfessionalRow | null>(null);
  const { data: rows = [], isLoading, error } = useQuery({ queryKey: professionalKeys.list, queryFn: fetchProfessionals });
  const t = useDataTable({ id: "agenda.professionals", rows, columns: COLUMNS, rowKey, filters: FILTERS, segments: SEGMENTS });

  const open = (r: ProfessionalRow) => {
    if (r.id) navigate(`/app/profesionales/${r.id}`);
    else if (isAdmin) setEnabling(r);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 py-6">
      <ModuleHeader
        title="Profesionales"
        secondary={[{ title: "Formatos de la atención", icon: ClipboardList, onClick: () => navigate("/app/profesionales/formatos") }]}
      />
      <DataTable
        t={t}
        loading={isLoading}
        onRowClick={open}
        toolbar={<TableToolbar t={t} name={["persona", "personas"]} placeholder="Buscar por nombre, especialidad o registro" fileName="profesionales" />}
        actions={(r) =>
          r.id ? (
            <RowActions name={r.nombre} onView={() => open(r)} />
          ) : (
            <RowActions
              name={r.nombre}
              menu={isAdmin ? [{ title: "Habilitar como profesional", icon: UserPlus, onClick: () => setEnabling(r) }] : []}
            />
          )
        }
        empty={error ? `No se pudieron cargar los profesionales: ${(error as Error).message}` : "Aún no hay miembros activos en la empresa."}
      />
      <EnableProfessionalDialog member={enabling} onClose={() => setEnabling(null)} />
    </div>
  );
};

export default ProfessionalsPage;
