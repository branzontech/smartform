import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ReminderNodeProps {
  data: {
    title: string;
    description: string;
    config?: {
      reminderType?: 'sms' | 'email' | 'both';
      reminderMessage?: string;
    };
  };
}

const ReminderNode: React.FC<ReminderNodeProps> = ({ data }) => {
  const getReminderIcon = () => {
    switch (data.config?.reminderType) {
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'both':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getReminderTypeText = () => {
    switch (data.config?.reminderType) {
      case 'sms':
        return 'SMS';
      case 'email':
        return 'Email';
      case 'both':
        return 'SMS + Email';
      default:
        return 'Notificación';
    }
  };

  return (
    <Card className="min-w-[200px] shadow-lg bg-yellow-50 text-yellow-800 border-yellow-300 border-2">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {getReminderIcon()}
          <Badge variant="secondary" className="text-xs">
            RECORDATORIO
          </Badge>
        </div>
        <h3 className="font-semibold text-sm mb-1">{data.title}</h3>
        <p className="text-xs opacity-80 mb-2">{data.description}</p>
        
        <div className="text-xs font-medium">
          Vía: {getReminderTypeText()}
        </div>
      </CardContent>
      
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-yellow-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-yellow-500 border-2 border-white"
      />
    </Card>
  );
};

export default ReminderNode;