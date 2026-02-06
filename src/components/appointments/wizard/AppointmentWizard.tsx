import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, User, ClipboardList, Calendar, MapPin, MessageSquare, Bell, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExtendedPatient } from "../PatientPanel";
import { PatientSearchStep } from "./PatientSearchStep";
import { AdmissionStep, AdmissionData } from "./AdmissionStep";
import { SchedulingStep, SchedulingData } from "./SchedulingStep";
import { MapPanelDrawer } from "./MapPanelDrawer";
import { Dock, DockItem } from "@/components/ui/dock";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

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
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");

  // Fetch Google Maps API key
  useEffect(() => {
    const fetchApiKey = async () => {
      // Try localStorage first
      const cachedKey = localStorage.getItem("google_maps_api_key");
      if (cachedKey) {
        setApiKey(cachedKey);
        return;
      }

      // Try edge function
      try {
        const { data, error } = await supabase.functions.invoke("get-maps-config");
        if (data?.apiKey) {
          setApiKey(data.apiKey);
          localStorage.setItem("google_maps_api_key", data.apiKey);
        }
      } catch (e) {
        console.error("Error fetching maps config:", e);
      }
    };
    fetchApiKey();
  }, []);

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

  // Dock items configuration
  const dockItems: DockItem[] = [
    {
      id: "map",
      label: "Ubicación",
      icon: MapPin,
      onClick: () => setIsMapOpen(true),
      isActive: isMapOpen,
      badge: wizardData.patient?.address ? undefined : "!",
      badgeVariant: wizardData.patient?.address ? undefined : "warning",
    },
    {
      id: "chat",
      label: "Chat",
      icon: MessageSquare,
      onClick: () => {},
      disabled: true,
    },
    {
      id: "notifications",
      label: "Notificaciones",
      icon: Bell,
      onClick: () => {},
      disabled: true,
    },
    {
      id: "documents",
      label: "Documentos",
      icon: FileText,
      onClick: () => {},
      disabled: true,
    },
  ];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Fixed Stepper Area */}
        <div className="fixed top-20 left-0 right-0 z-40">
          {/* Stepper Container */}
          <motion.div 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="px-4 md:px-8"
          >
            <div className="max-w-xl mx-auto">
              {/* Stepper Windows 11 style - Compact */}
              <div className="relative flex items-center bg-card backdrop-blur-xl rounded-2xl px-4 py-2.5 shadow-md border border-border/30">
                {steps.map((step, index) => {
                  const isCompleted = currentStep > step.id;
                  const isCurrent = currentStep === step.id;
                  const Icon = step.icon;
                  const isLast = index === steps.length - 1;

                  return (
                    <React.Fragment key={step.id}>
                      {/* Step button */}
                      <motion.button
                        onClick={() => {
                          if (step.id < currentStep || (step.id === 2 && wizardData.patient)) {
                            goToStep(step.id);
                          }
                        }}
                        disabled={step.id > currentStep && !(step.id === 2 && wizardData.patient)}
                        className={cn(
                          "relative z-10 flex items-center gap-2 transition-all duration-300 flex-shrink-0",
                          (step.id <= currentStep || (step.id === 2 && wizardData.patient)) && "cursor-pointer"
                        )}
                        whileHover={{ scale: step.id <= currentStep ? 1.02 : 1 }}
                        whileTap={{ scale: step.id <= currentStep ? 0.98 : 1 }}
                      >
                        <motion.div
                          className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm",
                            isCompleted && "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground",
                            isCurrent && "bg-gradient-to-br from-primary/90 to-primary text-primary-foreground ring-2 ring-primary/20",
                            !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                          )}
                          animate={{
                            scale: isCurrent ? 1.05 : 1,
                          }}
                        >
                          {isCompleted ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Icon className="w-4 h-4" />
                          )}
                        </motion.div>
                        <div className="text-left hidden sm:block">
                          <p className={cn(
                            "font-medium text-sm leading-tight transition-colors",
                            (isCurrent || isCompleted) ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {step.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground leading-tight">
                            {step.description}
                          </p>
                        </div>
                      </motion.button>

                      {/* Connector line between steps */}
                      {!isLast && (
                        <div className="flex-1 mx-3 h-0.5 bg-muted rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-primary rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ 
                              width: isCompleted ? "100%" : "0%" 
                            }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                          />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scrollable Content area - with enough top padding to clear the fixed stepper */}
        <div className="pt-28 px-4 md:px-8 pb-24">
          {/* Use full width for scheduling step (step 3), constrained width for others */}
          <div className={cn(
            "mx-auto transition-all duration-300",
            currentStep === 3 ? "max-w-[1600px]" : "max-w-5xl"
          )}>
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

        {/* Dock - Always visible */}
        <Dock items={dockItems} magnification={56} baseSize={42} />

        {/* Map Panel Drawer */}
        <MapPanelDrawer
          isOpen={isMapOpen}
          onClose={() => setIsMapOpen(false)}
          patient={wizardData.patient}
          apiKey={apiKey}
        />
      </div>
    </TooltipProvider>
  );
};

export default AppointmentWizard;
