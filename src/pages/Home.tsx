import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { ModuleCard } from "@/components/kit/surface";

const quickActions = [
  {
    icon: "atencion" as const,
    label: "Realizar atención",
    description: "Inicia una nueva consulta o atención médica",
    route: "/app/pacientes/nueva-consulta",
  },
  {
    icon: "citas" as const,
    label: "Agendar paciente",
    description: "Crea una nueva cita o admite un paciente",
    route: "/app/citas/nueva",
  },
  {
    icon: "pacientes" as const,
    label: "Consultar pacientes",
    description: "Busca y gestiona la información de tus pacientes",
    route: "/app/pacientes",
  },
  {
    icon: "calidad" as const,
    label: "Realizar auditoría",
    description: "Revisa y audita los registros clínicos",
    route: "/app/informes",
  },
  {
    icon: "informes" as const,
    label: "Consultar estadísticas",
    description: "Visualiza métricas y reportes del sistema",
    route: "/app/pacientes/dashboard",
  },
  {
    icon: "formularios" as const,
    label: "Formularios",
    description: "Crea y gestiona formularios clínicos",
    route: "/app/configuracion?tab=forms",
  },
  {
    icon: "cotizaciones" as const,
    label: "Cotizar servicios",
    description: "Crea y gestiona cotizaciones de servicios",
    route: "/app/cotizaciones",
  },
  {
    icon: "inventario" as const,
    label: "Inventario",
    description: "Gestiona stock, lotes y movimientos",
    route: "/app/inventario",
  },
];

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" as const } },
};

const Home = () => {
  const { profile, user } = useAuth();

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Usuario";
  const firstName = displayName.split(" ")[0];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 py-6 md:py-8">
      {/* Saludo: una línea; el espacio es para los módulos (docs/ux-ui/sistema-diseno.md) */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {greeting}, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">¿Qué deseas hacer hoy?</p>
      </div>

      <motion.ul
        variants={listVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {quickActions.map((action) => (
          <motion.li key={action.route} variants={itemVariants}>
            <ModuleCard icon={action.icon} title={action.label} description={action.description} to={action.route} />
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
};

export default Home;
