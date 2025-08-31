import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Play, Calendar, UserCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TriggerNodeProps {
  data: {
    title: string;
    description: string;
    config?: {
      triggerType?: 'consultation_completed' | 'appointment_created' | 'manual';
    };
  };
}

const TriggerNode: React.FC<TriggerNodeProps> = ({ data }) => {
  const getTriggerIcon = () => {
    switch (data.config?.triggerType) {
      case 'consultation_completed':
        return <UserCheck className="h-4 w-4" />;
      case 'appointment_created':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Play className="h-4 w-4" />;
    }
  };

  const getTriggerColor = () => {
    switch (data.config?.triggerType) {
      case 'consultation_completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'appointment_created':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-purple-100 text-purple-800 border-purple-300';
    }
  };

  return (
    <Card className={`min-w-[200px] shadow-lg ${getTriggerColor()} border-2`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {getTriggerIcon()}
          <Badge variant="secondary" className="text-xs">
            INICIO
          </Badge>
        </div>
        <h3 className="font-semibold text-sm mb-1">{data.title}</h3>
        <p className="text-xs opacity-80">{data.description}</p>
      </CardContent>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-current border-2 border-white"
      />
    </Card>
  );
};

export default TriggerNode;