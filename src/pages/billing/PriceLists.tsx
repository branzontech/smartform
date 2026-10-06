import { escapeHtml } from "@/utils/orders/header-builder";
import { useState, useEffect, useCallback, useMemo } from "react";
import { baseDatos } from "@/integrations/datos/cliente";
import { toast } from "sonner";
import {
  REGULATORY_COUNTRIES,
  REGULATORY_FIELDS_BY_COUNTRY,
} from "@/constants/regulatoryFields";
import {
  DollarSign,
  Plus,
  Search,
  Loader2,
  XCircle,
  Pencil,
  ListPlus,
  FileText,
  Copy,
  AlertTriangle,
  TrendingUp,
  Printer,
  Power,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EncabezadoModulo } from "@/components/kit/EncabezadoModulo";
import { AccionesFila } from "@/components/kit/AccionesFila";
import { TablaSkeleton } from "@/components/kit/TablaSkeleton";
import {
  BarraTabla, CeldaEstado, TablaDatos, TablaSimple, botonPrimario, useTablaDatos,
  type ColumnaSimple, type ColumnaTabla, type FiltroTabla, type SegmentoTabla,
} from "@/components/kit/tabla";

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

const fechaCorta = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" });
const derecha = "text-right tabular-nums";

const formatCurrency = (valor: number, moneda: string) => {
  try {
    return new Intl.NumberFormat("es", { style: "currency", currency: moneda, minimumFractionDigits: 0 }).format(valor);
  } catch {
    return `${moneda} ${valor.toLocaleString()}`;
  }
};

const COLUMNAS: ColumnaTabla<TarifarioMaestro>[] = [
  { id: "nombre", titulo: "Nombre", valor: (t) => t.nombre, principal: true, fija: true, className: "min-w-[220px]" },
  { id: "descripcion", titulo: "Descripción", valor: (t) => t.descripcion, className: "max-w-[280px] truncate", oculta: true },
  { id: "moneda", titulo: "Moneda", valor: (t) => t.moneda, className: "font-mono text-xs" },
  { id: "servicios", titulo: "Servicios", valor: (t) => t.servicios_count ?? 0, className: derecha },
  { id: "creado", titulo: "Creado", valor: (t) => t.created_at, celda: (t) => fechaCorta.format(new Date(t.created_at)), className: "tabular-nums" },
  {
    id: "estado", titulo: "Estado", valor: (t) => (t.estado ? "Activo" : "Inactivo"), sinPadding: true,
    celda: (t) => <CeldaEstado tono={t.estado ? "exito" : "neutro"} texto={t.estado ? "Activo" : "Inactivo"} />,
  },
];

const FILTROS: FiltroTabla<TarifarioMaestro>[] = [
  { id: "moneda", titulo: "Moneda", valor: (t) => t.moneda },
];

const SEGMENTOS: SegmentoTabla<TarifarioMaestro>[] = [
  { id: "todos", titulo: "Todos", cumple: () => true },
  { id: "activos", titulo: "Activos", cumple: (t) => t.estado },
  { id: "inactivos", titulo: "Inactivos", cumple: (t) => !t.estado },
];

const claveFila = (t: TarifarioMaestro) => t.id;

interface PriceListsProps {
  /** Dentro de las pestañas de Facturación: sin encabezado propio; «Nuevo tarifario» va en la barra de la tabla. */
  embebido?: boolean;
}

const PriceLists = ({ embebido = false }: PriceListsProps) => {
  // Master list state
  const [tarifarios, setTarifarios] = useState<TarifarioMaestro[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Edit servicio state
  const [editingServicio, setEditingServicio] = useState<TarifarioServicio | null>(null);
  const [editServicioForm, setEditServicioForm] = useState({
    sistema_codificacion: "CUPS",
    codigo_servicio: "",
    descripcion_servicio: "",
    valor: "",
  });
  const [editPaisClinica, setEditPaisClinica] = useState("CO");
  const [editRegulatoryForm, setEditRegulatoryForm] = useState<Record<string, string>>({});
  const [editServicioDialogOpen, setEditServicioDialogOpen] = useState(false);
  const [savingServicio, setSavingServicio] = useState(false);

  const currentRegulatoryConfig = useMemo(
    () => REGULATORY_FIELDS_BY_COUNTRY[paisClinica] || REGULATORY_FIELDS_BY_COUNTRY.OTHER,
    [paisClinica]
  );

  const editRegulatoryConfig = useMemo(
    () => REGULATORY_FIELDS_BY_COUNTRY[editPaisClinica] || REGULATORY_FIELDS_BY_COUNTRY.OTHER,
    [editPaisClinica]
  );

  // Clone state
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [cloneTarget, setCloneTarget] = useState<TarifarioMaestro | null>(null);
  const [cloneForm, setCloneForm] = useState({ nombre: "", porcentaje: "" });
  const [cloning, setCloning] = useState(false);

  // Fetch tarifarios
  const fetchTarifarios = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await baseDatos
        .from("tarifarios_maestros" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (data) {
        // Fetch service counts
        const ids = (data as any[]).map((t: any) => t.id);
        const counts: Record<string, number> = {};

        if (ids.length > 0) {
          const { data: countData } = await baseDatos
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTarifarios();
  }, [fetchTarifarios]);

  // Fetch servicios for a tarifario
  const fetchServicios = useCallback(async (tarifarioId: string) => {
    setLoadingServicios(true);
    try {
      const { data, error } = await baseDatos
        .from("tarifarios_servicios" as any)
        .select("*")
        .eq("tarifario_id", tarifarioId)
        .order("codigo_servicio");

      if (data) setServicios(data as any[]);
      if (error) toast.error("Error cargando servicios");
    } finally {
      setLoadingServicios(false);
    }
  }, []);

  const t = useTablaDatos({ id: "facturacion.tarifarios", filas: tarifarios, columnas: COLUMNAS, claveFila, filtros: FILTROS, segmentos: SEGMENTOS });

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
        const { error } = await baseDatos
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
        const { error } = await baseDatos
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
    const { error } = await baseDatos
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
      const { error } = await baseDatos
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
    const { error } = await baseDatos
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

  const openEditServicio = (servicio: TarifarioServicio) => {
    setEditingServicio(servicio);
    setEditServicioForm({
      sistema_codificacion: servicio.sistema_codificacion,
      codigo_servicio: servicio.codigo_servicio,
      descripcion_servicio: servicio.descripcion_servicio,
      valor: String(servicio.valor),
    });
    const meta = servicio.metadata_regulatoria || {};
    const pais = (meta as any).pais || paisClinica;
    setEditPaisClinica(pais);
    const regForm: Record<string, string> = {};
    const config = REGULATORY_FIELDS_BY_COUNTRY[pais];
    if (config) {
      for (const field of config.fields) {
        regForm[field.key] = (meta as any)[field.key] || "";
      }
    }
    setEditRegulatoryForm(regForm);
    // Form is shown inline in the drawer
  };

  const handleSaveServicio = async () => {
    if (!editingServicio || !selectedTarifario) return;
    if (!editServicioForm.codigo_servicio.trim() || !editServicioForm.descripcion_servicio.trim()) {
      toast.error("Código y descripción son obligatorios");
      return;
    }
    const valorNum = parseFloat(editServicioForm.valor);
    if (isNaN(valorNum) || valorNum < 0) {
      toast.error("El valor debe ser un número válido");
      return;
    }
    const regConfig = editRegulatoryConfig;
    for (const field of regConfig.fields) {
      if (field.required && !editRegulatoryForm[field.key]?.trim()) {
        toast.error(`"${field.label}" es obligatorio para ${regConfig.label}`);
        return;
      }
    }
    const metadata: Record<string, any> = {};
    if (regConfig.fields.length > 0) {
      metadata.pais = editPaisClinica;
      for (const field of regConfig.fields) {
        if (editRegulatoryForm[field.key]?.trim()) {
          metadata[field.key] = editRegulatoryForm[field.key].trim();
        }
      }
    }
    setSavingServicio(true);
    try {
      const { error } = await baseDatos
        .from("tarifarios_servicios" as any)
        .update({
          sistema_codificacion: editServicioForm.sistema_codificacion,
          codigo_servicio: editServicioForm.codigo_servicio,
          descripcion_servicio: editServicioForm.descripcion_servicio,
          valor: valorNum,
          metadata_regulatoria: metadata,
        } as any)
        .eq("id", editingServicio.id);
      if (error) throw error;
      toast.success("Servicio actualizado");
      setEditServicioDialogOpen(false);
      fetchServicios(selectedTarifario.id);
    } catch (err: any) {
      toast.error("Error: " + (err.message || ""));
    } finally {
      setSavingServicio(false);
    }
  };

  // Print tarifario
  const handlePrintTarifario = async (tarifario: TarifarioMaestro) => {
    // Fetch services for this tarifario
    const { data, error } = await baseDatos
      .from("tarifarios_servicios" as any)
      .select("*")
      .eq("tarifario_id", tarifario.id)
      .order("codigo_servicio");
    if (error) {
      toast.error("Error al cargar servicios para imprimir");
      return;
    }
    const allServicios = (data || []) as unknown as TarifarioServicio[];
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Permite las ventanas emergentes para imprimir.');
      return;
    }
    const activeServicios = allServicios.filter(s => s.activo);
    const inactiveServicios = allServicios.filter(s => !s.activo);
    const moneda = tarifario.moneda || 'COP';

    const renderRows = (items: TarifarioServicio[]) => items.map(s => {
      const meta = s.metadata_regulatoria || {};
      const metaEntries = Object.entries(meta).filter(([k]) => k !== 'pais');
      return `<tr>
        <td>${escapeHtml(s.sistema_codificacion)}</td>
        <td style="font-family:monospace">${escapeHtml(s.codigo_servicio)}</td>
        <td>${escapeHtml(s.descripcion_servicio)}</td>
        <td style="text-align:right">${formatCurrency(s.valor, moneda)}</td>
        <td style="font-size:11px;color:#666">${metaEntries.map(([k,v]) => `${escapeHtml(k)}: ${escapeHtml(v)}`).join(', ') || '\u2014'}</td>
      </tr>`;
    }).join('');

    const html = [
      '<!DOCTYPE html><html><head>',
      `<title>${escapeHtml(tarifario.nombre)}</title><meta charset="utf-8">`,
      '<style>',
      'body{font-family:system-ui,-apple-system,sans-serif;margin:0;padding:24px;color:#333;font-size:13px}',
      '.header{text-align:center;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #333}',
      '.header h1{margin:0 0 4px;font-size:20px}',
      '.header p{margin:0;color:#666;font-size:13px}',
      '.meta{display:flex;justify-content:space-between;margin-bottom:12px;font-size:12px;color:#666}',
      'table{width:100%;border-collapse:collapse;margin-bottom:16px}',
      'th{background:#f5f5f5;text-align:left;padding:6px 8px;font-size:11px;text-transform:uppercase;border-bottom:2px solid #ddd}',
      'td{padding:5px 8px;border-bottom:1px solid #eee;font-size:12px}',
      'tr:nth-child(even){background:#fafafa}',
      '.section-title{font-size:14px;font-weight:600;margin:16px 0 8px;padding-bottom:4px;border-bottom:1px solid #ddd}',
      '.inactive{opacity:0.5}',
      '.footer{margin-top:20px;text-align:center;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:8px}',
      '.summary{display:flex;gap:24px;margin-bottom:12px;font-size:12px}',
      '.summary span{font-weight:600}',
      '@media print{.no-print{display:none}body{padding:12px}}',
      '</style></head><body>',
      '<div class="header">',
      `<h1>${escapeHtml(tarifario.nombre)}</h1>`,
      `<p>${escapeHtml(tarifario.descripcion || "Tarifario de servicios")}</p>`,
      '</div>',
      '<div class="meta">',
      `<div>Moneda: <strong>${moneda}</strong></div>`,
      `<div>Estado: <strong>${tarifario.estado ? 'Activo' : 'Inactivo'}</strong></div>`,
      `<div>Fecha: ${new Date().toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})}</div>`,
      '</div>',
      '<div class="summary">',
      `<div>Total servicios: <span>${allServicios.length}</span></div>`,
      `<div>Activos: <span>${activeServicios.length}</span></div>`,
      `<div>Inactivos: <span>${inactiveServicios.length}</span></div>`,
      '</div>',
      activeServicios.length > 0 ? [
        '<div class="section-title">Servicios Activos</div>',
        '<table><thead><tr><th>Sistema</th><th>Código</th><th>Descripción</th><th style="text-align:right">Valor</th><th>Metadata Regulatoria</th></tr></thead>',
        '<tbody>' + renderRows(activeServicios) + '</tbody></table>',
      ].join('') : '',
      inactiveServicios.length > 0 ? [
        '<div class="section-title inactive">Servicios Inactivos</div>',
        '<table class="inactive"><thead><tr><th>Sistema</th><th>Código</th><th>Descripción</th><th style="text-align:right">Valor</th><th>Metadata Regulatoria</th></tr></thead>',
        '<tbody>' + renderRows(inactiveServicios) + '</tbody></table>',
      ].join('') : '',
      `<div class="footer">Documento generado automáticamente \u00B7 ${escapeHtml(tarifario.nombre)}</div>`,
      '<div class="no-print" style="text-align:center;margin-top:16px">',
      '<button onclick="window.print()" style="padding:8px 20px;background:#0099ff;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px">Imprimir</button>',
      '</div>',
      '<script>window.onload=function(){setTimeout(function(){window.print()},500)};</script>',
      '</body></html>',
    ].join('\n');

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
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
      const { data: newMaestro, error: errMaestro } = await baseDatos
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
      const { data: oldServices, error: errFetch } = await baseDatos
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
        const { error: errInsert } = await baseDatos
          .from("tarifarios_servicios" as any)
          .insert(newServices as any);
        if (errInsert) throw errInsert;
      }

      // 4. Deactivate old tarifario
      await baseDatos
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

  const columnasServicios: ColumnaSimple<TarifarioServicio>[] = [
    { id: "sistema", titulo: "Sistema", celda: (sv) => sv.sistema_codificacion, className: "text-xs" },
    { id: "codigo", titulo: "Código", celda: (sv) => sv.codigo_servicio, className: "font-mono text-xs" },
    { id: "descripcion", titulo: "Descripción", celda: (sv) => sv.descripcion_servicio, principal: true },
    { id: "valor", titulo: "Valor", celda: (sv) => formatCurrency(sv.valor, selectedTarifario?.moneda || "COP"), className: derecha },
    {
      id: "estado", titulo: "Estado", className: "w-28 p-0 text-center",
      celda: (sv) => <CeldaEstado tono={sv.activo ? "exito" : "neutro"} texto={sv.activo ? "Activo" : "Inactivo"} />,
    },
    {
      id: "acciones", titulo: <span className="sr-only">Acciones</span>, className: "w-px px-2 text-right",
      celda: (sv) => (
        <div className="flex justify-end">
          <AccionesFila
            nombre={sv.descripcion_servicio}
            menu={[
              { titulo: "Editar", icono: Pencil, onClick: () => openEditServicio(sv) },
              { titulo: sv.activo ? "Inactivar" : "Activar", icono: Power, onClick: () => void handleToggleServicio(sv) },
            ]}
          />
        </div>
      ),
    },
  ];

  const tabla = (
    <TablaDatos
      t={t}
      cargando={loading}
      onFilaClick={openDetailSheet}
      barra={
        <BarraTabla
          t={t}
          nombre={["tarifario", "tarifarios"]}
          placeholder="Buscar por nombre o moneda"
          nombreArchivo="tarifarios"
          acciones={embebido ? (
            <Button size="sm" className={botonPrimario} onClick={openNewDialog}>
              <Plus className="h-4 w-4" />
              Nuevo tarifario
            </Button>
          ) : undefined}
        />
      }
      acciones={(tf) => (
        <AccionesFila
          nombre={tf.nombre}
          onVer={() => openDetailSheet(tf)}
          menu={[
            { titulo: "Editar", icono: Pencil, onClick: () => openEditDialog(tf) },
            { titulo: tf.estado ? "Desactivar" : "Activar", icono: Power, onClick: () => void toggleEstado(tf) },
            { titulo: "Actualizar (clonar)", icono: Copy, onClick: () => openCloneDialog(tf) },
            { titulo: "Imprimir", icono: Printer, onClick: () => void handlePrintTarifario(tf) },
          ]}
        />
      )}
      vacio="Aún no hay tarifarios. Crea uno con «Nuevo tarifario»."
    />
  );

  return (
    <>
      {embebido ? tabla : (
        <div className="mx-auto max-w-7xl space-y-5 py-6">
          <EncabezadoModulo titulo="Tarifarios" primaria={{ titulo: "Nuevo tarifario", onClick: openNewDialog }} />
          {tabla}
        </div>
      )}

      {/* Dialog for create/edit tarifario maestro */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetMasterForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              {editingTarifario ? "Editar tarifario" : "Nuevo tarifario"}
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
            {/* Add/Edit service form */}
            <div className="shrink-0 p-4 rounded-xl border border-border/40 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium flex items-center gap-2">
                  {editingServicio ? (
                    <><Pencil className="w-4 h-4 text-primary" /> Editar servicio</>
                  ) : (
                    <><ListPlus className="w-4 h-4 text-primary" /> Agregar servicio</>
                  )}
                </p>
                {editingServicio && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setEditingServicio(null); setEditServicioDialogOpen(false); }}>
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Cancelar edición
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">País de la clínica</Label>
                  <Select
                    value={editingServicio ? editPaisClinica : paisClinica}
                    onValueChange={(v) => {
                      if (editingServicio) { setEditPaisClinica(v); setEditRegulatoryForm({}); }
                      else { setPaisClinica(v); setRegulatoryForm({}); }
                    }}
                  >
                    <SelectTrigger className="mt-1 rounded-xl h-9 text-sm"><SelectValue /></SelectTrigger>
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
                    value={editingServicio ? editServicioForm.sistema_codificacion : servicioForm.sistema_codificacion}
                    onValueChange={(v) => {
                      if (editingServicio) setEditServicioForm({ ...editServicioForm, sistema_codificacion: v });
                      else setServicioForm({ ...servicioForm, sistema_codificacion: v });
                    }}
                  >
                    <SelectTrigger className="mt-1 rounded-xl h-9 text-sm"><SelectValue /></SelectTrigger>
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
                    value={editingServicio ? editServicioForm.codigo_servicio : servicioForm.codigo_servicio}
                    onChange={(e) => {
                      if (editingServicio) setEditServicioForm({ ...editServicioForm, codigo_servicio: e.target.value });
                      else setServicioForm({ ...servicioForm, codigo_servicio: e.target.value });
                    }}
                    className="mt-1 rounded-xl h-9 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs">Descripción *</Label>
                  <Input
                    placeholder="Ej: Consulta medicina general"
                    value={editingServicio ? editServicioForm.descripcion_servicio : servicioForm.descripcion_servicio}
                    onChange={(e) => {
                      if (editingServicio) setEditServicioForm({ ...editServicioForm, descripcion_servicio: e.target.value });
                      else setServicioForm({ ...servicioForm, descripcion_servicio: e.target.value });
                    }}
                    className="mt-1 rounded-xl h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Valor *</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={editingServicio ? editServicioForm.valor : servicioForm.valor}
                    onChange={(e) => {
                      if (editingServicio) setEditServicioForm({ ...editServicioForm, valor: e.target.value });
                      else setServicioForm({ ...servicioForm, valor: e.target.value });
                    }}
                    className="mt-1 rounded-xl h-9 text-sm"
                  />
                </div>
              </div>

              {/* Dynamic regulatory fields */}
              {(editingServicio ? editRegulatoryConfig : currentRegulatoryConfig).fields.length > 0 && (
                <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                  <p className="text-xs font-medium text-primary flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    {(editingServicio ? editRegulatoryConfig : currentRegulatoryConfig).label}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {(editingServicio ? editRegulatoryConfig : currentRegulatoryConfig).fields.map((field) => (
                      <div key={field.key}>
                        <Label className="text-xs">
                          {field.label} {field.required && "*"}
                        </Label>
                        {field.type === "select" && field.options ? (
                          <Select
                            value={(editingServicio ? editRegulatoryForm : regulatoryForm)[field.key] || ""}
                            onValueChange={(v) => {
                              if (editingServicio) setEditRegulatoryForm({ ...editRegulatoryForm, [field.key]: v });
                              else setRegulatoryForm({ ...regulatoryForm, [field.key]: v });
                            }}
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
                            value={(editingServicio ? editRegulatoryForm : regulatoryForm)[field.key] || ""}
                            onChange={(e) => {
                              if (editingServicio) setEditRegulatoryForm({ ...editRegulatoryForm, [field.key]: e.target.value });
                              else setRegulatoryForm({ ...regulatoryForm, [field.key]: e.target.value });
                            }}
                            className="mt-1 rounded-xl h-9 text-sm"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {editingServicio ? (
                <Button
                  size="sm"
                  onClick={handleSaveServicio}
                  disabled={savingServicio || !editServicioForm.codigo_servicio.trim() || !editServicioForm.descripcion_servicio.trim()}
                  className="rounded-xl w-full"
                >
                  {savingServicio ? <Loader2 className="mr-2 w-3 h-3 animate-spin" /> : <Pencil className="mr-2 w-3 h-3" />}
                  Guardar cambios
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleAddServicio}
                  disabled={addingServicio || !servicioForm.codigo_servicio.trim() || !servicioForm.descripcion_servicio.trim()}
                  className="rounded-xl w-full"
                >
                  {addingServicio ? <Loader2 className="mr-2 w-3 h-3 animate-spin" /> : <Plus className="mr-2 w-3 h-3" />}
                  Agregar
                </Button>
              )}
            </div>

            {/* Servicios del tarifario: un solo scroll (el de esta zona) */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {loadingServicios ? (
                <TablaSkeleton filas={4} columnas={5} />
              ) : (
                <TablaSimple
                  columnas={columnasServicios}
                  filas={filteredServicios}
                  claveFila={(sv) => sv.id}
                  vacio={searchServicios ? "Ningún servicio coincide con la búsqueda." : "Sin servicios aún."}
                  barra={
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        aria-label="Buscar servicio"
                        placeholder="Buscar servicio"
                        value={searchServicios}
                        onChange={(e) => setSearchServicios(e.target.value)}
                        className="h-8 rounded-lg border-0 bg-transparent pl-8 text-[13px] shadow-none focus-visible:ring-0"
                      />
                    </div>
                  }
                />
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
              Actualizar tarifario (clonar)
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
              Clonar y actualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PriceLists;
