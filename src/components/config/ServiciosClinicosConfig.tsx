import { useState, useMemo, useCallback } from "react";
import { Search, Plus, Edit, Link, X, Loader2, FlaskConical, Stethoscope, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { AccionesFila } from "@/components/kit/AccionesFila";
import {
  BarraTabla, CeldaEstado, TablaDatos, botonPrimario, useTablaDatos,
  type ColumnaTabla, type FiltroTabla, type SegmentoTabla,
} from "@/components/kit/tabla";
import {
  useServiciosConConteo,
  useCreateServicioClinico,
  useUpdateServicioClinico,
  useToggleServicioActivo,
  useServicioProcedimientos,
  useAsociarProcedimiento,
  useDesasociarProcedimiento,
  useAllCatalogoProcedimientos,
  useCreateProcedimiento,
  useUpdateProcedimiento,
  useToggleProcedimientoActivo,
} from "@/hooks/useServiciosClinicos";
import type { ServicioClinico, CatalogoProcedimiento } from "@/types/servicios";

const TIPO_LABELS: Record<string, string> = {
  procedimientos: "Procedimientos",
  laboratorio: "Laboratorio",
  imagenologia: "Imagenología",
  consulta_externa: "Consulta Externa",
  urgencias: "Urgencias",
  hospitalizacion: "Hospitalización",
  cirugia: "Cirugía",
  terapia: "Terapia",
  odontologia: "Odontología",
  otro: "Otro",
};

const SISTEMA_LABELS: Record<string, string> = {
  CUPS: "CUPS",
  CPT: "CPT",
  "SNOMED-CT": "SNOMED-CT",
  LOINC: "LOINC",
  ICD10PCS: "ICD-10-PCS",
};

const TIPO_PROC_LABELS: Record<string, string> = {
  procedimiento: "Procedimiento",
  laboratorio: "Laboratorio",
  imagenologia: "Imagenología",
  terapia: "Terapia",
  otro: "Otro",
};

// ========== TABLAS (convención Ker Hub) ==========
type ServicioConConteo = ServicioClinico & { procedimientos_count?: number };

const derecha = "text-right tabular-nums";

function columnaEstado<T extends { activo: boolean }>(): ColumnaTabla<T> {
  return {
    id: "estado", titulo: "Estado", valor: (f) => (f.activo ? "Activo" : "Inactivo"), sinPadding: true,
    celda: (f) => <CeldaEstado tono={f.activo ? "exito" : "neutro"} texto={f.activo ? "Activo" : "Inactivo"} />,
  };
}

function segmentosActivo<T extends { activo: boolean }>(): SegmentoTabla<T>[] {
  return [
    { id: "todos", titulo: "Todos", cumple: () => true },
    { id: "activos", titulo: "Activos", cumple: (f) => f.activo },
    { id: "inactivos", titulo: "Inactivos", cumple: (f) => !f.activo },
  ];
}

const SEGMENTOS_SERVICIOS = segmentosActivo<ServicioConConteo>();
const SEGMENTOS_PROCEDIMIENTOS = segmentosActivo<CatalogoProcedimiento>();
const claveServicio = (s: ServicioConConteo) => s.id;
const claveProcedimiento = (p: CatalogoProcedimiento) => p.id;

const COLUMNAS_SERVICIOS: ColumnaTabla<ServicioConConteo>[] = [
  { id: "codigo", titulo: "Código", valor: (s) => s.codigo, className: "font-mono text-xs", fija: true },
  { id: "nombre", titulo: "Nombre", valor: (s) => s.nombre, principal: true, className: "min-w-[220px]" },
  { id: "tipo", titulo: "Tipo", valor: (s) => TIPO_LABELS[s.tipo] || s.tipo },
  { id: "centroCosto", titulo: "Centro de costo", valor: (s) => s.centro_costo },
  { id: "procedimientos", titulo: "Procedimientos", valor: (s) => s.procedimientos_count ?? 0, className: derecha },
  { id: "descripcion", titulo: "Descripción", valor: (s) => s.descripcion, oculta: true },
  columnaEstado<ServicioConConteo>(),
];

const FILTROS_SERVICIOS: FiltroTabla<ServicioConConteo>[] = [
  { id: "tipo", titulo: "Tipo", valor: (s) => TIPO_LABELS[s.tipo] || s.tipo },
  { id: "centroCosto", titulo: "Centro de costo", valor: (s) => s.centro_costo },
];

const COLUMNAS_PROCEDIMIENTOS: ColumnaTabla<CatalogoProcedimiento>[] = [
  { id: "codigo", titulo: "Código", valor: (p) => p.codigo, className: "font-mono text-xs", fija: true },
  { id: "descripcion", titulo: "Descripción", valor: (p) => p.descripcion, principal: true, className: "min-w-[260px] max-w-[420px] truncate" },
  { id: "sistema", titulo: "Sistema", valor: (p) => SISTEMA_LABELS[p.sistema_codificacion] || p.sistema_codificacion },
  { id: "tipo", titulo: "Tipo", valor: (p) => TIPO_PROC_LABELS[p.tipo] || p.tipo },
  { id: "capitulo", titulo: "Capítulo", valor: (p) => p.capitulo, oculta: true },
  columnaEstado<CatalogoProcedimiento>(),
];

const FILTROS_PROCEDIMIENTOS: FiltroTabla<CatalogoProcedimiento>[] = [
  { id: "sistema", titulo: "Sistema", valor: (p) => SISTEMA_LABELS[p.sistema_codificacion] || p.sistema_codificacion },
  { id: "tipo", titulo: "Tipo", valor: (p) => TIPO_PROC_LABELS[p.tipo] || p.tipo },
  { id: "capitulo", titulo: "Capítulo", valor: (p) => p.capitulo },
];

// ========== SERVICIOS TAB ==========
function ServiciosTab() {
  const { data: servicios, isLoading } = useServiciosConConteo();
  const createMut = useCreateServicioClinico();
  const updateMut = useUpdateServicioClinico();
  const toggleMut = useToggleServicioActivo();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ServicioClinico | null>(null);
  const [procsDialogServicio, setProcsDialogServicio] = useState<ServicioClinico | null>(null);

  // Form state
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState<ServicioClinico["tipo"]>("procedimientos");
  const [centroCosto, setCentroCosto] = useState("");
  const [activo, setActivo] = useState(true);

  const resetForm = () => {
    setCodigo(""); setNombre(""); setDescripcion(""); setTipo("procedimientos"); setCentroCosto(""); setActivo(true);
  };

  const openCreate = () => { resetForm(); setEditing(null); setDialogOpen(true); };
  const openEdit = (s: ServicioClinico) => {
    setEditing(s); setCodigo(s.codigo); setNombre(s.nombre); setDescripcion(s.descripcion || "");
    setTipo(s.tipo); setCentroCosto(s.centro_costo || ""); setActivo(s.activo);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!codigo.trim() || !nombre.trim()) { toast.error("Código y nombre son requeridos"); return; }
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, codigo, nombre, descripcion: descripcion || null, tipo, centro_costo: centroCosto || null, activo });
        toast.success("Servicio actualizado");
      } else {
        await createMut.mutateAsync({ codigo, nombre, descripcion: descripcion || null, tipo, centro_costo: centroCosto || null, activo, fhir_extensions: {}, datos_regulatorios: {} } as any);
        toast.success("Servicio creado");
      }
      setDialogOpen(false);
    } catch (e: any) { toast.error(e.message || "Error al guardar"); }
  };

  const filas = useMemo(() => (servicios ?? []) as ServicioConConteo[], [servicios]);
  const t = useTablaDatos({ id: "config.servicios", filas, columnas: COLUMNAS_SERVICIOS, claveFila: claveServicio, filtros: FILTROS_SERVICIOS, segmentos: SEGMENTOS_SERVICIOS });

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">Servicios clínicos</h2>

      <TablaDatos
        t={t}
        cargando={isLoading}
        onFilaClick={openEdit}
        barra={
          <BarraTabla
            t={t}
            nombre={["servicio", "servicios"]}
            placeholder="Buscar por nombre o código"
            nombreArchivo="servicios-clinicos"
            acciones={<Button className={botonPrimario} onClick={openCreate}><Plus className="h-4 w-4" /> Nuevo servicio</Button>}
          />
        }
        acciones={(s) => (
          <AccionesFila
            nombre={s.nombre}
            menu={[
              { titulo: "Editar", icono: Edit, onClick: () => openEdit(s) },
              { titulo: "Gestionar procedimientos", icono: Link, onClick: () => setProcsDialogServicio(s) },
              { titulo: s.activo ? "Desactivar" : "Activar", icono: Power, onClick: () => toggleMut.mutate({ id: s.id, activo: !s.activo }) },
            ]}
          />
        )}
        vacio="Aún no hay servicios clínicos. Crea uno con «Nuevo servicio»."
      />

      {/* Dialog crear/editar servicio */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">{editing ? "Editar Servicio" : "Nuevo Servicio"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Código *</label>
                <input value={codigo} onChange={e => setCodigo(e.target.value)}
                  className="w-full px-0 py-1.5 text-sm bg-transparent border-b border-border focus:border-primary outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Nombre *</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)}
                  className="w-full px-0 py-1.5 text-sm bg-transparent border-b border-border focus:border-primary outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
                <select value={tipo} onChange={e => setTipo(e.target.value as ServicioClinico["tipo"])}
                  className="w-full px-0 py-1.5 text-sm bg-transparent border-b border-border focus:border-primary outline-none">
                  {Object.entries(TIPO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Centro de Costo</label>
                <input value={centroCosto} onChange={e => setCentroCosto(e.target.value)}
                  className="w-full px-0 py-1.5 text-sm bg-transparent border-b border-border focus:border-primary outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Descripción</label>
              <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2}
                className="w-full px-0 py-1.5 text-sm bg-transparent border-b border-border focus:border-primary outline-none resize-none" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={activo} onCheckedChange={setActivo} />
              <span className="text-sm">Activo</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
              {(createMut.isPending || updateMut.isPending) && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog gestionar procedimientos */}
      {procsDialogServicio && (
        <GestionarProcedimientosDialog
          servicio={procsDialogServicio}
          onClose={() => setProcsDialogServicio(null)}
        />
      )}
    </div>
  );
}

// ========== GESTIONAR PROCEDIMIENTOS DIALOG ==========
function GestionarProcedimientosDialog({ servicio, onClose }: { servicio: ServicioClinico; onClose: () => void }) {
  const { data: asociados, isLoading } = useServicioProcedimientos(servicio.id);
  const asociarMut = useAsociarProcedimiento();
  const desasociarMut = useDesasociarProcedimiento();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { data: resultados } = useAllCatalogoProcedimientos(debouncedSearch);

  // Debounce
  useState(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  });

  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
    const t = setTimeout(() => setDebouncedSearch(val), 300);
    return () => clearTimeout(t);
  }, []);

  const asociadoIds = useMemo(() => new Set((asociados || []).map(a => a.procedimiento_id)), [asociados]);
  const disponibles = useMemo(() => (resultados || []).filter(r => !asociadoIds.has(r.id)), [resultados, asociadoIds]);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-base">Procedimientos de {servicio.nombre}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 min-h-[300px]">
          {/* Izquierda: buscar y agregar */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Buscar en catálogo</p>
            <div className="relative">
              <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Código o descripción..."
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-transparent border-b border-border focus:border-primary outline-none"
              />
            </div>
            <div className="max-h-[280px] overflow-y-auto space-y-0.5">
              {disponibles.length === 0 && debouncedSearch.length >= 2 && (
                <p className="text-xs text-muted-foreground py-4 text-center">Sin resultados</p>
              )}
              {disponibles.map(p => (
                <div key={p.id} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted/40 transition-colors">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-mono text-muted-foreground">{p.codigo}</span>
                    <span className="text-xs ml-2">{p.descripcion}</span>
                  </div>
                  <Button
                    variant="ghost" size="icon" className="h-6 w-6 shrink-0"
                    onClick={() => {
                      asociarMut.mutate({ servicio_id: servicio.id, procedimiento_id: p.id });
                      toast.success("Procedimiento asociado");
                    }}
                  >
                    <Plus size={12} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          {/* Derecha: asociados */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Asociados ({asociados?.length || 0})</p>
            {isLoading ? (
              <div className="space-y-1.5 py-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-7 w-full" />)}</div>
            ) : (asociados || []).length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">Ningún procedimiento asociado</p>
            ) : (
              <div className="max-h-[320px] overflow-y-auto space-y-0.5">
                {(asociados || []).map(a => (
                  <div key={a.id} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted/40 transition-colors">
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-mono text-muted-foreground">{a.catalogo_procedimientos?.codigo}</span>
                      <span className="text-xs ml-2">{a.catalogo_procedimientos?.descripcion}</span>
                    </div>
                    <Button
                      variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-destructive"
                      onClick={() => {
                        desasociarMut.mutate({ id: a.id, servicio_id: servicio.id });
                        toast.success("Procedimiento desasociado");
                      }}
                    >
                      <X size={12} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ========== CATÁLOGO PROCEDIMIENTOS TAB ==========
function CatalogoProcedimientosTab() {
  const { data: procs, isLoading } = useAllCatalogoProcedimientos("");
  const createMut = useCreateProcedimiento();
  const updateMut = useUpdateProcedimiento();
  const toggleMut = useToggleProcedimientoActivo();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogoProcedimiento | null>(null);

  // Form
  const [codigo, setCodigo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [sistema, setSistema] = useState("CUPS");
  const [tipoPr, setTipoPr] = useState<CatalogoProcedimiento["tipo"]>("procedimiento");
  const [capitulo, setCapitulo] = useState("");
  const [activo, setActivo] = useState(true);

  const resetForm = () => { setCodigo(""); setDescripcion(""); setSistema("CUPS"); setTipoPr("procedimiento"); setCapitulo(""); setActivo(true); };
  const openCreate = () => { resetForm(); setEditing(null); setDialogOpen(true); };
  const openEdit = (p: CatalogoProcedimiento) => {
    setEditing(p); setCodigo(p.codigo); setDescripcion(p.descripcion); setSistema(p.sistema_codificacion);
    setTipoPr(p.tipo); setCapitulo(p.capitulo || ""); setActivo(p.activo);
    setDialogOpen(true);
  };

  const fhirUri = (s: string) => {
    const map: Record<string, string> = {
      CUPS: "https://www.minsalud.gov.co/cups",
      CPT: "http://www.ama-assn.org/go/cpt",
      "SNOMED-CT": "http://snomed.info/sct",
      LOINC: "http://loinc.org",
      ICD10PCS: "http://www.cms.gov/Medicare/Coding/ICD10",
    };
    return map[s] || `urn:oid:${s}`;
  };

  const handleSave = async () => {
    if (!codigo.trim() || !descripcion.trim()) { toast.error("Código y descripción son requeridos"); return; }
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, codigo, descripcion, sistema_codificacion: sistema, tipo: tipoPr, capitulo: capitulo || null, activo });
        toast.success("Procedimiento actualizado");
      } else {
        await createMut.mutateAsync({ codigo, descripcion, sistema_codificacion: sistema, fhir_system_uri: fhirUri(sistema), tipo: tipoPr, capitulo: capitulo || null, activo, fhir_extensions: {}, datos_regulatorios: {} } as any);
        toast.success("Procedimiento creado");
      }
      setDialogOpen(false);
    } catch (e: any) { toast.error(e.message || "Error al guardar"); }
  };

  const filas = useMemo(() => procs ?? [], [procs]);
  const t = useTablaDatos({ id: "config.catalogoProcedimientos", filas, columnas: COLUMNAS_PROCEDIMIENTOS, claveFila: claveProcedimiento, filtros: FILTROS_PROCEDIMIENTOS, segmentos: SEGMENTOS_PROCEDIMIENTOS });

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">Catálogo de procedimientos</h2>

      <TablaDatos
        t={t}
        cargando={isLoading}
        onFilaClick={openEdit}
        barra={
          <BarraTabla
            t={t}
            nombre={["procedimiento", "procedimientos"]}
            placeholder="Buscar por código o descripción"
            nombreArchivo="catalogo-procedimientos"
            acciones={<Button className={botonPrimario} onClick={openCreate}><Plus className="h-4 w-4" /> Nuevo procedimiento</Button>}
          />
        }
        acciones={(p) => (
          <AccionesFila
            nombre={p.descripcion}
            menu={[
              { titulo: "Editar", icono: Edit, onClick: () => openEdit(p) },
              { titulo: p.activo ? "Desactivar" : "Activar", icono: Power, onClick: () => toggleMut.mutate({ id: p.id, activo: !p.activo }) },
            ]}
          />
        )}
        vacio="Aún no hay procedimientos en el catálogo. Crea uno con «Nuevo procedimiento»."
      />

      {/* Dialog crear/editar procedimiento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">{editing ? "Editar Procedimiento" : "Nuevo Procedimiento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Código *</label>
                <input value={codigo} onChange={e => setCodigo(e.target.value)}
                  className="w-full px-0 py-1.5 text-sm bg-transparent border-b border-border focus:border-primary outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Sistema de Codificación</label>
                <select value={sistema} onChange={e => setSistema(e.target.value)}
                  className="w-full px-0 py-1.5 text-sm bg-transparent border-b border-border focus:border-primary outline-none">
                  {Object.entries(SISTEMA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Descripción *</label>
              <input value={descripcion} onChange={e => setDescripcion(e.target.value)}
                className="w-full px-0 py-1.5 text-sm bg-transparent border-b border-border focus:border-primary outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
                <select value={tipoPr} onChange={e => setTipoPr(e.target.value as CatalogoProcedimiento["tipo"])}
                  className="w-full px-0 py-1.5 text-sm bg-transparent border-b border-border focus:border-primary outline-none">
                  {Object.entries(TIPO_PROC_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Capítulo</label>
                <input value={capitulo} onChange={e => setCapitulo(e.target.value)}
                  className="w-full px-0 py-1.5 text-sm bg-transparent border-b border-border focus:border-primary outline-none" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={activo} onCheckedChange={setActivo} />
              <span className="text-sm">Activo</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
              {(createMut.isPending || updateMut.isPending) && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ========== COMPONENTE PRINCIPAL ==========
export function ServiciosClinicosConfig({ defaultTab }: { defaultTab?: "servicios" | "catalogo" }) {
  // If a specific tab is requested, render only that tab directly (no internal tabs)
  if (defaultTab === "servicios") {
    return <ServiciosTab />;
  }
  if (defaultTab === "catalogo") {
    return <CatalogoProcedimientosTab />;
  }

  // Fallback: show both tabs (backward compat)
  return (
    <div>
      <Tabs defaultValue="servicios" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 h-9">
          <TabsTrigger value="servicios" className="gap-1.5 text-xs">
            <Stethoscope size={14} />
            Servicios
          </TabsTrigger>
          <TabsTrigger value="catalogo" className="gap-1.5 text-xs">
            <FlaskConical size={14} />
            Catálogo de Procedimientos
          </TabsTrigger>
        </TabsList>
        <TabsContent value="servicios"><ServiciosTab /></TabsContent>
        <TabsContent value="catalogo"><CatalogoProcedimientosTab /></TabsContent>
      </Tabs>
    </div>
  );
}
