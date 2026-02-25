import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  Shield,
  Globe,
  Users,
  ArrowRight,
  ArrowLeft,
  Edit2,
  Save,
  Loader2,
  FileText,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ExtendedPatient, DOCUMENT_TYPES } from "../PatientPanel";
import { PatientStatusBadge } from "@/components/patients/PatientStatusBadge";
import { AdmissionHistorySection } from "@/components/patients/AdmissionHistorySection";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PatientDetailStepProps {
  patient: ExtendedPatient;
  onContinue: () => void;
  onBack: () => void;
  onPatientUpdated: (patient: ExtendedPatient) => void;
}

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2.5 py-1.5">
    <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
    <div className="min-w-0 flex-1">
      <p className="text-[11px] text-muted-foreground leading-none mb-0.5">{label}</p>
      <p className={cn("text-sm", !value && "text-muted-foreground/60 italic")}>
        {value || "—"}
      </p>
    </div>
  </div>
);

export const PatientDetailStep: React.FC<PatientDetailStepProps> = ({
  patient,
  onContinue,
  onBack,
  onPatientUpdated,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<ExtendedPatient>>({});
  const [fhirExtensions, setFhirExtensions] = useState<any>({});

  // Load fhir_extensions from DB for companion data
  useEffect(() => {
    const loadExtensions = async () => {
      const { data } = await supabase
        .from("pacientes")
        .select("fhir_extensions")
        .eq("id", patient.id)
        .single();
      if (data?.fhir_extensions) {
        setFhirExtensions(data.fhir_extensions as Record<string, any>);
      }
    };
    loadExtensions();
  }, [patient.id]);

  const startEditing = () => {
    setEditData({ ...patient });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from("pacientes")
      .update({
        nombres: editData.firstName,
        apellidos: editData.lastName,
        tipo_documento: editData.documentType || "CC",
        telefono_principal: editData.contactNumber,
        telefono_secundario: editData.secondaryPhone || null,
        email: editData.email || null,
        regimen: editData.regime || null,
        zona: editData.zone || null,
        direccion: editData.address || null,
        ciudad: editData.city || null,
        estado: editData.state || null,
        ocupacion: editData.occupation || null,
        fecha_nacimiento: editData.dateOfBirth || null,
        numero_historia: editData.medicalRecordNumber || null,
        carnet: editData.carnet || null,
        tipo_afiliacion: editData.affiliationType || null,
      })
      .eq("id", patient.id);

    setIsSaving(false);

    if (error) {
      toast.error("Error al actualizar: " + error.message);
      return;
    }

    toast.success("Datos actualizados");
    const updated = { ...patient, ...editData } as ExtendedPatient;
    onPatientUpdated(updated);
    setIsEditing(false);
  };

  const companion = fhirExtensions?.companion;
  const customFields = fhirExtensions?.custom_fields;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col h-full w-full max-w-3xl mx-auto overflow-hidden"
    >
      {/* Header - fixed */}
      <motion.div variants={itemVariants} className="flex items-center justify-between shrink-0 pb-3 flex-none">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium text-sm">
            {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
          </div>
          <div>
            <h2 className="text-base font-medium leading-tight">
              {patient.firstName} {patient.lastName}
            </h2>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-muted-foreground">
                {patient.documentType || 'CC'} {patient.documentId}
                {patient.regime ? ` · ${patient.regime}` : ''}
                {patient.medicalRecordNumber ? ` · Hª ${patient.medicalRecordNumber}` : ''}
              </p>
              <PatientStatusBadge status={patient.patientStatus} />
            </div>
          </div>
        </div>
        {!isEditing ? (
          <Button variant="ghost" size="sm" onClick={startEditing} className="rounded-xl gap-1.5 text-muted-foreground">
            <Edit2 className="w-3.5 h-3.5" />
            Editar
          </Button>
        ) : (
          <div className="flex gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="rounded-xl text-muted-foreground">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="rounded-xl gap-1.5">
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Guardar
            </Button>
          </div>
        )}
      </motion.div>

      {/* Scrollable content area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <motion.div variants={itemVariants}>
          <Card className="bg-card/50 backdrop-blur-xl border-border/30 rounded-2xl shadow-none">
            <CardContent className="p-4">
              {!isEditing ? (
                /* Read-only view */
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-widest mb-2">
                    Información personal
                  </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    <InfoRow icon={User} label="Nombres" value={patient.firstName} />
                    <InfoRow icon={User} label="Apellidos" value={patient.lastName} />
                    <InfoRow icon={FileText} label="Tipo de documento" value={DOCUMENT_TYPES.find(d => d.value === patient.documentType)?.label || patient.documentType || 'CC'} />
                    <InfoRow icon={FileText} label="Identificación" value={patient.documentId} />
                    <InfoRow icon={Calendar} label="Fecha de nacimiento" value={patient.dateOfBirth} />
                    <InfoRow icon={ClipboardList} label="Nº de Historia" value={patient.medicalRecordNumber} />
                    <InfoRow icon={Phone} label="Teléfono principal" value={patient.contactNumber} />
                    <InfoRow icon={Phone} label="Teléfono secundario" value={patient.secondaryPhone} />
                    <InfoRow icon={Mail} label="Correo electrónico" value={patient.email} />
                    <InfoRow icon={Briefcase} label="Ocupación" value={patient.occupation} />
                  </div>

                  <Separator className="my-3" />
                  <p className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-widest mb-2">
                    Ubicación y régimen
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    <InfoRow icon={Shield} label="Régimen" value={patient.regime} />
                    <InfoRow icon={Shield} label="Tipo de afiliación" value={patient.affiliationType} />
                    <InfoRow icon={Shield} label="Carnet" value={patient.carnet} />
                    <InfoRow icon={Globe} label="Zona" value={patient.zone} />
                    <InfoRow icon={MapPin} label="Dirección" value={patient.address} />
                    <InfoRow icon={MapPin} label="Ciudad" value={patient.city} />
                    <InfoRow icon={MapPin} label="Departamento" value={patient.state} />
                  </div>

                  {/* Companion info */}
                  {companion && companion.name && (
                    <>
                      <Separator className="my-3" />
                      <p className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-widest mb-2">
                        Acompañante
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                        <InfoRow icon={Users} label="Nombre" value={companion.name} />
                        <InfoRow icon={Users} label="Parentesco" value={companion.relationship} />
                        <InfoRow icon={Phone} label="Teléfono" value={companion.phone} />
                      </div>
                    </>
                  )}

                  {/* Custom fields */}
                   {customFields && Object.keys(customFields).length > 0 && (
                    <>
                      <Separator className="my-3" />
                      <p className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-widest mb-2">
                        Campos adicionales
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                        {Object.entries(customFields).map(([key, val]) => (
                          <InfoRow key={key} icon={FileText} label={key} value={String(val)} />
                        ))}
                      </div>
                    </>
                  )}

                  <Separator className="my-3" />
                  <p className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-widest mb-2">
                    Historial de admisiones
                  </p>
                  <AdmissionHistorySection patientId={patient.id} />
                </div>
              ) : (
                /* Edit mode */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nombres</Label>
                      <Input value={editData.firstName || ""} onChange={(e) => setEditData({ ...editData, firstName: e.target.value })} className="h-11 rounded-xl" />
                    </div>
                    <div>
                      <Label>Apellidos</Label>
                      <Input value={editData.lastName || ""} onChange={(e) => setEditData({ ...editData, lastName: e.target.value })} className="h-11 rounded-xl" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Tipo de documento</Label>
                      <Select value={editData.documentType || "CC"} onValueChange={(v) => setEditData({ ...editData, documentType: v as any })}>
                        <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_TYPES.map((dt) => (
                            <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Fecha de nacimiento</Label>
                      <Input type="date" value={editData.dateOfBirth || ""} onChange={(e) => setEditData({ ...editData, dateOfBirth: e.target.value })} className="h-11 rounded-xl" />
                    </div>
                    <div>
                      <Label>Nº de Historia</Label>
                      <Input value={editData.medicalRecordNumber || ""} onChange={(e) => setEditData({ ...editData, medicalRecordNumber: e.target.value })} className="h-11 rounded-xl" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Teléfono principal</Label>
                      <Input value={editData.contactNumber || ""} onChange={(e) => setEditData({ ...editData, contactNumber: e.target.value })} className="h-11 rounded-xl" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Teléfono secundario</Label>
                      <Input value={editData.secondaryPhone || ""} onChange={(e) => setEditData({ ...editData, secondaryPhone: e.target.value })} className="h-11 rounded-xl" />
                    </div>
                    <div>
                      <Label>Correo electrónico</Label>
                      <Input type="email" value={editData.email || ""} onChange={(e) => setEditData({ ...editData, email: e.target.value })} className="h-11 rounded-xl" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Régimen</Label>
                      <Select value={editData.regime || ""} onValueChange={(v) => setEditData({ ...editData, regime: v as any })}>
                        <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Contributivo">Contributivo</SelectItem>
                          <SelectItem value="Subsidiado">Subsidiado</SelectItem>
                          <SelectItem value="Vinculado">Vinculado</SelectItem>
                          <SelectItem value="Particular">Particular</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Carnet</Label>
                      <Input value={editData.carnet || ""} onChange={(e) => setEditData({ ...editData, carnet: e.target.value })} className="h-11 rounded-xl" />
                    </div>
                    <div>
                      <Label>Tipo de afiliación</Label>
                      <Input value={editData.affiliationType || ""} onChange={(e) => setEditData({ ...editData, affiliationType: e.target.value })} className="h-11 rounded-xl" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Zona</Label>
                      <Select value={editData.zone || ""} onValueChange={(v) => setEditData({ ...editData, zone: v as any })}>
                        <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Zona" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Urbana">Urbana</SelectItem>
                          <SelectItem value="Rural">Rural</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Dirección</Label>
                    <Input value={editData.address || ""} onChange={(e) => setEditData({ ...editData, address: e.target.value })} className="h-11 rounded-xl" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Ciudad</Label>
                      <Input value={editData.city || ""} onChange={(e) => setEditData({ ...editData, city: e.target.value })} className="h-11 rounded-xl" />
                    </div>
                    <div>
                      <Label>Departamento</Label>
                      <Input value={editData.state || ""} onChange={(e) => setEditData({ ...editData, state: e.target.value })} className="h-11 rounded-xl" />
                    </div>
                    <div>
                      <Label>Ocupación</Label>
                      <Input value={editData.occupation || ""} onChange={(e) => setEditData({ ...editData, occupation: e.target.value })} className="h-11 rounded-xl" />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

    </motion.div>
  );
};

export default PatientDetailStep;
