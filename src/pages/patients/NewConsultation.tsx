import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, ArrowRight, ArrowLeft, User, ClipboardList, Check, Stethoscope, Search, Loader2, Phone, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { nanoid } from "nanoid";
import { useToast } from "@/hooks/use-toast";
import { Form as FormType } from '@/pages/FormsPage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { getRecentAndFrequentForms } from "@/utils/form-utils";
import { cn } from "@/lib/utils";
import { db } from "@/integrations/data/client";
import { SurfaceCard } from "@/components/kit/surface";
import { VerticalStepper, type StepItem } from "@/components/kit/stepper/VerticalStepper";
import { PatientSummary } from "@/components/patients/PatientSummary";
import { Sparkles } from "lucide-react";
import { BASE_CLINICAL_HISTORY_ID } from "@/components/forms/clinical-histories";

type WorkflowStep = 1 | 2;

const steps = [
  { id: 1 as const, title: "Paciente", icon: User, description: "Seleccionar" },
  { id: 2 as const, title: "Formulario", icon: FileText, description: "Elegir formato" },
];

const fadeVariants = {
  enter: { opacity: 0, y: 8 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
};

const NewConsultation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryParams = new URLSearchParams(location.search);
  const preselectedPatientId = queryParams.get("patientId");
  const preselectedFormIds = queryParams.get("selectedForms")?.split(",").filter(Boolean) || [];

  const [currentStep, setCurrentStep] = useState<WorkflowStep>(preselectedPatientId ? 2 : 1);
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
  const [patientAdmissions, setPatientAdmissions] = useState<any[]>([]);
  
  const [selectedFormIds, setSelectedFormIds] = useState<string[]>(preselectedFormIds);
  const [selectedForms, setSelectedForms] = useState<FormType[]>([]);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);

  // Load recent patients from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('recent-patients');
      if (stored) setRecentPatients(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  // Save patient to recents
  const saveToRecents = useCallback((patient: any) => {
    try {
      const stored = localStorage.getItem('recent-patients');
      let recents: any[] = stored ? JSON.parse(stored) : [];
      recents = recents.filter((p: any) => p.id !== patient.id);
      recents.unshift({
        id: patient.id,
        nombres: patient.nombres,
        apellidos: patient.apellidos,
        numero_documento: patient.numero_documento,
        telefono_principal: patient.telefono_principal,
        timestamp: Date.now(),
      });
      recents = recents.slice(0, 5);
      localStorage.setItem('recent-patients', JSON.stringify(recents));
      setRecentPatients(recents);
    } catch { /* ignore */ }
  }, []);

  const goToStep = (step: WorkflowStep) => {
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
  };

  // Search patients in DB with debounce
  useEffect(() => {
    if (!patientSearchTerm || patientSearchTerm.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let vigente = true;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data, error } = await db
          .from("pacientes")
          .select("*")
          .or(`numero_documento.ilike.%${patientSearchTerm}%,nombres.ilike.%${patientSearchTerm}%,apellidos.ilike.%${patientSearchTerm}%`)
          .limit(20);

        if (vigente && data && !error) {
          setSearchResults(data);
        }
      } finally {
        if (vigente) setIsSearching(false);
      }
    }, 300);

    return () => {
      vigente = false;
      clearTimeout(timer);
    };
  }, [patientSearchTerm]);

  // Load preselected patient
  useEffect(() => {
    let vigente = true;
    if (preselectedPatientId && !selectedPatientData) {
      const loadPatient = async () => {
        const { data } = await db
          .from("pacientes")
          .select("*")
          .eq("id", preselectedPatientId)
          .single();
        if (!vigente) return;
        if (data) {
          setSelectedPatientData(data);
          const { data: admData } = await db
            .from("admisiones")
            .select("*")
            .eq("paciente_id", preselectedPatientId)
            .order("fecha_inicio", { ascending: false })
            .limit(10);
          if (vigente) {
            setPatientAdmissions(admData || []);
            setAdmissionsFor(preselectedPatientId);
          }
        }
      };
      loadPatient();
    }
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo se carga al cambiar el paciente preseleccionado; selectedPatientData actúa como guarda y no debe relanzar la carga
  }, [preselectedPatientId]);

  // Load forms from database
  useEffect(() => {
    let vigente = true;
    const loadForms = async () => {
      const { data, error } = await db
        .from("formularios")
        .select("*")
        .eq("estado", "activo")
        .order("created_at", { ascending: false });

      if (!vigente) return;
      if (data && !error) {
        const mapped = data.map((f: any) => ({
          id: f.id,
          title: f.titulo,
          description: f.descripcion || "",
          questions: f.preguntas || [],
          createdAt: new Date(f.created_at),
          updatedAt: new Date(f.updated_at),
          responseCount: f.respuestas_count || 0,
          formType: f.tipo || "historia_clinica",
        }));
        setAvailableForms(mapped);

        // Sync preselected forms with full objects
        if (preselectedFormIds.length > 0) {
          const preselected = mapped.filter((f: FormType) => preselectedFormIds.includes(f.id));
          if (preselected.length > 0) setSelectedForms(preselected);
        }
      }

      const { recentForms, frequentForms } = getRecentAndFrequentForms(selectedPatientId || undefined);
      setRecentForms(recentForms);
      setFrequentForms(frequentForms);
      setLoading(false);
    };
    loadForms();
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- preselectedFormIds se recrea en cada render desde la URL; añadirlo relanzaría la carga en bucle
  }, [selectedPatientId]);

  // La historia de la admisión activa (o la general) llega ya marcada; solo una vez por paciente,
  // para no volver a marcarla si el profesional la quita.
  const preselectedForPatient = useRef<string | null>(null);
  // Paciente cuyas admisiones ya llegaron: sin esto se preseleccionaría con las de otro paciente o sin ninguna.
  const [admissionsFor, setAdmissionsFor] = useState<string | null>(null);
  useEffect(() => {
    if (currentStep !== 2 || !selectedPatientId || availableForms.length === 0 || admissionsFor !== selectedPatientId) return;
    if (preselectedForPatient.current === selectedPatientId || selectedFormIds.length > 0) return;
    const active = patientAdmissions.find((a: { estado?: string }) => a.estado === "en_curso" || a.estado === "planificada");
    const historyId = (active as { formulario_id?: string } | undefined)?.formulario_id || BASE_CLINICAL_HISTORY_ID;
    const history = availableForms.find((f) => f.id === historyId);
    if (!history) return;
    preselectedForPatient.current = selectedPatientId;
    setSelectedFormIds([historyId]);
    setSelectedForms([history]);
  }, [currentStep, selectedPatientId, availableForms, patientAdmissions, selectedFormIds.length, admissionsFor]);

  const handleSelectPatient = async (dbPatient: any) => {
    setSelectedPatientId(dbPatient.id);
    setSelectedPatientData(dbPatient);
    setPatientSearchTerm("");
    setSearchResults([]);
    saveToRecents(dbPatient);
    const { data } = await db
      .from("admisiones")
      .select("*")
      .eq("paciente_id", dbPatient.id)
      .order("fecha_inicio", { ascending: false })
      .limit(10);
    setPatientAdmissions(data || []);
    setAdmissionsFor(dbPatient.id);
  };

  const handleClearPatient = () => {
    setSelectedPatientId("");
    setSelectedPatientData(null);
    setPatientAdmissions([]);
    setAdmissionsFor(null);
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
    
    // Create consultation and navigate directly to forms
    const newConsultation = {
      id: nanoid(),
      patientId: selectedPatientId,
      consultationDate: new Date(),
      status: "En curso",
      formIds: selectedFormIds,
      forms: selectedForms
    };
    
    const savedConsultations = localStorage.getItem("consultations");
    const existingConsultations = savedConsultations ? JSON.parse(savedConsultations) : [];
    localStorage.setItem("consultations", JSON.stringify([...existingConsultations, newConsultation]));
    
    toast({
      title: "Atención iniciada",
      description: "Redirigiendo al formulario seleccionado...",
    });
    
    const queryParts = [`patientId=${selectedPatientId}`, `consultationId=${newConsultation.id}`];
    if (selectedFormIds.length > 1) {
      queryParts.push(`forms=${selectedFormIds.join(',')}`);
    }
    navigate(`/app/ver/${selectedFormIds[0]}?${queryParts.join('&')}`);
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
            {form.formType === 'historia_clinica' ? 'Historia clínica' 
              : form.formType === 'escala' ? 'Escala' 
              : form.formType === 'encuesta' ? 'Encuesta' 
              : form.formType}
          </span>
          <span className="text-muted-foreground">
            {format(new Date(form.updatedAt), 'dd/MM/yyyy')}
          </span>
        </div>
      </div>
    );
  };

  const patientName = selectedPatientData
    ? `${selectedPatientData.nombres ?? ""} ${selectedPatientData.apellidos ?? ""}`.trim()
    : "";
  const stepItems: StepItem[] = [
    { id: 1, title: "Paciente", description: "Busca y selecciona al paciente", summary: patientName || undefined },
    {
      id: 2,
      title: "Formulario",
      description: "Elige los formatos",
      summary: selectedFormIds.length ? `${selectedFormIds.length} seleccionado${selectedFormIds.length === 1 ? "" : "s"}` : undefined,
    },
  ];

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 py-6 lg:h-full lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* Riel del asistente: pasos, lo elegido y las acciones */}
      <aside className="lg:min-h-0">
        <SurfaceCard className="flex flex-col gap-5">
          <div className="space-y-0.5 px-2">
            <h1 className="text-[15px] font-semibold text-foreground">Nueva atención</h1>
            <p className="text-[13px] text-muted-foreground">Paso {currentStep} de {steps.length}</p>
          </div>
          <VerticalStepper
            steps={stepItems}
            current={currentStep - 1}
            onStepClick={(i) => goToStep((i + 1) as WorkflowStep)}
          />
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            {currentStep === 1 && (
              <Button onClick={handlePatientContinue} disabled={!selectedPatientId} className="h-10 w-full gap-2 rounded-full">
                Continuar
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {currentStep === 2 && (
              <Button onClick={handleFormContinue} disabled={selectedFormIds.length === 0} className="h-10 w-full gap-2 rounded-full">
                <Stethoscope className="h-4 w-4" />
                Iniciar atención
              </Button>
            )}
            {currentStep > 1 && (
              <Button variant="ghost" onClick={() => goToStep((currentStep - 1) as WorkflowStep)} className="h-10 w-full gap-2 rounded-full">
                <ArrowLeft className="h-4 w-4" />
                Atrás
              </Button>
            )}
          </div>
        </SurfaceCard>
      </aside>

      {/* Contenido del paso: único contenedor con scroll */}
      <section className="min-w-0 lg:min-h-0 lg:overflow-y-auto lg:pb-8">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={fadeVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {/* Step 1: Patient Selection - Search Input like AppointmentWizard */}
                {currentStep === 1 && (
                  <div className="space-y-4">
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
                                className="pl-12 h-12 text-base bg-background/50 border-border/50 rounded-xl focus-visible:ring-0"
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
                                className="space-y-4"
                              >
                                {recentPatients.length > 0 ? (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-muted-foreground" />
                                      <p className="text-sm font-medium text-muted-foreground">Pacientes recientes</p>
                                    </div>
                                    <div className="space-y-2">
                                      {recentPatients.map((patient, index) => (
                                        <motion.div
                                          key={patient.id}
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: index * 0.05 }}
                                        >
                                          <div
                                            className={cn(
                                              "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200",
                                              "border border-border/30 hover:bg-primary/5 hover:border-primary/30 hover:shadow-sm",
                                              "active:scale-[0.99]"
                                            )}
                                            onClick={async () => {
                                              const { data } = await db
                                                .from("pacientes")
                                                .select("*")
                                                .eq("id", patient.id)
                                                .single();
                                              if (data) handleSelectPatient(data);
                                            }}
                                          >
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                              {patient.nombres?.charAt(0)}{patient.apellidos?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="font-medium text-sm truncate">
                                                {patient.nombres} {patient.apellidos}
                                              </p>
                                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
                                        </motion.div>
                                      ))}
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex items-center justify-center gap-4 py-4">
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                                      <Sparkles className="w-5 h-5 text-primary" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      Escribe el nombre o documento del paciente
                                    </p>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ) : (
                      <>
                      <PatientSummary
                        patient={selectedPatientData}
                        admissions={patientAdmissions}
                        onChange={handleClearPatient}
                        onUpdated={setSelectedPatientData}
                      />

                      {/* Admissions History */}
                      {patientAdmissions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Card className="bg-card/60 backdrop-blur-xl border-border/30 shadow-lg rounded-2xl overflow-hidden">
                            <CardContent className="p-5">
                              <div className="flex items-center gap-2 mb-4">
                                <ClipboardList className="w-4 h-4 text-primary" />
                                <h4 className="text-sm font-semibold">Historial de admisiones ({patientAdmissions.length})</h4>
                              </div>
                              <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
                                {patientAdmissions.map((adm) => (
                                  <div key={adm.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/20">
                                    <div className={cn(
                                      "w-2 h-2 rounded-full mt-1.5 shrink-0",
                                      adm.estado === 'en_curso' ? "bg-green-500" :
                                      adm.estado === 'planificada' ? "bg-blue-500" :
                                      adm.estado === 'completada' ? "bg-muted-foreground" : "bg-yellow-500"
                                    )} />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-medium">
                                          {adm.motivo || "Sin motivo"}
                                        </span>
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                                          {adm.estado}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                                        <span>{format(new Date(adm.fecha_inicio), "dd/MM/yyyy", { locale: es })}</span>
                                        {adm.diagnostico_principal && <span>Dx: {adm.diagnostico_principal}</span>}
                                        {adm.profesional_nombre && <span>Dr. {adm.profesional_nombre}</span>}
                                        {adm.numero_ingreso && <span>Ing. #{adm.numero_ingreso}</span>}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                      </>
                    )}
                  </div>
                )}

                {/* Step 2: Form Selection */}
                {currentStep === 2 && (
                  <div className="space-y-4">
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

              </motion.div>
            </AnimatePresence>
      </section>
    </div>
  );
};

export default NewConsultation;
