
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { BackButton } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, Save, FileText, PlusCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Patient, MedicalConsultation } from "@/types/patient-types";
import { nanoid } from "nanoid";
import { useToast } from "@/hooks/use-toast";
import { Form as FormType } from '@/pages/Home';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const NewConsultation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryParams = new URLSearchParams(location.search);
  const preselectedPatientId = queryParams.get("patientId");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableForms, setAvailableForms] = useState<FormType[]>([]);
  
  // Form state
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
  
  // Consultation data
  const [consultationDate, setConsultationDate] = useState<Date>(new Date());
  const [reason, setReason] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState<MedicalConsultation["status"]>("Programada");
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  
  // Carga de pacientes y formularios
  useEffect(() => {
    const timer = setTimeout(() => {
      // Cargar pacientes
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

      // Cargar formularios
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

      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let patientId = selectedPatientId;
    
    // Si es un nuevo paciente, lo guardamos primero
    if (isNewPatient) {
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
      
      // Guardar en localStorage
      const updatedPatients = [...patients, newPatient];
      localStorage.setItem("patients", JSON.stringify(updatedPatients));
      
      patientId = newPatient.id;
    } else {
      // Actualizar lastVisitAt del paciente existente
      const updatedPatients = patients.map(patient => 
        patient.id === patientId 
          ? { ...patient, lastVisitAt: new Date() }
          : patient
      );
      localStorage.setItem("patients", JSON.stringify(updatedPatients));
    }
    
    // Crear la nueva consulta
    const newConsultation: MedicalConsultation = {
      id: nanoid(),
      patientId,
      consultationDate,
      reason,
      diagnosis: diagnosis || undefined,
      treatment: treatment || undefined,
      notes: notes || undefined,
      followUpDate: followUpDate || undefined,
      status,
      formId: selectedFormId || undefined
    };
    
    // Guardar la consulta
    const savedConsultations = localStorage.getItem("consultations");
    const existingConsultations = savedConsultations ? JSON.parse(savedConsultations) : [];
    const updatedConsultations = [...existingConsultations, newConsultation];
    localStorage.setItem("consultations", JSON.stringify(updatedConsultations));
    
    // Notificar y redirigir
    toast({
      title: "Consulta creada",
      description: "La consulta ha sido registrada correctamente",
    });

    // Si hay un formulario seleccionado, redirigir al formulario
    if (selectedFormId) {
      navigate(`/ver/${selectedFormId}?patientId=${patientId}&consultationId=${newConsultation.id}`);
    } else {
      navigate(`/pacientes/${patientId}`);
    }
  };

  const handleCreateFormClick = () => {
    // Guardar el estado actual y redirigir al creador de formularios
    if (selectedPatientId || (isNewPatient && newPatientData.name)) {
      localStorage.setItem("pendingConsultation", JSON.stringify({
        patientId: selectedPatientId,
        isNewPatient,
        newPatientData,
        consultationDate,
        reason,
        diagnosis,
        treatment,
        notes,
        followUpDate,
        status
      }));
      navigate("/crear");
    } else {
      toast({
        title: "Datos incompletos",
        description: "Por favor seleccione un paciente o complete los datos del nuevo paciente primero.",
        variant: "destructive"
      });
    }
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
        
        <form onSubmit={handleSubmit} className="space-y-6">
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
                <>
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
                </>
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
            </div>
          </div>
          
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
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Estado de la consulta *</Label>
                  <Select 
                    value={status}
                    onValueChange={(value) => setStatus(value as MedicalConsultation["status"])}
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
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    required
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="diagnosis">Diagnóstico</Label>
                  <Textarea
                    id="diagnosis"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="treatment">Tratamiento</Label>
                  <Textarea
                    id="treatment"
                    value={treatment}
                    onChange={(e) => setTreatment(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Notas adicionales</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="followUpDate">Fecha de seguimiento</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {followUpDate 
                          ? format(followUpDate, "PPP", { locale: es }) 
                          : "Seleccionar fecha (opcional)"
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={followUpDate}
                        onSelect={setFollowUpDate}
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Formulario de consulta</h2>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleCreateFormClick}
                className="flex items-center gap-2"
              >
                <PlusCircle size={16} />
                Crear nuevo formulario
              </Button>
            </div>
            
            <div className="space-y-4">
              {availableForms.length > 0 ? (
                <div className="space-y-4">
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
                            onClick={() => setSelectedFormId(form.id)}
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
                            onClick={() => setSelectedFormId(form.id)}
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
                            onClick={() => setSelectedFormId(form.id)}
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

                  {selectedFormId && (
                    <div className="flex items-center mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                      <FileText size={20} className="text-green-600 dark:text-green-400 mr-2" />
                      <div className="text-sm">
                        <p className="font-medium text-green-800 dark:text-green-300">
                          Formulario seleccionado: {availableForms.find(f => f.id === selectedFormId)?.title}
                        </p>
                        <p className="text-green-600 dark:text-green-400">
                          Al guardar la consulta será redirigido al formulario seleccionado.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 border border-dashed rounded-lg">
                  <FileText size={40} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay formularios disponibles</h3>
                  <p className="text-gray-500 mb-4">Crea un nuevo formulario para usarlo en esta consulta</p>
                  <Button onClick={handleCreateFormClick} variant="outline">
                    <PlusCircle size={16} className="mr-2" />
                    Crear formulario
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              className="bg-purple-600 hover:bg-purple-700"
              disabled={
                (isNewPatient && (!newPatientData.name || !newPatientData.documentId || !newPatientData.dateOfBirth || !newPatientData.contactNumber)) ||
                (!isNewPatient && !selectedPatientId) ||
                !reason
              }
            >
              <Save className="mr-2" size={16} />
              Guardar consulta
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default NewConsultation;
