import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, FileText } from 'lucide-react';
import { Form as FormType } from '@/pages/Home';

interface AdditionalFormsModalProps {
  onAddForm: (formId: string) => void;
  excludeFormIds: string[];
}

export const AdditionalFormsModal: React.FC<AdditionalFormsModalProps> = ({
  onAddForm,
  excludeFormIds
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableForms, setAvailableForms] = useState<FormType[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadAvailableForms();
    }
  }, [isOpen]);

  const loadAvailableForms = () => {
    const savedForms = localStorage.getItem("forms");
    if (savedForms) {
      try {
        const forms: FormType[] = JSON.parse(savedForms);
        // Filter out forms that are already selected and have questions
        const filtered = forms.filter(form => 
          !excludeFormIds.includes(form.id) && 
          form.questions && 
          form.questions.length > 0
        );
        setAvailableForms(filtered);
      } catch (error) {
        console.error('Error loading forms:', error);
        setAvailableForms([]);
      }
    }
  };

  const filteredForms = availableForms.filter(form =>
    form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddForm = (formId: string) => {
    onAddForm(formId);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Plus size={14} className="mr-1" />
          Agregar formulario
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Agregar formulario adicional</DialogTitle>
          <DialogDescription>
            Selecciona un formulario adicional para incluir en esta consulta
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="space-y-2">
            <Label htmlFor="search">Buscar formularios</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                id="search"
                placeholder="Buscar por título o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto space-y-3">
            {filteredForms.length === 0 ? (
              <div className="text-center py-8">
                <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'No se encontraron formularios' : 'No hay formularios disponibles'}
                </p>
              </div>
            ) : (
              filteredForms.map(form => (
                <Card key={form.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{form.title}</CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {form.description}
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddForm(form.id)}
                        className="ml-4"
                      >
                        <Plus size={14} className="mr-1" />
                        Agregar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {form.questions?.length || 0} preguntas
                      </Badge>
                      {form.responseCount > 0 && (
                        <Badge variant="outline">
                          {form.responseCount} respuestas
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};