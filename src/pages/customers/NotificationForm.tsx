
import React, { useState } from "react";
import { Header } from "@/components/layout/header";
import { BackButton } from "@/App";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomerSelect } from "@/components/customers/CustomerSelect";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Image, Send, Info } from "lucide-react";
import { NotificationChannel, NotificationType } from "@/types/customer-types";

const NotificationForm = () => {
  const [isToAll, setIsToAll] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<NotificationType>("General");
  const [channel, setChannel] = useState<NotificationChannel>("Email");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [isSending, setIsSending] = useState(false);
  
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject || !message) {
      toast({
        title: "Error",
        description: "Por favor completa los campos obligatorios",
        variant: "destructive",
      });
      return;
    }
    
    if (!isToAll && !selectedCustomerId) {
      toast({
        title: "Error",
        description: "Por favor selecciona un cliente o marca la opción para enviar a todos",
        variant: "destructive",
      });
      return;
    }
    
    setIsSending(true);
    
    // Simular envío
    setTimeout(() => {
      setIsSending(false);
      toast({
        title: "Éxito",
        description: isToAll 
          ? "Notificación programada para todos los clientes" 
          : "Notificación programada para el cliente seleccionado",
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1 container mx-auto p-6">
        <BackButton />
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Nueva Notificación</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Envía mensajes personalizados a tus clientes
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Detalles de la Notificación</CardTitle>
                <CardDescription>
                  Define el contenido y programación de tu mensaje
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="recipients">Destinatarios</Label>
                      <div className="flex items-center space-x-2 mt-2">
                        <input
                          type="checkbox"
                          id="sendToAll"
                          checked={isToAll}
                          onChange={() => setIsToAll(!isToAll)}
                          className="h-4 w-4 rounded border-gray-300 text-primary"
                        />
                        <Label htmlFor="sendToAll" className="cursor-pointer">
                          Enviar a todos los clientes
                        </Label>
                      </div>
                      
                      {!isToAll && (
                        <div className="mt-3">
                          <CustomerSelect 
                            onSelect={(id) => setSelectedCustomerId(id)} 
                            selectedId={selectedCustomerId}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">Tipo de Notificación</Label>
                        <Select 
                          value={notificationType} 
                          onValueChange={(value) => setNotificationType(value as NotificationType)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="General">General</SelectItem>
                            <SelectItem value="Recordatorio">Recordatorio</SelectItem>
                            <SelectItem value="Felicitación">Felicitación</SelectItem>
                            <SelectItem value="Promoción">Promoción</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Canal de Envío</Label>
                        <RadioGroup 
                          value={channel} 
                          onValueChange={(value) => setChannel(value as NotificationChannel)}
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Email" id="email" />
                            <Label htmlFor="email">Email</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="WhatsApp" id="whatsapp" />
                            <Label htmlFor="whatsapp">WhatsApp</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Ambos" id="both" />
                            <Label htmlFor="both">Ambos</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="subject">Asunto</Label>
                      <Input
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Asunto de la notificación"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message">Mensaje</Label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Escribe tu mensaje aquí..."
                        rows={5}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="imageUrl">Imagen (opcional)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="imageUrl"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="URL de la imagen"
                        />
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="icon" type="button">
                              <Image size={16} />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-2">
                              <h4 className="font-medium">Seleccionar Imagen</h4>
                              <p className="text-sm text-muted-foreground">
                                Próximamente: selección de imágenes predefinidas.
                              </p>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Programación</Label>
                      <div className="flex items-center gap-2">
                        <DatePicker 
                          value={scheduledDate || new Date()} 
                          onChange={setScheduledDate} 
                          placeholder="Seleccionar fecha"
                        />
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="icon" type="button">
                              <Info size={16} />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-2">
                              <h4 className="font-medium">Envío programado</h4>
                              <p className="text-sm text-muted-foreground">
                                Si no seleccionas una fecha, la notificación se enviará inmediatamente.
                              </p>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isSending}>
                    {isSending ? "Enviando..." : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Enviar Notificación
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Vista Previa</CardTitle>
                <CardDescription>
                  Así se verá tu notificación
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-white dark:bg-gray-800 border rounded-lg p-4 shadow-sm">
                  {subject && <h3 className="font-medium mb-2">{subject}</h3>}
                  {message && <p className="text-sm mb-3 whitespace-pre-line">{message}</p>}
                  {imageUrl && (
                    <div className="mt-3 rounded-md overflow-hidden">
                      <img 
                        src={imageUrl} 
                        alt="Vista previa" 
                        className="w-full h-auto object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Imagen+no+disponible';
                        }}
                      />
                    </div>
                  )}
                  <div className="mt-4 text-xs text-gray-500 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {scheduledDate 
                      ? scheduledDate.toLocaleDateString('es-ES', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric' 
                        })
                      : "Envío inmediato"}
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Detalles del Envío</h4>
                  <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                    <li>
                      <span className="font-medium">Destinatarios:</span> {isToAll ? "Todos los clientes" : "Cliente individual"}
                    </li>
                    <li>
                      <span className="font-medium">Tipo:</span> {notificationType}
                    </li>
                    <li>
                      <span className="font-medium">Canal:</span> {channel}
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Consejos para Notificaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
                  <li>Personaliza el mensaje para aumentar la efectividad</li>
                  <li>Las imágenes aumentan el interés en promociones</li>
                  <li>Envía recordatorios 24-48h antes de citas</li>
                  <li>Usa felicitaciones para fidelizar clientes</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotificationForm;
