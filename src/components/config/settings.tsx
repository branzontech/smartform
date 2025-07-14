import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, PlusSquare, Palette, Bell, Database, Save, User, UserCog, Shield, Plus, Cog, HelpCircle, Home, Trash2 } from "lucide-react";
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

// Floating menu items (como en la imagen de referencia)
const floatingMenuItems = [
  { id: "home", icon: <Home size={20} />, action: () => window.location.href = "/" },
  { id: "forms", icon: <FileText size={20} />, isActive: false },
  { id: "users", icon: <User size={20} />, isActive: false },
  { id: "plus", icon: <Plus size={20} />, isActive: false },
  { id: "database", icon: <Database size={20} />, isActive: false },
  { id: "briefcase", icon: <PlusSquare size={20} />, isActive: false },
  // Separador visual
  { id: "separator", icon: null, isActive: false },
  { id: "cog", icon: <Cog size={20} />, isActive: true },
  { id: "trash", icon: <Trash2 size={20} />, isActive: false },
];

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
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Menú Flotante Vertical - Como en la imagen de referencia */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50">
        <div className="bg-card/95 backdrop-blur-sm rounded-full shadow-xl border border-border/20 p-3 w-20">
          <div className="flex flex-col items-center space-y-4">
            {floatingMenuItems.map((item, index) => (
              <div key={item.id}>
                {item.id === "separator" ? (
                  <div className="w-8 h-px bg-border my-2" />
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "w-12 h-12 rounded-full transition-all duration-200 hover:scale-110",
                      item.isActive 
                        ? "bg-primary text-primary-foreground shadow-md" 
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                    onClick={item.action || (() => setActiveCategory(item.id))}
                  >
                    {item.icon}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Área de contenido principal */}
      <div className="pl-28 pr-6 py-6">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold">
            {categories.find(cat => cat.id === activeCategory)?.label || "Configuración"}
          </h1>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="pr-4 max-w-4xl">
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
                    <div className="space-y-2">
                      <Label htmlFor="username">Nombre de usuario</Label>
                      <Input id="username" placeholder="Tu nombre de usuario" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="tu@email.com" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio">Biografía</Label>
                      <Textarea id="bio" placeholder="Cuéntanos sobre ti..." />
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
                    <CardTitle>Configuración Avanzada</CardTitle>
                    <CardDescription>
                      Configuraciones para usuarios avanzados
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Modo desarrollador</Label>
                        <p className="text-sm text-muted-foreground">Activar funciones de desarrollo</p>
                      </div>
                      <Switch />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Registros detallados</Label>
                        <p className="text-sm text-muted-foreground">Activar logs de depuración</p>
                      </div>
                      <Switch />
                    </div>
                    
                    <div className="pt-4 border-t">
                      <Button variant="destructive" className="w-full">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Restablecer configuración
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Fixed Save Button */}
        <div className="fixed bottom-6 right-6">
          <Button onClick={handleSave} size="lg" className="shadow-xl">
            <Save className="mr-2 h-4 w-4" />
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  );
};