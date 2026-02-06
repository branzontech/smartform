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

const DEFAULT_CENTER = { lat: 4.7110, lng: -74.0721 }; // Bogotá, Colombia
const DEFAULT_ZOOM = 12;

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
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const polygonsRef = useRef<Map<string, google.maps.Polygon>>(new Map());
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;

    const map = new google.maps.Map(mapRef.current, {
      center: DEFAULT_CENTER,
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
    });

    googleMapRef.current = map;
    setIsMapLoaded(true);

    return () => {
      // Cleanup
      polygonsRef.current.forEach(p => p.setMap(null));
      markersRef.current.forEach(m => m.setMap(null));
    };
  }, [apiKey]);

  // Setup drawing manager
  useEffect(() => {
    if (!googleMapRef.current || !isMapLoaded) return;

    const drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
      polygonOptions: {
        fillColor: '#3B82F6',
        fillOpacity: 0.3,
        strokeColor: '#3B82F6',
        strokeWeight: 2,
        editable: true,
        draggable: true,
      },
    });

    drawingManager.setMap(googleMapRef.current);
    drawingManagerRef.current = drawingManager;

    // Listen for polygon complete
    google.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon: google.maps.Polygon) => {
      const path = polygon.getPath();
      const coordinates: LatLng[] = [];
      
      for (let i = 0; i < path.getLength(); i++) {
        const point = path.getAt(i);
        coordinates.push({ lat: point.lat(), lng: point.lng() });
      }
      
      // Remove the drawn polygon (we'll manage it ourselves)
      polygon.setMap(null);
      
      // Notify parent
      onZoneCreated(coordinates);
      
      // Reset drawing mode
      drawingManager.setDrawingMode(null);
    });

    return () => {
      drawingManager.setMap(null);
    };
  }, [isMapLoaded, onZoneCreated]);

  // Update drawing mode
  useEffect(() => {
    if (!drawingManagerRef.current) return;
    
    drawingManagerRef.current.setDrawingMode(
      drawingMode === 'polygon' ? google.maps.drawing.OverlayType.POLYGON : null
    );
  }, [drawingMode]);

  // Render zones as polygons
  useEffect(() => {
    if (!googleMapRef.current || !isMapLoaded) return;

    // Clear existing polygons
    polygonsRef.current.forEach(p => p.setMap(null));
    polygonsRef.current.clear();

    // Create new polygons
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

      // Add click listener
      polygon.addListener('click', () => {
        onZoneSelected(zone);
      });

      // Add label at center
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

    // Clear existing location markers (not labels)
    markersRef.current.forEach((marker, key) => {
      if (!key.startsWith('label-')) {
        marker.setMap(null);
        markersRef.current.delete(key);
      }
    });

    // Create location markers
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
