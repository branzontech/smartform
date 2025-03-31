
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";

interface PlanAlimentacionProps {
  plan: string;
  nombrePaciente: string;
  onPrint: () => void;
  onDownload: () => void;
}

export function PlanAlimentacion({ plan, nombrePaciente, onPrint, onDownload }: PlanAlimentacionProps) {
  // Función para convertir texto plano en HTML con formato
  const formatPlan = (texto: string) => {
    // Convertir saltos de línea en <br>
    let formateado = texto.replace(/\n/g, "<br>");
    
    // Resaltar los títulos y secciones importantes
    formateado = formateado.replace(/^(Desayuno|Almuerzo|Cena|Merienda|Mañana|Tarde|Semana|Día \d+):/gmi, 
      "<strong class='text-purple-700 dark:text-purple-400 text-lg'>$1:</strong>");
    
    // Resaltar los valores nutricionales
    formateado = formateado.replace(/(Calorías|Proteínas|Carbohidratos|Grasas|Fibra):\s*([0-9.-]+)\s*(kcal|g|mg)/gi, 
      "<span class='text-gray-700 dark:text-gray-300'>$1: <strong>$2</strong> $3</span>");
    
    return { __html: formateado };
  };

  return (
    <Card className="border-purple-200 dark:border-purple-800 shadow-md">
      <CardHeader className="bg-purple-50 dark:bg-purple-900/30 border-b border-purple-100 dark:border-purple-800">
        <CardTitle className="text-xl text-purple-700 dark:text-purple-400">Plan de Alimentación Personalizado</CardTitle>
        <CardDescription>
          Preparado para: <span className="font-medium text-gray-800 dark:text-gray-200">{nombrePaciente}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={formatPlan(plan)}
        />
      </CardContent>
      <CardFooter className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 gap-3 flex justify-end">
        <Button variant="outline" size="sm" onClick={onPrint}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
        <Button variant="default" size="sm" onClick={onDownload}>
          <Download className="mr-2 h-4 w-4" />
          Descargar PDF
        </Button>
      </CardFooter>
    </Card>
  );
}
