import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { SurfaceCard } from "@/components/kit/surface";
import { VerticalStepper, type StepItem } from "@/components/kit/stepper/VerticalStepper";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { formatShortDay } from "@/components/agenda/agenda-api";
import { ExtendedPatient } from "../PatientPanel";
import { PatientSearchStep } from "./PatientSearchStep";
import { PatientLine } from "./PatientLine";
import { NeedStep } from "./NeedStep";
import { SchedulingStep } from "./SchedulingStep";
import { ConfirmStep } from "./ConfirmStep";
import { emptyConfirm, emptyNeed, invalidatesSlot, needMissing, type ConfirmData, type NeedData, type PickedSlot } from "./wizard-model";

export interface WizardData {
  patient: ExtendedPatient;
  need: NeedData;
  slot: PickedSlot;
  confirm: ConfirmData;
}

interface AppointmentWizardProps {
  /** Guarda la cita; mientras la promesa no termina, el botón de agendar queda ocupado. */
  onComplete: (data: WizardData) => Promise<void> | void;
  initialPatients?: ExtendedPatient[];
}

const TOTAL_STEPS = 4;
const slide = {
  enter: (dir: number) => ({ x: dir > 0 ? 32 : -32, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -32 : 32, opacity: 0 }),
};

const addressOf = (p: ExtendedPatient) => [p.address, p.city].filter(Boolean).join(", ");

/** Nueva cita en cuatro pasos: paciente, qué necesita, cuándo y con quién, confirmar. */
export const AppointmentWizard: React.FC<AppointmentWizardProps> = ({ onComplete, initialPatients = [] }) => {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [patient, setPatient] = useState<ExtendedPatient | null>(null);
  const [need, setNeed] = useState<NeedData>(emptyNeed(""));
  const [slot, setSlot] = useState<PickedSlot | null>(null);
  const [confirm, setConfirm] = useState<ConfirmData>(emptyConfirm());
  const [saving, setSaving] = useState(false);

  const missingNeed = needMissing(need);
  // Hasta qué paso se puede llegar con lo que ya está diligenciado.
  const reachable = !patient ? 1 : missingNeed.length ? 2 : !slot ? 3 : 4;

  const goTo = (target: number) => {
    if (target > reachable || target < 1) return;
    setDirection(target > step ? 1 : -1);
    setStep(target);
  };

  const selectPatient = (p: ExtendedPatient) => {
    if (p.id !== patient?.id) {
      setNeed(emptyNeed(addressOf(p)));
      setSlot(null);
      setConfirm(emptyConfirm());
    }
    setPatient(p);
    setDirection(1);
    setStep(2);
  };

  const changeNeed = (next: NeedData) => {
    if (invalidatesSlot(need, next)) setSlot(null);
    setNeed(next);
  };

  const submit = async () => {
    if (!patient || !slot || missingNeed.length) return;
    setSaving(true);
    try {
      await onComplete({ patient, need, slot, confirm });
    } finally {
      setSaving(false);
    }
  };

  const hint = step === 2 && missingNeed.length ? `Falta ${missingNeed.join(", ")}.` : step === 3 && !slot ? "Elige un cupo." : null;
  const stepItems: StepItem[] = [
    { id: 1, title: "Paciente", description: "Buscar o crear", summary: patient ? `${patient.firstName} ${patient.lastName}`.trim() : undefined },
    { id: 2, title: "Qué necesita", description: "Tipo, motivo y modalidad", summary: need.tipoCita ?? need.motivo.trim().slice(0, 40) },
    { id: 3, title: "Cuándo y con quién", description: "Profesional y horario", summary: slot ? `${formatShortDay(slot.fecha)}, ${slot.hora} · ${slot.profesional}` : undefined },
    { id: 4, title: "Confirmar", description: "Cobertura e indicaciones" },
  ];

  return (
    <TooltipProvider>
      <div className="grid h-full content-start gap-5 overflow-y-auto py-3 lg:grid-cols-[264px_minmax(0,1fr)] lg:content-stretch lg:overflow-visible">
        {/* Riel del asistente, como en la atención: pasos, lo elegido y las acciones */}
        <aside className="lg:min-h-0">
          <SurfaceCard className="flex flex-col gap-4">
            <div className="space-y-0.5 px-2">
              <h1 className="text-[15px] font-semibold text-foreground">Nueva cita</h1>
              <p className="text-[13px] text-muted-foreground">
                Paso {step} de {TOTAL_STEPS}
              </p>
            </div>
            <VerticalStepper steps={stepItems} current={step - 1} onStepClick={(i) => goTo(i + 1)} />
            {step > 1 && (
              <div className="flex flex-col gap-2 border-t border-border pt-4">
                {hint && <p className="px-2 text-xs text-muted-foreground">{hint}</p>}
                {step < TOTAL_STEPS ? (
                  <Button onClick={() => goTo(step + 1)} disabled={reachable <= step} className="h-9 w-full gap-2 rounded-full">
                    Continuar
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={() => void submit()} disabled={saving || reachable < TOTAL_STEPS} className="h-9 w-full gap-2 rounded-full">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Agendar cita
                  </Button>
                )}
                <Button variant="ghost" onClick={() => goTo(step - 1)} className="h-9 w-full gap-2 rounded-full">
                  <ArrowLeft className="h-4 w-4" />
                  Atrás
                </Button>
              </div>
            )}
          </SurfaceCard>
        </aside>

        {/* Contenido del paso. En pantalla ancha: el buscador maneja su scroll y los demás usan este; en estrecha, scrollea la página */}
        <section className={step === 1 ? "min-w-0 lg:min-h-0 lg:overflow-hidden" : "min-w-0 pb-6 lg:min-h-0 lg:overflow-y-auto"}>
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={step}
              custom={direction}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={step === 1 ? "lg:h-full" : "grid gap-4"}
            >
              {step === 1 && <PatientSearchStep patients={initialPatients} onPatientSelected={selectPatient} onCreatePatient={(p) => selectPatient(p as ExtendedPatient)} />}
              {step > 1 && step < 4 && patient && <PatientLine patient={patient} onPatientUpdated={setPatient} />}
              {step === 2 && <NeedStep value={need} onChange={changeNeed} />}
              {step === 3 && patient && <SchedulingStep patientId={patient.id} need={need} value={slot} onChange={setSlot} />}
              {step === 4 && patient && slot && <ConfirmStep patient={patient} need={need} slot={slot} value={confirm} onChange={setConfirm} />}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </TooltipProvider>
  );
};

export default AppointmentWizard;
