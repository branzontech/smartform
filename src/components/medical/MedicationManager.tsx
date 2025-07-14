import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Search, 
  Package, 
  Pill, 
  AlertTriangle, 
  Check, 
  X, 
  ShoppingCart,
  Clock,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { nanoid } from "nanoid";

interface MedicationItem {
  id: string;
  name: string;
  type: 'medicamento' | 'insumo';
  stock: number;
  unit: string;
  price: number;
  description?: string;
  category: string;
}

interface RequestItem {
  id: string;
  medicationId: string;
  medicationName: string;
  quantity: number;
  unit: string;
  priority: 'baja' | 'media' | 'alta';
  notes?: string;
  status: 'pendiente' | 'aprobada' | 'rechazada' | 'entregada';
  requestedAt: Date;
}

interface MedicationManagerProps {
  consultationId?: string;
  patientId?: string;
  className?: string;
}

export const MedicationManager: React.FC<MedicationManagerProps> = ({
  consultationId,
  patientId,
  className = ""
}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [selectedType, setSelectedType] = useState("todos");
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [isRequesting, setIsRequesting] = useState(false);
  const [currentRequest, setCurrentRequest] = useState({
    medicationId: "",
    quantity: 1,
    priority: "media" as const,
    notes: ""
  });

  // Mock data - en una implementación real vendría de la API
  useEffect(() => {
    const mockMedications: MedicationItem[] = [
      {
        id: "med-1",
        name: "Paracetamol 500mg",
        type: "medicamento",
        stock: 150,
        unit: "tabletas",
        price: 0.25,
        category: "analgesico",
        description: "Analgésico y antipirético"
      },
      {
        id: "med-2",
        name: "Ibuprofeno 400mg",
        type: "medicamento",
        stock: 80,
        unit: "tabletas",
        price: 0.45,
        category: "antiinflamatorio",
        description: "Antiinflamatorio no esteroidal"
      },
      {
        id: "ins-1",
        name: "Jeringas 5ml",
        type: "insumo",
        stock: 200,
        unit: "unidades",
        price: 0.15,
        category: "material_medico",
        description: "Jeringas desechables estériles"
      },
      {
        id: "ins-2",
        name: "Gasas estériles",
        type: "insumo",
        stock: 50,
        unit: "paquetes",
        price: 2.50,
        category: "curacion",
        description: "Gasas estériles 10x10cm"
      },
      {
        id: "med-3",
        name: "Amoxicilina 500mg",
        type: "medicamento",
        stock: 25,
        unit: "cápsulas",
        price: 0.80,
        category: "antibiotico",
        description: "Antibiótico de amplio espectro"
      }
    ];
    setMedications(mockMedications);

    // Cargar solicitudes existentes
    const savedRequests = localStorage.getItem("medicationRequests");
    if (savedRequests) {
      const parsedRequests = JSON.parse(savedRequests).map((req: any) => ({
        ...req,
        requestedAt: new Date(req.requestedAt)
      }));
      setRequests(parsedRequests);
    }
  }, []);

  const filteredMedications = medications.filter(med => {
    const matchesSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "todos" || med.category === selectedCategory;
    const matchesType = selectedType === "todos" || med.type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const getStockBadgeColor = (stock: number) => {
    if (stock === 0) return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
    if (stock < 20) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
    return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case 'media': return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case 'baja': return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente': return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case 'aprobada': return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case 'rechazada': return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case 'entregada': return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const handleAddToRequest = (medication: MedicationItem) => {
    if (medication.stock === 0) {
      toast({
        title: "Sin stock",
        description: "Este medicamento/insumo no tiene stock disponible",
        variant: "destructive"
      });
      return;
    }

    setCurrentRequest({
      medicationId: medication.id,
      quantity: 1,
      priority: "media",
      notes: ""
    });
    setIsRequesting(true);
  };

  const handleSubmitRequest = () => {
    const medication = medications.find(m => m.id === currentRequest.medicationId);
    if (!medication) return;

    if (currentRequest.quantity > medication.stock) {
      toast({
        title: "Cantidad excede stock",
        description: `Solo hay ${medication.stock} ${medication.unit} disponibles`,
        variant: "destructive"
      });
      return;
    }

    const newRequest: RequestItem = {
      id: nanoid(),
      medicationId: currentRequest.medicationId,
      medicationName: medication.name,
      quantity: currentRequest.quantity,
      unit: medication.unit,
      priority: currentRequest.priority,
      notes: currentRequest.notes,
      status: "pendiente",
      requestedAt: new Date()
    };

    const updatedRequests = [...requests, newRequest];
    setRequests(updatedRequests);
    localStorage.setItem("medicationRequests", JSON.stringify(updatedRequests));

    // Actualizar stock localmente (simulado)
    const updatedMedications = medications.map(med =>
      med.id === medication.id
        ? { ...med, stock: med.stock - currentRequest.quantity }
        : med
    );
    setMedications(updatedMedications);

    toast({
      title: "Solicitud creada",
      description: `Se ha solicitado ${currentRequest.quantity} ${medication.unit} de ${medication.name}`,
    });

    setIsRequesting(false);
    setCurrentRequest({
      medicationId: "",
      quantity: 1,
      priority: "media",
      notes: ""
    });
  };

  const categories = [
    { value: "todos", label: "Todas las categorías" },
    { value: "analgesico", label: "Analgésicos" },
    { value: "antiinflamatorio", label: "Antiinflamatorios" },
    { value: "antibiotico", label: "Antibióticos" },
    { value: "material_medico", label: "Material médico" },
    { value: "curacion", label: "Curación" }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Medicamentos e Insumos
          </CardTitle>
          <CardDescription>
            Solicitar medicamentos e insumos médicos para la atención del paciente
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="solicitar" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="solicitar" className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Solicitar
              </TabsTrigger>
              <TabsTrigger value="historial" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Historial
              </TabsTrigger>
            </TabsList>

            <TabsContent value="solicitar" className="space-y-4">
              {/* Filtros */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar medicamentos o insumos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="medicamento">Medicamentos</SelectItem>
                    <SelectItem value="insumo">Insumos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Lista de medicamentos */}
              <div className="grid gap-3 max-h-60 overflow-y-auto">
                {filteredMedications.map((medication) => (
                  <div key={medication.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {medication.type === 'medicamento' ? (
                            <Pill className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Package className="w-4 h-4 text-green-500" />
                          )}
                          <h4 className="font-medium text-sm">{medication.name}</h4>
                          <Badge className={`text-xs ${getStockBadgeColor(medication.stock)}`}>
                            {medication.stock} {medication.unit}
                          </Badge>
                        </div>
                        {medication.description && (
                          <p className="text-xs text-muted-foreground mb-2">
                            {medication.description}
                          </p>
                        )}
                        <p className="text-xs font-medium text-primary">
                          ${medication.price.toFixed(2)} por {medication.unit.slice(0, -1)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddToRequest(medication)}
                        disabled={medication.stock === 0}
                        className="ml-4"
                      >
                        {medication.stock === 0 ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredMedications.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No se encontraron medicamentos o insumos</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="historial" className="space-y-4">
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {requests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{request.medicationName}</h4>
                      <div className="flex gap-2">
                        <Badge className={`text-xs ${getPriorityColor(request.priority)}`}>
                          {request.priority}
                        </Badge>
                        <Badge className={`text-xs ${getStatusColor(request.status)}`}>
                          {request.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Cantidad: {request.quantity} {request.unit}</span>
                      <span>{request.requestedAt.toLocaleDateString()}</span>
                    </div>
                    {request.notes && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        "{request.notes}"
                      </p>
                    )}
                  </div>
                ))}
                
                {requests.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay solicitudes registradas</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal de solicitud */}
      {isRequesting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-lg">Solicitar Medicamento/Insumo</CardTitle>
              <CardDescription>
                {medications.find(m => m.id === currentRequest.medicationId)?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="quantity">Cantidad</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={medications.find(m => m.id === currentRequest.medicationId)?.stock}
                  value={currentRequest.quantity}
                  onChange={(e) => setCurrentRequest(prev => ({
                    ...prev,
                    quantity: parseInt(e.target.value) || 1
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="priority">Prioridad</Label>
                <Select 
                  value={currentRequest.priority} 
                  onValueChange={(value: any) => setCurrentRequest(prev => ({
                    ...prev,
                    priority: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Instrucciones especiales o notas adicionales..."
                  value={currentRequest.notes}
                  onChange={(e) => setCurrentRequest(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                />
              </div>
            </CardContent>
            <div className="flex gap-2 p-6 pt-0">
              <Button
                variant="outline"
                onClick={() => setIsRequesting(false)}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitRequest}
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-2" />
                Solicitar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MedicationManager;