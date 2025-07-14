import React from 'react';
import { ContentComponentProps } from '../types';
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

export const MedicationContent: React.FC<ContentComponentProps> = ({ 
  question, 
  onUpdate, 
  readOnly = false 
}) => {
  return (
    <div className="space-y-4">
      <Card className="border-dashed border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            Configuración de Medicamentos e Insumos
          </CardTitle>
          <CardDescription className="text-xs">
            Este componente permite solicitar y administrar medicamentos e insumos durante la consulta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• Los usuarios podrán buscar y solicitar medicamentos</p>
            <p>• Se puede especificar cantidad y prioridad</p>
            <p>• Incluye control de inventario en tiempo real</p>
            <p>• Historial de solicitudes por consulta</p>
          </div>
        </CardContent>
      </Card>
      
      {!readOnly && (
        <div className="text-xs text-muted-foreground p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="font-medium mb-1">💡 Información del componente:</p>
          <p>Este componente se renderizará automáticamente en el formulario de consulta, permitiendo al médico solicitar medicamentos e insumos necesarios para la atención del paciente.</p>
        </div>
      )}
    </div>
  );
};