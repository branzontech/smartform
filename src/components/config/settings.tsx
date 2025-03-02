
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const SettingsDialog = () => {
  const [autoSave, setAutoSave] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [darkPrint, setDarkPrint] = useState(false);
  const [language, setLanguage] = useState("es");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="p-2 flex items-center gap-2" size="icon">
          <SettingsIcon size={18} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configuración</DialogTitle>
          <DialogDescription>
            Personaliza la aplicación según tus preferencias
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="appearance">Apariencia</TabsTrigger>
            <TabsTrigger value="advanced">Avanzado</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-save" className="font-medium">Autoguardado</Label>
                <p className="text-sm text-muted-foreground">Guardar automáticamente los cambios</p>
              </div>
              <Switch 
                id="auto-save" 
                checked={autoSave}
                onCheckedChange={setAutoSave}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications" className="font-medium">Notificaciones</Label>
                <p className="text-sm text-muted-foreground">Recibir notificaciones de actividad</p>
              </div>
              <Switch 
                id="notifications" 
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Idioma</Label>
                <p className="text-sm text-muted-foreground">Selecciona el idioma de la aplicación</p>
              </div>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-1"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dark-print" className="font-medium">Impresión en modo oscuro</Label>
                <p className="text-sm text-muted-foreground">Utilizar estilos oscuros al imprimir</p>
              </div>
              <Switch 
                id="dark-print" 
                checked={darkPrint}
                onCheckedChange={setDarkPrint}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Datos guardados</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Puedes eliminar todos los datos guardados localmente en este navegador.
              </p>
              <Button variant="destructive" size="sm">Eliminar datos</Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-4">
          <Button type="submit">Guardar cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
