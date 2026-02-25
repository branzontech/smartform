import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Calendar, Stethoscope, ClipboardCheck, BarChart3, FileText } from "lucide-react";

const quickActions = [
  {
    icon: Users,
    label: "Consultar pacientes",
    description: "Busca y gestiona la información de tus pacientes",
    route: "/app/pacientes",
    gradient: "from-blue-500/10 to-cyan-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    icon: Calendar,
    label: "Consultar citas",
    description: "Revisa y administra las citas programadas",
    route: "/app/citas",
    gradient: "from-violet-500/10 to-purple-500/10",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    icon: Stethoscope,
    label: "Realizar atención",
    description: "Inicia una nueva consulta o atención médica",
    route: "/app/citas/nueva",
    gradient: "from-emerald-500/10 to-teal-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: ClipboardCheck,
    label: "Realizar auditoría",
    description: "Revisa y audita los registros clínicos",
    route: "/app/informes",
    gradient: "from-amber-500/10 to-orange-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    icon: BarChart3,
    label: "Consultar estadísticas",
    description: "Visualiza métricas y reportes del sistema",
    route: "/app/pacientes/dashboard",
    gradient: "from-rose-500/10 to-pink-500/10",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  {
    icon: FileText,
    label: "Formularios",
    description: "Crea y gestiona formularios clínicos",
    route: "/app/home/formularios",
    gradient: "from-indigo-500/10 to-sky-500/10",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const Home = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Usuario";
  const firstName = displayName.split(" ")[0];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 min-h-[70vh]">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-3xl space-y-10"
      >
        {/* Greeting */}
        <motion.div variants={itemVariants} className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            {greeting}, {firstName}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
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
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(action.route)}
              className={`
                group relative flex flex-col items-center gap-3 p-5 md:p-6
                rounded-2xl border border-border/50
                bg-gradient-to-br ${action.gradient}
                backdrop-blur-sm
                hover:border-border hover:shadow-lg hover:shadow-black/5
                transition-all duration-200 cursor-pointer
                text-center
              `}
            >
              <div className={`p-3 rounded-xl bg-background/60 ${action.iconColor} transition-colors`}>
                <action.icon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-foreground block">
                  {action.label}
                </span>
                <span className="text-xs text-muted-foreground hidden md:block leading-relaxed">
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
