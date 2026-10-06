import { TablaSimple, type ColumnaSimple } from "@/components/kit/tabla";
import type { DaySchedule, Doctor, WeeklySchedule } from "@/types/patient-types";

interface DoctorScheduleProps {
  doctor: Doctor;
}

interface DiaHorario {
  clave: keyof WeeklySchedule;
  nombre: string;
  horario?: DaySchedule;
}

const DIAS: { clave: keyof WeeklySchedule; nombre: string }[] = [
  { clave: "monday", nombre: "Lunes" },
  { clave: "tuesday", nombre: "Martes" },
  { clave: "wednesday", nombre: "Miércoles" },
  { clave: "thursday", nombre: "Jueves" },
  { clave: "friday", nombre: "Viernes" },
  { clave: "saturday", nombre: "Sábado" },
  { clave: "sunday", nombre: "Domingo" },
];

const trabaja = (d?: DaySchedule) => !!d?.isWorking;

const COLUMNAS: ColumnaSimple<DiaHorario>[] = [
  { id: "dia", titulo: "Día", celda: (d) => d.nombre, principal: true, className: "w-32" },
  {
    id: "horario", titulo: "Horario", className: "tabular-nums",
    celda: (d) => (trabaja(d.horario) ? `${d.horario?.startTime ?? "—"} – ${d.horario?.endTime ?? "—"}` : "No disponible"),
  },
  {
    id: "descansos", titulo: "Descansos", className: "tabular-nums",
    celda: (d) => (trabaja(d.horario) && d.horario?.breaks?.length
      ? d.horario.breaks.map((b) => `${b.startTime} – ${b.endTime}`).join(", ")
      : "—"),
  },
];

/** Horario semanal del profesional (pestaña del perfil). */
const DoctorSchedule = ({ doctor }: DoctorScheduleProps) => {
  const filas: DiaHorario[] = doctor.schedule ? DIAS.map((d) => ({ ...d, horario: doctor.schedule?.[d.clave] })) : [];

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">Horario semanal</h2>
      <TablaSimple
        columnas={COLUMNAS}
        filas={filas}
        claveFila={(d) => d.clave}
        vacio="No hay horario definido para este profesional."
      />
    </section>
  );
};

export default DoctorSchedule;
