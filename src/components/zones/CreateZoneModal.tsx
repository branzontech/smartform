import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Palette, FileText, X, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LatLng } from '@/types/zone-types';
import { cn } from '@/lib/utils';

interface CreateZoneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coordinates: LatLng[];
  onSave: (data: { name: string; description: string; color: string }) => void;
}

const PRESET_COLORS = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
];

export const CreateZoneModal: React.FC<CreateZoneModalProps> = ({
  open,
  onOpenChange,
  coordinates,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), description: description.trim(), color });
    setName('');
    setDescription('');
    setColor(PRESET_COLORS[0]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            Nueva Zona
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="zone-name" className="text-sm font-medium">
              Nombre de la zona *
            </Label>
            <Input
              id="zone-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Zona Norte, Centro Histórico..."
              className="rounded-xl"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="zone-description" className="text-sm font-medium">
              Descripción (opcional)
            </Label>
            <Textarea
              id="zone-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe las características de esta zona..."
              className="rounded-xl resize-none"
              rows={3}
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Color de la zona
            </Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((presetColor) => (
                <motion.button
                  key={presetColor}
                  onClick={() => setColor(presetColor)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "w-8 h-8 rounded-lg transition-all relative",
                    color === presetColor && "ring-2 ring-offset-2 ring-primary"
                  )}
                  style={{ backgroundColor: presetColor }}
                >
                  {color === presetColor && (
                    <Check className="w-4 h-4 text-white absolute inset-0 m-auto" />
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Coordinates info */}
          <div className="p-3 rounded-xl bg-muted/50 border border-border/30">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Polígono:</span> {coordinates.length} vértices
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!name.trim()}
            className="bg-lime hover:bg-lime/90 text-lime-foreground"
          >
            <Check className="w-4 h-4 mr-2" />
            Crear Zona
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateZoneModal;
