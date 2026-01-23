import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles, Building2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const plans = [
  {
    name: 'Básico',
    description: 'Ideal para consultorios individuales',
    price: '$99.000',
    period: '/mes',
    icon: Users,
    popular: false,
    features: [
      'Hasta 200 pacientes',
      'Agenda de citas ilimitada',
      'Historia clínica digital',
      'Recordatorios por email',
      'Formularios básicos',
      'Reportes simples',
      'Soporte por email'
    ],
    cta: 'Comenzar Gratis',
    ctaVariant: 'outline' as const
  },
  {
    name: 'Profesional',
    description: 'Para profesionales que buscan crecer',
    price: '$199.000',
    period: '/mes',
    icon: Sparkles,
    popular: true,
    features: [
      'Pacientes ilimitados',
      'Todo del plan Básico',
      'Recordatorios WhatsApp y SMS',
      'Facturación electrónica',
      'Generación de RIPS',
      'Formularios personalizados',
      'Telemedicina básica',
      'Reportes avanzados',
      'Soporte prioritario'
    ],
    cta: 'Comenzar Gratis',
    ctaVariant: 'default' as const
  },
  {
    name: 'Institucional',
    description: 'Para clínicas y centros médicos',
    price: '$499.000',
    period: '/mes',
    icon: Building2,
    popular: false,
    features: [
      'Todo del plan Profesional',
      'Múltiples sedes',
      'Usuarios ilimitados',
      'Gestión de inventario',
      'API personalizada',
      'Telemedicina avanzada',
      'Integraciones personalizadas',
      'Reportes corporativos',
      'Gerente de cuenta dedicado',
      'SLA garantizado'
    ],
    cta: 'Contactar Ventas',
    ctaVariant: 'outline' as const
  }
];

const PricingSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });

  return (
    <section id="pricing" className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8" ref={containerRef}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.2 }}
            className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
          >
            Planes y Precios
          </motion.span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Un plan para cada{' '}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              tipo de práctica
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Elige el plan que mejor se adapte a tus necesidades. Todos incluyen 14 días de prueba gratuita.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <span className="px-4 py-1.5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium rounded-full shadow-lg">
                    Más Popular
                  </span>
                </div>
              )}
              
              <motion.div
                whileHover={{ y: -10, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className={`h-full bg-card border rounded-3xl p-8 transition-all duration-300 ${
                  plan.popular 
                    ? 'border-primary shadow-2xl shadow-primary/20' 
                    : 'border-border/50 hover:border-primary/30 hover:shadow-xl'
                }`}
              >
                {/* Plan Icon & Name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    plan.popular ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                  }`}>
                    <plan.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link to={plan.name === 'Institucional' ? '#demo' : '/app/register'} className="block">
                  <Button 
                    variant={plan.ctaVariant}
                    className={`w-full h-12 text-base font-medium ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25' 
                        : ''
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          className="text-center text-muted-foreground mt-12"
        >
          Todos los precios en pesos colombianos (COP). IVA no incluido.
          <br />
          ¿Necesitas un plan personalizado? <a href="#demo" className="text-primary hover:underline">Contáctanos</a>
        </motion.p>
      </div>
    </section>
  );
};

export default PricingSection;
