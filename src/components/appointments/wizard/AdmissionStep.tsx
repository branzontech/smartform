import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  ClipboardList, 
  ArrowRight, 
  ArrowLeft,
  User,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

export interface AdmissionData {
  reason: string;
  appointmentType: string;
  priorityLevel: "Normal" | "Urgente" | "Emergencia";
  insuranceProvider?: string;
  insuranceNumber?: string;
  assignedDoctor?: string;
  notes?: string;
}

interface AdmissionStepProps {
  patient: ExtendedPatient;
  onComplete: (admission: AdmissionData | null) => void;
  onBack: () => void;
}

export const AdmissionStep: React.FC<AdmissionStepProps> = ({
  patient,
  onComplete,
  onBack
}) => {
  const [wantsAdmission, setWantsAdmission] = useState<boolean | null>(null);
  const [admissionData, setAdmissionData] = useState<AdmissionData>({
    reason: "",
    appointmentType: "Consulta",
    priorityLevel: "Normal",
    insuranceProvider: "",
    insuranceNumber: "",
    assignedDoctor: "",
    notes: ""
  });

  const handleSkip = () => {
    onComplete(null);
  };

  const handleSubmit = () => {
    onComplete(admissionData);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
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
      className="space-y-6"
    >
      {/* Header - Compact */}
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
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 rounded-3xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/20 flex items-center justify-center text-primary text-xl font-bold">
                {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-lg">
                  {patient.firstName} {patient.lastName}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{patient.documentId}</span>
                  {patient.contactNumber && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {patient.contactNumber}
                    </span>
                  )}
                </div>
              </div>
              {patient.regime && (
                <Badge variant="secondary" className="rounded-xl">
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
              "cursor-pointer transition-all duration-300 border-2 rounded-3xl overflow-hidden",
              "hover:shadow-xl hover:scale-[1.02] hover:border-primary/50",
              "active:scale-[0.98]"
            )}
            onClick={() => setWantsAdmission(true)}
          >
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Sí, admitir ahora</h3>
              <p className="text-muted-foreground text-sm">
                Registrar motivo de consulta, tipo de cita, prioridad y otros datos de admisión
              </p>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "cursor-pointer transition-all duration-300 border-2 rounded-3xl overflow-hidden",
              "hover:shadow-xl hover:scale-[1.02] hover:border-muted-foreground/30",
              "active:scale-[0.98]"
            )}
            onClick={handleSkip}
          >
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No, solo agendar</h3>
              <p className="text-muted-foreground text-sm">
                Ir directamente a seleccionar fecha y hora de la cita
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
        >
          <Card className="bg-card/60 backdrop-blur-xl border-border/30 shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Datos de Admisión
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

              <div>
                <Label>Motivo de la consulta *</Label>
                <Textarea
                  placeholder="Describe el motivo de la consulta..."
                  value={admissionData.reason}
                  onChange={(e) => setAdmissionData({...admissionData, reason: e.target.value})}
                  rows={3}
                  className="mt-2 rounded-xl resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de consulta</Label>
                  <Select 
                    value={admissionData.appointmentType} 
                    onValueChange={(value) => setAdmissionData({...admissionData, appointmentType: value})}
                  >
                    <SelectTrigger className="h-11 rounded-xl mt-2">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Consulta">Consulta general</SelectItem>
                      <SelectItem value="Especialista">Especialista</SelectItem>
                      <SelectItem value="Urgencia">Urgencia</SelectItem>
                      <SelectItem value="Control">Control de tratamiento</SelectItem>
                      <SelectItem value="Procedimiento">Procedimiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Médico asignado</Label>
                  <Select 
                    value={admissionData.assignedDoctor} 
                    onValueChange={(value) => setAdmissionData({...admissionData, assignedDoctor: value})}
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
              </div>

              <div>
                <Label className="mb-3 block">Nivel de prioridad</Label>
              <div className="flex gap-3">
                  {[
                    { value: "Normal", color: "bg-emerald-500", label: "Normal" },
                    { value: "Urgente", color: "bg-yellow-500", label: "Urgente" },
                    { value: "Emergencia", color: "bg-destructive", label: "Emergencia" }
                  ].map((priority) => (
                    <button
                      key={priority.value}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Proveedor de seguro</Label>
                  <Select 
                    value={admissionData.insuranceProvider} 
                    onValueChange={(value) => setAdmissionData({...admissionData, insuranceProvider: value})}
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

              <Button
                onClick={handleSubmit}
                disabled={!admissionData.reason}
                className="w-full h-14 rounded-2xl text-lg font-semibold"
              >
                <ArrowRight className="mr-2 w-5 h-5" />
                Continuar al agendamiento
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Back button */}
      <motion.div variants={itemVariants} className="flex justify-start">
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
