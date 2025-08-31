import React, { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Mail, 
  Bell, 
  Eye, 
  GitBranch, 
  Plus,
  Settings,
  FileText,
  Trash2,
  Copy,
  Calendar,
  MessageSquare,
  BookOpen,
  UserCheck,
  AlertTriangle,
  UserX,
  PillBottle,
  Clock,
  Smartphone
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
    type: 'trigger' as const,
    title: 'Activador',
    description: 'Inicia el workflow',
    icon: Play,
    color: 'bg-green-100 text-green-800 border-green-300'
  },
  {
    type: 'task' as const,
    title: 'Tarea',
    description: 'Ejecuta una acción',
    icon: Mail,
    color: 'bg-orange-100 text-orange-800 border-orange-300'
  },
  {
    type: 'reminder' as const,
    title: 'Recordatorio',
    description: 'Envía notificaciones',
    icon: Bell,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300'
  },
  {
    type: 'monitoring' as const,
    title: 'Monitoreo',
    description: 'Supervisa condiciones',
    icon: Eye,
    color: 'bg-red-100 text-red-800 border-red-300'
  },
  {
    type: 'condition' as const,
    title: 'Condición',
    description: 'Ramifica el flujo',
    icon: GitBranch,
    color: 'bg-purple-100 text-purple-800 border-purple-300'
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
        <div className="p-4 text-center text-muted-foreground">
          <FileText className="mx-auto h-12 w-12 mb-2 opacity-50" />
          <p>Selecciona un paso para ver sus propiedades</p>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Propiedades del Paso</h3>
          <div className="flex gap-1">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onDuplicateStep(selectedStep.id)}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onDeleteStep(selectedStep.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Propiedades Básicas */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="step-title">Título</Label>
            <Input
              id="step-title"
              value={selectedStep.title}
              onChange={(e) => handleStepUpdate('title', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="step-description">Descripción</Label>
            <Textarea
              id="step-description"
              value={selectedStep.description}
              onChange={(e) => handleStepUpdate('description', e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        <Separator />

        {/* Configuración Específica por Tipo */}
        {renderTypeSpecificConfig()}
      </div>
    );
  };

  const renderTypeSpecificConfig = () => {
    if (!selectedStep) return null;

    switch (selectedStep.type) {
      case 'trigger':
        return (
          <div className="space-y-3">
            <Label>Tipo de Activador</Label>
            <Select
              value={selectedStep.config?.triggerType || 'manual'}
              onValueChange={(value) => handleConfigUpdate('triggerType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consultation_completed">Consulta Completada</SelectItem>
                <SelectItem value="appointment_created">Cita Creada</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 'task':
        return (
          <div className="space-y-3">
            <div>
              <Label>Tipo de Tarea</Label>
              <Select
                value={selectedStep.config?.taskType || 'send_reminder'}
                onValueChange={(value) => handleConfigUpdate('taskType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="send_reminder">Enviar Recordatorio</SelectItem>
                  <SelectItem value="schedule_appointment">Programar Cita</SelectItem>
                  <SelectItem value="send_survey">Enviar Encuesta</SelectItem>
                  <SelectItem value="send_educational_material">Material Educativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Retraso (horas)</Label>
              <Input
                type="number"
                value={selectedStep.config?.delay || 0}
                onChange={(e) => handleConfigUpdate('delay', parseInt(e.target.value))}
                min="0"
                max="168"
              />
            </div>
          </div>
        );

      case 'reminder':
        return (
          <div className="space-y-3">
            <div>
              <Label>Tipo de Recordatorio</Label>
              <Select
                value={selectedStep.config?.reminderType || 'email'}
                onValueChange={(value) => handleConfigUpdate('reminderType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="both">SMS + Email</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Mensaje del Recordatorio</Label>
              <Textarea
                value={selectedStep.config?.reminderMessage || ''}
                onChange={(e) => handleConfigUpdate('reminderMessage', e.target.value)}
                rows={3}
                placeholder="Escriba el mensaje del recordatorio..."
              />
            </div>
          </div>
        );

      case 'monitoring':
        return (
          <div className="space-y-3">
            <div>
              <Label>Tipo de Monitoreo</Label>
              <Select
                value={selectedStep.config?.monitoringType || 'no_response'}
                onValueChange={(value) => handleConfigUpdate('monitoringType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_response">Sin Respuesta</SelectItem>
                  <SelectItem value="missed_appointment">Cita Perdida</SelectItem>
                  <SelectItem value="medication_adherence">Adherencia Medicación</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tiempo Límite (horas)</Label>
              <Input
                type="number"
                value={selectedStep.config?.timeframe || 24}
                onChange={(e) => handleConfigUpdate('timeframe', parseInt(e.target.value))}
                min="1"
                max="720"
              />
            </div>
          </div>
        );

      case 'condition':
        return (
          <div className="space-y-3">
            <div>
              <Label>Condición</Label>
              <Textarea
                value={selectedStep.config?.condition || ''}
                onChange={(e) => handleConfigUpdate('condition', e.target.value)}
                rows={3}
                placeholder="Defina la condición a evaluar..."
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Sidebar className="w-80 border-r">
      <SidebarContent>
        <div className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="nodes">Nodos</TabsTrigger>
              <TabsTrigger value="properties">Propiedades</TabsTrigger>
            </TabsList>

            <TabsContent value="nodes" className="mt-4">
              <SidebarGroup>
                <SidebarGroupLabel>Agregar Pasos</SidebarGroupLabel>
                <SidebarGroupContent>
                  <div className="space-y-2">
                    {stepTypes.map((stepType) => (
                      <Card 
                        key={stepType.type}
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${stepType.color} border-2`}
                        onClick={() => onAddStep(stepType.type)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            <stepType.icon className="h-4 w-4" />
                            <div>
                              <div className="font-medium text-sm">{stepType.title}</div>
                              <div className="text-xs opacity-80">{stepType.description}</div>
                            </div>
                            <Plus className="h-4 w-4 ml-auto" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>

              <Separator className="my-4" />

              <SidebarGroup>
                <SidebarGroupLabel>Plantillas</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <UserCheck className="h-4 w-4" />
                        <span>Seguimiento Post-Consulta</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <Calendar className="h-4 w-4" />
                        <span>Recordatorio de Citas</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <PillBottle className="h-4 w-4" />
                        <span>Adherencia Medicación</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </TabsContent>

            <TabsContent value="properties" className="mt-4">
              {renderStepProperties()}
            </TabsContent>
          </Tabs>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

export default WorkflowSidebar;