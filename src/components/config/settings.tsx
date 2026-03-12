import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Palette, Bell, Save, User, Shield, Cog, HelpCircle, Trash2, SlidersHorizontal, ClipboardList, Building2, UserCog } from "lucide-react";
import { InstitutionHeaderConfig } from "@/components/config/InstitutionHeaderConfig";
import { supabase } from "@/integrations/supabase/client";
import { PatientFieldsConfig } from "@/components/config/PatientFieldsConfig";
import { AdmissionFieldsConfig } from "@/components/config/AdmissionFieldsConfig";
import { PatientHeaderConfig } from "@/components/config/PatientHeaderConfig";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useOnboarding } from "@/hooks/use-onboarding";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// No longer need form creation schema here - using FormCreator page


// Settings categories
const categories = [
  { id: "general", label: "General", icon: <Cog size={18} /> },
  { id: "header", label: "Encabezado", icon: <Building2 size={18} /> },
  { id: "patient-header", label: "Encabezado paciente", icon: <UserCog size={18} /> },
  { id: "forms", label: "Formularios", icon: <FileText size={18} /> },
  { id: "customization", label: "Personalización", icon: <SlidersHorizontal size={18} /> },
  { id: "appearance", label: "Apariencia", icon: <Palette size={18} /> },
  { id: "notifications", label: "Notificaciones", icon: <Bell size={18} /> },
  { id: "account", label: "Cuenta", icon: <User size={18} /> },
  { id: "advanced", label: "Avanzado", icon: <Shield size={18} /> },
];

export const SettingsPage = () => {
  const navigate = useNavigate();
  const { resetOnboarding } = useOnboarding();
  
  const [autoSave, setAutoSave] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [darkPrint, setDarkPrint] = useState(false);
  const [language, setLanguage] = useState("es");
  const [activeCategory, setActiveCategory] = useState("general");

  const handleSave = () => {
    toast.success("Configuración guardada con éxito");
  };

  const handleRestartGuide = () => {
    resetOnboarding();
    toast.success("Guía de usuario reiniciada. Se mostrará en un momento.");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-6 py-6 max-w-5xl">
        {/* Header compacto */}
        <div className="flex items-center gap-3 mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-lg"
            onClick={() => {
              if (activeCategory !== "general") {
                setActiveCategory("general");
              } else {
                navigate(-1);
              }
            }}
          >
            <ArrowLeft size={16} />
          </Button>
          <h1 className="text-lg font-semibold">Configuración</h1>
        </div>

        <div className="flex gap-6">
          {/* Sidebar minimalista */}
          <div className="w-56 shrink-0">
            <nav className="space-y-0.5 sticky top-24">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-all duration-150",
                    activeCategory === category.id
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  {category.icon}
                  <span>{category.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <ScrollArea className="h-[calc(100vh-10rem)]">
              <div className="pr-4 space-y-1">
            {/* General Settings */}
            {activeCategory === "general" && (
              <div className="space-y-1">
                <h2 className="text-base font-semibold mb-4">General</h2>
                <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm divide-y divide-border">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <Label htmlFor="auto-save" className="text-sm font-medium">Autoguardado</Label>
                      <p className="text-xs text-muted-foreground">Guardar automáticamente los cambios</p>
                    </div>
                    <Switch id="auto-save" checked={autoSave} onCheckedChange={setAutoSave} />
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <Label className="text-sm font-medium">Idioma</Label>
                      <p className="text-xs text-muted-foreground">Selecciona el idioma de la aplicación</p>
                    </div>
                    <select 
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm"
                    >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                      <option value="pt">Português</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <Label className="text-sm font-medium">Guía de usuario</Label>
                      <p className="text-xs text-muted-foreground">Volver a mostrar la guía de introducción</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleRestartGuide} className="gap-1.5 text-xs">
                      <HelpCircle size={14} />
                      Mostrar guía
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Header Settings */}
            {activeCategory === "header" && (
              <InstitutionHeaderConfig />
            )}

            {/* Appearance Settings */}
            {activeCategory === "appearance" && (
              <div>
                <h2 className="text-base font-semibold mb-4">Apariencia</h2>
                <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm divide-y divide-border">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <Label htmlFor="dark-print" className="text-sm font-medium">Impresión en modo oscuro</Label>
                      <p className="text-xs text-muted-foreground">Utilizar estilos oscuros al imprimir</p>
                    </div>
                    <Switch id="dark-print" checked={darkPrint} onCheckedChange={setDarkPrint} />
                  </div>
                  <div className="px-4 py-3">
                    <Label className="text-sm font-medium">Tema de colores</Label>
                    <p className="text-xs text-muted-foreground mb-3">Selecciona un tema para la aplicación</p>
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" size="sm" className="border-2 border-primary">
                        <div className="w-3 h-3 rounded-full bg-primary mr-1.5"></div>
                        Azul
                      </Button>
                      <Button variant="outline" size="sm">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 mr-1.5"></div>
                        Verde
                      </Button>
                      <Button variant="outline" size="sm">
                        <div className="w-3 h-3 rounded-full bg-violet-500 mr-1.5"></div>
                        Púrpura
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
              
            {/* Forms Settings */}
            {activeCategory === "forms" && (
              <div>
                <h2 className="text-base font-semibold mb-1">Formularios</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Gestiona los formularios clínicos del sistema.
                </p>
                <Button onClick={() => navigate("/app/home/formularios")} className="gap-1.5">
                  <FileText className="h-4 w-4" />
                  Ir a gestión de formularios
                </Button>
              </div>
            )}

            {/* Patient Header Banner Config */}
            {activeCategory === "patient-header" && (
              <div>
                <h2 className="text-base font-semibold mb-1">Encabezado de paciente</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Configure qué datos del paciente se muestran en el banner del formulario clínico.
                </p>
                <PatientHeaderConfig />
              </div>
            )}

            {/* Customization - Tabbed view */}
            {activeCategory === "customization" && (
              <div>
                <h2 className="text-base font-semibold mb-1">Personalización de Campos</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Campos personalizados almacenados como extensiones FHIR.
                </p>
                <Tabs defaultValue="patient" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4 h-9">
                    <TabsTrigger value="patient" className="gap-1.5 text-xs">
                      <User size={14} />
                      Pacientes
                    </TabsTrigger>
                    <TabsTrigger value="admission" className="gap-1.5 text-xs">
                      <ClipboardList size={14} />
                      Admisiones
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="patient">
                    <PatientFieldsConfig />
                  </TabsContent>
                  <TabsContent value="admission">
                    <AdmissionFieldsConfig />
                  </TabsContent>
                </Tabs>
              </div>
            )}
              
            {/* Notifications Settings */}
            {activeCategory === "notifications" && (
              <div>
                <h2 className="text-base font-semibold mb-4">Notificaciones</h2>
                <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm divide-y divide-border">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <Label htmlFor="notifications" className="text-sm font-medium">Notificaciones</Label>
                      <p className="text-xs text-muted-foreground">Recibir notificaciones de actividad</p>
                    </div>
                    <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <Label htmlFor="email-notifications" className="text-sm font-medium">Notificaciones por email</Label>
                      <p className="text-xs text-muted-foreground">Recibir notificaciones por email</p>
                    </div>
                    <Switch id="email-notifications" />
                  </div>
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Frecuencia de resumen</Label>
                        <p className="text-xs text-muted-foreground">¿Con qué frecuencia quieres recibir resúmenes?</p>
                      </div>
                      <select className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm">
                        <option value="daily">Diario</option>
                        <option value="weekly">Semanal</option>
                        <option value="monthly">Mensual</option>
                        <option value="never">Nunca</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
              
            {/* Account Settings */}
            {activeCategory === "account" && (
              <div>
                <h2 className="text-base font-semibold mb-4">Cuenta</h2>
                <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-4 space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="username" className="text-sm">Nombre de usuario</Label>
                    <Input id="username" placeholder="Tu nombre de usuario" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm">Email</Label>
                    <Input id="email" type="email" placeholder="tu@email.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bio" className="text-sm">Biografía</Label>
                    <Textarea id="bio" placeholder="Cuéntanos sobre ti..." />
                  </div>
                </div>
              </div>
            )}
              
            {/* Advanced Settings */}
            {activeCategory === "advanced" && (
              <div>
                <h2 className="text-base font-semibold mb-4">Avanzado</h2>
                <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm divide-y divide-border">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <Label className="text-sm font-medium">Modo desarrollador</Label>
                      <p className="text-xs text-muted-foreground">Activar funciones de desarrollo</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <Label className="text-sm font-medium">Registros detallados</Label>
                      <p className="text-xs text-muted-foreground">Activar logs de depuración</p>
                    </div>
                    <Switch />
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant="destructive" size="sm" className="w-full">
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Restablecer configuración
                  </Button>
                </div>
              </div>
            )}
          </div>
            </ScrollArea>
          </div>
        </div>

        {/* Save Button */}
        <div className="fixed bottom-6 right-6">
          <Button onClick={handleSave} size="sm" className="shadow-lg rounded-lg gap-1.5">
            <Save className="h-3.5 w-3.5" />
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
};