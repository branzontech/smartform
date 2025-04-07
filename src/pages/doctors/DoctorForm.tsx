
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { BackButton } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Stethoscope, Save } from "lucide-react";
import { addDoctor } from "@/utils/doctor-utils";
import { Doctor } from "@/types/patient-types";
import { useToast } from "@/hooks/use-toast";

const DoctorForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [doctor, setDoctor] = useState<Omit<Doctor, "id" | "createdAt">>({
    name: "",
    specialty: "",
    documentId: "",
    licenseNumber: "",
    contactNumber: "",
    email: "",
    status: "Activo",
    specialties: [],
    schedule: {
      monday: { isWorking: true, startTime: "08:00", endTime: "16:00" },
      tuesday: { isWorking: true, startTime: "08:00", endTime: "16:00" },
      wednesday: { isWorking: true, startTime: "08:00", endTime: "16:00" },
      thursday: { isWorking: true, startTime: "08:00", endTime: "16:00" },
      friday: { isWorking: true, startTime: "08:00", endTime: "14:00" },
      saturday: { isWorking: false },
      sunday: { isWorking: false },
    }
  });
  
  const specialtiesList = [
    "Cardiología", 
    "Pediatría", 
    "Traumatología",
    "Ortopedia",
    "Medicina Interna",
    "Neurología",
    "Psiquiatría",
    "Ginecología",
    "Oftalmología",
    "Dermatología",
    "Otorrinolaringología",
    "Medicina General",
    "Nutrición",
    "Psicología",
    "Fisioterapia"
  ];
  
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [newSpecialty, setNewSpecialty] = useState("");
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDoctor((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleStatusChange = (newStatus: Doctor["status"]) => {
    setDoctor((prev) => ({ ...prev, status: newStatus }));
  };
  
  const handleSpecialtyChange = (value: string) => {
    setDoctor((prev) => ({ ...prev, specialty: value }));
    
    if (!selectedSpecialties.includes(value) && value !== "") {
      setSelectedSpecialties((prev) => [...prev, value]);
    }
  };
  
  const addSpecialty = () => {
    if (newSpecialty && !selectedSpecialties.includes(newSpecialty)) {
      setSelectedSpecialties((prev) => [...prev, newSpecialty]);
      setNewSpecialty("");
    }
  };
  
  const removeSpecialty = (specialty: string) => {
    setSelectedSpecialties((prev) => prev.filter((s) => s !== specialty));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const doctorData = {
        ...doctor,
        specialties: selectedSpecialties.length > 0 ? selectedSpecialties : [doctor.specialty]
      };
      
      await addDoctor(doctorData);
      
      toast({
        title: "Profesional creado",
        description: `${doctor.name} ha sido agregado exitosamente.`,
      });
      
      navigate("/app/medicos");
    } catch (error) {
      console.error("Error adding doctor:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el profesional. Intente nuevamente.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4">
        <BackButton />
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <Stethoscope className="mr-2 text-purple-500" />
            Nuevo Profesional
          </h1>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    name="name"
                    value={doctor.name}
                    onChange={handleChange}
                    placeholder="Dr. Juan Pérez"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="documentId">Documento de Identidad</Label>
                  <Input
                    id="documentId"
                    name="documentId"
                    value={doctor.documentId}
                    onChange={handleChange}
                    placeholder="12345678"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">Número de Licencia</Label>
                  <Input
                    id="licenseNumber"
                    name="licenseNumber"
                    value={doctor.licenseNumber}
                    onChange={handleChange}
                    placeholder="MED-12345"
                    required
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Información de Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={doctor.email}
                    onChange={handleChange}
                    placeholder="dr.perez@ejemplo.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Teléfono</Label>
                  <Input
                    id="contactNumber"
                    name="contactNumber"
                    value={doctor.contactNumber}
                    onChange={handleChange}
                    placeholder="555-123-4567"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    defaultValue={doctor.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Activo">Activo</SelectItem>
                      <SelectItem value="Inactivo">Inactivo</SelectItem>
                      <SelectItem value="Vacaciones">Vacaciones</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Especialidad y Perfil Profesional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="specialty">Especialidad Principal</Label>
                  <Select
                    defaultValue={doctor.specialty}
                    onValueChange={handleSpecialtyChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar especialidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialtiesList.map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Especialidades Adicionales</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedSpecialties.map((specialty) => (
                      <div 
                        key={specialty}
                        className="bg-purple-100 text-purple-800 px-2 py-1 rounded-md flex items-center text-sm"
                      >
                        <span>{specialty}</span>
                        <button 
                          type="button"
                          onClick={() => removeSpecialty(specialty)}
                          className="ml-2 text-purple-600 hover:text-purple-800"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      value={newSpecialty}
                      onChange={(e) => setNewSpecialty(e.target.value)}
                      placeholder="Nueva especialidad"
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={addSpecialty}
                    >
                      Agregar
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Biografía Profesional</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={doctor.bio || ""}
                    onChange={handleChange}
                    placeholder="Breve descripción del profesional, experiencia y áreas de interés."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              <Save className="mr-2" size={16} />
              Guardar Profesional
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default DoctorForm;
