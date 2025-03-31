import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { BackButton } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, Save, FileText, ArrowRight, Bell, AlertTriangle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Patient, PatientAlert, FollowUp } from "@/types/patient-types";
import { nanoid } from "nanoid";
import { useToast } from "@/hooks/use-toast";
import { Form as FormType } from '@/pages/Home';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getRecentAndFrequentForms } from "@/utils/form-utils";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

type WorkflowStep = 'select-patient' | 'select-form' | 'consultation-details';

const NewConsultation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryParams = new URLSearchParams(location.search);
  const preselectedPatientId = queryParams.get("patientId");

  const [currentStep, setCurrentStep] = useState<WorkflowStep>('select-patient');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableForms, setAvailableForms] = useState<FormType[]>([]);
  const [recentForms, setRecentForms] = useState<any[]>([]);
  const [frequentForms, setFrequentForms] = useState<any[]>([]);
  
  const [selectedPatientId, setSelectedPatientId] = useState<string>(preselectedPatientId || "");
  const [isNewPatient, setIsNewPatient] = useState(!preselectedPatientId);
  const [newPatientData, setNewPatientData] = useState<Partial<Patient>>({
    name: "",
    documentId: "",
    dateOfBirth: "",
    gender: "Masculino",
    contactNumber: "",
    email: "",
    address: ""
  });
  
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [selectedFormTitle, setSelectedFormTitle] = useState<string>("");
  
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

  useEffect(() => {
    const timer = setTimeout(() => {
      const savedPatients = localStorage.getItem("patients");
      if (savedPatients) {
        try {
          const parsedPatients = JSON.parse(savedPatients).map((patient: any) => ({
            ...patient,
            createdAt: new Date(patient.createdAt),
            lastVisitAt: patient.lastVisitAt ? new Date(patient.lastVisitAt) : undefined,
          }));
          setPatients(parsedPatients);
        } catch (error) {
          console.error("Error parsing patients:", error);
          setPatients([]);
        }
      } else {
        setPatients([]);
      }

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
          setAvailableForms([]);
        }
      } else {
        setAvailableForms([]);
      }

      if (selectedPatientId) {
        const { recentForms, frequentForms } = getRecentAndFrequentForms(selectedPatientId);
        setRecentForms(recentForms);
        setFrequentForms(frequentForms);
      } else {
        const { recentForms, frequentForms } = getRecentAndFrequentForms();
        setRecentForms(recentForms);
        setFrequentForms(frequentForms);
      }

      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [selectedPatientId]);

  const handlePatientContinue = () => {
    let patientId = selectedPatientId;
    
    if (isNewPatient) {
      if (!newPatientData.name || !newPatientData.documentId || !newPatientData.contactNumber) {
        toast({
          title: "Datos incompletos",
          description: "Por favor complete los datos básicos del paciente",
          variant: "destructive"
        });
        return;
      }
      
      const newPatient: Patient = {
        id: nanoid(),
        name: newPatientData.name || "",
        documentId: newPatientData.documentId || "",
        dateOfBirth: newPatientData.dateOfBirth || new Date().toISOString().split('T')[0],
        gender: newPatientData.gender as "Masculino" | "Femenino" | "Otro" || "Masculino",
        contactNumber: newPatientData.contactNumber || "",
        email: newPatientData.email,
        address: newPatientData.address,
        createdAt: new Date(),
        lastVisitAt: new Date()
      };
      
      const updatedPatients = [...patients, newPatient];
      localStorage.setItem("patients", JSON.stringify(updatedPatients));
      
      patientId = newPatient.id;
      setSelectedPatientId(patientId);
    } else if (!selectedPatientId) {
      toast({
        title: "Paciente no seleccionado",
        description: "Por favor seleccione un paciente para continuar",
        variant: "destructive"
      });
      return;
    }
    
    const { recentForms, frequentForms } = getRecentAndFrequentForms(patientId);
    setRecentForms(recentForms);
    setFrequentForms(frequentForms);
    
    setCurrentStep('select-form');
  };

  const handleFormContinue = () => {
    if (!selectedFormId) {
      toast({
        title: "Formulario no seleccionado",
        description: "Por favor seleccione un formulario para continuar",
        variant: "destructive"
      });
      return;
    }
    
    setCurrentStep('consultation-details');
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
        description: "Por favor ingrese el motivo de la consulta",
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
      formId: selectedFormId,
      formTitle: selectedFormTitle
    };
    
    const savedConsultations = localStorage.getItem("consultations");
    const existingConsultations = savedConsultations ? JSON.parse(savedConsultations) : [];
    const updatedConsultations = [...existingConsultations, newConsultation];
    localStorage.setItem("consultations", JSON.stringify(updatedConsultations));
    
    const updatedPatients = patients.map(patient => 
      patient.id === selectedPatientId 
        ? { ...patient, lastVisitAt: new Date() }
        : patient
    );
    localStorage.setItem("patients", JSON.stringify(updatedPatients));
    
    if (enableFollowUp && followUpDate) {
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
        const patientName = patients.find(p => p.id === selectedPatientId)?.name || "";
        
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
        title: "Consulta y seguimiento creados",
        description: `Se ha programado un seguimiento para el ${format(followUpDate, "d 'de' MMMM 'de' yyyy", { locale: es })}`,
      });
    } else {
      toast({
        title: "Consulta creada",
        description: "Redirigiendo al formulario seleccionado...",
      });
    }
    
    navigate(`/ver/${selectedFormId}?patientId=${selectedPatientId}&consultationId=${newConsultation.id}`);
  };

  const openFormPreview = (formId: string) => {
    window.open(`/ver/${formId}`, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4">
        <BackButton />
        <h1 className="text-2xl font-bold mb-6">Nueva consulta médica</h1>
        
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <div className={`flex flex-col items-center ${currentStep === 'select-patient' ? 'text-purple-600' : 'text-gray-500'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${currentStep === 'select-patient' ? 'bg-purple-100 border-2 border-purple-600' : 'bg-gray-100'}`}>
                1
              </div>
              <span className="text-sm">Paciente</span>
            </div>
            <div className="flex-1 h-1 mx-2 bg-gray-200">
              {currentStep !== 'select-patient' && <div className="h-full bg-purple-600"></div>}
            </div>
            <div className={`flex flex-col items-center ${currentStep === 'select-form' ? 'text-purple-600' : 'text-gray-500'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${currentStep === 'select-form' ? 'bg-purple-100 border-2 border-purple-600' : 'bg-gray-100'}`}>
                2
              </div>
              <span className="text-sm">Formulario</span>
            </div>
            <div className="flex-1 h-1 mx-2 bg-gray-200">
              {currentStep === 'consultation-details' && <div className="h-full bg-purple-600"></div>}
            </div>
            <div className={`flex flex-col items-center ${currentStep === 'consultation-details' ? 'text-purple-600' : 'text-gray-500'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${currentStep === 'consultation-details' ? 'bg-purple-100 border-2 border-purple-600' : 'bg-gray-100'}`}>
                3
              </div>
              <span className="text-sm">Detalles</span>
            </div>
          </div>
        </div>
        
        {currentStep === 'select-patient' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Información del paciente</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="patient-type">Tipo de paciente</Label>
                <div className="flex space-x-4 mt-1">
                  <Button
                    type="button"
                    variant={!isNewPatient ? "default" : "outline"}
                    className={!isNewPatient ? "bg-purple-600 hover:bg-purple-700" : ""}
                    onClick={() => setIsNewPatient(false)}
                  >
                    Paciente existente
                  </Button>
                  <Button
                    type="button"
                    variant={isNewPatient ? "default" : "outline"}
                    className={isNewPatient ? "bg-purple-600 hover:bg-purple-700" : ""}
                    onClick={() => setIsNewPatient(true)}
                  >
                    Nuevo paciente
                  </Button>
                </div>
              </div>
              
              {isNewPatient ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre completo *</Label>
                    <Input
                      id="name"
                      value={newPatientData.name}
                      onChange={(e) => setNewPatientData({...newPatientData, name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="documentId">Documento de identidad *</Label>
                    <Input
                      id="documentId"
                      value={newPatientData.documentId}
                      onChange={(e) => setNewPatientData({...newPatientData, documentId: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Fecha de nacimiento *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={newPatientData.dateOfBirth}
                      onChange={(e) => setNewPatientData({...newPatientData, dateOfBirth: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gender">Género *</Label>
                    <Select 
                      value={newPatientData.gender}
                      onValueChange={(value) => setNewPatientData({...newPatientData, gender: value as any})}
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Seleccionar género" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Femenino">Femenino</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactNumber">Teléfono *</Label>
                    <Input
                      id="contactNumber"
                      value={newPatientData.contactNumber}
                      onChange={(e) => setNewPatientData({...newPatientData, contactNumber: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newPatientData.email || ""}
                      onChange={(e) => setNewPatientData({...newPatientData, email: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      value={newPatientData.address || ""}
                      onChange={(e) => setNewPatientData({...newPatientData, address: e.target.value})}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="patientId">Seleccionar paciente *</Label>
                  <Select 
                    value={selectedPatientId}
                    onValueChange={setSelectedPatientId}
                    required
                  >
                    <SelectTrigger id="patientId">
                      <SelectValue placeholder="Seleccionar paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name} - {patient.documentId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="flex justify-end mt-6">
                <Button 
                  onClick={handlePatientContinue} 
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Continuar
                  <ArrowRight className="ml-2" size={16} />
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {currentStep === 'select-form' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Seleccionar formulario</h2>
            
            {(recentForms.length > 0 || frequentForms.length > 0) && (
              <div className="mb-6">
                <h3 className="font-medium text-lg mb-3">Formularios sugeridos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentForms.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Formularios recientes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {recentForms.map(form => (
                            <li 
                              key={form.id}
                              className={`p-2 rounded cursor-pointer transition-colors ${selectedFormId === form.id ? 'bg-purple-100 dark:bg-purple-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                              onClick={() => {
                                setSelectedFormId(form.id);
                                setSelectedFormTitle(form.title);
                              }}
                            >
                              <div className="flex justify-between items-center">
                                <span>{form.title}</span>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openFormPreview(form.id);
                                  }}
                                >
                                  <FileText size={14} />
                                </Button>
                              </div>
                              <span className="text-xs text-gray-500">
                                Último uso: {format(new Date(form.lastUsed), 'dd/MM/yyyy')}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                  
                  {frequentForms.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Formularios frecuentes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {frequentForms.map(form => (
                            <li 
                              key={form.id}
                              className={`p-2 rounded cursor-pointer transition-colors ${selectedFormId === form.id ? 'bg-purple-100 dark:bg-purple-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                              onClick={() => {
                                setSelectedFormId(form.id);
                                setSelectedFormTitle(form.title);
                              }}
                            >
                              <div className="flex justify-between items-center">
                                <span>{form.title}</span>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openFormPreview(form.id);
                                  }}
                                >
                                  <FileText size={14} />
                                </Button>
                              </div>
                              <span className="text-xs text-gray-500">
                                Usado {form.usageCount} veces
                              </span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <h3 className="font-medium text-lg mt-6 mb-3">Todos los formularios</h3>
              
              {availableForms.length > 0 ? (
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    <TabsTrigger value="forms">Forms</TabsTrigger>
                    <TabsTrigger value="formato">Formatos</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availableForms.map(form => (
                        <div 
                          key={form.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedFormId === form.id ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 hover:border-purple-300'}`}
                          onClick={() => {
                            setSelectedFormId(form.id);
                            setSelectedFormTitle(form.title);
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{form.title}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{form.description}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openFormPreview(form.id);
                                }}
                              >
                                <FileText size={14} className="mr-1" />
                                Vista previa
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center mt-2 text-xs">
                            <span className="mr-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                              {form.formType === 'forms' ? 'Form' : 'Formato'}
                            </span>
                            <span className="text-gray-500">
                              Última actualización: {format(new Date(form.updatedAt), 'dd/MM/yyyy')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="forms" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availableForms.filter(form => form.formType === 'forms').map(form => (
                        <div 
                          key={form.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedFormId === form.id ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 hover:border-purple-300'}`}
                          onClick={() => {
                            setSelectedFormId(form.id);
                            setSelectedFormTitle(form.title);
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{form.title}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{form.description}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openFormPreview(form.id);
                                }}
                              >
                                <FileText size={14} className="mr-1" />
                                Vista previa
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center mt-2 text-xs">
                            <span className="mr-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Form</span>
                            <span className="text-gray-500">
                              Última actualización: {format(new Date(form.updatedAt), 'dd/MM/yyyy')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="formato" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availableForms.filter(form => form.formType === 'formato').map(form => (
                        <div 
                          key={form.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedFormId === form.id ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 hover:border-purple-300'}`}
                          onClick={() => {
                            setSelectedFormId(form.id);
                            setSelectedFormTitle(form.title);
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{form.title}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{form.description}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openFormPreview(form.id);
                                }}
                              >
                                <FileText size={14} className="mr-1" />
                                Vista previa
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center mt-2 text-xs">
                            <span className="mr-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Formato</span>
                            <span className="text-gray-500">
                              Última actualización: {format(new Date(form.updatedAt), 'dd/MM/yyyy')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-10 border border-dashed rounded-lg">
                  <FileText size={40} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay formularios disponibles</h3>
                  <p className="text-gray-500 mb-4">No se pueden encontrar formularios en el sistema</p>
                </div>
              )}
              
              {selectedFormId && (
                <div className="flex items-center mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <FileText size={20} className="text-green-600 dark:text-green-400 mr-2" />
                  <div className="text-sm">
                    <p className="font-medium text-green-800 dark:text-green-300">
                      Formulario seleccionado: {selectedFormTitle}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep('select-patient')}
                >
                  Volver
                </Button>
                <Button 
                  onClick={handleFormContinue} 
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={!selectedFormId}
                >
                  Continuar
                  <ArrowRight className="ml-2" size={16} />
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {currentStep === 'consultation-details' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Detalles de la consulta</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="consultationDate">Fecha de consulta *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {consultationDate ? format(consultationDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={consultationDate}
                          onSelect={(date) => date && setConsultationDate(date)}
                          locale={es}
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Estado de la consulta *</Label>
                    <Select 
                      value={status}
                      onValueChange={(value) => setStatus(value as "Programada" | "En curso" | "Completada" | "Cancelada")}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Programada">Programada</SelectItem>
                        <SelectItem value="En curso">En curso</SelectItem>
                        <SelectItem value="Completada">Completada</SelectItem>
                        <SelectItem value="Cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="reason">Motivo de consulta *</Label>
                    <Input
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="diagnosis">Diagnóstico (opcional)</Label>
                    <Input
                      id="diagnosis"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="treatment">Tratamiento (opcional)</Label>
                    <Input
                      id="treatment"
                      value={treatment}
                      onChange={(e) => setTreatment(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">Notas adicionales (opcional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-4 md:col-span-2 border-t pt-4 mt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Bell className="h-5 w-5 text-purple-500" />
                        <Label htmlFor="enableFollowUp" className="text-lg font-medium">
                          Programar seguimiento
                        </Label>
                      </div>
                      <Switch
                        id="enableFollowUp"
                        checked={enableFollowUp}
                        onCheckedChange={setEnableFollowUp}
                      />
                    </div>
                    
                    {enableFollowUp && (
                      <div className="border border-purple-100 dark:border-purple-900/50 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="followUpDate">Fecha de seguimiento *</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {followUpDate 
                                    ? format(followUpDate, "PPP", { locale: es }) 
                                    : "Seleccionar fecha"
                                  }
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={followUpDate}
                                  onSelect={setFollowUpDate}
                                  locale={es}
                                  disabled={(date) => isBefore(date, new Date())}
                                  className="p-3 pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="followUpReason">Motivo del seguimiento</Label>
                            <Input
                              id="followUpReason"
                              value={followUpReason}
                              onChange={(e) => setFollowUpReason(e.target.value)}
                              placeholder="Dejar en blanco para usar el motivo de consulta"
                            />
                          </div>
                          
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="followUpNotes">Notas de seguimiento</Label>
                            <Textarea
                              id="followUpNotes"
                              value={followUpNotes}
                              onChange={(e) => setFollowUpNotes(e.target.value)}
                              rows={2}
                              placeholder="Instrucciones o notas para el seguimiento"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="createReminder">Crear recordatorio</Label>
                              <Switch
                                id="createReminder"
                                checked={createReminder}
                                onCheckedChange={setCreateReminder}
                              />
                            </div>
                          </div>
                          
                          {createReminder && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="reminderDays">Días de anticipación</Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    id="reminderDays"
                                    type="number"
                                    min={1}
                                    max={30}
                                    value={reminderDays}
                                    onChange={(e) => setReminderDays(parseInt(e.target.value) || 2)}
                                  />
                                  <span className="text-sm">días antes</span>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="followUpPriority">Prioridad</Label>
                                <Select 
                                  value={followUpPriority}
                                  onValueChange={(value) => setFollowUpPriority(value as 'Alta' | 'Media' | 'Baja')}
                                >
                                  <SelectTrigger id="followUpPriority">
                                    <SelectValue placeholder="Seleccionar prioridad" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Alta">Alta</SelectItem>
                                    <SelectItem value="Media">Media</SelectItem>
                                    <SelectItem value="Baja">Baja</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              {followUpDate && (
                                <div className="md:col-span-2 flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                                  <p className="text-sm text-yellow-700">
                                    Se creará un recordatorio para el {
                                      calculateReminderDate(followUpDate, reminderDays) ? 
                                      format(calculateReminderDate(followUpDate, reminderDays)!, "d 'de' MMMM 'de' yyyy", { locale: es }) :
                                      "fecha inválida"
                                    }
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <FileText size={20} className="text-blue-600 dark:text-blue-400 mr-2" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800 dark:text-blue-300">
                      Al guardar será redirigido al formulario: {selectedFormTitle}
                    </p>
                    <p className="text-blue-600 dark:text-blue-400">
                      Se guardará la relación entre esta consulta y el formulario seleccionado.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between mt-6">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setCurrentStep('select-form')}
                >
                  Volver
                </Button>
                <Button 
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={!reason || (enableFollowUp && !followUpDate)}
                >
                  <Save className="mr-2" size={16} />
                  Guardar y continuar al formulario
                </Button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default NewConsultation;
