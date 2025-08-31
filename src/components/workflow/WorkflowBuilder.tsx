import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SidebarProvider } from '@/components/ui/sidebar';
import { 
  Play, 
  Save, 
  Eye, 
  Settings, 
  Plus,
  Workflow as WorkflowIcon,
  Activity,
  BarChart3
} from 'lucide-react';
import WorkflowCanvas from './WorkflowCanvas';
import WorkflowSidebar from './WorkflowSidebar';
import { Workflow, WorkflowStep, WorkflowConnection } from '@/types/workflow-types';
import { nanoid } from 'nanoid';

// Mock data para el workflow de seguimiento post-consulta
const mockPostConsultationWorkflow: Workflow = {
  id: 'post-consultation-workflow',
  name: 'Seguimiento Post-Consulta',
  description: 'Flujo automático de seguimiento después de completar una consulta médica',
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  triggerCount: 45,
  successRate: 87,
  steps: [
    {
      id: 'trigger-1',
      type: 'trigger',
      title: 'Consulta Completada',
      description: 'Se activa cuando el médico marca una consulta como completada',
      position: { x: 100, y: 100 },
      config: {
        triggerType: 'consultation_completed'
      }
    },
    {
      id: 'task-1',
      type: 'task',
      title: 'Enviar Recordatorio de Medicación',
      description: 'Envía un recordatorio automático para tomar la medicación prescrita',
      position: { x: 400, y: 50 },
      config: {
        taskType: 'send_reminder',
        delay: 2
      }
    },
    {
      id: 'task-2',
      type: 'task',
      title: 'Programar Cita de Seguimiento',
      description: 'Programa automáticamente la próxima cita de seguimiento',
      position: { x: 400, y: 150 },
      config: {
        taskType: 'schedule_appointment',
        delay: 24
      }
    },
    {
      id: 'task-3',
      type: 'task',
      title: 'Enviar Encuesta de Satisfacción',
      description: 'Solicita feedback sobre la consulta realizada',
      position: { x: 400, y: 250 },
      config: {
        taskType: 'send_survey',
        delay: 4
      }
    },
    {
      id: 'task-4',
      type: 'task',
      title: 'Material Educativo',
      description: 'Proporciona información relevante sobre la condición del paciente',
      position: { x: 700, y: 100 },
      config: {
        taskType: 'send_educational_material',
        delay: 12
      }
    },
    {
      id: 'reminder-1',
      type: 'reminder',
      title: 'Recordatorio de Cita',
      description: 'Recordatorio automático 24h antes de la cita de seguimiento',
      position: { x: 700, y: 250 },
      config: {
        reminderType: 'both'
      }
    },
    {
      id: 'monitoring-1',
      type: 'monitoring',
      title: 'Monitoreo de Asistencia',
      description: 'Alerta si el paciente no se presenta a su cita de seguimiento',
      position: { x: 1000, y: 200 },
      config: {
        monitoringType: 'missed_appointment',
        timeframe: 48
      }
    }
  ],
  connections: [
    { id: 'e1', source: 'trigger-1', target: 'task-1' },
    { id: 'e2', source: 'trigger-1', target: 'task-2' },
    { id: 'e3', source: 'trigger-1', target: 'task-3' },
    { id: 'e4', source: 'task-1', target: 'task-4' },
    { id: 'e5', source: 'task-2', target: 'reminder-1' },
    { id: 'e6', source: 'reminder-1', target: 'monitoring-1' },
  ]
};

interface WorkflowBuilderProps {
  workflow?: Workflow;
  onSave?: (workflow: Workflow) => void;
}

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({ 
  workflow = mockPostConsultationWorkflow,
  onSave
}) => {
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow>(workflow);
  const [activeTab, setActiveTab] = useState('canvas');
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);

  const handleStepsChange = (steps: WorkflowStep[]) => {
    setCurrentWorkflow(prev => ({
      ...prev,
      steps,
      updatedAt: new Date()
    }));
  };

  const handleConnectionsChange = (connections: WorkflowConnection[]) => {
    setCurrentWorkflow(prev => ({
      ...prev,
      connections,
      updatedAt: new Date()
    }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(currentWorkflow);
    }
  };

  const handleToggleActive = () => {
    setCurrentWorkflow(prev => ({
      ...prev,
      active: !prev.active,
      updatedAt: new Date()
    }));
  };

  const handleAddStep = (stepType: WorkflowStep['type']) => {
    const newStep: WorkflowStep = {
      id: nanoid(),
      type: stepType,
      title: `Nuevo ${stepType === 'trigger' ? 'Activador' : stepType === 'task' ? 'Tarea' : stepType === 'reminder' ? 'Recordatorio' : stepType === 'monitoring' ? 'Monitoreo' : 'Condición'}`,
      description: 'Descripción del paso',
      position: { x: 300, y: 200 },
      config: {}
    };

    setCurrentWorkflow(prev => ({
      ...prev,
      steps: [...prev.steps, newStep],
      updatedAt: new Date()
    }));
  };

  const handleUpdateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    setCurrentWorkflow(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      ),
      updatedAt: new Date()
    }));

    // Actualizar el step seleccionado si es el que se está editando
    if (selectedStep?.id === stepId) {
      setSelectedStep(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleDeleteStep = (stepId: string) => {
    setCurrentWorkflow(prev => ({
      ...prev,
      steps: prev.steps.filter(step => step.id !== stepId),
      connections: prev.connections.filter(
        conn => conn.source !== stepId && conn.target !== stepId
      ),
      updatedAt: new Date()
    }));

    // Limpiar selección si se elimina el step seleccionado
    if (selectedStep?.id === stepId) {
      setSelectedStep(null);
    }
  };

  const handleDuplicateStep = (stepId: string) => {
    const stepToDuplicate = currentWorkflow.steps.find(step => step.id === stepId);
    if (stepToDuplicate) {
      const duplicatedStep: WorkflowStep = {
        ...stepToDuplicate,
        id: nanoid(),
        title: `${stepToDuplicate.title} (Copia)`,
        position: {
          x: stepToDuplicate.position.x + 50,
          y: stepToDuplicate.position.y + 50
        }
      };

      setCurrentWorkflow(prev => ({
        ...prev,
        steps: [...prev.steps, duplicatedStep],
        updatedAt: new Date()
      }));
    }
  };

  const handleStepSelect = (stepId: string) => {
    const step = currentWorkflow.steps.find(s => s.id === stepId);
    setSelectedStep(step || null);
  };

  return (
    <SidebarProvider>
      <div className="h-full flex w-full">
        {/* Sidebar */}
        <WorkflowSidebar
          selectedStep={selectedStep}
          onAddStep={handleAddStep}
          onUpdateStep={handleUpdateStep}
          onDeleteStep={handleDeleteStep}
          onDuplicateStep={handleDuplicateStep}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="border-b p-4 bg-background">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <WorkflowIcon className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-xl font-semibold">{currentWorkflow.name}</h1>
                  <p className="text-sm text-muted-foreground">{currentWorkflow.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge 
                  variant={currentWorkflow.active ? "default" : "secondary"}
                  className="gap-1"
                >
                  <div className={`w-2 h-2 rounded-full ${currentWorkflow.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                  {currentWorkflow.active ? 'Activo' : 'Inactivo'}
                </Badge>
                
                <Button variant="outline" size="sm" onClick={handleToggleActive}>
                  {currentWorkflow.active ? 'Desactivar' : 'Activar'}
                </Button>
                
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-1" />
                  Configurar
                </Button>
                
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-1" />
                  Guardar
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="canvas" className="gap-2">
                  <WorkflowIcon className="h-4 w-4" />
                  Canvas
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Vista Previa
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analíticas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="canvas" className="flex-1 overflow-hidden mt-0">
                <WorkflowCanvas
                  steps={currentWorkflow.steps}
                  connections={currentWorkflow.connections}
                  onStepsChange={handleStepsChange}
                  onConnectionsChange={handleConnectionsChange}
                  onStepSelect={handleStepSelect}
                />
              </TabsContent>

              <TabsContent value="preview" className="flex-1 overflow-hidden mt-0">
                <WorkflowCanvas
                  steps={currentWorkflow.steps}
                  connections={currentWorkflow.connections}
                  readOnly={true}
                />
              </TabsContent>

          <TabsContent value="analytics" className="flex-1 p-6 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Ejecuciones Totales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentWorkflow.triggerCount || 0}</div>
                  <p className="text-xs text-muted-foreground">workflows ejecutados</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentWorkflow.successRate || 0}%</div>
                  <p className="text-xs text-muted-foreground">completados exitosamente</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Estado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${currentWorkflow.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="font-medium">{currentWorkflow.active ? 'Activo' : 'Inactivo'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Actualizado {currentWorkflow.updatedAt.toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Resumen del Workflow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Pasos del Workflow:</h4>
                    <div className="space-y-2">
                      {currentWorkflow.steps.map(step => (
                        <div key={step.id} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="text-xs">
                            {step.type.toUpperCase()}
                          </Badge>
                          <span>{step.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default WorkflowBuilder;