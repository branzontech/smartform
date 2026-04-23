import React from 'react';
import { FileText } from "lucide-react";
import { IndividualResponse } from './individual-response';
import { Form } from '@/pages/FormsPage';
import { FormResponse } from '@/types/form-types';

interface FormatDocumentViewProps {
  formData: Form;
  responses: FormResponse[];
  onPrint: (response: FormResponse, index: number) => void;
  responsesById?: Record<string, { index: number }>;
  onCorrectionSuccess?: () => void;
}

export const FormatDocumentView = ({
  formData,
  responses,
  onPrint,
  responsesById,
  onCorrectionSuccess,
}: FormatDocumentViewProps) => {
  return (
    <div className="animate-fade-in">
      <div className="bg-card rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center gap-2 text-emerald-700 mb-4">
          <FileText size={20} />
          <h3 className="text-lg font-medium">Formato Tipo Documento</h3>
        </div>
        <p className="text-muted-foreground mb-4">
          Este es un formato tipo documento. Cada respuesta se guarda como un documento individual que puede visualizarse o imprimirse.
        </p>
        <div className="flex items-center gap-2">
          <span className="font-medium">{responses.length}</span>
          <span className="text-muted-foreground">documentos guardados</span>
        </div>
      </div>
      
      <div className="space-y-6">
        {responses.map((response, index) => (
          <IndividualResponse 
            key={response.recordId ?? index}
            response={response}
            index={index}
            formData={formData}
            onPrint={onPrint}
            responsesById={responsesById}
            onCorrectionSuccess={onCorrectionSuccess}
          />
        ))}
      </div>
    </div>
  );
};
