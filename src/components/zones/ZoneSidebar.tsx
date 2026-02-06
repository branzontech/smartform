import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Edit2, 
  Users, 
  Stethoscope,
  ChevronRight,
  Layers,
  Search,
  Filter,
  BarChart3,
  Navigation,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Zone, GeocodedLocation, DrawingMode } from '@/types/zone-types';

interface ZoneSidebarProps {
  zones: Zone[];
  locations: GeocodedLocation[];
  selectedZone: Zone | null;
  selectedZoneIds: string[];
  drawingMode: DrawingMode;
  entityFilter: 'all' | 'patient' | 'professional';
  onSelectZone: (zone: Zone | null) => void;
  onToggleZoneFilter: (zoneId: string) => void;
  onSelectAllZones: () => void;
  onClearZoneFilters: () => void;
  onDeleteZone: (zoneId: string) => void;
  onStartDrawing: () => void;
  onCancelDrawing: () => void;
  onEditZone: (zone: Zone) => void;
  onEntityFilterChange: (filter: 'all' | 'patient' | 'professional') => void;
}

export const ZoneSidebar: React.FC<ZoneSidebarProps> = ({
  zones,
  locations,
  selectedZone,
  selectedZoneIds,
  drawingMode,
  entityFilter,
  onSelectZone,
  onToggleZoneFilter,
  onSelectAllZones,
  onClearZoneFilters,
  onDeleteZone,
  onStartDrawing,
  onCancelDrawing,
  onEditZone,
  onEntityFilterChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter zones by search
  const filteredZones = zones.filter(zone =>
    zone.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get zone statistics
  const getZoneStats = (zoneId: string) => {
    const zoneLocations = locations.filter(loc => loc.zone_id === zoneId);
    const patients = zoneLocations.filter(loc => loc.entity_type === 'patient').length;
    const professionals = zoneLocations.filter(loc => loc.entity_type === 'professional').length;
    return { patients, professionals, total: patients + professionals };
  };

  // Get occupancy level color
  const getOccupancyColor = (total: number) => {
    if (total === 0) return 'bg-muted text-muted-foreground';
    if (total < 5) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
    if (total < 15) return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
    return 'bg-rose-500/10 text-rose-600 border-rose-500/30';
  };

  // Filter locations
  const filteredLocations = locations.filter(loc => {
    if (entityFilter !== 'all' && loc.entity_type !== entityFilter) return false;
    if (selectedZoneIds.length > 0 && !selectedZoneIds.includes(loc.zone_id || '')) return false;
    return true;
  });

  // Locations visible count
  const visiblePatients = filteredLocations.filter(l => l.entity_type === 'patient').length;
  const visibleProfessionals = filteredLocations.filter(l => l.entity_type === 'professional').length;

  return (
    <div className="h-full flex flex-col bg-card/50 backdrop-blur-sm border-r border-border/30">
      {/* Header */}
      <div className="p-4 border-b border-border/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Zonas Geográficas</h2>
            <p className="text-xs text-muted-foreground">{zones.length} zonas configuradas</p>
          </div>
        </div>

        {/* Drawing controls */}
        {drawingMode === 'polygon' ? (
          <div className="p-3 rounded-xl bg-lime/10 border border-lime/30">
            <p className="text-sm font-medium text-lime-foreground mb-2">
              Modo dibujo activo
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Haz clic en el mapa para crear los vértices del polígono
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onCancelDrawing}
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        ) : (
          <Button 
            onClick={onStartDrawing}
            className="w-full bg-lime hover:bg-lime/90 text-lime-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Zona
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar zona..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 rounded-xl text-sm"
          />
        </div>
      </div>

      {/* Zones list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {filteredZones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay zonas creadas</p>
              <p className="text-xs mt-1">Crea tu primera zona dibujando un polígono</p>
            </div>
          ) : (
            filteredZones.map((zone) => {
              const stats = getZoneStats(zone.id);
              const isSelected = selectedZone?.id === zone.id;

              return (
                <motion.div
                  key={zone.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-3 rounded-xl cursor-pointer transition-all",
                    isSelected
                      ? "bg-primary/10 ring-2 ring-primary/30"
                      : "bg-background hover:bg-muted/50 border border-border/30"
                  )}
                  onClick={() => onSelectZone(isSelected ? null : zone)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: zone.color }}
                      />
                      <span className="font-medium text-sm">{zone.name}</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn("text-[10px]", getOccupancyColor(stats.total))}
                    >
                      {stats.total} ubicaciones
                    </Badge>
                  </div>

                  {zone.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {zone.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-emerald-500" />
                      {stats.patients} pacientes
                    </span>
                    <span className="flex items-center gap-1">
                      <Stethoscope className="w-3 h-3 text-violet-500" />
                      {stats.professionals} profesionales
                    </span>
                  </div>

                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex gap-2 mt-3 pt-3 border-t border-border/20"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditZone(zone);
                        }}
                        className="flex-1 h-8 text-xs"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteZone(zone.id);
                        }}
                        className="h-8 text-xs text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Filter controls - always visible */}
      <div className="border-t border-border/20">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">Filtrar por zonas</span>
            {selectedZoneIds.length > 0 ? (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClearZoneFilters}
                className="h-6 text-xs text-muted-foreground"
              >
                <EyeOff className="w-3 h-3 mr-1" />
                Limpiar
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onSelectAllZones}
                className="h-6 text-xs text-muted-foreground"
              >
                <Eye className="w-3 h-3 mr-1" />
                Todas
              </Button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-1.5 mb-3">
            {zones.map((zone) => (
              <Badge
                key={zone.id}
                variant={selectedZoneIds.includes(zone.id) ? "default" : "outline"}
                className={cn(
                  "cursor-pointer text-[10px] transition-all",
                  selectedZoneIds.includes(zone.id) 
                    ? "bg-primary" 
                    : "hover:bg-muted"
                )}
                onClick={() => onToggleZoneFilter(zone.id)}
              >
                <div 
                  className="w-2 h-2 rounded-full mr-1"
                  style={{ backgroundColor: zone.color }}
                />
                {zone.name}
                {selectedZoneIds.includes(zone.id) && (
                  <Check className="w-3 h-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Tipo de entidad</span>
            <Select value={entityFilter} onValueChange={(v: any) => onEntityFilterChange(v)}>
              <SelectTrigger className="w-32 h-7 text-xs">
                <Filter className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="patient">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-emerald-500" />
                    Pacientes
                  </span>
                </SelectItem>
                <SelectItem value="professional">
                  <span className="flex items-center gap-1">
                    <Stethoscope className="w-3 h-3 text-violet-500" />
                    Profesionales
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Locations list */}
        <ScrollArea className="h-32 px-4">
          <div className="space-y-1.5 pb-2">
            {filteredLocations.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No hay ubicaciones con estos filtros
              </p>
            ) : (
              filteredLocations.map((loc) => (
                <div
                  key={loc.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs"
                >
                  {loc.entity_type === 'patient' ? (
                    <Users className="w-3 h-3 text-emerald-500 shrink-0" />
                  ) : (
                    <Stethoscope className="w-3 h-3 text-violet-500 shrink-0" />
                  )}
                  <span className="flex-1 truncate">{loc.entity_name}</span>
                  {loc.zone_id && zones.find(z => z.id === loc.zone_id) && (
                    <div 
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: zones.find(z => z.id === loc.zone_id)?.color }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Stats footer */}
      <div className="p-4 border-t border-border/20 bg-muted/20">
        <div className="flex items-center justify-center gap-1 mb-2">
          <span className="text-xs text-muted-foreground">
            Mostrando {filteredLocations.length} de {locations.length} ubicaciones
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-500">
              {visiblePatients}
            </p>
            <p className="text-[10px] text-muted-foreground">Pacientes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-violet-500">
              {visibleProfessionals}
            </p>
            <p className="text-[10px] text-muted-foreground">Profesionales</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoneSidebar;
