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
import { ExtendedPatient } from "../PatientPanel";
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
  <div className="flex items-start gap-3 py-2">
    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-medium", !value && "text-muted-foreground italic")}>
        {value || "No registrado"}
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
      className="space-y-4 max-w-3xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold text-lg">
            {patient.firstName?.charAt(0)}
            {patient.lastName?.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              {patient.firstName} {patient.lastName}
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {patient.documentId}
              </Badge>
              {patient.regime && (
                <Badge variant="secondary" className="text-xs">
                  {patient.regime}
                </Badge>
              )}
            </div>
          </div>
        </div>
        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={startEditing} className="rounded-xl gap-1.5">
            <Edit2 className="w-4 h-4" />
            Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="rounded-xl gap-1.5">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar
            </Button>
          </div>
        )}
      </motion.div>

      {/* Detail Card */}
      <motion.div variants={itemVariants}>
        <Card className="bg-card/60 backdrop-blur-xl border-border/30 shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-5">
            {!isEditing ? (
              /* Read-only view */
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Información personal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  <InfoRow icon={User} label="Nombres" value={patient.firstName} />
                  <InfoRow icon={User} label="Apellidos" value={patient.lastName} />
                  <InfoRow icon={FileText} label="Documento" value={patient.documentId} />
                  <InfoRow icon={Calendar} label="Fecha de nacimiento" value={patient.dateOfBirth} />
                  <InfoRow icon={Phone} label="Teléfono principal" value={patient.contactNumber} />
                  <InfoRow icon={Phone} label="Teléfono secundario" value={patient.secondaryPhone} />
                  <InfoRow icon={Mail} label="Correo electrónico" value={patient.email} />
                  <InfoRow icon={Briefcase} label="Ocupación" value={patient.occupation} />
                </div>

                <Separator className="my-3" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Ubicación y régimen
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  <InfoRow icon={Shield} label="Régimen" value={patient.regime} />
                  <InfoRow icon={Globe} label="Zona" value={patient.zone} />
                  <InfoRow icon={MapPin} label="Dirección" value={patient.address} />
                  <InfoRow icon={MapPin} label="Ciudad" value={patient.city} />
                  <InfoRow icon={MapPin} label="Departamento" value={patient.state} />
                </div>

                {/* Companion info */}
                {companion && companion.name && (
                  <>
                    <Separator className="my-3" />
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Acompañante
                    </h3>
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
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Campos adicionales
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                      {Object.entries(customFields).map(([key, val]) => (
                        <InfoRow key={key} icon={FileText} label={key} value={String(val)} />
                      ))}
                    </div>
                  </>
                )}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Fecha de nacimiento</Label>
                    <Input type="date" value={editData.dateOfBirth || ""} onChange={(e) => setEditData({ ...editData, dateOfBirth: e.target.value })} className="h-11 rounded-xl" />
                  </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Action buttons */}
      <motion.div variants={itemVariants} className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={onBack} className="rounded-xl gap-2">
          <ArrowLeft className="w-4 h-4" />
          Buscar otro paciente
        </Button>
        <Button onClick={onContinue} className="rounded-xl h-12 px-6 gap-2 text-base font-semibold">
          Continuar
          <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default PatientDetailStep;
