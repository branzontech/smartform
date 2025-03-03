import React from 'react';
import { Button } from "@/components/ui/button";
import { Form } from '@/pages/Home';
import { FormResponse } from '@/types/form-types';

interface QuestionSummaryProps {
  question: {
    id: string;
    title: string;
    type: string;
    vitalType?: string;
  };
  responses: FormResponse[];
  onViewAllResponses: () => void;
}

export const QuestionSummary = ({ question, responses, onViewAllResponses }: QuestionSummaryProps) => {
  const isTextResponse = question.type === 'short' || question.type === 'paragraph' || 
                         question.type === 'clinical' || question.type === 'signature' || 
                         question.type === 'file';
  
  const getDisplayValue = (answer: any): string => {
    if (!answer) return "Sin respuesta";
    
    if (Array.isArray(answer)) {
      return answer.join(", ");
    } else if (typeof answer === 'object') {
      if (question.type === 'vitals' && question.vitalType === 'TA') {
        return `${answer.sys}/${answer.dia} mmHg`;
      } else if (question.type === 'vitals' && question.vitalType === 'IMC') {
        return `IMC: ${answer.bmi}`;
      } else if (question.type === 'clinical') {
        return answer.title || "Dato clínico";
      } else if (question.type === 'file' && answer.name) {
        return answer.name;
      } else if (question.type === 'multifield') {
        return "Datos múltiples";
      } else {
        return JSON.stringify(answer);
      }
    } else {
      return String(answer);
    }
  };
  
  const getSummary = () => {
    if (isTextResponse) {
      return responses.map(response => {
        const answer = response.data[question.id];
        return { answer, count: 1, displayValue: getDisplayValue(answer) };
      });
    } else {
      const counts: { [key: string]: number } = {};
      const displayMap: { [key: string]: any } = {};
      
      responses.forEach(response => {
        const answer = response.data[question.id];
        const displayValue = getDisplayValue(answer);
        
        if (Array.isArray(answer)) {
          answer.forEach(option => {
            counts[option] = (counts[option] || 0) + 1;
            displayMap[option] = option;
          });
        } else if (answer) {
          const key = typeof answer === 'object' ? JSON.stringify(answer) : String(answer);
          counts[key] = (counts[key] || 0) + 1;
          displayMap[key] = displayValue;
        }
      });
      
      return Object.entries(counts).map(([key, count]) => ({ 
        answer: key, 
        count, 
        displayValue: displayMap[key] 
      }));
    }
  };
  
  const summary = getSummary();
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 animate-scale-in">
      <h3 className="text-lg font-medium mb-4">{question.title}</h3>
      
      {isTextResponse ? (
        <div className="space-y-4 mt-4">
          <p className="text-sm text-gray-500">
            {responses.length} respuesta{responses.length !== 1 ? 's' : ''}
          </p>
          {responses.length <= 5 ? (
            <div className="space-y-2">
              {summary.map((item, i) => (
                <div key={i} className="border-b border-gray-100 pb-2">
                  {item.displayValue || <span className="text-gray-400 italic">Sin respuesta</span>}
                </div>
              ))}
            </div>
          ) : (
            <Button 
              variant="outline"
              onClick={onViewAllResponses}
              className="text-gray-600"
            >
              Ver todas las respuestas
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <div className="space-y-4">
            {summary.map((item, i) => (
              <div key={i} className="flex items-center">
                <div className="w-1/2 text-sm">{item.displayValue}</div>
                <div className="w-1/2">
                  <div className="flex items-center">
                    <div 
                      className="h-5 bg-form-primary rounded"
                      style={{ 
                        width: `${Math.max(5, (item.count / responses.length) * 100)}%` 
                      }}
                    ></div>
                    <span className="ml-2 text-sm">
                      {item.count} ({Math.round((item.count / responses.length) * 100)}%)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
