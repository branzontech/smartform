
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PacienteInfo } from "@/services/anthropic";

interface PlanAlimentacionFormProps {
  onSubmit: (data: PacienteInfo) => Promise<void>;
  isLoading: boolean;
}

export function PlanAlimentacionForm({ onSubmit, isLoading }: PlanAlimentacionFormProps) {
  const [formData, setFormData] = useState<PacienteInfo>({
    nombre: "",
    edad: "",
    genero: undefined,
    peso: "",
    altura: "",
    nivelActividad: undefined,
    objetivos: [],
    restricciones: [],
    condicionesMedicas: [],
    alergiasAlimentarias: [],
    preferenciasAlimentarias: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string, name: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean, value: string, arrayName: keyof PacienteInfo) => {
    if (!Array.isArray(formData[arrayName])) return;
    
    setFormData(prev => {
      const currentArray = [...(prev[arrayName] as string[])];
      if (checked) {
        return { ...prev, [arrayName]: [...currentArray, value] };
      } else {
        return { ...prev, [arrayName]: currentArray.filter(item => item !== value) };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const objetivosOptions = [
    { id: "perdida-peso", label: "Pérdida de peso" },
    { id: "aumento-masa", label: "Aumento de masa muscular" },
    { id: "mantenimiento", label: "Mantenimiento de peso" },
    { id: "rendimiento", label: "Mejora de rendimiento deportivo" },
    { id: "salud-general", label: "Mejora de salud general" },
  ];

  const restriccionesOptions = [
    { id: "gluten", label: "Sin gluten" },
    { id: "lactosa", label: "Sin lactosa" },
    { id: "vegetariano", label: "Vegetariano" },
    { id: "vegano", label: "Vegano" },
    { id: "frutos-secos", label: "Sin frutos secos" },
  ];

  const condicionesOptions = [
    { id: "diabetes", label: "Diabetes" },
    { id: "hipertension", label: "Hipertensión" },
    { id: "colesterol", label: "Colesterol alto" },
    { id: "celiaquia", label: "Enfermedad celíaca" },
    { id: "tiroides", label: "Problemas de tiroides" },
  ];

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader className="bg-purple-50 dark:bg-purple-900/30 border-b border-purple-100 dark:border-purple-800">
          <CardTitle className="text-xl text-purple-700 dark:text-purple-400">Datos del Paciente</CardTitle>
          <CardDescription>
            Ingresa la información del paciente para generar un plan de alimentación personalizado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre completo</Label>
              <Input
                id="nombre"
                name="nombre"
                placeholder="Ej. Juan Pérez"
                value={formData.nombre}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edad">Edad</Label>
              <Input
                id="edad"
                name="edad"
                type="number"
                placeholder="Ej. 35"
                value={formData.edad}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="genero">Género</Label>
              <Select
                value={formData.genero}
                onValueChange={(value) => handleSelectChange(value, "genero")}
              >
                <SelectTrigger id="genero">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="femenino">Femenino</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="peso">Peso (kg)</Label>
              <Input
                id="peso"
                name="peso"
                type="number"
                step="0.1"
                placeholder="Ej. 70.5"
                value={formData.peso}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="altura">Altura (cm)</Label>
              <Input
                id="altura"
                name="altura"
                type="number"
                placeholder="Ej. 175"
                value={formData.altura}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nivelActividad">Nivel de actividad física</Label>
            <Select
              value={formData.nivelActividad}
              onValueChange={(value) => handleSelectChange(value, "nivelActividad")}
            >
              <SelectTrigger id="nivelActividad">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentario">Sedentario (poco o nada de ejercicio)</SelectItem>
                <SelectItem value="ligero">Ligeramente activo (ejercicio 1-3 días/semana)</SelectItem>
                <SelectItem value="moderado">Moderadamente activo (ejercicio 3-5 días/semana)</SelectItem>
                <SelectItem value="activo">Activo (ejercicio 6-7 días/semana)</SelectItem>
                <SelectItem value="muy activo">Muy activo (ejercicio intenso diario o físicamente exigente)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Objetivos</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {objetivosOptions.map(objetivo => (
                <div key={objetivo.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={objetivo.id} 
                    checked={formData.objetivos?.includes(objetivo.label)}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange(checked as boolean, objetivo.label, "objetivos")}
                  />
                  <Label htmlFor={objetivo.id} className="font-normal">
                    {objetivo.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Restricciones alimentarias</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {restriccionesOptions.map(restriccion => (
                <div key={restriccion.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={restriccion.id} 
                    checked={formData.restricciones?.includes(restriccion.label)}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange(checked as boolean, restriccion.label, "restricciones")}
                  />
                  <Label htmlFor={restriccion.id} className="font-normal">
                    {restriccion.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Condiciones médicas</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {condicionesOptions.map(condicion => (
                <div key={condicion.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={condicion.id} 
                    checked={formData.condicionesMedicas?.includes(condicion.label)}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange(checked as boolean, condicion.label, "condicionesMedicas")}
                  />
                  <Label htmlFor={condicion.id} className="font-normal">
                    {condicion.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alergiasAlimentarias">Alergias alimentarias</Label>
            <Textarea
              id="alergiasAlimentarias"
              name="alergiasAlimentarias"
              placeholder="Ingresa las alergias alimentarias separadas por comas"
              value={formData.alergiasAlimentarias?.join(", ") || ""}
              onChange={(e) => {
                const alergias = e.target.value.split(",").map(item => item.trim()).filter(Boolean);
                setFormData(prev => ({ ...prev, alergiasAlimentarias: alergias }));
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferenciasAlimentarias">Preferencias alimentarias</Label>
            <Textarea
              id="preferenciasAlimentarias"
              name="preferenciasAlimentarias"
              placeholder="Describe las preferencias alimentarias del paciente"
              value={formData.preferenciasAlimentarias || ""}
              onChange={handleInputChange}
            />
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
          <Button type="submit" className="ml-auto bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
            {isLoading ? "Generando plan..." : "Generar plan de alimentación"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
