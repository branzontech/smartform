import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useClinicalHistories } from "@/components/forms/clinical-histories";
import {
  CITA_PRIORITY_LABEL, MODALITY_LABEL, REQUEST_CHANNEL_LABEL, fetchAppointmentTypes, formatLongDay, formatShortDay, localDay,
} from "@/components/agenda/agenda-api";
import type { ExtendedPatient } from "../PatientPanel";
import { frequencyText, type ChosenSession, type Recurrence, type SessionCheck } from "@/components/agenda/plans-api";
import type { ConfirmData, NeedData, PickedSlot } from "./wizard-model";
import { useCoverage } from "./useCoverage";

interface ConfirmStepProps {
  patient: ExtendedPatient;
  need: NeedData;
  slot: PickedSlot | null;
  plan: { recurrencia: Recurrence; checks: SessionCheck[]; sesiones: ChosenSession[] } | null;
  value: ConfirmData;
  onChange: (next: ConfirmData) => void;
}

const NONE = "ninguno";
const surface = "rounded-card bg-card p-5 shadow-card dark:border dark:border-border dark:shadow-none";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 py-2">
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="text-[13px] font-medium text-foreground">{children}</dd>
    </div>
  );
}

function placeOf(need: NeedData, slot: PickedSlot | null): string {
  if (need.modalidad === "domicilio") return `Domicilio · ${need.direccion.trim()}`;
  if (need.modalidad === "telemedicina") return need.enlaceTelemedicina.trim() ? "Telemedicina · con enlace" : "Telemedicina · enlace pendiente";
  return slot?.sede ? `En sede · ${slot.sede}` : MODALITY_LABEL.sede;
}

/** Profesionales del plan, sin repetir, en el orden de las sesiones. */
const planProfessionals = (checks: SessionCheck[], sesiones: ChosenSession[]) =>
  [...new Set(sesiones.map((s) => checks.find((c) => c.profesionalId === s.profesionalId)?.profesional).filter(Boolean))].join(", ");

/** Paso «Confirmar»: resumen de la cita, convenio, servicio, historia e indicaciones. */
export function ConfirmStep({ patient, need, slot, plan, value, onChange }: ConfirmStepProps) {
  const set = (patch: Partial<ConfirmData>) => onChange({ ...value, ...patch });
  const { contratos, servicios, sinTarifario } = useCoverage(value.contratoId ?? "");
  const histories = useClinicalHistories();
  const types = useQuery({ queryKey: ["agenda", "tipos-cita", "activos"], queryFn: () => fetchAppointmentTypes(true), staleTime: 5 * 60_000 });
  const tipo = types.data?.find((t) => t.id === need.tipoCitaId) ?? null;

  const request = [
    need.formaSolicitud ? REQUEST_CHANNEL_LABEL[need.formaSolicitud] : null,
    need.fechaDeseada ? `deseaba el ${formatShortDay(need.fechaDeseada)}` : null,
  ].filter(Boolean);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className={cn(surface, "content-start")}>
        <h2 className="text-[15px] font-semibold">Resumen</h2>
        <dl className="mt-2 divide-y divide-border">
          <Row label="Paciente">{`${patient.firstName} ${patient.lastName}`.trim()}</Row>
          <Row label="Cita">{need.tipoCita ?? "Sin tipo definido"}</Row>
          <Row label="Motivo">{need.motivo.trim()}</Row>
          {slot && (
            <>
              <Row label="Cuándo">
                <span className="first-letter:uppercase">{formatLongDay(slot.fecha)}</span>, {slot.hora} · {need.duracionMin} min
              </Row>
              <Row label="Profesional">{slot.profesional}</Row>
            </>
          )}
          {plan && plan.sesiones.length > 0 && (
            <>
              <Row label="Plan">
                {plan.sesiones.length} sesiones · {frequencyText(plan.recurrencia)} · {need.duracionMin} min
              </Row>
              <Row label="Fechas">
                Del {formatShortDay(localDay(plan.sesiones[0].inicio))} al {formatShortDay(localDay(plan.sesiones[plan.sesiones.length - 1].inicio))}
              </Row>
              <Row label="Profesionales">{planProfessionals(plan.checks, plan.sesiones)}</Row>
            </>
          )}
          <Row label="Lugar">{placeOf(need, slot)}</Row>
          <Row label="Prioridad">{CITA_PRIORITY_LABEL[need.prioridad]}</Row>
          {request.length > 0 && <Row label="Solicitud">{request.join(" · ")}</Row>}
        </dl>
      </section>

      <section className={cn(surface, "grid content-start gap-4")}>
        <h2 className="text-[15px] font-semibold">Cobertura e indicaciones</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="cf-contract">Convenio</Label>
            <Select value={value.contratoId ?? NONE} onValueChange={(v) => set({ contratoId: v === NONE ? null : v, servicioId: null })}>
              <SelectTrigger id="cf-contract" className="h-10">
                <SelectValue placeholder={contratos.isLoading ? "Cargando…" : "Sin convenio"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sin convenio (particular)</SelectItem>
                {(contratos.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre_convenio} · {c.pagador_nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cf-service">Servicio</Label>
            <Select value={value.servicioId ?? NONE} onValueChange={(v) => set({ servicioId: v === NONE ? null : v })} disabled={!value.contratoId || sinTarifario}>
              <SelectTrigger id="cf-service" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{tipo?.servicio ? `El del tipo de cita: ${tipo.servicio}` : "Sin servicio"}</SelectItem>
                {(servicios.data ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.codigo_servicio} · {s.descripcion_servicio}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {sinTarifario && <p className="text-xs text-muted-foreground">Este convenio no tiene tarifario.</p>}
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cf-history">Historia clínica</Label>
          <Select value={value.formularioId ?? NONE} onValueChange={(v) => set({ formularioId: v === NONE ? null : v })}>
            <SelectTrigger id="cf-history" className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>{tipo?.formulario ? `La del tipo de cita: ${tipo.formulario}` : "La habitual del profesional"}</SelectItem>
              {(histories.data ?? []).map((h) => (
                <SelectItem key={h.id} value={h.id}>{h.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cf-instructions">Indicaciones para el paciente (opcional)</Label>
          <Textarea
            id="cf-instructions"
            rows={2}
            value={value.instrucciones}
            onChange={(e) => set({ instrucciones: e.target.value })}
            maxLength={1000}
            placeholder="Por ejemplo: llegar 15 minutos antes, traer exámenes"
            className="resize-y"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cf-notes">Notas para el profesional (opcional)</Label>
          <Textarea id="cf-notes" rows={2} value={value.notas} onChange={(e) => set({ notas: e.target.value })} maxLength={2000} className="resize-y" />
        </div>
      </section>
    </div>
  );
}
