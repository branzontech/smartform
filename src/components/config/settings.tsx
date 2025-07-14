import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, PlusSquare, Palette, Bell, Database, Save, User, UserCog, Shield, Plus, Cog, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useOnboarding } from "@/hooks/use-onboarding";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Schema for the form creation
const formCreationSchema = z.object({
  title: z.string().min(3, {
    message: "El título debe tener al menos 3 caracteres.",
  }),
  description: z.string().optional(),
});

// Settings categories
const categories = [
  { id: "general", label: "General", icon: <Cog size={18} /> },
  { id: "appearance", label: "Apariencia", icon: <Palette size={18} /> },
  { id: "forms", label: "Formularios", icon: <FileText size={18} /> },
  { id: "notifications", label: "Notificaciones", icon: <Bell size={18} /> },
  { id: "account", label: "Cuenta", icon: <User size={18} /> },
  { id: "advanced", label: "Avanzado", icon: <Shield size={18} /> },
];

export const SettingsPage = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { resetOnboarding } = useOnboarding();
  
  const [autoSave, setAutoSave] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [darkPrint, setDarkPrint] = useState(false);
  const [language, setLanguage] = useState("es");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeCategory, setActiveCategory] = useState("general");

  // Form creation
  const form = useForm<z.infer<typeof formCreationSchema>>({
    resolver: zodResolver(formCreationSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const onSubmitForm = (values: z.infer<typeof formCreationSchema>) => {
    console.log(values);
    toast.success("Formulario creado con éxito");
    navigate("/crear");
  };

  const handleSave = () => {
    toast.success("Configuración guardada con éxito");
  };

  const handleRestartGuide = () => {
    resetOnboarding();
    toast.success("Guía de usuario reiniciada. Se mostrará en un momento.");
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Header />
      
      {/* Floating Settings Sidebar */}
      <div className={cn(
        "fixed left-0 top-16 bottom-0 z-40 transition-all duration-300 ease-in-out",
        "bg-card border-r shadow-lg",
        sidebarCollapsed ? "w-16" : "w-80"
      )}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {!sidebarCollapsed && (
            <h2 className="text-lg font-semibold">Configuración</h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="ml-auto"
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>

        {/* Sidebar Navigation */}
        <ScrollArea className="flex-1 h-[calc(100vh-8rem)]">
          <div className="p-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start mb-1 transition-all duration-200",
                  sidebarCollapsed ? "px-2" : "px-4",
                  "h-12"
                )}
                onClick={() => setActiveCategory(category.id)}
              >
                <div className="flex items-center gap-3">
                  {category.icon}
                  {!sidebarCollapsed && (
                    <span className="text-sm font-medium">{category.label}</span>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* Sidebar Footer */}
        <div className="p-4 border-t">
          <Button
            onClick={handleSave}
            className={cn(
              "w-full transition-all duration-200",
              sidebarCollapsed ? "px-2" : "px-4"
            )}
            size="sm"
          >
            <Save className="h-4 w-4" />
            {!sidebarCollapsed && <span className="ml-2">Guardar</span>}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={cn(
        "flex-1 transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "ml-16" : "ml-80"
      )}>
        <div className="p-6">
          {/* Header with back button */}
          <div className="flex items-center mb-6">
            <Link to="/">
              <Button variant="ghost" size="icon" className="mr-2">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">
              {categories.find(cat => cat.id === activeCategory)?.label || "Configuración"}
            </h1>
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="pr-4">{/* Content padding for scrollbar */}
              {/* General Settings */}
              {activeCategory === "general" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configuración General</CardTitle>
                      <CardDescription>
                        Configura las opciones básicas de la aplicación
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                          <option value="pt">Português</option>
                          <option value="fr">Français</option>
                        </select>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="font-medium">Guía de usuario</Label>
                            <p className="text-sm text-muted-foreground">Volver a mostrar la guía de introducción</p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleRestartGuide}
                            className="flex items-center space-x-2"
                          >
                            <HelpCircle size={16} />
                            <span>Mostrar guía</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
                
              {/* Appearance Settings */}
              {activeCategory === "appearance" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Apariencia</CardTitle>
                      <CardDescription>
                        Personaliza la apariencia de la aplicación
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                      
                      <div>
                        <Label className="font-medium">Tema de colores</Label>
                        <p className="text-sm text-muted-foreground mb-2">Selecciona un tema para la aplicación</p>
                        <div className="grid grid-cols-3 gap-2">
                          <Button variant="outline" className="h-10 border-2 border-primary">
                            <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                            Azul
                          </Button>
                          <Button variant="outline" className="h-10">
                            <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                            Verde
                          </Button>
                          <Button variant="outline" className="h-10">
                            <div className="w-4 h-4 rounded-full bg-purple-500 mr-2"></div>
                            Púrpura
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
                
              {/* Forms Settings */}
              {activeCategory === "forms" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Gestión de formularios</CardTitle>
                      <CardDescription>
                        Crea y gestiona tus formularios
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Título del formulario</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ingresa un título" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Este será el título visible de tu formulario.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Descripción</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Describe brevemente el propósito del formulario"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Una descripción ayuda a los usuarios a entender el propósito del formulario.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button type="submit" className="w-full">
                            <Plus className="mr-2 h-4 w-4" />
                            Crear nuevo formulario
                          </Button>
                        </form>
                      </Form>
                      
                      <div>
                        <Label className="font-medium">Ajustes de creación</Label>
                        <p className="text-sm text-muted-foreground mb-2">Configura cómo se crean los formularios</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="default-type" className="text-sm">Tipo predeterminado</Label>
                          </div>
                          <select 
                            id="default-type"
                            className="rounded-md border border-input bg-background px-3 py-1"
                          >
                            <option value="form">Formulario</option>
                            <option value="formatted">Formato clínico</option>
                          </select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
                
              {/* Notifications Settings */}
              {activeCategory === "notifications" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Notificaciones</CardTitle>
                      <CardDescription>
                        Configura cómo y cuándo recibir notificaciones
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                          <Label htmlFor="email-notifications" className="font-medium">Notificaciones por email</Label>
                          <p className="text-sm text-muted-foreground">Recibir notificaciones por email</p>
                        </div>
                        <Switch id="email-notifications" />
                      </div>
                      
                      <div>
                        <Label className="font-medium">Frecuencia de resumen</Label>
                        <p className="text-sm text-muted-foreground mb-2">¿Con qué frecuencia quieres recibir resúmenes?</p>
                        <select className="w-full rounded-md border border-input bg-background px-3 py-2">
                          <option value="daily">Diario</option>
                          <option value="weekly">Semanal</option>
                          <option value="monthly">Mensual</option>
                          <option value="never">Nunca</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
                
              {/* Account Settings */}
              {activeCategory === "account" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Cuenta</CardTitle>
                      <CardDescription>
                        Gestiona tu cuenta y perfil
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <UserCog size={24} className="text-gray-500" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">Usuario Médico</h3>
                          <p className="text-xs text-muted-foreground">usuario@hospital.com</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Nombre completo</Label>
                          <Input id="name" defaultValue="Usuario Médico" />
                        </div>
                        
                        <div>
                          <Label htmlFor="email">Correo electrónico</Label>
                          <Input id="email" defaultValue="usuario@hospital.com" />
                        </div>
                        
                        <Button variant="outline" className="w-full">Cambiar contraseña</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
                
              {/* Advanced Settings */}
              {activeCategory === "advanced" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configuración avanzada</CardTitle>
                      <CardDescription>
                        Configuraciones avanzadas y opciones de desarrollador
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Datos guardados</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Puedes eliminar todos los datos guardados localmente en este navegador.
                        </p>
                        <Button variant="destructive" size="sm">Eliminar datos</Button>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <h4 className="text-sm font-medium mb-2">Exportar/Importar</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Exporta tus configuraciones o importa desde un archivo.
                        </p>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Exportar configuración</Button>
                          <Button variant="outline" size="sm">Importar configuración</Button>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <h4 className="text-sm font-medium mb-2">Configuración de desarrollador</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="debug-mode" className="text-sm">Modo debug</Label>
                            <Switch id="debug-mode" />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="api-logs" className="text-sm">Mostrar logs de API</Label>
                            <Switch id="api-logs" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

// Componente de diálogo para mantener compatibilidad con código existente
export const SettingsDialog = () => {
  const navigate = useNavigate();
  
  const handleOpenSettings = () => {
    navigate('/configuracion');
  };
  
  return (
    <Button 
      variant="ghost" 
      className="p-2 flex items-center gap-2" 
      size="icon"
      onClick={handleOpenSettings}
    >
      <Cog size={18} />
    </Button>
  );
};
