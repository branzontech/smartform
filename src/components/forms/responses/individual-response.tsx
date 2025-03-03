import React from 'react';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Printer, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from '@/pages/Home';
import { FormResponse } from '@/types/form-types';

interface IndividualResponseProps {
  response: FormResponse;
  index: number;
  formData: Form;
  onPrint: (response: FormResponse, index: number) => void;
}

export const IndividualResponse = ({ response, index, formData, onPrint }: IndividualResponseProps) => {
  // Función para renderizar la respuesta según el tipo de pregunta
  const renderAnswer = (question: any, answer: any) => {
    if (!answer) {
      return <span className="text-gray-400 italic">Sin respuesta</span>;
    }

    // Manejo según el tipo de pregunta
    switch (question.type) {
      case "checkbox":
        return Array.isArray(answer) ? answer.join(", ") : String(answer);
      
      case "vitals":
        if (question.vitalType === "TA" && typeof answer === 'object') {
          return `${answer.sys}/${answer.dia} mmHg`;
        } else if (question.vitalType === "IMC" && typeof answer === 'object') {
          return `Peso: ${answer.weight} kg, Altura: ${answer.height} cm, IMC: ${answer.bmi}`;
        } else {
          return String(answer);
        }
      
      case "clinical":
        if (typeof answer === 'object') {
          return (
            <div>
              <div className="font-medium">{answer.title}</div>
              <div className="text-sm text-gray-600">{answer.detail}</div>
            </div>
          );
        }
        return String(answer);
      
      case "multifield":
        if (typeof answer === 'object') {
          return (
            <div className="space-y-1">
              {Object.entries(answer).map(([key, value]) => {
                const fieldLabel = question.multifields?.find((f: any) => f.id === key)?.label || key;
                return (
                  <div key={key} className="flex">
                    <span className="text-sm text-gray-500 mr-2">{fieldLabel}:</span>
                    <span>{String(value)}</span>
                  </div>
                );
              })}
            </div>
          );
        }
        return String(answer);
      
      case "file":
        if (typeof answer === 'object' && answer.name) {
          return (
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-gray-500" />
              <span>{answer.name}</span>
              <span className="text-xs text-gray-500">
                ({(answer.size / (1024 * 1024)).toFixed(2)} MB)
              </span>
            </div>
          );
        }
        return <span className="text-gray-400 italic">Archivo no disponible</span>;
      
      case "signature":
        if (answer && typeof answer === 'string' && answer.startsWith('data:image')) {
          return (
            <div className="max-w-xs">
              <img src={answer} alt="Firma" className="border border-gray-200 rounded" />
            </div>
          );
        }
        return <span className="text-gray-400 italic">Sin firma</span>;
      
      default:
        return Array.isArray(answer) ? answer.join(", ") : String(answer);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 animate-scale-in">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
        <h3 className="text-lg font-medium">Respuesta {index + 1}</h3>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            {format(new Date(response.timestamp), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onPrint(response, index)}
            className="flex items-center gap-2 hover:bg-gray-100"
          >
            <Printer size={16} />
            <span>Imprimir</span>
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        {formData.questions.map(question => {
          const answer = response.data[question.id];
          
          return (
            <div key={question.id} className="pb-3 border-b border-gray-100 last:border-0">
              <div className="text-sm text-gray-500 mb-1">{question.title}</div>
              <div>
                {renderAnswer(question, answer)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
