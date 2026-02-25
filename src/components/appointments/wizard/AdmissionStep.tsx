import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  ArrowRight,
  ArrowLeft,
  Phone,
  CheckCircle2,
  FileText,
  Loader2,
  ShieldCheck,
  Stethoscope,
  MessageSquareText,
} from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────
export interface AdmissionData {
  contrato_id: string;
  contrato_nombre: string;
  servicio_id: string;
  servicio_nombre: string;
  servicio_codigo: string;
  servicio_valor: number;
  motivo_consulta: string;
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

  // ── Fetch active contracts with payer name ──
  useEffect(() => {
    const fetchContratos = async () => {
      setLoadingContratos(true);
      const { data, error } = await supabase
        .from("contratos")
        .select("id, nombre_convenio, tipo_contratacion, pagador_id, pagadores(nombre)")
        .eq("estado", "activo")
        .order("nombre_convenio");

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
      setLoadingContratos(false);
    };
    fetchContratos();
  }, []);

  // ── Fetch services when contract changes ──
  useEffect(() => {
    if (!selectedContratoId) {
      setServicios([]);
      setSelectedServicioId("");
      return;
    }

    const fetchServicios = async () => {
      setLoadingServicios(true);
      // Get tarifario_id from the selected contract
      const { data: contrato } = await supabase
        .from("contratos")
        .select("tarifario_id")
        .eq("id", selectedContratoId)
        .single();

      if (!contrato?.tarifario_id) {
        setServicios([]);
        setLoadingServicios(false);
        return;
      }

      const { data, error } = await supabase
        .from("tarifarios_servicios")
        .select("id, codigo_servicio, descripcion_servicio, valor, activo")
        .eq("tarifario_id", contrato.tarifario_id)
        .eq("activo", true)
        .order("codigo_servicio");

      if (error) {
        console.error("Error fetching servicios:", error);
      } else {
        setServicios(data || []);
      }
      setLoadingServicios(false);
    };
    fetchServicios();
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
      className="space-y-4 max-w-3xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
          <ClipboardList className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Admisión del paciente</h2>
          <p className="text-sm text-muted-foreground">
            Vincula cobertura, servicio y motivo de visita
          </p>
        </div>
      </motion.div>

      {/* Patient Summary */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-primary/20 flex items-center justify-center text-primary text-lg font-bold">
                {patient.firstName.charAt(0)}
                {patient.lastName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base truncate">
                  {patient.firstName} {patient.lastName}
                </p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                  <span>
                    {patient.documentType || "CC"} {patient.documentId}
                  </span>
                  {patient.contactNumber && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {patient.contactNumber}
                    </span>
                  )}
                </div>
              </div>
              {patient.regime && (
                <Badge variant="secondary" className="rounded-lg text-xs">
                  {patient.regime}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Decision Cards */}
      {wantsAdmission === null && (
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Card
            className={cn(
              "cursor-pointer transition-all duration-300 border-2 rounded-2xl overflow-hidden",
              "hover:shadow-lg hover:scale-[1.01] hover:border-primary/50",
              "active:scale-[0.99]"
            )}
            onClick={() => setWantsAdmission(true)}
          >
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Sí, admitir ahora</h3>
              <p className="text-muted-foreground text-sm">
                Seleccionar cobertura, servicio y motivo
              </p>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "cursor-pointer transition-all duration-300 border-2 rounded-2xl overflow-hidden",
              "hover:shadow-lg hover:scale-[1.01] hover:border-muted-foreground/30",
              "active:scale-[0.99]"
            )}
            onClick={handleSkip}
          >
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <ArrowRight className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No, solo agendar</h3>
              <p className="text-muted-foreground text-sm">
                Ir directamente a seleccionar fecha y hora
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Admission Form */}
      {wantsAdmission === true && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-y-auto max-h-[calc(100vh-22rem)] pr-1"
        >
          <Card className="bg-card/60 backdrop-blur-xl border-border/30 shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="p-5 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Datos de Admisión (Encounter)
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWantsAdmission(null)}
                  className="rounded-xl"
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
                    <Label className="flex items-center gap-2 text-sm font-semibold">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      Cobertura / Pagador *
                    </Label>
                    <Select
                      value={selectedContratoId}
                      onValueChange={(v) => {
                        setSelectedContratoId(v);
                        setSelectedServicioId("");
                      }}
                    >
                      <SelectTrigger className="h-12 rounded-xl">
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
                      <p className="text-xs text-muted-foreground pl-1">
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
                    <Label className="flex items-center gap-2 text-sm font-semibold">
                      <Stethoscope className="w-4 h-4 text-primary" />
                      Servicio a realizar *
                    </Label>
                    {!selectedContratoId ? (
                      <div className="h-12 rounded-xl border border-dashed border-border flex items-center justify-center text-sm text-muted-foreground">
                        Selecciona primero un convenio
                      </div>
                    ) : loadingServicios ? (
                      <div className="h-12 rounded-xl border border-border flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : servicios.length === 0 ? (
                      <div className="h-12 rounded-xl border border-dashed border-destructive/30 flex items-center justify-center text-sm text-destructive">
                        Este convenio no tiene tarifario o servicios asociados
                      </div>
                    ) : (
                      <Select
                        value={selectedServicioId}
                        onValueChange={setSelectedServicioId}
                      >
                        <SelectTrigger className="h-12 rounded-xl">
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
                      <p className="text-xs text-muted-foreground pl-1">
                        Código: {selectedServicio.codigo_servicio} · Valor: $
                        {selectedServicio.valor.toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Section 3: Motivo de la visita */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-semibold">
                      <MessageSquareText className="w-4 h-4 text-primary" />
                      Motivo de la visita *
                    </Label>
                    <Textarea
                      placeholder="Ej: Dolor de cabeza intenso desde hace 3 días..."
                      value={motivoConsulta}
                      onChange={(e) => setMotivoConsulta(e.target.value)}
                      rows={3}
                      className="rounded-xl resize-none"
                    />
                  </div>

                  {/* Continue button */}
                  <Button
                    onClick={handleContinue}
                    disabled={!selectedContratoId || !selectedServicioId || !motivoConsulta.trim()}
                    className="w-full h-14 rounded-2xl text-lg font-semibold"
                  >
                    <ArrowRight className="mr-2 w-5 h-5" />
                    Continuar a agenda
                  </Button>
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
