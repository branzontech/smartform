import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TenantProvider } from "@/contexts/TenantContext";
import { OnboardingWrapper } from "@/components/onboarding/OnboardingWrapper";
import { Layout } from "@/components/layout";
import { HelmetProvider } from "react-helmet-async";

import LandingPage from "./pages/landing";
import Home from "./pages/Home";
import FormCreator from "./pages/FormCreator";
import FormViewer from "./pages/FormViewer";
import FormResponses from "./pages/FormResponses";
import PatientList from "./pages/patients/PatientList";
import PatientDetail from "./pages/patients/PatientDetail";
import NewConsultation from "./pages/patients/NewConsultation";
import MultiFormViewer from "./pages/patients/MultiFormViewer";
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
import AIAssistant from "./components/ai-assistant/AIAssistant";
import TelemedicinePage from "./pages/telemedicine/TelemedicinePage";
import PricingPage from "./pages/pricing/PricingPage"; // Import the new PricingPage
import UserPortalPage from "./pages/user-portal/UserPortalPage"; // Import the new UserPortalPage
import ChatPage from "./pages/chat/ChatPage";

// Importamos las páginas de especialidades
import CirujanoPage from "./pages/especialidades/CirujanoPage";
import PsicologoPage from "./pages/especialidades/PsicologoPage";
import NutricionistaPage from "./pages/especialidades/NutricionistaPage";
import TerapiasPage from "./pages/especialidades/TerapiasPage";

// Importamos las páginas de inventario
import InventoryList from "./pages/inventory/InventoryList";
import InventoryForm from "./pages/inventory/InventoryForm";
import InventorySearch from "./pages/inventory/InventorySearch";
import InventoryDetail from "./pages/inventory/InventoryDetail";

// Importamos las páginas de consultorios y sedes
import SiteListPage from "./pages/locations/SiteListPage";
import SiteDetailPage from "./pages/locations/SiteDetailPage";
import OfficeListPage from "./pages/locations/OfficeListPage";

// Importamos las páginas de médicos y profesionales
import DoctorList from "./pages/doctors/DoctorList";
import DoctorProfile from "./pages/doctors/DoctorProfile";
import DoctorForm from "./pages/doctors/DoctorForm";

// Importamos las páginas de facturación
import BillingDashboard from "./pages/billing/BillingDashboard";
import InvoiceDetail from "./pages/billing/InvoiceDetail";
import InvoiceForm from "./pages/billing/InvoiceForm";

// Importamos las páginas de clientes
import CustomerList from "./pages/customers/CustomerList";
import CustomerDetail from "./pages/customers/CustomerDetail";
import NotificationForm from "./pages/customers/NotificationForm";
import NotificationCenter from "./pages/notifications/NotificationCenter";

// Importamos las páginas de informes
import ReportsPage from "./pages/reports/ReportsPage";
import CreateReportPage from "./pages/reports/CreateReportPage";

// Importamos las páginas de turnos
import ShiftManagement from "./pages/shifts/ShiftManagement";
import ShiftAssignment from "./pages/shifts/ShiftAssignment";
import ShiftModification from "./pages/shifts/ShiftModification";

// Importamos las páginas de workflows
import WorkflowPage from "./pages/workflow/WorkflowPage";

// Importamos la página de zonas geográficas
import ZonesPage from "./pages/zones/ZonesPage";

export const BackButton = () => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    navigate(-1); // Vuelve a la página anterior
  };
  
  return (
    <Button 
      variant="ghost" 
      onClick={handleBack}
      className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-card/60 backdrop-blur-md border border-border/50 hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
    >
      <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
        <ArrowLeft className="h-4 w-4 text-primary" />
      </div>
      <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
        Volver
      </span>
    </Button>
  );
};

const queryClient = new QueryClient();

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <TenantProvider>
            <Toaster />
          <Sonner />
          <OnboardingWrapper>
            <BrowserRouter>
              <Routes>
                {/* Landing page route */}
                <Route path="/" element={<LandingPage />} />
                
                {/* Auth routes */}
                <Route path="/app/login" element={<Login />} />
                <Route path="/app/register" element={<Register />} />
                <Route path="/app/forgot-password" element={<ForgotPassword />} />
                
                {/* New pricing page */}
                <Route path="/app/precios" element={<PricingPage />} />
                
                {/* Nueva ruta para el portal usuario */}
                <Route path="/app/portal-usuario" element={<UserPortalPage />} />
                
                {/* Application routes wrapped with Layout */}
                <Route path="/app/*" element={
                  <Layout>
                    <Routes>
                      <Route index element={<AppointmentList />} />
                      <Route path="home" element={<Home />} />
                      <Route path="crear" element={<FormCreator />} />
                      <Route path="editar/:id" element={<FormCreator />} />
                      <Route path="ver/:id" element={<FormViewer />} />
                      <Route path="respuestas/:id" element={<FormResponses />} />
                      <Route path="pacientes" element={<PatientList />} />
                      <Route path="pacientes/dashboard" element={<PatientDashboard />} />
                      <Route path="pacientes/:id" element={<PatientDetail />} />
                      <Route path="pacientes/nueva-consulta" element={<NewConsultation />} />
                      <Route path="consulta-multiple" element={<MultiFormViewer />} />
                      <Route path="citas" element={<AppointmentList />} />
                      <Route path="citas/:id" element={<AppointmentDetail />} />
                      <Route path="citas/nueva" element={<AppointmentForm />} />
                      <Route path="citas/editar/:id" element={<AppointmentForm />} />
                      <Route path="configuracion" element={<SettingsPage />} />
                      
                      {/* Telemedicina */}
                      <Route path="telemedicina" element={<TelemedicinePage />} />
                      
                      {/* Chat médico */}
                      <Route path="chat" element={<ChatPage />} />
                      
                      {/* Workflows */}
                      <Route path="workflows" element={<WorkflowPage />} />
                      
                      {/* Admisiones */}
                      <Route path="admisiones" element={<AdmissionPage />} />
                      
                      {/* Informes */}
                      <Route path="informes" element={<ReportsPage />} />
                      <Route path="informes/crear" element={<CreateReportPage />} />
                      <Route path="informes/plantillas" element={<ReportsPage />} />
                      
                      {/* Turnos */}
                      <Route path="turnos" element={<ShiftManagement />} />
                      <Route path="turnos/asignar" element={<ShiftAssignment />} />
                      <Route path="turnos/modificar" element={<ShiftModification />} />
                      
                      {/* Médicos y profesionales */}
                      <Route path="medicos" element={<DoctorList />} />
                      <Route path="medicos/nuevo" element={<DoctorForm />} />
                      <Route path="medicos/:id" element={<DoctorProfile />} />
                      
                      {/* Especialidades */}
                      <Route path="especialidades/cirujano" element={<CirujanoPage />} />
                      <Route path="especialidades/psicologo" element={<PsicologoPage />} />
                      <Route path="especialidades/nutricionista" element={<NutricionistaPage />} />
                      <Route path="especialidades/terapias" element={<TerapiasPage />} />
                      
                      {/* Inventario */}
                      <Route path="inventario/articulos" element={<InventoryList />} />
                      <Route path="inventario/nuevo" element={<InventoryForm />} />
                      <Route path="inventario/editar/:id" element={<InventoryForm />} />
                      <Route path="inventario/buscar" element={<InventorySearch />} />
                      <Route path="inventario/:id" element={<InventoryDetail />} />
                      
                      {/* Consultorios y sedes */}
                      <Route path="locations/sites" element={<SiteListPage />} />
                      <Route path="locations/sites/:siteId" element={<SiteDetailPage />} />
                      <Route path="locations/offices" element={<OfficeListPage />} />
                      <Route path="locations/map" element={<SiteListPage />} />
                      
                      {/* Facturación */}
                      <Route path="facturacion" element={<BillingDashboard />} />
                      <Route path="facturacion/:id" element={<InvoiceDetail />} />
                      <Route path="facturacion/nueva" element={<InvoiceForm />} />
                      <Route path="facturacion/editar/:id" element={<InvoiceForm />} />
                      
                      {/* Clientes */}
                      <Route path="clientes" element={<CustomerList />} />
                      <Route path="clientes/:id" element={<CustomerDetail />} />
                      <Route path="clientes/notificaciones/nueva" element={<NotificationForm />} />
                      
                      {/* Centro de notificaciones */}
                      <Route path="notificaciones/centro" element={<NotificationCenter />} />
                      
                      {/* Zonas geográficas */}
                      <Route path="zonas" element={<ZonesPage />} />
                    </Routes>
                  </Layout>
                } />
                
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
                <Route path="/telemedicina" element={<Navigate to="/app/telemedicina" replace />} />
                
                {/* 404 route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              
              {/* Asistente de IA flotante */}
              <AIAssistant />
              </BrowserRouter>
            </OnboardingWrapper>
          </TenantProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
