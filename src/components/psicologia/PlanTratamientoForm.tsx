
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain } from "lucide-react";

// Definir el esquema de validación
const formSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  edad: z.string().min(1, { message: "La edad es requerida" }),
  motivo: z.string().min(5, { message: "El motivo de consulta debe tener al menos 5 caracteres" }),
  diagnostico: z.string().min(2, { message: "El diagnóstico es requerido" }),
  antecedentes: z.string().optional(),
  duracion: z.string().min(1, { message: "La duración del tratamiento es requerida" }),
  enfoque: z.string().min(1, { message: "El enfoque terapéutico es requerido" }),
  objetivos: z.string().min(5, { message: "Los objetivos deben tener al menos 5 caracteres" }),
});

export type PacienteTratamientoInfo = z.infer<typeof formSchema>;

interface PlanTratamientoFormProps {
  onSubmit: (data: PacienteTratamientoInfo) => void;
  isLoading: boolean;
}

export function PlanTratamientoForm({ onSubmit, isLoading }: PlanTratamientoFormProps) {
  const form = useForm<PacienteTratamientoInfo>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      edad: "",
      motivo: "",
      diagnostico: "",
      antecedentes: "",
      duracion: "3 meses",
      enfoque: "Cognitivo-Conductual",
      objetivos: "",
    },
  });

  return (
    <Card className="border-purple-200 dark:border-purple-800">
      <CardHeader className="bg-purple-50 dark:bg-purple-900/30 border-b border-purple-100 dark:border-purple-800">
        <CardTitle className="flex items-center gap-2 text-xl text-purple-800 dark:text-purple-300">
          <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          Datos del Paciente
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del paciente</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="edad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Edad</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. 35" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo de consulta</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe brevemente el motivo por el cual el paciente busca atención psicológica" 
                      {...field} 
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="diagnostico"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnóstico inicial</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Trastorno de ansiedad generalizada" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="antecedentes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Antecedentes relevantes (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Información sobre tratamientos previos, historial familiar, etc." 
                      {...field} 
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duracion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duración estimada del tratamiento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona la duración" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1 mes">1 mes</SelectItem>
                        <SelectItem value="3 meses">3 meses</SelectItem>
                        <SelectItem value="6 meses">6 meses</SelectItem>
                        <SelectItem value="12 meses">12 meses</SelectItem>
                        <SelectItem value="A determinar">A determinar</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="enfoque"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enfoque terapéutico</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el enfoque" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Cognitivo-Conductual">Cognitivo-Conductual</SelectItem>
                        <SelectItem value="Psicodinámico">Psicodinámico</SelectItem>
                        <SelectItem value="Humanista">Humanista</SelectItem>
                        <SelectItem value="Sistémico">Sistémico</SelectItem>
                        <SelectItem value="Integrativo">Integrativo</SelectItem>
                        <SelectItem value="EMDR">EMDR</SelectItem>
                        <SelectItem value="Mindfulness">Mindfulness</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="objetivos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objetivos del tratamiento</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe los objetivos que se buscan alcanzar con el tratamiento" 
                      {...field} 
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={isLoading}
            >
              {isLoading ? "Generando plan..." : "Generar plan de tratamiento"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
