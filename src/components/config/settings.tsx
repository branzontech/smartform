import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, FileText, Palette, Bell, Save, User, Shield, Plus, HelpCircle,
  Trash2, SlidersHorizontal, ClipboardList, Loader2, Eye, Edit, BarChart,
  Building2, UserCog, Stethoscope, FlaskConical, Search, ChevronLeft,
  ChevronRight, Building, Handshake, Calculator, Package, MapPin, Settings,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { ServiciosClinicosConfig } from "@/components/config/ServiciosClinicosConfig";
import { InstitutionHeaderConfig } from "@/components/config/InstitutionHeaderConfig";
import { PatientFieldsConfig } from "@/components/config/PatientFieldsConfig";
import { AdmissionFieldsConfig } from "@/components/config/AdmissionFieldsConfig";
import { PatientHeaderConfig } from "@/components/config/PatientHeaderConfig";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useOnboarding } from "@/hooks/use-onboarding";
import { cn } from "@/lib/utils";

// ---------- Grouped navigation ----------
const settingsSections = [
  {
    label: "General",
    items: [
      { id: "general", label: "Institución", icon: Building2 },
      { id: "header", label: "Encabezado clínico", icon: FileText },
      { id: "patient-header", label: "Encabezado paciente", icon: UserCog },
      { id: "appearance", label: "Apariencia y tema", icon: Palette },
      { id: "notifications", label: "Notificaciones", icon: Bell },
    ],
  },
  {
    label: "Clínica",
    items: [
      { id: "forms", label: "Formularios", icon: ClipboardList },
      { id: "servicios-clinicos", label: "Servicios clínicos", icon: Stethoscope },
      { id: "catalogo-procedimientos", label: "Catálogo de procedimientos", icon: FlaskConical },
      { id: "customization", label: "Campos personalizados", icon: SlidersHorizontal },
    ],
  },
  {
    label: "Facturación",
    items: [
      { id: "contratos", label: "Contratos y convenios", icon: Handshake },
      { id: "tarifarios", label: "Tarifarios", icon: Calculator },
      { id: "pagadores", label: "Pagadores / EPS", icon: Building },
    ],
  },
  {
    label: "Inventario",
    items: [
      { id: "catalogo-productos", label: "Catálogo de productos", icon: Package },
      { id: "sedes", label: "Sedes y bodegas", icon: MapPin },
    ],
  },
  {
    label: "Cuenta",
    items: [
      { id: "account", label: "Mi perfil", icon: User },
      { id: "advanced", label: "Avanzado", icon: Settings },
    ],
  },
];

const allItemIds = settingsSections.flatMap((s) => s.items.map((i) => i.id));

// Titles / subtitles for content header
const sectionMeta: Record<string, { title: string; subtitle?: string }> = {
  general: { title: "Institución", subtitle: "Configuración general de la institución" },
  header: { title: "Encabezado clínico", subtitle: "Personaliza el encabezado institucional" },
  "patient-header": { title: "Encabezado de paciente", subtitle: "Configure qué datos del paciente se muestran en el banner del formulario clínico" },
  appearance: { title: "Apariencia y tema", subtitle: "Colores y estilo visual de la aplicación" },
  notifications: { title: "Notificaciones", subtitle: "Preferencias de alertas y resúmenes" },
  forms: { title: "Formularios", subtitle: "Gestión de formularios clínicos" },
  "servicios-clinicos": { title: "Servicios clínicos", subtitle: "Administre los servicios clínicos de la institución" },
  "catalogo-procedimientos": { title: "Catálogo de procedimientos", subtitle: "Maestro de procedimientos médicos" },
  customization: { title: "Campos personalizados", subtitle: "Campos personalizados almacenados como extensiones FHIR" },
  contratos: { title: "Contratos y convenios", subtitle: "Gestión de contratos con pagadores" },
  tarifarios: { title: "Tarifarios", subtitle: "Administración de tarifarios de servicios" },
  pagadores: { title: "Pagadores / EPS", subtitle: "Entidades pagadoras y aseguradoras" },
  "catalogo-productos": { title: "Catálogo de productos", subtitle: "Maestro de medicamentos e insumos" },
  sedes: { title: "Sedes y bodegas", subtitle: "Ubicaciones y almacenes" },
  account: { title: "Mi perfil", subtitle: "Información de tu cuenta" },
  advanced: { title: "Avanzado", subtitle: "Opciones de desarrollo y depuración" },
};

// ---------- Coming‐soon placeholder ----------
function ComingSoon({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-2xl bg-muted/60 p-5 mb-4">
        <Icon className="h-10 w-10 text-muted-foreground/50" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">Próximamente</p>
      <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">
        El módulo de <span className="font-medium">{label}</span> estará disponible pronto.
      </p>
    </div>
  );
}

// ---------- Main component ----------
export const SettingsPage = () => {
  const navigate = useNavigate();
  const { resetOnboarding } = useOnboarding();

  // Sidebar collapse
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("settings-sidebar-collapsed") === "true"; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem("settings-sidebar-collapsed", String(collapsed)); } catch {}
  }, [collapsed]);

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Active tab via query param
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeCategory = allItemIds.includes(tabParam ?? "") ? tabParam! : "general";
  const setActiveCategory = (id: string) => {
    const p = new URLSearchParams(searchParams);
    if (id === "general") p.delete("tab"); else p.set("tab", id);
    setSearchParams(p, { replace: true });
  };

  useEffect(() => {
    if (tabParam && !allItemIds.includes(tabParam)) setActiveCategory("general");
  }, [tabParam]);

  // Settings state
  const [autoSave, setAutoSave] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [darkPrint, setDarkPrint] = useState(false);
  const [language, setLanguage] = useState("es");

  // Forms
  const [forms, setForms] = useState<any[]>([]);
  const [formsLoading, setFormsLoading] = useState(false);
  useEffect(() => {
    if (activeCategory !== "forms") return;
    const loadForms = async () => {
      setFormsLoading(true);
      const { data } = await supabase.from("formularios").select("*").order("created_at", { ascending: false });
      setForms(data || []);
      setFormsLoading(false);
    };
    loadForms();
  }, [activeCategory]);

  const handleSave = () => toast.success("Configuración guardada con éxito");
  const handleRestartGuide = () => { resetOnboarding(); toast.success("Guía de usuario reiniciada."); };

  // Filtered sections
  const q = searchQuery.toLowerCase().trim();
  const filteredSections = useMemo(() => {
    if (!q) return settingsSections;
    return settingsSections
      .map((s) => ({ ...s, items: s.items.filter((i) => i.label.toLowerCase().includes(q)) }))
      .filter((s) => s.items.length > 0);
  }, [q]);

  const meta = sectionMeta[activeCategory];

  // Find icon for coming-soon
  const findItem = (id: string) => {
    for (const s of settingsSections) for (const i of s.items) if (i.id === id) return i;
    return null;
  };

  const SIDEBAR_EXPANDED = 260;
  const SIDEBAR_COLLAPSED = 56;
  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {/* ===== SIDEBAR ===== */}
        <TooltipProvider delayDuration={0}>
          <aside
            className="shrink-0 h-full flex flex-col border-r border-border bg-muted/30 backdrop-blur-sm transition-[width] duration-200 ease-in-out overflow-hidden"
            style={{ width: sidebarWidth }}
          >
            {/* Top: back + collapse toggle */}
            <div className="flex items-center justify-between px-2 pt-3 pb-1">
              {!collapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg shrink-0"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft size={15} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7 rounded-lg shrink-0", collapsed && "mx-auto")}
                onClick={() => setCollapsed((c) => !c)}
              >
                {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
              </Button>
            </div>

            {/* Title */}
            {!collapsed && (
              <div className="px-4 pb-2">
                <h1 className="text-sm font-semibold truncate">Configuración</h1>
              </div>
            )}

            {/* Search */}
            <div className="px-2 pb-2">
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="w-full flex items-center justify-center h-8 rounded-lg text-muted-foreground hover:bg-muted/60 transition-colors"
                      onClick={() => { setCollapsed(false); setTimeout(() => document.getElementById("settings-search")?.focus(), 250); }}
                    >
                      <Search size={16} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Buscar configuración</TooltipContent>
                </Tooltip>
              ) : (
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    id="settings-search"
                    type="text"
                    placeholder="Buscar configuración..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                  />
                </div>
              )}
            </div>

            {/* Nav items with internal scroll */}
            <nav className="flex-1 overflow-y-auto px-2 pb-3 scrollbar-thin">
              {filteredSections.map((section, si) => (
                <div key={section.label} className={cn(si > 0 && "mt-4")}>
                  {/* Section header */}
                  {!collapsed && (
                    <p className="px-2 mb-1 text-[11px] font-medium uppercase tracking-[0.5px] text-muted-foreground/60 select-none">
                      {section.label}
                    </p>
                  )}
                  {collapsed && si > 0 && (
                    <div className="mx-2 my-2 border-t border-border/50" />
                  )}

                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeCategory === item.id;
                      const btn = (
                        <button
                          key={item.id}
                          onClick={() => setActiveCategory(item.id)}
                          className={cn(
                            "w-full flex items-center gap-2.5 rounded-md text-left text-[13px] transition-all duration-150 relative",
                            collapsed ? "justify-center px-0 py-2" : "px-2.5 py-[7px]",
                            isActive
                              ? "bg-primary/10 font-medium text-primary border-l-2 border-primary"
                              : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                          )}
                        >
                          <Icon size={16} className="shrink-0" />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </button>
                      );

                      if (collapsed) {
                        return (
                          <Tooltip key={item.id}>
                            <TooltipTrigger asChild>{btn}</TooltipTrigger>
                            <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
                          </Tooltip>
                        );
                      }
                      return btn;
                    })}
                  </div>
                </div>
              ))}

              {filteredSections.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">Sin resultados</p>
              )}
            </nav>
          </aside>
        </TooltipProvider>

        {/* ===== CONTENT ===== */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-8 py-6">
            {/* Content header */}
            {meta && (
              <div className="mb-6">
                <h2 className="text-[22px] font-medium">{meta.title}</h2>
                {meta.subtitle && <p className="text-sm text-muted-foreground mt-0.5">{meta.subtitle}</p>}
              </div>
            )}

            {/* ---- Existing content sections ---- */}

            {activeCategory === "general" && (
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
            )}

            {activeCategory === "header" && <InstitutionHeaderConfig />}

            {activeCategory === "patient-header" && <PatientHeaderConfig />}

            {activeCategory === "appearance" && (
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
                      <div className="w-3 h-3 rounded-full bg-primary mr-1.5" />
                      Azul
                    </Button>
                    <Button variant="outline" size="sm">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 mr-1.5" />
                      Verde
                    </Button>
                    <Button variant="outline" size="sm">
                      <div className="w-3 h-3 rounded-full bg-violet-500 mr-1.5" />
                      Púrpura
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeCategory === "notifications" && (
              <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm divide-y divide-border">
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <Label htmlFor="notif-toggle" className="text-sm font-medium">Notificaciones</Label>
                    <p className="text-xs text-muted-foreground">Recibir notificaciones de actividad</p>
                  </div>
                  <Switch id="notif-toggle" checked={notifications} onCheckedChange={setNotifications} />
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
            )}

            {activeCategory === "forms" && (
              <div>
                <div className="flex items-center justify-end mb-4">
                  <Button size="sm" className="gap-1.5" onClick={() => navigate("/app/crear")}>
                    <Plus className="h-3.5 w-3.5" />
                    Nuevo formulario
                  </Button>
                </div>
                {formsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : forms.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
                    <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-3">No hay formularios creados</p>
                    <Button size="sm" variant="outline" onClick={() => navigate("/app/crear")}>
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Crear primer formulario
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {forms.map((f) => (
                      <div key={f.id} className="rounded-xl border border-border bg-card/50 px-4 py-3 flex items-center justify-between group hover:bg-card transition-colors">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium truncate">{f.titulo}</h3>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground shrink-0">
                              {f.tipo === "formato" ? "Formato" : "Form"}
                            </span>
                            <span className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded-md shrink-0",
                              f.estado === "activo" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                            )}>
                              {f.estado}
                            </span>
                          </div>
                          {f.descripcion && <p className="text-xs text-muted-foreground mt-0.5 truncate">{f.descripcion}</p>}
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {f.respuestas_count || 0} respuestas · {new Date(f.created_at).toLocaleDateString("es")}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/app/crear/${f.id}`)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/app/ver/${f.id}`)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/app/formulario/${f.id}/respuestas`)}>
                            <BarChart className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeCategory === "servicios-clinicos" && <ServiciosClinicosConfig defaultTab="servicios" />}
            {activeCategory === "catalogo-procedimientos" && <ServiciosClinicosConfig defaultTab="catalogo" />}

            {activeCategory === "customization" && (
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
                <TabsContent value="patient"><PatientFieldsConfig /></TabsContent>
                <TabsContent value="admission"><AdmissionFieldsConfig /></TabsContent>
              </Tabs>
            )}

            {activeCategory === "account" && (
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
            )}

            {activeCategory === "advanced" && (
              <div>
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

            {/* Coming soon placeholders */}
            {["contratos", "tarifarios", "pagadores", "catalogo-productos", "sedes"].includes(activeCategory) && (
              <ComingSoon icon={findItem(activeCategory)?.icon ?? Package} label={findItem(activeCategory)?.label ?? ""} />
            )}
          </div>
        </main>
      </div>

      {/* Save FAB */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button onClick={handleSave} size="sm" className="shadow-lg rounded-lg gap-1.5">
          <Save className="h-3.5 w-3.5" />
          Guardar
        </Button>
      </div>
    </div>
  );
};
