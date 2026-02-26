
import React, { useState, useMemo } from "react";
import { ContentComponentProps, MultifieldConfig } from "../types";
import { MultifieldItem } from "../controls/multifield-item";
import { nanoid } from "nanoid";
import { cn } from "@/lib/utils";
import { 
  AlignHorizontalSpaceBetween, 
  AlignVerticalSpaceBetween, 
  Plus, 
  Calculator,
  Equal
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CALC_TYPES = [
  { value: "sum", label: "Suma (+)", symbol: "+" },
  { value: "subtract", label: "Resta (−)", symbol: "−" },
  { value: "multiply", label: "Multiplicación (×)", symbol: "×" },
  { value: "divide", label: "División (÷)", symbol: "÷" },
] as const;

export const Multifield: React.FC<ContentComponentProps> = ({ 
  question, 
  onUpdate, 
  readOnly 
}) => {
  const [multifields, setMultifields] = useState<MultifieldConfig[]>(
    question.multifields || [
      { id: nanoid(), label: "Campo 1" },
      { id: nanoid(), label: "Campo 2" }
    ]
  );
  const [orientation, setOrientation] = useState<"vertical" | "horizontal">(
    question.orientation || "vertical"
  );
  const [isCalculated, setIsCalculated] = useState(question.isCalculated || false);
  const [calculationType, setCalculationType] = useState<"sum" | "subtract" | "multiply" | "divide">(
    question.calculationType || "sum"
  );
  const [numberType, setNumberType] = useState<"integer" | "decimal">(
    question.numberType || "decimal"
  );

  const calcSymbol = useMemo(() => {
    return CALC_TYPES.find(c => c.value === calculationType)?.symbol || "+";
  }, [calculationType]);

  const handleMultifieldLabelChange = (id: string, label: string) => {
    const updatedMultifields = multifields.map(field => 
      field.id === id ? { ...field, label } : field
    );
    setMultifields(updatedMultifields);
    onUpdate({ multifields: updatedMultifields });
  };

  const addMultifield = () => {
    const newMultifields = [
      ...multifields, 
      { id: nanoid(), label: `Campo ${multifields.length + 1}` }
    ];
    setMultifields(newMultifields);
    onUpdate({ multifields: newMultifields });
  };

  const removeMultifield = (id: string) => {
    if (multifields.length <= 2) return;
    const newMultifields = multifields.filter(field => field.id !== id);
    setMultifields(newMultifields);
    onUpdate({ multifields: newMultifields });
  };

  const toggleOrientation = () => {
    const newOrientation = orientation === "vertical" ? "horizontal" : "vertical";
    setOrientation(newOrientation);
    onUpdate({ orientation: newOrientation });
  };

  const handleToggleCalculated = (checked: boolean) => {
    setIsCalculated(checked);
    onUpdate({ isCalculated: checked });
  };

  const handleCalcTypeChange = (value: string) => {
    const val = value as "sum" | "subtract" | "multiply" | "divide";
    setCalculationType(val);
    onUpdate({ calculationType: val });
  };

  const handleNumberTypeChange = (value: string) => {
    const val = value as "integer" | "decimal";
    setNumberType(val);
    onUpdate({ numberType: val });
  };

  if (readOnly) {
    return (
      <div className={cn(
        "space-y-2",
        orientation === "horizontal" && "sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4"
      )}>
        {multifields.map((field) => (
          <div key={field.id} className="mb-2">
            <label className="block text-sm font-medium text-muted-foreground mb-1">{field.label}</label>
            <input 
              type={isCalculated ? "number" : "text"} 
              disabled 
              className="w-full border border-border rounded-md p-2 bg-transparent" 
            />
          </div>
        ))}
        {isCalculated && (
          <div className="col-span-full pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Calculator size={16} className="text-primary" />
              <label className="text-sm font-semibold text-foreground">Total</label>
            </div>
            <input 
              type="number" 
              disabled 
              className="w-full border border-primary/30 rounded-md p-2 bg-primary/5 font-semibold mt-1" 
              placeholder="0"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Header con orientación */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-muted-foreground">Campos de texto</h4>
        <button
          onClick={toggleOrientation}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors p-1 rounded"
        >
          {orientation === "vertical" ? (
            <>
              <AlignVerticalSpaceBetween size={16} />
              <span>Vertical</span>
            </>
          ) : (
            <>
              <AlignHorizontalSpaceBetween size={16} />
              <span>Horizontal</span>
            </>
          )}
        </button>
      </div>

      {/* Toggle calculado */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Calculator size={16} className="text-primary" />
          <Label className="text-sm font-medium cursor-pointer">Campo calculado</Label>
        </div>
        <Switch checked={isCalculated} onCheckedChange={handleToggleCalculated} />
      </div>

      {/* Opciones de cálculo */}
      {isCalculated && (
        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Operación</Label>
            <Select value={calculationType} onValueChange={handleCalcTypeChange}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CALC_TYPES.map(ct => (
                  <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tipo numérico</Label>
            <Select value={numberType} onValueChange={handleNumberTypeChange}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="integer">Entero</SelectItem>
                <SelectItem value="decimal">Decimal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      
      {/* Lista de campos */}
      <div className="space-y-2">
        {multifields.map((field) => (
          <MultifieldItem
            key={field.id}
            id={field.id}
            label={field.label}
            onLabelChange={handleMultifieldLabelChange}
            onRemove={removeMultifield}
            canRemove={multifields.length > 2}
          />
        ))}
        
        <button
          onClick={addMultifield}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-all mt-2"
        >
          <Plus size={16} />
          <span>Agregar campo</span>
        </button>
      </div>
      
      {/* Vista previa */}
      <div className="bg-muted/40 p-3 rounded-md border border-dashed border-border">
        <p className="text-sm text-muted-foreground mb-2">Vista previa:</p>
        <div className={cn(
          "space-y-3",
          orientation === "horizontal" && "sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4"
        )}>
          {multifields.map((field, idx) => (
            <div key={field.id} className="mb-2">
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                {field.label}
                {isCalculated && idx > 0 && (
                  <span className="ml-1 text-primary font-bold">{calcSymbol}</span>
                )}
              </label>
              <input 
                type={isCalculated ? "number" : "text"} 
                disabled 
                placeholder={isCalculated ? "0" : ""}
                className="w-full border border-border rounded-md p-2 bg-transparent" 
              />
            </div>
          ))}
        </div>
        {isCalculated && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2 mb-1">
              <Equal size={14} className="text-primary" />
              <label className="text-sm font-semibold text-foreground">Total</label>
            </div>
            <input 
              type="number" 
              disabled 
              placeholder="0"
              className="w-full border border-primary/30 rounded-md p-2 bg-primary/5 font-semibold" 
            />
          </div>
        )}
      </div>
    </div>
  );
};
