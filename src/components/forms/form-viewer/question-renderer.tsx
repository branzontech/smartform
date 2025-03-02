import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { QuestionData, Diagnosis, MultifieldConfig } from "../question/types";

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
      return (
        <FormField
          control={useFormContext().control}
          name={question.id}
          rules={{ required: question.required }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{question.title}</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Signos vitales" required={question.required} />
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
              <FormControl>
                <Input {...field} placeholder="Diagnóstico" required={question.required} />
              </FormControl>
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
              <FormControl>
                <Input {...field} placeholder="Datos clínicos" required={question.required} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
      
    case "multifield":
      return (
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
      );
      
    default:
      return <div>Tipo de pregunta no soportado</div>;
  }
};
