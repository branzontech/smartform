import { useState, useMemo, useCallback } from "react";
import { Search, Plus, Edit, Link, X, Loader2, Package, FlaskConical, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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

// ========== SERVICIOS TAB ==========
function ServiciosTab() {
  const { data: servicios, isLoading } = useServiciosConConteo();
  const createMut = useCreateServicioClinico();
  const updateMut = useUpdateServicioClinico();
  const toggleMut = useToggleServicioActivo();

  const [filter, setFilter] = useState("");
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

  const filtered = useMemo(() => {
    if (!servicios) return [];
    if (!filter) return servicios;
    const lower = filter.toLowerCase();
    return servicios.filter(s => s.codigo.toLowerCase().includes(lower) || s.nombre.toLowerCase().includes(lower));
  }, [servicios, filter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Servicios Clínicos</h2>
        <Button size="sm" className="gap-1.5 text-xs" onClick={openCreate}><Plus size={14} /> Nuevo Servicio</Button>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Buscar por nombre o código..."
          className="w-full pl-9 pr-3 py-2 text-sm bg-transparent border-b border-border focus:border-primary outline-none transition-colors"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Stethoscope className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No hay servicios clínicos</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left px-3 py-2 font-medium">Código</th>
                <th className="text-left px-3 py-2 font-medium">Nombre</th>
                <th className="text-left px-3 py-2 font-medium">Tipo</th>
                <th className="text-left px-3 py-2 font-medium">C. Costo</th>
                <th className="text-center px-3 py-2 font-medium">Procs.</th>
                <th className="text-center px-3 py-2 font-medium">Activo</th>
                <th className="text-right px-3 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 font-mono text-xs">{s.codigo}</td>
                  <td className="px-3 py-2">{s.nombre}</td>
                  <td className="px-3 py-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                      {TIPO_LABELS[s.tipo] || s.tipo}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground text-xs">{s.centro_costo || "—"}</td>
                  <td className="px-3 py-2 text-center">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {(s as any).procedimientos_count}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Switch
                      checked={s.activo}
                      onCheckedChange={v => toggleMut.mutate({ id: s.id, activo: v })}
                      className="scale-75"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}>
                        <Edit size={13} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setProcsDialogServicio(s)}>
                        <Link size={13} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
              <div className="flex justify-center py-8"><Loader2 className="h-4 w-4 animate-spin" /></div>
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

  const [filter, setFilter] = useState("");
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

  const filtered = useMemo(() => {
    if (!procs) return [];
    if (!filter) return procs;
    const lower = filter.toLowerCase();
    return procs.filter(p => p.codigo.toLowerCase().includes(lower) || p.descripcion.toLowerCase().includes(lower));
  }, [procs, filter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Catálogo de Procedimientos</h2>
        <Button size="sm" className="gap-1.5 text-xs" onClick={openCreate}><Plus size={14} /> Nuevo Procedimiento</Button>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Buscar por código o descripción..."
          className="w-full pl-9 pr-3 py-2 text-sm bg-transparent border-b border-border focus:border-primary outline-none transition-colors"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <FlaskConical className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No hay procedimientos en el catálogo</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left px-3 py-2 font-medium">Código</th>
                <th className="text-left px-3 py-2 font-medium">Descripción</th>
                <th className="text-left px-3 py-2 font-medium">Sistema</th>
                <th className="text-left px-3 py-2 font-medium">Tipo</th>
                <th className="text-left px-3 py-2 font-medium">Capítulo</th>
                <th className="text-center px-3 py-2 font-medium">Activo</th>
                <th className="text-right px-3 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 font-mono text-xs">{p.codigo}</td>
                  <td className="px-3 py-2 max-w-[250px] truncate">{p.descripcion}</td>
                  <td className="px-3 py-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                      {SISTEMA_LABELS[p.sistema_codificacion] || p.sistema_codificacion}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                      {TIPO_PROC_LABELS[p.tipo] || p.tipo}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{p.capitulo || "—"}</td>
                  <td className="px-3 py-2 text-center">
                    <Switch
                      checked={p.activo}
                      onCheckedChange={v => toggleMut.mutate({ id: p.id, activo: v })}
                      className="scale-75"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                      <Edit size={13} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
