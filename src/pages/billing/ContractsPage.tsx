import { useState, useEffect, useCallback, useMemo } from "react";
import { baseDatos } from "@/integrations/datos/cliente";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Plus, Building2, Loader2, CheckCircle2, Handshake, Pencil, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { EncabezadoModulo } from "@/components/kit/EncabezadoModulo";
import { AccionesFila } from "@/components/kit/AccionesFila";
import {
  BarraTabla, CeldaEstado, TablaDatos, botonPrimario, tonoPlazo, useTablaDatos,
  type ColumnaTabla, type FiltroTabla, type SegmentoTabla, type TonoEstado,
} from "@/components/kit/tabla";
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

const TIPO_CONTRATACION: Record<string, string> = {
  evento: "Por evento",
  capita: "Capitación",
  paquete: "Paquete",
  particular: "Particular",
};

const ESTADO_CONTRATO: Record<string, { texto: string; tono: TonoEstado }> = {
  activo: { texto: "Activo", tono: "exito" },
  inactivo: { texto: "Inactivo", tono: "neutro" },
  vencido: { texto: "Vencido", tono: "aviso" },
};
const estadoDe = (c: Contrato) => ESTADO_CONTRATO[c.estado] ?? { texto: c.estado, tono: "neutro" as TonoEstado };

/** Fila de la tabla: el contrato con el nombre del tarifario resuelto. */
type ContratoFila = Contrato & { tarifario_nombre: string | null };

const DIA = 24 * 60 * 60 * 1000;
const UMBRAL_POR_VENCER = 45;
const fechaCorta = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" });
/** Las fechas YYYY-MM-DD se leen como día local (sin corrimiento por zona horaria). */
const leerFecha = (f: string) => new Date(f.length === 10 ? `${f}T00:00:00` : f);
const diasParaFin = (c: Contrato) => (c.fecha_fin ? Math.ceil((leerFecha(c.fecha_fin).getTime() - Date.now()) / DIA) : null);
const tipoDe = (c: Contrato) => TIPO_CONTRATACION[c.tipo_contratacion] ?? c.tipo_contratacion;
/** Un convenio activo cuya fecha fin llega en los próximos 45 días. */
const porVencer = (c: Contrato) => {
  const d = diasParaFin(c);
  return c.estado === "activo" && d !== null && d >= 0 && d <= UMBRAL_POR_VENCER;
};

const COLUMNAS: ColumnaTabla<ContratoFila>[] = [
  { id: "convenio", titulo: "Convenio", valor: (c) => c.nombre_convenio, principal: true, fija: true, className: "min-w-[220px]" },
  { id: "pagador", titulo: "Pagador", valor: (c) => c.pagador?.nombre },
  {
    id: "identificacion", titulo: "Identificación", className: "font-mono text-xs", oculta: true,
    valor: (c) => (c.pagador?.numero_identificacion ? `${c.pagador.tipo_identificacion ?? ""} ${c.pagador.numero_identificacion}`.trim() : null),
  },
  { id: "tipo", titulo: "Tipo", valor: tipoDe },
  { id: "inicio", titulo: "Inicio", valor: (c) => c.fecha_inicio, celda: (c) => fechaCorta.format(leerFecha(c.fecha_inicio)), className: "tabular-nums" },
  {
    id: "fin", titulo: "Fin", valor: (c) => c.fecha_fin, className: "tabular-nums",
    // Fin cercano o pasado de un convenio activo: se marca con color, sin texto extra.
    celda: (c) => (c.fecha_fin
      ? <span className={c.estado === "activo" ? tonoPlazo(diasParaFin(c), UMBRAL_POR_VENCER) : undefined}>{fechaCorta.format(leerFecha(c.fecha_fin))}</span>
      : "—"),
  },
  { id: "tarifario", titulo: "Tarifario", valor: (c) => c.tarifario_nombre, oculta: true },
  { id: "notas", titulo: "Notas", valor: (c) => c.notas, className: "max-w-[260px] truncate", oculta: true },
  { id: "registro", titulo: "Registrado", valor: (c) => c.created_at, celda: (c) => fechaCorta.format(new Date(c.created_at)), oculta: true },
  {
    id: "estado", titulo: "Estado", valor: (c) => estadoDe(c).texto, sinPadding: true,
    celda: (c) => <CeldaEstado tono={estadoDe(c).tono} texto={estadoDe(c).texto} />,
  },
];

const FILTROS: FiltroTabla<ContratoFila>[] = [
  { id: "tipo", titulo: "Tipo de contratación", valor: tipoDe },
  { id: "pagador", titulo: "Pagador", valor: (c) => c.pagador?.nombre },
  { id: "tarifario", titulo: "Tarifario", valor: (c) => c.tarifario_nombre },
];

const SEGMENTOS: SegmentoTabla<ContratoFila>[] = [
  { id: "todos", titulo: "Todos", cumple: () => true },
  { id: "activos", titulo: "Activos", cumple: (c) => c.estado === "activo" },
  { id: "por-vencer", titulo: "Por vencer", cumple: porVencer },
  { id: "vencidos", titulo: "Vencidos", cumple: (c) => c.estado === "vencido" },
  { id: "inactivos", titulo: "Inactivos", cumple: (c) => c.estado === "inactivo" },
];

const claveFila = (c: ContratoFila) => c.id;

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

interface ContractsPageProps {
  /** Dentro de las pestañas de Facturación: sin encabezado propio; «Nuevo convenio» va en la barra de la tabla. */
  embebido?: boolean;
}

const ContractsPage = ({ embebido = false }: ContractsPageProps) => {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [pagadores, setPagadores] = useState<Pagador[]>([]);
  const [tarifarios, setTarifarios] = useState<TarifarioMaestro[]>([]);
  const [loading, setLoading] = useState(true);
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
    try {
      const [contratosRes, pagadoresRes, tarifariosRes] = await Promise.all([
        baseDatos
          .from("contratos")
          .select("*, pagador:pagadores(*)")
          .order("created_at", { ascending: false }),
        baseDatos.from("pagadores").select("*").eq("activo", true).order("nombre"),
        baseDatos.from("tarifarios_maestros" as any).select("id, nombre, moneda, estado").eq("estado", true).order("nombre"),
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filas = useMemo<ContratoFila[]>(
    () => contratos.map((c) => ({ ...c, tarifario_nombre: tarifarios.find((x) => x.id === c.tarifario_id)?.nombre ?? null })),
    [contratos, tarifarios],
  );
  const t = useTablaDatos({ id: "facturacion.convenios", filas, columnas: COLUMNAS, claveFila, filtros: FILTROS, segmentos: SEGMENTOS });

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
        const { data, error } = await baseDatos
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
        const { error: contratoError } = await baseDatos
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
        const { error: contratoError } = await baseDatos.from("contratos").insert({
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
    const { error } = await baseDatos
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

  const tabla = (
    <TablaDatos
      t={t}
      cargando={loading}
      onFilaClick={openEditSheet}
      barra={
        <BarraTabla
          t={t}
          nombre={["convenio", "convenios"]}
          placeholder="Buscar por convenio, pagador o tipo"
          nombreArchivo="convenios"
          acciones={embebido ? (
            <Button size="sm" className={botonPrimario} onClick={openNewSheet}>
              <Plus className="h-4 w-4" />
              Nuevo convenio
            </Button>
          ) : undefined}
        />
      }
      acciones={(c) => (
        <AccionesFila
          nombre={c.nombre_convenio}
          onVer={() => openEditSheet(c)}
          menu={[{ titulo: c.estado === "activo" ? "Desactivar" : "Activar", icono: Power, onClick: () => void toggleEstado(c) }]}
        />
      )}
      vacio="Aún no hay convenios. Crea uno con «Nuevo convenio»."
    />
  );

  return (
    <>
      {embebido ? tabla : (
        <div className="mx-auto max-w-7xl space-y-5 py-6">
          <EncabezadoModulo titulo="Convenios" primaria={{ titulo: "Nuevo convenio", onClick: openNewSheet }} />
          {tabla}
        </div>
      )}

      {/* Sheet for creating/editing pagador + contrato */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) resetForm(); }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Handshake className="w-5 h-5 text-primary" />
              {isEditing ? "Editar convenio" : "Nuevo convenio"}
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
                <div className="flex-1 h-px bg-border rounded-full">
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
    </>
  );
};

export default ContractsPage;
