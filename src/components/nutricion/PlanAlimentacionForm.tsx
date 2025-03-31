
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  edad: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "La edad debe ser un número positivo",
  }),
  genero: z.enum(["masculino", "femenino", "otro"]),
  peso: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "El peso debe ser un número positivo",
  }),
  altura: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "La altura debe ser un número positivo",
  }),
  nivelActividad: z.enum(["sedentario", "ligero", "moderado", "activo", "muy activo"]),
  objetivos: z.string().min(5, { message: "Por favor describe tus objetivos" }),
  condicionesMedicas: z.string().optional(),
  restriccionesDieteticas: z.string().optional(),
  alergias: z.string().optional(),
  preferenciasAlimentarias: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PlanAlimentacionFormProps {
  onSubmit: (data: FormValues) => Promise<void>;
  isLoading: boolean;
}

export function PlanAlimentacionForm({ onSubmit, isLoading }: PlanAlimentacionFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      edad: "",
      genero: "masculino",
      peso: "",
      altura: "",
      nivelActividad: "moderado",
      objetivos: "",
      condicionesMedicas: "",
      restriccionesDieteticas: "",
      alergias: "",
      preferenciasAlimentarias: "",
    },
  });

  const handleSubmit = async (data: FormValues) => {
    await onSubmit(data);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Información para el Plan de Alimentación
      </h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del paciente" {...field} />
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
                    <Input placeholder="Edad en años" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="genero"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Género</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el género" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="femenino">Femenino</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="peso"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Peso (kg)</FormLabel>
                  <FormControl>
                    <Input placeholder="Peso en kilogramos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="altura"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Altura (cm)</FormLabel>
                  <FormControl>
                    <Input placeholder="Altura en centímetros" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nivelActividad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nivel de Actividad Física</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el nivel de actividad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentario">Sedentario</SelectItem>
                        <SelectItem value="ligero">Ligero</SelectItem>
                        <SelectItem value="moderado">Moderado</SelectItem>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="muy activo">Muy Activo</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
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
                <FormLabel>Objetivos Nutricionales</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe tus objetivos (ej. pérdida de peso, ganancia muscular, mejor salud)"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="condicionesMedicas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condiciones Médicas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Diabetes, hipertensión, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="restriccionesDieteticas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Restricciones Dietéticas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Vegetariano, vegano, sin gluten, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="alergias"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alergias Alimentarias (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Maní, lactosa, mariscos, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferenciasAlimentarias"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferencias Alimentarias (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Alimentos favoritos, comidas preferidas, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando plan...
              </>
            ) : (
              "Generar Plan de Alimentación"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
