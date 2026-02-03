import React, { useState } from "react";
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
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ExtendedPatient } from "../PatientPanel";

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

  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || patient.documentId.includes(search);
  });

  const handleCreatePatient = () => {
    const patientToCreate: Partial<ExtendedPatient> = {
      ...newPatient,
      id: Date.now().toString(),
      companion: showCompanion && companionData.name ? companionData : undefined
    };
    onCreatePatient(patientToCreate);
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
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 mb-4">
          <User className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">¿Quién es el paciente?</h2>
        <p className="text-muted-foreground mt-1">
          Busca un paciente existente o crea uno nuevo
        </p>
      </motion.div>

      {/* Search Card */}
      <motion.div variants={itemVariants}>
        <Card className="bg-card/60 backdrop-blur-xl border-border/30 shadow-xl rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            {/* Search Input */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o número de documento..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowCreateForm(false);
                }}
                className="pl-12 h-14 text-lg bg-background/50 border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Results or Create Form */}
            {searchTerm && !showCreateForm && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {filteredPatients.length > 0 ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {filteredPatients.length} resultado(s) encontrado(s)
                    </p>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-3 pr-4">
                        {filteredPatients.map((patient, index) => (
                          <motion.div
                            key={patient.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Card
                              className={cn(
                                "cursor-pointer transition-all duration-200 border-border/30",
                                "hover:bg-primary/5 hover:border-primary/30 hover:shadow-lg",
                                "active:scale-[0.98]"
                              )}
                              onClick={() => onPatientSelected(patient)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                                    {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-lg truncate">
                                      {patient.firstName} {patient.lastName}
                                    </p>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                      <span>{patient.documentId}</span>
                                      {patient.contactNumber && (
                                        <>
                                          <span>•</span>
                                          <span className="flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            {patient.contactNumber}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-16 h-16 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-4">
                      No se encontraron pacientes con "{searchTerm}"
                    </p>
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      className="rounded-2xl h-12 px-6 gap-2"
                    >
                      <UserPlus className="w-5 h-5" />
                      Crear nuevo paciente
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Empty state */}
            {!searchTerm && !showCreateForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
                <p className="text-muted-foreground text-lg mb-6">
                  Comienza escribiendo el nombre o documento del paciente
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(true)}
                  className="rounded-2xl h-12 px-6 gap-2"
                >
                  <UserPlus className="w-5 h-5" />
                  O crea un nuevo paciente
                </Button>
              </motion.div>
            )}

            {/* Create Form */}
            {showCreateForm && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-primary" />
                    Nuevo Paciente
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewPatient({});
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Documento *</Label>
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
                  disabled={!newPatient.firstName || !newPatient.lastName || !newPatient.documentId || !newPatient.contactNumber}
                  className="w-full h-14 rounded-2xl text-lg font-semibold"
                >
                  <ArrowRight className="mr-2 w-5 h-5" />
                  Continuar con este paciente
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
