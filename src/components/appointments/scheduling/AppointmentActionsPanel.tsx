import React, { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  X,
  RefreshCw,
  AlertTriangle,
  UserX,
  Video,
  MapPin,
  Clock,
  Calendar,
  FileText,
  Check,
  ArrowRight,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  AdvancedAppointment, 
  AppointmentStatus,
  AppointmentModality 
} from "@/types/appointment-types";

interface ActionOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  action: "cancel" | "reschedule" | "no_show" | "change_modality" | "emergency";
}

const actions: ActionOption[] = [
  {
    id: "cancel_patient",
    label: "Cancelar (Paciente)",
    description: "El paciente solicita cancelar la cita",
    icon: <X className="w-4 h-4" />,
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    action: "cancel"
  },
  {
    id: "reschedule",
    label: "Reprogramar",
    description: "Mover la cita a otra fecha/hora",
    icon: <RefreshCw className="w-4 h-4" />,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    action: "reschedule"
  },
  {
    id: "no_show",
    label: "No-Show (Inasistencia)",
    description: "Marcar como no asistió",
    icon: <UserX className="w-4 h-4" />,
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    action: "no_show"
  },
  {
    id: "change_modality",
    label: "Cambiar Modalidad",
    description: "Telemedicina ↔ Presencial",
    icon: <Video className="w-4 h-4" />,
    color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    action: "change_modality"
  },
  {
    id: "emergency",
    label: "Cita de Emergencia",
    description: "Insertar con prioridad alta",
    icon: <Zap className="w-4 h-4" />,
    color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    action: "emergency"
  }
];

// Mock offices for modality change
const mockOffices = [
  { id: "1", name: "Consultorio 101", floor: 1 },
  { id: "2", name: "Consultorio 202", floor: 2 },
  { id: "3", name: "Consultorio 305", floor: 3 },
];

interface AppointmentActionsPanelProps {
  appointment?: AdvancedAppointment | null;
  onAction?: (action: string, data: any) => void;
}

export const AppointmentActionsPanel: React.FC<AppointmentActionsPanelProps> = ({
  appointment,
  onAction
}) => {
  const [selectedAction, setSelectedAction] = useState<ActionOption | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [newModality, setNewModality] = useState<AppointmentModality>("presential");
  const [selectedOffice, setSelectedOffice] = useState("");
  const [arrivalInstructions, setArrivalInstructions] = useState("");

  const handleConfirmAction = () => {
    if (!selectedAction) return;

    switch (selectedAction.action) {
      case "cancel":
        toast.success("Cita cancelada", {
          description: "El espacio ha sido liberado y está disponible"
        });
        onAction?.("cancel", { reason: cancellationReason });
        break;
      
      case "no_show":
        toast.warning("Inasistencia registrada", {
          description: "El espacio está disponible inmediatamente"
        });
        onAction?.("no_show", {});
        break;
      
      case "change_modality":
        toast.success("Modalidad actualizada", {
          description: newModality === "presential" 
            ? "Se enviaron instrucciones de llegada"
            : "Se enviará enlace de videollamada"
        });
        onAction?.("change_modality", { 
          modality: newModality, 
          officeId: selectedOffice,
          instructions: arrivalInstructions 
        });
        break;
      
      case "reschedule":
        toast.info("Reprogramación iniciada", {
          description: "Seleccione la nueva fecha y hora"
        });
        onAction?.("reschedule", {});
        break;
      
      case "emergency":
        toast.success("Cita de emergencia creada", {
          description: "Se ha insertado con prioridad máxima"
        });
        onAction?.("emergency", {});
        break;
    }

    setSelectedAction(null);
    setCancellationReason("");
  };

  return (
    <div className="space-y-3">
      {/* Action Buttons Grid */}
      <div className="grid grid-cols-2 gap-2">
        {actions.slice(0, 4).map((action) => (
          <motion.button
            key={action.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedAction(action)}
            className={cn(
              "p-3 rounded-xl text-left transition-all border",
              action.color
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              {action.icon}
              <span className="text-xs font-medium">{action.label}</span>
            </div>
            <p className="text-[9px] opacity-70">{action.description}</p>
          </motion.button>
        ))}
      </div>

      {/* Emergency action - full width */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setSelectedAction(actions[4])}
        className={cn(
          "w-full p-3 rounded-xl text-left transition-all border",
          actions[4].color
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          {actions[4].icon}
          <span className="text-xs font-medium">{actions[4].label}</span>
          <Badge variant="outline" className="text-[9px] ml-auto">
            Prioridad Alta
          </Badge>
        </div>
        <p className="text-[9px] opacity-70">{actions[4].description}</p>
      </motion.button>

      {/* Action Dialog */}
      <Dialog open={!!selectedAction} onOpenChange={() => setSelectedAction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAction?.icon}
              {selectedAction?.label}
            </DialogTitle>
            <DialogDescription>
              {selectedAction?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Cancel Action */}
            {selectedAction?.action === "cancel" && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-2 text-red-600 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-medium">Acción irreversible</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Al cancelar, el espacio se liberará inmediatamente y los pacientes 
                    en lista de espera serán notificados automáticamente.
                  </p>
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Motivo de cancelación</Label>
                  <Textarea
                    placeholder="Ingrese el motivo..."
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="rounded-xl resize-none text-xs"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* No-Show Action */}
            {selectedAction?.action === "no_show" && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2 text-amber-600 mb-2">
                    <UserX className="w-4 h-4" />
                    <span className="text-xs font-medium">Registro de inasistencia</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    El paciente será notificado de su inasistencia. El espacio quedará 
                    disponible inmediatamente para pacientes presenciales o en espera.
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-muted/20 text-xs">
                  <p className="text-muted-foreground">
                    Esta acción se registrará en el historial del paciente y podrá 
                    afectar su política de agendamiento futuro.
                  </p>
                </div>
              </div>
            )}

            {/* Change Modality Action */}
            {selectedAction?.action === "change_modality" && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs mb-1.5 block">Nueva modalidad</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setNewModality("presential")}
                      className={cn(
                        "p-3 rounded-xl border transition-all text-left",
                        newModality === "presential"
                          ? "bg-primary/10 border-primary ring-2 ring-primary/20"
                          : "bg-muted/20 border-border/30"
                      )}
                    >
                      <MapPin className="w-4 h-4 mb-1" />
                      <span className="text-xs font-medium block">Presencial</span>
                      <span className="text-[9px] text-muted-foreground">
                        En consultorio
                      </span>
                    </button>
                    <button
                      onClick={() => setNewModality("telemedicine")}
                      className={cn(
                        "p-3 rounded-xl border transition-all text-left",
                        newModality === "telemedicine"
                          ? "bg-primary/10 border-primary ring-2 ring-primary/20"
                          : "bg-muted/20 border-border/30"
                      )}
                    >
                      <Video className="w-4 h-4 mb-1" />
                      <span className="text-xs font-medium block">Telemedicina</span>
                      <span className="text-[9px] text-muted-foreground">
                        Videollamada
                      </span>
                    </button>
                  </div>
                </div>

                {newModality === "presential" && (
                  <>
                    <div>
                      <Label className="text-xs mb-1.5 block">Consultorio asignado</Label>
                      <Select value={selectedOffice} onValueChange={setSelectedOffice}>
                        <SelectTrigger className="h-9 rounded-xl text-xs">
                          <SelectValue placeholder="Seleccionar consultorio" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockOffices.map((office) => (
                            <SelectItem key={office.id} value={office.id}>
                              {office.name} (Piso {office.floor})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">Instrucciones de llegada</Label>
                      <Textarea
                        placeholder="Ej: Presentarse 15 min antes, traer documento..."
                        value={arrivalInstructions}
                        onChange={(e) => setArrivalInstructions(e.target.value)}
                        className="rounded-xl resize-none text-xs"
                        rows={2}
                      />
                    </div>
                  </>
                )}

                {newModality === "telemedicine" && (
                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <div className="flex items-center gap-2 text-cyan-600 mb-1">
                      <Video className="w-4 h-4" />
                      <span className="text-xs font-medium">Enlace de videollamada</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Se generará un enlace único y se enviará al paciente 
                      automáticamente antes de la cita.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Reschedule Action */}
            {selectedAction?.action === "reschedule" && (
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-xs font-medium">Reprogramación atómica</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Al confirmar, se validará el nuevo espacio, se moverá el evento 
                  y se liberará el espacio anterior de forma atómica (todo o nada).
                </p>
              </div>
            )}

            {/* Emergency Action */}
            {selectedAction?.action === "emergency" && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <div className="flex items-center gap-2 text-orange-600 mb-2">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs font-medium">Inserción de emergencia</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    La cita se insertará con prioridad máxima. Si es necesario, 
                    se desplazarán citas no críticas o se utilizará sobrecupo técnico.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-muted/20">
                    <span className="text-muted-foreground">Citas desplazables:</span>
                    <span className="font-medium ml-1">3</span>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/20">
                    <span className="text-muted-foreground">Sobrecupo disponible:</span>
                    <span className="font-medium ml-1">2</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedAction(null)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAction}
              className={cn(
                "rounded-xl",
                selectedAction?.action === "cancel" && "bg-red-600 hover:bg-red-700",
                selectedAction?.action === "emergency" && "bg-orange-600 hover:bg-orange-700"
              )}
            >
              <Check className="w-4 h-4 mr-2" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
