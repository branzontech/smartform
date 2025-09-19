import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Settings, Plus, Trash2, Edit, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface QuickLink {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  isFavorite: boolean;
}

interface QuickLinksManagerProps {
  onNavigate: (url: string) => void;
}

const DEFAULT_QUICK_LINKS: QuickLink[] = [
  {
    id: '1',
    title: 'Administración de Medicamentos',
    description: 'Gestión y control de medicamentos del paciente',
    url: '/app/medicamentos',
    category: 'Medicamentos',
    isFavorite: true
  },
  {
    id: '2',
    title: 'Solicitud de Insumos a Farmacia',
    description: 'Realizar pedidos de insumos médicos',
    url: '/app/farmacia/solicitudes',
    category: 'Farmacia',
    isFavorite: true
  },
  {
    id: '3',
    title: 'Historia Clínica Completa',
    description: 'Ver el historial médico completo del paciente',
    url: '/app/pacientes/historia',
    category: 'Pacientes',
    isFavorite: false
  },
  {
    id: '4',
    title: 'Laboratorio Clínico',
    description: 'Solicitar exámenes de laboratorio',
    url: '/app/laboratorio',
    category: 'Exámenes',
    isFavorite: false
  }
];

export const QuickLinksManager: React.FC<QuickLinksManagerProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadQuickLinks();
  }, []);

  const loadQuickLinks = () => {
    const saved = localStorage.getItem('quickLinks');
    if (saved) {
      try {
        setQuickLinks(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading quick links:', error);
        setQuickLinks(DEFAULT_QUICK_LINKS);
        saveQuickLinks(DEFAULT_QUICK_LINKS);
      }
    } else {
      setQuickLinks(DEFAULT_QUICK_LINKS);
      saveQuickLinks(DEFAULT_QUICK_LINKS);
    }
  };

  const saveQuickLinks = (links: QuickLink[]) => {
    localStorage.setItem('quickLinks', JSON.stringify(links));
    setQuickLinks(links);
  };

  const toggleFavorite = (id: string) => {
    const updated = quickLinks.map(link =>
      link.id === id ? { ...link, isFavorite: !link.isFavorite } : link
    );
    saveQuickLinks(updated);
  };

  const deleteLink = (id: string) => {
    const updated = quickLinks.filter(link => link.id !== id);
    saveQuickLinks(updated);
    toast({
      title: "Vínculo eliminado",
      description: "El vínculo rápido ha sido eliminado correctamente"
    });
  };

  const startEditing = (link: QuickLink | null = null) => {
    setEditingLink(link || {
      id: Date.now().toString(),
      title: '',
      description: '',
      url: '',
      category: '',
      isFavorite: false
    });
    setIsEditing(true);
  };

  const saveLink = () => {
    if (!editingLink) return;

    if (!editingLink.title.trim() || !editingLink.url.trim()) {
      toast({
        title: "Campos requeridos",
        description: "El título y la URL son campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    const isNewLink = !quickLinks.find(link => link.id === editingLink.id);
    let updated: QuickLink[];

    if (isNewLink) {
      updated = [...quickLinks, editingLink];
    } else {
      updated = quickLinks.map(link =>
        link.id === editingLink.id ? editingLink : link
      );
    }

    saveQuickLinks(updated);
    setIsEditing(false);
    setEditingLink(null);
    
    toast({
      title: isNewLink ? "Vínculo creado" : "Vínculo actualizado",
      description: `El vínculo "${editingLink.title}" ha sido ${isNewLink ? 'creado' : 'actualizado'} correctamente`
    });
  };

  const favoriteLinks = quickLinks.filter(link => link.isFavorite);
  const categories = [...new Set(quickLinks.map(link => link.category))].filter(Boolean);

  return (
    <div className="space-y-3">
      {/* Favorite Links */}
      {favoriteLinks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Star size={14} className="text-yellow-500 fill-current" />
            <span className="text-xs font-medium text-muted-foreground">Favoritos</span>
          </div>
          {favoriteLinks.map(link => (
            <Button
              key={link.id}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-left h-auto p-2"
              onClick={() => onNavigate(link.url)}
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{link.title}</div>
                <div className="text-xs text-muted-foreground truncate">{link.description}</div>
              </div>
              <ExternalLink size={12} className="ml-2 opacity-50" />
            </Button>
          ))}
        </div>
      )}

      {/* Settings Button */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <Settings size={14} className="mr-1" />
            Gestionar vínculos
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Gestionar vínculos rápidos</DialogTitle>
            <DialogDescription>
              Personaliza los vínculos rápidos para acceso directo a funcionalidades importantes
            </DialogDescription>
          </DialogHeader>

          {!isEditing ? (
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Vínculos disponibles</h3>
                <Button size="sm" onClick={() => startEditing()}>
                  <Plus size={14} className="mr-1" />
                  Nuevo vínculo
                </Button>
              </div>

              <div className="flex-1 overflow-auto space-y-3">
                {categories.map(category => (
                  <div key={category} className="space-y-2">
                    <Badge variant="outline" className="text-xs">{category}</Badge>
                    {quickLinks
                      .filter(link => link.category === category)
                      .map(link => (
                        <Card key={link.id} className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-medium truncate">{link.title}</h4>
                                {link.isFavorite && (
                                  <Star size={12} className="text-yellow-500 fill-current" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
                              <code className="text-xs bg-muted px-1 rounded mt-1 inline-block">{link.url}</code>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleFavorite(link.id)}
                              >
                                <Star size={14} className={link.isFavorite ? 'text-yellow-500 fill-current' : ''} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditing(link)}
                              >
                                <Edit size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteLink(link.id)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={editingLink?.title || ''}
                      onChange={(e) => setEditingLink(prev => prev ? { ...prev, title: e.target.value } : null)}
                      placeholder="Nombre del vínculo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Input
                      id="category"
                      value={editingLink?.category || ''}
                      onChange={(e) => setEditingLink(prev => prev ? { ...prev, category: e.target.value } : null)}
                      placeholder="Categoría del vínculo"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Input
                    id="description"
                    value={editingLink?.description || ''}
                    onChange={(e) => setEditingLink(prev => prev ? { ...prev, description: e.target.value } : null)}
                    placeholder="Descripción del vínculo"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="url">URL *</Label>
                  <Input
                    id="url"
                    value={editingLink?.url || ''}
                    onChange={(e) => setEditingLink(prev => prev ? { ...prev, url: e.target.value } : null)}
                    placeholder="/app/ejemplo"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="favorite"
                    checked={editingLink?.isFavorite || false}
                    onChange={(e) => setEditingLink(prev => prev ? { ...prev, isFavorite: e.target.checked } : null)}
                  />
                  <Label htmlFor="favorite">Marcar como favorito</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setIsEditing(false); setEditingLink(null); }}>
                  Cancelar
                </Button>
                <Button onClick={saveLink}>
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};