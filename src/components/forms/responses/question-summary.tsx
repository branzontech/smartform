
import React from 'react';
import { Button } from "@/components/ui/button";
import { Form } from '@/pages/Home';

interface FormResponse {
  timestamp: string;
  data: {
    [key: string]: string | string[];
  };
}

interface QuestionSummaryProps {
  question: {
    id: string;
    title: string;
    type: string;
  };
  responses: FormResponse[];
  onViewAllResponses: () => void;
}

export const QuestionSummary = ({ question, responses, onViewAllResponses }: QuestionSummaryProps) => {
  const isTextResponse = question.type === 'short' || question.type === 'paragraph';
  
  const getSummary = () => {
    if (isTextResponse) {
      return responses.map(response => {
        const answer = response.data[question.id];
        return { answer: answer || "Sin respuesta", count: 1 };
      });
    } else {
      const counts: { [key: string]: number } = {};
      
      responses.forEach(response => {
        const answer = response.data[question.id];
        
        if (Array.isArray(answer)) {
          // Para casillas de verificación (checkbox)
          answer.forEach(option => {
            counts[option] = (counts[option] || 0) + 1;
          });
        } else if (answer) {
          // Para selección múltiple, desplegable
          counts[answer] = (counts[answer] || 0) + 1;
        }
      });
      
      return Object.entries(counts).map(([answer, count]) => ({ answer, count }));
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
                  {item.answer ? String(item.answer) : <span className="text-gray-400 italic">Sin respuesta</span>}
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
                <div className="w-1/2 text-sm">{item.answer}</div>
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
