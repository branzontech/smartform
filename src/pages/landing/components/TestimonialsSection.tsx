import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';

const testimonials = [
  {
    id: 1,
    content: 'Ker Hub transformó completamente mi práctica médica. Ahora puedo atender más pacientes sin sentirme abrumada con la administración. Los recordatorios automáticos redujeron las ausencias en un 40%.',
    author: 'Dra. María González',
    role: 'Médico General',
    location: 'Bogotá, Colombia',
    rating: 5,
    avatar: 'MG'
  },
  {
    id: 2,
    content: 'La generación automática de RIPS me ahorra horas cada mes. El sistema es intuitivo y el soporte técnico es excepcional. Lo recomiendo a todos mis colegas.',
    author: 'Dr. Carlos Rodríguez',
    role: 'Pediatra',
    location: 'Medellín, Colombia',
    rating: 5,
    avatar: 'CR'
  },
  {
    id: 3,
    content: 'Desde que implementamos Ker Hub en nuestra clínica, la eficiencia aumentó dramáticamente. La telemedicina integrada nos permitió mantener la atención durante la pandemia.',
    author: 'Dra. Ana Martínez',
    role: 'Directora Clínica',
    location: 'Cali, Colombia',
    rating: 5,
    avatar: 'AM'
  },
  {
    id: 4,
    content: 'La historia clínica digital es fantástica. Puedo acceder a la información de mis pacientes desde cualquier lugar y el sistema de formularios personalizados se adapta perfectamente a mi especialidad.',
    author: 'Dr. Luis Hernández',
    role: 'Psicólogo Clínico',
    location: 'Barranquilla, Colombia',
    rating: 5,
    avatar: 'LH'
  },
  {
    id: 5,
    content: 'La facturación electrónica y los reportes financieros me dan una visión clara de mi práctica. Excelente relación calidad-precio comparado con otras soluciones del mercado.',
    author: 'Dra. Patricia López',
    role: 'Dermatóloga',
    location: 'Cartagena, Colombia',
    rating: 5,
    avatar: 'PL'
  }
];

const TestimonialsSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section id="testimonials" className="py-24 lg:py-32 bg-muted/30 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
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
            Testimonios
          </motion.span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Lo que dicen{' '}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              nuestros clientes
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Miles de profesionales de la salud confían en Ker Hub para gestionar su práctica médica.
          </p>
        </motion.div>

        {/* Testimonials Carousel */}
        <div className="relative max-w-4xl mx-auto">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
            className="bg-card border border-border/50 rounded-3xl p-8 lg:p-12 shadow-xl"
          >
            {/* Quote Icon */}
            <Quote className="w-12 h-12 text-primary/20 mb-6" />
            
            {/* Content */}
            <p className="text-xl lg:text-2xl text-foreground leading-relaxed mb-8">
              "{testimonials[currentIndex].content}"
            </p>

            {/* Author */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-semibold text-lg">
                  {testimonials[currentIndex].avatar}
                </div>
                <div>
                  <div className="font-semibold text-lg">{testimonials[currentIndex].author}</div>
                  <div className="text-muted-foreground">{testimonials[currentIndex].role}</div>
                  <div className="text-sm text-muted-foreground">{testimonials[currentIndex].location}</div>
                </div>
              </div>
              
              {/* Rating */}
              <div className="flex gap-1">
                {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={prevTestimonial}
              className="rounded-full w-12 h-12"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'bg-primary w-8' 
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={nextTestimonial}
              className="rounded-full w-12 h-12"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-16"
        >
          {[
            { value: '2,500+', label: 'Profesionales activos' },
            { value: '1.2M', label: 'Citas gestionadas' },
            { value: '98%', label: 'Satisfacción' },
            { value: '4.9/5', label: 'Calificación promedio' }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-primary mb-1">{stat.value}</div>
              <div className="text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
