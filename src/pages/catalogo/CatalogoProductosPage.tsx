import React, { useState, useCallback, useMemo } from "react";
import { Layout } from "@/components/layout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Plus, Search, Loader2, Pencil, Trash2, MoreHorizontal,
  Pill, Package, Cpu, Snowflake, ShieldAlert, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────
type TipoProducto = "medicamento" | "insumo" | "dispositivo_medico";

const TIPO_LABELS: Record<TipoProducto, string> = {
  medicamento: "Medicamento",
  insumo: "Insumo",
  dispositivo_medico: "Dispositivo médico",
};

const TIPO_ICONS: Record<TipoProducto, React.ReactNode> = {
  medicamento: <Pill className="h-3 w-3" />,
  insumo: <Package className="h-3 w-3" />,
  dispositivo_medico: <Cpu className="h-3 w-3" />,
};

const FHIR_MAP: Record<TipoProducto, string> = {
  medicamento: "Medication",
  insumo: "Supply",
  dispositivo_medico: "Device",
};

const FORMAS_FARMACEUTICAS = [
  "tableta", "cápsula", "jarabe", "ampolla", "crema",
  "gel", "solución", "suspensión", "parche", "dispositivo", "unidad",
];

const VIAS_ADMIN = [
  "oral", "IV", "IM", "tópica", "SC", "inhalada",
  "rectal", "oftálmica", "ótica", "nasal",
];

const UNIDADES_MEDIDA = ["mg", "ml", "g", "mcg", "UI", "unidad", "pieza"];

const PAISES_REG = [
  { value: "CO", label: "🇨🇴 Colombia", entidad: "INVIMA" },
  { value: "MX", label: "🇲🇽 México", entidad: "COFEPRIS" },
  { value: "EC", label: "🇪🇨 Ecuador", entidad: "ARCSA" },
  { value: "PE", label: "🇵🇪 Perú", entidad: "DIGEMID" },
  { value: "AR", label: "🇦🇷 Argentina", entidad: "ANMAT" },
];

// ── Zod Schemas ────────────────────────────────────────
const presentacionSchema = z.object({
  id: z.string().optional(),
  forma_farmaceutica: z.string().min(1, "Requerido"),
  concentracion: z.string().optional().default(""),
  unidad_medida: z.string().min(1, "Requerido"),
  via_administracion: z.string().optional().default(""),
  codigo_barras: z.string().optional().default(""),
  presentacion_comercial: z.string().optional().default(""),
});

const productoSchema = z.object({
  codigo: z.string().trim().min(1, "Código requerido").max(50),
  nombre_generico: z.string().trim().min(1, "Nombre requerido").max(200),
  nombre_comercial: z.string().trim().max(200).optional().default(""),
  tipo_producto: z.enum(["medicamento", "insumo", "dispositivo_medico"]),
  principio_activo: z.string().trim().max(200).optional().default(""),
  codigo_atc: z.string().trim().max(20).optional().default(""),
  codigo_snomed: z.string().trim().max(30).optional().default(""),
  fabricante: z.string().trim().max(200).optional().default(""),
  requiere_cadena_frio: z.boolean().default(false),
  controlado: z.boolean().default(false),
  activo: z.boolean().default(true),
  presentaciones: z.array(presentacionSchema).default([]),
  // Regulatorio
  reg_pais: z.string().optional().default(""),
  reg_registro_sanitario: z.string().trim().max(100).optional().default(""),
  reg_entidad_regulatoria: z.string().trim().max(100).optional().default(""),
  reg_estado_registro: z.string().optional().default("vigente"),
  reg_fecha_vencimiento: z.string().optional().default(""),
  reg_datos: z.record(z.any()).optional().default({}),
});

type ProductoForm = z.infer<typeof productoSchema>;

// ── Component ──────────────────────────────────────────
const CatalogoProductosPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("general");

  // Debounce search
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>();
  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 300);
  }, []);

  // Form
  const form = useForm<ProductoForm>({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      codigo: "", nombre_generico: "", nombre_comercial: "",
      tipo_producto: "medicamento", principio_activo: "",
      codigo_atc: "", codigo_snomed: "", fabricante: "",
      requiere_cadena_frio: false, controlado: false, activo: true,
      presentaciones: [], reg_pais: "", reg_registro_sanitario: "",
      reg_entidad_regulatoria: "", reg_estado_registro: "vigente",
      reg_fecha_vencimiento: "", reg_datos: {},
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "presentaciones",
  });

  const tipoProducto = form.watch("tipo_producto");
  const regPais = form.watch("reg_pais");

  // ── Queries ────────────────────────────────────────
  const { data: productos = [], isLoading } = useQuery({
    queryKey: ["catalogo_productos", debouncedSearch, filterTipo],
    queryFn: async () => {
      let q = supabase.from("catalogo_productos").select("*").order("nombre_generico");
      if (debouncedSearch) {
        q = q.or(`nombre_generico.ilike.%${debouncedSearch}%,codigo.ilike.%${debouncedSearch}%,nombre_comercial.ilike.%${debouncedSearch}%`);
      }
      if (filterTipo !== "all") {
        q = q.eq("tipo_producto", filterTipo);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  // ── Mutations ──────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (values: ProductoForm) => {
      const productData = {
        codigo: values.codigo,
        nombre_generico: values.nombre_generico,
        nombre_comercial: values.nombre_comercial || null,
        tipo_producto: values.tipo_producto,
        principio_activo: values.tipo_producto === "medicamento" ? (values.principio_activo || null) : null,
        codigo_atc: values.tipo_producto === "medicamento" ? (values.codigo_atc || null) : null,
        codigo_snomed: values.codigo_snomed || null,
        fhir_resource_type: FHIR_MAP[values.tipo_producto],
        fabricante: values.fabricante || null,
        requiere_cadena_frio: values.requiere_cadena_frio,
        controlado: values.controlado,
        activo: values.activo,
      };

      let productoId = editingId;

      if (editingId) {
        const { error } = await supabase.from("catalogo_productos").update(productData).eq("id", editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("catalogo_productos").insert(productData).select("id").single();
        if (error) throw error;
        productoId = data.id;
      }

      // Save presentaciones
      if (productoId) {
        // Delete existing then re-insert
        await supabase.from("presentaciones_producto").delete().eq("producto_id", productoId);
        if (values.presentaciones.length > 0) {
          const presRows = values.presentaciones.map((p) => ({
            producto_id: productoId!,
            forma_farmaceutica: p.forma_farmaceutica,
            concentracion: p.concentracion || null,
            unidad_medida: p.unidad_medida,
            via_administracion: p.via_administracion || null,
            codigo_barras: p.codigo_barras || null,
            presentacion_comercial: p.presentacion_comercial || null,
          }));
          const { error: pe } = await supabase.from("presentaciones_producto").insert(presRows);
          if (pe) throw pe;
        }

        // Save regulatorio
        if (values.reg_pais) {
          // Delete existing for this product
          await supabase.from("catalogo_productos_regulatorio" as any).delete().eq("producto_id", productoId);
          const regRow = {
            producto_id: productoId,
            pais: values.reg_pais,
            registro_sanitario: values.reg_registro_sanitario || null,
            entidad_regulatoria: values.reg_entidad_regulatoria || null,
            estado_registro: values.reg_estado_registro || "vigente",
            fecha_vencimiento_registro: values.reg_fecha_vencimiento || null,
            datos_regulatorios: values.reg_datos || {},
          };
          const { error: re } = await supabase.from("catalogo_productos_regulatorio" as any).insert(regRow);
          if (re) throw re;
        }
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Producto actualizado" : "Producto creado");
      queryClient.invalidateQueries({ queryKey: ["catalogo_productos"] });
      closeSheet();
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al guardar");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("catalogo_productos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Producto eliminado");
      queryClient.invalidateQueries({ queryKey: ["catalogo_productos"] });
    },
    onError: (err: any) => toast.error(err.message || "Error al eliminar"),
  });

  // ── Handlers ───────────────────────────────────────
  const openNew = () => {
    setEditingId(null);
    form.reset();
    setActiveTab("general");
    setSheetOpen(true);
  };

  const openEdit = async (product: any) => {
    setEditingId(product.id);
    setActiveTab("general");

    // Fetch presentaciones
    const { data: pres } = await supabase
      .from("presentaciones_producto")
      .select("*")
      .eq("producto_id", product.id);

    // Fetch regulatorio
    const { data: regs } = await supabase
      .from("catalogo_productos_regulatorio" as any)
      .select("*")
      .eq("producto_id", product.id);

    const reg = (regs as any)?.[0];

    form.reset({
      codigo: product.codigo,
      nombre_generico: product.nombre_generico,
      nombre_comercial: product.nombre_comercial || "",
      tipo_producto: product.tipo_producto,
      principio_activo: product.principio_activo || "",
      codigo_atc: product.codigo_atc || "",
      codigo_snomed: product.codigo_snomed || "",
      fabricante: product.fabricante || "",
      requiere_cadena_frio: product.requiere_cadena_frio ?? false,
      controlado: product.controlado ?? false,
      activo: product.activo ?? true,
      presentaciones: (pres || []).map((p: any) => ({
        id: p.id,
        forma_farmaceutica: p.forma_farmaceutica,
        concentracion: p.concentracion || "",
        unidad_medida: p.unidad_medida,
        via_administracion: p.via_administracion || "",
        codigo_barras: p.codigo_barras || "",
        presentacion_comercial: p.presentacion_comercial || "",
      })),
      reg_pais: reg?.pais || "",
      reg_registro_sanitario: reg?.registro_sanitario || "",
      reg_entidad_regulatoria: reg?.entidad_regulatoria || "",
      reg_estado_registro: reg?.estado_registro || "vigente",
      reg_fecha_vencimiento: reg?.fecha_vencimiento_registro || "",
      reg_datos: (reg?.datos_regulatorios as any) || {},
    });

    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditingId(null);
    form.reset();
  };

  const onSubmit = form.handleSubmit((v) => saveMutation.mutate(v));

  // Auto-set entidad from pais
  React.useEffect(() => {
    if (regPais) {
      const found = PAISES_REG.find((p) => p.value === regPais);
      if (found) form.setValue("reg_entidad_regulatoria", found.entidad);
    }
  }, [regPais]);

  // ── Render ─────────────────────────────────────────
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 md:p-6 space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Catálogo de Productos</h1>
            <p className="text-xs text-muted-foreground">
              Medicamentos, insumos y dispositivos médicos
            </p>
          </div>
          <Button size="sm" onClick={openNew} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Nuevo producto
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o código..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8 h-8 text-sm border-0 border-b rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-primary"
            />
          </div>
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-[180px] h-8 text-xs border-0 border-b rounded-none bg-transparent">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="medicamento">Medicamento</SelectItem>
              <SelectItem value="insumo">Insumo</SelectItem>
              <SelectItem value="dispositivo_medico">Dispositivo médico</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="text-[11px] font-medium text-muted-foreground">Código</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground">Nombre genérico</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground">Tipo</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground">Principio activo</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground">ATC</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground">Estado</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : productos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-sm text-muted-foreground">
                    No hay productos registrados
                  </TableCell>
                </TableRow>
              ) : (
                productos.map((p: any) => (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer hover:bg-muted/30 border-border/30 transition-colors"
                    onClick={() => openEdit(p)}
                  >
                    <TableCell className="text-xs font-mono text-muted-foreground">{p.codigo}</TableCell>
                    <TableCell className="text-sm font-medium">{p.nombre_generico}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-normal gap-1 border-border/60 text-muted-foreground"
                      >
                        {TIPO_ICONS[p.tipo_producto as TipoProducto]}
                        {TIPO_LABELS[p.tipo_producto as TipoProducto] || p.tipo_producto}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.principio_activo || "—"}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {p.codigo_atc || "—"}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px]",
                        p.activo ? "text-primary" : "text-muted-foreground"
                      )}>
                        <span className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          p.activo ? "bg-primary" : "bg-muted-foreground/40"
                        )} />
                        {p.activo ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(p)}>
                            <Pencil className="h-3.5 w-3.5 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteMutation.mutate(p.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Sheet */}
        <Sheet open={sheetOpen} onOpenChange={(o) => !o && closeSheet()}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader className="pb-4">
              <SheetTitle className="text-base">
                {editingId ? "Editar producto" : "Nuevo producto"}
              </SheetTitle>
              <SheetDescription className="text-xs">
                Complete la información del producto en cada pestaña.
              </SheetDescription>
            </SheetHeader>

            <form onSubmit={onSubmit} className="space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full h-8 bg-muted/50">
                  <TabsTrigger value="general" className="text-xs flex-1">General</TabsTrigger>
                  <TabsTrigger value="presentaciones" className="text-xs flex-1">Presentaciones</TabsTrigger>
                  <TabsTrigger value="regulatorio" className="text-xs flex-1">Regulatorio</TabsTrigger>
                </TabsList>

                {/* Tab: General */}
                <TabsContent value="general" className="space-y-3 mt-3">
                  <FieldInput label="Código *" error={form.formState.errors.codigo?.message}>
                    <Input {...form.register("codigo")} placeholder="Ej: MED-001" className="input-bottom" />
                  </FieldInput>
                  <FieldInput label="Nombre genérico *" error={form.formState.errors.nombre_generico?.message}>
                    <Input {...form.register("nombre_generico")} placeholder="Ej: Acetaminofén" className="input-bottom" />
                  </FieldInput>
                  <FieldInput label="Nombre comercial">
                    <Input {...form.register("nombre_comercial")} placeholder="Ej: Tylenol" className="input-bottom" />
                  </FieldInput>

                  <FieldInput label="Tipo de producto *">
                    <Controller
                      control={form.control}
                      name="tipo_producto"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="input-bottom">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="medicamento">Medicamento</SelectItem>
                            <SelectItem value="insumo">Insumo</SelectItem>
                            <SelectItem value="dispositivo_medico">Dispositivo médico</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FieldInput>

                  {tipoProducto === "medicamento" && (
                    <>
                      <FieldInput label="Principio activo">
                        <Input {...form.register("principio_activo")} placeholder="Ej: Paracetamol" className="input-bottom" />
                      </FieldInput>
                      <FieldInput label="Código ATC">
                        <Input {...form.register("codigo_atc")} placeholder="Ej: N02BE01" className="input-bottom" />
                      </FieldInput>
                    </>
                  )}

                  <FieldInput label="Código SNOMED">
                    <Input {...form.register("codigo_snomed")} placeholder="Código SNOMED" className="input-bottom" />
                  </FieldInput>
                  <FieldInput label="Fabricante">
                    <Input {...form.register("fabricante")} placeholder="Laboratorio" className="input-bottom" />
                  </FieldInput>

                  <div className="flex items-center gap-6 pt-2">
                    <Controller
                      control={form.control}
                      name="requiere_cadena_frio"
                      render={({ field }) => (
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <Switch checked={field.value} onCheckedChange={field.onChange} className="scale-75" />
                          <Snowflake className="h-3 w-3 text-blue-500" /> Cadena de frío
                        </label>
                      )}
                    />
                    <Controller
                      control={form.control}
                      name="controlado"
                      render={({ field }) => (
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <Switch checked={field.value} onCheckedChange={field.onChange} className="scale-75" />
                          <ShieldAlert className="h-3 w-3 text-amber-500" /> Controlado
                        </label>
                      )}
                    />
                    <Controller
                      control={form.control}
                      name="activo"
                      render={({ field }) => (
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <Switch checked={field.value} onCheckedChange={field.onChange} className="scale-75" />
                          Activo
                        </label>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Tab: Presentaciones */}
                <TabsContent value="presentaciones" className="space-y-3 mt-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Formas farmacéuticas y concentraciones</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => append({
                        forma_farmaceutica: "", concentracion: "", unidad_medida: "mg",
                        via_administracion: "", codigo_barras: "", presentacion_comercial: "",
                      })}
                    >
                      <Plus className="h-3 w-3" /> Agregar
                    </Button>
                  </div>

                  {fields.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-8">
                      Sin presentaciones. Haz clic en "Agregar" para crear una.
                    </p>
                  )}

                  {fields.map((field, idx) => (
                    <div key={field.id} className="p-3 rounded-lg border border-border/40 bg-muted/20 space-y-2 relative">
                      <button
                        type="button"
                        onClick={() => remove(idx)}
                        className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <FieldInput label="Forma farmacéutica *" compact>
                          <Controller
                            control={form.control}
                            name={`presentaciones.${idx}.forma_farmaceutica`}
                            render={({ field: f }) => (
                              <Select value={f.value} onValueChange={f.onChange}>
                                <SelectTrigger className="input-bottom text-xs h-7">
                                  <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent>
                                  {FORMAS_FARMACEUTICAS.map((ff) => (
                                    <SelectItem key={ff} value={ff}>{ff}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </FieldInput>
                        <FieldInput label="Concentración" compact>
                          <Input {...form.register(`presentaciones.${idx}.concentracion`)} placeholder="500mg" className="input-bottom text-xs h-7" />
                        </FieldInput>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <FieldInput label="Unidad medida *" compact>
                          <Controller
                            control={form.control}
                            name={`presentaciones.${idx}.unidad_medida`}
                            render={({ field: f }) => (
                              <Select value={f.value} onValueChange={f.onChange}>
                                <SelectTrigger className="input-bottom text-xs h-7">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {UNIDADES_MEDIDA.map((u) => (
                                    <SelectItem key={u} value={u}>{u}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </FieldInput>
                        <FieldInput label="Vía administración" compact>
                          <Controller
                            control={form.control}
                            name={`presentaciones.${idx}.via_administracion`}
                            render={({ field: f }) => (
                              <Select value={f.value || ""} onValueChange={f.onChange}>
                                <SelectTrigger className="input-bottom text-xs h-7">
                                  <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent>
                                  {VIAS_ADMIN.map((v) => (
                                    <SelectItem key={v} value={v}>{v}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </FieldInput>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <FieldInput label="Código barras" compact>
                          <Input {...form.register(`presentaciones.${idx}.codigo_barras`)} placeholder="EAN/UPC" className="input-bottom text-xs h-7" />
                        </FieldInput>
                        <FieldInput label="Presentación comercial" compact>
                          <Input {...form.register(`presentaciones.${idx}.presentacion_comercial`)} placeholder="Caja x 30" className="input-bottom text-xs h-7" />
                        </FieldInput>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                {/* Tab: Regulatorio */}
                <TabsContent value="regulatorio" className="space-y-3 mt-3">
                  <FieldInput label="País">
                    <Controller
                      control={form.control}
                      name="reg_pais"
                      render={({ field }) => (
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <SelectTrigger className="input-bottom">
                            <SelectValue placeholder="Seleccionar país" />
                          </SelectTrigger>
                          <SelectContent>
                            {PAISES_REG.map((p) => (
                              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FieldInput>

                  {regPais && (
                    <>
                      <FieldInput label="Entidad regulatoria">
                        <Input {...form.register("reg_entidad_regulatoria")} className="input-bottom" readOnly />
                      </FieldInput>
                      <FieldInput label="Registro sanitario">
                        <Input {...form.register("reg_registro_sanitario")} placeholder="Número de registro" className="input-bottom" />
                      </FieldInput>
                      <FieldInput label="Estado del registro">
                        <Controller
                          control={form.control}
                          name="reg_estado_registro"
                          render={({ field }) => (
                            <Select value={field.value || "vigente"} onValueChange={field.onChange}>
                              <SelectTrigger className="input-bottom">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="vigente">Vigente</SelectItem>
                                <SelectItem value="vencido">Vencido</SelectItem>
                                <SelectItem value="en_tramite">En trámite</SelectItem>
                                <SelectItem value="cancelado">Cancelado</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </FieldInput>
                      <FieldInput label="Fecha vencimiento registro">
                        <Input type="date" {...form.register("reg_fecha_vencimiento")} className="input-bottom" />
                      </FieldInput>

                      {/* Country-specific fields */}
                      {regPais === "CO" && (
                        <>
                          <FieldInput label="CUM (Código Único de Medicamentos)">
                            <Input
                              value={(form.watch("reg_datos") as any)?.cum || ""}
                              onChange={(e) => form.setValue("reg_datos", { ...form.watch("reg_datos"), cum: e.target.value })}
                              placeholder="123456"
                              className="input-bottom"
                            />
                          </FieldInput>
                          <FieldInput label="Expediente INVIMA">
                            <Input
                              value={(form.watch("reg_datos") as any)?.expediente_invima || ""}
                              onChange={(e) => form.setValue("reg_datos", { ...form.watch("reg_datos"), expediente_invima: e.target.value })}
                              placeholder="SD2024-001"
                              className="input-bottom"
                            />
                          </FieldInput>
                        </>
                      )}
                      {regPais === "MX" && (
                        <FieldInput label="Clave COFEPRIS">
                          <Input
                            value={(form.watch("reg_datos") as any)?.clave_cofepris || ""}
                            onChange={(e) => form.setValue("reg_datos", { ...form.watch("reg_datos"), clave_cofepris: e.target.value })}
                            placeholder="010.000.5267.00"
                            className="input-bottom"
                          />
                        </FieldInput>
                      )}
                      {regPais === "EC" && (
                        <FieldInput label="Notificación sanitaria ARCSA">
                          <Input
                            value={(form.watch("reg_datos") as any)?.numero_notificacion_arcsa || ""}
                            onChange={(e) => form.setValue("reg_datos", { ...form.watch("reg_datos"), numero_notificacion_arcsa: e.target.value })}
                            placeholder="NSA-EC-2024-001"
                            className="input-bottom"
                          />
                        </FieldInput>
                      )}
                      {regPais === "PE" && (
                        <FieldInput label="Registro sanitario DIGEMID">
                          <Input
                            value={(form.watch("reg_datos") as any)?.registro_digemid || ""}
                            onChange={(e) => form.setValue("reg_datos", { ...form.watch("reg_datos"), registro_digemid: e.target.value })}
                            placeholder="N-12345"
                            className="input-bottom"
                          />
                        </FieldInput>
                      )}
                      {regPais === "AR" && (
                        <FieldInput label="Certificado ANMAT">
                          <Input
                            value={(form.watch("reg_datos") as any)?.certificado_anmat || ""}
                            onChange={(e) => form.setValue("reg_datos", { ...form.watch("reg_datos"), certificado_anmat: e.target.value })}
                            placeholder="PM-1234-5"
                            className="input-bottom"
                          />
                        </FieldInput>
                      )}
                    </>
                  )}

                  {!regPais && (
                    <p className="text-xs text-muted-foreground text-center py-8">
                      Seleccione un país para ver los campos regulatorios.
                    </p>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                <Button type="button" variant="ghost" size="sm" onClick={closeSheet} className="text-xs">
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={saveMutation.isPending} className="text-xs gap-1.5">
                  {saveMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  {editingId ? "Guardar cambios" : "Crear producto"}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </motion.div>
    </Layout>
  );
};

// ── Helper: FieldInput ───────────────────────────────
const FieldInput = ({
  label,
  error,
  children,
  compact,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  compact?: boolean;
}) => (
  <div className={compact ? "space-y-0.5" : "space-y-1"}>
    <Label className={cn("text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>{label}</Label>
    {children}
    {error && <p className="text-[10px] text-destructive">{error}</p>}
  </div>
);

export default CatalogoProductosPage;
