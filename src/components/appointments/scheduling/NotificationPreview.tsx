import React from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Bell,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Video,
  MapPin,
  FileText,
  Check,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { 
  AppointmentNotification, 
  NotificationType,
  AdvancedAppointment 
} from "@/types/appointment-types";

// Mock notifications
const mockNotifications: AppointmentNotification[] = [
  {
    id: "1",
    type: "appointment_reminder",
    recipientId: "p1",
    recipientType: "patient",
    channel: "email",
    title: "Recordatorio de cita",
    message: "Tu cita con Dr. Carlos Jiménez es mañana a las 10:00",
    appointmentId: "apt1",
    status: "sent",
    sentAt: new Date()
  },
  {
    id: "2",
    type: "waiting_list_slot",
    recipientId: "p2",
    recipientType: "patient",
    channel: "sms",
    title: "Espacio disponible",
    message: "Se ha liberado un espacio para Cardiología",
    status: "delivered"
  },
  {
    id: "3",
    type: "appointment_cancelled",
    recipientId: "p3",
    recipientType: "patient",
    channel: "whatsapp",
    title: "Cita cancelada",
    message: "Tu cita del 15 de enero ha sido cancelada",
    appointmentId: "apt3",
    status: "read"
  }
];

const notificationTypeConfig: Record<NotificationType, { icon: React.ReactNode; color: string; label: string }> = {
  appointment_reminder: {
    icon: <Bell className="w-4 h-4" />,
    color: "bg-blue-500/10 text-blue-600",
    label: "Recordatorio"
  },
  appointment_confirmation: {
    icon: <Check className="w-4 h-4" />,
    color: "bg-green-500/10 text-green-600",
    label: "Confirmación"
  },
  appointment_cancelled: {
    icon: <AlertCircle className="w-4 h-4" />,
    color: "bg-red-500/10 text-red-600",
    label: "Cancelación"
  },
  appointment_rescheduled: {
    icon: <Calendar className="w-4 h-4" />,
    color: "bg-orange-500/10 text-orange-600",
    label: "Reprogramación"
  },
  waiting_list_slot: {
    icon: <Clock className="w-4 h-4" />,
    color: "bg-purple-500/10 text-purple-600",
    label: "Lista de espera"
  },
  no_show_warning: {
    icon: <AlertCircle className="w-4 h-4" />,
    color: "bg-amber-500/10 text-amber-600",
    label: "Inasistencia"
  },
  modality_change: {
    icon: <Video className="w-4 h-4" />,
    color: "bg-cyan-500/10 text-cyan-600",
    label: "Cambio modalidad"
  },
  doctor_unavailable: {
    icon: <Stethoscope className="w-4 h-4" />,
    color: "bg-gray-500/10 text-gray-600",
    label: "Médico no disponible"
  }
};

const channelIcons: Record<string, string> = {
  email: "📧",
  sms: "💬",
  push: "🔔",
  whatsapp: "📱",
  in_app: "📲"
};

interface NotificationPreviewProps {
  notifications?: AppointmentNotification[];
  showRecent?: boolean;
}

export const NotificationPreview: React.FC<NotificationPreviewProps> = ({
  notifications = mockNotifications,
  showRecent = true
}) => {
  const recentNotifications = showRecent 
    ? notifications.slice(0, 5) 
    : notifications;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Notificaciones</span>
        </div>
        <Badge variant="secondary" className="text-[10px] rounded-full">
          {recentNotifications.length}
        </Badge>
      </div>

      <div className="space-y-2">
        {recentNotifications.map((notification, index) => {
          const config = notificationTypeConfig[notification.type];
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "p-3 rounded-xl border border-border/20",
                config.color
              )}
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5">{config.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{notification.title}</span>
                    <span className="text-lg">{channelIcons[notification.channel]}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[9px] rounded-md",
                        notification.status === "sent" && "border-blue-500/30 text-blue-600",
                        notification.status === "delivered" && "border-green-500/30 text-green-600",
                        notification.status === "read" && "border-gray-500/30 text-gray-600",
                        notification.status === "pending" && "border-amber-500/30 text-amber-600",
                        notification.status === "failed" && "border-red-500/30 text-red-600"
                      )}
                    >
                      {notification.status === "sent" && "Enviado"}
                      {notification.status === "delivered" && "Entregado"}
                      {notification.status === "read" && "Leído"}
                      {notification.status === "pending" && "Pendiente"}
                      {notification.status === "failed" && "Fallido"}
                    </Badge>
                    {notification.sentAt && (
                      <span className="text-[9px] text-muted-foreground">
                        {format(notification.sentAt, "dd MMM HH:mm", { locale: es })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// Compact appointment summary card
interface AppointmentSummaryCardProps {
  appointment: Partial<AdvancedAppointment>;
  showNotificationPreview?: boolean;
}

export const AppointmentSummaryCard: React.FC<AppointmentSummaryCardProps> = ({
  appointment,
  showNotificationPreview = false
}) => {
  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-lime/20 to-lime/5 border border-lime/30">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-lime flex items-center justify-center">
            <Calendar className="w-5 h-5 text-lime-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">Resumen de Cita</p>
            <p className="text-xs text-muted-foreground">
              {appointment.type === "first_time" ? "Primera vez" :
               appointment.type === "follow_up" ? "Seguimiento" :
               appointment.type === "control" ? "Control" :
               appointment.type === "emergency" ? "Urgencia" :
               appointment.type === "telemedicine" ? "Telemedicina" :
               appointment.type === "procedure" ? "Procedimiento" :
               "Multiespecialidad"}
            </p>
          </div>
        </div>
        <Badge className="bg-lime text-lime-foreground">
          {appointment.priority === "urgent" ? "Urgente" :
           appointment.priority === "high" ? "Alta" :
           appointment.priority === "normal" ? "Normal" : "Baja"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <span>{appointment.patientName || "Paciente"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-muted-foreground" />
          <span>{appointment.doctorName || "Médico"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span>
            {appointment.date 
              ? format(appointment.date, "dd MMM yyyy", { locale: es })
              : "Fecha"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>
            {appointment.startTime || "Hora"} 
            {appointment.duration && ` (${appointment.duration}min)`}
          </span>
        </div>
        {appointment.modality && (
          <div className="flex items-center gap-2 col-span-2">
            {appointment.modality === "telemedicine" ? (
              <>
                <Video className="w-4 h-4 text-muted-foreground" />
                <span>Telemedicina</span>
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{appointment.officeName || "Consultorio"}</span>
              </>
            )}
          </div>
        )}
        {appointment.reason && (
          <div className="flex items-center gap-2 col-span-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="truncate">{appointment.reason}</span>
          </div>
        )}
      </div>

      {showNotificationPreview && (
        <div className="mt-3 pt-3 border-t border-lime/20">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
            <Bell className="w-3 h-3" />
            <span>Se enviarán las siguientes notificaciones:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-background/50">
              📧 Confirmación
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-background/50">
              💬 Recordatorio 24h
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-background/50">
              📱 Recordatorio 1h
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
