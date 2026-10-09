
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
import { SimpleTable, type SimpleColumn } from "@/components/kit/table";

type PlanValue = string | boolean;

interface ComparisonRow {
  feature: string;
  help?: string;
  basic: PlanValue;
  professional: PlanValue;
  institutional: PlanValue;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  { feature: "Límite de pacientes", help: "Número máximo de perfiles de pacientes que se pueden crear", basic: "100", professional: "Ilimitados", institutional: "Ilimitados" },
  { feature: "Usuarios", basic: "1", professional: "Hasta 3", institutional: "Hasta 10" },
  { feature: "Formularios personalizados", basic: "5", professional: "Ilimitados", institutional: "Ilimitados" },
  { feature: "Telemedicina", basic: false, professional: true, institutional: true },
  { feature: "Facturación electrónica", basic: false, professional: true, institutional: true },
  { feature: "Almacenamiento", basic: "500 MB", professional: "5 GB", institutional: "25 GB" },
  { feature: "Soporte", basic: "Correo", professional: "Correo y chat", institutional: "Correo, chat y teléfono" },
  { feature: "Personalización de marca", basic: false, professional: "Básica", institutional: "Completa" },
  { feature: "Reportes avanzados", basic: false, professional: true, institutional: true },
  { feature: "API para integraciones", basic: false, professional: false, institutional: true },
];

function ComparisonValue({ value }: { value: PlanValue }) {
  if (value === true) return <><Check aria-hidden className="mx-auto h-4 w-4 text-[hsl(var(--success))]" /><span className="sr-only">Incluido</span></>;
  if (value === false) return <><X aria-hidden className="mx-auto h-4 w-4 text-muted-foreground/60" /><span className="sr-only">No incluido</span></>;
  return <>{value}</>;
}

const COMPARISON_COLUMNS: SimpleColumn<ComparisonRow>[] = [
  {
    id: "feature", title: "Característica", primary: true,
    cell: (f) => (
      <span className="inline-flex items-center gap-1">
        {f.feature}
        {f.help && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger aria-label={f.help}>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>{f.help}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </span>
    ),
  },
  { id: "basic", title: "Básico", cell: (f) => <ComparisonValue value={f.basic} />, className: "text-center" },
  { id: "professional", title: "Profesional", cell: (f) => <ComparisonValue value={f.professional} />, className: "text-center" },
  { id: "institutional", title: "Institucional", cell: (f) => <ComparisonValue value={f.institutional} />, className: "text-center" },
];

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
                    {plan.features.map((feature) => (
                      <li 
                        key={feature.name} 
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
          <SimpleTable
            className="mb-12"
            columns={COMPARISON_COLUMNS}
            rows={COMPARISON_ROWS}
            rowKey={(f) => f.feature}
          />
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
