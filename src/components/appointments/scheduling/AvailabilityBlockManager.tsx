import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar,
  Clock,
  AlertTriangle,
  Ban,
  Coffee,
  Briefcase,
  Plane,
  Heart,
  Wrench,
  GraduationCap,
  Plus,
  X,
  Users,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { DatePicker } from "@/components/ui/date-picker";
import { AvailabilityBlock, BlockType } from "@/types/appointment-types";

interface BlockTypeOption {
  type: BlockType;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  triggersReassignment: boolean;
}

const blockTypes: BlockTypeOption[] = [
  {
    type: "medical_leave",
    label: "Incapacidad",
    icon: <Heart className="w-4 h-4" />,
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    description: "Ausencia por enfermedad o accidente",
    triggersReassignment: true
  },
  {
    type: "vacation",
    label: "Vacaciones",
    icon: <Plane className="w-4 h-4" />,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    description: "Período de descanso programado",
    triggersReassignment: true
  },
  {
    type: "meeting",
    label: "Reunión",
    icon: <Briefcase className="w-4 h-4" />,
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    description: "Reunión administrativa o clínica",
    triggersReassignment: false
  },
  {
    type: "maintenance",
    label: "Mantenimiento",
    icon: <Wrench className="w-4 h-4" />,
    color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    description: "Mantenimiento de equipos o instalaciones",
    triggersReassignment: false
  },
  {
    type: "break",
    label: "Descanso",
    icon: <Coffee className="w-4 h-4" />,
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    description: "Pausa programada en la jornada",
    triggersReassignment: false
  },
  {
    type: "training",
    label: "Capacitación",
    icon: <GraduationCap className="w-4 h-4" />,
    color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    description: "Formación o actualización profesional",
    triggersReassignment: false
  },
  {
    type: "personal",
    label: "Personal",
    icon: <Calendar className="w-4 h-4" />,
    color: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    description: "Asunto personal",
    triggersReassignment: false
  },
  {
    type: "preventive",
    label: "Bloqueo Preventivo",
    icon: <Ban className="w-4 h-4" />,
    color: "bg-slate-500/10 text-slate-600 border-slate-500/20",
    description: "Reserva preventiva de espacio",
    triggersReassignment: false
  }
];

// Mock data for existing blocks
const mockBlocks: AvailabilityBlock[] = [
  {
    id: "1",
    doctorId: "1",
    doctorName: "Dr. Carlos Jiménez",
    type: "vacation",
    startDate: addDays(new Date(), 7),
    endDate: addDays(new Date(), 14),
    isFullDay: true,
    reason: "Vacaciones de verano",
    affectedAppointmentIds: ["apt1", "apt2", "apt3"],
    reassignmentTriggered: true,
    createdAt: new Date(),
    createdBy: "admin"
  },
  {
    id: "2",
    doctorId: "2",
    doctorName: "Dra. Laura Sánchez",
    type: "meeting",
    startDate: addDays(new Date(), 2),
    endDate: addDays(new Date(), 2),
    startTime: "14:00",
    endTime: "16:00",
    isFullDay: false,
    reason: "Junta médica mensual",
    affectedAppointmentIds: [],
    reassignmentTriggered: false,
    createdAt: new Date(),
    createdBy: "admin"
  }
];

interface AvailabilityBlockManagerProps {
  doctorId?: string;
  onBlockCreated?: (block: AvailabilityBlock) => void;
}

export const AvailabilityBlockManager: React.FC<AvailabilityBlockManagerProps> = ({
  doctorId,
  onBlockCreated
}) => {
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>(mockBlocks);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<BlockType | null>(null);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 1));
  const [isFullDay, setIsFullDay] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [reason, setReason] = useState("");

  const selectedTypeData = blockTypes.find(t => t.type === selectedType);

  const handleCreateBlock = () => {
    if (!selectedType) return;

    const newBlock: AvailabilityBlock = {
      id: Date.now().toString(),
      doctorId: doctorId || "1",
      doctorName: "Dr. Seleccionado",
      type: selectedType,
      startDate,
      endDate,
      startTime: isFullDay ? undefined : startTime,
      endTime: isFullDay ? undefined : endTime,
      isFullDay,
      reason,
      affectedAppointmentIds: [],
      reassignmentTriggered: selectedTypeData?.triggersReassignment || false,
      createdAt: new Date(),
      createdBy: "current_user"
    };

    setBlocks([...blocks, newBlock]);
    onBlockCreated?.(newBlock);
    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedType(null);
    setStartDate(new Date());
    setEndDate(addDays(new Date(), 1));
    setIsFullDay(true);
    setStartTime("09:00");
    setEndTime("17:00");
    setReason("");
  };

  const handleDeleteBlock = (blockId: string) => {
    setBlocks(blocks.filter(b => b.id !== blockId));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ban className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Bloqueos de Agenda</span>
        </div>
        <Button
          size="sm"
          onClick={() => setIsDialogOpen(true)}
          className="h-8 rounded-xl text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Nuevo Bloqueo
        </Button>
      </div>

      {/* Existing Blocks List */}
      <ScrollArea className="h-[200px]">
        <div className="space-y-2 pr-2">
          {blocks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No hay bloqueos configurados</p>
            </div>
          ) : (
            blocks.map((block) => {
              const typeData = blockTypes.find(t => t.type === block.type);
              return (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-3 rounded-xl border",
                    typeData?.color || "bg-muted/20"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      {typeData?.icon}
                      <div>
                        <p className="text-xs font-medium">{typeData?.label}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(block.startDate, "dd MMM", { locale: es })}
                          {!block.isFullDay && ` • ${block.startTime} - ${block.endTime}`}
                          {block.startDate.getTime() !== block.endDate.getTime() && 
                            ` → ${format(block.endDate, "dd MMM", { locale: es })}`}
                        </p>
                        {block.reason && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {block.reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {block.reassignmentTriggered && (
                        <Badge variant="outline" className="text-[9px] rounded-md">
                          <Users className="w-2.5 h-2.5 mr-1" />
                          {block.affectedAppointmentIds.length} citas
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-md"
                        onClick={() => handleDeleteBlock(block.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Create Block Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-primary" />
              Crear Bloqueo de Agenda
            </DialogTitle>
            <DialogDescription>
              Bloquea un período para impedir agendamiento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Block Type Selection */}
            <div>
              <Label className="text-xs mb-2 block">Tipo de Bloqueo</Label>
              <div className="grid grid-cols-4 gap-2">
                {blockTypes.map((type) => (
                  <button
                    key={type.type}
                    onClick={() => setSelectedType(type.type)}
                    className={cn(
                      "p-2 rounded-xl text-center transition-all border",
                      selectedType === type.type
                        ? "ring-2 ring-primary ring-offset-1 " + type.color
                        : "bg-muted/20 border-border/30 hover:bg-muted/40"
                    )}
                  >
                    <div className="flex justify-center mb-1">
                      {type.icon}
                    </div>
                    <span className="text-[9px] font-medium block">
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {selectedType && selectedTypeData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Info about selected type */}
                <div className={cn("p-3 rounded-xl", selectedTypeData.color)}>
                  <div className="flex items-center gap-2 mb-1">
                    {selectedTypeData.icon}
                    <span className="text-xs font-medium">{selectedTypeData.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {selectedTypeData.description}
                  </p>
                  {selectedTypeData.triggersReassignment && (
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-amber-600">
                      <AlertTriangle className="w-3 h-3" />
                      Disparará flujo de reasignación masiva
                    </div>
                  )}
                </div>

                {/* Date Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1.5 block">Fecha Inicio</Label>
                    <DatePicker
                      value={startDate}
                      onChange={(d) => d && setStartDate(d)}
                      className="h-9 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Fecha Fin</Label>
                    <DatePicker
                      value={endDate}
                      onChange={(d) => d && setEndDate(d)}
                      className="h-9 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Full Day Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
                  <div>
                    <p className="text-xs font-medium">Día Completo</p>
                    <p className="text-[10px] text-muted-foreground">
                      Bloquear todo el horario laboral
                    </p>
                  </div>
                  <Switch
                    checked={isFullDay}
                    onCheckedChange={setIsFullDay}
                  />
                </div>

                {/* Time Selection (if not full day) */}
                {!isFullDay && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs mb-1.5 block">Hora Inicio</Label>
                      <Select value={startTime} onValueChange={setStartTime}>
                        <SelectTrigger className="h-9 rounded-xl text-xs">
                          <Clock className="w-3 h-3 mr-2" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem key={i} value={`${i.toString().padStart(2, "0")}:00`}>
                              {`${i.toString().padStart(2, "0")}:00`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">Hora Fin</Label>
                      <Select value={endTime} onValueChange={setEndTime}>
                        <SelectTrigger className="h-9 rounded-xl text-xs">
                          <Clock className="w-3 h-3 mr-2" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem key={i} value={`${i.toString().padStart(2, "0")}:00`}>
                              {`${i.toString().padStart(2, "0")}:00`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Reason */}
                <div>
                  <Label className="text-xs mb-1.5 block">Motivo</Label>
                  <Textarea
                    placeholder="Describe el motivo del bloqueo..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="rounded-xl resize-none text-xs"
                    rows={2}
                  />
                </div>
              </motion.div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                resetForm();
              }}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateBlock}
              disabled={!selectedType}
              className="rounded-xl"
            >
              Crear Bloqueo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
