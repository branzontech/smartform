import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Save, Loader2, Search, X, Plus, Trash2, Scissors,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useServiciosClinicos, useCatalogoProcedimientos } from "@/hooks/useServiciosClinicos";
import { useCreateOrdenProcedimiento } from "@/hooks/useOrdenesProcedimientos";
import type { CatalogoProcedimiento } from "@/types/servicios";

/* ─── Input style (material / bottom-border only) ─── */
const inputBase =
  "w-full bg-transparent border-0 border-b border-border/60 focus:border-primary focus:ring-0 outline-none px-1 py-1.5 text-sm placeholder:text-muted-foreground/50 transition-colors";
const labelBase = "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground";

/* ─── Types ─── */
interface ProcedimientoLineItem {
  procedimiento_id: string;
  codigo: string;
  descripcion: string;
  cantidad: number;
  dias: number;
  notas: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admisionId: string;
  pacienteId: string;
  medicoNombre: string;
  medicoId: string;
  onSuccess?: () => void;
}

export default function OrdenProcedimientoDialog({
  open, onOpenChange, admisionId, pacienteId, medicoNombre, medicoId, onSuccess,
}: Props) {
  /* ─── State: Header ─── */
  const [servicioId, setServicioId] = useState<string>("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [hora, setHora] = useState(() => new Date().toTimeString().slice(0, 5));
  const [descripcion, setDescripcion] = useState("");

  /* ─── State: Search ─── */
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showResults, setShowResults] = useState(false);

  /* ─── State: Current add form ─── */
  const [selectedProc, setSelectedProc] = useState<CatalogoProcedimiento | null>(null);
  const [addCantidad, setAddCantidad] = useState(1);
  const [addDias, setAddDias] = useState(1);
  const [addNotas, setAddNotas] = useState("");

  /* ─── State: Items list ─── */
  const [items, setItems] = useState<ProcedimientoLineItem[]>([]);

  /* ─── Queries ─── */
  const { data: servicios = [] } = useServiciosClinicos();
  const { data: resultados = [], isLoading: searching } = useCatalogoProcedimientos(
    debouncedSearch, servicioId || undefined
  );
  const createMutation = useCreateOrdenProcedimiento();

  /* ─── Default servicio ─── */
  useEffect(() => {
    if (servicios.length > 0 && !servicioId) {
      const defaultSvc = servicios.find(s => s.tipo === "procedimientos");
      if (defaultSvc) setServicioId(defaultSvc.id);
      else setServicioId(servicios[0].id);
    }
  }, [servicios, servicioId]);

  /* ─── Debounce ─── */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  /* ─── Handlers ─── */
  const handleSelectProcedimiento = useCallback((proc: CatalogoProcedimiento) => {
    setSelectedProc(proc);
    setSearchTerm("");
    setShowResults(false);
    setAddCantidad(1);
    setAddDias(1);
    setAddNotas("");
  }, []);

  const handleAddItem = useCallback(() => {
    if (!selectedProc) return;
    if (items.some(i => i.procedimiento_id === selectedProc.id)) {
      toast.error("Este procedimiento ya fue agregado");
      return;
    }
    setItems(prev => [
      ...prev,
      {
        procedimiento_id: selectedProc.id,
        codigo: selectedProc.codigo,
        descripcion: selectedProc.descripcion,
        cantidad: addCantidad,
        dias: addDias,
        notas: addNotas,
      },
    ]);
    setSelectedProc(null);
    setAddNotas("");
  }, [selectedProc, addCantidad, addDias, addNotas, items]);

  const handleRemoveItem = useCallback((procId: string) => {
    setItems(prev => prev.filter(i => i.procedimiento_id !== procId));
  }, []);

  const totals = useMemo(() => {
    const totalProcs = items.length;
    const totalAcumulado = items.reduce((s, i) => s + i.cantidad * i.dias, 0);
    return { totalProcs, totalAcumulado };
  }, [items]);

  const handleSave = async () => {
    if (!servicioId) {
      toast.error("Seleccione un servicio clínico");
      return;
    }
    if (items.length === 0) {
      toast.error("Agregue al menos un procedimiento");
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        orden: {
          admision_id: admisionId,
          paciente_id: pacienteId,
          medico_id: medicoId,
          medico_nombre: medicoNombre,
          servicio_id: servicioId,
          alcance: "interna",
          prioridad: "routine",
          indicaciones: descripcion || null,
        },
        items: items.map(i => ({
          procedimiento_id: i.procedimiento_id,
          codigo_procedimiento: i.codigo,
          descripcion_procedimiento: i.descripcion,
          cantidad: i.cantidad,
          dias: i.dias,
          notas: i.notas || null,
        })),
      });

      toast.success(`Orden ${(result as any)?.numero_orden || ''} creada exitosamente`);
      setItems([]);
      setDescripcion("");
      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Error al crear la orden");
    }
  };

  const handleReset = () => {
    setItems([]);
    setSelectedProc(null);
    setSearchTerm("");
    setDescripcion("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 rounded-xl border-border/50"
        aria-describedby={undefined}
      >
        {/* ─── HEADER ─── */}
        <DialogHeader className="px-6 pt-5 pb-3 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Scissors className="w-4 h-4 text-primary" />
            Nueva Orden de Procedimientos
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* ─── ENCABEZADO DATOS ─── */}
          <div className="px-6 py-4 bg-muted/30 border-y border-border/40">
            <p className={cn(labelBase, "mb-3")}>DATOS DE LA ORDEN</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
              {/* Número */}
              <div>
                <label className={labelBase}>N° Orden</label>
                <p className="text-sm text-muted-foreground italic mt-0.5">Se generará al guardar</p>
              </div>

              {/* Médico */}
              <div>
                <label className={labelBase}>Médico</label>
                <p className="text-sm font-medium mt-0.5 truncate">{medicoNombre}</p>
              </div>

              {/* Servicio */}
              <div>
                <label className={labelBase}>Servicio *</label>
                <select
                  value={servicioId}
                  onChange={e => { setServicioId(e.target.value); setItems([]); }}
                  className={cn(inputBase, "cursor-pointer")}
                >
                  <option value="">Seleccionar...</option>
                  {servicios.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Fecha + Hora */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelBase}>Fecha</label>
                  <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inputBase} />
                </div>
                <div>
                  <label className={labelBase}>Hora</label>
                  <input type="time" value={hora} onChange={e => setHora(e.target.value)} className={inputBase} />
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div className="mt-3">
              <label className={labelBase}>Indicaciones / Observaciones</label>
              <textarea
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Indicaciones generales para la orden..."
                rows={2}
                className={cn(inputBase, "resize-none")}
              />
            </div>
          </div>

          {/* ─── BUSCADOR DE PROCEDIMIENTOS ─── */}
          <div className="px-6 py-4">
            <p className={cn(labelBase, "mb-2")}>AGREGAR PROCEDIMIENTOS</p>

            {!servicioId && (
              <p className="text-xs text-amber-600 mb-2">Seleccione un servicio para buscar procedimientos</p>
            )}

            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setShowResults(true); }}
                onFocus={() => debouncedSearch.length >= 2 && setShowResults(true)}
                placeholder="Buscar por código o descripción..."
                disabled={!servicioId}
                className={cn(inputBase, "pl-7")}
              />
              {searchTerm && (
                <button onClick={() => { setSearchTerm(""); setShowResults(false); }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded">
                  <X className="w-3 h-3" />
                </button>
              )}

              {/* Results dropdown */}
              {showResults && debouncedSearch.length >= 2 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {searching ? (
                    <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" /> Buscando...
                    </div>
                  ) : resultados.length === 0 ? (
                    <p className="px-3 py-3 text-xs text-muted-foreground">Sin resultados</p>
                  ) : (
                    resultados.map(proc => (
                      <button
                        key={proc.id}
                        onClick={() => handleSelectProcedimiento(proc)}
                        className="w-full text-left px-3 py-2 hover:bg-muted/60 transition-colors border-b border-border/30 last:border-0"
                      >
                        <span className="text-xs font-mono font-semibold text-primary">{proc.codigo}</span>
                        <span className="text-xs text-foreground ml-2">{proc.descripcion}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Inline add form */}
            {selectedProc && (
              <div className="mt-3 flex items-end gap-3 bg-muted/20 rounded-lg p-3 border border-dashed border-border/60">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono font-semibold text-primary">{selectedProc.codigo}</p>
                  <p className="text-xs truncate">{selectedProc.descripcion}</p>
                </div>
                <div className="w-16 shrink-0">
                  <label className={labelBase}>Cant.</label>
                  <input
                    type="number" min={1} value={addCantidad}
                    onChange={e => setAddCantidad(Math.max(1, +e.target.value))}
                    className={cn(inputBase, "text-center")}
                  />
                </div>
                <div className="w-16 shrink-0">
                  <label className={labelBase}>Días</label>
                  <input
                    type="number" min={1} value={addDias}
                    onChange={e => setAddDias(Math.max(1, +e.target.value))}
                    className={cn(inputBase, "text-center")}
                  />
                </div>
                <div className="w-32 shrink-0">
                  <label className={labelBase}>Notas</label>
                  <input
                    type="text" value={addNotas}
                    onChange={e => setAddNotas(e.target.value)}
                    placeholder="Opcional"
                    className={inputBase}
                  />
                </div>
                <Button size="sm" onClick={handleAddItem} className="shrink-0 h-8 gap-1">
                  <Plus className="w-3 h-3" /> Agregar
                </Button>
                <button onClick={() => setSelectedProc(null)}
                  className="shrink-0 p-1 hover:bg-muted rounded text-muted-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* ─── RESUMEN / TABLA DE ITEMS ─── */}
          <div className="px-6 pb-4">
            <p className={cn(labelBase, "mb-2")}>
              RESUMEN DE PROCEDIMIENTOS
              {items.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
                  {items.length}
                </Badge>
              )}
            </p>

            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground/60">
                <Scissors className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No hay procedimientos agregados</p>
              </div>
            ) : (
              <div className="border border-border/40 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/40 text-muted-foreground">
                      <th className="text-left px-3 py-2 font-semibold">Código</th>
                      <th className="text-left px-3 py-2 font-semibold">Descripción</th>
                      <th className="text-center px-2 py-2 font-semibold w-16">Cant.</th>
                      <th className="text-center px-2 py-2 font-semibold w-16">Días</th>
                      <th className="text-center px-2 py-2 font-semibold w-16">Total</th>
                      <th className="text-left px-2 py-2 font-semibold">Notas</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.procedimiento_id} className="border-t border-border/30 hover:bg-muted/20">
                        <td className="px-3 py-2 font-mono font-semibold text-primary">{item.codigo}</td>
                        <td className="px-3 py-2 max-w-[200px] truncate">{item.descripcion}</td>
                        <td className="text-center px-2 py-2">{item.cantidad}</td>
                        <td className="text-center px-2 py-2">{item.dias}</td>
                        <td className="text-center px-2 py-2 font-semibold">{item.cantidad * item.dias}</td>
                        <td className="px-2 py-2 text-muted-foreground max-w-[120px] truncate">{item.notas || "—"}</td>
                        <td className="px-1 py-2">
                          <button
                            onClick={() => handleRemoveItem(item.procedimiento_id)}
                            className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border/60 bg-muted/30 font-semibold">
                      <td className="px-3 py-2" colSpan={2}>Total</td>
                      <td className="text-center px-2 py-2">{totals.totalProcs}</td>
                      <td className="text-center px-2 py-2">—</td>
                      <td className="text-center px-2 py-2 text-primary">{totals.totalAcumulado}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ─── FOOTER ─── */}
        <Separator />
        <div className="px-6 py-3 flex items-center justify-end gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={createMutation.isPending}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={items.length === 0 || !servicioId || createMutation.isPending}
            className="gap-1.5"
          >
            {createMutation.isPending ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...</>
            ) : (
              <><Save className="w-3.5 h-3.5" /> Guardar Orden</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
