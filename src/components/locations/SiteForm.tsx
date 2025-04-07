
import React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Site, SiteFormValues } from '@/types/location-types';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Esquema de validación con Zod
const siteSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres" }),
  address: z.string().min(5, { message: "La dirección debe tener al menos 5 caracteres" }),
  city: z.string().min(2, { message: "La ciudad es requerida" }),
  postalCode: z.string().optional(),
  phone: z.string().min(7, { message: "El teléfono debe tener al menos 7 caracteres" }),
  email: z.string().email({ message: "Email inválido" }).optional().or(z.literal('')),
  openingHours: z.string().optional(),
  floors: z.number().min(1, { message: "Debe tener al menos 1 piso" }),
  image: z.string().url({ message: "URL de imagen inválida" }).optional().or(z.literal('')),
  coordinates: z.object({
    lat: z.number().optional(),
    lng: z.number().optional()
  }).optional()
});

interface SiteFormProps {
  initialData?: Site;
  onSubmit: (data: SiteFormValues) => void;
  onCancel: () => void;
}

export const SiteForm = ({ initialData, onSubmit, onCancel }: SiteFormProps) => {
  // Configuración del formulario con react-hook-form y zod
  const form = useForm<SiteFormValues>({
    resolver: zodResolver(siteSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      address: initialData.address,
      city: initialData.city,
      postalCode: initialData.postalCode || "",
      phone: initialData.phone,
      email: initialData.email || "",
      openingHours: initialData.openingHours || "",
      floors: initialData.floors,
      image: initialData.image || "",
      coordinates: initialData.coordinates || { lat: 0, lng: 0 }
    } : {
      name: "",
      address: "",
      city: "",
      postalCode: "",
      phone: "",
      email: "",
      openingHours: "",
      floors: 1,
      image: "",
      coordinates: { lat: 0, lng: 0 }
    }
  });
  
  const handleSubmit = (data: SiteFormValues) => {
    onSubmit(data);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de la sede</FormLabel>
                <FormControl>
                  <Input placeholder="Centro médico principal" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input placeholder="+52 123 456 7890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input placeholder="Av. Principal #123" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciudad</FormLabel>
                <FormControl>
                  <Input placeholder="Ciudad de México" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="postalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código postal</FormLabel>
                <FormControl>
                  <Input placeholder="12345" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="contacto@sede.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="floors"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de pisos</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={1} 
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value))} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="openingHours"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Horario de atención</FormLabel>
                <FormControl>
                  <Input placeholder="Lun-Vie: 8:00-20:00, Sáb: 9:00-14:00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>URL de imagen</FormLabel>
                <FormControl>
                  <Input placeholder="https://ejemplo.com/imagen.jpg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {initialData ? 'Actualizar sede' : 'Crear sede'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
