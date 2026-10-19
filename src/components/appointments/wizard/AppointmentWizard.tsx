import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, ClipboardList, Calendar, FileText, ArrowLeft, ArrowRight } from "lucide-react";
import { SurfaceCard } from "@/components/kit/surface";
import { VerticalStepper, type StepItem } from "@/components/kit/stepper/VerticalStepper";
import { Button } from "@/components/ui/button";
import { ExtendedPatient } from "../PatientPanel";
import { PatientSearchStep } from "./PatientSearchStep";
import { PatientDetailStep } from "./PatientDetailStep";
import { AdmissionStep, AdmissionData } from "./AdmissionStep";
import { SchedulingStep, SchedulingData } from "./SchedulingStep";
import { TooltipProvider } from "@/components/ui/tooltip";

export interface WizardData {
  patient: ExtendedPatient | null;
  admission: AdmissionData | null;
  scheduling: SchedulingData | null;
}

interface AppointmentWizardProps {
  /** Guarda la cita; mientras la promesa no termina, el botón de agendar queda ocupado. */
  onComplete: (data: WizardData) => Promise<void> | void;
  initialPatients?: ExtendedPatient[];
}

const steps = [
  { id: 1, title: "Paciente", icon: User, description: "Buscar o crear" },
  { id: 2, title: "Detalle", icon: FileText, description: "Consultar datos" },
  { id: 3, title: "Admisión", icon: ClipboardList, description: "Opcional" },
  { id: 4, title: "Agenda", icon: Calendar, description: "Horario" },
];

export const AppointmentWizard: React.FC<AppointmentWizardProps> = ({
  onComplete,
  initialPatients = [],
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({
    patient: null,
    admission: null,
    scheduling: null
  });
  const [direction, setDirection] = useState(0);

  const goToStep = (step: number) => {
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
  };

  const handlePatientSelected = (patient: ExtendedPatient) => {
    setWizardData(prev => ({ ...prev, patient }));
    goToStep(2);
  };

  const handlePatientDetailContinue = () => {
    goToStep(3);
  };

  const handlePatientUpdated = (patient: ExtendedPatient) => {
    setWizardData(prev => ({ ...prev, patient }));
  };

  const handleAdmissionComplete = (admission: AdmissionData | null) => {
    setWizardData(prev => ({ ...prev, admission }));
    goToStep(4);
  };

  const [saving, setSaving] = useState(false);

  const handleSchedulingComplete = async (scheduling: SchedulingData) => {
    const finalData = { ...wizardData, scheduling };
    setWizardData(finalData);
    setSaving(true);
    try {
      await onComplete(finalData);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    })
  };

  const patientName = wizardData.patient ? `${wizardData.patient.firstName} ${wizardData.patient.lastName}`.trim() : undefined;
  const stepItems: StepItem[] = [
    { id: 1, title: "Paciente", description: "Buscar o crear", summary: patientName },
    { id: 2, title: "Detalle", description: "Revisar sus datos", summary: "Datos revisados" },
    {
      id: 3,
      title: "Admisión",
      description: "Opcional",
      summary: wizardData.admission ? wizardData.admission.servicio_nombre || wizardData.admission.contrato_nombre : "Sin admisión",
    },
    { id: 4, title: "Agenda", description: "Profesional y horario" },
  ];

  return (
    <TooltipProvider>
      <div className="h-full">
      <div className="grid h-full gap-5 py-3 lg:grid-cols-[248px_minmax(0,1fr)]">
        {/* Riel del asistente, como en la atención: pasos, lo elegido y las acciones */}
        <aside className="lg:min-h-0">
          <SurfaceCard className="flex flex-col gap-4">
            <div className="space-y-0.5 px-2">
              <h1 className="text-[15px] font-semibold text-foreground">Nueva cita</h1>
              <p className="text-[13px] text-muted-foreground">Paso {currentStep} de {steps.length}</p>
            </div>
            <VerticalStepper steps={stepItems} current={currentStep - 1} onStepClick={(i) => goToStep(i + 1)} />
            {currentStep > 1 && (
              <div className="flex flex-col gap-2 border-t border-border pt-4">
                {currentStep === 2 && wizardData.patient && (
                  <Button onClick={handlePatientDetailContinue} className="h-10 w-full gap-2 rounded-full">
                    Continuar
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" onClick={handleBack} className="h-10 w-full gap-2 rounded-full">
                  <ArrowLeft className="h-4 w-4" />
                  Atrás
                </Button>
              </div>
            )}
          </SurfaceCard>
        </aside>

        {/* Contenido del paso: cada paso maneja su propio scroll */}
        <section className="min-h-0 min-w-0 overflow-hidden">
            <div className="relative overflow-hidden h-full">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="h-full"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.2 }
                }}
              >
                {currentStep === 1 && (
                  <PatientSearchStep
                    patients={initialPatients}
                    onPatientSelected={handlePatientSelected}
                    onCreatePatient={(patient) => {
                      handlePatientSelected(patient as ExtendedPatient);
                    }}
                  />
                )}

                {currentStep === 2 && wizardData.patient && (
                  <PatientDetailStep
                    patient={wizardData.patient}
                    onContinue={handlePatientDetailContinue}
                    onBack={() => goToStep(1)}
                    onPatientUpdated={handlePatientUpdated}
                  />
                )}

                {currentStep === 3 && wizardData.patient && (
                  <AdmissionStep
                    patient={wizardData.patient}
                    onComplete={handleAdmissionComplete}
                    onBack={handleBack}
                    initialData={wizardData.admission}
                  />
                )}

                {currentStep === 4 && wizardData.patient && (
                  <SchedulingStep
                    patient={wizardData.patient}
                    onComplete={handleSchedulingComplete}
                    onBack={handleBack}
                    saving={saving}
                  />
                )}
              </motion.div>
            </AnimatePresence>
            </div>
        </section>
      </div>
      </div>
    </TooltipProvider>
  );
};

export default AppointmentWizard;
