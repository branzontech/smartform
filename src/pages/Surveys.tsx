
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, PlusCircle } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SurveyCard } from "@/components/surveys/survey-card";
import { Survey } from "@/components/surveys/types";
import { useToast } from "@/hooks/use-toast";

// Datos de ejemplo para mostrar encuestas
const exampleSurveys: Survey[] = [
  {
    id: "1",
    title: "Encuesta de satisfacción de clientes",
    description: "Ayúdanos a mejorar nuestros servicios respondiendo a esta breve encuesta sobre tu experiencia reciente.",
    sections: [
      {
        id: "sec-1",
        title: "Información general",
        questions: [
          {
            id: "q1",
            type: "short-text",
            title: "¿Cómo podemos mejorar nuestros servicios?",
            required: true,
          }
        ]
      }
    ],
    settings: {
      showProgressBar: true,
      allowAnonymousResponses: true,
      showQuestionsNumbers: true,
      allowSaveAndContinue: false,
      requireAuthentication: false,
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    status: "published",
  },
  {
    id: "2",
    title: "Encuesta de evaluación de producto",
    description: "Nos gustaría conocer tu opinión sobre nuestro nuevo producto. Tus respuestas nos ayudarán a mejorarlo.",
    sections: [
      {
        id: "sec-1",
        title: "Evaluación",
        questions: [
          {
            id: "q1",
            type: "rating",
            title: "¿Cómo calificarías nuestro producto?",
            required: true,
          }
        ]
      }
    ],
    settings: {
      showProgressBar: true,
      allowAnonymousResponses: true,
      showQuestionsNumbers: true,
      allowSaveAndContinue: false,
      requireAuthentication: false,
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    status: "draft",
  },
];

const Surveys = () => {
  const [surveys, setSurveys] = useState<Survey[]>(exampleSurveys);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreateSurvey = () => {
    navigate("/encuestas/crear");
  };

  const handleViewSurvey = (id: string) => {
    navigate(`/encuestas/${id}`);
  };

  const handleEditSurvey = (id: string) => {
    navigate(`/encuestas/${id}/editar`);
  };

  const handleDeleteSurvey = (id: string) => {
    // Aquí se implementaría la lógica para eliminar la encuesta
    setSurveys(surveys.filter(survey => survey.id !== id));
    toast({
      title: "Encuesta eliminada",
      description: "La encuesta ha sido eliminada exitosamente.",
    });
  };

  const handleDuplicateSurvey = (id: string) => {
    const surveyToDuplicate = surveys.find(survey => survey.id === id);
    if (surveyToDuplicate) {
      const duplicatedSurvey: Survey = {
        ...surveyToDuplicate,
        id: `${Date.now()}`,
        title: `${surveyToDuplicate.title} (copia)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "draft",
      };
      setSurveys([...surveys, duplicatedSurvey]);
      toast({
        title: "Encuesta duplicada",
        description: "Se ha creado una copia de la encuesta.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header showCreate={false} />
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Encuestas</h1>
            <p className="text-muted-foreground">
              Crea y gestiona tus encuestas
            </p>
          </div>
          <Button 
            onClick={handleCreateSurvey}
            className="bg-form-primary hover:bg-form-primary/90"
          >
            <PlusCircle size={16} className="mr-2" />
            Nueva encuesta
          </Button>
        </div>

        {surveys.length === 0 ? (
          <EmptyState
            title="No hay encuestas"
            description="Comienza creando tu primera encuesta"
            buttonText="Crear encuesta"
            onClick={handleCreateSurvey}
            icon={<ClipboardList size={48} className="text-gray-300" />}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {surveys.map((survey) => (
              <SurveyCard
                key={survey.id}
                survey={survey}
                onView={handleViewSurvey}
                onEdit={handleEditSurvey}
                onDelete={handleDeleteSurvey}
                onDuplicate={handleDuplicateSurvey}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Surveys;
