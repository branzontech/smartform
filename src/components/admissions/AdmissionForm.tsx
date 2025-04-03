
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, User, Calendar, Phone, MapPin, FileText, Clock, ClipboardList } from "lucide-react";
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
  patient: patientSchema,
  reason: z.string().min(5, { message: "Por favor, describe el motivo de la consulta" }),
  insuranceProvider: z.string().optional().or(z.literal("")),
  insuranceNumber: z.string().optional().or(z.literal("")),
  priorityLevel: z.enum(["Normal", "Urgente", "Emergencia"]),
  notes: z.string().optional().or(z.literal("")),
  appointmentType: z.string(),
  assignedTo: z.string().optional().or(z.literal("")),
  scheduledTime: z.string(),
});

type AdmissionFormValues = z.infer<typeof admissionSchema>;

export const AdmissionForm = ({ patient, isNewPatient, onBack }: AdmissionFormProps) => {
  const form = useForm<AdmissionFormValues>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      patient: {
        name: patient?.name || "",
        documentId: patient?.documentId || "",
        documentType: "DNI",
        dateOfBirth: patient?.dateOfBirth || "",
        gender: patient?.gender || "Masculino",
        contactNumber: patient?.contactNumber || "",
        email: patient?.email || "",
        address: patient?.address || "",
      },
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

  const onSubmit = (data: AdmissionFormValues) => {
    console.log("Form data:", data);
    toast({
      title: "Admisión completada",
      description: isNewPatient 
        ? "Paciente creado y admisión registrada correctamente." 
        : "Admisión registrada correctamente.",
    });
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="p-0 h-auto hover:bg-transparent"
        >
          <ArrowLeft size={20} className="text-gray-500" />
        </Button>
        <h2 className="text-xl font-semibold">
          {isNewPatient ? "Nuevo paciente y admisión" : "Admisión de paciente"}
        </h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="patient" className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="patient" className="flex gap-2">
                <User size={18} />
                <span>Datos del paciente</span>
              </TabsTrigger>
              <TabsTrigger value="admission" className="flex gap-2">
                <ClipboardList size={18} />
                <span>Datos de admisión</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Pestaña de datos del paciente */}
            <TabsContent value="patient">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="patient.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre completo</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isNewPatient && patient !== null} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex gap-4">
                      <FormField
                        control={form.control}
                        name="patient.documentType"
                        render={({ field }) => (
                          <FormItem className="w-1/3">
                            <FormLabel>Tipo</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={!isNewPatient && patient !== null}
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
                        control={form.control}
                        name="patient.documentId"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Nº Documento</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!isNewPatient && patient !== null} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="patient.dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha de nacimiento</FormLabel>
                          <FormControl>
                            <div className="flex items-center">
                              <Calendar size={16} className="mr-2 text-gray-500" />
                              <Input
                                type="date"
                                {...field}
                                disabled={!isNewPatient && patient !== null}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="patient.gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Género</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex gap-6"
                              disabled={!isNewPatient && patient !== null}
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
                      control={form.control}
                      name="patient.contactNumber"
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
                      control={form.control}
                      name="patient.email"
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
                      control={form.control}
                      name="patient.address"
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
            </TabsContent>
            
            {/* Pestaña de datos de la admisión */}
            <TabsContent value="admission">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
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
                      control={form.control}
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
                      control={form.control}
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
                      control={form.control}
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
                      control={form.control}
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
                      control={form.control}
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
                      control={form.control}
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
                      control={form.control}
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
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onBack}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2">
              <Save size={18} />
              Guardar admisión
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
