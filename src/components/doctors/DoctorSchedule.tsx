import { SimpleTable, type SimpleColumn } from "@/components/kit/table";
import type { DaySchedule, Doctor, WeeklySchedule } from "@/types/patient-types";

interface DoctorScheduleProps {
  doctor: Doctor;
}

interface ScheduleDay {
  key: keyof WeeklySchedule;
  name: string;
  schedule?: DaySchedule;
}

const DAYS: { key: keyof WeeklySchedule; name: string }[] = [
  { key: "monday", name: "Lunes" },
  { key: "tuesday", name: "Martes" },
  { key: "wednesday", name: "Miércoles" },
  { key: "thursday", name: "Jueves" },
  { key: "friday", name: "Viernes" },
  { key: "saturday", name: "Sábado" },
  { key: "sunday", name: "Domingo" },
];

const isWorkingDay = (d?: DaySchedule) => !!d?.isWorking;

const COLUMNS: SimpleColumn<ScheduleDay>[] = [
  { id: "day", title: "Día", cell: (d) => d.name, primary: true, className: "w-32" },
  {
    id: "schedule", title: "Horario", className: "tabular-nums",
    cell: (d) => (isWorkingDay(d.schedule) ? `${d.schedule?.startTime ?? "—"} – ${d.schedule?.endTime ?? "—"}` : "No disponible"),
  },
  {
    id: "breaks", title: "Descansos", className: "tabular-nums",
    cell: (d) => (isWorkingDay(d.schedule) && d.schedule?.breaks?.length
      ? d.schedule.breaks.map((b) => `${b.startTime} – ${b.endTime}`).join(", ")
      : "—"),
  },
];

/** Horario semanal del profesional (pestaña del perfil). */
const DoctorSchedule = ({ doctor }: DoctorScheduleProps) => {
  const rows: ScheduleDay[] = doctor.schedule ? DAYS.map((d) => ({ ...d, schedule: doctor.schedule?.[d.key] })) : [];

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">Horario semanal</h2>
      <SimpleTable
        columns={COLUMNS}
        rows={rows}
        rowKey={(d) => d.key}
        empty="No hay horario definido para este profesional."
      />
    </section>
  );
};

export default DoctorSchedule;
