
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { BackButton } from "@/App";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import DoctorHeader from "@/components/doctors/DoctorHeader";
import DoctorAppointments from "@/components/doctors/DoctorAppointments";
import DoctorPatients from "@/components/doctors/DoctorPatients";
import DoctorStatisticsPanel from "@/components/doctors/DoctorStatisticsPanel";
import DoctorSchedule from "@/components/doctors/DoctorSchedule";
import { getDoctorById } from "@/utils/doctor-utils";
import { Doctor } from "@/types/patient-types";

const DoctorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDoctor = async () => {
      if (!id) return;
      
      try {
        const doctorData = await getDoctorById(id);
        setDoctor(doctorData);
      } catch (error) {
        console.error("Error fetching doctor:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDoctor();
  }, [id]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 container mx-auto py-8 px-4">
          <BackButton />
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl md:col-span-2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!doctor) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 container mx-auto py-8 px-4">
          <BackButton />
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Médico no encontrado</h2>
            <p className="text-gray-500">No se encontró información para el médico solicitado.</p>
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
        
        <DoctorHeader doctor={doctor} />
        
        <Tabs defaultValue="appointments" className="mt-8">
          <TabsList className="w-full max-w-md mx-auto grid grid-cols-4">
            <TabsTrigger value="appointments">Citas</TabsTrigger>
            <TabsTrigger value="patients">Pacientes</TabsTrigger>
            <TabsTrigger value="statistics">Estadísticas</TabsTrigger>
            <TabsTrigger value="schedule">Horario</TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="appointments" className="space-y-4">
              <DoctorAppointments doctorId={doctor.id} />
            </TabsContent>
            
            <TabsContent value="patients" className="space-y-4">
              <DoctorPatients doctorId={doctor.id} />
            </TabsContent>
            
            <TabsContent value="statistics" className="space-y-4">
              <DoctorStatisticsPanel doctorId={doctor.id} />
            </TabsContent>
            
            <TabsContent value="schedule" className="space-y-4">
              <DoctorSchedule doctor={doctor} />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default DoctorProfile;
