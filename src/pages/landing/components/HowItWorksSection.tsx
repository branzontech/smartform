import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { UserPlus, Settings, Rocket } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Crea tu cuenta',
    description: 'Regístrate en menos de 2 minutos. Sin tarjeta de crédito, sin compromisos. 14 días de prueba gratuita.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    number: '02',
    icon: Settings,
    title: 'Configura tu consultorio',
    description: 'Personaliza horarios, servicios, formularios y datos de tu práctica médica según tus necesidades.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    number: '03',
    icon: Rocket,
    title: '¡Comienza a trabajar!',
    description: 'Agenda citas, gestiona pacientes y factura desde el primer día. Soporte incluido para ayudarte.',
    color: 'from-amber-500 to-orange-500'
  }
];

const HowItWorksSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });

  return (
    <section id="how-it-works" className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
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
            Cómo funciona
          </motion.span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Comienza en{' '}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              3 simples pasos
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            No necesitas conocimientos técnicos. Nuestra plataforma está diseñada
            para que puedas comenzar a usarla de inmediato.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2" />
          
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative"
              >
                <motion.div
                  whileHover={{ y: -10, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  className="relative bg-card border border-border/50 rounded-3xl p-8 text-center h-full hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 transition-all duration-300"
                >
                  {/* Step Number */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={isInView ? { scale: 1 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.2, type: 'spring' }}
                    className="absolute -top-6 left-1/2 -translate-x-1/2"
                  >
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                      {step.number}
                    </div>
                  </motion.div>

                  {/* Icon */}
                  <div className={`w-20 h-20 mx-auto mt-6 mb-6 rounded-2xl bg-gradient-to-br ${step.color} p-0.5`}>
                    <div className="w-full h-full bg-card rounded-[14px] flex items-center justify-center">
                      <step.icon className="w-8 h-8 text-foreground" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
