import React, { useState } from "react";
import { baseDatos } from "@/integrations/datos/cliente";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Loader2, Snowflake, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EncabezadoModulo } from "@/components/kit/EncabezadoModulo";
import { AccionesFila } from "@/components/kit/AccionesFila";
import {
  BarraTabla, CeldaEstado, TablaDatos, useTablaDatos,
  type ColumnaTabla, type FiltroTabla, type SegmentoTabla,
} from "@/components/kit/tabla";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────
type TipoProducto = "medicamento" | "insumo" | "dispositivo_medico";

const TIPO_LABELS: Record<TipoProducto, string> = {
  medicamento: "Medicamento",
  insumo: "Insumo",
  dispositivo_medico: "Dispositivo médico",
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

/** Fila de public.catalogo_productos con lo que usan la lista y el formulario. */
interface ProductoFila {
  id: string;
  codigo: string;
  nombre_generico: string;
  nombre_comercial: string | null;
  tipo_producto: TipoProducto;
  principio_activo: string | null;
  codigo_atc: string | null;
  codigo_snomed: string | null;
  fabricante: string | null;
  requiere_cadena_frio: boolean | null;
  controlado: boolean | null;
  activo: boolean | null;
}

const tipoTexto = (p: ProductoFila) => TIPO_LABELS[p.tipo_producto] ?? p.tipo_producto;
const siNo = (v: boolean | null) => (v ? "Sí" : "No");

/** Una celda, un dato, una línea. Lo demás está en la ficha del producto. */
const COLUMNAS: ColumnaTabla<ProductoFila>[] = [
  { id: "codigo", titulo: "Código", valor: (p) => p.codigo, className: "font-mono text-xs", fija: true },
  { id: "nombre", titulo: "Nombre genérico", valor: (p) => p.nombre_generico, principal: true, className: "min-w-[220px]" },
  { id: "comercial", titulo: "Nombre comercial", valor: (p) => p.nombre_comercial, oculta: true },
  { id: "tipo", titulo: "Tipo", valor: tipoTexto },
  { id: "principio", titulo: "Principio activo", valor: (p) => p.principio_activo },
  { id: "atc", titulo: "ATC", valor: (p) => p.codigo_atc, className: "font-mono text-xs" },
  { id: "fabricante", titulo: "Fabricante", valor: (p) => p.fabricante, oculta: true },
  { id: "frio", titulo: "Cadena de frío", valor: (p) => siNo(p.requiere_cadena_frio), oculta: true },
  { id: "controlado", titulo: "Controlado", valor: (p) => siNo(p.controlado), oculta: true },
  {
    id: "estado", titulo: "Estado", valor: (p) => (p.activo ? "Activo" : "Inactivo"), sinPadding: true, className: "w-28",
    celda: (p) => <CeldaEstado tono={p.activo ? "exito" : "neutro"} texto={p.activo ? "Activo" : "Inactivo"} />,
  },
];

const FILTROS: FiltroTabla<ProductoFila>[] = [
  { id: "tipo", titulo: "Tipo", valor: tipoTexto },
  { id: "fabricante", titulo: "Fabricante", valor: (p) => p.fabricante },
  { id: "frio", titulo: "Cadena de frío", valor: (p) => siNo(p.requiere_cadena_frio) },
  { id: "controlado", titulo: "Controlado", valor: (p) => siNo(p.controlado) },
];

const SEGMENTOS: SegmentoTabla<ProductoFila>[] = [
  { id: "activos", titulo: "Activos", cumple: (p) => !!p.activo },
  { id: "inactivos", titulo: "Inactivos", cumple: (p) => !p.activo },
  { id: "todos", titulo: "Todos", cumple: () => true },
];

const claveFila = (p: ProductoFila) => p.id;

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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("general");

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
  // Se carga el catálogo completo: búsqueda, filtros y segmentos se resuelven en el cliente (kit de tablas).
  const { data: productos = [], isLoading } = useQuery({
    queryKey: ["catalogo_productos"],
    queryFn: async () => {
      const { data, error } = await baseDatos.from("catalogo_productos").select("*").order("nombre_generico");
      if (error) throw error;
      return (data ?? []) as unknown as ProductoFila[];
    },
  });

  const t = useTablaDatos({ id: "catalogo.productos", filas: productos, columnas: COLUMNAS, claveFila, filtros: FILTROS, segmentos: SEGMENTOS });

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
        const { error } = await baseDatos.from("catalogo_productos").update(productData).eq("id", editingId);
        if (error) throw error;
      } else {
        const { data, error } = await baseDatos.from("catalogo_productos").insert(productData).select("id").single();
        if (error) throw error;
        productoId = data.id;
      }

      // Save presentaciones
      if (productoId) {
        // Delete existing then re-insert
        await baseDatos.from("presentaciones_producto").delete().eq("producto_id", productoId);
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
          const { error: pe } = await baseDatos.from("presentaciones_producto").insert(presRows);
          if (pe) throw pe;
        }

        // Save regulatorio
        if (values.reg_pais) {
          // Delete existing for this product
          await baseDatos.from("catalogo_productos_regulatorio" as any).delete().eq("producto_id", productoId);
          const regRow = {
            producto_id: productoId,
            pais: values.reg_pais,
            registro_sanitario: values.reg_registro_sanitario || null,
            entidad_regulatoria: values.reg_entidad_regulatoria || null,
            estado_registro: values.reg_estado_registro || "vigente",
            fecha_vencimiento_registro: values.reg_fecha_vencimiento || null,
            datos_regulatorios: values.reg_datos || {},
          };
          const { error: re } = await baseDatos.from("catalogo_productos_regulatorio" as any).insert(regRow);
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
      const { error } = await baseDatos.from("catalogo_productos").delete().eq("id", id);
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

  const openEdit = async (product: ProductoFila) => {
    setEditingId(product.id);
    setActiveTab("general");

    // Fetch presentaciones
    const { data: pres } = await baseDatos
      .from("presentaciones_producto")
      .select("*")
      .eq("producto_id", product.id);

    // Fetch regulatorio
    const { data: regs } = await baseDatos
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
  }, [regPais, form]);

  // ── Render ─────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl space-y-5 py-6">
      <EncabezadoModulo titulo="Catálogo de productos" primaria={{ titulo: "Nuevo producto", onClick: openNew }} />

      <TablaDatos
        t={t}
        cargando={isLoading}
        onFilaClick={(p) => void openEdit(p)}
        barra={<BarraTabla t={t} nombre={["producto", "productos"]} placeholder="Buscar por nombre, código o principio activo" nombreArchivo="catalogo-productos" />}
        acciones={(p) => (
          <AccionesFila
            nombre={p.nombre_generico}
            onVer={() => void openEdit(p)}
            onEliminar={() => deleteMutation.mutate(p.id)}
            confirmarEliminar={{
              titulo: "¿Eliminar este producto?",
              descripcion: `«${p.nombre_generico}» se eliminará del catálogo y no se podrá recuperar.`,
            }}
          />
        )}
        vacio="Aún no hay productos. Registra uno con «Nuevo producto»."
      />

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
                          <Snowflake className="h-3 w-3 text-primary" /> Cadena de frío
                        </label>
                      )}
                    />
                    <Controller
                      control={form.control}
                      name="controlado"
                      render={({ field }) => (
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <Switch checked={field.value} onCheckedChange={field.onChange} className="scale-75" />
                          <ShieldAlert className="h-3 w-3 text-destructive" /> Controlado
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
                              onChange={(e) => form.setValue("reg_datos", { ...form.getValues("reg_datos"), cum: e.target.value })}
                              placeholder="123456"
                              className="input-bottom"
                            />
                          </FieldInput>
                          <FieldInput label="Expediente INVIMA">
                            <Input
                              value={(form.watch("reg_datos") as any)?.expediente_invima || ""}
                              onChange={(e) => form.setValue("reg_datos", { ...form.getValues("reg_datos"), expediente_invima: e.target.value })}
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
                            onChange={(e) => form.setValue("reg_datos", { ...form.getValues("reg_datos"), clave_cofepris: e.target.value })}
                            placeholder="010.000.5267.00"
                            className="input-bottom"
                          />
                        </FieldInput>
                      )}
                      {regPais === "EC" && (
                        <FieldInput label="Notificación sanitaria ARCSA">
                          <Input
                            value={(form.watch("reg_datos") as any)?.numero_notificacion_arcsa || ""}
                            onChange={(e) => form.setValue("reg_datos", { ...form.getValues("reg_datos"), numero_notificacion_arcsa: e.target.value })}
                            placeholder="NSA-EC-2024-001"
                            className="input-bottom"
                          />
                        </FieldInput>
                      )}
                      {regPais === "PE" && (
                        <FieldInput label="Registro sanitario DIGEMID">
                          <Input
                            value={(form.watch("reg_datos") as any)?.registro_digemid || ""}
                            onChange={(e) => form.setValue("reg_datos", { ...form.getValues("reg_datos"), registro_digemid: e.target.value })}
                            placeholder="N-12345"
                            className="input-bottom"
                          />
                        </FieldInput>
                      )}
                      {regPais === "AR" && (
                        <FieldInput label="Certificado ANMAT">
                          <Input
                            value={(form.watch("reg_datos") as any)?.certificado_anmat || ""}
                            onChange={(e) => form.setValue("reg_datos", { ...form.getValues("reg_datos"), certificado_anmat: e.target.value })}
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
    </div>
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
