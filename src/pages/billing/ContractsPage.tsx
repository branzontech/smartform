import React, { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  FileText,
  Plus,
  Search,
  Building2,
  Calendar,
  MoreHorizontal,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Handshake,
  Pencil,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Types
interface Pagador {
  id: string;
  nombre: string;
  tipo_identificacion: string | null;
  numero_identificacion: string | null;
  pais: string;
  es_particular: boolean;
  activo: boolean;
}

interface Contrato {
  id: string;
  pagador_id: string;
  nombre_convenio: string;
  tipo_contratacion: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: string;
  reglas_facturacion: Record<string, any>;
  notas: string | null;
  tarifario_id: string | null;
  created_at: string;
  pagador?: Pagador;
}

interface TarifarioMaestro {
  id: string;
  nombre: string;
  moneda: string;
  estado: boolean;
}

const TIPO_CONTRATACION_LABELS: Record<string, { label: string; color: string }> = {
  evento: { label: "Por Evento", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  capita: { label: "Capitación", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  paquete: { label: "Paquete", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  particular: { label: "Particular", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
};

const ESTADO_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  activo: { label: "Activo", icon: CheckCircle2 },
  inactivo: { label: "Inactivo", icon: XCircle },
  vencido: { label: "Vencido", icon: Clock },
};

const PAISES = [
  { value: "CO", label: "🇨🇴 Colombia" },
  { value: "MX", label: "🇲🇽 México" },
  { value: "EC", label: "🇪🇨 Ecuador" },
  { value: "PE", label: "🇵🇪 Perú" },
  { value: "CL", label: "🇨🇱 Chile" },
  { value: "AR", label: "🇦🇷 Argentina" },
  { value: "BO", label: "🇧🇴 Bolivia" },
  { value: "VE", label: "🇻🇪 Venezuela" },
];

const ContractsPage: React.FC = () => {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [pagadores, setPagadores] = useState<Pagador[]>([]);
  const [tarifarios, setTarifarios] = useState<TarifarioMaestro[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sheetStep, setSheetStep] = useState<"pagador" | "contrato">("pagador");
  const [selectedPagadorId, setSelectedPagadorId] = useState<string | null>(null);
  const [isNewPagador, setIsNewPagador] = useState(true);
  const [editingContrato, setEditingContrato] = useState<Contrato | null>(null);

  // Form state
  const [pagadorForm, setPagadorForm] = useState({
    nombre: "",
    tipo_identificacion: "NIT",
    numero_identificacion: "",
    pais: "CO",
  });
  const [contratoForm, setContratoForm] = useState({
    nombre_convenio: "",
    tipo_contratacion: "evento" as string,
    fecha_inicio: new Date().toISOString().split("T")[0],
    fecha_fin: "",
    estado: "activo",
    notas: "",
    tarifario_id: "" as string,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [contratosRes, pagadoresRes, tarifariosRes] = await Promise.all([
      supabase
        .from("contratos")
        .select("*, pagador:pagadores(*)")
        .order("created_at", { ascending: false }),
      supabase.from("pagadores").select("*").eq("activo", true).order("nombre"),
      supabase.from("tarifarios_maestros" as any).select("id, nombre, moneda, estado").eq("estado", true).order("nombre"),
    ]);

    if (contratosRes.data) {
      setContratos(
        (contratosRes.data as any[]).map((c) => ({
          ...c,
          pagador: c.pagador || undefined,
        }))
      );
    }
    if (pagadoresRes.data) setPagadores(pagadoresRes.data as Pagador[]);
    if (tarifariosRes.data) setTarifarios(tarifariosRes.data as unknown as TarifarioMaestro[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredContratos = contratos.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.nombre_convenio.toLowerCase().includes(q) ||
      c.pagador?.nombre?.toLowerCase().includes(q) ||
      c.tipo_contratacion.toLowerCase().includes(q)
    );
  });

  const resetForm = () => {
    setPagadorForm({ nombre: "", tipo_identificacion: "NIT", numero_identificacion: "", pais: "CO" });
    setContratoForm({
      nombre_convenio: "",
      tipo_contratacion: "evento",
      fecha_inicio: new Date().toISOString().split("T")[0],
      fecha_fin: "",
      estado: "activo",
      notas: "",
      tarifario_id: "",
    });
    setSelectedPagadorId(null);
    setIsNewPagador(true);
    setEditingContrato(null);
  };

  const openNewSheet = () => {
    resetForm();
    setSheetStep("pagador");
    setSheetOpen(true);
  };

  const openEditSheet = (contrato: Contrato) => {
    setEditingContrato(contrato);
    setSelectedPagadorId(contrato.pagador_id);
    setIsNewPagador(false);

    // Pre-fill pagador form from the contrato's pagador
    if (contrato.pagador) {
      setPagadorForm({
        nombre: contrato.pagador.nombre,
        tipo_identificacion: contrato.pagador.tipo_identificacion || "NIT",
        numero_identificacion: contrato.pagador.numero_identificacion || "",
        pais: contrato.pagador.pais,
      });
    }

    // Pre-fill contrato form
    setContratoForm({
      nombre_convenio: contrato.nombre_convenio,
      tipo_contratacion: contrato.tipo_contratacion,
      fecha_inicio: contrato.fecha_inicio,
      fecha_fin: contrato.fecha_fin || "",
      estado: contrato.estado,
      notas: contrato.notas || "",
      tarifario_id: contrato.tarifario_id || "",
    });

    setSheetStep("contrato");
    setSheetOpen(true);
  };

  const handleSelectExistingPagador = (id: string) => {
    setSelectedPagadorId(id);
    setIsNewPagador(false);
    const p = pagadores.find((p) => p.id === id);
    if (p) {
      setContratoForm((prev) => ({
        ...prev,
        nombre_convenio: prev.nombre_convenio || `Convenio - ${p.nombre}`,
      }));
    }
    setSheetStep("contrato");
  };

  const handlePagadorNext = () => {
    if (!pagadorForm.nombre.trim()) {
      toast.error("El nombre del pagador es obligatorio");
      return;
    }
    setSheetStep("contrato");
    setContratoForm((prev) => ({
      ...prev,
      nombre_convenio: prev.nombre_convenio || `Convenio - ${pagadorForm.nombre}`,
    }));
  };

  const handleSave = async () => {
    if (!contratoForm.nombre_convenio.trim()) {
      toast.error("El nombre del convenio es obligatorio");
      return;
    }

    setSaving(true);
    try {
      let pagadorId = selectedPagadorId;

      if (isNewPagador) {
        const { data, error } = await supabase
          .from("pagadores")
          .insert({
            nombre: pagadorForm.nombre,
            tipo_identificacion: pagadorForm.tipo_identificacion || null,
            numero_identificacion: pagadorForm.numero_identificacion || null,
            pais: pagadorForm.pais,
          })
          .select("id")
          .single();

        if (error) throw error;
        pagadorId = data.id;
      }

      if (editingContrato) {
        // Update existing
        const { error: contratoError } = await supabase
          .from("contratos")
          .update({
            pagador_id: pagadorId!,
            nombre_convenio: contratoForm.nombre_convenio,
            tipo_contratacion: contratoForm.tipo_contratacion as any,
            fecha_inicio: contratoForm.fecha_inicio,
            fecha_fin: contratoForm.fecha_fin || null,
            estado: contratoForm.estado,
            notas: contratoForm.notas || null,
            tarifario_id: contratoForm.tarifario_id || null,
          } as any)
          .eq("id", editingContrato.id);

        if (contratoError) throw contratoError;
        toast.success("Convenio actualizado exitosamente");
      } else {
        // Create new
        const { error: contratoError } = await supabase.from("contratos").insert({
          pagador_id: pagadorId!,
          nombre_convenio: contratoForm.nombre_convenio,
          tipo_contratacion: contratoForm.tipo_contratacion as any,
          fecha_inicio: contratoForm.fecha_inicio,
          fecha_fin: contratoForm.fecha_fin || null,
          estado: contratoForm.estado,
          notas: contratoForm.notas || null,
          tarifario_id: contratoForm.tarifario_id || null,
        } as any);

        if (contratoError) throw contratoError;
        toast.success("Convenio creado exitosamente");
      }

      setSheetOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error("Error al guardar: " + (err.message || ""));
    } finally {
      setSaving(false);
    }
  };

  const toggleEstado = async (contrato: Contrato) => {
    const newEstado = contrato.estado === "activo" ? "inactivo" : "activo";
    const { error } = await supabase
      .from("contratos")
      .update({ estado: newEstado })
      .eq("id", contrato.id);

    if (error) {
      toast.error("Error al actualizar estado");
    } else {
      toast.success(`Convenio ${newEstado === "activo" ? "activado" : "desactivado"}`);
      fetchData();
    }
  };

  const isEditing = !!editingContrato;

  return (
    <Layout>
      <div className="flex flex-col h-full w-full overflow-hidden">
        {/* Header - shrink-0 */}
        <div className="shrink-0 px-6 py-4 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Handshake className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Convenios y Contratos</h1>
                <p className="text-sm text-muted-foreground">
                  Gestiona pagadores, EPS, aseguradoras y convenios
                </p>
              </div>
            </div>
            <Button onClick={openNewSheet} className="rounded-xl gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Convenio
            </Button>
          </div>

          {/* Search */}
          <div className="relative mt-4 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, pagador o tipo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>
        </div>

        {/* Table area - flex-1 overflow */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredContratos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-lg font-medium text-muted-foreground">
                {search ? "Sin resultados" : "Sin convenios registrados"}
              </p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                {search
                  ? "Intenta con otro término de búsqueda"
                  : "Crea tu primer convenio con el botón superior"}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border/40 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Convenio</TableHead>
                    <TableHead>Pagador</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Vigencia</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContratos.map((contrato) => {
                    const tipo = TIPO_CONTRATACION_LABELS[contrato.tipo_contratacion] || {
                      label: contrato.tipo_contratacion,
                      color: "bg-muted text-muted-foreground",
                    };
                    const estado = ESTADO_LABELS[contrato.estado] || ESTADO_LABELS.activo;
                    const EstadoIcon = estado.icon;

                    return (
                      <TableRow
                        key={contrato.id}
                        className="group cursor-pointer hover:bg-muted/40"
                        onClick={() => openEditSheet(contrato)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{contrato.nombre_convenio}</p>
                              {contrato.notas && (
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {contrato.notas}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm">
                              {contrato.pagador?.nombre || "—"}
                            </span>
                            {contrato.pagador?.es_particular && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                Particular
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("text-xs", tipo.color)}
                          >
                            {tipo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(contrato.fecha_inicio), "dd MMM yyyy", {
                              locale: es,
                            })}
                            {contrato.fecha_fin && (
                              <>
                                <span>→</span>
                                {format(new Date(contrato.fecha_fin), "dd MMM yyyy", {
                                  locale: es,
                                })}
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <EstadoIcon
                              className={cn(
                                "w-3.5 h-3.5",
                                contrato.estado === "activo"
                                  ? "text-emerald-500"
                                  : contrato.estado === "vencido"
                                  ? "text-amber-500"
                                  : "text-muted-foreground"
                              )}
                            />
                            <span className="text-sm">{estado.label}</span>
                          </div>
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
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditSheet(contrato); }}>
                                <Pencil className="w-3.5 h-3.5 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleEstado(contrato); }}>
                                {contrato.estado === "activo" ? "Desactivar" : "Activar"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Sheet for creating/editing pagador + contrato */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) resetForm(); }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Handshake className="w-5 h-5 text-primary" />
              {isEditing ? "Editar Convenio" : "Nuevo Convenio"}
            </SheetTitle>
            <SheetDescription>
              {isEditing
                ? "Modifica los datos del convenio y guarda los cambios"
                : sheetStep === "pagador"
                ? "Paso 1: Selecciona o crea un pagador"
                : "Paso 2: Define los datos del convenio"}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Step indicator (only for new) */}
            {!isEditing && (
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    sheetStep === "pagador"
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/20 text-primary"
                  )}
                >
                  1
                </div>
                <div className="flex-1 h-0.5 bg-border rounded-full">
                  <div
                    className={cn(
                      "h-full bg-primary rounded-full transition-all",
                      sheetStep === "contrato" ? "w-full" : "w-0"
                    )}
                  />
                </div>
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    sheetStep === "contrato"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  2
                </div>
              </div>
            )}

            {sheetStep === "pagador" && !isEditing && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                {/* Existing pagadores */}
                {pagadores.filter((p) => !p.es_particular).length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                      Pagadores existentes
                    </Label>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {pagadores
                        .filter((p) => !p.es_particular)
                        .map((p) => (
                          <button
                            key={p.id}
                            onClick={() => handleSelectExistingPagador(p.id)}
                            className={cn(
                              "w-full text-left px-3 py-2.5 rounded-xl border transition-all",
                              selectedPagadorId === p.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/30"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{p.nombre}</span>
                              <span className="text-xs text-muted-foreground ml-auto">
                                {PAISES.find((pa) => pa.value === p.pais)?.label || p.pais}
                              </span>
                            </div>
                          </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3 py-2">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground">o crear nuevo</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  </div>
                )}

                {/* New pagador form */}
                <div className="space-y-4">
                  <div>
                    <Label>Nombre del pagador *</Label>
                    <Input
                      placeholder="Ej: Sura EPS, IMSS, Particular..."
                      value={pagadorForm.nombre}
                      onChange={(e) =>
                        setPagadorForm({ ...pagadorForm, nombre: e.target.value })
                      }
                      className="mt-1.5 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Tipo Identificación</Label>
                      <Select
                        value={pagadorForm.tipo_identificacion}
                        onValueChange={(v) =>
                          setPagadorForm({ ...pagadorForm, tipo_identificacion: v })
                        }
                      >
                        <SelectTrigger className="mt-1.5 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NIT">NIT</SelectItem>
                          <SelectItem value="RFC">RFC</SelectItem>
                          <SelectItem value="RUC">RUC</SelectItem>
                          <SelectItem value="RUT">RUT</SelectItem>
                          <SelectItem value="OTRO">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Número</Label>
                      <Input
                        placeholder="Número de identificación"
                        value={pagadorForm.numero_identificacion}
                        onChange={(e) =>
                          setPagadorForm({
                            ...pagadorForm,
                            numero_identificacion: e.target.value,
                          })
                        }
                        className="mt-1.5 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>País</Label>
                    <Select
                      value={pagadorForm.pais}
                      onValueChange={(v) =>
                        setPagadorForm({ ...pagadorForm, pais: v })
                      }
                    >
                      <SelectTrigger className="mt-1.5 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAISES.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handlePagadorNext}
                  className="w-full rounded-xl"
                  disabled={!pagadorForm.nombre.trim()}
                >
                  Continuar al convenio
                </Button>
              </motion.div>
            )}

            {sheetStep === "contrato" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                {!isEditing && (
                  <button
                    onClick={() => setSheetStep("pagador")}
                    className="text-sm text-primary hover:underline"
                  >
                    ← Volver al pagador
                  </button>
                )}

                {/* Show pagador info when editing */}
                {isEditing && editingContrato?.pagador && (
                  <div className="p-3 rounded-xl bg-muted/50 border border-border/40">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Pagador</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{editingContrato.pagador.nombre}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {PAISES.find((pa) => pa.value === editingContrato.pagador!.pais)?.label || editingContrato.pagador!.pais}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <Label>Nombre del convenio *</Label>
                  <Input
                    placeholder="Ej: Convenio Consulta General 2026"
                    value={contratoForm.nombre_convenio}
                    onChange={(e) =>
                      setContratoForm({ ...contratoForm, nombre_convenio: e.target.value })
                    }
                    className="mt-1.5 rounded-xl"
                  />
                </div>

                <div>
                  <Label>Tipo de contratación *</Label>
                  <Select
                    value={contratoForm.tipo_contratacion}
                    onValueChange={(v) =>
                      setContratoForm({ ...contratoForm, tipo_contratacion: v })
                    }
                  >
                    <SelectTrigger className="mt-1.5 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="evento">Por Evento</SelectItem>
                      <SelectItem value="capita">Capitación</SelectItem>
                      <SelectItem value="paquete">Paquete</SelectItem>
                      <SelectItem value="particular">Particular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Estado selector (only when editing) */}
                {isEditing && (
                  <div>
                    <Label>Estado</Label>
                    <Select
                      value={contratoForm.estado}
                      onValueChange={(v) =>
                        setContratoForm({ ...contratoForm, estado: v })
                      }
                    >
                      <SelectTrigger className="mt-1.5 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="inactivo">Inactivo</SelectItem>
                        <SelectItem value="vencido">Vencido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Fecha inicio *</Label>
                    <Input
                      type="date"
                      value={contratoForm.fecha_inicio}
                      onChange={(e) =>
                        setContratoForm({ ...contratoForm, fecha_inicio: e.target.value })
                      }
                      className="mt-1.5 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label>Fecha fin</Label>
                    <Input
                      type="date"
                      value={contratoForm.fecha_fin}
                      onChange={(e) =>
                        setContratoForm({ ...contratoForm, fecha_fin: e.target.value })
                      }
                      className="mt-1.5 rounded-xl"
                    />
                  </div>
                </div>

                {/* Tarifario selector */}
                <div>
                  <Label>Tarifario asociado</Label>
                  <Select
                    value={contratoForm.tarifario_id || "none"}
                    onValueChange={(v) =>
                      setContratoForm({ ...contratoForm, tarifario_id: v === "none" ? "" : v })
                    }
                  >
                    <SelectTrigger className="mt-1.5 rounded-xl">
                      <SelectValue placeholder="Sin tarifario" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin tarifario</SelectItem>
                      {tarifarios.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.nombre} ({t.moneda})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Notas</Label>
                  <Textarea
                    placeholder="Observaciones adicionales..."
                    value={contratoForm.notas}
                    onChange={(e) =>
                      setContratoForm({ ...contratoForm, notas: e.target.value })
                    }
                    rows={2}
                    className="mt-1.5 rounded-xl resize-none"
                  />
                </div>

                <Button
                  onClick={handleSave}
                  disabled={saving || !contratoForm.nombre_convenio.trim()}
                  className="w-full rounded-xl h-12"
                >
                  {saving ? (
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  ) : isEditing ? (
                    <Pencil className="mr-2 w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="mr-2 w-4 h-4" />
                  )}
                  {saving ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Convenio"}
                </Button>
              </motion.div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </Layout>
  );
};

export default ContractsPage;
