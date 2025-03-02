
import React, { useState } from "react";
import { ContentComponentProps } from "../types";

export const Calculation: React.FC<ContentComponentProps> = ({ 
  question, 
  onUpdate, 
  readOnly 
}) => {
  const [formula, setFormula] = useState(question.formula || "");

  const handleFormulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormula(e.target.value);
    onUpdate({ formula: e.target.value });
  };

  if (readOnly) {
    return (
      <div>
        <p className="text-sm text-gray-500">Campo calculable: {formula}</p>
        <input type="number" disabled className="w-full border border-gray-300 rounded-md p-2 bg-transparent" />
      </div>
    );
  }

  return (
    <div className="mt-4">
      <label className="block text-sm text-gray-600 mb-1">Fórmula de cálculo:</label>
      <input
        type="text"
        value={formula}
        onChange={handleFormulaChange}
        placeholder="Ej: [Peso] / ([Altura] * [Altura])"
        className="w-full border border-gray-300 rounded-md p-2 focus:border-form-primary focus:outline-none"
      />
      <p className="text-xs text-gray-500 mt-1">
        Usa [NombreCampo] para referenciar otros campos en la fórmula
      </p>
    </div>
  );
};
