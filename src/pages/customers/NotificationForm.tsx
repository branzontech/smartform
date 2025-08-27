
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Image, Send, Info, Upload, Video, Mail, MessageCircle, Check, X, Clock } from "lucide-react";
import { NotificationChannel, NotificationType } from "@/types/customer-types";

interface SendLog {
  id: string;
  recipient: string;
  channel: NotificationChannel;
  status: 'success' | 'error' | 'pending';
  message: string;
  timestamp: Date;
}

const NotificationForm = () => {
  const [isToAll, setIsToAll] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<NotificationType>("General");
  const [channel, setChannel] = useState<NotificationChannel>("Email");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [isSending, setIsSending] = useState(false);
  const [sendLogs, setSendLogs] = useState<SendLog[]>([]);
  
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: "Tipo de archivo no válido. Solo se permiten imágenes (JPG, PNG, GIF) y videos (MP4, WEBM)",
          variant: "destructive",
        });
        return;
      }
      
      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "El archivo es demasiado grande. Máximo 10MB",
          variant: "destructive",
        });
        return;
      }
      
      setUploadedFile(file);
      setImageUrl(URL.createObjectURL(file));
    }
  };

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
    
    // Simular envío con logs
    const recipients = isToAll ? ["Todos los clientes"] : ["Cliente seleccionado"];
    const channels: NotificationChannel[] = channel === "Ambos" ? ["Email", "WhatsApp"] : [channel];
    
    const newLogs: SendLog[] = [];
    
    recipients.forEach(recipient => {
      channels.forEach(ch => {
        // Simular éxito o error aleatoriamente
        const isSuccess = Math.random() > 0.2; // 80% éxito
        
        newLogs.push({
          id: Math.random().toString(36).substr(2, 9),
          recipient,
          channel: ch,
          status: isSuccess ? 'success' : 'error',
          message: isSuccess 
            ? `Enviado exitosamente via ${ch}` 
            : `Error al enviar via ${ch}: Conexión fallida`,
          timestamp: new Date()
        });
      });
    });
    
    setTimeout(() => {
      setIsSending(false);
      setSendLogs(prev => [...newLogs, ...prev]);
      
      const successCount = newLogs.filter(log => log.status === 'success').length;
      const errorCount = newLogs.filter(log => log.status === 'error').length;
      
      toast({
        title: errorCount === 0 ? "Éxito" : "Parcialmente enviado",
        description: `${successCount} enviados exitosamente${errorCount > 0 ? `, ${errorCount} con errores` : ''}`,
        variant: errorCount === 0 ? "default" : "destructive",
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
                      <Label>Multimedia (opcional)</Label>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Input
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="URL de la imagen o video"
                          />
                          <Button 
                            variant="outline" 
                            size="icon" 
                            type="button"
                            onClick={() => document.getElementById('file-upload')?.click()}
                          >
                            <Upload size={16} />
                          </Button>
                        </div>
                        
                        <input
                          id="file-upload"
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        
                        {uploadedFile && (
                          <Alert>
                            <Upload className="h-4 w-4" />
                            <AlertDescription>
                              Archivo seleccionado: {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        <p className="text-xs text-muted-foreground">
                          Formatos soportados: JPG, PNG, GIF, MP4, WEBM (máximo 10MB)
                        </p>
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
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vista Previa</CardTitle>
                <CardDescription>
                  Previsualiza cómo se verá en diferentes canales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="email" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="email" className="flex items-center gap-2">
                      <Mail size={16} />
                      Email
                    </TabsTrigger>
                    <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                      <MessageCircle size={16} />
                      WhatsApp
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="email" className="mt-4">
                    <div className="bg-white dark:bg-gray-800 border rounded-lg p-4 shadow-sm">
                      <div className="border-b pb-3 mb-3">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>De: tu-clinica@example.com</span>
                          <span>{new Date().toLocaleDateString('es-ES')}</span>
                        </div>
                        {subject && <h3 className="font-medium mt-2 text-lg">{subject}</h3>}
                      </div>
                      {message && <p className="text-sm mb-3 whitespace-pre-line leading-relaxed">{message}</p>}
                      {imageUrl && (
                        <div className="mt-3 rounded-md overflow-hidden">
                          {uploadedFile?.type.startsWith('video/') ? (
                            <video controls className="w-full h-auto">
                              <source src={imageUrl} type={uploadedFile.type} />
                              Tu navegador no soporta video.
                            </video>
                          ) : (
                            <img 
                              src={imageUrl} 
                              alt="Vista previa" 
                              className="w-full h-auto object-cover max-h-60"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Imagen+no+disponible';
                              }}
                            />
                          )}
                        </div>
                      )}
                      <div className="mt-4 pt-3 border-t text-xs text-gray-400">
                        <p>Este es un correo automatizado. No responder.</p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="whatsapp" className="mt-4">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-medium">TC</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Tu Clínica</p>
                          <p className="text-xs text-gray-500">Hoy {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 ml-2">
                        {subject && <p className="font-medium text-sm mb-1">*{subject}*</p>}
                        {message && <p className="text-sm whitespace-pre-line">{message}</p>}
                        {imageUrl && (
                          <div className="mt-2 rounded-md overflow-hidden">
                            {uploadedFile?.type.startsWith('video/') ? (
                              <video controls className="w-full h-auto max-h-40">
                                <source src={imageUrl} type={uploadedFile.type} />
                              </video>
                            ) : (
                              <img 
                                src={imageUrl} 
                                alt="Vista previa" 
                                className="w-full h-auto object-cover max-h-40 rounded"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Imagen+no+disponible';
                                }}
                              />
                            )}
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {scheduledDate 
                            ? `Programado: ${scheduledDate.toLocaleDateString('es-ES')}` 
                            : "Envío inmediato"}
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
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

            {sendLogs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock size={16} />
                    Historial de Envíos
                  </CardTitle>
                  <CardDescription>
                    Registro de notificaciones enviadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {sendLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex-shrink-0 mt-0.5">
                          {log.status === 'success' && <Check size={16} className="text-green-500" />}
                          {log.status === 'error' && <X size={16} className="text-red-500" />}
                          {log.status === 'pending' && <Clock size={16} className="text-yellow-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{log.recipient}</span>
                            <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                              {log.channel}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{log.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {log.timestamp.toLocaleString('es-ES')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
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
