
import React from 'react';
import { FileText, Printer } from "lucide-react";
import { IndividualResponse } from './individual-response';
import { Form } from '@/pages/Home';

interface FormResponse {
  timestamp: string;
  data: {
    [key: string]: string | string[];
  };
}

interface FormatDocumentViewProps {
  formData: Form;
  responses: FormResponse[];
  onPrint: (response: FormResponse, index: number) => void;
}

export const FormatDocumentView = ({ formData, responses, onPrint }: FormatDocumentViewProps) => {
  return (
    <div className="animate-fade-in">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-2 text-emerald-700 mb-4">
          <FileText size={20} />
          <h3 className="text-lg font-medium">Formato Tipo Documento</h3>
        </div>
        <p className="text-gray-600 mb-4">
          Este es un formato tipo documento. Cada respuesta se guarda como un documento individual que puede visualizarse o imprimirse.
        </p>
        <div className="flex items-center gap-2">
          <span className="font-medium">{responses.length}</span>
          <span className="text-gray-500">documentos guardados</span>
        </div>
      </div>
      
      <div className="space-y-6">
        {responses.map((response, index) => (
          <IndividualResponse 
            key={index}
            response={response}
            index={index}
            formData={formData}
            onPrint={onPrint}
          />
        ))}
      </div>
    </div>
  );
};
