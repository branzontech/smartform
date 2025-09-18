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
  Activity as TherapyIcon,
  FileText,
  Mail,
  MessageSquare,
  LucideIcon,
  BadgeHelp,
  BookOpen,
  Briefcase,
  CreditCard,
  Laptop,
  UserPlus,
  GraduationCap,
  Heart,
  Map,
  Network,
  Bell,
  Link,
  Shield,
  UserCheck,
  PackageOpen,
  PackagePlus,
  PackageSearch,
  List,
  Building,
  Building2,
  MapPin,
  Stethoscope,
  Receipt,
  DollarSign,
  PieChart,
  FileBarChart,
  Clock,
  UserCircle,
  Send,
  Video,
  FileSpreadsheet,
  Download,
  ChartBar,
  ChartPie,
  TrendingUp,
  CalendarRange,
  CalendarCheck,
  CalendarClock,
  Workflow,
  Bot
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
  // Navegación Principal
  {
    title: "Dashboard",
    path: "/app/home",
    icon: Home,
  },
  {
    title: "Pacientes",
    path: "#",
    icon: Users,
    items: [
      {
        title: "Lista de Pacientes",
        path: "/app/pacientes",
        icon: Users,
      },
      {
        title: "Nuevo Paciente",
        path: "/app/pacientes/nueva-consulta",
        icon: UserPlus,
      },
      {
        title: "Dashboard Pacientes",
        path: "/app/pacientes/dashboard",
        icon: BarChart,
      },
    ],
  },
  {
    title: "Citas Médicas",
    path: "#",
    icon: Calendar,
    items: [
      {
        title: "Agenda",
        path: "/app/citas",
        icon: Calendar,
      },
      {
        title: "Nueva Cita",
        path: "/app/citas/nueva",
        icon: CalendarCheck,
      },
      {
        title: "Turnos",
        path: "/app/turnos",
        icon: CalendarRange,
      },
    ],
  },
  {
    title: "Comunicación",
    path: "#",
    icon: MessageSquare,
    items: [
      {
        title: "Chat Médico",
        path: "/app/chat",
        icon: MessageSquare,
      },
      {
        title: "Telemedicina",
        path: "/app/telemedicina",
        icon: Video,
      },
      {
        title: "Notificaciones",
        path: "/app/notificaciones/centro",
        icon: Bell,
      },
    ],
  },
  {
    title: "Gestión Clínica",
    path: "#",
    icon: ClipboardList,
    items: [
      {
        title: "Historias Clínicas",
        path: "/app/crear",
        icon: ClipboardList,
      },
      {
        title: "Admisiones",
        path: "/app/admisiones",
        icon: UserCheck,
      },
      {
        title: "Portal Usuario",
        path: "/app/portal-usuario",
        icon: UserCircle,
      },
    ],
  },
  {
    title: "Personal & Admin",
    path: "#",
    icon: Stethoscope,
    items: [
      {
        title: "Médicos",
        path: "/app/medicos",
        icon: Stethoscope,
      },
      {
        title: "Inventario",
        path: "/app/inventario/articulos",
        icon: PackageOpen,
      },
      {
        title: "Consultorios",
        path: "/app/locations/sites",
        icon: Building,
      },
    ],
  },
  {
    title: "Facturación",
    path: "#",
    icon: CreditCard,
    items: [
      {
        title: "Dashboard",
        path: "/app/facturacion",
        icon: PieChart,
      },
      {
        title: "Nueva Factura",
        path: "/app/facturacion/nueva",
        icon: DollarSign,
      },
      {
        title: "Reportes",
        path: "/app/informes",
        icon: FileBarChart,
      },
    ],
  },
  {
    title: "Configuración",
    path: "/app/configuracion",
    icon: SettingsIcon,
  },
];
