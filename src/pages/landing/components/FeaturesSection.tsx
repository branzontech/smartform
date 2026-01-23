import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { 
  Calendar, 
  Users, 
  FileText, 
  BarChart3, 
  CreditCard, 
  Video,
  ClipboardList,
  Bell,
  Shield
} from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: 'Gestión de Citas',
    description: 'Agenda inteligente con recordatorios automáticos, confirmaciones por WhatsApp y sincronización con Google Calendar.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Users,
    title: 'Historia Clínica Digital',
    description: 'Expedientes electrónicos completos, seguros y accesibles desde cualquier dispositivo en tiempo real.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: FileText,
    title: 'Formularios Personalizados',
    description: 'Crea formularios médicos a tu medida con campos inteligentes, firmas digitales y validaciones.',
    color: 'from-amber-500 to-orange-500'
  },
  {
    icon: BarChart3,
    title: 'Reportes y Estadísticas',
    description: 'Dashboards interactivos con métricas clave, tendencias de pacientes y análisis financiero.',
    color: 'from-emerald-500 to-teal-500'
  },
  {
    icon: CreditCard,
    title: 'Facturación Electrónica',
    description: 'Genera facturas, gestiona pagos y lleva el control financiero de tu práctica médica.',
    color: 'from-rose-500 to-red-500'
  },
  {
    icon: Video,
    title: 'Telemedicina',
    description: 'Consultas virtuales con videollamada integrada, chat médico y envío de recetas digitales.',
    color: 'from-indigo-500 to-violet-500'
  },
  {
    icon: ClipboardList,
    title: 'Generación de RIPS',
    description: 'Genera automáticamente los archivos RIPS para reportar a las entidades de salud.',
    color: 'from-cyan-500 to-blue-500'
  },
  {
    icon: Bell,
    title: 'Notificaciones',
    description: 'Alertas y recordatorios personalizados para ti y tus pacientes por email, SMS o WhatsApp.',
    color: 'from-pink-500 to-rose-500'
  },
  {
    icon: Shield,
    title: 'Seguridad Total',
    description: 'Datos encriptados, backups automáticos y cumplimiento con normativas de protección de datos.',
    color: 'from-slate-500 to-gray-500'
  }
];

const FeaturesSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });

  return (
    <section id="features" className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8" ref={containerRef}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16 lg:mb-20"
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.2 }}
            className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
          >
            Características
          </motion.span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Todo lo que necesitas,{' '}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              en un solo lugar
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Herramientas potentes diseñadas específicamente para profesionales de la salud.
            Simplifica tu práctica médica y enfócate en lo que realmente importa: tus pacientes.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="group relative h-full bg-card border border-border/50 rounded-2xl p-6 lg:p-8 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
              >
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} p-0.5 mb-5 shadow-lg`}>
                  <div className="w-full h-full bg-card rounded-[14px] flex items-center justify-center group-hover:bg-transparent transition-colors duration-300">
                    <feature.icon className="w-6 h-6 text-foreground group-hover:text-white transition-colors duration-300" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Glow */}
                <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
