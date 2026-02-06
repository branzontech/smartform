/// <reference types="@types/google.maps" />
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Zone, GeocodedLocation, LatLng, DrawingMode } from '@/types/zone-types';
import { cn } from '@/lib/utils';

interface ZoneMapProps {
  zones: Zone[];
  locations: GeocodedLocation[];
  selectedZone: Zone | null;
  drawingMode: DrawingMode;
  onZoneCreated: (coordinates: LatLng[]) => void;
  onZoneSelected: (zone: Zone | null) => void;
  onLocationSelected: (location: GeocodedLocation) => void;
  apiKey: string;
  className?: string;
}

// Fallback to Cartagena de Indias if geolocation fails
const CARTAGENA_CENTER = { lat: 10.3910, lng: -75.4794 };
const DEFAULT_ZOOM = 13;
const CLOSE_THRESHOLD_PIXELS = 20; // Distance in pixels to close polygon

export const ZoneMap: React.FC<ZoneMapProps> = ({
  zones,
  locations,
  selectedZone,
  drawingMode,
  onZoneCreated,
  onZoneSelected,
  onLocationSelected,
  apiKey,
  className,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const polygonsRef = useRef<Map<string, google.maps.Polygon>>(new Map());
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  
  // Custom drawing state
  const drawingPointsRef = useRef<LatLng[]>([]);
  const drawingMarkersRef = useRef<google.maps.Marker[]>([]);
  const drawingPolylineRef = useRef<google.maps.Polyline | null>(null);
  const mapClickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [drawingPointsCount, setDrawingPointsCount] = useState(0);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Geolocation error:', error.message);
          setUserLocation(CARTAGENA_CENTER);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      setUserLocation(CARTAGENA_CENTER);
    }
  }, []);

  // Helper: Check if click is near starting point
  const isNearStartingPoint = useCallback((clickLatLng: google.maps.LatLng): boolean => {
    if (drawingPointsRef.current.length < 3) return false;
    
    const map = googleMapRef.current;
    if (!map) return false;
    
    const startPoint = drawingPointsRef.current[0];
    const projection = map.getProjection();
    if (!projection) return false;
    
    const scale = Math.pow(2, map.getZoom() || 0);
    const startPixel = projection.fromLatLngToPoint(new google.maps.LatLng(startPoint.lat, startPoint.lng));
    const clickPixel = projection.fromLatLngToPoint(clickLatLng);
    
    if (!startPixel || !clickPixel) return false;
    
    const distance = Math.sqrt(
      Math.pow((clickPixel.x - startPixel.x) * scale, 2) +
      Math.pow((clickPixel.y - startPixel.y) * scale, 2)
    );
    
    return distance < CLOSE_THRESHOLD_PIXELS;
  }, []);

  // Helper: Clear drawing state
  const clearDrawing = useCallback(() => {
    drawingMarkersRef.current.forEach(m => m.setMap(null));
    drawingMarkersRef.current = [];
    drawingPointsRef.current = [];
    if (drawingPolylineRef.current) {
      drawingPolylineRef.current.setMap(null);
      drawingPolylineRef.current = null;
    }
    setDrawingPointsCount(0);
  }, []);

  // Helper: Update polyline
  const updatePolyline = useCallback(() => {
    const map = googleMapRef.current;
    if (!map) return;
    
    if (drawingPolylineRef.current) {
      drawingPolylineRef.current.setPath(drawingPointsRef.current);
    } else {
      drawingPolylineRef.current = new google.maps.Polyline({
        path: drawingPointsRef.current,
        strokeColor: '#3B82F6',
        strokeWeight: 3,
        strokeOpacity: 0.8,
        map: map,
      });
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !window.google?.maps || !userLocation) return;

    const map = new google.maps.Map(mapRef.current, {
      center: userLocation,
      zoom: DEFAULT_ZOOM,
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      ],
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
        position: google.maps.ControlPosition.TOP_RIGHT,
      },
      fullscreenControl: true,
      streetViewControl: false,
      disableDoubleClickZoom: true, // Prevent double-click zoom while drawing
    });

    googleMapRef.current = map;
    setIsMapLoaded(true);

    return () => {
      polygonsRef.current.forEach(p => p.setMap(null));
      markersRef.current.forEach(m => m.setMap(null));
      if (userMarkerRef.current) userMarkerRef.current.setMap(null);
      clearDrawing();
    };
  }, [apiKey, userLocation, clearDrawing]);

  // Add user location marker
  useEffect(() => {
    if (!googleMapRef.current || !isMapLoaded || !userLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
    }

    userMarkerRef.current = new google.maps.Marker({
      position: userLocation,
      map: googleMapRef.current,
      title: 'Mi ubicación',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#3B82F6',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 3,
      },
      zIndex: 1000,
    });
  }, [isMapLoaded, userLocation]);

  // Handle drawing mode changes
  useEffect(() => {
    const map = googleMapRef.current;
    if (!map || !isMapLoaded) return;

    // Remove previous listener
    if (mapClickListenerRef.current) {
      google.maps.event.removeListener(mapClickListenerRef.current);
      mapClickListenerRef.current = null;
    }

    // Clear any existing drawing when mode changes
    if (drawingMode === 'none') {
      clearDrawing();
      map.setOptions({ draggableCursor: null });
      return;
    }

    // Set crosshair cursor when in drawing mode
    map.setOptions({ draggableCursor: 'crosshair' });

    // Add click listener for drawing
    mapClickListenerRef.current = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      
      const clickLatLng = e.latLng;
      
      // Check if clicking near starting point to close polygon
      if (isNearStartingPoint(clickLatLng)) {
        if (drawingPointsRef.current.length >= 3) {
          // Complete the polygon
          const coordinates = [...drawingPointsRef.current];
          onZoneCreated(coordinates);
          clearDrawing();
        }
        return;
      }
      
      // Add new point
      const newPoint: LatLng = { lat: clickLatLng.lat(), lng: clickLatLng.lng() };
      drawingPointsRef.current.push(newPoint);
      setDrawingPointsCount(drawingPointsRef.current.length);
      
      // Create marker for this point
      const isFirstPoint = drawingPointsRef.current.length === 1;
      const marker = new google.maps.Marker({
        position: newPoint,
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isFirstPoint ? 12 : 8,
          fillColor: isFirstPoint ? '#22C55E' : '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
        zIndex: 2000,
        title: isFirstPoint ? 'Punto inicial (clic aquí para cerrar)' : `Punto ${drawingPointsRef.current.length}`,
      });
      
      // If first point, add special click listener to close
      if (isFirstPoint) {
        marker.addListener('click', () => {
          if (drawingPointsRef.current.length >= 3) {
            const coordinates = [...drawingPointsRef.current];
            onZoneCreated(coordinates);
            clearDrawing();
          }
        });
      }
      
      drawingMarkersRef.current.push(marker);
      updatePolyline();
    });

    return () => {
      if (mapClickListenerRef.current) {
        google.maps.event.removeListener(mapClickListenerRef.current);
      }
    };
  }, [drawingMode, isMapLoaded, isNearStartingPoint, onZoneCreated, clearDrawing, updatePolyline]);

  // Render zones as polygons
  useEffect(() => {
    if (!googleMapRef.current || !isMapLoaded) return;

    polygonsRef.current.forEach(p => p.setMap(null));
    polygonsRef.current.clear();

    zones.forEach(zone => {
      const polygon = new google.maps.Polygon({
        paths: zone.polygon_coordinates,
        fillColor: zone.color,
        fillOpacity: selectedZone?.id === zone.id ? 0.5 : 0.25,
        strokeColor: zone.color,
        strokeWeight: selectedZone?.id === zone.id ? 3 : 2,
        strokeOpacity: selectedZone?.id === zone.id ? 1 : 0.7,
      });

      polygon.setMap(googleMapRef.current);
      polygonsRef.current.set(zone.id, polygon);

      polygon.addListener('click', () => {
        onZoneSelected(zone);
      });

      if (zone.center_lat && zone.center_lng) {
        const label = new google.maps.Marker({
          position: { lat: zone.center_lat, lng: zone.center_lng },
          map: googleMapRef.current,
          label: {
            text: zone.name,
            color: zone.color,
            fontWeight: 'bold',
            fontSize: '12px',
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 0,
          },
        });
        markersRef.current.set(`label-${zone.id}`, label);
      }
    });
  }, [zones, selectedZone, isMapLoaded, onZoneSelected]);

  // Render location markers
  useEffect(() => {
    if (!googleMapRef.current || !isMapLoaded) return;

    markersRef.current.forEach((marker, key) => {
      if (!key.startsWith('label-')) {
        marker.setMap(null);
        markersRef.current.delete(key);
      }
    });

    locations.forEach(location => {
      if (!location.lat || !location.lng) return;

      const isPatient = location.entity_type === 'patient';
      const marker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: googleMapRef.current,
        title: location.entity_name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: isPatient ? '#10B981' : '#8B5CF6',
          fillOpacity: 0.9,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      });

      marker.addListener('click', () => {
        onLocationSelected(location);
      });

      markersRef.current.set(location.id, marker);
    });
  }, [locations, isMapLoaded, onLocationSelected]);

  // Fit bounds when selected zone changes
  useEffect(() => {
    if (!googleMapRef.current || !selectedZone) return;

    const bounds = new google.maps.LatLngBounds();
    selectedZone.polygon_coordinates.forEach(coord => {
      bounds.extend(coord);
    });
    googleMapRef.current.fitBounds(bounds, 50);
  }, [selectedZone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("relative rounded-2xl overflow-hidden border border-border/30", className)}
    >
      <div ref={mapRef} className="w-full h-full min-h-[500px]" />
      
      {/* Loading overlay */}
      {!isMapLoaded && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando mapa...</p>
          </div>
        </div>
      )}

      {/* Drawing instructions */}
      {drawingMode === 'polygon' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg border border-border/30">
          <p className="text-sm font-medium">
            {drawingPointsCount === 0 && 'Haz clic en el mapa para comenzar a dibujar'}
            {drawingPointsCount === 1 && 'Continúa haciendo clic para agregar puntos'}
            {drawingPointsCount === 2 && 'Agrega al menos un punto más'}
            {drawingPointsCount >= 3 && (
              <span>
                <span className="text-emerald-500 font-semibold">●</span> Haz clic en el punto verde para cerrar el polígono
              </span>
            )}
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-border/30">
        <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Leyenda</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs">Pacientes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-violet-500" />
            <span className="text-xs">Profesionales</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ZoneMap;
