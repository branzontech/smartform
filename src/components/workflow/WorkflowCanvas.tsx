import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './workflow-styles.css';

import { WorkflowStep, WorkflowConnection } from '@/types/workflow-types';
import TriggerNode from './nodes/TriggerNode';
import TaskNode from './nodes/TaskNode';
import ReminderNode from './nodes/ReminderNode';
import MonitoringNode from './nodes/MonitoringNode';
import ConditionNode from './nodes/ConditionNode';

const nodeTypes = {
  trigger: TriggerNode,
  task: TaskNode,
  reminder: ReminderNode,
  monitoring: MonitoringNode,
  condition: ConditionNode,
};

interface WorkflowCanvasProps {
  steps: WorkflowStep[];
  connections: WorkflowConnection[];
  onStepsChange?: (steps: WorkflowStep[]) => void;
  onConnectionsChange?: (connections: WorkflowConnection[]) => void;
  onStepSelect?: (stepId: string) => void;
  readOnly?: boolean;
}

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  steps,
  connections,
  onStepsChange,
  onConnectionsChange,
  onStepSelect,
  readOnly = false
}) => {
  // Convertir steps a nodes de React Flow
  const initialNodes: Node[] = steps.map(step => ({
    id: step.id,
    type: step.type,
    position: step.position,
    data: {
      title: step.title,
      description: step.description,
      config: step.config,
    },
    draggable: !readOnly,
  }));

  // Convertir connections a edges de React Flow
  const initialEdges: Edge[] = connections.map(conn => ({
    id: conn.id,
    source: conn.source,
    target: conn.target,
    label: conn.label,
    type: 'smoothstep',
    animated: true,
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => {
      if (readOnly) return;
      
      const newEdge = addEdge(params, edges);
      setEdges(newEdge);
      
      // Notificar cambios
      if (onConnectionsChange) {
        const newConnections: WorkflowConnection[] = newEdge.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label as string,
        }));
        onConnectionsChange(newConnections);
      }
    },
    [edges, onConnectionsChange, readOnly]
  );

  // Manejar cambios en la posición de los nodos
  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes);
    
    if (onStepsChange && !readOnly) {
      // Actualizar las posiciones en los steps
      const updatedSteps = steps.map(step => {
        const node = nodes.find(n => n.id === step.id);
        if (node) {
          return {
            ...step,
            position: node.position,
          };
        }
        return step;
      });
      onStepsChange(updatedSteps);
    }
  }, [nodes, onNodesChange, onStepsChange, steps, readOnly]);

  // Manejar selección de nodos
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (onStepSelect && !readOnly) {
      onStepSelect(node.id);
    }
  }, [onStepSelect, readOnly]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        style={{ backgroundColor: "hsl(var(--background))" }}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
      >
        <Controls />
        <MiniMap 
          nodeColor="hsl(var(--primary))"
          maskColor="hsl(var(--muted))"
        />
        <Background color="hsl(var(--border))" gap={20} />
      </ReactFlow>
    </div>
  );
};

export default WorkflowCanvas;