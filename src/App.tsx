
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import LandingPage from "./pages/LandingPage";
import Home from "./pages/Home";
import FormCreator from "./pages/FormCreator";
import FormViewer from "./pages/FormViewer";
import FormResponses from "./pages/FormResponses";
import PatientList from "./pages/patients/PatientList";
import PatientDetail from "./pages/patients/PatientDetail";
import NewConsultation from "./pages/patients/NewConsultation";
import PatientDashboard from "./pages/patients/PatientDashboard";
import NotFound from "./pages/NotFound";
import { SettingsPage } from "./components/config/settings";
import AppointmentList from "./pages/appointments/AppointmentList";
import AppointmentDetail from "./pages/appointments/AppointmentDetail";
import AppointmentForm from "./pages/appointments/AppointmentForm";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import AdmissionPage from "./pages/admissions/AdmissionPage";

// Importamos las páginas de especialidades
import CirujanoPage from "./pages/especialidades/CirujanoPage";
import PsicologoPage from "./pages/especialidades/PsicologoPage";
import NutricionistaPage from "./pages/especialidades/NutricionistaPage";
import TerapiasPage from "./pages/especialidades/TerapiasPage";

export const BackButton = () => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    navigate(-1); // Vuelve a la página anterior
  };
  
  return (
    <Button 
      variant="back" 
      onClick={handleBack}
      className="mb-4"
    >
      <ArrowLeft className="mr-1" size={18} />
      Volver
    </Button>
  );
};

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Landing page route */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Auth routes */}
            <Route path="/app/login" element={<Login />} />
            <Route path="/app/register" element={<Register />} />
            <Route path="/app/forgot-password" element={<ForgotPassword />} />
            
            {/* Application routes */}
            <Route path="/app" element={<AppointmentList />} />
            <Route path="/app/home" element={<Home />} />
            <Route path="/app/crear" element={<FormCreator />} />
            <Route path="/app/editar/:id" element={<FormCreator />} />
            <Route path="/app/ver/:id" element={<FormViewer />} />
            <Route path="/app/respuestas/:id" element={<FormResponses />} />
            <Route path="/app/pacientes" element={<PatientList />} />
            <Route path="/app/pacientes/dashboard" element={<PatientDashboard />} />
            <Route path="/app/pacientes/:id" element={<PatientDetail />} />
            <Route path="/app/pacientes/nueva-consulta" element={<NewConsultation />} />
            <Route path="/app/citas" element={<AppointmentList />} />
            <Route path="/app/citas/:id" element={<AppointmentDetail />} />
            <Route path="/app/citas/nueva" element={<AppointmentForm />} />
            <Route path="/app/citas/editar/:id" element={<AppointmentForm />} />
            <Route path="/app/configuracion" element={<SettingsPage />} />
            
            {/* Nueva ruta para admisiones */}
            <Route path="/app/admisiones" element={<AdmissionPage />} />
            
            {/* Rutas de especialidades */}
            <Route path="/app/especialidades/cirujano" element={<CirujanoPage />} />
            <Route path="/app/especialidades/psicologo" element={<PsicologoPage />} />
            <Route path="/app/especialidades/nutricionista" element={<NutricionistaPage />} />
            <Route path="/app/especialidades/terapias" element={<TerapiasPage />} />
            
            {/* Support legacy routes */}
            <Route path="/crear" element={<Navigate to="/app/crear" replace />} />
            <Route path="/editar/:id" element={<Navigate to="/app/editar/:id" replace />} />
            <Route path="/ver/:id" element={<Navigate to="/app/ver/:id" replace />} />
            <Route path="/respuestas/:id" element={<Navigate to="/app/respuestas/:id" replace />} />
            <Route path="/pacientes" element={<Navigate to="/app/pacientes" replace />} />
            <Route path="/pacientes/dashboard" element={<Navigate to="/app/pacientes/dashboard" replace />} />
            <Route path="/pacientes/:id" element={<Navigate to="/app/pacientes/:id" replace />} />
            <Route path="/pacientes/nueva-consulta" element={<Navigate to="/app/pacientes/nueva-consulta" replace />} />
            <Route path="/citas" element={<Navigate to="/app/citas" replace />} />
            <Route path="/citas/:id" element={<Navigate to="/app/citas/:id" replace />} />
            <Route path="/citas/nueva" element={<Navigate to="/app/citas/nueva" replace />} />
            <Route path="/citas/editar/:id" element={<Navigate to="/app/citas/editar/:id" replace />} />
            <Route path="/configuracion" element={<Navigate to="/app/configuracion" replace />} />
            <Route path="/admisiones" element={<Navigate to="/app/admisiones" replace />} />
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
