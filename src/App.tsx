import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  Link,
  Outlet,
  useNavigate,
} from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  ClipboardList,
  FileText,
  Home,
  LayoutDashboard,
  Settings,
  User2,
  Users,
  ArrowLeft,
} from "lucide-react";
import { MainNav } from "@/components/layout/main-nav";
import { SiteHeader } from "@/components/layout/site-header";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { DashboardPage } from "@/pages/DashboardPage";
import { PacientesPage } from "@/pages/PacientesPage";
import { HistoriaClinicaForm } from "@/pages/HistoriaClinicaForm";
import { SettingsPage } from "@/pages/SettingsPage";
import { CitasPage } from "@/pages/CitasPage";
import { EspecialidadesPage } from "@/pages/EspecialidadesPage";
import NutricionistaPage from "@/pages/especialidades/NutricionistaPage";
import NutricionPlanPage from "@/pages/especialidades/NutricionPlanPage";
import PsicologoPage from "@/pages/especialidades/PsicologoPage";
import PsicologiaPlanPage from "@/pages/especialidades/PsicologiaPlanPage";
import PsicologiaEvaluacionesPage from "@/pages/especialidades/PsicologiaEvaluacionesPage";

const routes = [
  {
    path: "/home",
    icon: <Home className="mr-2 h-4 w-4" />,
    label: "Inicio",
  },
  {
    path: "/dashboard",
    icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
    label: "Dashboard",
  },
  {
    path: "/citas",
    icon: <CalendarDays className="mr-2 h-4 w-4" />,
    label: "Citas",
  },
  {
    path: "/pacientes",
    icon: <Users className="mr-2 h-4 w-4" />,
    label: "Pacientes",
  },
  {
    path: "/crear",
    icon: <ClipboardList className="mr-2 h-4 w-4" />,
    label: "Historias Clinicas",
  },
  {
    path: "/especialidades",
    icon: <FileText className="mr-2 h-4 w-4" />,
    label: "Especialidades",
  },
  {
    path: "/account",
    icon: <User2 className="mr-2 h-4 w-4" />,
    label: "Cuenta",
  },
  {
    path: "/settings",
    icon: <Settings className="mr-2 h-4 w-4" />,
    label: "Ajustes",
  },
];

export function BackButton() {
  const navigate = useNavigate();

  return (
    <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
      <ArrowLeft className="mr-2 h-4 w-4" />
      Atrás
    </Button>
  );
}

function AppLayout() {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <SidebarNav className="w-64 shrink-0 border-r bg-secondary p-0 flex-col">
        <div className="border-b px-4 pb-6 pt-8">
          <Link to="/app/home">
            <SiteHeader />
          </Link>
        </div>
        <MainNav className="flex-1 px-4 py-6" routes={routes} />
      </SidebarNav>
      <div className="flex-1">
        <SiteHeader className="sticky top-0 border-b bg-background z-50" />
        <main className="container relative py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/app",
    element: <AppLayout />,
    children: [
      { path: "home", element: <div>Home content</div> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "pacientes", element: <PacientesPage /> },
      { path: "pacientes/dashboard", element: <div>Pacientes Dashboard</div> },
      { path: "citas", element: <CitasPage /> },
      { path: "crear", element: <HistoriaClinicaForm /> },
      { path: "account", element: <div>Account Settings</div> },
      { path: "settings", element: <SettingsPage /> },
      { path: "especialidades", element: <EspecialidadesPage /> },
    ],
  },
  
  {
    path: "/app/especialidades/nutricionista",
    element: <NutricionistaPage />,
  },
  {
    path: "/app/especialidades/nutricion/planes",
    element: <NutricionPlanPage />,
  },
  {
    path: "/app/especialidades/psicologo",
    element: <PsicologoPage />,
  },
  {
    path: "/app/especialidades/psicologia/planes",
    element: <PsicologiaPlanPage />,
  },
  {
    path: "/app/especialidades/psicologia/evaluaciones",
    element: <PsicologiaEvaluacionesPage />,
  },
  
  {
    path: "*",
    element: <div>404 Not Found</div>,
  },
]);

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;
