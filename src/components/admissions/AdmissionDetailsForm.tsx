
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText, Clock, Save } from "lucide-react";
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

const admissionSchema = z.object({
  reason: z.string().min(5, { message: "Por favor, describe el motivo de la consulta" }),
  insuranceProvider: z.string().optional().or(z.literal("")),
  insuranceNumber: z.string().optional().or(z.literal("")),
  priorityLevel: z.enum(["Normal", "Urgente", "Emergencia"]),
  notes: z.string().optional().or(z.literal("")),
  appointmentType: z.string(),
  assignedTo: z.string().optional(),
  scheduledTime: z.string(),
});

export type AdmissionFormValues = z.infer<typeof admissionSchema>;

interface AdmissionDetailsFormProps {
  isNewPatient: boolean;
  onBack: () => void;
  onSubmit: (data: AdmissionFormValues) => void;
}

export const AdmissionDetailsForm = ({ 
  isNewPatient, 
  onBack, 
  onSubmit 
}: AdmissionDetailsFormProps) => {
  const admissionForm = useForm<AdmissionFormValues>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      reason: "",
      insuranceProvider: "",
      insuranceNumber: "",
      priorityLevel: "Normal",
      notes: "",
      appointmentType: "Consulta",
      assignedTo: "no_assigned", // Changed from empty string to a valid value
      scheduledTime: new Date().toISOString().substring(0, 16),
    },
  });

  return (
    <Form {...admissionForm}>
      <form onSubmit={admissionForm.handleSubmit(onSubmit)} className="space-y-6">
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
                        <SelectItem value="no_assigned">Sin asignar</SelectItem>
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
            onClick={onBack}
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
  );
};

export default AdmissionDetailsForm;

