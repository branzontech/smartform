
import React, { useState } from "react";
import { ContentComponentProps } from "../types";

export const Vitals: React.FC<ContentComponentProps> = ({ 
  question, 
  onUpdate, 
  readOnly 
}) => {
  const [vitalType, setVitalType] = useState(question.vitalType || "general");
  const [min, setMin] = useState(question.min || 0);
  const [max, setMax] = useState(question.max || 100);
  const [units, setUnits] = useState(question.units || "");
  const [sysMin, setSysMin] = useState(question.sysMin || 90);
  const [sysMax, setSysMax] = useState(question.sysMax || 140);
  const [diaMin, setDiaMin] = useState(question.diaMin || 60);
  const [diaMax, setDiaMax] = useState(question.diaMax || 90);

  const handleVitalTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVitalType = e.target.value;
    setVitalType(newVitalType);
    
    let newUnits = "";
    if (newVitalType === "TA") newUnits = "mmHg";
    else if (newVitalType === "FC") newUnits = "lpm";
    else if (newVitalType === "FR") newUnits = "rpm";
    else if (newVitalType === "temperatura") newUnits = "°C";
    else if (newVitalType === "saturacion") newUnits = "%";
    else if (newVitalType === "estatura") newUnits = "cm";
    else if (newVitalType === "peso") newUnits = "kg";
    else if (newVitalType === "IMC") newUnits = "kg/m²";
    
    setUnits(newUnits);
    
    onUpdate({ 
      vitalType: newVitalType,
      units: newUnits
    });
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setMin(value);
    onUpdate({ min: value });
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setMax(value);
    onUpdate({ max: value });
  };

  const handleSysMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setSysMin(value);
    onUpdate({ sysMin: value });
  };

  const handleSysMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setSysMax(value);
    onUpdate({ sysMax: value });
  };

  const handleDiaMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setDiaMin(value);
    onUpdate({ diaMin: value });
  };

  const handleDiaMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setDiaMax(value);
    onUpdate({ diaMax: value });
  };

  const handleUnitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUnits(e.target.value);
    onUpdate({ units: e.target.value });
  };

  if (readOnly) {
    if (question.vitalType === "TA") {
      return (
        <div>
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Tensión Arterial (T/A): {question.sysMin || 90}-{question.sysMax || 140}/{question.diaMin || 60}-{question.diaMax || 90} {question.units || "mmHg"}</span>
          </div>
          <div className="flex gap-2 items-center">
            <input type="number" disabled placeholder="Sistólica" className="w-1/2 border border-gray-300 rounded-md p-2 bg-transparent" />
            <span className="text-lg">/</span>
            <input type="number" disabled placeholder="Diastólica" className="w-1/2 border border-gray-300 rounded-md p-2 bg-transparent" />
          </div>
        </div>
      );
    } else if (question.vitalType === "IMC") {
      return (
        <div>
          <p className="text-sm text-gray-500 mb-2">Índice de Masa Corporal (IMC)</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-gray-500">Peso (kg)</label>
              <input type="number" disabled className="w-full border border-gray-300 rounded-md p-2 bg-transparent" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Altura (cm)</label>
              <input type="number" disabled className="w-full border border-gray-300 rounded-md p-2 bg-transparent" />
            </div>
            <div>
              <label className="text-xs text-gray-500">IMC</label>
              <input type="number" disabled className="w-full border border-gray-300 rounded-md p-2 bg-transparent bg-gray-50" />
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div>
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Rango: {question.min || 0} - {question.max || 100} {question.units || ''}</span>
          </div>
          <input type="number" disabled className="w-full border border-gray-300 rounded-md p-2 bg-transparent" />
        </div>
      );
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <div>
        <label className="block text-sm text-gray-600 mb-1">Tipo de signo vital:</label>
        <select
          value={vitalType}
          onChange={handleVitalTypeChange}
          className="w-full border border-gray-300 rounded-md p-2 focus:border-form-primary focus:outline-none"
        >
          <option value="general">General</option>
          <option value="TA">Tensión Arterial (T/A)</option>
          <option value="FC">Frecuencia Cardíaca (FC)</option>
          <option value="FR">Frecuencia Respiratoria (FR)</option>
          <option value="temperatura">Temperatura</option>
          <option value="saturacion">Saturación de Oxígeno</option>
          <option value="estatura">Estatura</option>
          <option value="peso">Peso</option>
          <option value="IMC">Índice de Masa Corporal (IMC)</option>
        </select>
      </div>

      {vitalType === "TA" ? (
        <div className="space-y-3">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Sistólica mínima:</label>
              <input
                type="number"
                value={sysMin}
                onChange={handleSysMinChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:border-form-primary focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Sistólica máxima:</label>
              <input
                type="number"
                value={sysMax}
                onChange={handleSysMaxChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:border-form-primary focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Diastólica mínima:</label>
              <input
                type="number"
                value={diaMin}
                onChange={handleDiaMinChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:border-form-primary focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Diastólica máxima:</label>
              <input
                type="number"
                value={diaMax}
                onChange={handleDiaMaxChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:border-form-primary focus:outline-none"
              />
            </div>
          </div>
        </div>
      ) : vitalType === "IMC" ? (
        <div>
          <p className="text-sm text-gray-600 mb-2">
            El IMC se calculará automáticamente a partir del peso y la altura.
          </p>
        </div>
      ) : (
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">Valor mínimo:</label>
            <input
              type="number"
              value={min}
              onChange={handleMinChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:border-form-primary focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">Valor máximo:</label>
            <input
              type="number"
              value={max}
              onChange={handleMaxChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:border-form-primary focus:outline-none"
            />
          </div>
        </div>
      )}

      {vitalType !== "TA" && vitalType !== "IMC" && (
        <div>
          <label className="block text-sm text-gray-600 mb-1">Unidades:</label>
          <input
            type="text"
            value={units}
            onChange={handleUnitsChange}
            placeholder="mmHg, bpm, kg, etc."
            className="w-full border border-gray-300 rounded-md p-2 focus:border-form-primary focus:outline-none"
          />
        </div>
      )}
    </div>
  );
};
