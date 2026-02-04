import React from "react";
import { motion } from "framer-motion";
import {
  UserPlus,
  RefreshCw,
  Stethoscope,
  AlertTriangle,
  Video,
  Scissors,
  Users,
  Calendar,
  Clock,
  FileText,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppointmentType } from "@/types/appointment-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface AppointmentTypeOption {
  type: AppointmentType;
  label: string;
  description: string;
  icon: React.ReactNode;
  duration: number;
  color: string;
  features: string[];
}

const appointmentTypes: AppointmentTypeOption[] = [
  {
    type: "first_time",
    label: "Primera Vez",
    description: "Nuevo paciente con formulario de antecedentes",
    icon: <UserPlus className="w-5 h-5" />,
    duration: 45,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    features: ["Registro completo", "Formulario antecedentes", "Tiempo extendido"]
  },
  {
    type: "follow_up",
    label: "Seguimiento",
    description: "Vinculado al historial clínico existente",
    icon: <RefreshCw className="w-5 h-5" />,
    duration: 20,
    color: "bg-green-500/10 text-green-600 border-green-500/20",
    features: ["Historial previo", "Duración estándar", "Continuidad"]
  },
  {
    type: "control",
    label: "Control",
    description: "Revisión rutinaria programada",
    icon: <Stethoscope className="w-5 h-5" />,
    duration: 15,
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    features: ["Revisión rápida", "Métricas", "Ajustes"]
  },
  {
    type: "emergency",
    label: "Urgencia / Triaje",
    description: "Prioridad alta, puede desplazar otras citas",
    icon: <AlertTriangle className="w-5 h-5" />,
    duration: 30,
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    features: ["Prioridad máxima", "Inserción inmediata", "Sobrecupo"]
  },
  {
    type: "telemedicine",
    label: "Telemedicina",
    description: "Consulta virtual por videollamada",
    icon: <Video className="w-5 h-5" />,
    duration: 25,
    color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    features: ["Virtual", "Sin consultorio", "Flexible"]
  },
  {
    type: "procedure",
    label: "Procedimiento",
    description: "Requiere equipos o recursos especiales",
    icon: <Scissors className="w-5 h-5" />,
    duration: 60,
    color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    features: ["Recursos reservados", "Tiempo extendido", "Preparación"]
  },
  {
    type: "multispecialty",
    label: "Multiespecialidad",
    description: "Citas consecutivas con diferentes médicos",
    icon: <Users className="w-5 h-5" />,
    duration: 90,
    color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    features: ["Múltiples médicos", "Encadenamiento", "Traslados"]
  }
];

interface AppointmentTypeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedType?: AppointmentType;
  onSelect: (type: AppointmentType, duration: number) => void;
}

export const AppointmentTypeSelector: React.FC<AppointmentTypeSelectorProps> = ({
  open,
  onOpenChange,
  selectedType,
  onSelect
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Tipo de Cita
          </DialogTitle>
          <DialogDescription>
            Selecciona el tipo de cita para aplicar la configuración adecuada
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto py-4 pr-2">
          {appointmentTypes.map((apt, index) => (
            <motion.button
              key={apt.type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => {
                onSelect(apt.type, apt.duration);
                onOpenChange(false);
              }}
              className={cn(
                "p-4 rounded-2xl text-left transition-all border-2",
                "hover:shadow-lg hover:scale-[1.02]",
                selectedType === apt.type
                  ? "ring-2 ring-primary ring-offset-2 border-primary"
                  : "border-border/30 hover:border-border/50",
                apt.color
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  "bg-background/80"
                )}>
                  {apt.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-sm">{apt.label}</h3>
                    <Badge variant="secondary" className="text-[10px] rounded-md">
                      <Clock className="w-3 h-3 mr-1" />
                      {apt.duration}min
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {apt.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {apt.features.map((feature) => (
                      <span
                        key={feature}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-background/50 text-muted-foreground"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Compact inline selector
interface AppointmentTypeInlineProps {
  selectedType?: AppointmentType;
  onSelect: (type: AppointmentType, duration: number) => void;
}

export const AppointmentTypeInline: React.FC<AppointmentTypeInlineProps> = ({
  selectedType,
  onSelect
}) => {
  const selected = appointmentTypes.find(t => t.type === selectedType);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-1.5">
        {appointmentTypes.slice(0, 4).map((apt) => (
          <button
            key={apt.type}
            onClick={() => onSelect(apt.type, apt.duration)}
            className={cn(
              "p-2 rounded-xl text-center transition-all",
              selectedType === apt.type
                ? "bg-lime text-lime-foreground shadow-md"
                : "bg-muted/30 hover:bg-muted/50"
            )}
          >
            <div className="flex justify-center mb-1">
              {React.cloneElement(apt.icon as React.ReactElement, { 
                className: "w-4 h-4" 
              })}
            </div>
            <span className="text-[9px] font-medium block truncate">
              {apt.label}
            </span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {appointmentTypes.slice(4).map((apt) => (
          <button
            key={apt.type}
            onClick={() => onSelect(apt.type, apt.duration)}
            className={cn(
              "p-2 rounded-xl text-center transition-all",
              selectedType === apt.type
                ? "bg-lime text-lime-foreground shadow-md"
                : "bg-muted/30 hover:bg-muted/50"
            )}
          >
            <div className="flex justify-center mb-1">
              {React.cloneElement(apt.icon as React.ReactElement, { 
                className: "w-4 h-4" 
              })}
            </div>
            <span className="text-[9px] font-medium block truncate">
              {apt.label}
            </span>
          </button>
        ))}
      </div>
      
      {selected && (
        <div className={cn(
          "p-2 rounded-xl text-xs flex items-center gap-2",
          selected.color
        )}>
          {selected.icon}
          <div className="flex-1">
            <span className="font-medium">{selected.label}</span>
            <span className="text-muted-foreground ml-1">• {selected.duration}min</span>
          </div>
        </div>
      )}
    </div>
  );
};

export { appointmentTypes };
