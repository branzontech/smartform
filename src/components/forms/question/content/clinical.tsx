
import React from "react";
import { ContentComponentProps } from "../types";

export const Clinical: React.FC<ContentComponentProps> = ({ 
  question, 
  readOnly 
}) => {
  if (readOnly) {
    return (
      <div className="border border-gray-300 rounded-md p-2">
        <input type="text" placeholder="Datos clínicos" disabled className="w-full bg-transparent" />
        <textarea placeholder="Información detallada" disabled className="w-full mt-2 bg-transparent" rows={2} />
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm text-gray-600">
        Este campo permite ingresar información clínica detallada.
      </p>
    </div>
  );
};
