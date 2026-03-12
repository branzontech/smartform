
import React from "react";
import { ContentComponentProps, PredefinedVital, CustomVital } from "../types";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";

const DEFAULT_PREDEFINED_VITALS: Record<string, PredefinedVital> = {
  heart_rate: { enabled: true, label: "F. Cardíaca", unit: "/min", loinc: "8867-4" },
  respiratory_rate: { enabled: true, label: "F. Respiratoria", unit: "/min", loinc: "9279-1" },
  systolic_bp: { enabled: true, label: "T/A Sistólica", unit: "mmHg", loinc: "8480-6" },
  diastolic_bp: { enabled: true, label: "T/A Diastólica", unit: "mmHg", loinc: "8462-4" },
  temperature: { enabled: true, label: "Temperatura", unit: "°C", loinc: "8310-5" },
  weight: { enabled: true, label: "Peso", unit: "Kg", loinc: "29463-7" },
  height: { enabled: true, label: "Talla", unit: "m", loinc: "8302-2" },
  bmi: { enabled: true, label: "IMC", unit: "kg/m²", loinc: "39156-5", calculated: true, formula: "weight / (height * height)" },
  mean_arterial_pressure: { enabled: false, label: "TAM", unit: "mmHg", loinc: "8478-0", calculated: true, formula: "(systolic_bp + 2 * diastolic_bp) / 3" },
  body_surface_area: { enabled: false, label: "Sup. Corporal", unit: "m²", loinc: "3140-1", calculated: true, formula: "0.007184 * Math.pow(weight, 0.425) * Math.pow(height * 100, 0.725)" },
  oxygen_saturation: { enabled: true, label: "SaO2", unit: "%", loinc: "2708-6" },
};

const VITAL_ORDER = [
  "heart_rate", "respiratory_rate", "systolic_bp", "diastolic_bp",
  "temperature", "weight", "height", "bmi",
  "mean_arterial_pressure", "body_surface_area", "oxygen_saturation",
];

export const Vitals: React.FC<ContentComponentProps> = ({ question, onUpdate, readOnly }) => {
  const predefinedVitals = question.predefinedVitals || DEFAULT_PREDEFINED_VITALS;
  const customVitals = question.customVitals || [];
  const columns = question.layout?.columns || 3;
  const showBmiClassification = question.showBmiClassification ?? true;

  // Initialize predefined vitals on first render if not set
  React.useEffect(() => {
    if (!question.predefinedVitals) {
      onUpdate({
        predefinedVitals: DEFAULT_PREDEFINED_VITALS,
        layout: { columns: 3 },
        customVitals: [],
        showBmiClassification: true,
      });
    }
  }, []);

  const toggleVital = (key: string, enabled: boolean) => {
    const updated = { ...predefinedVitals, [key]: { ...predefinedVitals[key], enabled } };
    onUpdate({ predefinedVitals: updated });
  };

  const setColumns = (val: string) => {
    onUpdate({ layout: { columns: parseInt(val) } });
  };

  const toggleBmiClassification = (val: boolean) => {
    onUpdate({ showBmiClassification: val });
  };

  const addCustomVital = () => {
    const newVital: CustomVital = {
      id: nanoid(6),
      label: "",
      unit: "",
      valueType: "number",
      calculated: false,
    };
    onUpdate({ customVitals: [...customVitals, newVital] });
  };

  const updateCustomVital = (id: string, data: Partial<CustomVital>) => {
    onUpdate({
      customVitals: customVitals.map((v) => (v.id === id ? { ...v, ...data } : v)),
    });
  };

  const removeCustomVital = (id: string) => {
    onUpdate({ customVitals: customVitals.filter((v) => v.id !== id) });
  };

  if (readOnly) {
    const enabledVitals = VITAL_ORDER.filter((k) => predefinedVitals[k]?.enabled);
    return (
      <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {enabledVitals.map((key) => {
          const v = predefinedVitals[key];
          return (
            <div key={key} className="flex flex-col">
              <span className="text-xs text-muted-foreground">{v.label} ({v.unit})</span>
              <Input type={v.calculated ? "text" : "number"} disabled placeholder={v.calculated ? "Auto" : "—"} className="h-8 text-sm" />
            </div>
          );
        })}
        {customVitals.filter((c) => !c.calculated).map((c) => (
          <div key={c.id} className="flex flex-col">
            <span className="text-xs text-muted-foreground">{c.label} ({c.unit})</span>
            <Input type={c.valueType === "number" ? "number" : "text"} disabled placeholder="—" className="h-8 text-sm" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-5">
      {/* Predefined vitals */}
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
          Signos vitales predefinidos
        </Label>
        <div className="space-y-0.5">
          {VITAL_ORDER.map((key) => {
            const v = predefinedVitals[key];
            if (!v) return null;
            return (
              <div key={key} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={v.enabled}
                    onCheckedChange={(checked) => toggleVital(key, checked)}
                  />
                  <span className="text-sm text-foreground">{v.label}</span>
                  <span className="text-xs text-muted-foreground">({v.unit})</span>
                </div>
                <div className="flex items-center gap-2">
                  {v.calculated && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Auto</Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground tabular-nums font-mono">{v.loinc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Layout */}
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
          Layout
        </Label>
        <Select value={String(columns)} onValueChange={setColumns}>
          <SelectTrigger className="w-48 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 columnas</SelectItem>
            <SelectItem value="3">3 columnas</SelectItem>
            <SelectItem value="4">4 columnas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Custom vitals */}
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
          Campos personalizados adicionales
        </Label>
        {customVitals.length > 0 && (
          <div className="space-y-2 mb-2">
            {customVitals.map((cv) => (
              <div key={cv.id} className="flex items-center gap-2 p-2 rounded-md border border-border">
                <Input
                  value={cv.label}
                  onChange={(e) => updateCustomVital(cv.id, { label: e.target.value })}
                  placeholder="Etiqueta"
                  className="h-7 text-sm flex-1"
                />
                <Input
                  value={cv.unit}
                  onChange={(e) => updateCustomVital(cv.id, { unit: e.target.value })}
                  placeholder="Unidad"
                  className="h-7 text-sm w-20"
                />
                <Select
                  value={cv.valueType}
                  onValueChange={(val) => updateCustomVital(cv.id, { valueType: val as "number" | "text" })}
                >
                  <SelectTrigger className="h-7 text-sm w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number">Número</SelectItem>
                    <SelectItem value="text">Texto</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                  <Switch
                    checked={cv.calculated}
                    onCheckedChange={(checked) => updateCustomVital(cv.id, { calculated: checked, formula: checked ? "" : undefined })}
                  />
                  <span className="text-[10px] text-muted-foreground">Calc</span>
                </div>
                {cv.calculated && (
                  <Input
                    value={cv.formula || ""}
                    onChange={(e) => updateCustomVital(cv.id, { formula: e.target.value })}
                    placeholder="Fórmula"
                    className="h-7 text-sm flex-1 font-mono text-xs"
                  />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => removeCustomVital(cv.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
        <Button variant="outline" size="sm" className="text-xs" onClick={addCustomVital}>
          <Plus size={14} className="mr-1" />
          Agregar campo personalizado
        </Button>
      </div>

      {/* BMI classification toggle */}
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
          Clasificación de IMC
        </Label>
        <div className="flex items-center gap-3">
          <Switch checked={showBmiClassification} onCheckedChange={toggleBmiClassification} />
          <span className="text-sm text-foreground">Mostrar clasificación de IMC (OMS)</span>
        </div>
      </div>
    </div>
  );
};
