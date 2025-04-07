
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  CalendarClock, 
  Clock, 
  Bell, 
  Edit,
  Trash2,
  CheckCircle, 
  XCircle,
  Plus,
  RotateCcw,
  MessageSquare,
  Calendar,
  Tag,
  AlarmClock,
  Mail
} from "lucide-react";
import { format } from "date-fns";
import { CustomerReminder, NotificationChannel, ReminderFrequency, ReminderStatus } from "@/types/customer-types";

interface CustomerRemindersProps {
  customerId: string;
  customerName: string;
}

// Mock data for reminders
const mockReminders: CustomerReminder[] = [
  {
    id: "1",
    customerId: "1",
    customerName: "Ana García Martínez",
    title: "Seguimiento de tratamiento",
    message: "Contactar a Ana para verificar cómo va su tratamiento y si tiene alguna reacción adversa",
    reminderDate: new Date(2023, 6, 15, 10, 0),
    status: "Pendiente",
    frequency: "Una vez",
    channel: "WhatsApp",
    createdAt: new Date(2023, 6, 10),
    tags: ["Seguimiento", "Tratamiento"],
  },
  {
    id: "2",
    customerId: "1",
    customerName: "Ana García Martínez",
    title: "Recordatorio de cita mensual",
    message: "Recordar a Ana su cita mensual de revisión",
    reminderDate: new Date(2023, 7, 1, 9, 0),
    status: "Recurrente",
    frequency: "Mensual",
    channel: "Email",
    createdAt: new Date(2023, 5, 15),
    tags: ["Cita", "Revisión"],
  },
  {
    id: "3",
    customerId: "1",
    customerName: "Ana García Martínez",
    title: "Felicitación de cumpleaños",
    message: "Feliz cumpleaños Ana! Te obsequiamos un 15% de descuento en tu próximo servicio.",
    reminderDate: new Date(2023, 8, 15, 9, 0),
    status: "Recurrente",
    frequency: "Anual",
    channel: "Ambos",
    createdAt: new Date(2023, 5, 20),
    tags: ["Cumpleaños", "Descuento"],
  },
];

export const CustomerReminders = ({ customerId, customerName }: CustomerRemindersProps) => {
  const [reminders, setReminders] = useState<CustomerReminder[]>(mockReminders);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "recurring">("all");
  const [isAddReminderOpen, setIsAddReminderOpen] = useState(false);
  const [newReminder, setNewReminder] = useState<Partial<CustomerReminder>>({
    customerId,
    customerName,
    title: "",
    message: "",
    reminderDate: new Date(),
    status: "Pendiente",
    frequency: "Una vez",
    channel: "WhatsApp",
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");
  
  const { toast } = useToast();
  
  const filteredReminders = reminders.filter(reminder => {
    if (activeTab === "pending") return reminder.status === "Pendiente";
    if (activeTab === "recurring") return reminder.status === "Recurrente";
    return true;
  });
  
  const handleAddReminder = () => {
    if (!newReminder.title || !newReminder.message || !newReminder.reminderDate) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }
    
    const reminder: CustomerReminder = {
      id: `reminder-${Date.now()}`,
      customerId,
      customerName,
      title: newReminder.title || "",
      message: newReminder.message || "",
      reminderDate: newReminder.reminderDate || new Date(),
      status: newReminder.status as ReminderStatus || "Pendiente",
      frequency: newReminder.frequency as ReminderFrequency || "Una vez",
      channel: newReminder.channel as NotificationChannel || "WhatsApp",
      createdAt: new Date(),
      tags: newReminder.tags || [],
    };
    
    if (reminder.frequency !== "Una vez") {
      reminder.status = "Recurrente";
    }
    
    setReminders([reminder, ...reminders]);
    setIsAddReminderOpen(false);
    setNewReminder({
      customerId,
      customerName,
      title: "",
      message: "",
      reminderDate: new Date(),
      status: "Pendiente",
      frequency: "Una vez",
      channel: "WhatsApp",
      tags: [],
    });
    
    toast({
      title: "Recordatorio creado",
      description: `El recordatorio "${reminder.title}" ha sido programado exitosamente`,
    });
  };
  
  const handleDeleteReminder = (id: string) => {
    setReminders(reminders.filter(reminder => reminder.id !== id));
    toast({
      title: "Recordatorio eliminado",
      description: "El recordatorio ha sido eliminado exitosamente",
    });
  };
  
  const handleCompleteReminder = (id: string) => {
    setReminders(reminders.map(reminder => 
      reminder.id === id 
        ? { ...reminder, status: "Enviado", completedAt: new Date() } 
        : reminder
    ));
    toast({
      title: "Recordatorio completado",
      description: "El recordatorio ha sido marcado como completado",
    });
  };
  
  const addTag = () => {
    if (!tagInput.trim()) return;
    
    setNewReminder({
      ...newReminder,
      tags: [...(newReminder.tags || []), tagInput.trim()]
    });
    setTagInput("");
  };
  
  const removeTag = (tagToRemove: string) => {
    setNewReminder({
      ...newReminder,
      tags: newReminder.tags?.filter(tag => tag !== tagToRemove)
    });
  };
  
  const getStatusIcon = (status: ReminderStatus) => {
    switch (status) {
      case "Pendiente":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "Enviado":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Cancelado":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "Recurrente":
        return <RotateCcw className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };
  
  const getChannelIcon = (channel: NotificationChannel) => {
    switch (channel) {
      case "WhatsApp":
        return <MessageSquare className="h-4 w-4 text-emerald-500" />;
      case "Email":
        return <Mail className="h-4 w-4 text-blue-500" />;
      case "Ambos":
        return (
          <div className="flex -space-x-1">
            <MessageSquare className="h-4 w-4 text-emerald-500" />
            <Mail className="h-4 w-4 text-blue-500" />
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Recordatorios</CardTitle>
            <CardDescription>Gestiona recordatorios personalizados para este cliente</CardDescription>
          </div>
          <Dialog open={isAddReminderOpen} onOpenChange={setIsAddReminderOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nuevo recordatorio</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Crear recordatorio personalizado</DialogTitle>
                <DialogDescription>
                  Configura un recordatorio para {customerName}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Título del recordatorio</Label>
                  <Input
                    id="title"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder({...newReminder, title: e.target.value})}
                    placeholder="Ej: Seguimiento de tratamiento"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="message">Mensaje</Label>
                  <Textarea
                    id="message"
                    value={newReminder.message}
                    onChange={(e) => setNewReminder({...newReminder, message: e.target.value})}
                    placeholder="Escribe un mensaje personalizado para el cliente"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Fecha y hora</Label>
                    <DatePicker
                      value={newReminder.reminderDate || new Date()}
                      onChange={(date) => setNewReminder({...newReminder, reminderDate: date})}
                      placeholder="Seleccionar fecha"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="frequency">Frecuencia</Label>
                    <Select 
                      value={newReminder.frequency} 
                      onValueChange={(value) => setNewReminder({
                        ...newReminder, 
                        frequency: value as ReminderFrequency
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona la frecuencia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Una vez">Una vez</SelectItem>
                        <SelectItem value="Diario">Diario</SelectItem>
                        <SelectItem value="Semanal">Semanal</SelectItem>
                        <SelectItem value="Mensual">Mensual</SelectItem>
                        <SelectItem value="Anual">Anual</SelectItem>
                        <SelectItem value="Personalizado">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {newReminder.frequency === "Personalizado" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="days">Frecuencia en días</Label>
                      <Input
                        id="days"
                        type="number"
                        min="0"
                        value={newReminder.customFrequencyDays || ""}
                        onChange={(e) => setNewReminder({
                          ...newReminder, 
                          customFrequencyDays: parseInt(e.target.value) || 0
                        })}
                        placeholder="0"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="months">Frecuencia en meses</Label>
                      <Input
                        id="months"
                        type="number"
                        min="0"
                        value={newReminder.customFrequencyMonths || ""}
                        onChange={(e) => setNewReminder({
                          ...newReminder, 
                          customFrequencyMonths: parseInt(e.target.value) || 0
                        })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}
                
                <div className="grid gap-2">
                  <Label htmlFor="channel">Canal de envío</Label>
                  <Select 
                    value={newReminder.channel} 
                    onValueChange={(value) => setNewReminder({
                      ...newReminder, 
                      channel: value as NotificationChannel
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el canal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Ambos">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="tags">Etiquetas</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Añadir etiqueta"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={addTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {newReminder.tags && newReminder.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {newReminder.tags.map(tag => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="flex items-center gap-1 cursor-pointer"
                          onClick={() => removeTag(tag)}
                        >
                          {tag}
                          <XCircle className="h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="customMessage"
                    checked={newReminder.customMessage || false}
                    onChange={(e) => setNewReminder({
                      ...newReminder, 
                      customMessage: e.target.checked
                    })}
                    className="h-4 w-4 rounded border-gray-300 text-primary"
                  />
                  <Label htmlFor="customMessage" className="cursor-pointer text-sm">
                    Personalizar mensaje en cada envío
                  </Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddReminderOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddReminder}>
                  Guardar recordatorio
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="mb-4" onValueChange={(value) => setActiveTab(value as "all" | "pending" | "recurring")}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="pending">Pendientes</TabsTrigger>
            <TabsTrigger value="recurring">Recurrentes</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="space-y-4">
          {filteredReminders.length > 0 ? (
            filteredReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="p-4 border border-border rounded-lg hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlarmClock className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">{reminder.title}</h3>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleCompleteReminder(reminder.id)}
                    >
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleDeleteReminder(reminder.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                
                <p className="mt-1 text-sm whitespace-pre-line line-clamp-2">{reminder.message}</p>
                
                <div className="mt-3 flex flex-wrap gap-1">
                  {reminder.tags?.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(reminder.reminderDate, "dd/MM/yyyy HH:mm")}
                    </span>
                    
                    <span className="flex items-center gap-1">
                      {getChannelIcon(reminder.channel)}
                      {reminder.channel}
                    </span>
                    
                    {reminder.frequency !== "Una vez" && (
                      <span className="flex items-center gap-1">
                        <RotateCcw className="h-3 w-3" />
                        {reminder.frequency}
                      </span>
                    )}
                  </div>
                  
                  <span className="flex items-center gap-1">
                    {getStatusIcon(reminder.status)}
                    {reminder.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <h3 className="font-medium text-lg">No hay recordatorios</h3>
              <p className="text-muted-foreground">No se han configurado recordatorios para este cliente</p>
              <Button 
                className="mt-4" 
                onClick={() => setIsAddReminderOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear recordatorio
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
