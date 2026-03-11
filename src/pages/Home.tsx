import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Calendar, Stethoscope, ClipboardCheck, BarChart3, FileText, ArrowRight, Sparkles } from "lucide-react";

const quickActions = [
  {
    icon: Stethoscope,
    label: "Realizar atención",
    description: "Inicia una nueva consulta o atención médica",
    route: "/app/pacientes/nueva-consulta",
    accent: "group-hover:text-primary",
    bgAccent: "group-hover:bg-primary/10",
    featured: true,
  },
  {
    icon: Calendar,
    label: "Agendar paciente",
    description: "Crea una nueva cita o admite un paciente",
    route: "/app/citas/nueva",
    accent: "group-hover:text-primary",
    bgAccent: "group-hover:bg-primary/10",
  },
  {
    icon: Users,
    label: "Consultar pacientes",
    description: "Busca y gestiona la información de tus pacientes",
    route: "/app/pacientes",
    accent: "group-hover:text-primary",
    bgAccent: "group-hover:bg-primary/10",
  },
  {
    icon: ClipboardCheck,
    label: "Realizar auditoría",
    description: "Revisa y audita los registros clínicos",
    route: "/app/informes",
    accent: "group-hover:text-primary",
    bgAccent: "group-hover:bg-primary/10",
  },
  {
    icon: BarChart3,
    label: "Consultar estadísticas",
    description: "Visualiza métricas y reportes del sistema",
    route: "/app/pacientes/dashboard",
    accent: "group-hover:text-primary",
    bgAccent: "group-hover:bg-primary/10",
  },
  {
    icon: FileText,
    label: "Formularios",
    description: "Crea y gestiona formularios clínicos",
    route: "/app/home/formularios",
    accent: "group-hover:text-primary",
    bgAccent: "group-hover:bg-primary/10",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, type: "spring" as const, bounce: 0.3 } },
};

const Home = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Usuario";
  const firstName = displayName.split(" ")[0];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-16 min-h-[75vh] relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.04] blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-secondary/[0.03] blur-[80px]" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-4xl space-y-12 relative z-10"
      >
        {/* Greeting */}
        <motion.div variants={itemVariants} className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Ker Hub
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            {greeting},{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {firstName}
            </span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-light max-w-md mx-auto">
            ¿Qué deseas hacer hoy?
          </p>
        </motion.div>

        {/* Quick Actions Grid */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
        >
          {quickActions.map((action) => (
            <motion.button
              key={action.label}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(action.route)}
              className={`
                group relative flex flex-col items-start gap-4 p-5 md:p-6
                rounded-2xl border border-border/60
                bg-card/50 backdrop-blur-sm
                hover:bg-card hover:border-primary/30
                hover:shadow-xl hover:shadow-primary/[0.06]
                transition-all duration-300 cursor-pointer
                text-left overflow-hidden
                ${action.featured ? "md:col-span-1" : ""}
              `}
            >
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

              <div className={`relative p-2.5 rounded-xl bg-muted/50 text-muted-foreground ${action.bgAccent} ${action.accent} transition-all duration-300`}>
                <action.icon className="w-5 h-5" strokeWidth={1.8} />
              </div>

              <div className="relative space-y-1.5 flex-1">
                <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                  {action.label}
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-60 group-hover:translate-x-0 transition-all duration-300 text-muted-foreground" />
                </span>
                <span className="text-xs text-muted-foreground/80 leading-relaxed hidden md:block">
                  {action.description}
                </span>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Home;
