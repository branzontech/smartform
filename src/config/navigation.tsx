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
  TrendingUp
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
    title: "Clientes",
    path: "/app/clientes",
    icon: UserCircle,
  },
  {
    title: "Médicos",
    path: "/app/medicos",
    icon: Stethoscope,
  },
  {
    title: "Admisiones",
    path: "/app/admisiones",
    icon: UserCheck,
  },
  {
    title: "Citas",
    path: "/app/citas",
    icon: Calendar,
  },
  {
    title: "Telemedicina",
    path: "/app/telemedicina",
    icon: Video,
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
        title: "Facturas",
        path: "/app/facturacion",
        icon: Receipt,
      },
      {
        title: "Pagos Pendientes",
        path: "/app/facturacion?tab=pending",
        icon: Clock,
      },
      {
        title: "Reportes",
        path: "/app/facturacion?tab=reports",
        icon: FileBarChart,
      },
      {
        title: "Generar Factura",
        path: "/app/facturacion/nueva",
        icon: DollarSign,
      },
    ],
  },
  {
    title: "Informes",
    path: "#",
    icon: FileBarChart,
    items: [
      {
        title: "Crear Informe",
        path: "/app/informes/crear",
        icon: ChartBar,
      },
      {
        title: "Informes Guardados",
        path: "/app/informes",
        icon: FileText,
      },
      {
        title: "Plantillas",
        path: "/app/informes/plantillas",
        icon: FileSpreadsheet,
      },
    ],
  },
  {
    title: "Notificaciones",
    path: "/app/clientes/notificaciones/nueva",
    icon: Send,
  },
  {
    title: "Inventario",
    path: "#",
    icon: PackageOpen,
    items: [
      {
        title: "Artículos",
        path: "/app/inventario/articulos",
        icon: List,
      },
      {
        title: "Nuevo Artículo",
        path: "/app/inventario/nuevo",
        icon: PackagePlus,
      },
      {
        title: "Buscar",
        path: "/app/inventario/buscar",
        icon: PackageSearch,
      },
    ],
  },
  {
    title: "Consultorios",
    path: "#",
    icon: Building,
    items: [
      {
        title: "Sedes",
        path: "/app/locations/sites",
        icon: Building,
      },
      {
        title: "Consultorios",
        path: "/app/locations/offices",
        icon: Building2,
      },
      {
        title: "Mapa de Instalaciones",
        path: "/app/locations/map",
        icon: MapPin,
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
    title: "Comunicación",
    path: "#",
    icon: MessageSquare,
    items: [
      {
        title: "Mensajes",
        path: "/app/comunicacion/mensajes",
        icon: Mail,
      },
      {
        title: "Notificaciones",
        path: "/app/comunicacion/notificaciones",
        icon: Bell,
      },
      {
        title: "Foros",
        path: "/app/comunicacion/foros",
        icon: MessageSquare,
      },
    ],
  },
  {
    title: "Recursos",
    path: "#",
    icon: BookOpen,
    items: [
      {
        title: "Artículos",
        path: "/app/recursos/articulos",
        icon: FileText,
      },
      {
        title: "Videos",
        path: "/app/recursos/videos",
        icon: GraduationCap,
      },
      {
        title: "Enlaces",
        path: "/app/recursos/enlaces",
        icon: Link,
      },
    ],
  },
  {
    title: "Personal",
    path: "#",
    icon: UserPlus,
    items: [
      {
        title: "Médicos",
        path: "/app/medicos",
        icon: Stethoscope,
      },
      {
        title: "Enfermeros",
        path: "/app/personal/enfermeros",
        icon: Heart,
      },
      {
        title: "Administrativos",
        path: "/app/personal/administrativos",
        icon: Briefcase,
      },
    ],
  },
  {
    title: "Configuración",
    path: "/app/configuracion",
    icon: SettingsIcon,
  },
];
