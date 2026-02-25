import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Layout } from "@/components/layout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  REGULATORY_COUNTRIES,
  REGULATORY_FIELDS_BY_COUNTRY,
} from "@/constants/regulatoryFields";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  DollarSign,
  Plus,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  ListPlus,
  ArrowLeft,
  Hash,
  FileText,
  Copy,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Types
interface TarifarioMaestro {
  id: string;
  nombre: string;
  descripcion: string | null;
  moneda: string;
  estado: boolean;
  fhir_extensions: Record<string, any>;
  created_at: string;
  servicios_count?: number;
}

interface TarifarioServicio {
  id: string;
  tarifario_id: string;
  sistema_codificacion: string;
  codigo_servicio: string;
  descripcion_servicio: string;
  valor: number;
  activo: boolean;
  metadata_regulatoria: Record<string, any>;
  created_at: string;
}

const MONEDAS = [
  { value: "COP", label: "🇨🇴 COP - Peso Colombiano" },
  { value: "MXN", label: "🇲🇽 MXN - Peso Mexicano" },
  { value: "USD", label: "🇺🇸 USD - Dólar" },
  { value: "PEN", label: "🇵🇪 PEN - Sol Peruano" },
  { value: "CLP", label: "🇨🇱 CLP - Peso Chileno" },
  { value: "ARS", label: "🇦🇷 ARS - Peso Argentino" },
  { value: "BOB", label: "🇧🇴 BOB - Boliviano" },
  { value: "EUR", label: "🇪🇺 EUR - Euro" },
];

const SISTEMAS_CODIFICACION = [
  { value: "CUPS", label: "CUPS" },
  { value: "CPT", label: "CPT" },
  { value: "SNOMED", label: "SNOMED CT" },
  { value: "INTERNO", label: "Interno" },
];

const PriceLists: React.FC = () => {
  // Master list state
  const [tarifarios, setTarifarios] = useState<TarifarioMaestro[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingTarifario, setEditingTarifario] = useState<TarifarioMaestro | null>(null);

  // Master form
  const [masterForm, setMasterForm] = useState({
    nombre: "",
    descripcion: "",
    moneda: "COP",
  });

  // Detail sheet state
  const [selectedTarifario, setSelectedTarifario] = useState<TarifarioMaestro | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [servicios, setServicios] = useState<TarifarioServicio[]>([]);
  const [loadingServicios, setLoadingServicios] = useState(false);
  const [servicioForm, setServicioForm] = useState({
    sistema_codificacion: "CUPS",
    codigo_servicio: "",
    descripcion_servicio: "",
    valor: "",
  });
  const [addingServicio, setAddingServicio] = useState(false);
  const [searchServicios, setSearchServicios] = useState("");
  const [paisClinica, setPaisClinica] = useState("CO");
  const [regulatoryForm, setRegulatoryForm] = useState<Record<string, string>>({});

  const currentRegulatoryConfig = useMemo(
    () => REGULATORY_FIELDS_BY_COUNTRY[paisClinica] || REGULATORY_FIELDS_BY_COUNTRY.OTHER,
    [paisClinica]
  );

  // Clone state
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [cloneTarget, setCloneTarget] = useState<TarifarioMaestro | null>(null);
  const [cloneForm, setCloneForm] = useState({ nombre: "", porcentaje: "" });
  const [cloning, setCloning] = useState(false);

  // Fetch tarifarios
  const fetchTarifarios = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tarifarios_maestros" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      // Fetch service counts
      const ids = (data as any[]).map((t: any) => t.id);
      const counts: Record<string, number> = {};

      if (ids.length > 0) {
        const { data: countData } = await supabase
          .from("tarifarios_servicios" as any)
          .select("tarifario_id")
          .in("tarifario_id", ids);

        if (countData) {
          (countData as any[]).forEach((s: any) => {
            counts[s.tarifario_id] = (counts[s.tarifario_id] || 0) + 1;
          });
        }
      }

      setTarifarios(
        (data as any[]).map((t: any) => ({
          ...t,
          servicios_count: counts[t.id] || 0,
        }))
      );
    }
    if (error) toast.error("Error cargando tarifarios");
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTarifarios();
  }, [fetchTarifarios]);

  // Fetch servicios for a tarifario
  const fetchServicios = useCallback(async (tarifarioId: string) => {
    setLoadingServicios(true);
    const { data, error } = await supabase
      .from("tarifarios_servicios" as any)
      .select("*")
      .eq("tarifario_id", tarifarioId)
      .order("codigo_servicio");

    if (data) setServicios(data as any[]);
    if (error) toast.error("Error cargando servicios");
    setLoadingServicios(false);
  }, []);

  const filteredTarifarios = tarifarios.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.nombre.toLowerCase().includes(q) ||
      t.moneda.toLowerCase().includes(q) ||
      t.descripcion?.toLowerCase().includes(q)
    );
  });

  const filteredServicios = servicios.filter((s) => {
    const q = searchServicios.toLowerCase();
    return (
      s.codigo_servicio.toLowerCase().includes(q) ||
      s.descripcion_servicio.toLowerCase().includes(q) ||
      s.sistema_codificacion.toLowerCase().includes(q)
    );
  });

  // Master CRUD
  const resetMasterForm = () => {
    setMasterForm({ nombre: "", descripcion: "", moneda: "COP" });
    setEditingTarifario(null);
  };

  const openNewDialog = () => {
    resetMasterForm();
    setDialogOpen(true);
  };

  const openEditDialog = (t: TarifarioMaestro) => {
    setEditingTarifario(t);
    setMasterForm({
      nombre: t.nombre,
      descripcion: t.descripcion || "",
      moneda: t.moneda,
    });
    setDialogOpen(true);
  };

  const handleSaveMaster = async () => {
    if (!masterForm.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    try {
      if (editingTarifario) {
        const { error } = await supabase
          .from("tarifarios_maestros" as any)
          .update({
            nombre: masterForm.nombre,
            descripcion: masterForm.descripcion || null,
            moneda: masterForm.moneda,
          } as any)
          .eq("id", editingTarifario.id);
        if (error) throw error;
        toast.success("Tarifario actualizado");
      } else {
        const { error } = await supabase
          .from("tarifarios_maestros" as any)
          .insert({
            nombre: masterForm.nombre,
            descripcion: masterForm.descripcion || null,
            moneda: masterForm.moneda,
          } as any);
        if (error) throw error;
        toast.success("Tarifario creado");
      }
      setDialogOpen(false);
      resetMasterForm();
      fetchTarifarios();
    } catch (err: any) {
      toast.error("Error: " + (err.message || ""));
    } finally {
      setSaving(false);
    }
  };

  const toggleEstado = async (t: TarifarioMaestro) => {
    const { error } = await supabase
      .from("tarifarios_maestros" as any)
      .update({ estado: !t.estado } as any)
      .eq("id", t.id);
    if (error) {
      toast.error("Error al cambiar estado");
    } else {
      toast.success(t.estado ? "Tarifario desactivado" : "Tarifario activado");
      fetchTarifarios();
    }
  };

  // Open detail sheet
  const openDetailSheet = (t: TarifarioMaestro) => {
    setSelectedTarifario(t);
    setSheetOpen(true);
    setSearchServicios("");
    setServicioForm({ sistema_codificacion: "CUPS", codigo_servicio: "", descripcion_servicio: "", valor: "" });
    setRegulatoryForm({});
    fetchServicios(t.id);
  };

  // Servicio CRUD
  const handleAddServicio = async () => {
    if (!selectedTarifario) return;
    if (!servicioForm.codigo_servicio.trim() || !servicioForm.descripcion_servicio.trim()) {
      toast.error("Código y descripción son obligatorios");
      return;
    }
    const valorNum = parseFloat(servicioForm.valor);
    if (isNaN(valorNum) || valorNum < 0) {
      toast.error("El valor debe ser un número válido");
      return;
    }

    // Validate required regulatory fields
    for (const field of currentRegulatoryConfig.fields) {
      if (field.required && !regulatoryForm[field.key]?.trim()) {
        toast.error(`"${field.label}" es obligatorio para ${currentRegulatoryConfig.label}`);
        return;
      }
    }

    // Build metadata
    const metadata: Record<string, any> = {};
    if (currentRegulatoryConfig.fields.length > 0) {
      metadata.pais = paisClinica;
      for (const field of currentRegulatoryConfig.fields) {
        if (regulatoryForm[field.key]?.trim()) {
          metadata[field.key] = regulatoryForm[field.key].trim();
        }
      }
    }

    setAddingServicio(true);
    try {
      const { error } = await supabase
        .from("tarifarios_servicios" as any)
        .insert({
          tarifario_id: selectedTarifario.id,
          sistema_codificacion: servicioForm.sistema_codificacion,
          codigo_servicio: servicioForm.codigo_servicio,
          descripcion_servicio: servicioForm.descripcion_servicio,
          valor: valorNum,
          metadata_regulatoria: metadata,
        } as any);
      if (error) throw error;
      toast.success("Servicio agregado");
      setServicioForm({ sistema_codificacion: "CUPS", codigo_servicio: "", descripcion_servicio: "", valor: "" });
      setRegulatoryForm({});
      fetchServicios(selectedTarifario.id);
      fetchTarifarios();
    } catch (err: any) {
      toast.error("Error: " + (err.message || ""));
    } finally {
      setAddingServicio(false);
    }
  };

  const handleToggleServicio = async (servicio: TarifarioServicio) => {
    if (!selectedTarifario) return;
    const newActivo = !servicio.activo;
    const { error } = await supabase
      .from("tarifarios_servicios" as any)
      .update({ activo: newActivo } as any)
      .eq("id", servicio.id);
    if (error) {
      toast.error("Error al cambiar estado");
    } else {
      toast.success(newActivo ? "Servicio activado" : "Servicio inactivado");
      fetchServicios(selectedTarifario.id);
    }
  };

  const formatCurrency = (valor: number, moneda: string) => {
    try {
      return new Intl.NumberFormat("es", { style: "currency", currency: moneda, minimumFractionDigits: 0 }).format(valor);
    } catch {
      return `${moneda} ${valor.toLocaleString()}`;
    }
  };

  // Clone tarifario
  const openCloneDialog = (t: TarifarioMaestro) => {
    setCloneTarget(t);
    setCloneForm({ nombre: `${t.nombre} - Actualizado`, porcentaje: "" });
    setCloneDialogOpen(true);
  };

  const handleClone = async () => {
    if (!cloneTarget || !cloneForm.nombre.trim()) return;
    const pct = parseFloat(cloneForm.porcentaje);
    if (isNaN(pct)) {
      toast.error("Ingresa un porcentaje válido");
      return;
    }

    setCloning(true);
    try {
      // 1. Create new tarifario maestro
      const { data: newMaestro, error: errMaestro } = await supabase
        .from("tarifarios_maestros" as any)
        .insert({
          nombre: cloneForm.nombre,
          descripcion: cloneTarget.descripcion,
          moneda: cloneTarget.moneda,
          estado: true,
        } as any)
        .select("id")
        .single();
      if (errMaestro || !newMaestro) throw errMaestro || new Error("No se pudo crear");

      // 2. Fetch old services (only activo)
      const { data: oldServices, error: errFetch } = await supabase
        .from("tarifarios_servicios" as any)
        .select("*")
        .eq("tarifario_id", cloneTarget.id)
        .eq("activo", true);
      if (errFetch) throw errFetch;

      // 3. Bulk insert new services with adjusted prices
      if (oldServices && (oldServices as any[]).length > 0) {
        const newServices = (oldServices as any[]).map((s: any) => ({
          tarifario_id: (newMaestro as any).id,
          sistema_codificacion: s.sistema_codificacion,
          codigo_servicio: s.codigo_servicio,
          descripcion_servicio: s.descripcion_servicio,
          valor: Math.round(s.valor * (1 + pct / 100) * 100) / 100,
          activo: true,
          metadata_regulatoria: s.metadata_regulatoria || {},
        }));
        const { error: errInsert } = await supabase
          .from("tarifarios_servicios" as any)
          .insert(newServices as any);
        if (errInsert) throw errInsert;
      }

      // 4. Deactivate old tarifario
      await supabase
        .from("tarifarios_maestros" as any)
        .update({ estado: false } as any)
        .eq("id", cloneTarget.id);

      toast.success("Tarifario duplicado y actualizado con éxito");
      setCloneDialogOpen(false);
      setCloneTarget(null);
      fetchTarifarios();
    } catch (err: any) {
      toast.error("Error: " + (err.message || "No se pudo clonar"));
    } finally {
      setCloning(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-full w-full overflow-hidden">
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Tarifarios</h1>
                <p className="text-sm text-muted-foreground">
                  Gestiona listas de precios por codificación internacional
                </p>
              </div>
            </div>
            <Button onClick={openNewDialog} className="rounded-xl gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Tarifario
            </Button>
          </div>

          <div className="relative mt-4 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o moneda..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTarifarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <DollarSign className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-lg font-medium text-muted-foreground">
                {search ? "Sin resultados" : "Sin tarifarios registrados"}
              </p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                {search ? "Intenta con otro término" : "Crea tu primer tarifario con el botón superior"}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border/40 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Nombre</TableHead>
                    <TableHead>Moneda</TableHead>
                    <TableHead>Servicios</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTarifarios.map((t) => (
                    <TableRow
                      key={t.id}
                      className="group cursor-pointer hover:bg-muted/40"
                      onClick={() => openDetailSheet(t)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{t.nombre}</p>
                          {t.descripcion && (
                            <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                              {t.descripcion}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {t.moneda}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {t.servicios_count || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {t.estado ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                          <span className="text-sm">{t.estado ? "Activo" : "Inactivo"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(t.created_at), "dd MMM yyyy", { locale: es })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(t); }}>
                              <Pencil className="w-3.5 h-3.5 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleEstado(t); }}>
                              {t.estado ? "Desactivar" : "Activar"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openCloneDialog(t); }}>
                              <Copy className="w-3.5 h-3.5 mr-2" />
                              Actualizar Tarifario (Clonar)
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Dialog for create/edit tarifario maestro */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetMasterForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              {editingTarifario ? "Editar Tarifario" : "Nuevo Tarifario"}
            </DialogTitle>
            <DialogDescription>
              {editingTarifario ? "Modifica los datos del tarifario" : "Define nombre, descripción y moneda"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nombre *</Label>
              <Input
                placeholder="Ej: Tarifa Particular 2026"
                value={masterForm.nombre}
                onChange={(e) => setMasterForm({ ...masterForm, nombre: e.target.value })}
                className="mt-1.5 rounded-xl"
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                placeholder="Descripción opcional..."
                value={masterForm.descripcion}
                onChange={(e) => setMasterForm({ ...masterForm, descripcion: e.target.value })}
                rows={2}
                className="mt-1.5 rounded-xl resize-none"
              />
            </div>
            <div>
              <Label>Moneda (ISO 4217) *</Label>
              <Select value={masterForm.moneda} onValueChange={(v) => setMasterForm({ ...masterForm, moneda: v })}>
                <SelectTrigger className="mt-1.5 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONEDAS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleSaveMaster} disabled={saving || !masterForm.nombre.trim()} className="rounded-xl">
              {saving && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
              {editingTarifario ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sheet for services detail */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) setSelectedTarifario(null); }}>
        <SheetContent className="w-full sm:max-w-2xl flex flex-col overflow-hidden">
          <SheetHeader className="shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              {selectedTarifario?.nombre}
            </SheetTitle>
            <SheetDescription>
              {selectedTarifario?.descripcion || "Servicios del tarifario"} · {selectedTarifario?.moneda}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col flex-1 min-h-0 mt-4 gap-4">
            {/* Add service form */}
            <div className="shrink-0 p-4 rounded-xl border border-border/40 bg-muted/20 space-y-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <ListPlus className="w-4 h-4 text-primary" />
                Agregar servicio
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">País de la clínica</Label>
                  <Select value={paisClinica} onValueChange={(v) => { setPaisClinica(v); setRegulatoryForm({}); }}>
                    <SelectTrigger className="mt-1 rounded-xl h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REGULATORY_COUNTRIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Sistema de codificación</Label>
                  <Select
                    value={servicioForm.sistema_codificacion}
                    onValueChange={(v) => setServicioForm({ ...servicioForm, sistema_codificacion: v })}
                  >
                    <SelectTrigger className="mt-1 rounded-xl h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SISTEMAS_CODIFICACION.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Código *</Label>
                  <Input
                    placeholder="Ej: 890201"
                    value={servicioForm.codigo_servicio}
                    onChange={(e) => setServicioForm({ ...servicioForm, codigo_servicio: e.target.value })}
                    className="mt-1 rounded-xl h-9 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs">Descripción *</Label>
                  <Input
                    placeholder="Ej: Consulta medicina general"
                    value={servicioForm.descripcion_servicio}
                    onChange={(e) => setServicioForm({ ...servicioForm, descripcion_servicio: e.target.value })}
                    className="mt-1 rounded-xl h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Valor *</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={servicioForm.valor}
                    onChange={(e) => setServicioForm({ ...servicioForm, valor: e.target.value })}
                    className="mt-1 rounded-xl h-9 text-sm"
                  />
                </div>
              </div>

              {/* Dynamic regulatory fields */}
              {currentRegulatoryConfig.fields.length > 0 && (
                <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                  <p className="text-xs font-medium text-primary flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    {currentRegulatoryConfig.label}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {currentRegulatoryConfig.fields.map((field) => (
                      <div key={field.key}>
                        <Label className="text-xs">
                          {field.label} {field.required && "*"}
                        </Label>
                        {field.type === "select" && field.options ? (
                          <Select
                            value={regulatoryForm[field.key] || ""}
                            onValueChange={(v) => setRegulatoryForm({ ...regulatoryForm, [field.key]: v })}
                          >
                            <SelectTrigger className="mt-1 rounded-xl h-9 text-sm">
                              <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder={field.placeholder || ""}
                            value={regulatoryForm[field.key] || ""}
                            onChange={(e) => setRegulatoryForm({ ...regulatoryForm, [field.key]: e.target.value })}
                            className="mt-1 rounded-xl h-9 text-sm"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Button
                size="sm"
                onClick={handleAddServicio}
                disabled={addingServicio || !servicioForm.codigo_servicio.trim() || !servicioForm.descripcion_servicio.trim()}
                className="rounded-xl w-full"
              >
                {addingServicio ? <Loader2 className="mr-2 w-3 h-3 animate-spin" /> : <Plus className="mr-2 w-3 h-3" />}
                Agregar
              </Button>
            </div>

            {/* Search servicios */}
            <div className="shrink-0 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar servicio..."
                value={searchServicios}
                onChange={(e) => setSearchServicios(e.target.value)}
                className="pl-9 rounded-xl h-9 text-sm"
              />
            </div>

            {/* Services table */}
            <div className="flex-1 overflow-y-auto min-h-0 rounded-xl border border-border/40">
              {loadingServicios ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredServicios.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <FileText className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {searchServicios ? "Sin resultados" : "Sin servicios aún"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs">Sistema</TableHead>
                      <TableHead className="text-xs">Código</TableHead>
                      <TableHead className="text-xs">Descripción</TableHead>
                      <TableHead className="text-xs text-right">Valor</TableHead>
                      <TableHead className="text-xs text-center">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServicios.map((s) => (
                      <TableRow key={s.id} className={cn(!s.activo && "opacity-50")}>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {s.sistema_codificacion}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-mono">{s.codigo_servicio}</TableCell>
                        <TableCell className="text-sm">{s.descripcion_servicio}</TableCell>
                        <TableCell className="text-sm text-right font-medium">
                          {formatCurrency(s.valor, selectedTarifario?.moneda || "COP")}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn("h-7 text-xs rounded-lg", s.activo ? "text-emerald-600" : "text-muted-foreground")}
                            onClick={() => handleToggleServicio(s)}
                          >
                            {s.activo ? (
                              <><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Activo</>
                            ) : (
                              <><XCircle className="w-3.5 h-3.5 mr-1" /> Inactivo</>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Clone dialog */}
      <Dialog open={cloneDialogOpen} onOpenChange={(open) => { setCloneDialogOpen(open); if (!open) setCloneTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Actualizar Tarifario (Clonar)
            </DialogTitle>
            <DialogDescription>
              Duplica "{cloneTarget?.nombre}" con un ajuste porcentual en todos los precios
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nombre del nuevo tarifario *</Label>
              <Input
                placeholder="Ej: Tarifario CUPS 2027"
                value={cloneForm.nombre}
                onChange={(e) => setCloneForm({ ...cloneForm, nombre: e.target.value })}
                className="mt-1.5 rounded-xl"
              />
            </div>
            <div>
              <Label>Porcentaje de incremento (%) *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ej: 12.5"
                value={cloneForm.porcentaje}
                onChange={(e) => setCloneForm({ ...cloneForm, porcentaje: e.target.value })}
                className="mt-1.5 rounded-xl"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Usa valores negativos para descuentos. Ej: -5 para reducir un 5%.
              </p>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                El tarifario actual pasará a estado <strong>Inactivo</strong> para nuevas asignaciones, pero conservará su historial para facturas pasadas.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloneDialogOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={handleClone}
              disabled={cloning || !cloneForm.nombre.trim() || !cloneForm.porcentaje}
              className="rounded-xl gap-2"
            >
              {cloning && <Loader2 className="w-4 h-4 animate-spin" />}
              <Copy className="w-4 h-4" />
              Clonar y Actualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default PriceLists;
