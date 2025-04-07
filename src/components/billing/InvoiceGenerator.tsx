
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { FileText, Download, Send } from "lucide-react";

const InvoiceGenerator = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    patientId: "",
    period: "monthly",
    includeUnpaid: true,
    includePending: true,
    format: "pdf"
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerateReport = () => {
    toast.success("Generando reporte, por favor espere...");
    // Implementación real: generación de reporte
    setTimeout(() => {
      toast.success("Reporte generado correctamente");
    }, 1500);
  };

  const handleGenerateInvoice = () => {
    navigate("/app/facturacion/nueva");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Generar factura</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Crea una nueva factura para un paciente o servicio específico.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Button
                onClick={handleGenerateInvoice}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Nueva factura individual
              </Button>
              
              <Button
                variant="outline"
                onClick={() => toast.info("Función disponible próximamente")}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Facturación masiva
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Generar reporte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patientId">ID del paciente (opcional)</Label>
              <Input
                id="patientId"
                name="patientId"
                value={formData.patientId}
                onChange={handleInputChange}
                placeholder="Dejar en blanco para todos los pacientes"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="period">Periodo</Label>
              <Select
                value={formData.period}
                onValueChange={(value) => handleSelectChange("period", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diario</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="format">Formato de salida</Label>
              <Select
                value={formData.format}
                onValueChange={(value) => handleSelectChange("format", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="includeUnpaid"
                checked={formData.includeUnpaid}
                onCheckedChange={(checked) => 
                  handleCheckboxChange("includeUnpaid", !!checked)
                }
              />
              <Label htmlFor="includeUnpaid">Incluir facturas no pagadas</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includePending"
                checked={formData.includePending}
                onCheckedChange={(checked) => 
                  handleCheckboxChange("includePending", !!checked)
                }
              />
              <Label htmlFor="includePending">Incluir pagos pendientes</Label>
            </div>
            
            <Button
              onClick={handleGenerateReport}
              className="w-full mt-6 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Generar reporte
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceGenerator;
