
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  initGoogleApi,
  isUserSignedIn,
  signInWithGoogle,
  signOutFromGoogle
} from "@/utils/google-calendar";

export const GoogleCalendarIntegration = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Inicializar la API de Google
  useEffect(() => {
    const initialize = async () => {
      try {
        await initGoogleApi();
        const signedIn = isUserSignedIn();
        setIsConnected(signedIn);
        
        if (signedIn) {
          const user = window.gapi.auth2.getAuthInstance().currentUser.get();
          const profile = user.getBasicProfile();
          setUserEmail(profile.getEmail());
          
          // Verificar si la sincronización está habilitada (podría guardarse en localStorage)
          const storedSyncState = localStorage.getItem('googleCalendarSync');
          setSyncEnabled(storedSyncState === 'true');
        }
      } catch (error) {
        console.error("Error initializing Google API:", error);
        toast.error("No se pudo inicializar la API de Google");
      } finally {
        setIsInitializing(false);
      }
    };
    
    initialize();
  }, []);

  // Conectar con Google Calendar
  const handleConnect = async () => {
    try {
      const user = await signInWithGoogle();
      setIsConnected(true);
      
      const profile = user.getBasicProfile();
      setUserEmail(profile.getEmail());
      
      toast.success("Conectado a Google Calendar correctamente");
    } catch (error) {
      console.error("Error connecting to Google Calendar:", error);
      toast.error("Error al conectar con Google Calendar");
    }
  };

  // Desconectar de Google Calendar
  const handleDisconnect = async () => {
    try {
      await signOutFromGoogle();
      setIsConnected(false);
      setUserEmail(null);
      setSyncEnabled(false);
      localStorage.removeItem('googleCalendarSync');
      
      toast.success("Desconectado de Google Calendar");
    } catch (error) {
      console.error("Error disconnecting from Google Calendar:", error);
      toast.error("Error al desconectar de Google Calendar");
    }
  };

  // Cambiar estado de sincronización
  const handleSyncToggle = (checked: boolean) => {
    setSyncEnabled(checked);
    localStorage.setItem('googleCalendarSync', checked.toString());
    
    if (checked) {
      toast.success("Sincronización con Google Calendar activada");
    } else {
      toast.info("Sincronización con Google Calendar desactivada");
    }
  };

  if (isInitializing) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-purple-500" />
            Google Calendar
          </CardTitle>
          <CardDescription>Cargando configuración...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-purple-500"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="mr-2 h-5 w-5 text-purple-500" />
          Google Calendar
        </CardTitle>
        <CardDescription>
          Sincroniza tus citas con Google Calendar para acceder a tu agenda desde cualquier dispositivo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Estado:</span>
              {isConnected ? (
                <Badge className="bg-green-500">
                  <CheckCircle className="mr-1 h-3 w-3" /> Conectado
                </Badge>
              ) : (
                <Badge variant="outline" className="text-red-500 border-red-300">
                  <XCircle className="mr-1 h-3 w-3" /> Desconectado
                </Badge>
              )}
            </div>
          </div>

          {isConnected && (
            <>
              <div className="text-sm text-gray-500">
                Conectado como: <span className="font-medium">{userEmail}</span>
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="sync-toggle"
                  checked={syncEnabled}
                  onCheckedChange={handleSyncToggle}
                />
                <Label htmlFor="sync-toggle">
                  Sincronizar automáticamente las citas con Google Calendar
                </Label>
              </div>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        {isConnected ? (
          <Button variant="outline" onClick={handleDisconnect}>
            Desconectar
          </Button>
        ) : (
          <Button onClick={handleConnect}>
            Conectar con Google Calendar
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default GoogleCalendarIntegration;
