import React from 'react';  
import { Handle, Position } from '@xyflow/react';
import { Mail, Calendar, FileText, BookOpen, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TaskNodeProps {
  data: {
    title: string;
    description: string;
    config?: {
      taskType?: 'send_reminder' | 'schedule_appointment' | 'send_survey' | 'send_educational_material';
      delay?: number;
    };
  };
}

const TaskNode: React.FC<TaskNodeProps> = ({ data }) => {
  const getTaskIcon = () => {
    switch (data.config?.taskType) {
      case 'send_reminder':
        return <Mail className="h-4 w-4" />;
      case 'schedule_appointment':
        return <Calendar className="h-4 w-4" />;
      case 'send_survey':
        return <FileText className="h-4 w-4" />;
      case 'send_educational_material':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getDelayText = () => {
    if (data.config?.delay) {
      const hours = data.config.delay;
      if (hours < 24) {
        return `${hours}h después`;
      } else {
        const days = Math.floor(hours / 24);
        return `${days}d después`;
      }
    }
    return 'Inmediato';
  };

  return (
    <Card className="min-w-[200px] shadow-lg bg-orange-50 text-orange-800 border-orange-300 border-2">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {getTaskIcon()}
          <Badge variant="secondary" className="text-xs">
            TAREA
          </Badge>
        </div>
        <h3 className="font-semibold text-sm mb-1">{data.title}</h3>
        <p className="text-xs opacity-80 mb-2">{data.description}</p>
        
        {data.config?.delay !== undefined && (
          <div className="flex items-center gap-1 text-xs">
            <Clock className="h-3 w-3" />
            <span>{getDelayText()}</span>
          </div>
        )}
      </CardContent>
      
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-orange-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-orange-500 border-2 border-white"
      />
    </Card>
  );
};

export default TaskNode;