import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import {
  Clock,
  User,
  Phone,
  Mail,
  Bell,
  Check,
  X,
  Plus,
  Send,
  Calendar,
  AlertCircle,
  UserPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import { WaitingListEntry, AppointmentPriority } from "@/types/appointment-types";

// Mock waiting list data
const mockWaitingList: WaitingListEntry[] = [
  {
    id: "1",
    patientId: "p1",
    patientName: "María González",
    patientPhone: "555-123-4567",
    patientEmail: "maria@email.com",
    preferredDoctorId: "1",
    preferredDoctorName: "Dr. Carlos Jiménez",
    specialty: "Cardiología",
    appointmentType: "follow_up",
    preferredDays: [1, 3, 5],
    preferredTimeRange: { start: "09:00", end: "12:00" },
    dateRange: { start: new Date(), end: addDays(new Date(), 14) },
    priority: "high",
    status: "active",
    notificationsSent: [],
    createdAt: new Date()
  },
  {
    id: "2",
    patientId: "p2",
    patientName: "Pedro Martínez",
    patientPhone: "555-987-6543",
    specialty: "Pediatría",
    appointmentType: "first_time",
    preferredDays: [2, 4],
    preferredTimeRange: { start: "14:00", end: "17:00" },
    dateRange: { start: new Date(), end: addDays(new Date(), 7) },
    priority: "normal",
    status: "active",
    notificationsSent: [
      {
        id: "n1",
        sentAt: addDays(new Date(), -1),
        type: "sms",
        availableSlot: {
          date: addDays(new Date(), 2),
          time: "15:00",
          doctorName: "Dra. Laura Sánchez"
        },
        response: "no_response"
      }
    ],
    createdAt: addDays(new Date(), -3)
  },
  {
    id: "3",
    patientId: "p3",
    patientName: "Ana Rodríguez",
    patientPhone: "555-456-7890",
    patientEmail: "ana@email.com",
    specialty: "Dermatología",
    appointmentType: "control",
    preferredDays: [1, 2, 3, 4, 5],
    preferredTimeRange: { start: "08:00", end: "18:00" },
    dateRange: { start: new Date(), end: addDays(new Date(), 30) },
    priority: "low",
    notes: "Flexible con horarios",
    status: "contacted",
    notificationsSent: [],
    createdAt: addDays(new Date(), -5)
  }
];

const priorityColors: Record<AppointmentPriority, string> = {
  low: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  normal: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  high: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  urgent: "bg-red-500/10 text-red-600 border-red-500/20"
};

const dayLabels = ["D", "L", "M", "X", "J", "V", "S"];

interface WaitingListPanelProps {
  onSchedulePatient?: (entry: WaitingListEntry) => void;
}

export const WaitingListPanel: React.FC<WaitingListPanelProps> = ({
  onSchedulePatient
}) => {
  const [entries, setEntries] = useState<WaitingListEntry[]>(mockWaitingList);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<WaitingListEntry | null>(null);

  const handleSendNotification = (entry: WaitingListEntry) => {
    // Simulate sending notification
    toast.success("Notificación enviada", {
      description: `Se notificó a ${entry.patientName} sobre espacio disponible`
    });
    
    // Update entry status
    setEntries(entries.map(e => 
      e.id === entry.id 
        ? { ...e, status: "contacted" as const }
        : e
    ));
  };

  const handleScheduleFromWaitlist = (entry: WaitingListEntry) => {
    onSchedulePatient?.(entry);
    setEntries(entries.map(e => 
      e.id === entry.id 
        ? { ...e, status: "scheduled" as const }
        : e
    ));
    toast.success("Paciente agendado", {
      description: `${entry.patientName} ha sido movido de la lista de espera`
    });
  };

  const handleRemoveEntry = (entryId: string) => {
    setEntries(entries.filter(e => e.id !== entryId));
    toast.info("Paciente removido de la lista de espera");
  };

  const activeEntries = entries.filter(e => e.status === "active" || e.status === "contacted");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Lista de Espera</span>
          <Badge variant="secondary" className="text-[10px] rounded-full">
            {activeEntries.length}
          </Badge>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsAddDialogOpen(true)}
          className="h-8 rounded-xl text-xs"
        >
          <UserPlus className="w-3.5 h-3.5 mr-1" />
          Agregar
        </Button>
      </div>

      {/* List */}
      <ScrollArea className="h-[280px]">
        <div className="space-y-2 pr-2">
          {activeEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No hay pacientes en espera</p>
              <p className="text-[10px] mt-1">
                Los pacientes se agregarán automáticamente
              </p>
            </div>
          ) : (
            activeEntries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "p-3 rounded-xl border transition-all",
                  entry.status === "contacted" 
                    ? "bg-amber-500/5 border-amber-500/20"
                    : "bg-muted/10 border-border/20 hover:border-border/40"
                )}
              >
                {/* Patient Info */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">{entry.patientName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {entry.specialty}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn("text-[9px] rounded-md", priorityColors[entry.priority])}
                  >
                    {entry.priority === "high" ? "Alta" : 
                     entry.priority === "urgent" ? "Urgente" :
                     entry.priority === "normal" ? "Normal" : "Baja"}
                  </Badge>
                </div>

                {/* Contact Info */}
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-2">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {entry.patientPhone}
                  </span>
                  {entry.patientEmail && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {entry.patientEmail.split("@")[0]}...
                    </span>
                  )}
                </div>

                {/* Preferred Days */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-muted-foreground">Días:</span>
                  <div className="flex gap-0.5">
                    {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                      <span
                        key={day}
                        className={cn(
                          "w-4 h-4 rounded text-[8px] flex items-center justify-center",
                          entry.preferredDays.includes(day)
                            ? "bg-lime text-lime-foreground"
                            : "bg-muted/30 text-muted-foreground"
                        )}
                      >
                        {dayLabels[day]}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground ml-1">
                    {entry.preferredTimeRange.start}-{entry.preferredTimeRange.end}
                  </span>
                </div>

                {/* Notification Status */}
                {entry.notificationsSent.length > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-amber-600 mb-2">
                    <Bell className="w-3 h-3" />
                    <span>
                      {entry.notificationsSent.length} notificación(es) enviada(s)
                    </span>
                    {entry.notificationsSent[0].response === "no_response" && (
                      <span className="text-muted-foreground">• Sin respuesta</span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-1.5 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 rounded-lg text-[10px]"
                    onClick={() => handleSendNotification(entry)}
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Notificar
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 h-7 rounded-lg text-[10px]"
                    onClick={() => handleScheduleFromWaitlist(entry)}
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    Agendar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 rounded-lg p-0"
                    onClick={() => handleRemoveEntry(entry.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Auto-notification info */}
      {activeEntries.length > 0 && (
        <div className="p-2 rounded-xl bg-lime/10 border border-lime/20 flex items-center gap-2">
          <Bell className="w-4 h-4 text-lime-foreground" />
          <p className="text-[10px] text-muted-foreground">
            Los pacientes serán notificados automáticamente cuando se libere un espacio compatible
          </p>
        </div>
      )}
    </div>
  );
};
