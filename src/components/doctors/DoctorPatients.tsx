
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, UserPlus, User, Calendar, ArrowRight } from "lucide-react";
import { Patient } from "@/types/patient-types";
import { getDoctorPatients } from "@/utils/doctor-utils";

interface DoctorPatientsProps {
  doctorId: string;
}

const DoctorPatients = ({ doctorId }: DoctorPatientsProps) => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<'table' | 'card'>('table');
  
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await getDoctorPatients(doctorId);
        setPatients(data);
      } catch (error) {
        console.error("Error fetching patients:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPatients();
  }, [doctorId]);
  
  const handleViewPatient = (patientId: string) => {
    navigate(`/app/pacientes/${patientId}`);
  };
  
  const handleNewPatient = () => {
    navigate(`/app/admisiones?doctorId=${doctorId}`);
  };
  
  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.documentId.includes(searchTerm)
  );
  
  const calculateAge = (dob: string) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  
  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-full max-w-md bg-gray-200 dark:bg-gray-800 rounded"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded"></div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <User className="mr-2 text-purple-500" size={20} />
          Pacientes asignados
        </h2>
        <Button 
          onClick={handleNewPatient}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <UserPlus className="mr-2" size={16} />
          Asignar paciente
        </Button>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre o documento"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-md shadow-sm">
          <Button 
            variant={view === 'table' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setView('table')}
            className="rounded-l-md rounded-r-none"
          >
            Tabla
          </Button>
          <Button 
            variant={view === 'card' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setView('card')}
            className="rounded-r-md rounded-l-none"
          >
            Tarjetas
          </Button>
        </div>
      </div>
      
      {filteredPatients.length === 0 ? (
        <div className="text-center py-12">
          <User size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay pacientes asignados</h3>
          <p className="text-gray-500 mb-6">Este profesional aún no tiene pacientes asignados.</p>
          <Button 
            onClick={handleNewPatient}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <UserPlus className="mr-2" size={16} />
            Asignar paciente
          </Button>
        </div>
      ) : view === 'table' ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Edad</TableHead>
                <TableHead>Género</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow 
                  key={patient.id}
                  className="cursor-pointer hover:bg-purple-50 dark:hover:bg-gray-800"
                  onClick={() => handleViewPatient(patient.id)}
                >
                  <TableCell className="font-medium">{patient.name}</TableCell>
                  <TableCell>{patient.documentId}</TableCell>
                  <TableCell>{calculateAge(patient.dateOfBirth)} años</TableCell>
                  <TableCell>{patient.gender}</TableCell>
                  <TableCell>{patient.contactNumber}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewPatient(patient.id);
                      }}
                    >
                      Ver
                      <ArrowRight size={16} className="ml-1" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => (
            <Card 
              key={patient.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleViewPatient(patient.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xl font-bold">
                    {patient.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-medium">{patient.name}</h3>
                    <p className="text-sm text-gray-500">{patient.documentId}</p>
                    <p className="text-sm text-gray-500">{calculateAge(patient.dateOfBirth)} años • {patient.gender}</p>
                    <div className="flex items-center mt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs h-7 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/app/citas/nueva?patientId=${patient.id}&doctorId=${doctorId}`);
                        }}
                      >
                        <Calendar size={12} className="mr-1" />
                        Nueva cita
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorPatients;
