
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin,
  Heart,
  AlertTriangle,
  Edit,
  Save,
  X,
  Shield,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Datos de ejemplo
const mockPersonalData = {
  fullName: "María Elena García López",
  documentId: "12345678-9",
  email: "maria.garcia@email.com",
  phone: "+56 9 8765 4321",
  dateOfBirth: "1985-03-15",
  gender: "Femenino" as const,
  address: "Av. Principal 123, Depto. 4B, Santiago, Chile",
  emergencyContact: {
    name: "Carlos García",
    phone: "+56 9 1234 5678",
    relationship: "Esposo"
  },
  bloodType: "O+",
  allergies: ["Penicilina", "Mariscos"],
  chronicConditions: ["Hipertensión arterial"]
};

export const PersonalDataSection = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(mockPersonalData);

  const handleEdit = () => {
    setIsEditing(true);
    setEditData(mockPersonalData);
  };

  const handleSave = () => {
    // Aquí iría la lógica para guardar los datos
    console.log("Guardando datos:", editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(mockPersonalData);
    setIsEditing(false);
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mis Datos Personales
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Información personal y de contacto
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={handleEdit} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Editar Datos
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Guardar
            </Button>
            <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="fullName">Nombre Completo</Label>
                {isEditing ? (
                  <Input
                    id="fullName"
                    value={editData.fullName}
                    onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-lg font-medium text-gray-900 dark:text-white mt-1">
                    {mockPersonalData.fullName}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="documentId">Documento de Identidad</Label>
                {isEditing ? (
                  <Input
                    id="documentId"
                    value={editData.documentId}
                    onChange={(e) => setEditData({...editData, documentId: e.target.value})}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-gray-700 dark:text-gray-300 mt-1">
                    {mockPersonalData.documentId}
                  </p>
                )}
              </div>

              <div>
                <Label>Fecha de Nacimiento</Label>
                <div className="flex items-center gap-3 mt-1">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {format(new Date(mockPersonalData.dateOfBirth), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {calculateAge(mockPersonalData.dateOfBirth)} años
                  </Badge>
                </div>
              </div>

              <div>
                <Label>Género</Label>
                <p className="text-gray-700 dark:text-gray-300 mt-1">
                  {mockPersonalData.gender}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información de Contacto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-600" />
              Información de Contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Correo Electrónico</Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({...editData, email: e.target.value})}
                  className="mt-1"
                />
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {mockPersonalData.email}
                  </span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Teléfono</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={editData.phone}
                  onChange={(e) => setEditData({...editData, phone: e.target.value})}
                  className="mt-1"
                />
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {mockPersonalData.phone}
                  </span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="address">Dirección</Label>
              {isEditing ? (
                <Input
                  id="address"
                  value={editData.address}
                  onChange={(e) => setEditData({...editData, address: e.target.value})}
                  className="mt-1"
                />
              ) : (
                <div className="flex items-start gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {mockPersonalData.address}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contacto de Emergencia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              Contacto de Emergencia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <p className="text-gray-700 dark:text-gray-300 mt-1">
                {mockPersonalData.emergencyContact.name}
              </p>
            </div>
            <div>
              <Label>Teléfono</Label>
              <p className="text-gray-700 dark:text-gray-300 mt-1">
                {mockPersonalData.emergencyContact.phone}
              </p>
            </div>
            <div>
              <Label>Relación</Label>
              <p className="text-gray-700 dark:text-gray-300 mt-1">
                {mockPersonalData.emergencyContact.relationship}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Información Médica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-600" />
              Información Médica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Grupo Sanguíneo</Label>
              <div className="flex items-center gap-2 mt-1">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <Heart className="h-4 w-4 text-red-600" />
                </div>
                <span className="text-lg font-semibold text-red-700 dark:text-red-400">
                  {mockPersonalData.bloodType}
                </span>
              </div>
            </div>

            <div>
              <Label>Alergias</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {mockPersonalData.allergies.map((allergy, index) => (
                  <Badge key={index} variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {allergy}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Condiciones Crónicas</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {mockPersonalData.chronicConditions.map((condition, index) => (
                  <Badge key={index} variant="warning" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {condition}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aviso de privacidad */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Privacidad y Seguridad
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Tu información personal está protegida y encriptada. Solo tú y los profesionales médicos 
                autorizados pueden acceder a estos datos. Nunca compartimos tu información con terceros 
                sin tu consentimiento explícito.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
