import React, { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Eye, 
  Plus,
  FileText,
  Trash2,
  Copy,
  Smartphone,
  Clock
} from 'lucide-react';
import { WorkflowStep, WorkflowStepConfig } from '@/types/workflow-types';

interface WorkflowSidebarProps {
  selectedStep?: WorkflowStep | null;
  onAddStep: (stepType: WorkflowStep['type']) => void;
  onUpdateStep: (stepId: string, updates: Partial<WorkflowStep>) => void;
  onDeleteStep: (stepId: string) => void;
  onDuplicateStep: (stepId: string) => void;
}

const stepTypes = [
  {
    type: 'reminder' as const,
    title: 'Recordatorio',
    description: 'Envía notificaciones automáticas',
    icon: Bell,
    gradient: 'from-primary/20 to-secondary/20',
    iconColor: 'text-primary',
    borderColor: 'border-primary/30'
  },
  {
    type: 'monitoring' as const,
    title: 'Monitoreo',
    description: 'Supervisa y detecta eventos',
    icon: Eye,
    gradient: 'from-secondary/20 to-accent/20',
    iconColor: 'text-secondary',
    borderColor: 'border-secondary/30'
  }
];

const WorkflowSidebar: React.FC<WorkflowSidebarProps> = ({
  selectedStep,
  onAddStep,
  onUpdateStep,
  onDeleteStep,
  onDuplicateStep
}) => {
  const [activeTab, setActiveTab] = useState('nodes');

  const handleStepUpdate = (field: keyof WorkflowStep, value: any) => {
    if (selectedStep) {
      onUpdateStep(selectedStep.id, { [field]: value });
    }
  };

  const handleConfigUpdate = (field: keyof WorkflowStepConfig, value: any) => {
    if (selectedStep) {
      const updatedConfig = { ...selectedStep.config, [field]: value };
      onUpdateStep(selectedStep.id, { config: updatedConfig });
    }
  };

  const renderStepProperties = () => {
    if (!selectedStep) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
          <FileText className="h-12 w-12 mb-3 opacity-50" />
          <p className="text-sm text-center px-4">
            Selecciona un elemento en el canvas para configurar sus propiedades
          </p>
        </div>
      );
    }

    const stepType = stepTypes.find(type => type.type === selectedStep.type);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {stepType && <stepType.icon className={`h-4 w-4 ${stepType.iconColor}`} />}
            <h3 className="font-semibold text-sm">Configuración</h3>
          </div>
          <div className="flex gap-1">
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => onDuplicateStep(selectedStep.id)}
              className="h-8 w-8 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => onDeleteStep(selectedStep.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div>
            <Label htmlFor="step-title" className="text-xs font-medium text-muted-foreground">
              NOMBRE
            </Label>
            <Input
              id="step-title"
              value={selectedStep.title}
              onChange={(e) => handleStepUpdate('title', e.target.value)}
              className="mt-1.5 h-9"
              placeholder="Nombre del paso"
            />
          </div>

          <div>
            <Label htmlFor="step-description" className="text-xs font-medium text-muted-foreground">
              DESCRIPCIÓN
            </Label>
            <Textarea
              id="step-description"
              value={selectedStep.description}
              onChange={(e) => handleStepUpdate('description', e.target.value)}
              className="mt-1.5 min-h-[60px] resize-none"
              placeholder="Describe qué hace este paso..."
            />
          </div>
        </div>

        <Separator />

        {renderTypeSpecificConfig()}
      </div>
    );
  };

  const renderTypeSpecificConfig = () => {
    if (!selectedStep) return null;

    switch (selectedStep.type) {
      case 'reminder':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">
                CANAL DE ENVÍO
              </Label>
              <Select
                value={selectedStep.config?.reminderType || 'email'}
                onValueChange={(value) => handleConfigUpdate('reminderType', value)}
              >
                <SelectTrigger className="mt-1.5 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      SMS
                    </div>
                  </SelectItem>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Email
                    </div>
                  </SelectItem>
                  <SelectItem value="both">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      SMS + Email
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium text-muted-foreground">
                RETRASO (HORAS)
              </Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={selectedStep.config?.delay || 0}
                  onChange={(e) => handleConfigUpdate('delay', parseInt(e.target.value))}
                  min="0"
                  max="168"
                  className="h-9"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-muted-foreground">
                MENSAJE PERSONALIZADO
              </Label>
              <Textarea
                value={selectedStep.config?.reminderMessage || ''}
                onChange={(e) => handleConfigUpdate('reminderMessage', e.target.value)}
                className="mt-1.5 min-h-[80px] resize-none"
                placeholder="Ejemplo: Recuerda tomar tu medicación diaria a las 8:00 AM"
              />
            </div>
          </div>
        );

      case 'monitoring':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">
                EVENTO A MONITOREAR
              </Label>
              <Select
                value={selectedStep.config?.monitoringType || 'no_response'}
                onValueChange={(value) => handleConfigUpdate('monitoringType', value)}
              >
                <SelectTrigger className="mt-1.5 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_response">Sin Respuesta del Paciente</SelectItem>
                  <SelectItem value="missed_appointment">Cita Perdida</SelectItem>
                  <SelectItem value="medication_adherence">Falta de Adherencia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium text-muted-foreground">
                TIEMPO LÍMITE (HORAS)
              </Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={selectedStep.config?.timeframe || 24}
                  onChange={(e) => handleConfigUpdate('timeframe', parseInt(e.target.value))}
                  min="1"
                  max="720"
                  className="h-9"
                  placeholder="24"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-muted-foreground">
                ACCIÓN DE ALERTA
              </Label>
              <Select
                value={selectedStep.config?.alertAction || 'notify_staff'}
                onValueChange={(value) => handleConfigUpdate('alertAction', value)}
              >
                <SelectTrigger className="mt-1.5 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="notify_staff">Notificar al Personal</SelectItem>
                  <SelectItem value="send_patient_message">Enviar Mensaje al Paciente</SelectItem>
                  <SelectItem value="escalate_doctor">Escalar al Médico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Sidebar className="w-80 border-r bg-sidebar">
      <SidebarContent className="p-0">
        <div className="h-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="border-b bg-sidebar/50 p-4">
              <TabsList className="grid w-full grid-cols-2 h-9">
                <TabsTrigger value="nodes" className="text-xs">
                  Elementos
                </TabsTrigger>
                <TabsTrigger value="properties" className="text-xs">
                  Propiedades
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="nodes" className="flex-1 mt-0 p-4 space-y-4">
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Agregar Elementos
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <div className="space-y-2">
                    {stepTypes.map((stepType) => (
                      <Card 
                        key={stepType.type}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md border ${stepType.borderColor} bg-gradient-to-r ${stepType.gradient} hover:scale-[1.02]`}
                        onClick={() => onAddStep(stepType.type)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-md bg-background ${stepType.iconColor}`}>
                              <stepType.icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm text-foreground">{stepType.title}</div>
                              <div className="text-xs text-muted-foreground">{stepType.description}</div>
                            </div>
                            <Plus className={`h-4 w-4 ${stepType.iconColor}`} />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>

              <div className="border-t pt-4">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Instrucciones
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Arrastra elementos al canvas para crear tu flujo</p>
                  <p>• Conecta elementos arrastrando desde los puntos de conexión</p>
                  <p>• Selecciona elementos para configurar sus propiedades</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="properties" className="flex-1 mt-0 p-4">
              {renderStepProperties()}
            </TabsContent>
          </Tabs>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

export default WorkflowSidebar;