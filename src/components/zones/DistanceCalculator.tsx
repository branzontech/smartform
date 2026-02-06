import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Navigation, 
  Plus, 
  Trash2, 
  Calculator,
  Route,
  DollarSign,
  Clock,
  Ruler,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { LatLng } from '@/types/zone-types';
import { toast } from 'sonner';

interface DistanceCalculatorProps {
  apiKey: string;
  className?: string;
}

interface Waypoint {
  id: string;
  label: string;
  position: LatLng | null;
  address: string;
}

interface RouteResult {
  distance: number; // in km
  duration: number; // in minutes
  polyline: string;
}

// Dark map style for distance calculator
const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#64779e' }] },
  { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry.stroke', stylers: [{ color: '#334e87' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#023e58' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6f9ba5' }] },
  { featureType: 'poi', elementType: 'labels.text.stroke', stylers: [{ color: '#1d2c4d' }] },
  { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#023e58' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#3C7680' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
  { featureType: 'road', elementType: 'labels.text.stroke', stylers: [{ color: '#1d2c4d' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2c6675' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#b0d5ce' }] },
  { featureType: 'road.highway', elementType: 'labels.text.stroke', stylers: [{ color: '#023e58' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
  { featureType: 'transit', elementType: 'labels.text.stroke', stylers: [{ color: '#1d2c4d' }] },
  { featureType: 'transit.line', elementType: 'geometry.fill', stylers: [{ color: '#283d6a' }] },
  { featureType: 'transit.station', elementType: 'geometry', stylers: [{ color: '#3a4762' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6d70' }] },
];

const CARTAGENA_CENTER = { lat: 10.3910, lng: -75.4794 };

export const DistanceCalculator: React.FC<DistanceCalculatorProps> = ({
  apiKey,
  className,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  
  // Refs to track current state for click handler (avoid stale closures)
  const waypointsRef = useRef<Waypoint[]>([]);
  const activeWaypointIdRef = useRef<string | null>('A');
  
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([
    { id: 'A', label: 'Origen', position: null, address: '' },
    { id: 'B', label: 'Destino', position: null, address: '' },
  ]);
  const [activeWaypointId, setActiveWaypointId] = useState<string | null>('A');
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [pricePerKm, setPricePerKm] = useState<number>(3500);
  const [baseFare, setBaseFare] = useState<number>(5000);
  const [isCalculating, setIsCalculating] = useState(false);

  // Keep refs in sync with state
  useEffect(() => {
    waypointsRef.current = waypoints;
  }, [waypoints]);

  useEffect(() => {
    activeWaypointIdRef.current = activeWaypointId;
  }, [activeWaypointId]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;

    const map = new google.maps.Map(mapRef.current, {
      center: CARTAGENA_CENTER,
      zoom: 13,
      styles: DARK_MAP_STYLE,
      mapTypeControl: false,
      fullscreenControl: true,
      streetViewControl: false,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_CENTER,
      },
    });

    googleMapRef.current = map;
    
    // Initialize directions renderer
    directionsRendererRef.current = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#22C55E',
        strokeWeight: 5,
        strokeOpacity: 0.8,
      },
    });

    setIsMapLoaded(true);

    return () => {
      markersRef.current.forEach(m => m.setMap(null));
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
      if (clickListenerRef.current) {
        google.maps.event.removeListener(clickListenerRef.current);
      }
    };
  }, [apiKey]);

  // Setup click listener (separate effect to handle state changes)
  useEffect(() => {
    const map = googleMapRef.current;
    if (!map || !isMapLoaded) return;

    // Remove previous listener
    if (clickListenerRef.current) {
      google.maps.event.removeListener(clickListenerRef.current);
    }

    // Add click listener for placing waypoints
    clickListenerRef.current = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      const currentActiveId = activeWaypointIdRef.current;
      if (!e.latLng || !currentActiveId) return;
      
      const position = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      const currentWaypoints = waypointsRef.current;
      
      // Create address string (geocoding may fail without proper API key)
      const address = `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
      
      // Update waypoint
      setWaypoints(prev => prev.map(wp => 
        wp.id === currentActiveId 
          ? { ...wp, position, address }
          : wp
      ));
      
      // Move to next waypoint
      const currentIndex = currentWaypoints.findIndex(wp => wp.id === currentActiveId);
      const nextWaypoint = currentWaypoints[currentIndex + 1];
      if (nextWaypoint && !nextWaypoint.position) {
        setActiveWaypointId(nextWaypoint.id);
      } else {
        setActiveWaypointId(null);
      }
      
      // Try to reverse geocode (optional, don't block on failure)
      try {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: e.latLng }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            setWaypoints(prev => prev.map(wp => 
              wp.id === currentActiveId 
                ? { ...wp, address: results[0].formatted_address }
                : wp
            ));
          }
        });
      } catch (error) {
        console.warn('Geocoding failed:', error);
      }
    });

    return () => {
      if (clickListenerRef.current) {
        google.maps.event.removeListener(clickListenerRef.current);
      }
    };
  }, [isMapLoaded]);

  // Update markers when waypoints change
  useEffect(() => {
    if (!googleMapRef.current || !isMapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current.clear();

    // Create markers for each waypoint with position
    waypoints.forEach((wp, index) => {
      if (!wp.position) return;

      const colors = ['#22C55E', '#EF4444', '#F59E0B', '#3B82F6'];
      const color = colors[index % colors.length];
      
      const marker = new google.maps.Marker({
        position: wp.position,
        map: googleMapRef.current,
        label: {
          text: wp.id,
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '14px',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 15,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 3,
        },
        zIndex: 1000 - index,
      });

      markersRef.current.set(wp.id, marker);
    });
  }, [waypoints, isMapLoaded]);

  // Calculate route
  const calculateRoute = useCallback(async () => {
    if (!googleMapRef.current) return;
    
    const validWaypoints = waypoints.filter(wp => wp.position);
    if (validWaypoints.length < 2) return;

    setIsCalculating(true);
    
    const directionsService = new google.maps.DirectionsService();
    
    const origin = validWaypoints[0].position!;
    const destination = validWaypoints[validWaypoints.length - 1].position!;
    const intermediateWaypoints = validWaypoints.slice(1, -1).map(wp => ({
      location: wp.position!,
      stopover: true,
    }));

    try {
      const result = await directionsService.route({
        origin,
        destination,
        waypoints: intermediateWaypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      });

      if (result.routes[0]) {
        const route = result.routes[0];
        let totalDistance = 0;
        let totalDuration = 0;

        route.legs.forEach(leg => {
          totalDistance += leg.distance?.value || 0;
          totalDuration += leg.duration?.value || 0;
        });

        setRouteResult({
          distance: totalDistance / 1000,
          duration: Math.round(totalDuration / 60),
          polyline: route.overview_polyline,
        });

        directionsRendererRef.current?.setDirections(result);
      }
    } catch (error: any) {
      console.error('Error calculating route:', error);
      
      // Show user-friendly error message
      if (error?.code === 'REQUEST_DENIED') {
        toast.error('Error al calcular la ruta', {
          description: 'La Directions API no está habilitada. Habilítala en Google Cloud Console.',
          duration: 10000,
        });
      } else if (error?.code === 'ZERO_RESULTS') {
        toast.error('No se encontró ruta', {
          description: 'No hay ruta disponible entre los puntos seleccionados.',
        });
      } else {
        toast.error('Error al calcular la ruta', {
          description: error?.message || 'Ocurrió un error inesperado.',
        });
      }
    } finally {
      setIsCalculating(false);
    }
  }, [waypoints]);

  // Auto-calculate when all waypoints are set
  useEffect(() => {
    const allSet = waypoints.every(wp => wp.position);
    if (allSet && waypoints.length >= 2) {
      calculateRoute();
    }
  }, [waypoints, calculateRoute]);

  // Add waypoint
  const addWaypoint = () => {
    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
    const nextLabel = labels[waypoints.length];
    if (!nextLabel) return;

    setWaypoints(prev => [
      ...prev.slice(0, -1),
      { id: nextLabel, label: `Parada ${nextLabel}`, position: null, address: '' },
      prev[prev.length - 1],
    ]);
  };

  // Remove waypoint
  const removeWaypoint = (id: string) => {
    if (waypoints.length <= 2) return;
    setWaypoints(prev => prev.filter(wp => wp.id !== id));
    setRouteResult(null);
    directionsRendererRef.current?.setDirections({ routes: [] } as any);
  };

  // Clear all
  const clearAll = () => {
    setWaypoints([
      { id: 'A', label: 'Origen', position: null, address: '' },
      { id: 'B', label: 'Destino', position: null, address: '' },
    ]);
    setActiveWaypointId('A');
    setRouteResult(null);
    directionsRendererRef.current?.setDirections({ routes: [] } as any);
  };

  // Calculate total price
  const totalPrice = routeResult 
    ? baseFare + (routeResult.distance * pricePerKm)
    : 0;

  // Format currency
  const formatCOP = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className={cn("h-full flex", className)}>
      {/* Sidebar */}
      <div className="w-80 flex flex-col bg-card/50 backdrop-blur-sm border-r border-border/30 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Route className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="font-semibold">Calcular Distancia</h2>
              <p className="text-xs text-muted-foreground">Estima el costo del trayecto</p>
            </div>
          </div>
        </div>

        {/* Waypoints */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Puntos del trayecto</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={addWaypoint}
              disabled={waypoints.length >= 6}
              className="h-7 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Agregar
            </Button>
          </div>

          <AnimatePresence>
            {waypoints.map((wp, index) => (
              <motion.div
                key={wp.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={cn(
                  "p-3 rounded-xl border transition-all cursor-pointer",
                  activeWaypointId === wp.id
                    ? "bg-primary/10 border-primary/30 ring-2 ring-primary/20"
                    : wp.position
                      ? "bg-muted/30 border-border/30"
                      : "bg-background border-dashed border-muted-foreground/30"
                )}
                onClick={() => !wp.position && setActiveWaypointId(wp.id)}
              >
                <div className="flex items-start gap-3">
                  <div 
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0",
                      index === 0 ? "bg-emerald-500" :
                      index === waypoints.length - 1 ? "bg-red-500" :
                      "bg-amber-500"
                    )}
                  >
                    {wp.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        {wp.label}
                      </span>
                      {index > 0 && index < waypoints.length - 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeWaypoint(wp.id);
                          }}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    {wp.position ? (
                      <p className="text-xs mt-1 line-clamp-2">{wp.address}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        {activeWaypointId === wp.id 
                          ? "Haz clic en el mapa..." 
                          : "Sin seleccionar"}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <Button
            variant="outline"
            size="sm"
            onClick={clearAll}
            className="w-full mt-2"
          >
            <Trash2 className="w-3 h-3 mr-2" />
            Limpiar todo
          </Button>
        </div>

        {/* Pricing config */}
        <div className="p-4 border-t border-border/20 space-y-3">
          <span className="text-sm font-medium">Configuración de tarifa</span>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Base</Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <Input
                  type="number"
                  value={baseFare}
                  onChange={(e) => setBaseFare(Number(e.target.value))}
                  className="h-8 pl-7 text-xs"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Por km</Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <Input
                  type="number"
                  value={pricePerKm}
                  onChange={(e) => setPricePerKm(Number(e.target.value))}
                  className="h-8 pl-7 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {routeResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border-t border-border/20 bg-emerald-500/5"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Ruler className="w-4 h-4" />
                  <span className="text-xs">Distancia</span>
                </div>
                <span className="font-semibold">{routeResult.distance.toFixed(2)} km</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs">Tiempo estimado</span>
                </div>
                <span className="font-semibold">{routeResult.duration} min</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calculator className="w-4 h-4" />
                  <span className="text-xs">Precio base</span>
                </div>
                <span className="text-sm">{formatCOP(baseFare)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Route className="w-4 h-4" />
                  <span className="text-xs">Por distancia</span>
                </div>
                <span className="text-sm">{formatCOP(routeResult.distance * pricePerKm)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total estimado</span>
                <Badge className="text-lg bg-emerald-500 hover:bg-emerald-600">
                  {formatCOP(totalPrice)}
                </Badge>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />
        
        {!isMapLoaded && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Cargando mapa...</p>
            </div>
          </div>
        )}

        {isCalculating && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg border border-border/30">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Calculando ruta...</span>
            </div>
          </div>
        )}

        {/* Instructions */}
        {activeWaypointId && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg border border-border/30">
            <p className="text-sm">
              Haz clic en el mapa para marcar el punto <span className="font-bold">{activeWaypointId}</span>
            </p>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-card/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-border/30">
          <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Ruta</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-500" />
              <span className="text-xs">Origen</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-amber-500" />
              <span className="text-xs">Paradas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <span className="text-xs">Destino</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistanceCalculator;
