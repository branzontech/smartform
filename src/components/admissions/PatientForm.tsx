
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, MapPin, Phone } from "lucide-react";
import { nanoid } from "nanoid";
import { Patient } from "@/types/patient-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// Schema for validation of the form
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

export type PatientFormValues = z.infer<typeof patientSchema>;

interface PatientFormProps {
  patient: Patient | null;
  onSubmit: (data: PatientFormValues) => void;
  onCancel: () => void;
}

export const PatientForm = ({ patient, onSubmit, onCancel }: PatientFormProps) => {
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

  return (
    <Form {...patientForm}>
      <form onSubmit={patientForm.handleSubmit(onSubmit)} className="space-y-6">
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
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" className="gap-2">
            Continuar a admisión
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PatientForm;
