import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { Send, CheckCircle, Calendar, Mail, User, Building, Phone, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const DemoSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    setIsSubmitted(true);
    toast.success('¡Solicitud enviada! Te contactaremos pronto.');
  };

  return (
    <section id="demo" className="py-24 lg:py-32 bg-muted/30 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8" ref={containerRef}>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl mx-auto">
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
              Solicitar Demo
            </motion.span>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              ¿Listo para{' '}
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                transformar tu práctica?
              </span>
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8">
              Agenda una demostración personalizada y descubre cómo Smart Doctor 
              puede ayudarte a gestionar tu consulta de manera más eficiente.
            </p>

            {/* Benefits */}
            <div className="space-y-4">
              {[
                { icon: Calendar, text: 'Demo personalizada de 30 minutos' },
                { icon: MessageSquare, text: 'Resolveremos todas tus dudas' },
                { icon: CheckCircle, text: 'Sin compromiso de compra' }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-foreground">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Content - Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-xl">
              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">¡Gracias por tu interés!</h3>
                  <p className="text-muted-foreground mb-6">
                    Nuestro equipo se pondrá en contacto contigo dentro de las próximas 24 horas hábiles.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsSubmitted(false)}
                  >
                    Enviar otra solicitud
                  </Button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h3 className="text-xl font-semibold mb-6">Solicita tu demo gratuita</h3>
                  
                  {/* Name */}
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      required
                      placeholder="Nombre completo"
                      className="pl-10 h-12"
                    />
                  </div>

                  {/* Email */}
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      required
                      type="email"
                      placeholder="Correo electrónico"
                      className="pl-10 h-12"
                    />
                  </div>

                  {/* Phone */}
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      required
                      type="tel"
                      placeholder="Teléfono / WhatsApp"
                      className="pl-10 h-12"
                    />
                  </div>

                  {/* Company */}
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Nombre de la clínica o consultorio"
                      className="pl-10 h-12"
                    />
                  </div>

                  {/* Message */}
                  <Textarea
                    placeholder="Cuéntanos sobre tu práctica médica y qué necesidades tienes..."
                    className="min-h-[100px] resize-none"
                  />

                  {/* Submit */}
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Enviando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Solicitar Demo
                        <Send className="w-4 h-4" />
                      </span>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Al enviar este formulario, aceptas nuestra{' '}
                    <a href="#" className="text-primary hover:underline">política de privacidad</a>.
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;
