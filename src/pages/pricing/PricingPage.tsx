
import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, HelpCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "@/hooks/use-toast";

const PricingPage = () => {
  const [billingAnnual, setBillingAnnual] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const { plan: currentPlan, isTrialActive, daysLeftInTrial } = useTenant();
  const navigate = useNavigate();
  
  const discount = 20; // 20% discount for annual billing
  
  const plans = [
    {
      id: "basic",
      name: "Básico",
      description: "Ideal para profesionales independientes que inician su práctica digital.",
      monthlyPrice: 19.99,
      features: [
        { name: "Hasta 100 pacientes", included: true },
        { name: "Formularios médicos básicos", included: true },
        { name: "Agenda de citas", included: true },
        { name: "1 usuario", included: true },
        { name: "Historial clínico básico", included: true },
        { name: "Telemedicina", included: false },
        { name: "Facturación electrónica", included: false },
        { name: "Reportes avanzados", included: false },
        { name: "Personal de soporte dedicado", included: false },
      ],
      popular: false,
      ctaText: "Comenzar",
    },
    {
      id: "professional",
      name: "Profesional",
      description: "Perfecto para consultorios establecidos que buscan optimizar su operación.",
      monthlyPrice: 39.99,
      features: [
        { name: "Pacientes ilimitados", included: true },
        { name: "Todos los formularios médicos", included: true },
        { name: "Agenda y recordatorios", included: true },
        { name: "Hasta 3 usuarios", included: true },
        { name: "Historial clínico completo", included: true },
        { name: "Telemedicina", included: true },
        { name: "Facturación electrónica", included: true },
        { name: "Reportes avanzados", included: true },
        { name: "Soporte prioritario", included: false },
      ],
      popular: true,
      ctaText: "Seleccionar plan",
    },
    {
      id: "institutional",
      name: "Institucional",
      description: "Diseñado para clínicas y hospitales con múltiples profesionales de la salud.",
      monthlyPrice: 99.99,
      features: [
        { name: "Pacientes ilimitados", included: true },
        { name: "Todos los formularios médicos", included: true },
        { name: "Agenda y recordatorios avanzados", included: true },
        { name: "Hasta 10 usuarios", included: true },
        { name: "Historial clínico completo", included: true },
        { name: "Telemedicina con salas múltiples", included: true },
        { name: "Facturación y contabilidad", included: true },
        { name: "Reportes personalizados", included: true },
        { name: "Personal de soporte dedicado", included: true },
      ],
      popular: false,
      ctaText: "Contactar ventas",
    },
  ];

  const handleSelectPlan = (planId: string) => {
    if (planId === "institutional") {
      navigate("/app/contacto-ventas");
      return;
    }
    
    if (!currentPlan) {
      navigate(`/app/registro?plan=${planId}&billing=${billingAnnual ? 'annual' : 'monthly'}`);
      return;
    }
    
    // Si ya tiene un plan, muestra confirmación de cambio de plan
    toast({
      title: "Cambio de plan",
      description: `Estás a punto de cambiar al plan ${planId}. Se te redirigirá a la página de pago.`,
      action: (
        <Button variant="outline" onClick={() => navigate(`/app/checkout?plan=${planId}&billing=${billingAnnual ? 'annual' : 'monthly'}`)}>
          Continuar
        </Button>
      )
    });
  };

  return (
    <Layout>
      <div className="container py-10">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-4xl font-bold mb-4">Planes y Precios</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Elige el plan perfecto para tu práctica médica y comienza a optimizar tu consultorio hoy mismo
          </p>
          
          {isTrialActive && daysLeftInTrial !== null && (
            <div className="bg-primary/10 p-4 rounded-lg mb-6 border border-primary/30">
              <p className="font-medium">
                Tu período de prueba termina en {daysLeftInTrial} día{daysLeftInTrial !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-muted-foreground">
                Selecciona un plan para continuar usando MediForm después del período de prueba
              </p>
            </div>
          )}
          
          <div className="flex items-center justify-center gap-2 mb-8">
            <Label htmlFor="billing-toggle" className={!billingAnnual ? "font-bold" : ""}>Mensual</Label>
            <Switch
              id="billing-toggle"
              checked={billingAnnual}
              onCheckedChange={setBillingAnnual}
            />
            <Label htmlFor="billing-toggle" className={billingAnnual ? "font-bold" : ""}>
              Anual <Badge variant="outline" className="ml-1 bg-green-50 text-green-700">Ahorra {discount}%</Badge>
            </Label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.id;
            const monthlyPrice = plan.monthlyPrice;
            const annualPrice = plan.monthlyPrice * (1 - discount/100);
            const displayPrice = billingAnnual ? annualPrice : monthlyPrice;
            
            return (
              <Card 
                key={plan.id} 
                className={`flex flex-col ${plan.popular ? 'border-primary shadow-lg relative' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1">
                    Más popular
                  </Badge>
                )}
                {isCurrentPlan && (
                  <Badge className="absolute -top-3 right-3 bg-green-500">
                    Tu plan actual
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">${displayPrice.toFixed(2)}</span>
                    <span className="text-muted-foreground"> /mes</span>
                    {billingAnnual && (
                      <div className="text-sm text-muted-foreground">Facturado anualmente</div>
                    )}
                  </div>
                  
                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li 
                        key={idx} 
                        className="flex items-start gap-2"
                      >
                        {feature.included ? (
                          <Check className="h-5 w-5 text-green-500 mt-0.5" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300 mt-0.5" />
                        )}
                        <span className={!feature.included ? "text-muted-foreground" : ""}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? "Plan actual" : plan.ctaText}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="text-center mb-8">
          <Button 
            variant="link" 
            onClick={() => setShowComparison(!showComparison)}
            className="text-lg"
          >
            {showComparison ? "Ocultar" : "Mostrar"} comparación detallada de planes
          </Button>
        </div>
        
        {showComparison && (
          <div className="rounded-lg border overflow-hidden mb-12">
            <table className="w-full">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-4 border-b">Característica</th>
                  <th className="text-center p-4 border-b">Básico</th>
                  <th className="text-center p-4 border-b">Profesional</th>
                  <th className="text-center p-4 border-b">Institucional</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-4 border-b flex items-center">
                    Límite de pacientes
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 ml-1 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Número máximo de perfiles de pacientes que se pueden crear
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                  <td className="p-4 border-b text-center">100</td>
                  <td className="p-4 border-b text-center">Ilimitados</td>
                  <td className="p-4 border-b text-center">Ilimitados</td>
                </tr>
                <tr>
                  <td className="p-4 border-b">Usuarios</td>
                  <td className="p-4 border-b text-center">1</td>
                  <td className="p-4 border-b text-center">Hasta 3</td>
                  <td className="p-4 border-b text-center">Hasta 10</td>
                </tr>
                <tr>
                  <td className="p-4 border-b">Formularios personalizados</td>
                  <td className="p-4 border-b text-center">5</td>
                  <td className="p-4 border-b text-center">Ilimitados</td>
                  <td className="p-4 border-b text-center">Ilimitados</td>
                </tr>
                <tr>
                  <td className="p-4 border-b">Telemedicina</td>
                  <td className="p-4 border-b text-center"><X className="h-5 w-5 text-gray-400 mx-auto" /></td>
                  <td className="p-4 border-b text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="p-4 border-b text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4 border-b">Facturación electrónica</td>
                  <td className="p-4 border-b text-center"><X className="h-5 w-5 text-gray-400 mx-auto" /></td>
                  <td className="p-4 border-b text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="p-4 border-b text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4 border-b">Almacenamiento</td>
                  <td className="p-4 border-b text-center">500MB</td>
                  <td className="p-4 border-b text-center">5GB</td>
                  <td className="p-4 border-b text-center">25GB</td>
                </tr>
                <tr>
                  <td className="p-4 border-b">Soporte</td>
                  <td className="p-4 border-b text-center">Email</td>
                  <td className="p-4 border-b text-center">Email + Chat</td>
                  <td className="p-4 border-b text-center">Email + Chat + Teléfono</td>
                </tr>
                <tr>
                  <td className="p-4 border-b">Personalización de marca</td>
                  <td className="p-4 border-b text-center"><X className="h-5 w-5 text-gray-400 mx-auto" /></td>
                  <td className="p-4 border-b text-center">Básica</td>
                  <td className="p-4 border-b text-center">Completa</td>
                </tr>
                <tr>
                  <td className="p-4 border-b">Reportes avanzados</td>
                  <td className="p-4 border-b text-center"><X className="h-5 w-5 text-gray-400 mx-auto" /></td>
                  <td className="p-4 border-b text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="p-4 border-b text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4 border-b">API para integraciones</td>
                  <td className="p-4 border-b text-center"><X className="h-5 w-5 text-gray-400 mx-auto" /></td>
                  <td className="p-4 border-b text-center"><X className="h-5 w-5 text-gray-400 mx-auto" /></td>
                  <td className="p-4 border-b text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="max-w-3xl mx-auto bg-muted/50 rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-4">Preguntas frecuentes</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">¿Puedo cambiar de plan después?</h3>
              <p className="text-muted-foreground">Sí, puedes actualizar o cambiar tu plan en cualquier momento. Los cambios se aplicarán inmediatamente.</p>
            </div>
            <div>
              <h3 className="font-medium">¿Qué métodos de pago aceptan?</h3>
              <p className="text-muted-foreground">Aceptamos todas las tarjetas de crédito y débito principales (Visa, Mastercard, American Express).</p>
            </div>
            <div>
              <h3 className="font-medium">¿Los precios incluyen impuestos?</h3>
              <p className="text-muted-foreground">Los precios mostrados no incluyen IVA. El impuesto aplicable se añadirá durante el proceso de pago.</p>
            </div>
            <div>
              <h3 className="font-medium">¿Puedo cancelar mi suscripción?</h3>
              <p className="text-muted-foreground">Puedes cancelar tu suscripción en cualquier momento desde tu panel de administración. No hay contratos a largo plazo.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PricingPage;
