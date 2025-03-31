
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from 'react-markdown';

interface PlanTratamientoProps {
  plan: string;
  nombrePaciente: string;
  onPrint: () => void;
  onDownload: () => void;
}

export function PlanTratamiento({ plan, nombrePaciente, onPrint, onDownload }: PlanTratamientoProps) {
  return (
    <Card className="border-purple-200 dark:border-purple-800">
      <CardHeader className="bg-purple-50 dark:bg-purple-900/30 border-b border-purple-100 dark:border-purple-800 flex flex-row justify-between items-center">
        <div>
          <Badge variant="outline" className="mb-2 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700">
            Plan de Tratamiento
          </Badge>
          <CardTitle className="text-xl text-purple-800 dark:text-purple-300">
            {nombrePaciente}
          </CardTitle>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onPrint}
            className="border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30"
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onDownload}
            className="border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30"  
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="prose dark:prose-invert max-w-none prose-headings:text-purple-800 dark:prose-headings:text-purple-300 prose-headings:font-semibold">
          <ReactMarkdown>
            {plan}
          </ReactMarkdown>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-800 p-4 text-xs text-gray-500 dark:text-gray-400">
        Este plan de tratamiento fue generado con asistencia de IA y debe ser revisado por un profesional de la salud mental.
      </CardFooter>
    </Card>
  );
}
