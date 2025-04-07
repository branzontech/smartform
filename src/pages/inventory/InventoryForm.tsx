
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { BackButton } from "@/App";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  addInventoryItem, 
  getInventoryItemById, 
  updateInventoryItem 
} from "@/utils/inventory-utils";
import { InventoryItem, InventoryItemFormValues, InventoryCategory, InventoryStatus } from "@/types/inventory-types";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const inventorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  category: z.string() as z.ZodType<InventoryCategory>,
  quantity: z.coerce.number().min(0, "La cantidad no puede ser negativa"),
  unit: z.string().min(1, "La unidad es requerida"),
  location: z.string().optional(),
  purchasePrice: z.coerce.number().min(0).optional(),
  salePrice: z.coerce.number().min(0).optional(),
  expirationDate: z.string().optional(),
  supplier: z.string().optional(),
  status: z.string() as z.ZodType<InventoryStatus>,
  minimumStock: z.coerce.number().min(0).optional(),
  image: z.string().optional(),
  barcode: z.string().optional(),
  notes: z.string().optional(),
});

const categories: InventoryCategory[] = [
  "Medicamentos",
  "Insumos médicos",
  "Equipos médicos",
  "Material quirúrgico",
  "Papelería",
  "Mobiliario",
  "Limpieza",
  "Otros"
];

const statuses: InventoryStatus[] = [
  "Disponible",
  "Agotado",
  "Próximo a agotarse",
  "Vencido",
  "En cuarentena"
];

const InventoryForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = Boolean(id);
  
  const form = useForm<InventoryItemFormValues>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      name: "",
      description: "",
      category: "Medicamentos",
      quantity: 0,
      unit: "Unidades",
      location: "",
      purchasePrice: 0,
      salePrice: 0,
      expirationDate: "",
      supplier: "",
      status: "Disponible",
      minimumStock: 0,
      image: "",
      barcode: "",
      notes: "",
    },
  });
  
  useEffect(() => {
    if (isEditing && id) {
      const item = getInventoryItemById(id);
      if (item) {
        // Convertir fechas a formato de string para inputs
        const formattedItem = {
          ...item,
          expirationDate: item.expirationDate || "",
        };
        
        // Eliminar propiedades que no están en el formulario
        const { id: _, lastUpdated: __, ...formValues } = formattedItem;
        
        form.reset(formValues as InventoryItemFormValues);
      } else {
        toast({
          title: "Error",
          description: "No se encontró el artículo",
          variant: "destructive",
        });
        navigate("/app/inventario/articulos");
      }
    }
  }, [id, isEditing, form, navigate]);
  
  const onSubmit = (data: InventoryItemFormValues) => {
    setIsLoading(true);
    
    try {
      if (isEditing && id) {
        updateInventoryItem(id, data);
        toast({
          title: "Artículo actualizado",
          description: "El artículo ha sido actualizado correctamente.",
        });
      } else {
        addInventoryItem(data);
        toast({
          title: "Artículo agregado",
          description: "El artículo ha sido agregado correctamente.",
        });
      }
      
      navigate("/app/inventario/articulos");
    } catch (error) {
      console.error("Error al guardar artículo:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar el artículo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Layout>
      <div className="container max-w-3xl mx-auto py-8 px-4 sm:px-6">
        <BackButton />
        
        <h1 className="text-2xl font-bold mb-6">
          {isEditing ? "Editar Artículo" : "Nuevo Artículo"}
        </h1>
        
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Editar artículo" : "Crear nuevo artículo"}</CardTitle>
            <CardDescription>
              Complete el formulario para {isEditing ? "actualizar" : "agregar"} un artículo al inventario.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Información básica */}
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="text-lg font-medium">Información básica</h3>
                    
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre del artículo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descripción del artículo"
                              className="resize-none"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoría</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione una categoría" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Existencias */}
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="text-lg font-medium">Existencias</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cantidad</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unidad</FormLabel>
                            <FormControl>
                              <Input placeholder="Unidad de medida" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ubicación</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ubicación física del artículo"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione un estado" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {statuses.map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {status}
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
                        name="minimumStock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock mínimo</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  {/* Información comercial */}
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="text-lg font-medium">Información comercial</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="purchasePrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Precio de compra</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="salePrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Precio de venta</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                {...field}
                                value={field.value || ""}
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
                        name="supplier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Proveedor</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Nombre del proveedor"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="expirationDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha de vencimiento</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  {/* Información adicional */}
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="text-lg font-medium">Información adicional</h3>
                    
                    <FormField
                      control={form.control}
                      name="barcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código de barras</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Código de barras"
                              {...field}
                              value={field.value || ""}
                            />
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
                          <FormLabel>Notas</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Notas adicionales"
                              className="resize-none"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <CardFooter className="flex justify-end gap-3 px-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/app/inventario/articulos")}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Guardando..." : isEditing ? "Actualizar artículo" : "Crear artículo"}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default InventoryForm;
