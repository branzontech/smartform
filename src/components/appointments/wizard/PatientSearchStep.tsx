import React, { useState, useEffect } from "react";
import { DynamicFieldRenderer } from "@/components/config/DynamicFieldRenderer";
import type { DynamicFieldConfig } from "@/components/config/DynamicFieldConfigurator";
import { motion } from "framer-motion";
import { 
  Search, 
  UserPlus, 
  User,
  Phone, 
  Mail, 
  MapPin,
  Users,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ExtendedPatient, DOCUMENT_TYPES } from "../PatientPanel";
import { PatientStatusBadge } from "@/components/patients/PatientStatusBadge";
import { db } from "@/integrations/data/client";
import { toast } from "sonner";

// Using shared DynamicFieldConfig type from DynamicFieldConfigurator

interface PatientSearchStepProps {
  patients: ExtendedPatient[];
  onPatientSelected: (patient: ExtendedPatient) => void;
  onCreatePatient: (patient: Partial<ExtendedPatient>) => void;
}

export const PatientSearchStep: React.FC<PatientSearchStepProps> = ({
  patients,
  onPatientSelected,
  onCreatePatient
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCompanion, setShowCompanion] = useState(false);
  const [newPatient, setNewPatient] = useState<Partial<ExtendedPatient>>({});
  const [companionData, setCompanionData] = useState({
    name: "",
    relationship: "",
    phone: ""
  });
  const [dynamicFields, setDynamicFields] = useState<DynamicFieldConfig[]>([]);
  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>({});
  const [dbPatients, setDbPatients] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load dynamic field config
  useEffect(() => {
    const fetchDynamicFields = async () => {
      const { data, error } = await db
        .from("configuracion_campos_paciente")
        .select("*")
        .order("orden", { ascending: true });
      if (data && !error) {
        setDynamicFields(data.map((d: any) => ({ ...d, opciones: Array.isArray(d.opciones) ? d.opciones : [] })) as DynamicFieldConfig[]);
      }
    };
    fetchDynamicFields();
  }, []);

  // Search patients in DB
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setDbPatients([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const { data, error } = await db
        .from("pacientes")
        .select("*")
        .or(`numero_documento.ilike.%${searchTerm}%,nombres.ilike.%${searchTerm}%,apellidos.ilike.%${searchTerm}%`)
        .limit(20);

      if (data && !error) {
        setDbPatients(data);
      }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSelectDbPatient = (dbPatient: any) => {
    const mapped: ExtendedPatient = {
      id: dbPatient.id,
      firstName: dbPatient.nombres,
      lastName: dbPatient.apellidos,
      documentType: dbPatient.tipo_documento || "CC",
      documentId: dbPatient.numero_documento,
      dateOfBirth: dbPatient.fecha_nacimiento || "",
      gender: "Otro",
      contactNumber: dbPatient.telefono_principal,
      secondaryPhone: dbPatient.telefono_secundario || undefined,
      email: dbPatient.email || undefined,
      regime: dbPatient.regimen || undefined,
      zone: dbPatient.zona || undefined,
      address: dbPatient.direccion || undefined,
      city: dbPatient.ciudad || undefined,
      state: dbPatient.estado || undefined,
      occupation: dbPatient.ocupacion || undefined,
      patientStatus: dbPatient.estado_paciente || 'registrado',
      medicalRecordNumber: dbPatient.numero_historia || undefined,
      carnet: dbPatient.carnet || undefined,
      affiliationType: dbPatient.tipo_afiliacion || undefined,
    };
    onPatientSelected(mapped);
  };

  const handleCreatePatient = async () => {
    if (!newPatient.firstName || !newPatient.lastName || !newPatient.documentId || !newPatient.contactNumber) return;

    setIsSaving(true);
    try {
      // Build fhir_extensions from dynamic values
      const fhirExtensions: Record<string, any> = {};
      if (Object.keys(dynamicValues).length > 0) {
        fhirExtensions.custom_fields = dynamicValues;
      }
      if (showCompanion && companionData.name) {
        fhirExtensions.companion = companionData;
      }

      const { data, error } = await db
        .from("pacientes")
        .insert({
          nombres: newPatient.firstName,
          apellidos: newPatient.lastName,
          tipo_documento: newPatient.documentType || "CC",
          numero_documento: newPatient.documentId,
          fecha_nacimiento: newPatient.dateOfBirth || null,
          genero: newPatient.gender || null,
          telefono_principal: newPatient.contactNumber,
          telefono_secundario: newPatient.secondaryPhone || null,
          email: newPatient.email || null,
          regimen: newPatient.regime || null,
          zona: newPatient.zone || null,
          direccion: newPatient.address || null,
          ciudad: newPatient.city || null,
          estado: newPatient.state || null,
          ocupacion: newPatient.occupation || null,
          numero_historia: newPatient.medicalRecordNumber || null,
          carnet: newPatient.carnet || null,
          tipo_afiliacion: newPatient.affiliationType || null,
          fhir_extensions: fhirExtensions,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          toast.error("Ya existe un paciente con ese número de documento");
        } else {
          toast.error("Error al crear paciente: " + error.message);
        }
        return;
      }

      toast.success("Paciente creado exitosamente");

      const created: Partial<ExtendedPatient> = {
        id: data.id,
        firstName: data.nombres,
        lastName: data.apellidos,
        documentType: (data as any).tipo_documento || "CC",
        documentId: data.numero_documento,
        dateOfBirth: data.fecha_nacimiento || "",
        contactNumber: data.telefono_principal,
        secondaryPhone: data.telefono_secundario || undefined,
        email: data.email || undefined,
        regime: data.regimen as any,
        zone: data.zona as any,
        address: data.direccion || undefined,
        city: data.ciudad || undefined,
        state: data.estado || undefined,
        occupation: data.ocupacion || undefined,
        medicalRecordNumber: (data as any).numero_historia || undefined,
        carnet: (data as any).carnet || undefined,
        affiliationType: (data as any).tipo_afiliacion || undefined,
        companion: showCompanion && companionData.name ? companionData : undefined,
      };

      onCreatePatient(created);
    } finally {
      setIsSaving(false);
    }
  };

  // Combine local mock patients + DB patients for search results
  const filteredLocalPatients = patients.filter(patient => {
    const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || patient.documentId.includes(search);
  });

  const allResults = [
    ...filteredLocalPatients.map(p => ({ source: "local" as const, data: p })),
    ...dbPatients
      .filter(dbp => !filteredLocalPatients.some(lp => lp.documentId === dbp.numero_documento))
      .map(p => ({ source: "db" as const, data: p })),
  ];

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
      className="h-full max-w-3xl space-y-4 overflow-y-auto pb-24 pt-5 scrollbar-thin md:pt-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-end justify-between gap-3 px-1">
        <div className="space-y-0.5">
          <h2 className="text-[15px] font-semibold text-foreground">¿Quién es el paciente?</h2>
          <p className="text-[13px] text-muted-foreground">Búscalo por nombre o documento, o créalo si es nuevo.</p>
        </div>
        {!showCreateForm && (
          <button type="button" onClick={() => setShowCreateForm(true)} className="shrink-0 rounded-full px-3 py-1.5 text-[13px] font-semibold text-primary transition-colors hover:bg-primary/10 active:scale-[.97]">
            Crear paciente
          </button>
        )}
      </motion.div>

      {/* Search Card */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden rounded-card border-0 bg-card shadow-card dark:border dark:border-border dark:shadow-none">
          <CardContent className="p-0">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o número de documento..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowCreateForm(false);
                }}
                className="h-14 rounded-none border-0 bg-transparent pl-12 pr-12 text-[15px] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {isSearching && (
                <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Results */}
            {searchTerm && !showCreateForm && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-t border-border/60"
              >
                {allResults.length > 0 ? (
                  <>
                    <p className="px-5 pb-1 pt-3 text-xs text-muted-foreground">
                      {allResults.length} {allResults.length === 1 ? "paciente" : "pacientes"}
                    </p>
                    <div>
                      <div className="divide-y divide-border/60 pb-1">
                        {allResults.map((result, index) => {
                          const isLocal = result.source === "local";
                          const patient = result.data;
                          const firstName = isLocal ? (patient as ExtendedPatient).firstName : (patient as any).nombres;
                          const lastName = isLocal ? (patient as ExtendedPatient).lastName : (patient as any).apellidos;
                          const docId = isLocal ? (patient as ExtendedPatient).documentId : (patient as any).numero_documento;
                          const phone = isLocal ? (patient as ExtendedPatient).contactNumber : (patient as any).telefono_principal;

                          return (
                            <motion.div
                              key={`${result.source}-${isLocal ? (patient as ExtendedPatient).id : (patient as any).id}`}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: Math.min(index, 8) * 0.03 }}
                            >
                              <Card
                                className="group cursor-pointer rounded-none border-0 bg-transparent shadow-none transition-colors duration-200 hover:bg-muted/50 active:bg-muted/70"
                                onClick={() => {
                                  if (isLocal) {
                                    onPatientSelected(patient as ExtendedPatient);
                                  } else {
                                    handleSelectDbPatient(patient);
                                  }
                                }}
                              >
                                <CardContent className="px-5 py-3">
                                  <div className="flex items-center gap-3">
                                    <UserAvatar seed={`${firstName} ${lastName}`} alt={`${firstName} ${lastName}`} className="h-9 w-9" />
                                    <div className="flex-1 min-w-0">
                                      <p className="truncate text-[14.5px] font-semibold text-foreground">
                                        {firstName} {lastName}
                                      </p>
                                      <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                                        <span>{docId}</span>
                                        {phone && (
                                          <>
                                            <span>·</span>
                                            <span className="flex items-center gap-1">
                                              <Phone className="w-3 h-3" />
                                              {phone}
                                            </span>
                                          </>
                                        )}
                                        <PatientStatusBadge status={isLocal ? (patient as ExtendedPatient).patientStatus : (patient as any).estado_paciente} />
                                      </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : !isSearching ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between gap-3 px-5 py-4"
                  >
                    <p className="text-[13px] text-muted-foreground">Nadie con «{searchTerm}».</p>
                    <button type="button" onClick={() => setShowCreateForm(true)} className="shrink-0 rounded-full px-3 py-1.5 text-[13px] font-semibold text-primary transition-colors hover:bg-primary/10">
                      Crear paciente
                    </button>
                  </motion.div>
                ) : null}
              </motion.div>
            )}

            {/* Create Form */}
            {showCreateForm && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 border-t border-border/60 px-5 py-5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold text-foreground">Nuevo paciente</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewPatient({});
                      setDynamicValues({});
                    }}
                    className="rounded-xl"
                  >
                    Cancelar
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nombres *</Label>
                    <Input
                      placeholder="Nombres"
                      value={newPatient.firstName || ""}
                      onChange={(e) => setNewPatient({...newPatient, firstName: e.target.value})}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label>Apellidos *</Label>
                    <Input
                      placeholder="Apellidos"
                      value={newPatient.lastName || ""}
                      onChange={(e) => setNewPatient({...newPatient, lastName: e.target.value})}
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Tipo de documento *</Label>
                    <Select 
                      value={newPatient.documentType || "CC"} 
                      onValueChange={(value: any) => setNewPatient({...newPatient, documentType: value})}
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((dt) => (
                          <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Identificación *</Label>
                    <Input
                      placeholder="Número de documento"
                      value={newPatient.documentId || ""}
                      onChange={(e) => setNewPatient({...newPatient, documentId: e.target.value})}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label>Fecha de nacimiento</Label>
                    <Input
                      type="date"
                      value={newPatient.dateOfBirth || ""}
                      onChange={(e) => setNewPatient({...newPatient, dateOfBirth: e.target.value})}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label>Género</Label>
                    <Select 
                      value={newPatient.gender || ""} 
                      onValueChange={(value: any) => setNewPatient({...newPatient, gender: value})}
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Seleccionar género" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Femenino</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                        <SelectItem value="unknown">No especificado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Carnet</Label>
                    <Input
                      placeholder="Número de carnet"
                      value={newPatient.carnet || ""}
                      onChange={(e) => setNewPatient({...newPatient, carnet: e.target.value})}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label>Tipo de afiliación</Label>
                    <Input
                      placeholder="Tipo de afiliación"
                      value={newPatient.affiliationType || ""}
                      onChange={(e) => setNewPatient({...newPatient, affiliationType: e.target.value})}
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Teléfono principal *</Label>
                    <Input
                      placeholder="Teléfono"
                      value={newPatient.contactNumber || ""}
                      onChange={(e) => setNewPatient({...newPatient, contactNumber: e.target.value})}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label>Teléfono secundario</Label>
                    <Input
                      placeholder="Secundario"
                      value={newPatient.secondaryPhone || ""}
                      onChange={(e) => setNewPatient({...newPatient, secondaryPhone: e.target.value})}
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <Label>Correo electrónico</Label>
                  <Input
                    placeholder="correo@ejemplo.com"
                    type="email"
                    value={newPatient.email || ""}
                    onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Régimen</Label>
                    <Select 
                      value={newPatient.regime} 
                      onValueChange={(value: any) => setNewPatient({...newPatient, regime: value})}
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Seleccionar régimen" />
                      </SelectTrigger>
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
                    <Select 
                      value={newPatient.zone} 
                      onValueChange={(value: any) => setNewPatient({...newPatient, zone: value})}
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Zona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Urbana">Urbana</SelectItem>
                        <SelectItem value="Rural">Rural</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Dirección</Label>
                  <Input
                    placeholder="Dirección completa"
                    value={newPatient.address || ""}
                    onChange={(e) => setNewPatient({...newPatient, address: e.target.value})}
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Ciudad</Label>
                    <Input
                      placeholder="Ciudad"
                      value={newPatient.city || ""}
                      onChange={(e) => setNewPatient({...newPatient, city: e.target.value})}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Input
                      placeholder="Estado"
                      value={newPatient.state || ""}
                      onChange={(e) => setNewPatient({...newPatient, state: e.target.value})}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label>Ocupación</Label>
                    <Input
                      placeholder="Ocupación"
                      value={newPatient.occupation || ""}
                      onChange={(e) => setNewPatient({...newPatient, occupation: e.target.value})}
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>

                {/* Dynamic Fields from configuracion_campos_paciente */}
                {dynamicFields.length > 0 && (
                  <div className="space-y-4 p-4 bg-muted/20 rounded-2xl border border-border/30">
                    <Label className="text-base font-medium">Campos adicionales</Label>
                    <DynamicFieldRenderer
                      fields={dynamicFields}
                      values={dynamicValues}
                      onChange={(fieldId, value) => setDynamicValues({ ...dynamicValues, [fieldId]: value })}
                    />
                  </div>
                )}

                {/* Companion toggle */}
                <Button 
                  variant="outline" 
                  className="w-full justify-start rounded-xl h-12"
                  onClick={() => setShowCompanion(!showCompanion)}
                >
                  <Users className="mr-2 h-5 w-5" />
                  {showCompanion ? "Ocultar datos del acompañante" : "Agregar datos del acompañante"}
                </Button>

                {showCompanion && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4 p-4 bg-muted/30 rounded-2xl border border-border/30"
                  >
                    <Label className="text-base font-medium flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Datos del Acompañante
                    </Label>
                    <Input
                      placeholder="Nombre del acompañante"
                      value={companionData.name}
                      onChange={(e) => setCompanionData({...companionData, name: e.target.value})}
                      className="h-11 rounded-xl"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="Parentesco"
                        value={companionData.relationship}
                        onChange={(e) => setCompanionData({...companionData, relationship: e.target.value})}
                        className="h-11 rounded-xl"
                      />
                      <Input
                        placeholder="Teléfono"
                        value={companionData.phone}
                        onChange={(e) => setCompanionData({...companionData, phone: e.target.value})}
                        className="h-11 rounded-xl"
                      />
                    </div>
                  </motion.div>
                )}

                <Button
                  onClick={handleCreatePatient}
                  disabled={!newPatient.firstName || !newPatient.lastName || !newPatient.documentId || !newPatient.contactNumber || isSaving}
                  className="w-full h-14 rounded-2xl text-lg font-semibold"
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 w-5 h-5" />
                  )}
                  {isSaving ? "Guardando..." : "Continuar con este paciente"}
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default PatientSearchStep;
