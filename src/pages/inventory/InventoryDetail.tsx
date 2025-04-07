
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { BackButton } from "@/App";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Package } from "lucide-react";
import { getInventoryItemById, deleteInventoryItem } from "@/utils/inventory-utils";
import { InventoryItem, InventoryStatus } from "@/types/inventory-types";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

const InventoryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (id) {
      const inventoryItem = getInventoryItemById(id);
      if (inventoryItem) {
        setItem(inventoryItem);
      } else {
        toast({
          title: "Error",
          description: "No se encontró el artículo.",
          variant: "destructive",
        });
        navigate("/app/inventario/articulos");
      }
    }
    setLoading(false);
  }, [id, navigate]);
  
  const handleDelete = () => {
    if (window.confirm("¿Está seguro de eliminar este artículo?")) {
      if (id && deleteInventoryItem(id)) {
        toast({
          title: "Artículo eliminado",
          description: "El artículo ha sido eliminado correctamente.",
        });
        navigate("/app/inventario/articulos");
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el artículo.",
          variant: "destructive",
        });
      }
    }
  };
  
  const getStatusBadgeVariant = (status: InventoryStatus) => {
    switch (status) {
      case "Disponible":
        return "success";
      case "Próximo a agotarse":
        return "warning";
      case "Agotado":
        return "destructive";
      case "Vencido":
        return "destructive";
      case "En cuarentena":
        return "outline";
      default:
        return "default";
    }
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="container max-w-3xl mx-auto py-8 px-4 sm:px-6">
          <p>Cargando...</p>
        </div>
      </Layout>
    );
  }
  
  if (!item) {
    return (
      <Layout>
        <div className="container max-w-3xl mx-auto py-8 px-4 sm:px-6">
          <BackButton />
          <Card>
            <CardContent className="pt-6">
              <p className="text-center">No se encontró el artículo solicitado.</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container max-w-3xl mx-auto py-8 px-4 sm:px-6">
        <BackButton />
        
        <h1 className="text-2xl font-bold mb-6">Detalles del Artículo</h1>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{item.name}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </div>
              <Badge variant={getStatusBadgeVariant(item.status) as any} className="ml-2">
                {item.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Información general</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2">
                      <span className="text-gray-500">Categoría:</span>
                      <span>{item.category}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-gray-500">Cantidad:</span>
                      <span>{item.quantity} {item.unit}</span>
                    </div>
                    {item.location && (
                      <div className="grid grid-cols-2">
                        <span className="text-gray-500">Ubicación:</span>
                        <span>{item.location}</span>
                      </div>
                    )}
                    {item.minimumStock !== undefined && (
                      <div className="grid grid-cols-2">
                        <span className="text-gray-500">Stock mínimo:</span>
                        <span>{item.minimumStock} {item.unit}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {(item.purchasePrice !== undefined || item.salePrice !== undefined || item.supplier) && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-medium mb-2">Información comercial</h3>
                      <div className="space-y-2">
                        {item.purchasePrice !== undefined && (
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Precio de compra:</span>
                            <span>${item.purchasePrice.toFixed(2)}</span>
                          </div>
                        )}
                        {item.salePrice !== undefined && (
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Precio de venta:</span>
                            <span>${item.salePrice.toFixed(2)}</span>
                          </div>
                        )}
                        {item.supplier && (
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Proveedor:</span>
                            <span>{item.supplier}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="space-y-6">
                {item.expirationDate && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Fecha de vencimiento</h3>
                    <div className="text-red-500 font-semibold">
                      {item.expirationDate}
                    </div>
                  </div>
                )}
                
                {(item.barcode || item.notes) && (
                  <>
                    <Separator className="md:hidden" />
                    <div>
                      <h3 className="text-lg font-medium mb-2">Información adicional</h3>
                      <div className="space-y-2">
                        {item.barcode && (
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Código de barras:</span>
                            <span>{item.barcode}</span>
                          </div>
                        )}
                        {item.notes && (
                          <div>
                            <span className="text-gray-500 block">Notas:</span>
                            <p className="mt-1 text-sm">{item.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
                
                <Separator className="md:hidden" />
                <div>
                  <h3 className="text-lg font-medium mb-2">Registro</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2">
                      <span className="text-gray-500">ID:</span>
                      <span className="text-sm">{item.id}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-gray-500">Última actualización:</span>
                      <span>
                        {format(new Date(item.lastUpdated), "dd/MM/yyyy HH:mm")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate("/app/inventario/articulos")}
            >
              Volver
            </Button>
            <Button 
              variant="outline"
              className="gap-1"
              asChild
            >
              <Link to={`/app/inventario/editar/${item.id}`}>
                <Edit className="h-4 w-4" /> Editar
              </Link>
            </Button>
            <Button 
              variant="destructive"
              className="gap-1"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" /> Eliminar
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default InventoryDetail;
