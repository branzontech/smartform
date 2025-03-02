
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, Save, Settings } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { QuestionTypeIcon, SURVEY_QUESTION_TYPES } from "@/components/surveys/question-type-options";
import { Card, CardContent } from "@/components/ui/card";

const SurveyCreator = () => {
  const [title, setTitle] = useState("Nueva encuesta");
  const [description, setDescription] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSave = () => {
    // Aquí iría la lógica para guardar la encuesta
    toast({
      title: "Encuesta guardada",
      description: "La encuesta se ha guardado correctamente",
    });
    navigate("/encuestas");
  };

  const handleCancel = () => {
    navigate("/encuestas");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header showCreate={false} />
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="mb-6 flex justify-between items-center">
          <Button 
            variant="back"
            onClick={handleCancel}
            className="flex items-center"
          >
            <ChevronLeft size={16} className="mr-1" />
            Volver a encuestas
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {}}>
              <Settings size={16} className="mr-2" />
              Configuración
            </Button>
            <Button className="bg-form-primary hover:bg-form-primary/90" onClick={handleSave}>
              <Save size={16} className="mr-2" />
              Guardar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Barra lateral */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-4">
              <h3 className="font-medium mb-3">Preguntas</h3>
              <div className="grid grid-cols-2 gap-2">
                {SURVEY_QUESTION_TYPES.map((type) => (
                  <Button
                    key={type.id}
                    variant="outline"
                    className="h-auto py-2 justify-start flex-col items-start"
                    onClick={() => {
                      toast({
                        title: "Tipo de pregunta",
                        description: `Has seleccionado: ${type.label}`,
                      });
                    }}
                  >
                    <QuestionTypeIcon type={type.id} className="mb-1" />
                    <span className="text-xs">{type.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Área principal */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título de la encuesta</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Escribe el título de tu encuesta"
                      className="text-xl font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción (opcional)</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Escribe una breve descripción de tu encuesta"
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Área para agregar preguntas */}
            <div className="flex justify-center my-8">
              <Button 
                variant="outline" 
                className="border-dashed border-2 py-6"
                onClick={() => {
                  toast({
                    title: "Acción en desarrollo",
                    description: "Funcionalidad para agregar secciones en desarrollo",
                  });
                }}
              >
                <Plus size={16} className="mr-2" />
                Agregar sección
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SurveyCreator;
