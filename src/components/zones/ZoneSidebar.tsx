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
    <div className="h-full flex flex-col bg-card/50 backdrop-blur-sm border-r border-border/30 overflow-hidden">
      {/* Header - Fixed */}
      <div className="p-3 border-b border-border/20 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Zonas Geográficas</h2>
            <p className="text-[10px] text-muted-foreground">{zones.length} zonas configuradas</p>
          </div>
        </div>

        {/* Drawing controls */}
        {drawingMode === 'polygon' ? (
          <div className="p-2 rounded-lg bg-lime/10 border border-lime/30">
            <p className="text-xs font-medium text-lime-foreground mb-1">
              Modo dibujo activo
            </p>
            <p className="text-[10px] text-muted-foreground mb-2">
              Haz clic en el mapa para crear los vértices
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onCancelDrawing}
              className="w-full h-7 text-xs"
            >
              Cancelar
            </Button>
          </div>
        ) : (
          <Button 
            onClick={onStartDrawing}
            size="sm"
            className="w-full h-8 bg-lime hover:bg-lime/90 text-lime-foreground text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Nueva Zona
          </Button>
        )}
      </div>

      {/* Scrollable content */}
      <ScrollArea className="flex-1">
        {/* Search */}
        <div className="p-3 border-b border-border/20">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar zona..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 rounded-lg text-xs"
            />
          </div>
        </div>

        {/* Zones list */}
        <div className="p-3 space-y-2">
          {filteredZones.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No hay zonas creadas</p>
              <p className="text-[10px] mt-1">Crea tu primera zona dibujando un polígono</p>
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
                    "p-2.5 rounded-lg cursor-pointer transition-all",
                    isSelected
                      ? "bg-primary/10 ring-2 ring-primary/30"
                      : "bg-background hover:bg-muted/50 border border-border/30"
                  )}
                  onClick={() => onSelectZone(isSelected ? null : zone)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: zone.color }}
                      />
                      <span className="font-medium text-xs">{zone.name}</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn("text-[9px] px-1.5 py-0", getOccupancyColor(stats.total))}
                    >
                      {stats.total}
                    </Badge>
                  </div>

                  {zone.description && (
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                      {zone.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Users className="w-2.5 h-2.5 text-emerald-500" />
                      {stats.patients}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Stethoscope className="w-2.5 h-2.5 text-violet-500" />
                      {stats.professionals}
                    </span>
                  </div>

                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex gap-1.5 mt-2 pt-2 border-t border-border/20"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditZone(zone);
                        }}
                        className="flex-1 h-6 text-[10px]"
                      >
                        <Edit2 className="w-2.5 h-2.5 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteZone(zone.id);
                        }}
                        className="h-6 text-[10px] text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>

        {/* Filter controls */}
        <div className="border-t border-border/20">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold">Filtrar por zonas</span>
              {selectedZoneIds.length > 0 ? (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClearZoneFilters}
                  className="h-5 text-[10px] text-muted-foreground px-1"
                >
                  <EyeOff className="w-2.5 h-2.5 mr-0.5" />
                  Limpiar
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onSelectAllZones}
                  className="h-5 text-[10px] text-muted-foreground px-1"
                >
                  <Eye className="w-2.5 h-2.5 mr-0.5" />
                  Todas
                </Button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-1 mb-2">
              {zones.map((zone) => (
                <Badge
                  key={zone.id}
                  variant={selectedZoneIds.includes(zone.id) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer text-[9px] px-1.5 py-0 transition-all",
                    selectedZoneIds.includes(zone.id) 
                      ? "bg-primary" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => onToggleZoneFilter(zone.id)}
                >
                  <div 
                    className="w-1.5 h-1.5 rounded-full mr-1"
                    style={{ backgroundColor: zone.color }}
                  />
                  {zone.name}
                  {selectedZoneIds.includes(zone.id) && (
                    <Check className="w-2.5 h-2.5 ml-0.5" />
                  )}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Tipo</span>
              <Select value={entityFilter} onValueChange={(v: any) => onEntityFilterChange(v)}>
                <SelectTrigger className="w-28 h-6 text-[10px]">
                  <Filter className="w-2.5 h-2.5 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Todos</SelectItem>
                  <SelectItem value="patient" className="text-xs">
                    <span className="flex items-center gap-1">
                      <Users className="w-2.5 h-2.5 text-emerald-500" />
                      Pacientes
                    </span>
                  </SelectItem>
                  <SelectItem value="professional" className="text-xs">
                    <span className="flex items-center gap-1">
                      <Stethoscope className="w-2.5 h-2.5 text-violet-500" />
                      Profesionales
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Locations list */}
        <div className="max-h-28 overflow-auto px-3 pb-2">
          <div className="space-y-1">
            {filteredLocations.length === 0 ? (
              <p className="text-[10px] text-muted-foreground text-center py-3">
                No hay ubicaciones con estos filtros
              </p>
            ) : (
              filteredLocations.map((loc) => (
                <div
                  key={loc.id}
                  className="flex items-center gap-1.5 p-1.5 rounded-md bg-muted/30 text-[10px]"
                >
                  {loc.entity_type === 'patient' ? (
                    <Users className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                  ) : (
                    <Stethoscope className="w-2.5 h-2.5 text-violet-500 shrink-0" />
                  )}
                  <span className="flex-1 truncate">{loc.entity_name}</span>
                  {loc.zone_id && zones.find(z => z.id === loc.zone_id) && (
                    <div 
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: zones.find(z => z.id === loc.zone_id)?.color }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Stats footer - Fixed */}
      <div className="p-3 border-t border-border/20 bg-muted/20 shrink-0">
        <div className="flex items-center justify-center gap-1 mb-1.5">
          <span className="text-[10px] text-muted-foreground">
            {filteredLocations.length} de {locations.length} ubicaciones
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-500">
              {visiblePatients}
            </p>
            <p className="text-[9px] text-muted-foreground">Pacientes</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-violet-500">
              {visibleProfessionals}
            </p>
            <p className="text-[9px] text-muted-foreground">Profesionales</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoneSidebar;
