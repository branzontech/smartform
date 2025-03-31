
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Home from "./pages/Home";
import FormCreator from "./pages/FormCreator";
import FormViewer from "./pages/FormViewer";
import FormResponses from "./pages/FormResponses";
import PatientList from "./pages/patients/PatientList";
import PatientDetail from "./pages/patients/PatientDetail";
import NewConsultation from "./pages/patients/NewConsultation";
import PatientDashboard from "./pages/patients/PatientDashboard";
import NotFound from "./pages/NotFound";

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
            <Route path="/" element={<Home />} />
            <Route path="/crear" element={<FormCreator />} />
            <Route path="/editar/:id" element={<FormCreator />} />
            <Route path="/ver/:id" element={<FormViewer />} />
            <Route path="/respuestas/:id" element={<FormResponses />} />
            <Route path="/pacientes" element={<PatientList />} />
            <Route path="/pacientes/dashboard" element={<PatientDashboard />} />
            <Route path="/pacientes/:id" element={<PatientDetail />} />
            <Route path="/pacientes/nueva-consulta" element={<NewConsultation />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
