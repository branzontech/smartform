
import React from "react";
import { ContentComponentProps } from "../types";
import { SignaturePad } from "@/components/ui/signature-pad";

export const Signature: React.FC<ContentComponentProps> = ({ 
  question, 
  readOnly 
}) => {
  if (readOnly) {
    return (
      <div className="border border-gray-300 rounded-md h-32 bg-gray-50 flex items-center justify-center text-gray-400">
        Área para firma
      </div>
    );
  }

  return (
    <div className="mt-4">
      <SignaturePad 
        value="" 
        onChange={() => {}} 
        readOnly={true} 
      />
    </div>
  );
};
