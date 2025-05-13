
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTenant } from '@/contexts/TenantContext';
import { CreditCard, AlertTriangle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TenantStatusBar = () => {
  const { tenant, isTrialActive, daysLeftInTrial, isPlanExpired, plan } = useTenant();

  if (!tenant) return null;

  // Si el plan está expirado, mostrar alerta de reactivación
  if (isPlanExpired) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle>Tu suscripción ha expirado</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>Por favor, actualiza tu información de pago para continuar usando MediForm.</span>
          <Button variant="outline" size="sm" asChild>
            <Link to="/app/precios">
              <CreditCard className="mr-2 h-4 w-4" />
              Reactivar suscripción
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Si está en periodo de prueba, mostrar días restantes
  if (isTrialActive && daysLeftInTrial !== null) {
    const progressValue = Math.max(0, Math.min(100, (daysLeftInTrial / 14) * 100));
    
    return (
      <Alert className="mb-4 border-primary/50 bg-primary/5">
        <Clock className="h-5 w-5 text-primary" />
        <AlertTitle>Período de prueba activo</AlertTitle>
        <AlertDescription>
          <div className="flex items-center justify-between mb-2">
            <span>Te quedan {daysLeftInTrial} día{daysLeftInTrial !== 1 ? 's' : ''} de prueba gratuita</span>
            <Button variant="outline" size="sm" asChild>
              <Link to="/app/precios">
                <CreditCard className="mr-2 h-4 w-4" />
                Elegir plan
              </Link>
            </Button>
          </div>
          <Progress value={progressValue} className="h-2" />
        </AlertDescription>
      </Alert>
    );
  }

  // Si hay un tenant con un plan activo, no mostrar nada
  return null;
};

export default TenantStatusBar;
