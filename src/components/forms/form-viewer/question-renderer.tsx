import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SignaturePad } from "@/components/ui/question-types";
import { QuestionData } from "../question/types";
import { FileUp } from "lucide-react";

interface QuestionRendererProps {
  question: QuestionData;
  formData: Record<string, any>;
  onChange: (id: string, value: any) => void;
  errors: any;
}

export const QuestionRenderer = ({ question, formData, onChange, errors }: QuestionRendererProps) => {
  switch (question.type) {
    case "short":
      return (
        <FormField
          control={useFormContext().control}
          name={question.id}
          rules={{ required: question.required }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{question.title}</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Respuesta corta" required={question.required} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    case "paragraph":
      return (
        <FormField
          control={useFormContext().control}
          name={question.id}
          rules={{ required: question.required }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{question.title}</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Párrafo" rows={3} required={question.required} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    case "multiple":
      return (
        <FormField
          control={useFormContext().control}
          name={question.id}
          rules={{ required: question.required }}
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>{question.title}</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                  {question.options?.map((option, i) => (
                    <FormItem key={i} className="flex items-center space-x-3 space-y-0">
                      <RadioGroupItem value={option} id={`${question.id}-${i}`} className="peer shrink-0" />
                      <FormLabel htmlFor={`${question.id}-${i}`} className="cursor-pointer peer-checked:text-foreground">
                        {option}
                      </FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    case "checkbox":
      return (
        <FormField
          control={useFormContext().control}
          name={question.id}
          rules={{ required: question.required }}
          render={({ field }) => (
            <FormItem className="flex flex-col space-y-3">
              <FormLabel>{question.title}</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  {question.options?.map((option, i) => (
                    <FormItem key={i} className="flex items-center space-x-3 space-y-0">
                      <Checkbox
                        checked={Array.isArray(field.value) && field.value.includes(option)}
                        onCheckedChange={(checked) => {
                          const newValues = checked
                            ? [...(field.value || []), option]
                            : Array.isArray(field.value)
                              ? field.value.filter((v: any) => v !== option)
                              : [];
                          field.onChange(newValues);
                        }}
                        id={`${question.id}-${i}`}
                        className="peer shrink-0"
                      />
                      <FormLabel htmlFor={`${question.id}-${i}`} className="cursor-pointer peer-checked:text-foreground">
                        {option}
                      </FormLabel>
                    </FormItem>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    case "dropdown":
      return (
        <FormField
          control={useFormContext().control}
          name={question.id}
          rules={{ required: question.required }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{question.title}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una opción" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {question.options?.map((option, i) => (
                    <SelectItem key={i} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    case "calculation":
      return (
        <FormField
          control={useFormContext().control}
          name={question.id}
          rules={{ required: question.required }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{question.title}</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Resultado del cálculo" disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    case "vitals":
      if (question.vitalType === "TA") {
        return (
          <div className="space-y-2">
            <FormLabel>{question.title}</FormLabel>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                placeholder="Sistólica"
                value={formData[`${question.id}_sys`] || ""}
                onChange={(e) => onChange(`${question.id}_sys`, e.target.value)}
                className="w-1/2"
              />
              <span className="text-lg">/</span>
              <Input
                type="number"
                placeholder="Diastólica"
                value={formData[`${question.id}_dia`] || ""}
                onChange={(e) => onChange(`${question.id}_dia`, e.target.value)}
                className="w-1/2"
              />
            </div>
            {question.required && (!formData[`${question.id}_sys`] || !formData[`${question.id}_dia`]) && errors[question.id] && (
              <p className="text-sm font-medium text-destructive">Este campo es obligatorio</p>
            )}
          </div>
        );
      } else if (question.vitalType === "IMC") {
        const calculateBMI = () => {
          const weight = parseFloat(formData[`${question.id}_weight`] || "0");
          const height = parseFloat(formData[`${question.id}_height`] || "0");
          
          if (weight > 0 && height > 0) {
            const heightInMeters = height / 100;
            const bmi = weight / (heightInMeters * heightInMeters);
            return bmi.toFixed(2);
          }
          return "";
        };
        
        const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          onChange(`${question.id}_weight`, e.target.value);
          const bmi = calculateBMI();
          onChange(`${question.id}_bmi`, bmi);
        };
        
        const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          onChange(`${question.id}_height`, e.target.value);
          const bmi = calculateBMI();
          onChange(`${question.id}_bmi`, bmi);
        };
        
        return (
          <div className="space-y-2">
            <FormLabel>{question.title}</FormLabel>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-500">Peso (kg)</label>
                <Input
                  type="number"
                  placeholder="Peso"
                  value={formData[`${question.id}_weight`] || ""}
                  onChange={handleWeightChange}
                  required={question.required}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Altura (cm)</label>
                <Input
                  type="number"
                  placeholder="Altura"
                  value={formData[`${question.id}_height`] || ""}
                  onChange={handleHeightChange}
                  required={question.required}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">IMC</label>
                <Input
                  type="text"
                  placeholder="IMC"
                  value={formData[`${question.id}_bmi`] || ""}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>
            {question.required && 
              (!formData[`${question.id}_weight`] || !formData[`${question.id}_height`]) && 
              errors[question.id] && (
                <p className="text-sm font-medium text-destructive">Este campo es obligatorio</p>
              )
            }
          </div>
        );
      }
      return (
        <FormField
          control={useFormContext().control}
          name={question.id}
          rules={{ required: question.required }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{question.title}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  placeholder={`Valor (${question.units || ""})`}
                  required={question.required}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    case "diagnosis":
      return (
        <FormField
          control={useFormContext().control}
          name={question.id}
          rules={{ required: question.required }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{question.title}</FormLabel>
              <div className="border border-gray-300 rounded-md p-2">
                {question.diagnoses && question.diagnoses.length > 0 ? (
                  <div className="space-y-2">
                    {question.diagnoses.map(diagnosis => (
                      <div key={diagnosis.id} className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-md">
                        <span className="font-medium text-blue-700">{diagnosis.code}</span>
                        <span>-</span>
                        <span>{diagnosis.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center p-2">
                    No se han seleccionado diagnósticos
                  </div>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    case "clinical":
      return (
        <FormField
          control={useFormContext().control}
          name={question.id}
          rules={{ required: question.required }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{question.title}</FormLabel>
              <div className="space-y-2">
                <Input
                  value={formData[`${question.id}_title`] || ""}
                  onChange={(e) => onChange(`${question.id}_title`, e.target.value)}
                  placeholder="Título del dato clínico"
                  required={question.required}
                />
                <Textarea
                  value={formData[`${question.id}_detail`] || ""}
                  onChange={(e) => onChange(`${question.id}_detail`, e.target.value)}
                  placeholder="Información detallada"
                  rows={2}
                  required={question.required}
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      );
      
    case "multifield":
      return (
        <div className="space-y-2">
          <FormLabel>{question.title}</FormLabel>
          <div className={cn(
            "space-y-3",
            question.orientation === "horizontal" && "sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4"
          )}>
            {question.multifields?.map((field) => (
              <div key={field.id} className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                <input 
                  type="text" 
                  value={formData[`${question.id}_${field.id}`] || ""}
                  onChange={(e) => onChange(`${question.id}_${field.id}`, e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2"
                  required={question.required} 
                />
              </div>
            ))}
          </div>
        </div>
      );
    
    case "signature":
      return (
        <FormField
          control={useFormContext().control}
          name={question.id}
          rules={{ required: question.required }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{question.title}</FormLabel>
              <FormControl>
                <SignaturePad
                  value={field.value || ""}
                  onChange={field.onChange}
                  readOnly={false}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    
    case "file":
      return (
        <FormField
          control={useFormContext().control}
          name={question.id}
          rules={{ required: question.required }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{question.title}</FormLabel>
              <FormControl>
                <div className="border border-dashed border-gray-300 rounded-md p-4 bg-gray-50">
                  <label htmlFor={`file-upload-${question.id}`} className="cursor-pointer flex flex-col items-center">
                    <FileUp size={24} className="text-gray-500 mb-2" />
                    <span className="text-sm text-gray-700 mb-1">
                      Clic para seleccionar un archivo
                    </span>
                    <span className="text-xs text-gray-500">
                      {question.fileTypes?.join(', ') || "PDF, JPG, PNG"} (máx. {question.maxFileSize || 2}MB)
                    </span>
                    <input
                      id={`file-upload-${question.id}`}
                      type="file"
                      className="hidden"
                      accept={question.fileTypes?.join(',') || ".pdf,.jpg,.jpeg,.png"}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          field.onChange(file);
                          onChange(question.id, file);
                        }
                      }}
                      required={question.required}
                    />
                  </label>
                  {field.value && (
                    <div className="mt-3 text-sm text-left flex items-center justify-between bg-blue-50 p-2 rounded">
                      <span className="truncate max-w-[200px]">
                        {field.value.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {(field.value.size / (1024 * 1024)).toFixed(2)}MB
                      </span>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
      
    default:
      return <div>Tipo de pregunta no soportado</div>;
  }
};
