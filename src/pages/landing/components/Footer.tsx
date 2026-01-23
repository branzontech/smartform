import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Stethoscope, Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, Phone, MapPin } from 'lucide-react';

const footerLinks = {
  producto: [
    { name: 'Características', href: '#features' },
    { name: 'Planes y Precios', href: '#pricing' },
    { name: 'Integraciones', href: '#' },
    { name: 'Actualizaciones', href: '#' },
  ],
  recursos: [
    { name: 'Centro de Ayuda', href: '#' },
    { name: 'Documentación', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Webinars', href: '#' },
  ],
  empresa: [
    { name: 'Sobre Nosotros', href: '#' },
    { name: 'Contacto', href: '#demo' },
    { name: 'Carreras', href: '#' },
    { name: 'Partners', href: '#' },
  ],
  legal: [
    { name: 'Términos de Servicio', href: '#' },
    { name: 'Política de Privacidad', href: '#' },
    { name: 'Cookies', href: '#' },
    { name: 'HABEAS DATA', href: '#' },
  ],
};

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Youtube, href: '#', label: 'YouTube' },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border">
      {/* Main Footer */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">Smart Doctor</span>
              </div>
              <p className="text-muted-foreground mb-6 max-w-xs">
                La plataforma integral para profesionales de la salud. Gestiona tu práctica médica de manera eficiente.
              </p>
              
              {/* Contact Info */}
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <span>soporte@smartdoctor.co</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <span>+57 (1) 234 5678</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>Bogotá, Colombia</span>
                </div>
              </div>
            </motion.div>

            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links], index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <h4 className="font-semibold text-foreground mb-4 capitalize">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© {currentYear} Smart Doctor. Todos los derechos reservados.</p>
            <p>
              Hecho con ❤️ en Colombia 🇨🇴
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
