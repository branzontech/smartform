import React from "react";
import { Routes, Route } from "react-router-dom";

import Home from "@/pages/Home";
import FormsPage from "@/pages/FormsPage";
import FormCreator from "@/pages/FormCreator";
import FormViewer from "@/pages/FormViewer";
import FormResponses from "@/pages/FormResponses";
import PatientList from "@/pages/patients/PatientList";
import PatientDetail from "@/pages/patients/PatientDetail";
import NewConsultation from "@/pages/patients/NewConsultation";
import MultiFormViewer from "@/pages/patients/MultiFormViewer";
import PatientDashboard from "@/pages/patients/PatientDashboard";
import { SettingsPage } from "@/components/config/settings";
import AppointmentList from "@/pages/appointments/AppointmentList";
import AppointmentDetail from "@/pages/appointments/AppointmentDetail";
import AppointmentForm from "@/pages/appointments/AppointmentForm";
import AdmissionPage from "@/pages/admissions/AdmissionPage";
import AIAssistant from "@/components/ai-assistant/AIAssistant";
import TelemedicinePage from "@/pages/telemedicine/TelemedicinePage";
import PricingPage from "@/pages/pricing/PricingPage";
import UserPortalPage from "@/pages/user-portal/UserPortalPage";
import ChatPage from "@/pages/chat/ChatPage";
import CirujanoPage from "@/pages/especialidades/CirujanoPage";
import PsicologoPage from "@/pages/especialidades/PsicologoPage";
import NutricionistaPage from "@/pages/especialidades/NutricionistaPage";
import TerapiasPage from "@/pages/especialidades/TerapiasPage";
import InventoryList from "@/pages/inventory/InventoryList";
import InventoryForm from "@/pages/inventory/InventoryForm";
import InventorySearch from "@/pages/inventory/InventorySearch";
import InventoryDetail from "@/pages/inventory/InventoryDetail";
import SiteListPage from "@/pages/locations/SiteListPage";
import SiteDetailPage from "@/pages/locations/SiteDetailPage";
import OfficeListPage from "@/pages/locations/OfficeListPage";
import DoctorList from "@/pages/doctors/DoctorList";
import DoctorProfile from "@/pages/doctors/DoctorProfile";
import DoctorForm from "@/pages/doctors/DoctorForm";
import BillingDashboard from "@/pages/billing/BillingDashboard";
import ContractsPage from "@/pages/billing/ContractsPage";
import PriceLists from "@/pages/billing/PriceLists";
import InvoiceDetail from "@/pages/billing/InvoiceDetail";
import InvoiceForm from "@/pages/billing/InvoiceForm";
import CustomerList from "@/pages/customers/CustomerList";
import CustomerDetail from "@/pages/customers/CustomerDetail";
import NotificationForm from "@/pages/customers/NotificationForm";
import NotificationCenter from "@/pages/notifications/NotificationCenter";
import ReportsPage from "@/pages/reports/ReportsPage";
import CreateReportPage from "@/pages/reports/CreateReportPage";
import ShiftManagement from "@/pages/shifts/ShiftManagement";
import ShiftAssignment from "@/pages/shifts/ShiftAssignment";
import ShiftModification from "@/pages/shifts/ShiftModification";
import WorkflowPage from "@/pages/workflow/WorkflowPage";
import ZonesPage from "@/pages/zones/ZonesPage";
import CotizacionesPage from "@/pages/cotizaciones/CotizacionesPage";

const AppRoutes = () => {
  return (
    <>
      <Routes>
        <Route index element={<Home />} />
        <Route path="home" element={<Home />} />
        <Route path="home/formularios" element={<FormsPage />} />
        <Route path="crear" element={<FormCreator />} />
        <Route path="crear/:id" element={<FormCreator />} />
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
        <Route path="telemedicina" element={<TelemedicinePage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="workflows" element={<WorkflowPage />} />
        <Route path="admisiones" element={<AdmissionPage />} />
        <Route path="informes" element={<ReportsPage />} />
        <Route path="informes/crear" element={<CreateReportPage />} />
        <Route path="informes/plantillas" element={<ReportsPage />} />
        <Route path="turnos" element={<ShiftManagement />} />
        <Route path="turnos/asignar" element={<ShiftAssignment />} />
        <Route path="turnos/modificar" element={<ShiftModification />} />
        <Route path="medicos" element={<DoctorList />} />
        <Route path="medicos/nuevo" element={<DoctorForm />} />
        <Route path="medicos/:id" element={<DoctorProfile />} />
        <Route path="especialidades/cirujano" element={<CirujanoPage />} />
        <Route path="especialidades/psicologo" element={<PsicologoPage />} />
        <Route path="especialidades/nutricionista" element={<NutricionistaPage />} />
        <Route path="especialidades/terapias" element={<TerapiasPage />} />
        <Route path="inventario/articulos" element={<InventoryList />} />
        <Route path="inventario/nuevo" element={<InventoryForm />} />
        <Route path="inventario/editar/:id" element={<InventoryForm />} />
        <Route path="inventario/buscar" element={<InventorySearch />} />
        <Route path="inventario/:id" element={<InventoryDetail />} />
        <Route path="locations/sites" element={<SiteListPage />} />
        <Route path="locations/sites/:siteId" element={<SiteDetailPage />} />
        <Route path="locations/offices" element={<OfficeListPage />} />
        <Route path="locations/map" element={<SiteListPage />} />
        <Route path="facturacion" element={<BillingDashboard />} />
        <Route path="facturacion/convenios" element={<ContractsPage />} />
        <Route path="facturacion/tarifarios" element={<PriceLists />} />
        <Route path="facturacion/:id" element={<InvoiceDetail />} />
        <Route path="facturacion/nueva" element={<InvoiceForm />} />
        <Route path="facturacion/editar/:id" element={<InvoiceForm />} />
        <Route path="clientes" element={<CustomerList />} />
        <Route path="clientes/:id" element={<CustomerDetail />} />
        <Route path="clientes/notificaciones/nueva" element={<NotificationForm />} />
        <Route path="notificaciones/centro" element={<NotificationCenter />} />
        <Route path="zonas" element={<ZonesPage />} />
        <Route path="precios" element={<PricingPage />} />
        <Route path="portal-usuario" element={<UserPortalPage />} />
      </Routes>
      <AIAssistant />
    </>
  );
};

export default AppRoutes;
