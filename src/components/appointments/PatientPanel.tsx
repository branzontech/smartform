import React, { useState } from "react";
import { 
  Search, 
  UserPlus, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Building2,
  Users,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Home,
  TreePine
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Tipo extendido de paciente con nuevos campos
export interface ExtendedPatient {
  id: string;
  firstName: string;
  lastName: string;
  documentId: string;
  dateOfBirth: string;
  gender: 'Masculino' | 'Femenino' | 'Otro';
  contactNumber: string;
  secondaryPhone?: string;
  email?: string;
  regime?: 'Contributivo' | 'Subsidiado' | 'Vinculado' | 'Particular';
  address?: string;
  city?: string;
  state?: string;
  province?: string;
  zone?: 'Rural' | 'Urbana';
  occupation?: string;
  companion?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

interface PatientPanelProps {
  patients: ExtendedPatient[];
  selectedPatient: ExtendedPatient | null;
  onSelectPatient: (patient: ExtendedPatient) => void;
  onCreatePatient: (patient: Partial<ExtendedPatient>) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const PatientPanel: React.FC<PatientPanelProps> = ({
  patients,
  selectedPatient,
  onSelectPatient,
  onCreatePatient,
  isCollapsed,
  onToggleCollapse
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
    const patientToCreate = {
      ...newPatient,
      id: Date.now().toString(),
      companion: showCompanion ? companionData : undefined
    };
    onCreatePatient(patientToCreate);
    setNewPatient({});
    setCompanionData({ name: "", relationship: "", phone: "" });
    setShowCreateForm(false);
    setShowCompanion(false);
  };

  // Versión colapsada
  if (isCollapsed) {
    return (
      <div className="w-14 bg-card/50 backdrop-blur-sm border-r border-border/50 flex flex-col items-center py-4 gap-4 sticky top-0 h-screen">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="rounded-full hover:bg-primary/10"
        >
          <ChevronRight size={18} />
        </Button>
        <Separator className="w-8" />
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-primary/10"
          title="Buscar paciente"
        >
          <Search size={18} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-primary/10"
          title="Nuevo paciente"
        >
          <UserPlus size={18} />
        </Button>
        {selectedPatient && (
          <>
            <Separator className="w-8" />
            <div 
              className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium"
              title={`${selectedPatient.firstName} ${selectedPatient.lastName}`}
            >
              {selectedPatient.firstName.charAt(0)}{selectedPatient.lastName.charAt(0)}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="w-80 lg:w-96 bg-card/50 backdrop-blur-sm border-r border-border/50 flex flex-col sticky top-0 h-screen">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Paciente</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="rounded-full hover:bg-primary/10"
          >
            <ChevronLeft size={18} />
          </Button>
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background/50 border-border/50 rounded-xl"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Lista de pacientes encontrados */}
          {searchTerm && !selectedPatient && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Resultados ({filteredPatients.length})
              </Label>
              {filteredPatients.length > 0 ? (
                filteredPatients.slice(0, 5).map((patient) => (
                  <Card 
                    key={patient.id}
                    className="cursor-pointer hover:bg-accent/50 transition-colors border-border/50"
                    onClick={() => onSelectPatient(patient)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                          {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {patient.documentId}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm mb-3">
                    No se encontró el paciente
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowCreateForm(true)}
                    className="rounded-xl"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Crear nuevo paciente
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Formulario de creación */}
          {showCreateForm && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Nuevo Paciente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Nombres</Label>
                    <Input
                      placeholder="Nombres"
                      value={newPatient.firstName || ""}
                      onChange={(e) => setNewPatient({...newPatient, firstName: e.target.value})}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Apellidos</Label>
                    <Input
                      placeholder="Apellidos"
                      value={newPatient.lastName || ""}
                      onChange={(e) => setNewPatient({...newPatient, lastName: e.target.value})}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Documento</Label>
                  <Input
                    placeholder="Número de documento"
                    value={newPatient.documentId || ""}
                    onChange={(e) => setNewPatient({...newPatient, documentId: e.target.value})}
                    className="h-9 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Teléfono</Label>
                    <Input
                      placeholder="Teléfono"
                      value={newPatient.contactNumber || ""}
                      onChange={(e) => setNewPatient({...newPatient, contactNumber: e.target.value})}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Teléfono 2</Label>
                    <Input
                      placeholder="Secundario"
                      value={newPatient.secondaryPhone || ""}
                      onChange={(e) => setNewPatient({...newPatient, secondaryPhone: e.target.value})}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Correo electrónico</Label>
                  <Input
                    placeholder="correo@ejemplo.com"
                    type="email"
                    value={newPatient.email || ""}
                    onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                    className="h-9 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs">Régimen</Label>
                  <Select 
                    value={newPatient.regime} 
                    onValueChange={(value: any) => setNewPatient({...newPatient, regime: value})}
                  >
                    <SelectTrigger className="h-9 text-sm">
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
                  <Label className="text-xs">Dirección</Label>
                  <Input
                    placeholder="Dirección completa"
                    value={newPatient.address || ""}
                    onChange={(e) => setNewPatient({...newPatient, address: e.target.value})}
                    className="h-9 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Ciudad</Label>
                    <Input
                      placeholder="Ciudad"
                      value={newPatient.city || ""}
                      onChange={(e) => setNewPatient({...newPatient, city: e.target.value})}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Estado/Provincia</Label>
                    <Input
                      placeholder="Estado"
                      value={newPatient.state || ""}
                      onChange={(e) => setNewPatient({...newPatient, state: e.target.value})}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Zona</Label>
                    <Select 
                      value={newPatient.zone} 
                      onValueChange={(value: any) => setNewPatient({...newPatient, zone: value})}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Zona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Urbana">Urbana</SelectItem>
                        <SelectItem value="Rural">Rural</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Ocupación</Label>
                    <Input
                      placeholder="Ocupación"
                      value={newPatient.occupation || ""}
                      onChange={(e) => setNewPatient({...newPatient, occupation: e.target.value})}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Toggle acompañante */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-muted-foreground"
                  onClick={() => setShowCompanion(!showCompanion)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  {showCompanion ? "Ocultar acompañante" : "Agregar acompañante"}
                </Button>

                {showCompanion && (
                  <div className="space-y-2 p-3 bg-background/50 rounded-lg border border-border/50">
                    <Label className="text-xs font-medium">Datos del Acompañante</Label>
                    <Input
                      placeholder="Nombre del acompañante"
                      value={companionData.name}
                      onChange={(e) => setCompanionData({...companionData, name: e.target.value})}
                      className="h-9 text-sm"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Parentesco"
                        value={companionData.relationship}
                        onChange={(e) => setCompanionData({...companionData, relationship: e.target.value})}
                        className="h-9 text-sm"
                      />
                      <Input
                        placeholder="Teléfono"
                        value={companionData.phone}
                        onChange={(e) => setCompanionData({...companionData, phone: e.target.value})}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewPatient({});
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={handleCreatePatient}
                    disabled={!newPatient.firstName || !newPatient.lastName || !newPatient.documentId}
                  >
                    Guardar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Paciente seleccionado */}
          {selectedPatient && (
            <div className="space-y-4">
              <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl font-semibold">
                      {selectedPatient.firstName.charAt(0)}{selectedPatient.lastName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedPatient.documentId}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Contacto */}
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedPatient.contactNumber}</span>
                      {selectedPatient.secondaryPhone && (
                        <span className="text-muted-foreground">
                          / {selectedPatient.secondaryPhone}
                        </span>
                      )}
                    </div>

                    {selectedPatient.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{selectedPatient.email}</span>
                      </div>
                    )}

                    {/* Régimen */}
                    {selectedPatient.regime && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="secondary" className="text-xs">
                          {selectedPatient.regime}
                        </Badge>
                      </div>
                    )}

                    {/* Dirección */}
                    {selectedPatient.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p>{selectedPatient.address}</p>
                          {(selectedPatient.city || selectedPatient.state) && (
                            <p className="text-muted-foreground">
                              {[selectedPatient.city, selectedPatient.state].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Zona */}
                    {selectedPatient.zone && (
                      <div className="flex items-center gap-2 text-sm">
                        {selectedPatient.zone === "Rural" ? (
                          <TreePine className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Home className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span>Zona {selectedPatient.zone}</span>
                      </div>
                    )}

                    {/* Ocupación */}
                    {selectedPatient.occupation && (
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedPatient.occupation}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Acompañante */}
              {selectedPatient.companion && (
                <Card className="border-border/50">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Acompañante
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0">
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">{selectedPatient.companion.name}</p>
                      <p className="text-muted-foreground">
                        {selectedPatient.companion.relationship}
                      </p>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{selectedPatient.companion.phone}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Botón cambiar paciente */}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => onSelectPatient(null as any)}
              >
                Cambiar paciente
              </Button>
            </div>
          )}

          {/* Estado inicial sin búsqueda */}
          {!searchTerm && !selectedPatient && !showCreateForm && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                Busca un paciente existente o crea uno nuevo
              </p>
              <Button 
                variant="outline"
                onClick={() => setShowCreateForm(true)}
                className="rounded-xl"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Nuevo paciente
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
