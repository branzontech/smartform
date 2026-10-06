import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { baseDatos } from "@/integrations/datos/cliente";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { nanoid } from "nanoid";
import { z } from "zod";
import { Plus, Minus, Search, X, Printer, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
import { FormHeaderPreview } from "@/components/forms/FormHeaderPreview";
import { TablaSimple, type ColumnaSimple } from "@/components/kit/tabla";
import type {
  ClienteCotizacion,
  ConfiguracionCotizaciones,
  CotizacionItemDraft,
  EstadoCotizacion,
} from "@/types/cotizacion-types";

const clienteSchema = z.object({
  tipo_documento: z.string().min(1, "Tipo documento requerido"),
  numero_documento: z.string().min(1, "Número de documento requerido").max(30),
  nombre_razon_social: z.string().min(1, "Nombre o razón social requerido").max(200),
  correo: z.string().email("Correo inválido").optional().or(z.literal("")),
  telefono_contacto: z.string().max(20).optional().or(z.literal("")),
  tipo_persona: z.enum(["natural", "juridica"]),
});

interface Props {
  editId?: string;
  onCancel: () => void;
  onSaved: () => void;
}

const TIPOS_DOCUMENTO = ["CC", "CE", "NIT", "RUC", "RFC", "DNI", "CUIT", "PA"];

const derecha = "text-right tabular-nums";
const botonPaso = "h-6 w-6 rounded-md bg-muted/60 text-foreground hover:bg-muted";

const CotizacionForm = ({ editId, onCancel, onSaved }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEditing = !!editId;

  // --- Load existing cotizacion for editing ---
  const { data: existingCot } = useQuery({
    queryKey: ["cotizacion", editId],
    queryFn: async () => {
      const { data, error } = await baseDatos
        .from("cotizaciones" as any)
        .select("*, clientes_cotizacion:cliente_cotizacion_id(*)")
        .eq("id", editId!)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!editId,
  });

  const { data: existingItems } = useQuery({
    queryKey: ["cotizacion-items", editId],
    queryFn: async () => {
      const { data, error } = await baseDatos
        .from("cotizacion_items" as any)
        .select("*")
        .eq("cotizacion_id", editId!)
        .order("orden", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!editId,
  });

  const [editLoaded, setEditLoaded] = useState(false);

  // --- Config ---
  const { data: config } = useQuery({
    queryKey: ["configuracion-cotizaciones"],
    queryFn: async () => {
      const { data, error } = await baseDatos
        .from("configuracion_cotizaciones" as any)
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data as unknown as ConfiguracionCotizaciones;
    },
  });

  // --- Header config for preview ---
  const { data: headerConfig } = useQuery({
    queryKey: ["configuracion-encabezado"],
    queryFn: async () => {
      const { data, error } = await baseDatos
        .from("configuracion_encabezado")
        .select("*")
        .limit(1)
        .single();
      if (error) return null;
      return data;
    },
  });

  // --- Client state ---
  const [clienteSearch, setClienteSearch] = useState("");
  const [selectedCliente, setSelectedCliente] = useState<ClienteCotizacion | null>(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newCliente, setNewCliente] = useState({
    tipo_persona: "natural" as "natural" | "juridica",
    tipo_documento: "CC",
    numero_documento: "",
    nombre_razon_social: "",
    correo: "",
    telefono_contacto: "",
  });
  const [clienteErrors, setClienteErrors] = useState<Record<string, string>>({});

  const { data: clienteResults } = useQuery({
    queryKey: ["clientes-cotizacion", clienteSearch],
    queryFn: async () => {
      if (clienteSearch.length < 2) return [];
      const { data, error } = await baseDatos
        .from("clientes_cotizacion" as any)
        .select("*")
        .or(`nombre_razon_social.ilike.%${clienteSearch}%,numero_documento.ilike.%${clienteSearch}%`)
        .limit(10);
      if (error) throw error;
      return data as unknown as ClienteCotizacion[];
    },
    enabled: clienteSearch.length >= 2 && !selectedCliente,
  });

  const createClienteMutation = useMutation({
    mutationFn: async (data: typeof newCliente) => {
      const { data: created, error } = await baseDatos
        .from("clientes_cotizacion" as any)
        .insert(data as any)
        .select()
        .single();
      if (error) throw error;
      return created as unknown as ClienteCotizacion;
    },
    onSuccess: (created) => {
      setSelectedCliente(created);
      setShowNewClientForm(false);
      setClienteSearch("");
      queryClient.invalidateQueries({ queryKey: ["clientes-cotizacion"] });
      toast.success("Cliente creado exitosamente");
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al crear cliente");
    },
  });

  const handleCreateCliente = () => {
    const result = clienteSchema.safeParse(newCliente);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        errs[e.path[0] as string] = e.message;
      });
      setClienteErrors(errs);
      return;
    }
    setClienteErrors({});
    createClienteMutation.mutate(newCliente);
  };

  // --- Services state ---
  const [items, setItems] = useState<CotizacionItemDraft[]>([]);
  const [servicioSearch, setServicioSearch] = useState("");
  const [showManualService, setShowManualService] = useState(false);
  const [manualService, setManualService] = useState({ descripcion: "", valor: "" });

  const { data: servicioResults } = useQuery({
    queryKey: ["tarifarios-servicios", servicioSearch],
    queryFn: async () => {
      if (servicioSearch.length < 2) return [];
      const { data, error } = await baseDatos
        .from("tarifarios_servicios")
        .select("*")
        .or(`codigo_servicio.ilike.%${servicioSearch}%,descripcion_servicio.ilike.%${servicioSearch}%`)
        .eq("activo", true)
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: servicioSearch.length >= 2,
  });

  const addServiceFromTariff = (svc: any) => {
    setItems((prev) => [
      ...prev,
      {
        tempId: nanoid(),
        tarifario_servicio_id: svc.id,
        codigo_servicio: svc.codigo_servicio,
        descripcion_servicio: svc.descripcion_servicio,
        cantidad: 1,
        valor_unitario: Number(svc.valor),
        descuento_porcentaje: 0,
        valor_total: Number(svc.valor),
      },
    ]);
    setServicioSearch("");
  };

  const addManualService = () => {
    if (!manualService.descripcion || !manualService.valor) return;
    const valor = parseFloat(manualService.valor);
    if (isNaN(valor) || valor <= 0) return;
    setItems((prev) => [
      ...prev,
      {
        tempId: nanoid(),
        tarifario_servicio_id: null,
        codigo_servicio: "",
        descripcion_servicio: manualService.descripcion,
        cantidad: 1,
        valor_unitario: valor,
        descuento_porcentaje: 0,
        valor_total: valor,
      },
    ]);
    setManualService({ descripcion: "", valor: "" });
    setShowManualService(false);
  };

  const updateItem = (tempId: string, field: keyof CotizacionItemDraft, value: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.tempId !== tempId) return item;
        const updated = { ...item, [field]: value };
        updated.valor_total = updated.cantidad * updated.valor_unitario * (1 - updated.descuento_porcentaje / 100);
        return updated;
      })
    );
  };

  const removeItem = (tempId: string) => {
    setItems((prev) => prev.filter((i) => i.tempId !== tempId));
  };

  // --- Summary ---
  const [descuentoGeneral, setDescuentoGeneral] = useState(0);
  const [impuestoPorcentaje, setImpuestoPorcentaje] = useState(0);
  const [observaciones, setObservaciones] = useState("");
  const [leyendaValidez, setLeyendaValidez] = useState("");
  const [fechaValidez, setFechaValidez] = useState<Date | undefined>();

  // Load config defaults (only for new cotizaciones)
  useEffect(() => {
    if (config && !isEditing) {
      setImpuestoPorcentaje(Number(config.impuesto_defecto) || 0);
      setLeyendaValidez((config.leyenda_validez_defecto || "").replace("{dias}", String(config.dias_validez)));
      setFechaValidez(addDays(new Date(), config.dias_validez));
    }
  }, [config, isEditing]);

  // Load existing cotizacion data for editing
  useEffect(() => {
    if (isEditing && existingCot && existingItems && !editLoaded) {
      setEditLoaded(true);
      setSelectedCliente(existingCot.clientes_cotizacion as ClienteCotizacion);
      setDescuentoGeneral(Number(existingCot.descuento_porcentaje) || 0);
      setImpuestoPorcentaje(Number(existingCot.impuesto_porcentaje) || 0);
      setObservaciones(existingCot.observaciones || "");
      setLeyendaValidez(existingCot.leyenda_validez || "");
      setFechaValidez(new Date(existingCot.fecha_validez));
      setItems(
        existingItems.map((item: any) => ({
          tempId: nanoid(),
          tarifario_servicio_id: item.tarifario_servicio_id,
          codigo_servicio: item.codigo_servicio || "",
          descripcion_servicio: item.descripcion_servicio,
          cantidad: item.cantidad,
          valor_unitario: Number(item.valor_unitario),
          descuento_porcentaje: Number(item.descuento_porcentaje) || 0,
          valor_total: Number(item.valor_total),
        }))
      );
    }
  }, [isEditing, existingCot, existingItems, editLoaded]);

  const subtotal = useMemo(() => items.reduce((acc, i) => acc + i.valor_total, 0), [items]);
  const descuentoValor = useMemo(() => subtotal * (descuentoGeneral / 100), [subtotal, descuentoGeneral]);
  const baseImponible = subtotal - descuentoValor;
  const impuestoValor = useMemo(() => baseImponible * (impuestoPorcentaje / 100), [baseImponible, impuestoPorcentaje]);
  const total = baseImponible + impuestoValor;

  const moneda = config?.moneda_defecto || "COP";
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: moneda, minimumFractionDigits: 0 }).format(val);

  // --- Save ---
  const saveMutation = useMutation({
    mutationFn: async (targetEstado: EstadoCotizacion) => {
      if (!selectedCliente) throw new Error("Selecciona un cliente");
      if (items.length === 0) throw new Error("Agrega al menos un servicio");
      if (!user?.id) throw new Error("No autenticado");

      const cotData = {
        cliente_cotizacion_id: selectedCliente.id,
        fecha_validez: fechaValidez ? format(fechaValidez, "yyyy-MM-dd") : format(addDays(new Date(), 30), "yyyy-MM-dd"),
        subtotal,
        descuento_porcentaje: descuentoGeneral,
        descuento_valor: descuentoValor,
        impuesto_porcentaje: impuestoPorcentaje,
        impuesto_valor: impuestoValor,
        total,
        moneda,
        observaciones: observaciones || null,
        leyenda_validez: leyendaValidez || null,
        estado: targetEstado,
      } as any;

      let cotId: string;

      if (isEditing && editId) {
        // UPDATE existing
        const { error: cotError } = await baseDatos
          .from("cotizaciones" as any)
          .update(cotData)
          .eq("id", editId);
        if (cotError) throw cotError;
        cotId = editId;

        // Delete old items and re-insert
        await baseDatos.from("cotizacion_items" as any).delete().eq("cotizacion_id", editId);
      } else {
        // INSERT new
        cotData.numero_cotizacion = "";
        cotData.fecha_emision = format(new Date(), "yyyy-MM-dd");
        cotData.creado_por = user.id;

        const { data: cotizacion, error: cotError } = await baseDatos
          .from("cotizaciones" as any)
          .insert(cotData)
          .select()
          .single();
        if (cotError) throw cotError;
        cotId = (cotizacion as any).id;
      }

      const itemsToInsert = items.map((item, idx) => ({
        cotizacion_id: cotId,
        tarifario_servicio_id: item.tarifario_servicio_id,
        codigo_servicio: item.codigo_servicio || null,
        descripcion_servicio: item.descripcion_servicio,
        cantidad: item.cantidad,
        valor_unitario: item.valor_unitario,
        descuento_porcentaje: item.descuento_porcentaje,
        valor_total: item.valor_total,
        orden: idx,
      }));

      const { error: itemsError } = await baseDatos
        .from("cotizacion_items" as any)
        .insert(itemsToInsert as any);

      if (itemsError) throw itemsError;
    },
    onSuccess: (_, targetEstado) => {
      queryClient.invalidateQueries({ queryKey: ["cotizaciones"] });
      queryClient.invalidateQueries({ queryKey: ["cotizacion", editId] });
      queryClient.invalidateQueries({ queryKey: ["cotizacion-items", editId] });

      if (targetEstado === "enviada") {
        toast.success(isEditing ? "Cotización oficializada y actualizada" : "Cotización guardada y oficializada");
      } else {
        toast.success(isEditing ? "Cotización actualizada" : "Cotización guardada como borrador");
      }

      onSaved();
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al guardar cotización");
    },
  });

  const hasData = selectedCliente || items.length > 0 || observaciones;

  // Ítems editables: una celda, un dato; los inputs van dentro de la celda.
  const columnasEdicion: ColumnaSimple<CotizacionItemDraft>[] = [
    { id: "descripcion", titulo: "Descripción", celda: (i) => i.descripcion_servicio, principal: true },
    {
      id: "cantidad", titulo: "Cant.", className: "w-28 text-center",
      celda: (i) => (
        <div className="flex items-center justify-center gap-1">
          <Button type="button" variant="ghost" size="icon" className={botonPaso} aria-label={`Restar una unidad a ${i.descripcion_servicio}`}
            onClick={() => updateItem(i.tempId, "cantidad", Math.max(1, i.cantidad - 1))}>
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-8 text-center tabular-nums text-foreground">{i.cantidad}</span>
          <Button type="button" variant="ghost" size="icon" className={botonPaso} aria-label={`Sumar una unidad a ${i.descripcion_servicio}`}
            onClick={() => updateItem(i.tempId, "cantidad", i.cantidad + 1)}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
    {
      id: "unitario", titulo: "V. unit.", className: "w-36",
      celda: (i) => (
        <Input type="number" min="0" aria-label={`Valor unitario de ${i.descripcion_servicio}`} className="h-8 text-right text-sm tabular-nums" value={i.valor_unitario}
          onChange={(e) => updateItem(i.tempId, "valor_unitario", parseFloat(e.target.value) || 0)} />
      ),
    },
    {
      id: "descuento", titulo: "Dto. %", className: "w-24",
      celda: (i) => (
        <Input type="number" min="0" max="100" aria-label={`Descuento de ${i.descripcion_servicio}`} className="h-8 text-right text-sm tabular-nums" value={i.descuento_porcentaje}
          onChange={(e) => updateItem(i.tempId, "descuento_porcentaje", parseFloat(e.target.value) || 0)} />
      ),
    },
    { id: "total", titulo: "Total", celda: (i) => formatCurrency(i.valor_total), className: `w-32 font-medium text-foreground ${derecha}` },
    {
      id: "quitar", titulo: <span className="sr-only">Quitar</span>, className: "w-11 text-center",
      celda: (i) => (
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
          aria-label={`Quitar ${i.descripcion_servicio}`} title="Quitar ítem" onClick={() => removeItem(i.tempId)}>
          <X className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const columnasVista: ColumnaSimple<CotizacionItemDraft>[] = [
    { id: "descripcion", titulo: "Descripción", celda: (i) => i.descripcion_servicio, principal: true },
    { id: "cantidad", titulo: "Cant.", celda: (i) => i.cantidad, className: `w-14 ${derecha}` },
    { id: "unitario", titulo: "V. unit.", celda: (i) => formatCurrency(i.valor_unitario), className: derecha },
    { id: "descuento", titulo: "Dto. %", celda: (i) => (i.descuento_porcentaje > 0 ? `${i.descuento_porcentaje}%` : "—"), className: derecha },
    { id: "total", titulo: "Total", celda: (i) => formatCurrency(i.valor_total), className: `font-medium text-foreground ${derecha}` },
  ];

  const handlePrint = () => window.print();

  return (
    <div className="flex flex-col gap-6 py-6 lg:flex-row lg:items-start">
      {/* LEFT COLUMN — Form */}
      <div className="min-w-0 lg:flex-[6]">
        <div className="space-y-6 max-w-3xl">
          {/* Header */}
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">{isEditing ? "Editar Cotización" : "Nueva Cotización"}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{isEditing ? `Editando ${existingCot?.numero_cotizacion || ""}` : "Completa los datos para generar la cotización"}</p>
          </div>

          {/* SECTION: Cliente */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Cliente</h3>
            {selectedCliente ? (
              <div className="flex items-start justify-between p-4 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50">
                <div className="space-y-0.5">
                  <p className="font-medium text-sm text-foreground">{selectedCliente.nombre_razon_social}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedCliente.tipo_documento} {selectedCliente.numero_documento}
                  </p>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                    {selectedCliente.correo && <span>{selectedCliente.correo}</span>}
                    {selectedCliente.telefono_contacto && <span>Tel: {selectedCliente.telefono_contacto}</span>}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedCliente(null)}>
                  Cambiar
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o documento..."
                    value={clienteSearch}
                    onChange={(e) => setClienteSearch(e.target.value)}
                    className="pl-10 h-10 bg-background/80 focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {clienteResults && clienteResults.length > 0 && (
                  <div className="rounded-lg border border-border/50 shadow-lg overflow-hidden bg-popover">
                    {clienteResults.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedCliente(c); setClienteSearch(""); }}
                        className="w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors duration-150 border-b border-border/30 last:border-0"
                      >
                        <p className="text-sm font-medium text-foreground">{c.nombre_razon_social}</p>
                        <p className="text-xs text-muted-foreground">{c.tipo_documento} {c.numero_documento}</p>
                      </button>
                    ))}
                  </div>
                )}

                {clienteSearch.length >= 2 && clienteResults?.length === 0 && !showNewClientForm && (
                  <Button variant="outline" size="sm" onClick={() => setShowNewClientForm(true)} className="gap-2 text-xs">
                    <Plus className="w-3.5 h-3.5" />
                    Crear nuevo cliente
                  </Button>
                )}

                {showNewClientForm && (
                  <div className="space-y-3 p-4 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Tipo persona</Label>
                        <Select value={newCliente.tipo_persona} onValueChange={(v) => setNewCliente((p) => ({ ...p, tipo_persona: v as any }))}>
                          <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="natural">Natural</SelectItem>
                            <SelectItem value="juridica">Jurídica</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Tipo documento *</Label>
                        <Select value={newCliente.tipo_documento} onValueChange={(v) => setNewCliente((p) => ({ ...p, tipo_documento: v }))}>
                          <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {TIPOS_DOCUMENTO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Número de documento *</Label>
                      <Input value={newCliente.numero_documento} onChange={(e) => setNewCliente((p) => ({ ...p, numero_documento: e.target.value }))} className="h-9 text-sm" />
                      {clienteErrors.numero_documento && <p className="text-xs text-destructive mt-1">{clienteErrors.numero_documento}</p>}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        {newCliente.tipo_persona === "juridica" ? "Razón social *" : "Nombre completo *"}
                      </Label>
                      <Input value={newCliente.nombre_razon_social} onChange={(e) => setNewCliente((p) => ({ ...p, nombre_razon_social: e.target.value }))} className="h-9 text-sm" />
                      {clienteErrors.nombre_razon_social && <p className="text-xs text-destructive mt-1">{clienteErrors.nombre_razon_social}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Correo</Label>
                        <Input type="email" value={newCliente.correo} onChange={(e) => setNewCliente((p) => ({ ...p, correo: e.target.value }))} className="h-9 text-sm" />
                        {clienteErrors.correo && <p className="text-xs text-destructive mt-1">{clienteErrors.correo}</p>}
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Teléfono</Label>
                        <Input value={newCliente.telefono_contacto} onChange={(e) => setNewCliente((p) => ({ ...p, telefono_contacto: e.target.value }))} className="h-9 text-sm" />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={handleCreateCliente} disabled={createClienteMutation.isPending}>Crear cliente</Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowNewClientForm(false)}>Cancelar</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <Separator className="opacity-50" />

          {/* SECTION: Servicios */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Servicios</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar servicio por código o descripción..."
                    value={servicioSearch}
                    onChange={(e) => setServicioSearch(e.target.value)}
                    className="pl-10 h-10 bg-background/80 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowManualService(true)} className="gap-1.5 h-10 text-xs shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                  Manual
                </Button>
              </div>

              {servicioResults && servicioResults.length > 0 && (
                <div className="rounded-lg border border-border/50 shadow-lg overflow-hidden bg-popover">
                  {servicioResults.map((svc) => (
                    <button
                      key={svc.id}
                      onClick={() => addServiceFromTariff(svc)}
                      className="w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors duration-150 flex justify-between items-center border-b border-border/30 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{svc.descripcion_servicio}</p>
                        <p className="text-xs text-muted-foreground">{svc.codigo_servicio}</p>
                      </div>
                      <span className="text-sm font-medium text-foreground">{formatCurrency(Number(svc.valor))}</span>
                    </button>
                  ))}
                </div>
              )}

              {showManualService && (
                <div className="flex items-end gap-3 p-3 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Descripción</Label>
                    <Input value={manualService.descripcion} onChange={(e) => setManualService((p) => ({ ...p, descripcion: e.target.value }))} className="h-9 text-sm" />
                  </div>
                  <div className="w-36">
                    <Label className="text-xs text-muted-foreground">Valor unitario</Label>
                    <Input type="number" min="0" value={manualService.valor} onChange={(e) => setManualService((p) => ({ ...p, valor: e.target.value }))} className="h-9 text-sm" />
                  </div>
                  <Button size="sm" onClick={addManualService} className="h-9">Agregar</Button>
                  <Button size="icon" variant="ghost" onClick={() => setShowManualService(false)} className="h-9 w-9">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {items.length > 0 && (
                <TablaSimple
                  columnas={columnasEdicion}
                  filas={items}
                  claveFila={(i) => i.tempId}
                  pie={
                    <div className="flex justify-end gap-3">
                      <span>Subtotal</span>
                      <span className="min-w-[96px] text-right font-medium text-foreground">{formatCurrency(subtotal)}</span>
                    </div>
                  }
                />
              )}
            </div>
          </section>

          <Separator className="opacity-50" />

          {/* SECTION: Observaciones */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Observaciones</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Observaciones</Label>
                <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Notas adicionales..." className="min-h-[80px] resize-y text-sm" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Leyenda de validez</Label>
                <Textarea value={leyendaValidez} onChange={(e) => setLeyendaValidez(e.target.value)} className="min-h-[60px] resize-y text-sm" />
              </div>
              <div className="w-64">
                <Label className="text-xs text-muted-foreground">Fecha de validez</Label>
                <DatePicker value={fechaValidez as Date} onChange={(d) => setFechaValidez(d)} className="h-9 text-sm" />
              </div>
            </div>
          </section>

          <Separator className="opacity-50" />

          {/* SECTION: Totals */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Totales</h3>
            <div className="rounded-xl bg-muted/30 backdrop-blur-sm border border-border/50 p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm gap-2">
                <span className="text-muted-foreground">Descuento general</span>
                <div className="flex items-center gap-1">
                  <Input type="number" min="0" max="100" className="w-20 h-7 text-sm text-center" value={descuentoGeneral} onChange={(e) => setDescuentoGeneral(parseFloat(e.target.value) || 0)} />
                  <span className="text-muted-foreground text-xs">%</span>
                </div>
                <span className="font-medium text-foreground min-w-[80px] text-right">-{formatCurrency(descuentoValor)}</span>
              </div>
              <div className="flex items-center justify-between text-sm gap-2">
                <span className="text-muted-foreground">{config?.nombre_impuesto || "Impuesto"}</span>
                <div className="flex items-center gap-1">
                  <Input type="number" min="0" max="100" className="w-20 h-7 text-sm text-center" value={impuestoPorcentaje} onChange={(e) => setImpuestoPorcentaje(parseFloat(e.target.value) || 0)} />
                  <span className="text-muted-foreground text-xs">%</span>
                </div>
                <span className="font-medium text-foreground min-w-[80px] text-right">+{formatCurrency(impuestoValor)}</span>
              </div>
              <Separator className="opacity-50" />
              <div className="flex justify-between items-center">
                <span className="text-base font-semibold text-foreground">Total</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pb-6 pt-2">
            <Button variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button
              variant="outline"
              onClick={() => saveMutation.mutate(isEditing ? ((existingCot?.estado as EstadoCotizacion) || "borrador") : "borrador")}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Guardando..." : isEditing ? "Guardar cambios" : "Guardar borrador"}
            </Button>
            <Button onClick={() => saveMutation.mutate("enviada")} disabled={saveMutation.isPending} className="shadow-sm">
              {saveMutation.isPending ? "Guardando..." : "Guardar y oficializar"}
            </Button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN — Live Preview */}
      <div className="min-w-0 overflow-hidden rounded-xl border border-border/50 bg-muted/20 lg:flex-[4] print:border-0 print:bg-white">
        {/* Toolbar */}
        <div className="bg-muted/40 border-b border-border/50 px-4 py-2.5 flex items-center justify-between print:hidden">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Vista previa</span>
          <div className="flex gap-1.5">
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={handlePrint}>
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </Button>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={handlePrint}>
              <Download className="w-3.5 h-3.5" />
              PDF
            </Button>
          </div>
        </div>

        <div className="p-6">
          {!hasData ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FileText className="w-10 h-10 text-muted-foreground/20 mb-4" />
              <p className="text-sm text-muted-foreground">
                La vista previa se actualizará a medida que completes la cotización
              </p>
            </div>
          ) : (
            <div className="bg-background rounded-xl shadow-sm border border-border/50 p-6 text-sm space-y-5 print:shadow-none print:border-0 print:rounded-none print:p-0">
              {/* Institution header */}
              {headerConfig && (
                <FormHeaderPreview config={headerConfig as any} />
              )}

              {/* Title */}
              <div className="text-center py-2">
                <h2 className="text-base font-bold text-foreground uppercase tracking-wide">Cotización</h2>
                <p className="text-xs text-muted-foreground mt-0.5">N° {isEditing && existingCot ? existingCot.numero_cotizacion : `COT-${format(new Date(), "yyyy")}-XXXX`}</p>
              </div>

              {/* Client info */}
              {selectedCliente && (
                <div className="rounded-lg border border-border/50 p-3 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Datos del cliente</p>
                  <p className="font-medium text-foreground">{selectedCliente.nombre_razon_social}</p>
                  <p className="text-xs text-muted-foreground">{selectedCliente.tipo_documento} {selectedCliente.numero_documento}</p>
                  {selectedCliente.correo && <p className="text-xs text-muted-foreground">{selectedCliente.correo}</p>}
                  {selectedCliente.telefono_contacto && <p className="text-xs text-muted-foreground">Tel: {selectedCliente.telefono_contacto}</p>}
                </div>
              )}

              {/* Dates */}
              <div className="flex gap-6 text-xs">
                <div>
                  <span className="text-muted-foreground">Fecha emisión: </span>
                  <span className="font-medium text-foreground">{format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })}</span>
                </div>
                {fechaValidez && (
                  <div>
                    <span className="text-muted-foreground">Válida hasta: </span>
                    <span className="font-medium text-foreground">{format(fechaValidez, "dd 'de' MMMM 'de' yyyy", { locale: es })}</span>
                  </div>
                )}
              </div>

              {/* Items table + summary */}
              {items.length > 0 && (
                <TablaSimple
                  columnas={columnasVista}
                  filas={items}
                  claveFila={(i) => i.tempId}
                  className="shadow-none"
                  pie={
                    <div className="ml-auto w-56 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="text-foreground">{formatCurrency(subtotal)}</span>
                      </div>
                      {descuentoGeneral > 0 && (
                        <div className="flex justify-between">
                          <span>Descuento ({descuentoGeneral}%)</span>
                          <span className="text-foreground">-{formatCurrency(descuentoValor)}</span>
                        </div>
                      )}
                      {impuestoPorcentaje > 0 && (
                        <div className="flex justify-between">
                          <span>{config?.nombre_impuesto || "Impuesto"} ({impuestoPorcentaje}%)</span>
                          <span className="text-foreground">+{formatCurrency(impuestoValor)}</span>
                        </div>
                      )}
                      <Separator className="opacity-50" />
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-foreground">Total</span>
                        <span className="text-primary">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  }
                />
              )}

              {/* Observaciones */}
              {observaciones && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Observaciones</p>
                  <p className="text-xs text-foreground whitespace-pre-line">{observaciones}</p>
                </div>
              )}

              {/* Leyenda */}
              {leyendaValidez && (
                <p className="text-xs text-muted-foreground italic border-t border-border/30 pt-3">{leyendaValidez}</p>
              )}

              {/* Notas legales */}
              {config?.notas_legales && (
                <p className="text-xs text-muted-foreground border-t border-border/30 pt-3">{config.notas_legales}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CotizacionForm;
