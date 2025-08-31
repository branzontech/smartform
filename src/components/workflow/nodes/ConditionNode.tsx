import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ConditionNodeProps {
  data: {
    title: string;
    description: string;
    config?: {
      condition?: string;
    };
  };
}

const ConditionNode: React.FC<ConditionNodeProps> = ({ data }) => {
  return (
    <Card className="min-w-[200px] shadow-lg bg-purple-50 text-purple-800 border-purple-300 border-2">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <GitBranch className="h-4 w-4" />
          <Badge variant="secondary" className="text-xs">
            CONDICIÓN
          </Badge>
        </div>
        <h3 className="font-semibold text-sm mb-1">{data.title}</h3>
        <p className="text-xs opacity-80 mb-2">{data.description}</p>
        
        {data.config?.condition && (
          <div className="text-xs font-medium flex items-center gap-1">
            <HelpCircle className="h-3 w-3" />
            <span>{data.config.condition}</span>
          </div>
        )}
      </CardContent>
      
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-purple-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="w-3 h-3 !bg-green-500 border-2 border-white"
        style={{ left: '30%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="w-3 h-3 !bg-red-500 border-2 border-white"
        style={{ left: '70%' }}
      />
    </Card>
  );
};

export default ConditionNode;