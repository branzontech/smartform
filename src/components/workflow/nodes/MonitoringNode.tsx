import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Eye, AlertTriangle, UserX, PillBottle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MonitoringNodeProps {
  data: {
    title: string;
    description: string;
    config?: {
      monitoringType?: 'no_response' | 'missed_appointment' | 'medication_adherence';
      timeframe?: number;
    };
  };
}

const MonitoringNode: React.FC<MonitoringNodeProps> = ({ data }) => {
  const getMonitoringIcon = () => {
    switch (data.config?.monitoringType) {
      case 'no_response':
        return <UserX className="h-4 w-4" />;
      case 'missed_appointment':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medication_adherence':
        return <PillBottle className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const getTimeframeText = () => {
    if (data.config?.timeframe) {
      const hours = data.config.timeframe;
      if (hours < 24) {
        return `${hours} horas`;
      } else {
        const days = Math.floor(hours / 24);
        return `${days} días`;
      }
    }
    return 'Tiempo real';
  };

  return (
    <Card className="min-w-[200px] shadow-lg bg-red-50 text-red-800 border-red-300 border-2">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {getMonitoringIcon()}
          <Badge variant="secondary" className="text-xs">
            MONITOREO
          </Badge>
        </div>
        <h3 className="font-semibold text-sm mb-1">{data.title}</h3>
        <p className="text-xs opacity-80 mb-2">{data.description}</p>
        
        {data.config?.timeframe && (
          <div className="text-xs font-medium">
            Tiempo límite: {getTimeframeText()}
          </div>
        )}
      </CardContent>
      
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-red-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-red-500 border-2 border-white"
      />
    </Card>
  );
};

export default MonitoringNode;