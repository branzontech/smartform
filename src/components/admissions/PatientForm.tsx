import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, MapPin, Phone, Settings } from "lucide-react";
import { nanoid } from "nanoid";
import { Patient } from "@/types/patient-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { FormCustomizer, CustomFieldRenderer } from "@/components/forms/form-customizer";
import { FormTemplate } from "@/components/forms/form-customizer/types";
import { 
  getFormTemplates, 
  saveFormTemplate, 
  getDefaultFormTemplate 
} from "@/utils/form-template-utils";

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
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [availableTemplates, setAvailableTemplates] = useState<FormTemplate[]>([]);

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

  useEffect(() => {
    setAvailableTemplates(getFormTemplates());
    const defaultTemplate = getDefaultFormTemplate();
    if (defaultTemplate) {
      setSelectedTemplate(defaultTemplate);
    }
  }, []);

  const handleTemplateSelect = (templateId: string) => {
    const template = availableTemplates.find(t => t.id === templateId);
    setSelectedTemplate(template || null);
    setCustomFieldValues({});
  };

  const handleCustomFieldChange = (fieldId: string, value: any) => {
    setCustomFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSaveTemplate = (template: FormTemplate) => {
    saveFormTemplate(template);
    setAvailableTemplates(getFormTemplates());
    setSelectedTemplate(template);
    setShowCustomizer(false);
    toast({
      title: "Plantilla guardada",
      description: "La plantilla se ha guardado correctamente",
    });
  };

  const handleFormSubmit = (data: PatientFormValues) => {
    const submissionData = {
      ...data,
      customFields: selectedTemplate ? {
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        sectionName: selectedTemplate.sectionName,
        values: customFieldValues
      } : undefined
    };
    
    onSubmit(submissionData);
  };

  if (showCustomizer) {
    return (
      <FormCustomizer
        templateName="Plantilla de Admisión"
        onSave={handleSaveTemplate}
        onCancel={() => setShowCustomizer(false)}
        maxFields={10}
      />
    );
  }

  return (
    <Form {...patientForm}>
      <form onSubmit={patientForm.handleSubmit(handleFormSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Información Básica</TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Campos Personalizados
              {selectedTemplate && (
                <Badge variant="secondary" className="ml-1">
                  {selectedTemplate.fields.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
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

            {/* Mostrar campos personalizados completados */}
            {selectedTemplate && Object.keys(customFieldValues).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      {selectedTemplate.sectionName}
                    </Badge>
                    <span className="text-base font-medium">Información Completada</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {selectedTemplate.fields
                      .filter(field => customFieldValues[field.id] !== undefined && customFieldValues[field.id] !== "")
                      .map((field) => (
                        <div key={field.id} className="relative">
                          <div className="flex items-start gap-3">
                            <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/30 to-primary/10 rounded-full"></div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-foreground">{field.label}</span>
                                <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
                                  Personalizado
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-md border">
                                {Array.isArray(customFieldValues[field.id]) 
                                  ? customFieldValues[field.id].join(", ")
                                  : customFieldValues[field.id]?.toString() || "Sin especificar"
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Campos Personalizados
                    </CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedTemplate?.id || ""} onValueChange={handleTemplateSelect}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Seleccionar plantilla" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center gap-2">
                              {template.name}
                              {template.isDefault && (
                                <Badge variant="outline" className="text-xs">
                                  Predeterminada
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCustomizer(true)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {selectedTemplate && (
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      {selectedTemplate.sectionName}
                    </Badge>
                    <span>•</span>
                    <span>{selectedTemplate.fields.length} campos</span>
                  </div>
                  
                  <div className="grid gap-4">
                    {selectedTemplate.fields.map((field) => (
                      <CustomFieldRenderer
                        key={field.id}
                        field={field}
                        value={customFieldValues[field.id]}
                        onChange={(value) => handleCustomFieldChange(field.id, value)}
                      />
                    ))}
                  </div>
                </CardContent>
              )}
              
              {!selectedTemplate && (
                <CardContent>
                  <div className="text-center py-8">
                    <Settings className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No hay plantillas disponibles</h3>
                    <p className="text-muted-foreground">
                      Crea una plantilla personalizada para comenzar
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4"
                      onClick={() => setShowCustomizer(true)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Crear Plantilla
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>
        </Tabs>

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