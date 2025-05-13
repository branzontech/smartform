
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Phone, Video, VideoOff, Users, Monitor, FileText } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface VideoCallProps {
  sessionId: string;
  onEndCall: () => void;
}

const VideoCall: React.FC<VideoCallProps> = ({ sessionId, onEndCall }) => {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  
  // En una implementación real, esto sería obtenido de una API
  useEffect(() => {
    // Simulando la carga de los datos de la sesión
    setTimeout(() => {
      const mockSessionInfo = {
        id: sessionId,
        patientName: "María Rodríguez",
        doctorName: "Dr. Carlos Jiménez",
        specialty: "Cardiología",
        startTime: new Date().toISOString(),
      };
      setSessionInfo(mockSessionInfo);
      setIsConnecting(false);
      
      toast({
        title: "Conectado a la sesión",
        description: `Sesión con ${mockSessionInfo.doctorName} iniciada`,
      });
    }, 2000);
  }, [sessionId]);
  
  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    toast({
      description: isAudioEnabled ? "Micrófono desactivado" : "Micrófono activado",
    });
  };
  
  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    toast({
      description: isVideoEnabled ? "Cámara desactivada" : "Cámara activada",
    });
  };
  
  const toggleScreenSharing = () => {
    setIsScreenSharing(!isScreenSharing);
    toast({
      description: isScreenSharing ? "Compartir pantalla desactivado" : "Compartir pantalla activado",
    });
  };
  
  const handleEndCall = () => {
    toast({
      title: "Llamada finalizada",
      description: "La sesión de telemedicina ha terminado",
    });
    // Usamos la función de callback para manejar la navegación sin recargar la página
    onEndCall();
  };
  
  // En una implementación real, esto utilizaría WebRTC, socket.io u otra tecnología para videollamadas
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {isConnecting ? "Conectando..." : `Sesión con ${sessionInfo?.doctorName}`}
            <span className={cn(
              "inline-flex h-3 w-3 rounded-full",
              isConnecting ? "animate-pulse bg-amber-500" : "bg-green-500"
            )}></span>
          </CardTitle>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
            {isConnecting ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : !isVideoEnabled ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <VideoOff size={48} className="mb-2" />
                <p>Cámara desactivada</p>
              </div>
            ) : (
              // En una implementación real, aquí iría el video del doctor
              <div className="absolute inset-0 bg-gradient-to-br from-purple-700 to-purple-900 flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-purple-500 flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl font-bold">CJ</span>
                  </div>
                  <p className="font-medium">{sessionInfo?.doctorName}</p>
                </div>
              </div>
            )}
            
            {/* Video en miniatura (self-view) */}
            {!isConnecting && isVideoEnabled && (
              <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg border-2 border-white overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center mx-auto mb-1">
                      <span className="text-sm font-bold">MR</span>
                    </div>
                    <p className="text-xs font-medium">María Rodríguez</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-center gap-4 mt-4">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleAudio}
              className={!isAudioEnabled ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" : ""}
            >
              {isAudioEnabled ? <Mic /> : <MicOff />}
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={toggleVideo}
              className={!isVideoEnabled ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" : ""}
            >
              {isVideoEnabled ? <Video /> : <VideoOff />}
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={toggleScreenSharing}
              className={isScreenSharing ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" : ""}
            >
              <Monitor />
            </Button>
            
            <Button
              variant="destructive"
              size="icon"
              onClick={handleEndCall}
              className="bg-red-600 hover:bg-red-700"
            >
              <Phone className="rotate-[135deg]" />
            </Button>
          </div>
        </div>
        
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Información de la consulta</CardTitle>
            </CardHeader>
            <CardContent>
              {isConnecting ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Especialidad</p>
                    <p className="font-medium">{sessionInfo?.specialty}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Paciente</p>
                    <p className="font-medium">{sessionInfo?.patientName}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Médico</p>
                    <p className="font-medium">{sessionInfo?.doctorName}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Duración</p>
                    <p className="font-medium">
                      <span id="call-timer">00:00</span>
                    </p>
                  </div>
                  
                  <div className="pt-4">
                    <Button variant="outline" className="w-full mb-2">
                      <FileText className="mr-2" size={16} />
                      Notas de consulta
                    </Button>
                    
                    <Button variant="outline" className="w-full">
                      <Users className="mr-2" size={16} />
                      Invitar participantes
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
