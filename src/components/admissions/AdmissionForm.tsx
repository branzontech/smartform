
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, User, Calendar, Phone, MapPin, FileText, Clock, ClipboardList, ArrowRight } from "lucide-react";
import { z } from "zod";
import { Patient } from "@/types/patient-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { nanoid } from "nanoid";

interface AdmissionFormProps {
  patient: Patient | null;
  isNewPatient: boolean;
  onBack: () => void;
}

// Schema para validación del formulario
const patientSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  documentId: z.string().min(5, { message: "El documento debe tener al menos 5 caracteres" }),
  documentType: z.string(),
  dateOfBirth: z.string(),
  gender: z.enum(["Masculino", "Femenino", "Otro"]),
  contactNumber: z.string().min(6, { message: "El teléfono debe tener al menos 6 caracteres" }),
  email: z.string().email({ message: "Correo electrónico inválido" }).optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

const admissionSchema = z.object({
  reason: z.string().min(5, { message: "Por favor, describe el motivo de la consulta" }),
  insuranceProvider: z.string().optional().or(z.literal("")),
  insuranceNumber: z.string().optional().or(z.literal("")),
  priorityLevel: z.enum(["Normal", "Urgente", "Emergencia"]),
  notes: z.string().optional().or(z.literal("")),
  appointmentType: z.string(),
  assignedTo: z.string().optional().or(z.literal("")),
  scheduledTime: z.string(),
});

type PatientFormValues = z.infer<typeof patientSchema>;
type AdmissionFormValues = z.infer<typeof admissionSchema>;

export const AdmissionForm = ({ patient, isNewPatient, onBack }: AdmissionFormProps) => {
  const [step, setStep] = useState<"patient" | "admission">(isNewPatient ? "patient" : "admission");
  const [newPatientData, setNewPatientData] = useState<Patient | null>(null);
  
  // Patient form
  const patientForm = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: patient?.name || "",
      documentId: patient?.documentId || "",
      documentType: "DNI",
      dateOfBirth: patient?.dateOfBirth || "",
      gender: patient?.gender || "Masculino",
      contactNumber: patient?.contactNumber || "",
      email: patient?.email || "",
      address: patient?.address || "",
    },
  });

  // Admission form
  const admissionForm = useForm<AdmissionFormValues>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      reason: "",
      insuranceProvider: "",
      insuranceNumber: "",
      priorityLevel: "Normal",
      notes: "",
      appointmentType: "Consulta",
      assignedTo: "",
      scheduledTime: new Date().toISOString().substring(0, 16),
    },
  });

  const handlePatientSubmit = (data: PatientFormValues) => {
    // Create a new patient object with the form data
    const newPatient: Patient = {
      id: nanoid(),
      name: data.name,
      documentId: data.documentId,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      contactNumber: data.contactNumber,
      email: data.email || undefined,
      address: data.address || undefined,
      createdAt: new Date(),
    };
    
    setNewPatientData(newPatient);
    toast({
      title: "Paciente creado",
      description: "Los datos del paciente han sido guardados. Ahora puede continuar con la admisión.",
    });
    
    // Move to admission step
    setStep("admission");
  };

  const handleAdmissionSubmit = (data: AdmissionFormValues) => {
    // Combine patient data with admission data
    const finalPatient = newPatientData || patient;
    
    console.log("Patient data:", finalPatient);
    console.log("Admission data:", data);
    
    toast({
      title: "Admisión completada",
      description: isNewPatient 
        ? "Paciente creado y admisión registrada correctamente." 
        : "Admisión registrada correctamente.",
    });
  };

  // If creating a new patient, show patient form first
  if (isNewPatient && step === "patient") {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Crear nuevo paciente</h2>
          <div className="flex items-center text-sm text-gray-500">
            <span className="bg-primary text-white w-5 h-5 rounded-full inline-flex items-center justify-center mr-2">1</span>
            <span>Datos del paciente</span>
            <ArrowRight size={16} className="mx-2" />
            <span className="bg-gray-200 text-gray-500 w-5 h-5 rounded-full inline-flex items-center justify-center mr-2">2</span>
            <span>Datos de admisión</span>
          </div>
        </div>

        <Form {...patientForm}>
          <form onSubmit={patientForm.handleSubmit(handlePatientSubmit)} className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={patientForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre completo</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-4">
                    <FormField
                      control={patientForm.control}
                      name="documentType"
                      render={({ field }) => (
                        <FormItem className="w-1/3">
                          <FormLabel>Tipo</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="DNI">DNI</SelectItem>
                              <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                              <SelectItem value="Cédula">Cédula</SelectItem>
                              <SelectItem value="Otro">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={patientForm.control}
                      name="documentId"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Nº Documento</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={patientForm.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de nacimiento</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Calendar size={16} className="mr-2 text-gray-500" />
                            <Input
                              type="date"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={patientForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Género</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex gap-6"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Masculino" />
                              </FormControl>
                              <FormLabel className="cursor-pointer">Masculino</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Femenino" />
                              </FormControl>
                              <FormLabel className="cursor-pointer">Femenino</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Otro" />
                              </FormControl>
                              <FormLabel className="cursor-pointer">Otro</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={patientForm.control}
                    name="contactNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono de contacto</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Phone size={16} className="mr-2 text-gray-500" />
                            <Input {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={patientForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo electrónico</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={patientForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <MapPin size={16} className="mr-2 text-gray-500" />
                            <Input {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between gap-3">
              <Button type="button" variant="outline" onClick={onBack}>
                Cancelar
              </Button>
              <Button type="submit" className="gap-2">
                Continuar a admisión
                <ArrowRight size={18} />
              </Button>
            </div>
          </form>
        </Form>
      </div>
    );
  }

  // Show admission form (for both new and existing patients)
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">
          {isNewPatient ? "Admisión para nuevo paciente" : "Admisión de paciente"}
        </h2>
        
        {isNewPatient && (
          <div className="flex items-center text-sm text-gray-500">
            <span className="bg-green-500 text-white w-5 h-5 rounded-full inline-flex items-center justify-center mr-2">✓</span>
            <span>Datos del paciente</span>
            <ArrowRight size={16} className="mx-2" />
            <span className="bg-primary text-white w-5 h-5 rounded-full inline-flex items-center justify-center mr-2">2</span>
            <span>Datos de admisión</span>
          </div>
        )}
      </div>

      {patient || newPatientData ? (
        <div className="mb-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Datos del paciente</h3>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <p className="font-medium text-base">
                {newPatientData?.name || patient?.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {newPatientData?.documentId || patient?.documentId} • 
                {newPatientData?.contactNumber || patient?.contactNumber}
              </p>
            </div>
            {step === "admission" && isNewPatient && (
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => setStep("patient")}
                className="text-xs"
              >
                Editar información
              </Button>
            )}
          </div>
        </div>
      ) : null}

      <Form {...admissionForm}>
        <form onSubmit={admissionForm.handleSubmit(handleAdmissionSubmit)} className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={admissionForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Motivo de la consulta</FormLabel>
                      <FormControl>
                        <div className="flex items-start">
                          <FileText size={16} className="mr-2 mt-2 text-gray-500" />
                          <Textarea
                            {...field}
                            placeholder="Describa el motivo de la consulta"
                            rows={3}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={admissionForm.control}
                  name="appointmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de consulta</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Consulta">Consulta general</SelectItem>
                          <SelectItem value="Especialista">Especialista</SelectItem>
                          <SelectItem value="Urgencia">Urgencia</SelectItem>
                          <SelectItem value="Control">Control de tratamiento</SelectItem>
                          <SelectItem value="Procedimiento">Procedimiento</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={admissionForm.control}
                  name="priorityLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nivel de prioridad</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex gap-6"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Normal" />
                            </FormControl>
                            <FormLabel className="cursor-pointer text-green-600">Normal</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Urgente" />
                            </FormControl>
                            <FormLabel className="cursor-pointer text-amber-600">Urgente</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Emergencia" />
                            </FormControl>
                            <FormLabel className="cursor-pointer text-red-600">Emergencia</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={admissionForm.control}
                  name="insuranceProvider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proveedor de seguro</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un proveedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Sin seguro">Sin seguro</SelectItem>
                          <SelectItem value="Seguro Universal">Seguro Universal</SelectItem>
                          <SelectItem value="Seguro Médico Nacional">Seguro Médico Nacional</SelectItem>
                          <SelectItem value="MediSalud">MediSalud</SelectItem>
                          <SelectItem value="SeguroTotal">SeguroTotal</SelectItem>
                          <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={admissionForm.control}
                  name="insuranceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de póliza</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Número de póliza o afiliación" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={admissionForm.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asignar a médico</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un médico" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Sin asignar</SelectItem>
                          <SelectItem value="Dr. Juan Pérez">Dr. Juan Pérez</SelectItem>
                          <SelectItem value="Dra. María González">Dra. María González</SelectItem>
                          <SelectItem value="Dr. Carlos Rodríguez">Dr. Carlos Rodríguez</SelectItem>
                          <SelectItem value="Dra. Laura Sánchez">Dra. Laura Sánchez</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={admissionForm.control}
                  name="scheduledTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha y hora</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <Clock size={16} className="mr-2 text-gray-500" />
                          <Input type="datetime-local" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={admissionForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Notas adicionales</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Información adicional relevante para la admisión"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={isNewPatient ? () => setStep("patient") : onBack}
            >
              {isNewPatient ? "Volver a datos del paciente" : "Cancelar"}
            </Button>
            <Button type="submit" className="gap-2">
              <Save size={18} />
              {isNewPatient ? "Crear paciente y admisión" : "Guardar admisión"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
