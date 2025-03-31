
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Users, Calendar, BarChart, CheckCircle } from "lucide-react";

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Navigation Bar */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4 px-6 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-form-primary dark:text-white">Smart Forms</span>
          </div>
          <div className="space-x-4 hidden md:flex">
            <a href="#features" className="text-gray-700 dark:text-gray-300 hover:text-form-primary dark:hover:text-white transition-colors">Características</a>
            <a href="#benefits" className="text-gray-700 dark:text-gray-300 hover:text-form-primary dark:hover:text-white transition-colors">Beneficios</a>
            <a href="#pricing" className="text-gray-700 dark:text-gray-300 hover:text-form-primary dark:hover:text-white transition-colors">Precios</a>
          </div>
          <div>
            <Link to="/app">
              <Button variant="outline" className="mr-2">Iniciar sesión</Button>
            </Link>
            <Link to="/app">
              <Button className="bg-form-primary hover:bg-form-primary/90">Registrarse</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0 md:pr-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
              Gestión inteligente de formularios médicos
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Simplifica la administración de pacientes, citas y formularios médicos en una única plataforma intuitiva.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/app">
                <Button size="lg" className="w-full sm:w-auto bg-form-primary hover:bg-form-primary/90">
                  Comenzar ahora
                </Button>
              </Link>
              <a href="#demo">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Ver demostración
                </Button>
              </a>
            </div>
          </div>
          <div className="md:w-1/2">
            <img src="/placeholder.svg" alt="Smart Forms platform" className="rounded-lg shadow-xl" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-white dark:bg-gray-900">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-gray-900 dark:text-white">
            Características principales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg hover:shadow-lg transition-shadow">
              <div className="bg-form-primary/10 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-form-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Formularios personalizables</h3>
              <p className="text-gray-600 dark:text-gray-300">Crea formularios adaptados a tus necesidades específicas con una interfaz intuitiva.</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg hover:shadow-lg transition-shadow">
              <div className="bg-form-primary/10 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-form-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Gestión de pacientes</h3>
              <p className="text-gray-600 dark:text-gray-300">Administra historiales médicos y realiza un seguimiento personalizado de cada paciente.</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg hover:shadow-lg transition-shadow">
              <div className="bg-form-primary/10 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-form-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Sistema de citas</h3>
              <p className="text-gray-600 dark:text-gray-300">Programa y gestiona citas médicas con recordatorios automatizados.</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg hover:shadow-lg transition-shadow">
              <div className="bg-form-primary/10 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                <BarChart className="w-8 h-8 text-form-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Análisis y estadísticas</h3>
              <p className="text-gray-600 dark:text-gray-300">Visualiza datos importantes con gráficos y paneles intuitivos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-6 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-gray-900 dark:text-white">
            Beneficios para tu práctica médica
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-start">
              <CheckCircle className="text-form-primary mr-4 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Ahorro de tiempo</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Reduce el tiempo dedicado a tareas administrativas automatizando la gestión de formularios y citas.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="text-form-primary mr-4 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Menos errores</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Minimiza errores de transcripción con formularios digitales y validación automática.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="text-form-primary mr-4 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Mejor experiencia</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Ofrece una experiencia más fluida a tus pacientes con formularios digitales accesibles.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="text-form-primary mr-4 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Acceso desde cualquier lugar</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Accede a los datos de tus pacientes y consultas desde cualquier dispositivo con conexión a internet.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-white dark:bg-gray-900">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-gray-900 dark:text-white">
            Planes a tu medida
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-8 bg-white dark:bg-gray-800 hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Básico</h3>
              <div className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">$29<span className="text-lg text-gray-500 dark:text-gray-400">/mes</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <CheckCircle className="text-green-500 mr-2 h-5 w-5" />
                  <span>50 formularios mensuales</span>
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <CheckCircle className="text-green-500 mr-2 h-5 w-5" />
                  <span>Hasta 100 pacientes</span>
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <CheckCircle className="text-green-500 mr-2 h-5 w-5" />
                  <span>Gestión de citas básica</span>
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <CheckCircle className="text-green-500 mr-2 h-5 w-5" />
                  <span>Soporte por email</span>
                </li>
              </ul>
              <Link to="/app" className="block">
                <Button className="w-full">Comenzar gratis</Button>
              </Link>
            </div>
            <div className="border-2 border-form-primary rounded-lg p-8 bg-white dark:bg-gray-800 shadow-xl relative">
              <div className="absolute top-0 right-0 bg-form-primary text-white px-4 py-1 rounded-bl-lg rounded-tr-lg text-sm font-medium">Más popular</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Profesional</h3>
              <div className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">$69<span className="text-lg text-gray-500 dark:text-gray-400">/mes</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <CheckCircle className="text-green-500 mr-2 h-5 w-5" />
                  <span>Formularios ilimitados</span>
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <CheckCircle className="text-green-500 mr-2 h-5 w-5" />
                  <span>Hasta 500 pacientes</span>
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <CheckCircle className="text-green-500 mr-2 h-5 w-5" />
                  <span>Gestión avanzada de citas</span>
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <CheckCircle className="text-green-500 mr-2 h-5 w-5" />
                  <span>Análisis y estadísticas</span>
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <CheckCircle className="text-green-500 mr-2 h-5 w-5" />
                  <span>Soporte prioritario</span>
                </li>
              </ul>
              <Link to="/app" className="block">
                <Button className="w-full bg-form-primary hover:bg-form-primary/90">Elegir plan</Button>
              </Link>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-8 bg-white dark:bg-gray-800 hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Empresarial</h3>
              <div className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">$149<span className="text-lg text-gray-500 dark:text-gray-400">/mes</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <CheckCircle className="text-green-500 mr-2 h-5 w-5" />
                  <span>Formularios ilimitados</span>
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <CheckCircle className="text-green-500 mr-2 h-5 w-5" />
                  <span>Pacientes ilimitados</span>
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <CheckCircle className="text-green-500 mr-2 h-5 w-5" />
                  <span>Gestión avanzada de citas</span>
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <CheckCircle className="text-green-500 mr-2 h-5 w-5" />
                  <span>Análisis y reportes personalizados</span>
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <CheckCircle className="text-green-500 mr-2 h-5 w-5" />
                  <span>API para integraciones</span>
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <CheckCircle className="text-green-500 mr-2 h-5 w-5" />
                  <span>Soporte 24/7</span>
                </li>
              </ul>
              <Link to="/app" className="block">
                <Button className="w-full">Contactar ventas</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-6 bg-form-primary">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Empieza a optimizar tu consulta hoy mismo
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Únete a miles de profesionales de la salud que ya están optimizando su tiempo y mejorando la atención de sus pacientes.
          </p>
          <Link to="/app">
            <Button size="lg" className="bg-white text-form-primary hover:bg-gray-100">
              Comenzar prueba gratuita
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Smart Forms</h3>
              <p className="text-gray-400">La solución integral para la gestión de formularios y pacientes en el ámbito médico.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Producto</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Características</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Precios</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Integraciones</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Novedades</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Soporte</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Ayuda</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Centro de soporte</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contacto</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Estado del servicio</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Compañía</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Acerca de</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Empleos</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Prensa</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 mb-4 md:mb-0">© 2023 Smart Forms. Todos los derechos reservados.</p>
            <div className="space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Términos</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacidad</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
