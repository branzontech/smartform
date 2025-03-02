
import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { BackButton } from '@/App';

interface FormErrorProps {
  error: string;
}

export const FormError = ({ error }: FormErrorProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="container py-12">
      <BackButton />
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="text-red-500 text-xl">{error}</div>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/')}>
          Volver al inicio
        </Button>
      </div>
    </div>
  );
};
