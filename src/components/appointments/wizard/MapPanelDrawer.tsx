import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Users, Loader2, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { baseDatos } from "@/integrations/datos/cliente";
import { ExtendedPatient } from "../PatientPanel";
import { Zone, LatLng } from "@/types/zone-types";
import { DistanceCalculator } from "@/components/zones/DistanceCalculator";

interface MapPanelDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  patient: ExtendedPatient | null;
  apiKey: string;
}

export const MapPanelDrawer: React.FC<MapPanelDrawerProps> = ({
  isOpen,
  onClose,
  patient,
  apiKey,
}) => {
  const { isLoaded } = useGoogleMaps({ apiKey });
  const [zones, setZones] = useState<Zone[]>([]);

  // Fetch configured zones
  useEffect(() => {
    if (!isOpen) return;
    let vigente = true;
    const fetchZones = async () => {
      const { data, error } = await baseDatos.from("zones").select("*");
      if (!vigente) return;
      if (error) {
        console.error("Error fetching zones:", error);
        return;
      }
      if (data) {
        setZones(
          data.map((z) => ({
            ...z,
            polygon_coordinates: z.polygon_coordinates as unknown as LatLng[],
          }))
        );
      }
    };
    fetchZones();
    return () => {
      vigente = false;
    };
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
            className="fixed inset-0 z-[70] bg-card shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-card/95 backdrop-blur-xl shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Ubicación, Ruta y Tarifa</h3>
                  <p className="text-[10px] text-muted-foreground">
                    {patient ? `${patient.firstName} ${patient.lastName}` : "Calcula rutas y costos"}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex flex-1 min-h-0">
              {/* Context sidebar: patient + zones */}
              <div className="w-64 border-r border-border/30 flex flex-col shrink-0">
                <ScrollArea className="flex-1">
                  <div className="p-3 space-y-3">
                    {patient && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                          Paciente
                        </p>
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-xs font-medium">
                              {patient.firstName} {patient.lastName}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {patient.address || "Sin dirección registrada"}
                          </p>
                        </div>
                      </div>
                    )}

                    <Separator className="opacity-30" />

                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <MapPinned className="w-3 h-3 text-primary" />
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                          Zonas configuradas
                        </p>
                      </div>

                      {zones.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground italic">
                          No hay zonas configuradas todavía.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {zones.map((zone) => (
                            <div
                              key={zone.id}
                              className="p-2 rounded-lg border flex items-start gap-2"
                              style={{
                                backgroundColor: `${zone.color}10`,
                                borderColor: `${zone.color}40`,
                              }}
                            >
                              <div
                                className="w-2.5 h-2.5 rounded-full mt-0.5 shrink-0"
                                style={{ backgroundColor: zone.color }}
                              />
                              <div className="min-w-0">
                                <p className="text-[11px] font-medium leading-tight">
                                  {zone.name}
                                </p>
                                {zone.description && (
                                  <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-2">
                                    {zone.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                          <Badge variant="outline" className="text-[9px] mt-1">
                            {zones.length} {zones.length === 1 ? "zona" : "zonas"}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <Separator className="opacity-30" />

                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Usa el calculador a la derecha para marcar origen, destino y
                      paradas en el mapa. Las tarifas son editables y el costo se
                      recalcula automáticamente.
                    </p>
                  </div>
                </ScrollArea>
              </div>

              {/* Distance Calculator (full-featured) */}
              <div className="flex-1 min-w-0">
                {isLoaded ? (
                  <DistanceCalculator apiKey={apiKey} className="h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted/30">
                    <div className="text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Cargando mapa…</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MapPanelDrawer;
