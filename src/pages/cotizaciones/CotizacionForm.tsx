import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { nanoid } from "nanoid";
import { z } from "zod";
import { Plus, Trash2, Search, UserPlus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
import type {
  ClienteCotizacion,
  ConfiguracionCotizaciones,
  CotizacionItemDraft,
} from "@/types/cotizacion-types";

// Zod schemas
const clienteSchema = z.object({
  tipo_documento: z.string().min(1, "Tipo documento requerido"),
  numero_documento: z.string().min(1, "Número de documento requerido").max(30),
  nombre_razon_social: z.string().min(1, "Nombre o razón social requerido").max(200),
  correo: z.string().email("Correo inválido").optional().or(z.literal("")),
  telefono_contacto: z.string().max(20).optional().or(z.literal("")),
  tipo_persona: z.enum(["natural", "juridica"]),
});

interface Props {
  onCancel: () => void;
  onSaved: () => void;
}

const TIPOS_DOCUMENTO = ["CC", "CE", "NIT", "RUC", "RFC", "DNI", "CUIT", "PA"];

const CotizacionForm = ({ onCancel, onSaved }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // --- Config ---
  const { data: config } = useQuery({
    queryKey: ["configuracion-cotizaciones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("configuracion_cotizaciones" as any)
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data as unknown as ConfiguracionCotizaciones;
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

  // Client search query
  const { data: clienteResults } = useQuery({
    queryKey: ["clientes-cotizacion", clienteSearch],
    queryFn: async () => {
      if (clienteSearch.length < 2) return [];
      const { data, error } = await supabase
        .from("clientes_cotizacion" as any)
        .select("*")
        .or(`nombre_razon_social.ilike.%${clienteSearch}%,numero_documento.ilike.%${clienteSearch}%`)
        .limit(10);
      if (error) throw error;
      return data as unknown as ClienteCotizacion[];
    },
    enabled: clienteSearch.length >= 2 && !selectedCliente,
  });

  // Create client mutation
  const createClienteMutation = useMutation({
    mutationFn: async (data: typeof newCliente) => {
      const { data: created, error } = await supabase
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
      const { data, error } = await supabase
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
        updated.valor_total =
          updated.cantidad * updated.valor_unitario * (1 - updated.descuento_porcentaje / 100);
        return updated;
      })
    );
  };

  const removeItem = (tempId: string) => {
    setItems((prev) => prev.filter((i) => i.tempId !== tempId));
  };

  // --- Summary calculations ---
  const [descuentoGeneral, setDescuentoGeneral] = useState(0);
  const [impuestoPorcentaje, setImpuestoPorcentaje] = useState(0);
  const [observaciones, setObservaciones] = useState("");
  const [leyendaValidez, setLeyendaValidez] = useState("");
  const [fechaValidez, setFechaValidez] = useState<Date | undefined>();

  useEffect(() => {
    if (config) {
      setImpuestoPorcentaje(Number(config.impuesto_defecto) || 0);
      setLeyendaValidez(
        (config.leyenda_validez_defecto || "").replace("{dias}", String(config.dias_validez))
      );
      setFechaValidez(addDays(new Date(), config.dias_validez));
    }
  }, [config]);

  const subtotal = useMemo(() => items.reduce((acc, i) => acc + i.valor_total, 0), [items]);
  const descuentoValor = useMemo(() => subtotal * (descuentoGeneral / 100), [subtotal, descuentoGeneral]);
  const baseImponible = subtotal - descuentoValor;
  const impuestoValor = useMemo(() => baseImponible * (impuestoPorcentaje / 100), [baseImponible, impuestoPorcentaje]);
  const total = baseImponible + impuestoValor;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: config?.moneda_defecto || "COP", minimumFractionDigits: 0 }).format(val);

  // --- Save ---
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCliente) throw new Error("Selecciona un cliente");
      if (items.length === 0) throw new Error("Agrega al menos un servicio");
      if (!user?.id) throw new Error("No autenticado");

      const { data: cotizacion, error: cotError } = await supabase
        .from("cotizaciones" as any)
        .insert({
          numero_cotizacion: "", // trigger generates it
          cliente_cotizacion_id: selectedCliente.id,
          fecha_emision: format(new Date(), "yyyy-MM-dd"),
          fecha_validez: fechaValidez ? format(fechaValidez, "yyyy-MM-dd") : format(addDays(new Date(), 30), "yyyy-MM-dd"),
          estado: "borrador",
          subtotal,
          descuento_porcentaje: descuentoGeneral,
          descuento_valor: descuentoValor,
          impuesto_porcentaje: impuestoPorcentaje,
          impuesto_valor: impuestoValor,
          total,
          moneda: config?.moneda_defecto || "COP",
          observaciones: observaciones || null,
          leyenda_validez: leyendaValidez || null,
          creado_por: user.id,
        } as any)
        .select()
        .single();

      if (cotError) throw cotError;

      const cotId = (cotizacion as any).id;
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

      const { error: itemsError } = await supabase
        .from("cotizacion_items" as any)
        .insert(itemsToInsert as any);

      if (itemsError) throw itemsError;
      return cotizacion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cotizaciones"] });
      toast.success("Cotización guardada como borrador");
      onSaved();
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al guardar cotización");
    },
  });

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nueva Cotización</h1>
          <p className="text-sm text-muted-foreground">Crea una cotización de servicios para un cliente</p>
        </div>
      </div>

      {/* Section 1: Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedCliente ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
              <div>
                <p className="font-medium text-foreground">{selectedCliente.nombre_razon_social}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedCliente.tipo_documento} {selectedCliente.numero_documento}
                  {selectedCliente.correo && ` · ${selectedCliente.correo}`}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedCliente(null)}>
                Cambiar
              </Button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o documento..."
                  value={clienteSearch}
                  onChange={(e) => setClienteSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {clienteResults && clienteResults.length > 0 && (
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {clienteResults.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCliente(c);
                        setClienteSearch("");
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors"
                    >
                      <p className="text-sm font-medium text-foreground">{c.nombre_razon_social}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.tipo_documento} {c.numero_documento}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {clienteSearch.length >= 2 && clienteResults?.length === 0 && !showNewClientForm && (
                <Button variant="outline" size="sm" onClick={() => setShowNewClientForm(true)} className="gap-2">
                  <Plus className="w-3.5 h-3.5" />
                  Crear nuevo cliente
                </Button>
              )}

              {showNewClientForm && (
                <div className="space-y-3 p-4 border rounded-lg bg-card">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Tipo persona</Label>
                      <Select
                        value={newCliente.tipo_persona}
                        onValueChange={(v) => setNewCliente((p) => ({ ...p, tipo_persona: v as any }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="natural">Natural</SelectItem>
                          <SelectItem value="juridica">Jurídica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Tipo documento *</Label>
                      <Select
                        value={newCliente.tipo_documento}
                        onValueChange={(v) => setNewCliente((p) => ({ ...p, tipo_documento: v }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TIPOS_DOCUMENTO.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Número de documento *</Label>
                    <Input
                      value={newCliente.numero_documento}
                      onChange={(e) => setNewCliente((p) => ({ ...p, numero_documento: e.target.value }))}
                    />
                    {clienteErrors.numero_documento && (
                      <p className="text-xs text-destructive mt-1">{clienteErrors.numero_documento}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs">
                      {newCliente.tipo_persona === "juridica" ? "Razón social *" : "Nombre completo *"}
                    </Label>
                    <Input
                      value={newCliente.nombre_razon_social}
                      onChange={(e) => setNewCliente((p) => ({ ...p, nombre_razon_social: e.target.value }))}
                    />
                    {clienteErrors.nombre_razon_social && (
                      <p className="text-xs text-destructive mt-1">{clienteErrors.nombre_razon_social}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Correo</Label>
                      <Input
                        type="email"
                        value={newCliente.correo}
                        onChange={(e) => setNewCliente((p) => ({ ...p, correo: e.target.value }))}
                      />
                      {clienteErrors.correo && (
                        <p className="text-xs text-destructive mt-1">{clienteErrors.correo}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs">Teléfono</Label>
                      <Input
                        value={newCliente.telefono_contacto}
                        onChange={(e) => setNewCliente((p) => ({ ...p, telefono_contacto: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={handleCreateCliente} disabled={createClienteMutation.isPending}>
                      Crear cliente
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowNewClientForm(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Servicios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4" />
            Servicios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar servicio por código o descripción..."
              value={servicioSearch}
              onChange={(e) => setServicioSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {servicioResults && servicioResults.length > 0 && (
            <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
              {servicioResults.map((svc) => (
                <button
                  key={svc.id}
                  onClick={() => addServiceFromTariff(svc)}
                  className="w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors flex justify-between items-center"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{svc.descripcion_servicio}</p>
                    <p className="text-xs text-muted-foreground">{svc.codigo_servicio}</p>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {formatCurrency(Number(svc.valor))}
                  </span>
                </button>
              ))}
            </div>
          )}

          {!showManualService && (
            <Button variant="outline" size="sm" onClick={() => setShowManualService(true)} className="gap-2">
              <Plus className="w-3.5 h-3.5" />
              Agregar servicio manual
            </Button>
          )}

          {showManualService && (
            <div className="flex items-end gap-3 p-3 border rounded-lg bg-card">
              <div className="flex-1">
                <Label className="text-xs">Descripción</Label>
                <Input
                  value={manualService.descripcion}
                  onChange={(e) => setManualService((p) => ({ ...p, descripcion: e.target.value }))}
                />
              </div>
              <div className="w-36">
                <Label className="text-xs">Valor unitario</Label>
                <Input
                  type="number"
                  min="0"
                  value={manualService.valor}
                  onChange={(e) => setManualService((p) => ({ ...p, valor: e.target.value }))}
                />
              </div>
              <Button size="sm" onClick={addManualService}>Agregar</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowManualService(false)}>✕</Button>
            </div>
          )}

          {items.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground">
                    <th className="text-left px-3 py-2 font-medium">Descripción</th>
                    <th className="text-center px-2 py-2 font-medium w-24">Cant.</th>
                    <th className="text-right px-2 py-2 font-medium w-32">V. Unitario</th>
                    <th className="text-center px-2 py-2 font-medium w-24">Dto %</th>
                    <th className="text-right px-2 py-2 font-medium w-32">Total</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item) => (
                    <tr key={item.tempId}>
                      <td className="px-3 py-2 text-foreground">{item.descripcion_servicio}</td>
                      <td className="px-2 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            className="w-6 h-6 rounded bg-muted flex items-center justify-center text-foreground hover:bg-muted/80"
                            onClick={() => updateItem(item.tempId, "cantidad", Math.max(1, item.cantidad - 1))}
                          >−</button>
                          <span className="w-8 text-center text-foreground">{item.cantidad}</span>
                          <button
                            className="w-6 h-6 rounded bg-muted flex items-center justify-center text-foreground hover:bg-muted/80"
                            onClick={() => updateItem(item.tempId, "cantidad", item.cantidad + 1)}
                          >+</button>
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          min="0"
                          className="text-right h-8 text-sm"
                          value={item.valor_unitario}
                          onChange={(e) => updateItem(item.tempId, "valor_unitario", parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          className="text-center h-8 text-sm"
                          value={item.descuento_porcentaje}
                          onChange={(e) => updateItem(item.tempId, "descuento_porcentaje", parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-2 py-2 text-right font-medium text-foreground">
                        {formatCurrency(item.valor_total)}
                      </td>
                      <td className="px-2 py-2">
                        <button onClick={() => removeItem(item.tempId)} className="text-destructive hover:text-destructive/80">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumen y observaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Observaciones</Label>
                <Textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Notas adicionales..."
                  rows={3}
                />
              </div>
              <div>
                <Label className="text-xs">Leyenda de validez</Label>
                <Textarea
                  value={leyendaValidez}
                  onChange={(e) => setLeyendaValidez(e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label className="text-xs">Fecha de validez</Label>
                <DatePicker value={fechaValidez as Date} onChange={(d) => setFechaValidez(d)} />
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-lg bg-muted/30 border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm gap-2">
                <span className="text-muted-foreground">Descuento general</span>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    className="w-20 h-7 text-sm text-center"
                    value={descuentoGeneral}
                    onChange={(e) => setDescuentoGeneral(parseFloat(e.target.value) || 0)}
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
                <span className="font-medium text-foreground">-{formatCurrency(descuentoValor)}</span>
              </div>
              <div className="flex items-center justify-between text-sm gap-2">
                <span className="text-muted-foreground">{config?.nombre_impuesto || "Impuesto"}</span>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    className="w-20 h-7 text-sm text-center"
                    value={impuestoPorcentaje}
                    onChange={(e) => setImpuestoPorcentaje(parseFloat(e.target.value) || 0)}
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
                <span className="font-medium text-foreground">+{formatCurrency(impuestoValor)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span className="text-foreground">Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pb-6">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Guardando..." : "Guardar borrador"}
        </Button>
      </div>
    </div>
  );
};

export default CotizacionForm;
