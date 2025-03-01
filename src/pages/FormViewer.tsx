import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils";

interface QuestionData {
  id: string;
  type: string;
  title: string;
  required: boolean;
  options?: string[];
  formula?: string;
  min?: number;
  max?: number;
  units?: string;
  diagnoses?: Diagnosis[];
  vitalType?: string;
  sysMin?: number;
  sysMax?: number;
  diaMin?: number;
  diaMax?: number;
  fileTypes?: string[];
  maxFileSize?: number;
  multifields?: MultifieldConfig[];
  orientation?: "vertical" | "horizontal";
}

export interface MultifieldConfig {
  id: string;
  label: string;
}

export interface Diagnosis {
  id: string;
  code: string;
  name: string;
}

interface FormData {
  [key: string]: any;
}

interface QuestionRendererProps {
  question: QuestionData;
  formData: FormData;
  onChange: (id: string, value: any) => void;
  errors: any;
}

const QuestionRenderer = ({ question, formData, onChange, errors }: QuestionRendererProps) => {
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

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
});

import { useFormContext } from 'react-hook-form';

const FormViewer = () => {
  const router = useRouter();
  const { formId } = router.query;
  const [formData, setFormData] = useState<FormData>({});
  const [questions, setQuestions] = useState<QuestionData[]>([]);

  useEffect(() => {
    const fetchForm = async () => {
      if (formId) {
        try {
          const response = await fetch(`/api/forms/${formId}`);
          if (response.ok) {
            const data = await response.json();
            setQuestions(data.questions);
          } else {
            console.error('Failed to fetch form:', response.status);
          }
        } catch (error) {
          console.error('Error fetching form:', error);
        }
      }
    };

    fetchForm();
  }, [formId]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  const handleInputChange = (id: string, value: any) => {
    setFormData(prevData => ({
      ...prevData,
      [id]: value,
    }));
  };

  return (
    <div className="container py-12">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {questions.map(question => (
            <QuestionRenderer
              key={question.id}
              question={question}
              formData={formData}
              onChange={handleInputChange}
              errors={form.errors}
            />
          ))}
          <Button type="submit">Submit</Button>
        </form>
      </Form>
    </div>
  );
};

export default FormViewer;
