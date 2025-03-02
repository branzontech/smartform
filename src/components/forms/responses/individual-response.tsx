
import React from 'react';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from '@/pages/Home';

interface FormResponse {
  timestamp: string;
  data: {
    [key: string]: string | string[];
  };
}

interface IndividualResponseProps {
  response: FormResponse;
  index: number;
  formData: Form;
  onPrint: (response: FormResponse, index: number) => void;
}

export const IndividualResponse = ({ response, index, formData, onPrint }: IndividualResponseProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 animate-scale-in">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
        <h3 className="text-lg font-medium">Respuesta {index + 1}</h3>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500">
            {format(new Date(response.timestamp), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
          </div>
          {formData.formType === "formato" && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onPrint(response, index)}
              className="flex items-center gap-1"
            >
              <Printer size={14} />
              Imprimir
            </Button>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        {formData.questions.map(question => {
          const answer = response.data[question.id];
          
          return (
            <div key={question.id} className="pb-3 border-b border-gray-100 last:border-0">
              <div className="text-sm text-gray-500 mb-1">{question.title}</div>
              <div>
                {answer ? (
                  Array.isArray(answer) ? 
                    answer.join(", ") : 
                    String(answer)
                ) : (
                  <span className="text-gray-400 italic">Sin respuesta</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
