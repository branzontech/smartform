
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BackButton } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, Filter, Search as SearchIcon, PackagePlus } from "lucide-react";
import { searchInventoryItems } from "@/utils/inventory-utils";
import { InventoryItem, InventoryStatus, InventoryCategory } from "@/types/inventory-types";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const categories: InventoryCategory[] = [
  "Medicamentos",
  "Insumos médicos",
  "Equipos médicos",
  "Material quirúrgico",
  "Papelería",
  "Mobiliario",
  "Limpieza",
  "Otros"
];

const statuses: InventoryStatus[] = [
  "Disponible",
  "Agotado",
  "Próximo a agotarse",
  "Vencido",
  "En cuarentena"
];

const InventorySearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  const handleSearch = () => {
    let results = searchInventoryItems(searchQuery);
    
    // Aplicar filtros adicionales
    if (selectedCategory && selectedCategory !== "all") {
      results = results.filter(item => item.category === selectedCategory);
    }
    
    if (selectedStatus && selectedStatus !== "all") {
      results = results.filter(item => item.status === selectedStatus);
    }
    
    setSearchResults(results);
    setHasSearched(true);
  };
  
  const handleReset = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedStatus("");
    setSearchResults([]);
    setHasSearched(false);
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
  
  return (
    <Layout>
      <div className="container max-w-5xl mx-auto py-8 px-4 sm:px-6">
        <BackButton />
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-2xl font-bold mb-4 sm:mb-0">Búsqueda de Inventario</h1>
          <Link to="/app/inventario/nuevo">
            <Button className="w-full sm:w-auto">
              <PackagePlus className="mr-2 h-4 w-4" />
              Nuevo Artículo
            </Button>
          </Link>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Buscar Artículos</CardTitle>
            <CardDescription>
              Busque artículos por nombre, descripción o filtre por categoría y estado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative md:col-span-2">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Buscar artículos..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Cualquier categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Cualquier categoría</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Cualquier estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Cualquier estado</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="md:col-span-3">
                <Button 
                  onClick={handleSearch} 
                  className="w-full md:w-auto"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Buscar
                </Button>
              </div>
              
              <div>
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  className="w-full"
                >
                  Limpiar filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {hasSearched && (
          <Card>
            <CardHeader>
              <CardTitle>Resultados de la búsqueda</CardTitle>
              <CardDescription>
                {searchResults.length === 0
                  ? "No se encontraron artículos que coincidan con su búsqueda."
                  : `Se encontraron ${searchResults.length} artículos.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {searchResults.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {searchResults.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{item.name}</h3>
                              <p className="text-sm text-gray-500">{item.category}</p>
                            </div>
                            <Badge variant={getStatusBadgeVariant(item.status) as any}>
                              {item.status}
                            </Badge>
                          </div>
                          
                          {item.description && (
                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          
                          <Separator className="my-3" />
                          
                          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                            <div>
                              <span className="font-medium">Cantidad:</span>{" "}
                              {item.quantity} {item.unit}
                            </div>
                            {item.location && (
                              <div>
                                <span className="font-medium">Ubicación:</span>{" "}
                                {item.location}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex justify-end space-x-2">
                            <Button asChild size="sm" variant="outline">
                              <Link to={`/app/inventario/${item.id}`}>
                                <Eye className="h-4 w-4 mr-1" /> Ver
                              </Link>
                            </Button>
                            <Button asChild size="sm" variant="outline">
                              <Link to={`/app/inventario/editar/${item.id}`}>
                                <Edit className="h-4 w-4 mr-1" /> Editar
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default InventorySearch;
