import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Clock, TrendingUp, Heart, Zap } from 'lucide-react';

const benefits = [
  {
    icon: Clock,
    title: 'Ahorra hasta 10 horas semanales',
    description: 'Automatiza tareas administrativas repetitivas y dedica más tiempo a tus pacientes.',
    stat: '10+',
    statLabel: 'Horas ahorradas/semana'
  },
  {
    icon: TrendingUp,
    title: 'Incrementa tus ingresos',
    description: 'Reduce las ausencias con recordatorios automáticos y optimiza tu agenda.',
    stat: '35%',
    statLabel: 'Menos citas perdidas'
  },
  {
    icon: Heart,
    title: 'Mejora la experiencia del paciente',
    description: 'Ofrece una atención más personalizada con acceso rápido a historiales completos.',
    stat: '4.9',
    statLabel: 'Satisfacción promedio'
  },
  {
    icon: Zap,
    title: 'Implementación inmediata',
    description: 'Empieza a usar la plataforma en minutos, sin necesidad de instalaciones complejas.',
    stat: '5min',
    statLabel: 'Para empezar'
  }
];

const BenefitsSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);

  return (
    <section id="benefits" className="py-24 lg:py-32 bg-muted/30 relative overflow-hidden">
      {/* Background Pattern */}
      <motion.div
        style={{ y }}
        className="absolute inset-0 -z-10"
      >
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-gradient-to-tr from-primary/5 to-transparent rounded-full blur-3xl" />
      </motion.div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8" ref={containerRef}>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <motion.span
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.2 }}
              className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
            >
              Beneficios
            </motion.span>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Transforma tu práctica médica{' '}
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                hoy mismo
              </span>
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8">
              Únete a miles de profesionales de la salud que ya optimizaron su consulta
              con nuestra plataforma integral. Resultados reales desde el primer día.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="bg-card border border-border/50 rounded-xl p-4"
                >
                  <div className="text-3xl font-bold text-primary mb-1">{benefit.stat}</div>
                  <div className="text-sm text-muted-foreground">{benefit.statLabel}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Content - Benefits List */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, x: 30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.15 }}
                whileHover={{ x: 10 }}
                className="group flex gap-5 p-5 bg-card border border-border/50 rounded-2xl hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              >
                {/* Icon */}
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <benefit.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                
                {/* Content */}
                <div>
                  <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
