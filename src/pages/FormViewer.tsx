
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { QuestionRenderer } from '@/components/forms/form-viewer/question-renderer';
import { QuestionData } from '@/components/forms/question/types';
import { FormTitle } from '@/components/ui/form-title';
import { BackButton } from '@/App';
import { Check, Link as LinkIcon, FileText, Printer } from 'lucide-react';
import { toast } from "sonner";
import { Form as FormType } from './Home';
import { FormLoading } from '@/components/forms/form-viewer/form-loading';
import { FormError } from '@/components/forms/form-viewer/form-error';
import { FormSubmissionSuccess } from '@/components/forms/form-viewer/form-submission-success';
import { createDynamicSchema, fetchFormById, saveFormResponse } from '@/utils/form-utils';

interface FormData {
  [key: string]: any;
}

const FormViewer = () => {
  const { id: formId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({});
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [formTitle, setFormTitle] = useState("Formulario");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<"forms" | "formato">("forms");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const loadForm = async () => {
      if (formId) {
        setLoading(true);
        setError("");
        
        try {
          const result = fetchFormById(formId);
          
          if (result.form) {
            setQuestions(result.form.questions as QuestionData[]);
            setFormTitle(result.form.title);
            setFormDescription(result.form.description);
            // Ensure we're handling the type correctly
            if (result.form.formType === "forms" || result.form.formType === "formato") {
              setFormType(result.form.formType);
            }
            
            if (result.error) {
              setError(result.error);
            }
          }
        } catch (error) {
          console.error('Error loading form:', error);
          setError("Error al cargar el formulario");
        } finally {
          setLoading(false);
        }
      }
    };

    loadForm();
  }, [formId]);

  const dynamicSchema = createDynamicSchema(questions);
  
  const form = useForm<z.infer<typeof dynamicSchema>>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: formData,
  });

  const handleInputChange = (id: string, value: any) => {
    console.log(`Updating field ${id} with value:`, value);
    setFormData(prevData => ({
      ...prevData,
      [id]: value,
    }));
  };

  const onSubmit = (values: z.infer<typeof dynamicSchema>) => {
    console.log("Formulario enviado:", values);
    
    // Process any special field types that need additional handling
    const processedValues = { ...values };
    
    // For any special field types, we need to manually process them
    questions.forEach(question => {
      if (question.type === "vitals" && question.vitalType === "TA") {
        processedValues[question.id] = {
          sys: formData[`${question.id}_sys`],
          dia: formData[`${question.id}_dia`]
        };
      } else if (question.type === "clinical") {
        processedValues[question.id] = {
          title: formData[`${question.id}_title`],
          detail: formData[`${question.id}_detail`]
        };
      } else if (question.type === "multifield" && question.multifields) {
        const multifieldValues: Record<string, string> = {};
        question.multifields.forEach(field => {
          multifieldValues[field.id] = formData[`${question.id}_${field.id}`] || '';
        });
        processedValues[question.id] = multifieldValues;
      }
    });
    
    // Guardar la respuesta en localStorage
    if (formId) {
      saveFormResponse(formId, processedValues);
    }
    
    setSubmitted(true);
    toast("Formulario enviado correctamente", {
      description: "Gracias por completar el formulario",
      duration: 5000,
    });
  };

  const copyFormLinkToClipboard = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);
    toast("Enlace copiado al portapapeles", {
      description: "Ahora puedes compartir el formulario",
      icon: <Check size={16} className="text-green-500" />,
    });
  };

  const printForm = () => {
    window.print();
  };

  if (loading) {
    return <FormLoading />;
  }

  if (error && !questions.length) {
    return <FormError error={error} />;
  }

  if (submitted) {
    return <FormSubmissionSuccess onResubmit={() => setSubmitted(false)} />;
  }

  return (
    <div className="container py-12 print:py-6 print:mx-0 print:w-full print:max-w-none">
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-2xl font-bold">{formTitle}</h1>
        {formDescription && <p className="text-gray-600">{formDescription}</p>}
      </div>

      <div className="print:hidden">
        <BackButton />
      </div>
      
      <div className="mb-6 flex justify-between items-center print:hidden">
        <FormTitle 
          defaultTitle={formTitle}
          defaultDescription={formDescription}
          readOnly={true}
        />
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={printForm}
            className="flex items-center gap-2"
          >
            <Printer size={16} />
            Imprimir
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={copyFormLinkToClipboard}
            className="flex items-center gap-2"
          >
            <LinkIcon size={16} />
            Compartir
          </Button>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 print:shadow-none print:border-none">
        <FormProvider {...form}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {questions.map(question => (
                <QuestionRenderer
                  key={question.id}
                  question={question}
                  formData={formData}
                  onChange={handleInputChange}
                  errors={form.formState.errors}
                />
              ))}
              <Button type="submit" className="w-full sm:w-auto print:hidden">Enviar respuestas</Button>
            </form>
          </Form>
        </FormProvider>
      </div>
    </div>
  );
};

export default FormViewer;
