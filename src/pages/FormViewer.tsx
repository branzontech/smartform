
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, FormProvider } from "react-hook-form"
import * as z from "zod"
import { cn } from "@/lib/utils";
import { QuestionRenderer } from '@/components/forms/form-viewer/question-renderer';
import { QuestionData } from '@/components/forms/question/types';

interface FormData {
  [key: string]: any;
}

const formSchema = z.object({
  // Schema will be dynamically built based on questions
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
});

const FormViewer = () => {
  const { id: formId } = useParams();
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
  });

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
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </FormProvider>
    </div>
  );
};

export default FormViewer;
