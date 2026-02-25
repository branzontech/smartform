import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, Save, FileText, ArrowRight, ArrowLeft, Bell, AlertTriangle, User, ClipboardList, Check, Stethoscope, Search, Loader2, Phone, Mail, MapPin, Shield, Briefcase, CreditCard, Hash, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Patient, PatientAlert, FollowUp } from "@/types/patient-types";
import { nanoid } from "nanoid";
import { useToast } from "@/hooks/use-toast";
import { Form as FormType } from '@/pages/FormsPage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getRecentAndFrequentForms } from "@/utils/form-utils";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";

type WorkflowStep = 1 | 2 | 3;

const steps = [
  { id: 1 as const, title: "Paciente", icon: User, description: "Seleccionar" },
  { id: 2 as const, title: "Formulario", icon: FileText, description: "Elegir formato" },
  { id: 3 as const, title: "Detalles", icon: Stethoscope, description: "Atención" },
];

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

const NewConsultation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryParams = new URLSearchParams(location.search);
  const preselectedPatientId = queryParams.get("patientId");

  const [currentStep, setCurrentStep] = useState<WorkflowStep>(1);
  const [direction, setDirection] = useState(0);
  const [loading, setLoading] = useState(true);
  const [availableForms, setAvailableForms] = useState<FormType[]>([]);
  const [recentForms, setRecentForms] = useState<any[]>([]);
  const [frequentForms, setFrequentForms] = useState<any[]>([]);
  
  const [selectedPatientId, setSelectedPatientId] = useState<string>(preselectedPatientId || "");
  const [selectedPatientData, setSelectedPatientData] = useState<any>(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [selectedFormIds, setSelectedFormIds] = useState<string[]>([]);
  const [selectedForms, setSelectedForms] = useState<FormType[]>([]);
  
  const [consultationDate, setConsultationDate] = useState<Date>(new Date());
  const [reason, setReason] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState<"Programada" | "En curso" | "Completada" | "Cancelada">("Programada");
  
  const [enableFollowUp, setEnableFollowUp] = useState(false);
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [followUpReason, setFollowUpReason] = useState("");
  const [createReminder, setCreateReminder] = useState(true);
  const [reminderDays, setReminderDays] = useState(2);
  const [followUpPriority, setFollowUpPriority] = useState<'Alta' | 'Media' | 'Baja'>('Media');

  const goToStep = (step: WorkflowStep) => {
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
  };

  // Search patients in DB with debounce
  useEffect(() => {
    if (!patientSearchTerm || patientSearchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const { data, error } = await supabase
        .from("pacientes")
        .select("*")
        .or(`numero_documento.ilike.%${patientSearchTerm}%,nombres.ilike.%${patientSearchTerm}%,apellidos.ilike.%${patientSearchTerm}%`)
        .limit(20);

      if (data && !error) {
        setSearchResults(data);
      }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [patientSearchTerm]);

  // Load preselected patient
  useEffect(() => {
    if (preselectedPatientId && !selectedPatientData) {
      const loadPatient = async () => {
        const { data } = await supabase
          .from("pacientes")
          .select("*")
          .eq("id", preselectedPatientId)
          .single();
        if (data) {
          setSelectedPatientData(data);
        }
      };
      loadPatient();
    }
  }, [preselectedPatientId]);

  // Load forms
  useEffect(() => {
    const savedForms = localStorage.getItem("forms");
    if (savedForms) {
      try {
        const parsedForms = JSON.parse(savedForms).map((form: any) => ({
          ...form,
          createdAt: new Date(form.createdAt),
          updatedAt: new Date(form.updatedAt)
        }));
        setAvailableForms(parsedForms);
      } catch (error) {
        console.error("Error parsing forms:", error);
      }
    }

    const { recentForms, frequentForms } = getRecentAndFrequentForms(selectedPatientId || undefined);
    setRecentForms(recentForms);
    setFrequentForms(frequentForms);
    setLoading(false);
  }, [selectedPatientId]);

  const handleSelectPatient = (dbPatient: any) => {
    setSelectedPatientId(dbPatient.id);
    setSelectedPatientData(dbPatient);
    setPatientSearchTerm("");
    setSearchResults([]);
  };

  const handleClearPatient = () => {
    setSelectedPatientId("");
    setSelectedPatientData(null);
    setPatientSearchTerm("");
  };

  const handlePatientContinue = () => {
    if (!selectedPatientId) {
      toast({
        title: "Paciente no seleccionado",
        description: "Por favor seleccione un paciente para continuar",
        variant: "destructive"
      });
      return;
    }
    
    const { recentForms, frequentForms } = getRecentAndFrequentForms(selectedPatientId);
    setRecentForms(recentForms);
    setFrequentForms(frequentForms);
    
    goToStep(2);
  };

  const handleFormContinue = () => {
    if (selectedFormIds.length === 0) {
      toast({
        title: "Formularios no seleccionados",
        description: "Por favor seleccione al menos un formulario para continuar",
        variant: "destructive"
      });
      return;
    }
    
    goToStep(3);
  };

  const calculateReminderDate = (date: Date | undefined, days: number): Date | undefined => {
    if (!date) return undefined;
    const reminderDate = new Date(date.getTime());
    reminderDate.setDate(reminderDate.getDate() - days);
    return reminderDate;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason) {
      toast({
        title: "Motivo requerido",
        description: "Por favor ingrese el motivo de la atención",
        variant: "destructive"
      });
      return;
    }
    
    const newConsultation = {
      id: nanoid(),
      patientId: selectedPatientId,
      consultationDate,
      reason,
      diagnosis: diagnosis || undefined,
      treatment: treatment || undefined,
      notes: notes || undefined,
      followUpDate: enableFollowUp ? followUpDate : undefined,
      status,
      formIds: selectedFormIds,
      forms: selectedForms
    };
    
    const savedConsultations = localStorage.getItem("consultations");
    const existingConsultations = savedConsultations ? JSON.parse(savedConsultations) : [];
    const updatedConsultations = [...existingConsultations, newConsultation];
    localStorage.setItem("consultations", JSON.stringify(updatedConsultations));
    
    if (enableFollowUp && followUpDate) {
      const patientName = selectedPatientData ? `${selectedPatientData.nombres} ${selectedPatientData.apellidos}` : "";

      const newFollowUp: FollowUp = {
        id: nanoid(),
        patientId: selectedPatientId,
        consultationId: newConsultation.id,
        followUpDate: followUpDate,
        reason: followUpReason || reason,
        status: 'Pendiente',
        notes: followUpNotes,
        createdAt: new Date(),
        reminderSent: false
      };
      
      const savedFollowUps = localStorage.getItem("followUps");
      const existingFollowUps = savedFollowUps ? JSON.parse(savedFollowUps) : [];
      const updatedFollowUps = [...existingFollowUps, newFollowUp];
      localStorage.setItem("followUps", JSON.stringify(updatedFollowUps));
      
      if (createReminder) {
        const reminderDate = calculateReminderDate(followUpDate, reminderDays);
        
        const newAlert: PatientAlert = {
          id: nanoid(),
          patientId: selectedPatientId,
          patientName,
          consultationId: newConsultation.id,
          followUpId: newFollowUp.id,
          type: 'Seguimiento',
          message: `Próxima cita de seguimiento para ${patientName}: ${followUpReason || reason}`,
          dueDate: followUpDate,
          status: 'Pendiente',
          priority: followUpPriority,
          createdAt: new Date()
        };
        
        const savedAlerts = localStorage.getItem("patientAlerts");
        const existingAlerts = savedAlerts ? JSON.parse(savedAlerts) : [];
        const updatedAlerts = [...existingAlerts, newAlert];
        localStorage.setItem("patientAlerts", JSON.stringify(updatedAlerts));
      }
      
      toast({
        title: "Atención y seguimiento creados",
        description: `Se ha programado un seguimiento para el ${format(followUpDate, "d 'de' MMMM 'de' yyyy", { locale: es })}`,
      });
    } else {
      toast({
        title: "Atención creada",
        description: "Redirigiendo al formulario seleccionado...",
      });
    }
    
    if (selectedFormIds.length > 1) {
      navigate(`/app/consulta-multiple?patientId=${selectedPatientId}&consultationId=${newConsultation.id}&forms=${selectedFormIds.join(',')}`);
    } else {
      navigate(`/app/ver/${selectedFormIds[0]}?patientId=${selectedPatientId}&consultationId=${newConsultation.id}`);
    }
  };

  const handleFormSelection = (formId: string, formTitle: string) => {
    const isSelected = selectedFormIds.includes(formId);
    
    if (isSelected) {
      setSelectedFormIds(prev => prev.filter(id => id !== formId));
      setSelectedForms(prev => prev.filter(form => form.id !== formId));
    } else {
      setSelectedFormIds(prev => [...prev, formId]);
      const form = availableForms.find(f => f.id === formId);
      if (form) {
        setSelectedForms(prev => [...prev, form]);
      }
    }
  };

  const openFormPreview = (formId: string) => {
    window.open(`/app/ver/${formId}`, '_blank');
  };

  // Render form card (shared between tabs)
  const renderFormCard = (form: FormType) => {
    const isSelected = selectedFormIds.includes(form.id);
    return (
      <div 
        key={form.id}
        className={cn(
          "p-4 rounded-2xl cursor-pointer transition-all duration-200 border",
          isSelected 
            ? "border-primary bg-primary/5 shadow-sm" 
            : "border-border/50 bg-card/50 hover:border-primary/30 hover:bg-card"
        )}
        onClick={() => handleFormSelection(form.id, form.title)}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-5 h-5 rounded-lg border-2 mt-0.5 flex items-center justify-center transition-colors",
              isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
            )}>
              {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
            </div>
            <div>
              <h3 className="font-medium text-sm text-foreground">{form.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{form.description}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="rounded-xl h-8"
            onClick={(e) => {
              e.stopPropagation();
              openFormPreview(form.id);
            }}
          >
            <FileText size={14} />
          </Button>
        </div>
        <div className="flex items-center mt-2.5 text-xs ml-8 gap-2">
          <span className="px-2 py-0.5 bg-muted rounded-lg text-muted-foreground">
            {form.formType === 'forms' ? 'Form' : 'Formato'}
          </span>
          <span className="text-muted-foreground">
            {format(new Date(form.updatedAt), 'dd/MM/yyyy')}
          </span>
        </div>
      </div>
    );
  };

  // Patient summary info row
  const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) => (
    <div className="flex items-center gap-2.5 py-1">
      <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground leading-none mb-0.5">{label}</p>
        <p className={cn("text-sm", !value && "text-muted-foreground/60 italic")}>
          {value || "—"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* Stepper - matching AppointmentWizard style */}
      <div className="shrink-0 z-30 bg-background">
        <motion.div 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="px-6 md:px-8 py-1"
        >
          <div className="max-w-xl mx-auto">
            <div className="relative flex items-center bg-card/80 backdrop-blur rounded-2xl px-4 py-1.5 border border-border/10">
              {steps.map((step, index) => {
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                const Icon = step.icon;
                const isLast = index === steps.length - 1;

                return (
                  <React.Fragment key={step.id}>
                    <motion.button
                      onClick={() => {
                        if (step.id < currentStep) goToStep(step.id);
                      }}
                      disabled={step.id > currentStep}
                      className={cn(
                        "relative z-10 flex items-center gap-2 transition-all duration-300 flex-shrink-0",
                        step.id <= currentStep && "cursor-pointer"
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
                        animate={{ scale: isCurrent ? 1.05 : 1 }}
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

                    {!isLast && (
                      <div className="flex-1 mx-3 h-0.5 bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-primary rounded-full"
                          initial={{ width: "0%" }}
                          animate={{ width: isCompleted ? "100%" : "0%" }}
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

      {/* Navigation buttons */}
      <div className="shrink-0 px-6 md:px-8 pb-2">
        <div className="mx-auto flex items-center justify-between max-w-5xl">
          {currentStep > 1 ? (
            <Button variant="ghost" onClick={() => goToStep((currentStep - 1) as WorkflowStep)} className="rounded-xl gap-2 h-9">
              <ArrowLeft className="w-4 h-4" />
              Atrás
            </Button>
          ) : (
            <div />
          )}
          {currentStep === 1 && (
            <Button onClick={handlePatientContinue} disabled={!selectedPatientId} className="rounded-xl h-9 px-5 gap-2">
              Continuar
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
          {currentStep === 2 && (
            <Button 
              onClick={handleFormContinue} 
              disabled={selectedFormIds.length === 0}
              className="rounded-xl h-9 px-5 gap-2"
            >
              Continuar
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-hidden px-6 md:px-8">
        <div className="mx-auto max-w-5xl h-full">
          <div className="relative overflow-y-auto h-full pb-8">
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
                {/* Step 1: Patient Selection - Search Input like AppointmentWizard */}
                {currentStep === 1 && (
                  <div className="max-w-3xl mx-auto space-y-4">
                    {/* Header */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold">¿Quién es el paciente?</h2>
                        <p className="text-sm text-muted-foreground">
                          Busca un paciente existente por nombre o documento
                        </p>
                      </div>
                    </motion.div>

                    {/* Search Card */}
                    {!selectedPatientData ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <Card className="bg-card/60 backdrop-blur-xl border-border/30 shadow-lg rounded-2xl overflow-hidden">
                          <CardContent className="p-5">
                            {/* Search Input */}
                            <div className="relative mb-5">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <Input
                                placeholder="Buscar por nombre o número de documento..."
                                value={patientSearchTerm}
                                onChange={(e) => setPatientSearchTerm(e.target.value)}
                                className="pl-12 h-12 text-base bg-background/50 border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20"
                              />
                              {isSearching && (
                                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                              )}
                            </div>

                            {/* Results */}
                            {patientSearchTerm.length >= 2 && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                              >
                                {searchResults.length > 0 ? (
                                  <>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {searchResults.length} resultado(s) encontrado(s)
                                    </p>
                                    <ScrollArea className="h-[260px]">
                                      <div className="space-y-2 pr-4">
                                        {searchResults.map((patient, index) => (
                                          <motion.div
                                            key={patient.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                          >
                                            <Card
                                              className={cn(
                                                "cursor-pointer transition-all duration-200 border-border/30 rounded-xl",
                                                "hover:bg-primary/5 hover:border-primary/30 hover:shadow-md",
                                                "active:scale-[0.99]"
                                              )}
                                              onClick={() => handleSelectPatient(patient)}
                                            >
                                              <CardContent className="p-3">
                                                <div className="flex items-center gap-3">
                                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-semibold">
                                                    {patient.nombres?.charAt(0)}{patient.apellidos?.charAt(0)}
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-base truncate">
                                                      {patient.nombres} {patient.apellidos}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                      <span>{patient.numero_documento}</span>
                                                      {patient.telefono_principal && (
                                                        <>
                                                          <span>•</span>
                                                          <span className="flex items-center gap-1">
                                                            <Phone className="w-3 h-3" />
                                                            {patient.telefono_principal}
                                                          </span>
                                                        </>
                                                      )}
                                                    </div>
                                                  </div>
                                                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                                </div>
                                              </CardContent>
                                            </Card>
                                          </motion.div>
                                        ))}
                                      </div>
                                    </ScrollArea>
                                  </>
                                ) : !isSearching ? (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-6"
                                  >
                                    <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                                      <Search className="w-7 h-7 text-muted-foreground" />
                                    </div>
                                    <p className="text-muted-foreground">
                                      No se encontraron pacientes con "{patientSearchTerm}"
                                    </p>
                                  </motion.div>
                                ) : null}
                              </motion.div>
                            )}

                            {/* Empty state */}
                            {patientSearchTerm.length < 2 && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center justify-center gap-4 py-4"
                              >
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                                  <Sparkles className="w-5 h-5 text-primary" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Escribe el nombre o documento del paciente
                                </p>
                              </motion.div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ) : (
                      /* Patient Full Detail (read-only) */
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <Card className="bg-card/60 backdrop-blur-xl border-border/30 shadow-lg rounded-2xl overflow-hidden">
                          <CardContent className="p-5">
                            {/* Patient header */}
                            <div className="flex items-center justify-between mb-5">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                                  {selectedPatientData.nombres?.charAt(0)}{selectedPatientData.apellidos?.charAt(0)}
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold leading-tight">
                                    {selectedPatientData.nombres} {selectedPatientData.apellidos}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-xs text-muted-foreground">
                                      {selectedPatientData.tipo_documento || 'CC'} {selectedPatientData.numero_documento}
                                    </p>
                                    {selectedPatientData.fecha_nacimiento && (
                                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                        {(() => {
                                          const birth = new Date(selectedPatientData.fecha_nacimiento);
                                          const today = new Date();
                                          let age = today.getFullYear() - birth.getFullYear();
                                          const m = today.getMonth() - birth.getMonth();
                                          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                                          return `${age} años`;
                                        })()}
                                      </Badge>
                                    )}
                                    {selectedPatientData.estado_paciente && (
                                      <Badge variant={selectedPatientData.estado_paciente === 'activo' ? 'default' : 'outline'} className="text-[10px] px-1.5 py-0 capitalize">
                                        {selectedPatientData.estado_paciente}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" onClick={handleClearPatient} className="rounded-xl text-muted-foreground">
                                Cambiar
                              </Button>
                            </div>

                            {/* Full patient info grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-1">
                              <InfoRow icon={Phone} label="Teléfono principal" value={selectedPatientData.telefono_principal} />
                              <InfoRow icon={Phone} label="Teléfono secundario" value={selectedPatientData.telefono_secundario} />
                              <InfoRow icon={Mail} label="Correo electrónico" value={selectedPatientData.email} />
                              <InfoRow icon={CalendarIcon} label="Fecha de nacimiento" value={
                                selectedPatientData.fecha_nacimiento 
                                  ? format(new Date(selectedPatientData.fecha_nacimiento), "dd 'de' MMMM 'de' yyyy", { locale: es })
                                  : null
                              } />
                              <InfoRow icon={CreditCard} label="Tipo documento" value={selectedPatientData.tipo_documento} />
                              <InfoRow icon={Hash} label="Nº Historia" value={selectedPatientData.numero_historia} />
                              <InfoRow icon={Shield} label="Régimen" value={selectedPatientData.regimen} />
                              <InfoRow icon={Heart} label="Tipo afiliación" value={selectedPatientData.tipo_afiliacion} />
                              <InfoRow icon={CreditCard} label="Carnet" value={selectedPatientData.carnet} />
                              <InfoRow icon={MapPin} label="Dirección" value={selectedPatientData.direccion} />
                              <InfoRow icon={MapPin} label="Ciudad" value={selectedPatientData.ciudad} />
                              <InfoRow icon={MapPin} label="Estado/Depto" value={selectedPatientData.estado} />
                              <InfoRow icon={MapPin} label="Zona" value={selectedPatientData.zona} />
                              <InfoRow icon={Briefcase} label="Ocupación" value={selectedPatientData.ocupacion} />
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Step 2: Form Selection */}
                {currentStep === 2 && (
                  <div className="max-w-3xl mx-auto space-y-4">
                    {/* Suggested forms */}
                    {(recentForms.length > 0 || frequentForms.length > 0) && (
                      <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-5">
                        <h3 className="font-semibold text-sm text-foreground mb-3">Formularios sugeridos</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {recentForms.map((form: any) => {
                            const isSelected = selectedFormIds.includes(form.id);
                            return (
                              <div key={form.id} className={cn(
                                "p-3 rounded-xl cursor-pointer transition-all border",
                                isSelected ? "border-primary bg-primary/5" : "border-border/30 hover:border-primary/30"
                              )} onClick={() => handleFormSelection(form.id, form.title)}>
                                <div className="flex items-center gap-2">
                                  <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center", isSelected ? "bg-primary border-primary" : "border-muted-foreground/30")}>
                                    {isSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                                  </div>
                                  <span className="text-sm font-medium text-foreground">{form.title}</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground ml-6">Reciente</span>
                              </div>
                            );
                          })}
                          {frequentForms.map((form: any) => {
                            const isSelected = selectedFormIds.includes(form.id);
                            return (
                              <div key={form.id} className={cn(
                                "p-3 rounded-xl cursor-pointer transition-all border",
                                isSelected ? "border-primary bg-primary/5" : "border-border/30 hover:border-primary/30"
                              )} onClick={() => handleFormSelection(form.id, form.title)}>
                                <div className="flex items-center gap-2">
                                  <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center", isSelected ? "bg-primary border-primary" : "border-muted-foreground/30")}>
                                    {isSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                                  </div>
                                  <span className="text-sm font-medium text-foreground">{form.title}</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground ml-6">{form.usageCount} usos</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* All forms */}
                    <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-5">
                      <h3 className="font-semibold text-sm text-foreground mb-3">Todos los formularios</h3>
                      {loading ? (
                        <div className="flex items-center justify-center p-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                      ) : availableForms.length > 0 ? (
                        <Tabs defaultValue="all" className="w-full">
                          <TabsList className="mb-4 rounded-xl">
                            <TabsTrigger value="all" className="rounded-lg">Todos</TabsTrigger>
                            <TabsTrigger value="forms" className="rounded-lg">Forms</TabsTrigger>
                            <TabsTrigger value="formato" className="rounded-lg">Formatos</TabsTrigger>
                          </TabsList>
                          <TabsContent value="all"><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{availableForms.map(renderFormCard)}</div></TabsContent>
                          <TabsContent value="forms"><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{availableForms.filter(f => f.formType === 'forms').map(renderFormCard)}</div></TabsContent>
                          <TabsContent value="formato"><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{availableForms.filter(f => f.formType === 'formato').map(renderFormCard)}</div></TabsContent>
                        </Tabs>
                      ) : (
                        <div className="text-center py-10 rounded-2xl border border-dashed border-border/50">
                          <FileText className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                          <h3 className="text-sm font-medium">No hay formularios disponibles</h3>
                        </div>
                      )}
                    </div>

                    {/* Selected forms summary */}
                    {selectedFormIds.length > 0 && (
                      <div className="bg-primary/5 backdrop-blur-sm rounded-2xl border border-primary/20 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="w-4 h-4 text-primary" />
                          <h3 className="font-medium text-sm text-foreground">Seleccionados ({selectedFormIds.length})</h3>
                        </div>
                        <div className="space-y-1.5">
                          {selectedForms.map((form, i) => (
                            <div key={form.id} className="flex items-center justify-between bg-card rounded-xl p-2.5 border border-border/30">
                              <div className="flex items-center gap-2">
                                <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-lg font-medium">{i + 1}</span>
                                <span className="text-sm">{form.title}</span>
                              </div>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => handleFormSelection(form.id, form.title)}>✕</Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Consultation Details */}
                {currentStep === 3 && (
                  <div className="max-w-3xl mx-auto">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4">Detalles de la atención</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Fecha *</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left rounded-xl bg-muted/50 border-0">
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {consultationDate ? format(consultationDate, "PPP", { locale: es }) : "Seleccionar"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 rounded-xl">
                                <Calendar mode="single" selected={consultationDate} onSelect={(date) => date && setConsultationDate(date)} locale={es} className="p-3 pointer-events-auto" />
                              </PopoverContent>
                            </Popover>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Estado *</Label>
                            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                              <SelectTrigger className="rounded-xl bg-muted/50 border-0"><SelectValue /></SelectTrigger>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="Programada">Programada</SelectItem>
                                <SelectItem value="En curso">En curso</SelectItem>
                                <SelectItem value="Completada">Completada</SelectItem>
                                <SelectItem value="Cancelada">Cancelada</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-xs text-muted-foreground">Motivo de la atención *</Label>
                            <Input value={reason} onChange={(e) => setReason(e.target.value)} className="rounded-xl bg-muted/50 border-0" required />
                          </div>
                          
                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-xs text-muted-foreground">Diagnóstico</Label>
                            <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className="rounded-xl bg-muted/50 border-0" />
                          </div>
                          
                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-xs text-muted-foreground">Tratamiento</Label>
                            <Input value={treatment} onChange={(e) => setTreatment(e.target.value)} className="rounded-xl bg-muted/50 border-0" />
                          </div>
                          
                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-xs text-muted-foreground">Notas adicionales</Label>
                            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="rounded-xl bg-muted/50 border-0 resize-none" />
                          </div>
                        </div>
                      </div>

                      {/* Follow-up section */}
                      <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4 text-primary" />
                            <Label htmlFor="enableFollowUp" className="font-semibold text-sm">Programar seguimiento</Label>
                          </div>
                          <Switch id="enableFollowUp" checked={enableFollowUp} onCheckedChange={setEnableFollowUp} />
                        </div>
                        
                        {enableFollowUp && (
                          <div className="rounded-xl border border-primary/10 bg-primary/[0.02] p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Fecha de seguimiento *</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left rounded-xl bg-muted/50 border-0">
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {followUpDate ? format(followUpDate, "PPP", { locale: es }) : "Seleccionar"}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0 rounded-xl">
                                    <Calendar mode="single" selected={followUpDate} onSelect={setFollowUpDate} locale={es} disabled={(date) => isBefore(date, new Date())} className="p-3 pointer-events-auto" />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Motivo del seguimiento</Label>
                                <Input value={followUpReason} onChange={(e) => setFollowUpReason(e.target.value)} placeholder="Usar motivo de la atención si vacío" className="rounded-xl bg-muted/50 border-0" />
                              </div>
                              
                              <div className="space-y-2 md:col-span-2">
                                <Label className="text-xs text-muted-foreground">Notas de seguimiento</Label>
                                <Textarea value={followUpNotes} onChange={(e) => setFollowUpNotes(e.target.value)} rows={2} placeholder="Instrucciones para el seguimiento" className="rounded-xl bg-muted/50 border-0 resize-none" />
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <Label className="text-xs text-muted-foreground">Crear recordatorio</Label>
                                <Switch checked={createReminder} onCheckedChange={setCreateReminder} />
                              </div>
                              
                              {createReminder && (
                                <>
                                  <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Días de anticipación</Label>
                                    <div className="flex items-center gap-2">
                                      <Input type="number" min={1} max={30} value={reminderDays} onChange={(e) => setReminderDays(parseInt(e.target.value) || 2)} className="rounded-xl bg-muted/50 border-0 w-20" />
                                      <span className="text-xs text-muted-foreground">días antes</span>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Prioridad</Label>
                                    <Select value={followUpPriority} onValueChange={(v) => setFollowUpPriority(v as any)}>
                                      <SelectTrigger className="rounded-xl bg-muted/50 border-0"><SelectValue /></SelectTrigger>
                                      <SelectContent className="rounded-xl">
                                        <SelectItem value="Alta">Alta</SelectItem>
                                        <SelectItem value="Media">Media</SelectItem>
                                        <SelectItem value="Baja">Baja</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {followUpDate && (
                                    <div className="md:col-span-2 flex items-center p-3 bg-primary/5 border border-primary/10 rounded-xl">
                                      <AlertTriangle className="h-4 w-4 text-primary mr-2 shrink-0" />
                                      <p className="text-xs text-foreground">
                                        Recordatorio: {calculateReminderDate(followUpDate, reminderDays) ? format(calculateReminderDate(followUpDate, reminderDays)!, "d 'de' MMMM 'de' yyyy", { locale: es }) : "fecha inválida"}
                                      </p>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Info banner */}
                      <div className="flex items-center p-3 bg-primary/5 border border-primary/10 rounded-2xl">
                        <FileText className="w-4 h-4 text-primary mr-2 shrink-0" />
                        <p className="text-xs text-foreground">
                          Al guardar será redirigido a {selectedFormIds.length > 1 ? `los ${selectedFormIds.length} formularios` : 'el formulario'} seleccionado{selectedFormIds.length > 1 ? 's' : ''}
                        </p>
                      </div>

                      {/* Submit */}
                      <div className="flex justify-end">
                        <Button type="submit" className="rounded-xl h-10 px-6 gap-2" disabled={!reason || (enableFollowUp && !followUpDate)}>
                          <Save className="w-4 h-4" />
                          Guardar y continuar
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewConsultation;
