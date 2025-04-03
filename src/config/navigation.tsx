
import { 
  Home, 
  Users, 
  Calendar, 
  Activity, 
  ClipboardList, 
  BarChart, 
  Settings as SettingsIcon,
  Scissors, 
  Brain, 
  Apple, 
  Activity as TherapyIcon 
} from "lucide-react";

export type MenuItem = {
  title: string;
  path: string;
  icon: React.ElementType;
};

export type SubmenuItem = MenuItem & {
  items?: MenuItem[];
};

export const mainNavItems: SubmenuItem[] = [
  {
    title: "Inicio",
    path: "/app/home",
    icon: Home,
  },
  {
    title: "Pacientes",
    path: "/app/pacientes",
    icon: Users,
  },
  {
    title: "Citas",
    path: "/app/citas",
    icon: Calendar,
  },
  {
    title: "Especialidades",
    path: "#",
    icon: Activity,
    items: [
      {
        title: "Cirujano",
        path: "/app/especialidades/cirujano",
        icon: Scissors,
      },
      {
        title: "Psicólogo",
        path: "/app/especialidades/psicologo",
        icon: Brain,
      },
      {
        title: "Nutricionista",
        path: "/app/especialidades/nutricionista",
        icon: Apple,
      },
      {
        title: "Terapias",
        path: "/app/especialidades/terapias",
        icon: TherapyIcon,
      },
    ],
  },
  {
    title: "Historias clínicas",
    path: "/app/crear",
    icon: ClipboardList,
  },
  {
    title: "Estadísticas",
    path: "/app/pacientes/dashboard",
    icon: BarChart,
  },
  {
    title: "Configuración",
    path: "/app/configuracion",
    icon: SettingsIcon,
  },
];
