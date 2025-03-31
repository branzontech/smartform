
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Download, Check, Clock, FileCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ReactMarkdown from 'react-markdown';

interface ProtocoloEvaluacionProps {
  protocolo: string;
  nombrePaciente: string;
  pruebasSeleccionadas: string[];
  onPrint: () => void;
  onDownload: () => void;
  onAplicarPrueba: (prueba: string) => void;
}

const nombresPruebas: Record<string, string> = {
  "beck": "Inventario de Depresión de Beck (BDI-II)",
  "stai": "Inventario de Ansiedad Estado-Rasgo (STAI)",
  "wais": "Escala Wechsler de Inteligencia para Adultos (WAIS-IV)",
  "wisc": "Escala Wechsler de Inteligencia para Niños (WISC-V)",
  "mmpi": "Inventario Multifásico de Personalidad de Minnesota (MMPI-2)",
  "scl90r": "Listado de Síntomas SCL-90-R",
  "16pf": "Cuestionario 16PF",
  "bai": "Inventario de Ansiedad de Beck (BAI)",
  "scid": "Entrevista Clínica Estructurada para el DSM-5 (SCID-5)",
  "mcmi": "Inventario Clínico Multiaxial de Millon (MCMI-IV)",
  "rorschach": "Test de Rorschach",
}

export function ProtocoloEvaluacion({ 
  protocolo, 
  nombrePaciente, 
  pruebasSeleccionadas, 
  onPrint, 
  onDownload,
  onAplicarPrueba
}: ProtocoloEvaluacionProps) {
  return (
    <Card className="border-purple-200 dark:border-purple-800">
      <CardHeader className="bg-purple-50 dark:bg-purple-900/30 border-b border-purple-100 dark:border-purple-800 flex flex-row justify-between items-center">
        <div>
          <Badge variant="outline" className="mb-2 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700">
            Protocolo de Evaluación
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
        <div className="mb-6">
          <h3 className="text-lg font-medium text-purple-800 dark:text-purple-300 mb-2">Pruebas a aplicar</h3>
          <Card className="border-gray-200 dark:border-gray-700">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prueba</TableHead>
                  <TableHead>Duración estimada</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pruebasSeleccionadas.map((pruebaId) => (
                  <TableRow key={pruebaId}>
                    <TableCell className="font-medium">{nombresPruebas[pruebaId] || pruebaId}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-500 mr-2" />
                        {pruebaId === "wais" || pruebaId === "wisc" ? "60-90 min" : 
                         pruebaId === "mmpi" || pruebaId === "mcmi" ? "45-60 min" : 
                         pruebaId === "rorschach" || pruebaId === "scid" ? "60 min" : "15-30 min"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm"
                        onClick={() => onAplicarPrueba(pruebaId)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <FileCheck className="h-4 w-4 mr-2" />
                        Aplicar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        <Separator className="my-6" />
      
        <div className="prose dark:prose-invert max-w-none prose-headings:text-purple-800 dark:prose-headings:text-purple-300 prose-headings:font-semibold">
          <ReactMarkdown>
            {protocolo}
          </ReactMarkdown>
        </div>
      </CardContent>
      
      <CardFooter className="bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-800 p-4 text-xs text-gray-500 dark:text-gray-400">
        Este protocolo de evaluación fue generado con asistencia de IA y debe ser revisado por un profesional de la salud mental.
      </CardFooter>
    </Card>
  );
}
