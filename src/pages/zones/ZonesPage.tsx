import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, RefreshCw, Upload, Download, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { ZoneMap, ZoneSidebar, CreateZoneModal } from '@/components/zones';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { Zone, GeocodedLocation, LatLng, DrawingMode } from '@/types/zone-types';
import { supabase } from '@/integrations/supabase/client';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from '@/components/ui/resizable';

// Mock data for demo (will be replaced with DB data)
const MOCK_LOCATIONS: GeocodedLocation[] = [
  {
    id: '1',
    entity_type: 'patient',
    entity_id: 'p1',
    entity_name: 'Juan Pérez García',
    address: 'Calle 100 #15-20',
    city: 'Bogotá',
    lat: 4.6836,
    lng: -74.0547,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    entity_type: 'patient',
    entity_id: 'p2',
    entity_name: 'María García López',
    address: 'Carrera 7 #45-10',
    city: 'Bogotá',
    lat: 4.6486,
    lng: -74.0628,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    entity_type: 'professional',
    entity_id: 'dr1',
    entity_name: 'Dr. Carlos Jiménez',
    address: 'Avenida 19 #120-45',
    city: 'Bogotá',
    lat: 4.7018,
    lng: -74.0425,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    entity_type: 'professional',
    entity_id: 'dr2',
    entity_name: 'Dra. Laura Sánchez',
    address: 'Calle 72 #10-34',
    city: 'Bogotá',
    lat: 4.6609,
    lng: -74.0566,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    entity_type: 'patient',
    entity_id: 'p3',
    entity_name: 'Carlos Rodríguez',
    address: 'Calle 85 #11-53',
    city: 'Bogotá',
    lat: 4.6722,
    lng: -74.0542,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const ZonesPage: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [locations, setLocations] = useState<GeocodedLocation[]>(MOCK_LOCATIONS);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
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
        // For demo, use env variable directly
        // In production, you'd fetch this from a secure endpoint
        const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (key) {
          setApiKey(key);
        } else {
          // Try to get from localStorage for demo
          const stored = localStorage.getItem('google_maps_api_key');
          if (stored) {
            setApiKey(stored);
          }
        }
      } catch (error) {
        console.error('Error fetching API key:', error);
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
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-64px)]">
          {/* Sidebar */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
            <ZoneSidebar
              zones={zones}
              locations={locations}
              selectedZone={selectedZone}
              drawingMode={drawingMode}
              onSelectZone={setSelectedZone}
              onDeleteZone={handleDeleteZone}
              onStartDrawing={() => setDrawingMode('polygon')}
              onCancelDrawing={() => setDrawingMode('none')}
              onEditZone={(zone) => {
                toast.info('Edición de zona próximamente');
              }}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Map */}
          <ResizablePanel defaultSize={75}>
            <div className="h-full p-4">
              {isLoaded ? (
                <ZoneMap
                  zones={zones}
                  locations={locations}
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
