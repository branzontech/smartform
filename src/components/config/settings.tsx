
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, PlusSquare, Palette, Bell, Database, Save, User, UserCog, Shield, Plus, Cog } from "lucide-react";
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
  
  const [autoSave, setAutoSave] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [darkPrint, setDarkPrint] = useState(false);
  const [language, setLanguage] = useState("es");

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

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="flex items-center mb-6">
        <Link to="/">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Configuración</h1>
      </div>
      
      <div className="bg-card border rounded-lg shadow-sm">
        <div className="p-6">
          <Tabs defaultValue="general" className="w-full">
            <div className="mb-8">
              <TabsList className={`grid ${isMobile ? 'grid-cols-3 gap-1' : 'grid-cols-6'} w-full`}>
                {categories.map(category => (
                  <TabsTrigger 
                    key={category.id} 
                    value={category.id}
                    className="flex flex-col items-center gap-1 py-2 h-auto"
                  >
                    {category.icon}
                    <span className="text-xs">{category.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            
            <div className="mb-6">
              <TabsContent value="general" className="space-y-4">
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
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="appearance" className="space-y-4">
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
              </TabsContent>
              
              <TabsContent value="forms" className="space-y-4">
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
              </TabsContent>
              
              <TabsContent value="notifications" className="space-y-4">
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
              </TabsContent>
              
              <TabsContent value="account" className="space-y-4">
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
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4">
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
              </TabsContent>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Guardar cambios
              </Button>
            </div>
          </Tabs>
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
