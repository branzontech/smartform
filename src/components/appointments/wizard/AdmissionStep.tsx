import React, { useState, useEffect } from "react";
import { DynamicFieldRenderer } from "@/components/config/DynamicFieldRenderer";
import { DiagnosisSearch, type SelectedDiagnosis } from "@/components/admissions/DiagnosisSearch";
import type { DynamicFieldConfig } from "@/components/config/DynamicFieldConfigurator";
import { motion } from "framer-motion";
import { 
  ClipboardList, 
  ArrowRight, 
  ArrowLeft,
  Phone,
  CheckCircle2,
  FileText,
  Loader2,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ExtendedPatient } from "../PatientPanel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdmissionData {
  reason: string;
  appointmentType: string;
  priorityLevel: "Normal" | "Urgente" | "Emergencia";
  insuranceProvider?: string;
  insuranceNumber?: string;
  assignedDoctor?: string;
  notes?: string;
  // FHIR Encounter fields
  fhirClass?: string;
  serviceType?: string;
  hospitalizationAdmitSource?: string;
  hospitalizationDischargeDisposition?: string;
  diagnosticoPrincipal?: string;
  diagnosticos?: SelectedDiagnosis[];
  // Custom fields
  customFields?: Record<string, string>;
}

interface AdmissionType {
  id: string;
  nombre: string;
  descripcion: string | null;
}

// Using shared DynamicFieldConfig type

interface AdmissionStepProps {
  patient: ExtendedPatient;
  onComplete: (admission: AdmissionData | null) => void;
  onBack: () => void;
  initialData?: AdmissionData | null;
  alreadySaved?: boolean;
}

// FHIR Encounter.class values
const FHIR_CLASS_OPTIONS = [
  { value: "AMB", label: "Ambulatorio" },
  { value: "EMER", label: "Emergencia" },
  { value: "IMP", label: "Hospitalización" },
  { value: "SS", label: "Corta estancia" },
  { value: "HH", label: "Domiciliario" },
  { value: "VR", label: "Virtual" },
];

// FHIR Encounter.priority
const FHIR_PRIORITY_OPTIONS = [
  { value: "Normal", color: "bg-emerald-500", label: "Normal" },
  { value: "Urgente", color: "bg-yellow-500", label: "Urgente" },
  { value: "Emergencia", color: "bg-destructive", label: "Emergencia" },
];

// FHIR hospitalization.admitSource
const ADMIT_SOURCE_OPTIONS = [
  { value: "hosp-trans", label: "Transferencia hospitalaria" },
  { value: "emd", label: "Servicio de urgencias" },
  { value: "outp", label: "Consulta externa" },
  { value: "born", label: "Nacimiento" },
  { value: "gp", label: "Referido por médico general" },
  { value: "mp", label: "Referido por especialista" },
  { value: "nursing", label: "Desde enfermería" },
  { value: "psych", label: "Desde psiquiatría" },
  { value: "rehab", label: "Desde rehabilitación" },
  { value: "other", label: "Otro" },
];

export const AdmissionStep: React.FC<AdmissionStepProps> = ({
  patient,
  onComplete,
  onBack,
  initialData,
  alreadySaved = false,
}) => {
  const [wantsAdmission, setWantsAdmission] = useState<boolean | null>(
    initialData ? true : null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [wasSaved, setWasSaved] = useState(alreadySaved);
  const [saveResult, setSaveResult] = useState<"success" | "error" | null>(alreadySaved ? "success" : null);
  const [saveErrorMsg, setSaveErrorMsg] = useState("");
  const [admissionTypes, setAdmissionTypes] = useState<AdmissionType[]>([]);
  const [customFields, setCustomFields] = useState<DynamicFieldConfig[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  
  const [admissionData, setAdmissionData] = useState<AdmissionData>(
    initialData || {
      reason: "",
      appointmentType: "",
      priorityLevel: "Normal",
      insuranceProvider: "",
      insuranceNumber: "",
      assignedDoctor: "",
      notes: "",
      fhirClass: "AMB",
      serviceType: "",
      hospitalizationAdmitSource: "",
      hospitalizationDischargeDisposition: "",
      diagnosticoPrincipal: "",
      diagnosticos: [],
      customFields: {},
    }
  );

  // Fetch tipos_admision and custom fields config
  useEffect(() => {
    const fetchConfig = async () => {
      setLoadingConfig(true);
      const [typesRes, fieldsRes] = await Promise.all([
        supabase.from("tipos_admision").select("id, nombre, descripcion").eq("activo", true).order("orden"),
        supabase.from("configuracion_campos_admision").select("*").order("orden"),
      ]);
      if (typesRes.data) setAdmissionTypes(typesRes.data);
      if (fieldsRes.data) setCustomFields(fieldsRes.data.map((d: any) => ({ ...d, opciones: Array.isArray(d.opciones) ? d.opciones : [] })) as DynamicFieldConfig[]);
      // Set default type
      if (typesRes.data?.length && !admissionData.appointmentType) {
        setAdmissionData(prev => ({ ...prev, appointmentType: typesRes.data[0].id }));
      }
      setLoadingConfig(false);
    };
    fetchConfig();
  }, []);

  const handleSkip = () => {
    onComplete(null);
  };

  const handleSubmit = async () => {
    // If already saved, just pass through without re-inserting
    if (wasSaved) {
      onComplete(admissionData);
      return;
    }

    if (!admissionData.reason.trim()) {
      toast.error("El motivo de la consulta es obligatorio");
      return;
    }

    // Validate required custom fields
    for (const field of customFields) {
      if (field.es_requerido && !admissionData.customFields?.[field.id]?.trim()) {
        toast.error(`El campo "${field.label}" es obligatorio`);
        return;
      }
    }

    setIsSaving(true);
    try {
      // Build fhir_extensions
      const fhirExtensions: Record<string, any> = {
        class: admissionData.fhirClass,
        priority: admissionData.priorityLevel,
        serviceType: admissionData.serviceType || undefined,
        hospitalization: {
          admitSource: admissionData.hospitalizationAdmitSource || undefined,
          dischargeDisposition: admissionData.hospitalizationDischargeDisposition || undefined,
        },
        insurance: {
          provider: admissionData.insuranceProvider || undefined,
          policyNumber: admissionData.insuranceNumber || undefined,
        },
        // FHIR Encounter.diagnosis array
        diagnosis: (admissionData.diagnosticos || []).map((d, i) => ({
          condition: {
            coding: [{
              system: d.fhir_system_uri,
              code: d.codigo,
              display: d.descripcion,
            }]
          },
          use: {
            coding: [{
              system: "http://terminology.hl7.org/CodeSystem/diagnosis-role",
              code: i === 0 ? "AD" : "DD",
              display: i === 0 ? "Admission diagnosis" : "Discharge diagnosis",
            }]
          },
          rank: i + 1,
        })),
        // Custom fields stored as FHIR extensions
        customFields: admissionData.customFields || {},
      };

      const { error } = await supabase.from("admisiones").insert({
        paciente_id: patient.id,
        tipo_admision_id: admissionData.appointmentType || null,
        motivo: admissionData.reason,
        profesional_nombre: admissionData.assignedDoctor && admissionData.assignedDoctor !== "none" 
          ? admissionData.assignedDoctor : null,
        diagnostico_principal: admissionData.diagnosticoPrincipal || null,
        notas: admissionData.notes || null,
        estado: "en_curso",
        fhir_extensions: fhirExtensions,
      });

      if (error) throw error;

      setWasSaved(true);
      setSaveResult("success");
    } catch (error: any) {
      console.error("Error saving admission:", error);
      setSaveResult("error");
      setSaveErrorMsg(error.message || "Error desconocido");
    } finally {
      setIsSaving(false);
    }
  };

  const updateCustomField = (fieldId: string, value: string) => {
    setAdmissionData(prev => ({
      ...prev,
      customFields: { ...prev.customFields, [fieldId]: value }
    }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

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
          <h2 className="text-lg font-bold">¿Desea admitir al paciente?</h2>
          <p className="text-sm text-muted-foreground">Registra la admisión ahora o hazlo después</p>
        </div>
      </motion.div>

      {/* Patient Summary Card */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 rounded-2xl">
          <CardContent className="p-4">
              <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-primary/20 flex items-center justify-center text-primary text-lg font-bold">
                {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base truncate">
                  {patient.firstName} {patient.lastName}
                </p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                  <span>{patient.documentType || 'CC'} {patient.documentId}</span>
                  {patient.medicalRecordNumber && <span>Hª {patient.medicalRecordNumber}</span>}
                  {patient.contactNumber && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {patient.contactNumber}
                    </span>
                  )}
                </div>
                {(patient.carnet || patient.affiliationType) && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    {patient.carnet && <span>Carnet: {patient.carnet}</span>}
                    {patient.affiliationType && <span>Afiliación: {patient.affiliationType}</span>}
                  </div>
                )}
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
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Registrar motivo, tipo de cita y prioridad
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
            <CardContent className="p-5 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Datos de Admisión (FHIR Encounter)
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

              {loadingConfig ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* FHIR Encounter.class */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Clase de encuentro (FHIR) *</Label>
                      <Select
                        value={admissionData.fhirClass}
                        onValueChange={(v) => setAdmissionData({...admissionData, fhirClass: v})}
                      >
                        <SelectTrigger className="h-11 rounded-xl mt-2">
                          <SelectValue placeholder="Seleccionar clase" />
                        </SelectTrigger>
                        <SelectContent>
                          {FHIR_CLASS_OPTIONS.map(o => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tipo de admisión (from DB) */}
                    <div>
                      <Label>Tipo de admisión *</Label>
                      <Select
                        value={admissionData.appointmentType}
                        onValueChange={(v) => setAdmissionData({...admissionData, appointmentType: v})}
                      >
                        <SelectTrigger className="h-11 rounded-xl mt-2">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {admissionTypes.map(t => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Motivo */}
                  <div>
                    <Label>Motivo de la consulta (reasonCode) *</Label>
                    <Textarea
                      placeholder="Describe el motivo de la consulta..."
                      value={admissionData.reason}
                      onChange={(e) => setAdmissionData({...admissionData, reason: e.target.value})}
                      rows={3}
                      className="mt-2 rounded-xl resize-none"
                    />
                  </div>

                  {/* Diagnósticos - FHIR Condition with CIE-10/CIE-11 */}
                  <div className="relative">
                    <DiagnosisSearch
                      diagnoses={admissionData.diagnosticos || []}
                      onChange={(diags) => {
                        setAdmissionData(prev => ({
                          ...prev,
                          diagnosticos: diags,
                          diagnosticoPrincipal: diags.length > 0 ? `${diags[0].codigo} - ${diags[0].descripcion}` : "",
                        }));
                      }}
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <Label className="mb-3 block">Nivel de prioridad (priority)</Label>
                    <div className="flex gap-3">
                      {FHIR_PRIORITY_OPTIONS.map((priority) => (
                        <button
                          key={priority.value}
                          type="button"
                          onClick={() => setAdmissionData({...admissionData, priorityLevel: priority.value as any})}
                          className={cn(
                            "flex-1 py-3 px-4 rounded-2xl border-2 transition-all duration-200",
                            admissionData.priorityLevel === priority.value
                              ? "border-primary bg-primary/10 shadow-md"
                              : "border-border hover:border-primary/30"
                          )}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <div className={cn("w-3 h-3 rounded-full", priority.color)} />
                            <span className="font-medium">{priority.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Doctor + admitSource */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Profesional (participant)</Label>
                      <Select 
                        value={admissionData.assignedDoctor} 
                        onValueChange={(v) => setAdmissionData({...admissionData, assignedDoctor: v})}
                      >
                        <SelectTrigger className="h-11 rounded-xl mt-2">
                          <SelectValue placeholder="Sin asignar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin asignar</SelectItem>
                          <SelectItem value="Dr. Juan Pérez">Dr. Juan Pérez</SelectItem>
                          <SelectItem value="Dra. María González">Dra. María González</SelectItem>
                          <SelectItem value="Dr. Carlos Rodríguez">Dr. Carlos Rodríguez</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Origen de admisión (admitSource)</Label>
                      <Select
                        value={admissionData.hospitalizationAdmitSource}
                        onValueChange={(v) => setAdmissionData({...admissionData, hospitalizationAdmitSource: v})}
                      >
                        <SelectTrigger className="h-11 rounded-xl mt-2">
                          <SelectValue placeholder="Seleccionar origen" />
                        </SelectTrigger>
                        <SelectContent>
                          {ADMIT_SOURCE_OPTIONS.map(o => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Insurance */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Proveedor de seguro (coverage)</Label>
                      <Select 
                        value={admissionData.insuranceProvider} 
                        onValueChange={(v) => setAdmissionData({...admissionData, insuranceProvider: v})}
                      >
                        <SelectTrigger className="h-11 rounded-xl mt-2">
                          <SelectValue placeholder="Seleccionar seguro" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sin seguro">Sin seguro</SelectItem>
                          <SelectItem value="Seguro Universal">Seguro Universal</SelectItem>
                          <SelectItem value="MediSalud">MediSalud</SelectItem>
                          <SelectItem value="SeguroTotal">SeguroTotal</SelectItem>
                          <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Número de póliza</Label>
                      <Input
                        placeholder="Número de póliza o afiliación"
                        value={admissionData.insuranceNumber}
                        onChange={(e) => setAdmissionData({...admissionData, insuranceNumber: e.target.value})}
                        className="h-11 rounded-xl mt-2"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label>Notas adicionales</Label>
                    <Textarea
                      placeholder="Información adicional relevante..."
                      value={admissionData.notes}
                      onChange={(e) => setAdmissionData({...admissionData, notes: e.target.value})}
                      rows={2}
                      className="mt-2 rounded-xl resize-none"
                    />
                  </div>

                  {/* Custom Fields (FHIR Extensions) */}
                  {customFields.length > 0 && (
                    <div className="border-t border-border/50 pt-4 space-y-4">
                      <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <ClipboardList className="w-4 h-4" />
                        Campos personalizados (Extensiones FHIR)
                      </h4>
                      <DynamicFieldRenderer
                        fields={customFields}
                        values={admissionData.customFields || {}}
                        onChange={updateCustomField}
                      />
                    </div>
                  )}

                  {/* Post-save result feedback */}
                  {saveResult === "success" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <div>
                          <p className="font-medium">Admisión registrada exitosamente</p>
                          <p className="text-emerald-600/70 text-xs mt-0.5">Los datos han sido guardados correctamente</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => onComplete(admissionData)}
                        className="w-full h-14 rounded-2xl text-lg font-semibold"
                      >
                        <ArrowRight className="mr-2 w-5 h-5" />
                        Continuar a agenda
                      </Button>
                    </motion.div>
                  )}

                  {saveResult === "error" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
                        <XCircle className="w-5 h-5 shrink-0" />
                        <div>
                          <p className="font-medium">Error al registrar la admisión</p>
                          <p className="text-destructive/70 text-xs mt-0.5">{saveErrorMsg}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => { setSaveResult(null); setSaveErrorMsg(""); }}
                        variant="outline"
                        className="w-full h-12 rounded-2xl"
                      >
                        Intentar de nuevo
                      </Button>
                    </motion.div>
                  )}

                  {!saveResult && (
                    <Button
                      onClick={handleSubmit}
                      disabled={!admissionData.reason || isSaving}
                      className="w-full h-14 rounded-2xl text-lg font-semibold"
                    >
                      {isSaving ? (
                        <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                      ) : (
                        <ArrowRight className="mr-2 w-5 h-5" />
                      )}
                      {isSaving ? "Guardando..." : "Registrar admisión y continuar"}
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Back button */}
      <motion.div variants={itemVariants} className="flex justify-start pt-2">
        <Button
          variant="ghost"
          onClick={onBack}
          className="rounded-xl gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al paciente
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default AdmissionStep;
