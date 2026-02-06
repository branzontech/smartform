import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, RefreshCw, Upload, Download, Settings2, Route, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ZoneMap, ZoneSidebar, CreateZoneModal, DistanceCalculator } from '@/components/zones';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { Zone, GeocodedLocation, LatLng, DrawingMode } from '@/types/zone-types';
import { supabase } from '@/integrations/supabase/client';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from '@/components/ui/resizable';

// Mock data for demo - Cartagena de Indias, Colombia
const MOCK_LOCATIONS: GeocodedLocation[] = [
  {
    id: '1',
    entity_type: 'patient',
    entity_id: 'p1',
    entity_name: 'Juan Pérez García',
    address: 'Calle del Arsenal #10-40, Centro Histórico',
    city: 'Cartagena',
    lat: 10.4236,
    lng: -75.5498,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    entity_type: 'patient',
    entity_id: 'p2',
    entity_name: 'María García López',
    address: 'Av. San Martín #8-15, Bocagrande',
    city: 'Cartagena',
    lat: 10.3997,
    lng: -75.5561,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    entity_type: 'professional',
    entity_id: 'dr1',
    entity_name: 'Dr. Carlos Jiménez',
    address: 'Calle 30 #18-45, Manga',
    city: 'Cartagena',
    lat: 10.4157,
    lng: -75.5389,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    entity_type: 'professional',
    entity_id: 'dr2',
    entity_name: 'Dra. Laura Sánchez',
    address: 'Calle Real #35-20, Getsemaní',
    city: 'Cartagena',
    lat: 10.4218,
    lng: -75.5471,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    entity_type: 'patient',
    entity_id: 'p3',
    entity_name: 'Carlos Rodríguez',
    address: 'Av. Pedro de Heredia #45-60, La Castellana',
    city: 'Cartagena',
    lat: 10.4089,
    lng: -75.5125,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    entity_type: 'patient',
    entity_id: 'p4',
    entity_name: 'Ana Martínez Díaz',
    address: 'Calle 70 #9-25, Crespo',
    city: 'Cartagena',
    lat: 10.4456,
    lng: -75.5134,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const ZonesPage: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [locations, setLocations] = useState<GeocodedLocation[]>(MOCK_LOCATIONS);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);
  const [entityFilter, setEntityFilter] = useState<'all' | 'patient' | 'professional'>('all');
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('none');
  const [pendingCoordinates, setPendingCoordinates] = useState<LatLng[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiKey, setApiKey] = useState<string>('');

  const { isLoaded, loadError, isPointInPolygon, getPolygonCenter } = useGoogleMaps({
    apiKey: apiKey,
  });

  // Fetch API key from edge function (for security)
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        // First try localStorage (for user-entered keys)
        const stored = localStorage.getItem('google_maps_api_key');
        if (stored && stored.length > 10) {
          setApiKey(stored);
          return;
        }

        // Then try to fetch from edge function (for configured secrets)
        const response = await supabase.functions.invoke('get-maps-config');
        if (response.data?.apiKey) {
          setApiKey(response.data.apiKey);
          // Cache it in localStorage for faster subsequent loads
          localStorage.setItem('google_maps_api_key', response.data.apiKey);
          return;
        }

        // Clear any invalid cached value
        localStorage.removeItem('google_maps_api_key');
      } catch (error) {
        console.error('Error fetching API key:', error);
        // Clear any invalid cached value on error
        localStorage.removeItem('google_maps_api_key');
      }
    };
    fetchApiKey();
  }, []);

  // Load zones from database
  useEffect(() => {
    const loadZones = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('zones')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Transform the data to match our Zone type
        const transformedZones: Zone[] = (data || []).map(zone => ({
          ...zone,
          polygon_coordinates: zone.polygon_coordinates as unknown as LatLng[],
        }));
        
        setZones(transformedZones);
      } catch (error) {
        console.error('Error loading zones:', error);
        // Load from localStorage as fallback
        const saved = localStorage.getItem('zones');
        if (saved) {
          setZones(JSON.parse(saved));
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadZones();
  }, []);

  // Assign locations to zones
  useEffect(() => {
    if (!isLoaded || zones.length === 0) return;

    const updatedLocations = locations.map(loc => {
      if (!loc.lat || !loc.lng) return loc;

      for (const zone of zones) {
        if (isPointInPolygon({ lat: loc.lat, lng: loc.lng }, zone.polygon_coordinates)) {
          return { ...loc, zone_id: zone.id };
        }
      }
      return { ...loc, zone_id: undefined };
    });

    setLocations(updatedLocations);
  }, [zones, isLoaded, isPointInPolygon]);

  const handleZoneCreated = useCallback((coordinates: LatLng[]) => {
    setPendingCoordinates(coordinates);
    setIsCreateModalOpen(true);
    setDrawingMode('none');
  }, []);

  const handleSaveZone = async (data: { name: string; description: string; color: string }) => {
    try {
      const center = getPolygonCenter(pendingCoordinates);
      
      const newZoneData = {
        name: data.name,
        description: data.description,
        color: data.color,
        polygon_coordinates: JSON.parse(JSON.stringify(pendingCoordinates)),
        center_lat: center.lat,
        center_lng: center.lng,
      };

      // Save to database
      const { data: savedZone, error } = await supabase
        .from('zones')
        .insert([newZoneData])
        .select()
        .single();

      if (error) throw error;

      const transformedZone: Zone = {
        ...savedZone,
        polygon_coordinates: savedZone.polygon_coordinates as unknown as LatLng[],
      };

      setZones(prev => [transformedZone, ...prev]);
      
      // Also save to localStorage as backup
      const allZones = [transformedZone, ...zones];
      localStorage.setItem('zones', JSON.stringify(allZones));

      toast.success('Zona creada exitosamente');
      setIsCreateModalOpen(false);
      setPendingCoordinates([]);
    } catch (error) {
      console.error('Error saving zone:', error);
      toast.error('Error al guardar la zona');
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    try {
      const { error } = await supabase
        .from('zones')
        .delete()
        .eq('id', zoneId);

      if (error) throw error;

      setZones(prev => prev.filter(z => z.id !== zoneId));
      if (selectedZone?.id === zoneId) {
        setSelectedZone(null);
      }
      
      // Update localStorage
      const remaining = zones.filter(z => z.id !== zoneId);
      localStorage.setItem('zones', JSON.stringify(remaining));

      toast.success('Zona eliminada');
    } catch (error) {
      console.error('Error deleting zone:', error);
      toast.error('Error al eliminar la zona');
    }
  };

  const handleLocationSelected = (location: GeocodedLocation) => {
    toast.info(`${location.entity_name}`, {
      description: location.address,
    });
  };

  // Zone filter handlers
  const handleToggleZoneFilter = useCallback((zoneId: string) => {
    setSelectedZoneIds(prev => 
      prev.includes(zoneId) 
        ? prev.filter(id => id !== zoneId)
        : [...prev, zoneId]
    );
  }, []);

  const handleSelectAllZones = useCallback(() => {
    setSelectedZoneIds(zones.map(z => z.id));
  }, [zones]);

  const handleClearZoneFilters = useCallback(() => {
    setSelectedZoneIds([]);
  }, []);

  // Filter locations based on selected zones and entity type
  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      if (entityFilter !== 'all' && loc.entity_type !== entityFilter) return false;
      if (selectedZoneIds.length > 0 && !selectedZoneIds.includes(loc.zone_id || '')) return false;
      return true;
    });
  }, [locations, entityFilter, selectedZoneIds]);

  // Show API key input if not set
  if (!apiKey) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full bg-card rounded-2xl p-8 border border-border/30 shadow-lg"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Configurar Google Maps</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Ingresa tu API key de Google Maps para habilitar la funcionalidad de mapas
              </p>
            </div>
            
            <input
              type="text"
              placeholder="Tu API key de Google Maps"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background mb-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = (e.target as HTMLInputElement).value;
                  if (value) {
                    localStorage.setItem('google_maps_api_key', value);
                    setApiKey(value);
                  }
                }
              }}
            />
            <Button
              className="w-full"
              onClick={() => {
                const input = document.querySelector('input') as HTMLInputElement;
                if (input?.value) {
                  localStorage.setItem('google_maps_api_key', input.value);
                  setApiKey(input.value);
                }
              }}
            >
              Guardar y continuar
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center text-destructive">
            <p>Error al cargar Google Maps</p>
            <p className="text-sm text-muted-foreground mt-2">{loadError.message}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />
      <main className="flex-1 overflow-hidden">
        <Tabs defaultValue="zones" className="h-full flex flex-col">
          {/* Tab Headers */}
          <div className="px-4 pt-3 pb-2 border-b border-border/30 bg-card/30 backdrop-blur-sm">
            <TabsList className="grid w-fit grid-cols-2">
              <TabsTrigger value="zones" className="gap-2">
                <Layers className="w-4 h-4" />
                Zonas
              </TabsTrigger>
              <TabsTrigger value="distance" className="gap-2">
                <Route className="w-4 h-4" />
                Calcular Distancia
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Zones Tab */}
          <TabsContent value="zones" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
            <ResizablePanelGroup direction="horizontal" className="h-full overflow-hidden">
              {/* Sidebar */}
              <ResizablePanel defaultSize={25} minSize={20} maxSize={35} className="overflow-hidden">
                <ZoneSidebar
                  zones={zones}
                  locations={locations}
                  selectedZone={selectedZone}
                  selectedZoneIds={selectedZoneIds}
                  drawingMode={drawingMode}
                  entityFilter={entityFilter}
                  onSelectZone={setSelectedZone}
                  onToggleZoneFilter={handleToggleZoneFilter}
                  onSelectAllZones={handleSelectAllZones}
                  onClearZoneFilters={handleClearZoneFilters}
                  onDeleteZone={handleDeleteZone}
                  onStartDrawing={() => setDrawingMode('polygon')}
                  onCancelDrawing={() => setDrawingMode('none')}
                  onEditZone={(zone) => {
                    toast.info('Edición de zona próximamente');
                  }}
                  onEntityFilterChange={setEntityFilter}
                />
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Map */}
              <ResizablePanel defaultSize={75} className="overflow-hidden">
                <div className="h-full p-4 overflow-hidden">
                  {isLoaded ? (
                    <ZoneMap
                      zones={zones}
                      locations={filteredLocations}
                      selectedZone={selectedZone}
                      drawingMode={drawingMode}
                      onZoneCreated={handleZoneCreated}
                      onZoneSelected={setSelectedZone}
                      onLocationSelected={handleLocationSelected}
                      apiKey={apiKey}
                      className="h-full"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center bg-muted/20 rounded-2xl">
                      <div className="text-center">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                        <p className="text-sm text-muted-foreground">Cargando mapa...</p>
                      </div>
                    </div>
                  )}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </TabsContent>

          {/* Distance Calculator Tab */}
          <TabsContent value="distance" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
            {isLoaded ? (
              <DistanceCalculator apiKey={apiKey} className="h-full" />
            ) : (
              <div className="h-full flex items-center justify-center bg-muted/20">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Cargando mapa...</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Zone Modal */}
      <CreateZoneModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        coordinates={pendingCoordinates}
        onSave={handleSaveZone}
      />
    </div>
  );
};

export default ZonesPage;
