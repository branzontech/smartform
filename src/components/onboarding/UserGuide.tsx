import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle, Users, Calendar, FileText, BarChart3, Settings, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface GuideStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
}

const guideSteps: GuideStep[] = [
  {
    id: 1,
    title: "¡Bienvenido al Sistema de Gestión Médica!",
    description: "Te ayudaremos a conocer las principales funcionalidades del sistema para que puedas aprovechar al máximo todas sus características.",
    icon: <Stethoscope className="h-8 w-8 text-purple-600" />,
    features: [
      "Gestión completa de pacientes",
      "Sistema de citas integrado",
      "Historiales médicos digitales",
      "Reportes y estadísticas"
    ]
  },
  {
    id: 2,
    title: "Gestión de Pacientes",
    description: "Administra toda la información de tus pacientes de manera centralizada y segura.",
    icon: <Users className="h-8 w-8 text-blue-600" />,
    features: [
      "Registro completo de pacientes",
      "Historial médico detallado",
      "Seguimiento de consultas",
      "Alertas y recordatorios"
    ]
  },
  {
    id: 3,
    title: "Sistema de Citas",
    description: "Programa y gestiona las citas de manera eficiente con nuestro calendario inteligente.",
    icon: <Calendar className="h-8 w-8 text-green-600" />,
    features: [
      "Calendario visual intuitivo",
      "Horarios disponibles",
      "Confirmación automática",
      "Reprogramación fácil"
    ]
  },
  {
    id: 4,
    title: "Formularios Dinámicos",
    description: "Crea formularios personalizados para diferentes especialidades médicas.",
    icon: <FileText className="h-8 w-8 text-orange-600" />,
    features: [
      "Editor de formularios intuitivo",
      "Campos especializados médicos",
      "Firmas digitales",
      "Exportación de documentos"
    ]
  },
  {
    id: 5,
    title: "Reportes y Estadísticas",
    description: "Obtén insights valiosos sobre tu práctica médica con reportes detallados.",
    icon: <BarChart3 className="h-8 w-8 text-red-600" />,
    features: [
      "Dashboard ejecutivo",
      "Gráficos interactivos",
      "Exportación de datos",
      "Métricas de rendimiento"
    ]
  },
  {
    id: 6,
    title: "¡Todo Listo!",
    description: "Ya conoces las principales funcionalidades. ¡Comienza a usar el sistema y optimiza tu práctica médica!",
    icon: <CheckCircle className="h-8 w-8 text-green-600" />,
    features: [
      "Explora el menú principal",
      "Configura tu perfil",
      "Importa tus datos existentes",
      "Contacta soporte si necesitas ayuda"
    ]
  }
];

interface UserGuideProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const UserGuide: React.FC<UserGuideProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleNext = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip();
  };

  const currentStepData = guideSteps[currentStep];
  const progress = ((currentStep + 1) / guideSteps.length) * 100;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                Paso {currentStep + 1} de {guideSteps.length}
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleSkip} className="text-gray-500 hover:text-gray-700">
                Omitir guía
              </Button>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSkip}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Barra de progreso */}
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-4">
            <div 
              className="bg-purple-600 h-1.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              {currentStepData.icon}
            </div>
            <CardTitle className="text-2xl font-bold mb-4 text-gray-900">
              {currentStepData.title}
            </CardTitle>
            <p className="text-gray-600 text-lg leading-relaxed">
              {currentStepData.description}
            </p>
          </div>

          {/* Características destacadas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            {currentStepData.features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>

          {/* Botones de navegación */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Anterior</span>
            </Button>

            <div className="flex space-x-2">
              {guideSteps.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                  onClick={() => setCurrentStep(index)}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700"
            >
              <span>{currentStep === guideSteps.length - 1 ? 'Finalizar' : 'Siguiente'}</span>
              {currentStep === guideSteps.length - 1 ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};