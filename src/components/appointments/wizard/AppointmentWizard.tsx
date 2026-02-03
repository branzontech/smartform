import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, User, ClipboardList, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExtendedPatient } from "../PatientPanel";
import { PatientSearchStep } from "./PatientSearchStep";
import { AdmissionStep, AdmissionData } from "./AdmissionStep";
import { SchedulingStep, SchedulingData } from "./SchedulingStep";

export interface WizardData {
  patient: ExtendedPatient | null;
  admission: AdmissionData | null;
  scheduling: SchedulingData | null;
}

interface AppointmentWizardProps {
  onComplete: (data: WizardData) => void;
  initialPatients?: ExtendedPatient[];
  existingAppointments?: any[];
}

const steps = [
  { id: 1, title: "Paciente", icon: User, description: "Buscar o crear" },
  { id: 2, title: "Admisión", icon: ClipboardList, description: "Opcional" },
  { id: 3, title: "Agenda", icon: Calendar, description: "Horario" },
];

export const AppointmentWizard: React.FC<AppointmentWizardProps> = ({
  onComplete,
  initialPatients = [],
  existingAppointments = []
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

  const handleAdmissionComplete = (admission: AdmissionData | null) => {
    setWizardData(prev => ({ ...prev, admission }));
    goToStep(3);
  };

  const handleSchedulingComplete = (scheduling: SchedulingData) => {
    const finalData = { ...wizardData, scheduling };
    setWizardData(finalData);
    onComplete(finalData);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header con stepper */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-20 z-40 mb-8"
        >
          {/* Stepper Windows 11 style */}
          <div className="relative flex items-center justify-around bg-card/80 backdrop-blur-2xl rounded-3xl p-6 shadow-xl border border-border/40">
            {/* Progress line - centered between steps */}
            <div className="absolute left-1/2 -translate-x-1/2 top-[38px] w-[60%] h-0.5 bg-muted/50 rounded-full z-0">
              <motion.div 
                className="h-full bg-gradient-to-r from-primary via-primary to-primary/60 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>

            {steps.map((step) => {
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              const Icon = step.icon;

              return (
                <motion.button
                  key={step.id}
                  onClick={() => {
                    if (step.id < currentStep || (step.id === 2 && wizardData.patient)) {
                      goToStep(step.id);
                    }
                  }}
                  disabled={step.id > currentStep && !(step.id === 2 && wizardData.patient)}
                  className={cn(
                    "relative z-10 flex flex-col items-center gap-2 transition-all duration-300",
                    (step.id <= currentStep || (step.id === 2 && wizardData.patient)) && "cursor-pointer"
                  )}
                  whileHover={{ scale: step.id <= currentStep ? 1.05 : 1 }}
                  whileTap={{ scale: step.id <= currentStep ? 0.95 : 1 }}
                >
                  <motion.div
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg",
                      isCompleted && "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground",
                      isCurrent && "bg-gradient-to-br from-primary/90 to-primary text-primary-foreground ring-4 ring-primary/20",
                      !isCompleted && !isCurrent && "bg-muted/80 text-muted-foreground"
                    )}
                    animate={{
                      scale: isCurrent ? 1.1 : 1,
                    }}
                  >
                    {isCompleted ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </motion.div>
                  <div className="text-center">
                    <p className={cn(
                      "font-semibold text-sm transition-colors",
                      (isCurrent || isCompleted) ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Content area */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
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
                <AdmissionStep
                  patient={wizardData.patient}
                  onComplete={handleAdmissionComplete}
                  onBack={handleBack}
                />
              )}

              {currentStep === 3 && wizardData.patient && (
                <SchedulingStep
                  patient={wizardData.patient}
                  existingAppointments={existingAppointments}
                  onComplete={handleSchedulingComplete}
                  onBack={handleBack}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AppointmentWizard;
