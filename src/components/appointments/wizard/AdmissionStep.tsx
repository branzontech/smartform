import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ExtendedPatient } from "../PatientPanel";
import { db } from "@/integrations/data/client";
import { toast } from "sonner";
import { BASE_CLINICAL_HISTORY_ID, useClinicalHistories } from "@/components/forms/clinical-histories";

// ── Types ──────────────────────────────────────────────

/** Superficie de tarjeta de Doctor Ker (sin bordes ni sombras exageradas). */
const surface = "rounded-card bg-card shadow-card dark:border dark:border-border dark:shadow-none";

export interface AdmissionData {
  contrato_id: string;
  contrato_nombre: string;
  servicio_id: string;
  servicio_nombre: string;
  servicio_codigo: string;
  servicio_valor: number;
  motivo_consulta: string;
  /** Historia clínica que llevará el paciente en esta admisión. */
  formulario_id: string;
  formulario_nombre: string;
}

interface Contrato {
  id: string;
  nombre_convenio: string;
  pagador_nombre: string;
  tipo_contratacion: string;
}

interface Servicio {
  id: string;
  codigo_servicio: string;
  descripcion_servicio: string;
  valor: number;
  activo: boolean;
}

interface AdmissionStepProps {
  patient: ExtendedPatient;
  onComplete: (admission: AdmissionData | null) => void;
  onBack: () => void;
  initialData?: AdmissionData | null;
}

// ── Component ──────────────────────────────────────────
export const AdmissionStep: React.FC<AdmissionStepProps> = ({
  patient,
  onComplete,
  onBack,
  initialData,
}) => {
  const [wantsAdmission, setWantsAdmission] = useState<boolean | null>(
    initialData ? true : null
  );

  // Data
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loadingContratos, setLoadingContratos] = useState(true);
  const [loadingServicios, setLoadingServicios] = useState(false);

  // Form state
  const [selectedContratoId, setSelectedContratoId] = useState(initialData?.contrato_id || "");
  const [selectedServicioId, setSelectedServicioId] = useState(initialData?.servicio_id || "");
  const [motivoConsulta, setMotivoConsulta] = useState(initialData?.motivo_consulta || "");
  // Por defecto, la historia clínica general; el admisionista la cambia según el servicio.
  const [historyId, setHistoryId] = useState(initialData?.formulario_id || BASE_CLINICAL_HISTORY_ID);
  const { data: histories = [] } = useClinicalHistories();

  // ── Fetch active contracts with payer name ──
  useEffect(() => {
    let vigente = true;
    const fetchContratos = async () => {
      setLoadingContratos(true);
      try {
        const { data, error } = await db
          .from("contratos")
          .select("id, nombre_convenio, tipo_contratacion, pagador_id, pagadores(nombre)")
          .eq("estado", "activo")
          .order("nombre_convenio");

        if (!vigente) return;
        if (error) {
          console.error("Error fetching contratos:", error);
          toast.error("Error al cargar convenios");
        } else {
          setContratos(
            (data || []).map((c: any) => ({
              id: c.id,
              nombre_convenio: c.nombre_convenio,
              pagador_nombre: c.pagadores?.nombre || "Sin pagador",
              tipo_contratacion: c.tipo_contratacion,
            }))
          );
        }
      } finally {
        if (vigente) setLoadingContratos(false);
      }
    };
    fetchContratos();
    return () => {
      vigente = false;
    };
  }, []);

  // ── Fetch services when contract changes ──
  useEffect(() => {
    if (!selectedContratoId) {
      setServicios([]);
      setSelectedServicioId("");
      return;
    }

    let vigente = true;
    const fetchServicios = async () => {
      setLoadingServicios(true);
      try {
        // Get tarifario_id from the selected contract
        const { data: contrato } = await db
          .from("contratos")
          .select("tarifario_id")
          .eq("id", selectedContratoId)
          .single();

        if (!vigente) return;
        if (!contrato?.tarifario_id) {
          setServicios([]);
          return;
        }

        const { data, error } = await db
          .from("tarifarios_servicios")
          .select("id, codigo_servicio, descripcion_servicio, valor, activo")
          .eq("tarifario_id", contrato.tarifario_id)
          .eq("activo", true)
          .order("codigo_servicio");

        if (!vigente) return;
        if (error) {
          console.error("Error fetching servicios:", error);
        } else {
          setServicios(data || []);
        }
      } finally {
        if (vigente) setLoadingServicios(false);
      }
    };
    fetchServicios();
    return () => {
      vigente = false;
      setLoadingServicios(false);
    };
  }, [selectedContratoId]);

  // ── Handlers ──
  const handleSkip = () => onComplete(null);

  const handleContinue = () => {
    if (!selectedContratoId) {
      toast.error("Selecciona un convenio / pagador");
      return;
    }
    if (!selectedServicioId) {
      toast.error("Selecciona el servicio a realizar");
      return;
    }
    if (!motivoConsulta.trim()) {
      toast.error("El motivo de la visita es obligatorio");
      return;
    }

    const contrato = contratos.find((c) => c.id === selectedContratoId);
    const servicio = servicios.find((s) => s.id === selectedServicioId);

    const admissionData: AdmissionData = {
      contrato_id: selectedContratoId,
      contrato_nombre: contrato?.nombre_convenio || "",
      servicio_id: selectedServicioId,
      servicio_nombre: servicio?.descripcion_servicio || "",
      servicio_codigo: servicio?.codigo_servicio || "",
      servicio_valor: servicio?.valor || 0,
      motivo_consulta: motivoConsulta.trim(),
      formulario_id: historyId,
      formulario_nombre: histories.find((h) => h.id === historyId)?.title || "Historia clínica general",
    };

    onComplete(admissionData);
  };

  // ── Animation variants ──
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const selectedContrato = contratos.find((c) => c.id === selectedContratoId);
  const selectedServicio = servicios.find((s) => s.id === selectedServicioId);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="h-full max-w-3xl space-y-4 overflow-y-auto pb-24 pt-5 scrollbar-thin md:pt-6"
    >
      {/* Encabezado: una línea de título, alineada con el riel */}
      <motion.div variants={itemVariants} className="space-y-0.5 px-1">
        <h2 className="text-[15px] font-semibold text-foreground">Admisión del paciente</h2>
        <p className="text-[13px] text-muted-foreground">Vincula cobertura, servicio y motivo de la visita, o agenda sin admitir.</p>
      </motion.div>

      {/* Decisión: dos filas de opción, sin tarjetas grandes */}
      {wantsAdmission === null && (
        <motion.div variants={itemVariants} className={cn(surface, "divide-y divide-border/70 overflow-hidden")}>
          {[
            { title: "Admitir ahora", hint: "Cobertura, servicio, historia clínica y motivo", icon: CheckCircle2, tone: "text-[hsl(var(--success))]", onClick: () => setWantsAdmission(true) },
            { title: "Solo agendar", hint: "Pasar directo a profesional, fecha y hora", icon: ArrowRight, tone: "text-muted-foreground", onClick: handleSkip },
          ].map((o) => (
            <button
              key={o.title}
              type="button"
              onClick={o.onClick}
              className="group flex w-full items-center gap-3.5 px-5 py-4 text-left transition-colors duration-200 hover:bg-muted/50 active:bg-muted/70 focus-visible:outline-none focus-visible:bg-muted/50"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted/70">
                <o.icon className={cn("h-[18px] w-[18px]", o.tone)} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14.5px] font-semibold text-foreground">{o.title}</span>
                <span className="block text-[13px] text-muted-foreground">{o.hint}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          ))}
        </motion.div>
      )}

      {/* Formulario de admisión (el scroll es el del paso, no uno interno) */}
      {wantsAdmission === true && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <Card className={cn(surface, "border-0")}>
            <CardContent className="space-y-5 p-5 md:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-semibold text-foreground">Datos de la admisión</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWantsAdmission(null)}
                  className="h-8 rounded-lg px-2.5 text-[13px] text-muted-foreground hover:text-foreground"
                >
                  Cancelar
                </Button>
              </div>

              {loadingContratos ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Section 1: Cobertura / Pagador */}
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-foreground">
                      Cobertura o pagador *
                    </Label>
                    <Select
                      value={selectedContratoId}
                      onValueChange={(v) => {
                        setSelectedContratoId(v);
                        setSelectedServicioId("");
                      }}
                    >
                      <SelectTrigger className="h-10 rounded-lg">
                        <SelectValue placeholder="Selecciona un convenio activo" />
                      </SelectTrigger>
                      <SelectContent>
                        {contratos.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{c.nombre_convenio}</span>
                              <span className="text-muted-foreground text-xs">
                                ({c.pagador_nombre})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedContrato && (
                      <p className="pl-0.5 text-xs text-muted-foreground">
                        Tipo: {selectedContrato.tipo_contratacion} · Pagador:{" "}
                        {selectedContrato.pagador_nombre}
                      </p>
                    )}
                    {contratos.length === 0 && (
                      <p className="text-xs text-destructive pl-1">
                        No hay convenios activos. Crea uno en Facturación → Convenios.
                      </p>
                    )}
                  </div>

                  {/* Section 2: Servicio a realizar */}
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-foreground">
                      Servicio a realizar *
                    </Label>
                    {!selectedContratoId ? (
                      <div className="h-10 rounded-lg border border-dashed border-border flex items-center justify-center text-sm text-muted-foreground">
                        Selecciona primero un convenio
                      </div>
                    ) : loadingServicios ? (
                      <div className="h-10 rounded-lg border border-border flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : servicios.length === 0 ? (
                      <div className="h-10 rounded-lg border border-dashed border-destructive/30 flex items-center justify-center text-sm text-destructive">
                        Este convenio no tiene tarifario o servicios asociados
                      </div>
                    ) : (
                      <Select
                        value={selectedServicioId}
                        onValueChange={setSelectedServicioId}
                      >
                        <SelectTrigger className="h-10 rounded-lg">
                          <SelectValue placeholder="Selecciona un servicio" />
                        </SelectTrigger>
                        <SelectContent>
                          {servicios.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-muted-foreground">
                                  {s.codigo_servicio}
                                </span>
                                <span>{s.descripcion_servicio}</span>
                                <Badge variant="outline" className="ml-auto text-xs">
                                  ${s.valor.toLocaleString()}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {selectedServicio && (
                      <p className="pl-0.5 text-xs text-muted-foreground">
                        Código: {selectedServicio.codigo_servicio} · Valor: $
                        {selectedServicio.valor.toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Historia clínica que llevará el paciente */}
                  <div className="space-y-2">
                    <Label htmlFor="admission-history" className="text-[13px] font-medium text-foreground">
                      Historia clínica *
                    </Label>
                    <Select value={historyId} onValueChange={setHistoryId}>
                      <SelectTrigger id="admission-history" className="h-10 rounded-lg">
                        <SelectValue placeholder="Selecciona la historia clínica" />
                      </SelectTrigger>
                      <SelectContent>
                        {histories.map((h) => (
                          <SelectItem key={h.id} value={h.id}>
                            {h.title}{h.isBase ? " (por defecto)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="pl-0.5 text-xs text-muted-foreground">
                      Según el servicio que se le prestará. El profesional puede agregar escalas y formatos durante la atención.
                    </p>
                  </div>

                  {/* Section 3: Motivo de la visita */}
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-foreground">
                      Motivo de la visita *
                    </Label>
                    <Textarea
                      placeholder="Ej: Dolor de cabeza intenso desde hace 3 días..."
                      value={motivoConsulta}
                      onChange={(e) => setMotivoConsulta(e.target.value)}
                      rows={3}
                      className="resize-none rounded-lg"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      onClick={handleContinue}
                      disabled={!selectedContratoId || !selectedServicioId || !motivoConsulta.trim()}
                      className="h-10 gap-2 rounded-full px-5 active:scale-[.97]"
                    >
                      Continuar a la agenda
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

    </motion.div>
  );
};

export default AdmissionStep;
