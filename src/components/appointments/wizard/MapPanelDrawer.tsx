import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Navigation, Route, Clock, DollarSign, Users, Stethoscope, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { supabase } from "@/integrations/supabase/client";
import { ExtendedPatient } from "../PatientPanel";
import { Zone, LatLng } from "@/types/zone-types";

interface MapPanelDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  patient: ExtendedPatient | null;
  apiKey: string;
}

interface RouteInfo {
  distance: string;
  duration: string;
  distanceValue: number;
  durationValue: number;
}

// Pricing configuration
const PRICING_CONFIG = {
  baseFare: 15000, // COP
  perKm: 2500, // COP per km
};

export const MapPanelDrawer: React.FC<MapPanelDrawerProps> = ({
  isOpen,
  onClose,
  patient,
  apiKey,
}) => {
  const { isLoaded, getDistance } = useGoogleMaps({ apiKey });
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [patientLocation, setPatientLocation] = useState<LatLng | null>(null);
  const [clinicLocation, setClinicLocation] = useState<LatLng>({ lat: 10.3997, lng: -75.5144 }); // Cartagena default
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [assignedZone, setAssignedZone] = useState<Zone | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

  const mapContainerRef = React.useRef<HTMLDivElement>(null);

  // Fetch zones
  useEffect(() => {
    const fetchZones = async () => {
      const { data } = await supabase.from("zones").select("*");
      if (data) {
        setZones(data.map(z => ({
          ...z,
          polygon_coordinates: z.polygon_coordinates as unknown as LatLng[]
        })));
      }
    };
    fetchZones();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isOpen || !isLoaded || !mapContainerRef.current || map) return;

    const mapInstance = new google.maps.Map(mapContainerRef.current, {
      center: clinicLocation,
      zoom: 13,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#255763" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
      ],
      disableDefaultUI: true,
      zoomControl: true,
    });

    const renderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#8B5CF6",
        strokeWeight: 4,
        strokeOpacity: 0.8,
      },
    });
    renderer.setMap(mapInstance);
    setDirectionsRenderer(renderer);

    // Draw zones
    zones.forEach((zone) => {
      if (zone.polygon_coordinates?.length > 0) {
        new google.maps.Polygon({
          paths: zone.polygon_coordinates,
          strokeColor: zone.color,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: zone.color,
          fillOpacity: 0.2,
          map: mapInstance,
        });
      }
    });

    // Add clinic marker
    new google.maps.Marker({
      position: clinicLocation,
      map: mapInstance,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#8B5CF6",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
      title: "Clínica",
    });

    setMap(mapInstance);
  }, [isOpen, isLoaded, zones, clinicLocation]);

  // Geocode patient address and calculate route
  const geocodeAndCalculate = useCallback(async () => {
    if (!patient?.address || !map || !directionsRenderer) return;

    setIsCalculating(true);

    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ address: `${patient.address}, Colombia` });

      if (result.results[0]) {
        const location = result.results[0].geometry.location;
        const patientLatLng = { lat: location.lat(), lng: location.lng() };
        setPatientLocation(patientLatLng);

        // Add patient marker
        new google.maps.Marker({
          position: patientLatLng,
          map: map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#10B981",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
          title: `${patient.firstName} ${patient.lastName}`,
        });

        // Calculate route
        const directionsService = new google.maps.DirectionsService();
        const routeResult = await directionsService.route({
          origin: patientLatLng,
          destination: clinicLocation,
          travelMode: google.maps.TravelMode.DRIVING,
        });

        directionsRenderer.setDirections(routeResult);

        const leg = routeResult.routes[0].legs[0];
        setRouteInfo({
          distance: leg.distance?.text || "",
          duration: leg.duration?.text || "",
          distanceValue: leg.distance?.value || 0,
          durationValue: leg.duration?.value || 0,
        });

        // Find assigned zone
        const foundZone = zones.find((zone) => {
          if (!zone.polygon_coordinates?.length) return false;
          const polygon = new google.maps.Polygon({ paths: zone.polygon_coordinates });
          return google.maps.geometry.poly.containsLocation(location, polygon);
        });
        setAssignedZone(foundZone || null);

        // Fit bounds
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(patientLatLng);
        bounds.extend(clinicLocation);
        map.fitBounds(bounds, 50);
      }
    } catch (error) {
      console.error("Error geocoding:", error);
    } finally {
      setIsCalculating(false);
    }
  }, [patient, map, directionsRenderer, zones, clinicLocation]);

  // Auto-calculate when patient changes
  useEffect(() => {
    if (isOpen && patient?.address && map && directionsRenderer) {
      geocodeAndCalculate();
    }
  }, [isOpen, patient, map, directionsRenderer]);

  // Calculate price
  const calculatePrice = (distanceMeters: number) => {
    const km = distanceMeters / 1000;
    return PRICING_CONFIG.baseFare + Math.ceil(km) * PRICING_CONFIG.perKm;
  };

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setMap(null);
      setRouteInfo(null);
      setPatientLocation(null);
      setAssignedZone(null);
      setDirectionsRenderer(null);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          {/* Panel */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[70] bg-card shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-card/95 backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Ubicación y Ruta</h3>
                  <p className="text-[10px] text-muted-foreground">
                    {patient ? `${patient.firstName} ${patient.lastName}` : "Sin paciente seleccionado"}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex h-[calc(100%-56px)]">
              {/* Sidebar */}
              <div className="w-72 border-r border-border/30 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1">
                  <div className="p-3 space-y-3">
                    {/* Patient Info */}
                    {patient && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                          Paciente
                        </p>
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-xs font-medium">{patient.firstName} {patient.lastName}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1 ml-5.5">
                            {patient.address || "Sin dirección registrada"}
                          </p>
                        </div>
                      </div>
                    )}

                    <Separator className="opacity-30" />

                    {/* Route Info */}
                    {isCalculating ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="ml-2 text-xs text-muted-foreground">Calculando ruta...</span>
                      </div>
                    ) : routeInfo ? (
                      <div className="space-y-2">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                          Información de Ruta
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2.5 rounded-xl bg-muted/50 border border-border/30">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Route className="w-3 h-3 text-primary" />
                              <span className="text-[9px] text-muted-foreground">Distancia</span>
                            </div>
                            <p className="text-sm font-bold">{routeInfo.distance}</p>
                          </div>

                          <div className="p-2.5 rounded-xl bg-muted/50 border border-border/30">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Clock className="w-3 h-3 text-amber-500" />
                              <span className="text-[9px] text-muted-foreground">Tiempo</span>
                            </div>
                            <p className="text-sm font-bold">{routeInfo.duration}</p>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                          <div className="flex items-center gap-1.5 mb-1">
                            <DollarSign className="w-3 h-3 text-primary" />
                            <span className="text-[9px] text-muted-foreground">Costo Estimado</span>
                          </div>
                          <p className="text-lg font-bold text-primary">
                            ${calculatePrice(routeInfo.distanceValue).toLocaleString("es-CO")} COP
                          </p>
                          <p className="text-[9px] text-muted-foreground mt-1">
                            Base: ${PRICING_CONFIG.baseFare.toLocaleString()} + ${PRICING_CONFIG.perKm.toLocaleString()}/km
                          </p>
                        </div>
                      </div>
                    ) : patient?.address ? (
                      <div className="text-center py-6">
                        <Button
                          size="sm"
                          onClick={geocodeAndCalculate}
                          className="rounded-xl"
                        >
                          <Navigation className="w-3.5 h-3.5 mr-1.5" />
                          Calcular Ruta
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">El paciente no tiene dirección registrada</p>
                      </div>
                    )}

                    <Separator className="opacity-30" />

                    {/* Zone Assignment */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        Zona Geográfica
                      </p>

                      {assignedZone ? (
                        <div
                          className="p-2.5 rounded-xl border"
                          style={{
                            backgroundColor: `${assignedZone.color}15`,
                            borderColor: `${assignedZone.color}40`,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: assignedZone.color }}
                            />
                            <span className="text-xs font-medium">{assignedZone.name}</span>
                          </div>
                          {assignedZone.description && (
                            <p className="text-[9px] text-muted-foreground mt-1 ml-5">
                              {assignedZone.description}
                            </p>
                          )}
                        </div>
                      ) : patientLocation ? (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                          <p className="text-xs text-amber-600">
                            El paciente no está dentro de ninguna zona configurada
                          </p>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-muted/50 border border-border/30">
                          <p className="text-xs text-muted-foreground">
                            Calcule la ruta para determinar la zona
                          </p>
                        </div>
                      )}

                      {/* Available zones list */}
                      <div className="space-y-1.5 mt-2">
                        <p className="text-[9px] text-muted-foreground">Zonas disponibles:</p>
                        <div className="flex flex-wrap gap-1">
                          {zones.map((zone) => (
                            <Badge
                              key={zone.id}
                              variant="outline"
                              className="text-[9px] px-1.5 py-0.5"
                              style={{
                                borderColor: zone.color,
                                color: zone.color,
                              }}
                            >
                              {zone.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>

              {/* Map */}
              <div className="flex-1 relative">
                {isLoaded ? (
                  <div ref={mapContainerRef} className="w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted/30">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}

                {/* Legend */}
                <div className="absolute bottom-4 left-4 p-2 rounded-xl bg-card/90 backdrop-blur-sm border border-border/30">
                  <div className="flex items-center gap-3 text-[9px]">
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      <span>Clínica</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>Paciente</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MapPanelDrawer;
