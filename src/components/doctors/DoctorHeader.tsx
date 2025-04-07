
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Mail, Phone, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Doctor } from "@/types/patient-types";

interface DoctorHeaderProps {
  doctor: Doctor;
}

const DoctorHeader = ({ doctor }: DoctorHeaderProps) => {
  const navigate = useNavigate();

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/app/medicos/editar/${doctor.id}`);
  };

  const renderStatusBadge = (status: Doctor["status"]) => {
    switch (status) {
      case "Activo":
        return <Badge className="bg-green-500">Activo</Badge>;
      case "Inactivo":
        return <Badge variant="destructive">Inactivo</Badge>;
      case "Vacaciones":
        return <Badge className="bg-amber-500">Vacaciones</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full overflow-hidden bg-[#F9F8FF] dark:bg-gray-800 border-purple-100">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            {doctor.profileImage ? (
              <img 
                src={doctor.profileImage} 
                alt={doctor.name} 
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-3xl font-bold border-4 border-white shadow-lg">
                {doctor.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1">{doctor.name}</h1>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg text-purple-600">{doctor.specialty}</span>
                  {renderStatusBadge(doctor.status)}
                </div>
                
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-500" />
                    {doctor.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-500" />
                    {doctor.contactNumber}
                  </p>
                  <p className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-500" />
                    Desde {new Date(doctor.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="flex gap-1" 
                onClick={handleEdit}
              >
                <Edit size={16} />
                Editar
              </Button>
            </div>
            
            {doctor.bio && (
              <div className="mt-4 border-t pt-4 border-gray-200 dark:border-gray-700">
                <h3 className="font-medium mb-1">Acerca de</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{doctor.bio}</p>
              </div>
            )}
            
            {doctor.specialties && doctor.specialties.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {doctor.specialties.map((specialty, index) => (
                  <Badge key={index} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    {specialty}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DoctorHeader;
