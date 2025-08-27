
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, User, FilePlus, Save, Settings } from "lucide-react";
import { Header } from "@/components/layout/header";
import { BackButton } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Appointment, Patient } from "@/types/patient-types";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { isUserSignedIn, createGoogleCalendarEvent, updateGoogleCalendarEvent } from "@/utils/google-calendar";
import { FormCustomizer, CustomFieldRenderer, FormTemplate } from "@/components/forms/form-customizer";
import { saveFormTemplate, getFormTemplates, getDefaultFormTemplate } from "@/utils/form-template-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Datos mock
const mockAppointments: Appointment[] = [
  {
    id: "1",
    patientId: "1",
    patientName: "Juan Pérez",
    date: new Date(),
    time: "09:00",
    duration: 30,
    reason: "Consulta de seguimiento",
    status: "Programada",
    notes: "Traer análisis recientes",
    createdAt: new Date(new Date().setDate(new Date().getDate() - 5)),
  },
  // ... más citas
];

// Pacientes mock para el selector
const mockPatients: Patient[] = [
  {
    id: "1",
    name: "Juan Pérez",
    documentId: "1234567890",
    dateOfBirth: "1985-05-15",
    gender: "Masculino",
    contactNumber: "555-123-4567",
    email: "juan.perez@example.com",
    createdAt: new Date("2023-01-10"),
    lastVisitAt: new Date("2023-06-20"),
  },
  {
    id: "2",
    name: "María García",
    documentId: "0987654321",
    dateOfBirth: "1990-08-20",
    gender: "Femenino",
    contactNumber: "555-987-6543",
    email: "maria.garcia@example.com",
    createdAt: new Date("2023-02-15"),
    lastVisitAt: new Date("2023-05-10"),
  },
  {
    id: "3",
    name: "Carlos Rodríguez",
    documentId: "5678901234",
    dateOfBirth: "1978-12-03",
    gender: "Masculino",
    contactNumber: "555-456-7890",
    address: "Calle Principal 123",
    createdAt: new Date("2023-03-05"),
  },
  {
    id: "4",
    name: "Ana Martínez",
    documentId: "1357924680",
    dateOfBirth: "1995-03-25",
    gender: "Femenino",
    contactNumber: "555-789-0123",
    email: "ana.martinez@example.com",
    createdAt: new Date("2023-04-10"),
  },
  {
    id: "5",
    name: "Pedro Gómez",
    documentId: "2468013579",
    dateOfBirth: "1982-11-10",
    gender: "Masculino",
    contactNumber: "555-321-6547",
    address: "Avenida Central 456",
    createdAt: new Date("2023-05-15"),
  },
];

// Horarios disponibles
const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", 
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", 
  "16:00", "16:30", "17:00", "17:30", "18:00"
];

// Duraciones típicas
const durations = [15, 30, 45, 60, 90, 120];

// Schema para validación del formulario (se construye dinámicamente)
const getAppointmentFormSchema = (customFields: any[] = []) => {
  let schemaObj: any = {
    patientId: z.string({
      required_error: "Por favor selecciona un paciente",
    }),
    date: z.date({
      required_error: "Por favor selecciona una fecha",
    }),
    time: z.string({
      required_error: "Por favor selecciona una hora",
    }),
    duration: z.number({
      required_error: "Por favor selecciona una duración",
    }),
    reason: z.string().min(3, {
      message: "El motivo debe tener al menos 3 caracteres",
    }),
    notes: z.string().optional(),
    status: z.enum(["Programada", "Pendiente", "Reprogramada", "Cancelada", "Completada"], {
      required_error: "Por favor selecciona un estado",
    }),
  };

  // Agregar validaciones para campos personalizados
  customFields.forEach(field => {
    if (field.required) {
      switch (field.type) {
        case "number":
          schemaObj[field.id] = z.number({
            required_error: `${field.label} es requerido`
          });
          break;
        case "checkbox":
          schemaObj[field.id] = z.array(z.string()).min(1, {
            message: `${field.label} es requerido`
          });
          break;
        case "date":
          schemaObj[field.id] = z.string({
            required_error: `${field.label} es requerido`
          });
          break;
        default:
          schemaObj[field.id] = z.string().min(1, {
            message: `${field.label} es requerido`
          });
      }
    } else {
      schemaObj[field.id] = z.any().optional();
    }
  });

  return z.object(schemaObj);
};

// Componente principal para crear/editar citas
const AppointmentForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [googleEventId, setGoogleEventId] = useState<string | undefined>();
  const [syncWithGoogle, setSyncWithGoogle] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<FormTemplate | null>(null);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [customFieldErrors, setCustomFieldErrors] = useState<Record<string, string>>({});
  const isEditing = !!id;
  
  // Crear schema dinámico basado en la plantilla actual
  const appointmentFormSchema = getAppointmentFormSchema(currentTemplate?.fields || []);
  type FormValues = z.infer<typeof appointmentFormSchema>;
  
  // Form con valores predeterminados
  const form = useForm<FormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patientId: "",
      date: new Date(),
      time: "09:00",
      duration: 30,
      reason: "",
      notes: "",
      status: "Programada",
    },
  });

  // Cargar plantilla predeterminada al iniciar
  useEffect(() => {
    const defaultTemplate = getDefaultFormTemplate();
    if (defaultTemplate) {
      setCurrentTemplate(defaultTemplate);
    }
  }, []);

  // Verificar si el usuario está conectado a Google al cargar
  useEffect(() => {
    const checkGoogleConnection = async () => {
      try {
        const connected = isUserSignedIn();
        setGoogleConnected(connected);
        
        // Si está conectado y hay una sincronización preferida guardada
        if (connected) {
          const preferSync = localStorage.getItem('googleCalendarSync') === 'true';
          setSyncWithGoogle(preferSync);
        }
      } catch (error) {
        console.error("Error checking Google connection:", error);
      }
    };
    
    checkGoogleConnection();
  }, []);

  // Cargar pacientes y cita existente al iniciar
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
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
          // Si hay error al parsear, usar datos mock
          setPatients(mockPatients);
          // Guardar los pacientes mock en localStorage para facilitar pruebas
          localStorage.setItem("patients", JSON.stringify(mockPatients));
        }
      } else {
        // Si no hay pacientes guardados, usar datos mock
        setPatients(mockPatients);
        // Guardar los pacientes mock en localStorage para facilitar pruebas
        localStorage.setItem("patients", JSON.stringify(mockPatients));
      }
      
      // Si estamos editando, cargar la cita
      if (isEditing) {
        const savedAppointments = localStorage.getItem("appointments");
        let appointmentsList = mockAppointments;
        
        if (savedAppointments) {
          try {
            const parsedAppointments = JSON.parse(savedAppointments).map((app: any) => ({
              ...app,
              date: new Date(app.date),
              createdAt: new Date(app.createdAt),
              updatedAt: app.updatedAt ? new Date(app.updatedAt) : undefined,
            }));
            appointmentsList = parsedAppointments;
          } catch (error) {
            console.error("Error parsing appointments:", error);
          }
        }
        
        const appointmentToEdit = appointmentsList.find(a => a.id === id);
        
        if (appointmentToEdit) {
          // Guardar el ID del evento de Google si existe
          if (appointmentToEdit.googleEventId) {
            setGoogleEventId(appointmentToEdit.googleEventId);
            setSyncWithGoogle(true);
          }
          
          // Cargar valores en el formulario
          form.reset({
            patientId: appointmentToEdit.patientId,
            date: new Date(appointmentToEdit.date),
            time: appointmentToEdit.time,
            duration: appointmentToEdit.duration,
            reason: appointmentToEdit.reason,
            notes: appointmentToEdit.notes || "",
            status: appointmentToEdit.status,
          });
        }
      }
      
      setLoading(false);
    };
    
    loadData();
  }, [isEditing, id, form]);

  // Filtrar pacientes por término de búsqueda
  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.documentId.includes(searchTerm)
  );

  // Sincronizar con Google Calendar
  const syncAppointmentWithGoogle = async (appointment: Appointment): Promise<string | undefined> => {
    if (!syncWithGoogle || !googleConnected) return undefined;
    
    try {
      // Calcular la fecha de inicio y fin
      const startDate = new Date(`${appointment.date.toISOString().split('T')[0]}T${appointment.time}`);
      const endDate = new Date(startDate.getTime() + appointment.duration * 60000);
      
      const appointmentData = {
        title: `Cita con ${appointment.patientName}`,
        description: `Motivo: ${appointment.reason}\n${appointment.notes ? `Notas: ${appointment.notes}` : ''}`,
        start: startDate,
        end: endDate
      };
      
      let result;
      if (isEditing && googleEventId) {
        // Actualizar evento existente
        result = await updateGoogleCalendarEvent(googleEventId, appointmentData);
        toast.success("Cita actualizada en Google Calendar");
        return googleEventId;
      } else {
        // Crear nuevo evento
        result = await createGoogleCalendarEvent(appointmentData);
        if (result && result.id) {
          toast.success("Cita sincronizada con Google Calendar");
          return result.id;
        }
      }
    } catch (error) {
      console.error("Error syncing with Google Calendar:", error);
      toast.error("Error al sincronizar con Google Calendar, pero la cita fue guardada localmente");
    }
    
    return undefined;
  };

  // Validar campos personalizados
  const validateCustomFields = (): boolean => {
    if (!currentTemplate?.fields) return true;
    
    const errors: Record<string, string> = {};
    let isValid = true;

    currentTemplate.fields.forEach(field => {
      if (field.required) {
        const value = customFieldValues[field.id];
        if (!value || (Array.isArray(value) && value.length === 0)) {
          errors[field.id] = `${field.label} es requerido`;
          isValid = false;
        }
      }
    });

    setCustomFieldErrors(errors);
    return isValid;
  };

  // Manejar cambio en campos personalizados
  const handleCustomFieldChange = (fieldId: string, value: any) => {
    setCustomFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Limpiar error si existe
    if (customFieldErrors[fieldId]) {
      setCustomFieldErrors(prev => ({
        ...prev,
        [fieldId]: ""
      }));
    }
  };

  // Manejar guardado de plantilla
  const handleSaveTemplate = (template: FormTemplate) => {
    saveFormTemplate(template);
    setCurrentTemplate(template);
    setShowCustomizer(false);
    toast.success("Plantilla guardada exitosamente");
  };

  // Manejar envío del formulario
  const onSubmit = async (values: FormValues) => {
    console.log("Form values:", values);
    
    // Validar campos personalizados
    if (!validateCustomFields()) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }
    
    const selectedPatient = patients.find(p => p.id === values.patientId);
    
    if (!selectedPatient) {
      toast.error("Paciente no encontrado");
      return;
    }
    
    const newAppointment: any = {
      id: isEditing ? id as string : Date.now().toString(),
      patientId: values.patientId,
      patientName: selectedPatient.name,
      date: values.date,
      time: values.time,
      duration: values.duration,
      reason: values.reason,
      status: values.status,
      notes: values.notes,
      createdAt: isEditing ? new Date() : new Date(),
      updatedAt: isEditing ? new Date() : undefined,
      googleEventId,
      customFields: customFieldValues // Agregar campos personalizados
    };
    
    // Sincronizar con Google Calendar si está habilitado
    if (syncWithGoogle && googleConnected) {
      const newEventId = await syncAppointmentWithGoogle(newAppointment);
      if (newEventId) {
        newAppointment.googleEventId = newEventId;
      }
    }
    
    // Guardar en localStorage
    const savedAppointments = localStorage.getItem("appointments");
    let appointmentsList: any[] = [];
    
    if (savedAppointments) {
      try {
        appointmentsList = JSON.parse(savedAppointments);
        
        if (isEditing) {
          // Actualizar cita existente
          appointmentsList = appointmentsList.map(app => 
            app.id === id ? newAppointment : app
          );
        } else {
          // Añadir nueva cita
          appointmentsList.push(newAppointment);
        }
      } catch (error) {
        console.error("Error parsing appointments:", error);
        appointmentsList = isEditing ? [] : [newAppointment];
      }
    } else {
      appointmentsList = [newAppointment];
    }
    
    localStorage.setItem("appointments", JSON.stringify(appointmentsList));
    
    toast.success(isEditing ? "Cita actualizada con éxito" : "Cita creada con éxito");
    navigate("/citas");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-6 mx-auto"></div>
            <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto px-4">
              <div className="h-40 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
              <div className="h-40 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log("Pacientes disponibles:", patients);
  console.log("Pacientes filtrados:", filteredPatients);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4">
        <BackButton />
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            {isEditing ? (
              <>
                <Calendar className="mr-2 text-purple-500" />
                Editar Cita
              </>
            ) : (
              <>
                <FilePlus className="mr-2 text-purple-500" />
                Nueva Cita
              </>
            )}
          </h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Seleccionar Paciente</CardTitle>
                <CardDescription>
                  Busca y selecciona un paciente para la cita
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="patient-search">Buscar paciente</Label>
                  <Input
                    id="patient-search"
                    placeholder="Nombre o documento"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="patientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paciente</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecciona un paciente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[200px] overflow-y-auto bg-white dark:bg-gray-800">
                          {filteredPatients.length > 0 ? (
                            filteredPatients.map((patient) => (
                              <SelectItem
                                key={patient.id}
                                value={patient.id}
                              >
                                <div className="flex items-center">
                                  <User className="mr-2 h-4 w-4" />
                                  <span>{patient.name} - {patient.documentId}</span>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-4 text-center text-sm text-gray-500">
                              {searchTerm ? "No se encontraron pacientes" : "No hay pacientes disponibles"}
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalles de la Cita</CardTitle>
                <CardDescription>
                  Establece fecha, hora y duración de la cita
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className="w-full pl-3 text-left font-normal"
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "PPP", { locale: es })
                              ) : (
                                <span>Seleccionar fecha</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarPicker
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona hora" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timeSlots.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duración (min)</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          value={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona duración" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {durations.map((duration) => (
                              <SelectItem key={duration} value={duration.toString()}>
                                {duration} minutos
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Programada">Programada</SelectItem>
                          <SelectItem value="Pendiente">Pendiente</SelectItem>
                          <SelectItem value="Reprogramada">Reprogramada</SelectItem>
                          <SelectItem value="Completada">Completada</SelectItem>
                          <SelectItem value="Cancelada">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {googleConnected && (
              <Card>
                <CardHeader>
                  <CardTitle>Integración con Google Calendar</CardTitle>
                  <CardDescription>
                    Sincroniza esta cita con tu calendario de Google
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="sync-google"
                      checked={syncWithGoogle}
                      onCheckedChange={(checked) => setSyncWithGoogle(checked as boolean)}
                    />
                    <Label htmlFor="sync-google">
                      {isEditing && googleEventId 
                        ? "Actualizar esta cita en Google Calendar" 
                        : "Agregar esta cita a Google Calendar"
                      }
                    </Label>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Campos personalizados */}
            {currentTemplate && currentTemplate.fields.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Campos Personalizados</CardTitle>
                      <CardDescription>
                        Plantilla: {currentTemplate.name}
                      </CardDescription>
                    </div>
                    <Dialog open={showCustomizer} onOpenChange={setShowCustomizer}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Personalizar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Personalizar Campos de Cita</DialogTitle>
                        </DialogHeader>
                        <FormCustomizer
                          existingTemplate={currentTemplate}
                          onSave={handleSaveTemplate}
                          onCancel={() => setShowCustomizer(false)}
                          maxFields={10}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentTemplate.fields.map((field) => (
                    <CustomFieldRenderer
                      key={field.id}
                      field={field}
                      value={customFieldValues[field.id]}
                      onChange={(value) => handleCustomFieldChange(field.id, value)}
                      error={customFieldErrors[field.id]}
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Configurar plantilla si no hay una activa */}
            {(!currentTemplate || currentTemplate.fields.length === 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Campos Personalizados</CardTitle>
                  <CardDescription>
                    Personaliza los campos adicionales para este tipo de cita
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Dialog open={showCustomizer} onOpenChange={setShowCustomizer}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar Campos Personalizados
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Personalizar Campos de Cita</DialogTitle>
                      </DialogHeader>
                      <FormCustomizer
                        templateName="Cita Personalizada"
                        onSave={handleSaveTemplate}
                        onCancel={() => setShowCustomizer(false)}
                        maxFields={10}
                      />
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Información adicional</CardTitle>
                <CardDescription>
                  Detalla el motivo de la cita y añade notas si es necesario
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo de la cita</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej: Consulta general, seguimiento, etc." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas adicionales</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Indicaciones especiales, recordatorios, etc."
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="justify-end">
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? "Actualizar cita" : "Crear cita"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </main>
    </div>
  );
};

export default AppointmentForm;
