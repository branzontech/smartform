import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { BackButton } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, Users } from "lucide-react";
import { getAllDoctors } from "@/utils/doctor-utils";
import { Doctor } from "@/types/patient-types";
import { EmptyState } from "@/components/ui/empty-state";

const DoctorList = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("Todas");
  
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const doctorsData = await getAllDoctors();
        setDoctors(doctorsData);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDoctors();
  }, []);
  
  const handleViewDoctor = (id: string) => {
    navigate(`/app/medicos/${id}`);
  };
  
  const handleAddDoctor = () => {
    navigate("/app/medicos/nuevo");
  };
  
  const allSpecialties = ["Todas", ...new Set(doctors.flatMap(doctor => doctor.specialties || [doctor.specialty]))];
  
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = specialtyFilter === "Todas" || 
                           doctor.specialty === specialtyFilter || 
                           doctor.specialties?.includes(specialtyFilter);
    
    return matchesSearch && matchesSpecialty;
  });
  
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
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 container mx-auto py-8 px-4">
          <BackButton />
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4">
        <BackButton />
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <Users className="mr-2 text-purple-500" />
            Médicos y Profesionales
          </h1>
          <Button 
            onClick={handleAddDoctor}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="mr-2" size={16} />
            Nuevo Profesional
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar médico o especialidad"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center">
            <Filter size={16} className="mr-2 text-gray-500" />
            <select
              className="rounded-md border border-input px-3 py-2 bg-background"
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
            >
              {allSpecialties.map((specialty) => (
                <option key={specialty} value={specialty}>
                  {specialty}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {filteredDoctors.length === 0 ? (
          <EmptyState
            title="No hay médicos para mostrar"
            description="No se encontraron médicos que coincidan con los criterios de búsqueda."
            icon={<Users size={48} className="text-gray-300" />}
            buttonText="Nuevo Profesional"
            onClick={handleAddDoctor}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor) => (
              <Card 
                key={doctor.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleViewDoctor(doctor.id)}
              >
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl font-medium">{doctor.name}</CardTitle>
                  {renderStatusBadge(doctor.status)}
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xl font-bold">
                      {doctor.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-600">{doctor.specialty}</p>
                      <p className="text-sm text-gray-500 mt-1">Lic. {doctor.licenseNumber}</p>
                      <p className="text-sm text-gray-500 mt-1">{doctor.email}</p>
                      <p className="text-sm text-gray-500 mt-1">{doctor.contactNumber}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DoctorList;
