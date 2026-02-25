
import React, { useState, useRef, useEffect } from "react";
import { CheckSquare, Circle, List, MessageSquare, Minus, Plus, Type, Calculator, Activity, Stethoscope, FileText, Search, Check, Edit3, FileUp, AlignHorizontalSpaceBetween, AlignVerticalSpaceBetween, Package, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuestionTypeProps, OptionProps, AddOptionButtonProps, DiagnosisListProps, Diagnosis, MultifieldItemProps, MultifieldConfig, SignaturePadProps } from "@/components/forms/question/types";

// Grouped question types with separators (like Google Forms)
const questionTypeGroups = [
  {
    label: "Texto",
    types: [
      { id: "short", label: "Respuesta corta", icon: Type },
      { id: "paragraph", label: "Párrafo", icon: MessageSquare },
    ],
  },
  {
    label: "Selección",
    types: [
      { id: "multiple", label: "Selección múltiple", icon: Circle },
      { id: "checkbox", label: "Casillas", icon: CheckSquare },
      { id: "dropdown", label: "Desplegable", icon: List },
    ],
  },
  {
    label: "Clínico",
    types: [
      { id: "vitals", label: "Signos vitales", icon: Activity },
      { id: "diagnosis", label: "Diagnóstico", icon: Stethoscope },
      { id: "clinical", label: "Datos clínicos", icon: FileText },
      { id: "medication", label: "Medicamentos e Insumos", icon: Package },
    ],
  },
  {
    label: "Avanzado",
    types: [
      { id: "calculation", label: "Campo calculable", icon: Calculator },
      { id: "multifield", label: "Campos múltiples", icon: AlignVerticalSpaceBetween },
      { id: "signature", label: "Firma", icon: Edit3 },
      { id: "file", label: "Adjuntar archivo", icon: FileUp },
    ],
  },
];

// Flat list for lookups
export const questionTypes = questionTypeGroups.flatMap((g) => g.types);

export const QuestionType = ({ selected, onChange }: QuestionTypeProps) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedType = questionTypes.find((t) => t.id === selected);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm border transition-colors w-56",
          "border-border bg-background hover:bg-muted"
        )}
      >
        <span className="flex items-center gap-2">
          {selectedType && <selectedType.icon size={16} className="text-muted-foreground" />}
          <span className="text-foreground">{selectedType?.label || "Seleccionar tipo"}</span>
        </span>
        <ChevronDown size={14} className={cn("text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-64 bg-background border border-border rounded-lg shadow-xl max-h-80 overflow-y-auto right-0">
          {questionTypeGroups.map((group, gi) => (
            <div key={group.label}>
              {gi > 0 && <div className="h-px bg-border mx-2" />}
              <div className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                {group.label}
              </div>
              {group.types.map((type) => {
                const isSelected = selected === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => {
                      onChange(type.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2 text-sm text-left transition-colors",
                      isSelected
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <type.icon size={18} className="text-muted-foreground shrink-0" />
                    <span>{type.label}</span>
                    {isSelected && <Check size={14} className="ml-auto text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const Option = ({
  value,
  onChange,
  onRemove,
  canRemove,
  isMultiple = false,
}: OptionProps) => {
  return (
    <div className="flex items-center gap-3 mb-2 animate-fade-in">
      {isMultiple ? (
        <CheckSquare size={18} className="text-gray-400" />
      ) : (
        <Circle size={18} className="text-gray-400" />
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Opción"
        className="flex-1 border-b border-gray-300 focus:border-form-primary focus:outline-none py-1 px-0 bg-transparent"
      />
      <button
        onClick={onRemove}
        disabled={!canRemove}
        className={cn(
          "p-1 rounded-full transition-all",
          canRemove 
            ? "text-gray-500 hover:bg-gray-100" 
            : "text-gray-300 cursor-not-allowed"
        )}
      >
        <Minus size={16} />
      </button>
    </div>
  );
};

export const AddOptionButton = ({ onClick }: AddOptionButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-gray-600 hover:text-form-primary transition-all mt-2"
    >
      <Plus size={16} />
      <span>Agregar opción</span>
    </button>
  );
};

export const DiagnosisList = ({ diagnoses, selectedDiagnoses, onSelect, onRemove }: DiagnosisListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredDiagnoses = diagnoses.filter(
    (diagnosis) => 
      diagnosis.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      diagnosis.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mt-4">
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search size={16} className="text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-form-primary focus:border-form-primary"
          placeholder="Buscar diagnóstico por código o nombre"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {selectedDiagnoses.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Diagnósticos seleccionados:</h4>
          <div className="space-y-2">
            {selectedDiagnoses.map(diagnosis => (
              <div 
                key={diagnosis.id} 
                className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-md"
              >
                <div>
                  <span className="font-medium text-blue-700">{diagnosis.code}</span>
                  <span className="mx-2">-</span>
                  <span>{diagnosis.name}</span>
                </div>
                <button
                  onClick={() => onRemove(diagnosis.id)}
                  className="text-gray-500 hover:text-red-500"
                >
                  <Minus size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
        {filteredDiagnoses.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredDiagnoses.map(diagnosis => {
              const isSelected = selectedDiagnoses.some(d => d.id === diagnosis.id);
              return (
                <li 
                  key={diagnosis.id}
                  className={cn(
                    "px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50",
                    isSelected && "bg-blue-50"
                  )}
                  onClick={() => !isSelected && onSelect(diagnosis)}
                >
                  <div>
                    <span className="font-medium">{diagnosis.code}</span>
                    <span className="mx-2">-</span>
                    <span>{diagnosis.name}</span>
                  </div>
                  {isSelected && <Check size={16} className="text-blue-600" />}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? "No se encontraron diagnósticos" : "Lista de diagnósticos disponibles"}
          </div>
        )}
      </div>
    </div>
  );
};

export const MultifieldItem = ({
  id,
  label,
  onLabelChange,
  onRemove,
  canRemove,
}: MultifieldItemProps) => {
  return (
    <div className="flex items-center gap-3 mb-2 animate-fade-in">
      <input
        type="text"
        value={label}
        onChange={(e) => onLabelChange(id, e.target.value)}
        placeholder="Etiqueta del campo"
        className="flex-1 border-b border-gray-300 focus:border-form-primary focus:outline-none py-1 px-0 bg-transparent"
      />
      <button
        onClick={() => onRemove(id)}
        disabled={!canRemove}
        className={cn(
          "p-1 rounded-full transition-all",
          canRemove 
            ? "text-gray-500 hover:bg-gray-100" 
            : "text-gray-300 cursor-not-allowed"
        )}
      >
        <Minus size={16} />
      </button>
    </div>
  );
};

export const SignaturePad: React.FC<SignaturePadProps> = ({
  value,
  onChange,
  className,
  readOnly = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    // Set canvas dimensions
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Set up drawing style
      context.lineWidth = 2;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = "#000000";
    };

    // Initialize canvas and load existing signature
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    // Load existing signature if available
    if (value) {
      const img = new Image();
      img.onload = () => {
        context.drawImage(img, 0, 0);
      };
      img.src = value;
    }

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, [value]);

  // Drawing functions
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext("2d");
    if (!context) return;
    
    setIsDrawing(true);
    
    const { offsetX, offsetY } = getCoordinates(e, canvas);
    context.beginPath();
    context.moveTo(offsetX, offsetY);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || readOnly) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext("2d");
    if (!context) return;
    
    const { offsetX, offsetY } = getCoordinates(e, canvas);
    context.lineTo(offsetX, offsetY);
    context.stroke();
  };

  const endDrawing = () => {
    if (!isDrawing || readOnly) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext("2d");
    if (!context) return;
    
    context.closePath();
    setIsDrawing(false);
    
    // Save signature as base64 string
    const signatureData = canvas.toDataURL("image/png");
    onChange(signatureData);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      // Touch event
      const touch = e.touches[0];
      return {
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top
      };
    } else {
      // Mouse event
      return {
        offsetX: e.nativeEvent.offsetX,
        offsetY: e.nativeEvent.offsetY
      };
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext("2d");
    if (!context) return;
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
  };

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <div
        className="border border-gray-300 rounded-md bg-white touch-none"
        style={{ height: "200px", width: "100%" }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
        />
      </div>
      {!readOnly && (
        <button
          type="button"
          onClick={clearSignature}
          className="self-end px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
        >
          Borrar firma
        </button>
      )}
    </div>
  );
};

// Export types for question.tsx to use
export type { Diagnosis, MultifieldConfig };

// Export all components and types needed
export { questionTypes as questionTypesList };
