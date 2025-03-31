
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
import { FileCheck, ArrowRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

// Definir el esquema de validación
const formSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  edad: z.string().min(1, { message: "La edad es requerida" }),
  motivo: z.string().min(5, { message: "El motivo de evaluación debe tener al menos 5 caracteres" }),
  tipoEvaluacion: z.string().min(1, { message: "El tipo de evaluación es requerido" }),
  pruebasSeleccionadas: z.array(z.string()).min(1, { message: "Selecciona al menos una prueba" }),
  observaciones: z.string().optional(),
});

export type PacienteEvaluacionInfo = z.infer<typeof formSchema>;

interface EvaluacionesFormProps {
  onSubmit: (data: PacienteEvaluacionInfo) => void;
  isLoading: boolean;
}

const pruebasPsicologicas = [
  { id: "beck", label: "Inventario de Depresión de Beck (BDI-II)" },
  { id: "stai", label: "Inventario de Ansiedad Estado-Rasgo (STAI)" },
  { id: "wais", label: "Escala Wechsler de Inteligencia para Adultos (WAIS-IV)" },
  { id: "wisc", label: "Escala Wechsler de Inteligencia para Niños (WISC-V)" },
  { id: "mmpi", label: "Inventario Multifásico de Personalidad de Minnesota (MMPI-2)" },
  { id: "scl90r", label: "Listado de Síntomas SCL-90-R" },
  { id: "16pf", label: "Cuestionario 16PF" },
  { id: "bai", label: "Inventario de Ansiedad de Beck (BAI)" },
  { id: "scid", label: "Entrevista Clínica Estructurada para el DSM-5 (SCID-5)" },
  { id: "mcmi", label: "Inventario Clínico Multiaxial de Millon (MCMI-IV)" },
  { id: "rorschach", label: "Test de Rorschach" },
];

export function EvaluacionesForm({ onSubmit, isLoading }: EvaluacionesFormProps) {
  const form = useForm<PacienteEvaluacionInfo>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      edad: "",
      motivo: "",
      tipoEvaluacion: "Evaluación Psicológica General",
      pruebasSeleccionadas: [],
      observaciones: "",
    },
  });

  return (
    <Card className="border-purple-200 dark:border-purple-800">
      <CardHeader className="bg-purple-50 dark:bg-purple-900/30 border-b border-purple-100 dark:border-purple-800">
        <CardTitle className="flex items-center gap-2 text-xl text-purple-800 dark:text-purple-300">
          <FileCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          Datos de Evaluación
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
                  <FormLabel>Motivo de evaluación</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe brevemente el motivo de la evaluación psicológica" 
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
              name="tipoEvaluacion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de evaluación</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo de evaluación" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Evaluación Psicológica General">Evaluación Psicológica General</SelectItem>
                      <SelectItem value="Evaluación Neuropsicológica">Evaluación Neuropsicológica</SelectItem>
                      <SelectItem value="Evaluación de Personalidad">Evaluación de Personalidad</SelectItem>
                      <SelectItem value="Evaluación Infantil">Evaluación Infantil</SelectItem>
                      <SelectItem value="Evaluación Forense">Evaluación Forense</SelectItem>
                      <SelectItem value="Evaluación Laboral">Evaluación Laboral</SelectItem>
                      <SelectItem value="Evaluación Clínica">Evaluación Clínica</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pruebasSeleccionadas"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Pruebas psicológicas a aplicar</FormLabel>
                    <FormDescription>
                      Selecciona las pruebas que serán aplicadas durante la evaluación
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {pruebasPsicologicas.map((prueba) => (
                      <FormField
                        key={prueba.id}
                        control={form.control}
                        name="pruebasSeleccionadas"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={prueba.id}
                              className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(prueba.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, prueba.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== prueba.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {prueba.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones adicionales (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Notas adicionales o especificaciones sobre la evaluación" 
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
              {isLoading ? "Procesando..." : "Generar protocolo de evaluación"}
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
