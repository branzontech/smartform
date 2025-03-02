
import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { BackButton } from '@/App';

interface FormSubmissionSuccessProps {
  onResubmit: () => void;
}

export const FormSubmissionSuccess = ({ onResubmit }: FormSubmissionSuccessProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="container py-12">
      <BackButton />
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-green-600 mb-2">¡Formulario enviado correctamente!</h2>
          <p className="text-gray-600">Gracias por completar el formulario</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={onResubmit}>
            Enviar otro formulario
          </Button>
          <Button onClick={() => navigate('/')}>
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  );
};
