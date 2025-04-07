import React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Office, OfficeFormValues, LocationStatus, Site } from '@/types/location-types';
import { getAllSites } from '@/utils/location-utils';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

// Esquema de validación con Zod
const officeSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres" }),
  number: z.string().min(1, { message: "El número es requerido" }),
  floor: z.number().min(1, { message: "El piso debe ser 1 o mayor" }),
  capacity: z.number().min(1, { message: "La capacidad debe ser 1 o mayor" }),
  area: z.number().min(1, { message: "El área debe ser 1 o mayor" }),
  status: z.enum(['Disponible', 'Ocupado', 'Mantenimiento', 'Reservado']),
  equipment: z.string().optional(),
  maxPatients: z.number().min(1, { message: "El número máximo de pacientes debe ser 1 o mayor" }),
  specialties: z.string().optional(),
  assignedDoctor: z.string().optional(),
  location: z.object({
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100)
  }),
  siteId: z.string().min(1, { message: "Debe seleccionar una sede" })
});

interface OfficeFormProps {
  initialData?: Office;
  onSubmit: (data: OfficeFormValues) => void;
  onCancel: () => void;
  siteId?: string;
}

export const OfficeForm = ({ initialData, onSubmit, onCancel, siteId }: OfficeFormProps) => {
  // Obtener las sedes para el selector
  const sites = getAllSites();
  
  // Configuración del formulario con react-hook-form y zod
  const form = useForm<OfficeFormValues>({
    resolver: zodResolver(officeSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      number: initialData.number,
      floor: initialData.floor,
      capacity: initialData.capacity,
      area: initialData.area,
      status: initialData.status,
      equipment: initialData.equipment?.join(', ') || '',
      maxPatients: initialData.maxPatients,
      specialties: initialData.specialties?.join(', ') || '',
      assignedDoctor: initialData.assignedDoctor || '',
      location: initialData.location || { x: 50, y: 50 },
      siteId: initialData.siteId
    } : {
      name: "",
      number: "",
      floor: 1,
      capacity: 4,
      area: 20,
      status: "Disponible" as LocationStatus,
      equipment: "",
      maxPatients: 15,
      specialties: "",
      assignedDoctor: "",
      location: { x: 50, y: 50 },
      siteId: siteId || ""
    }
  });
  
  const handleSubmit = (data: any) => {
    // Procesar los datos de arrays que vienen como strings
    const formattedData: OfficeFormValues = {
      ...data,
      equipment: data.equipment && typeof data.equipment === 'string' ? data.equipment.split(',').map((item: string) => item.trim()) : [],
      specialties: data.specialties && typeof data.specialties === 'string' ? data.specialties.split(',').map((item: string) => item.trim()) : []
    };
    
    onSubmit(formattedData);
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
                <FormLabel>Nombre del consultorio</FormLabel>
                <FormControl>
                  <Input placeholder="Consultorio de cardiología" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de consultorio</FormLabel>
                <FormControl>
                  <Input placeholder="101" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="floor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Piso</FormLabel>
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
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacidad (personas)</FormLabel>
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
            name="area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Área (m²)</FormLabel>
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Disponible">Disponible</SelectItem>
                    <SelectItem value="Ocupado">Ocupado</SelectItem>
                    <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="Reservado">Reservado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="maxPatients"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacidad máxima de pacientes</FormLabel>
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
            name="assignedDoctor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Doctor asignado</FormLabel>
                <FormControl>
                  <Input placeholder="Dr. Juan Pérez" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="specialties"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Especialidades</FormLabel>
                <FormControl>
                  <Input placeholder="Cardiología, Medicina interna" {...field} />
                </FormControl>
                <FormDescription>Separe las especialidades con comas</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="equipment"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Equipamiento</FormLabel>
                <FormControl>
                  <Input placeholder="Camilla, Escritorio, Electrocardiograma" {...field} />
                </FormControl>
                <FormDescription>Separe los equipos con comas</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="siteId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sede</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!siteId}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar sede" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="col-span-2 space-y-4">
            <FormLabel>Posición en el plano</FormLabel>
            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="location.x"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Posición X (horizontal)</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Slider
                          min={0}
                          max={100}
                          step={1}
                          value={[field.value]}
                          onValueChange={([value]) => field.onChange(value)}
                        />
                        <div className="text-right font-mono text-sm">{field.value}%</div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location.y"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Posición Y (vertical)</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Slider
                          min={0}
                          max={100}
                          step={1}
                          value={[field.value]}
                          onValueChange={([value]) => field.onChange(value)}
                        />
                        <div className="text-right font-mono text-sm">{field.value}%</div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {initialData ? 'Actualizar consultorio' : 'Crear consultorio'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
