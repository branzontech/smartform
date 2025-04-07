
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BackButton } from "@/App";
import { 
  PackagePlus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  ArrowUpDown,
  ChevronDown
} from "lucide-react";
import { getAllInventoryItems, deleteInventoryItem } from "@/utils/inventory-utils";
import { InventoryItem, InventoryStatus } from "@/types/inventory-types";
import { toast } from "@/hooks/use-toast";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

const InventoryList = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof InventoryItem | null;
    direction: "asc" | "desc";
  }>({
    key: "name",
    direction: "asc",
  });
  
  const isMobile = useIsMobile();
  
  useEffect(() => {
    loadInventory();
  }, []);
  
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredInventory(inventory);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = inventory.filter(
        item =>
          item.name.toLowerCase().includes(lowercaseQuery) ||
          (item.description && item.description.toLowerCase().includes(lowercaseQuery)) ||
          item.category.toLowerCase().includes(lowercaseQuery)
      );
      setFilteredInventory(filtered);
    }
  }, [searchQuery, inventory]);
  
  const loadInventory = () => {
    const items = getAllInventoryItems();
    setInventory(items);
    setFilteredInventory(items);
  };
  
  const handleDelete = (id: string) => {
    if (window.confirm("¿Está seguro de eliminar este artículo?")) {
      const success = deleteInventoryItem(id);
      if (success) {
        toast({
          title: "Artículo eliminado",
          description: "El artículo ha sido eliminado correctamente.",
        });
        loadInventory();
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el artículo.",
          variant: "destructive",
        });
      }
    }
  };
  
  const requestSort = (key: keyof InventoryItem) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    
    const sortedItems = [...filteredInventory].sort((a, b) => {
      if (a[key] === null || a[key] === undefined) return 1;
      if (b[key] === null || b[key] === undefined) return -1;
      
      if (typeof a[key] === "string" && typeof b[key] === "string") {
        return direction === "asc"
          ? (a[key] as string).localeCompare(b[key] as string)
          : (b[key] as string).localeCompare(a[key] as string);
      }
      
      return direction === "asc"
        ? (a[key] as number) - (b[key] as number)
        : (b[key] as number) - (a[key] as number);
    });
    
    setFilteredInventory(sortedItems);
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
      <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6">
        <BackButton />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold mb-4 md:mb-0">Inventario</h1>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Buscar artículos..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Link to="/app/inventario/nuevo">
              <Button className="w-full sm:w-auto">
                <PackagePlus className="mr-2 h-4 w-4" />
                Nuevo Artículo
              </Button>
            </Link>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Lista de Artículos</CardTitle>
          </CardHeader>
          <CardContent>
            {isMobile ? (
              // Vista para dispositivos móviles
              <div className="grid gap-4">
                {filteredInventory.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">No se encontraron artículos</p>
                ) : (
                  filteredInventory.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{item.name}</h3>
                              <p className="text-sm text-gray-500">{item.category}</p>
                            </div>
                            <Badge variant={getStatusBadgeVariant(item.status) as any}>
                              {item.status}
                            </Badge>
                          </div>
                          
                          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
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
                          
                          <div className="mt-4 flex justify-end space-x-2">
                            <Link to={`/app/inventario/${item.id}`}>
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link to={`/app/inventario/editar/${item.id}`}>
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-500"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            ) : (
              // Vista para escritorio
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer" 
                        onClick={() => requestSort("name")}
                      >
                        <div className="flex items-center">
                          Nombre
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer" 
                        onClick={() => requestSort("category")}
                      >
                        <div className="flex items-center">
                          Categoría
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer" 
                        onClick={() => requestSort("quantity")}
                      >
                        <div className="flex items-center">
                          Cantidad
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead 
                        className="cursor-pointer" 
                        onClick={() => requestSort("status")}
                      >
                        <div className="flex items-center">
                          Estado
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                          No se encontraron artículos
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInventory.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>
                            {item.quantity} {item.unit}
                          </TableCell>
                          <TableCell>{item.location || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(item.status) as any}>
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link to={`/app/inventario/${item.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Ver detalles
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link to={`/app/inventario/editar/${item.id}`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-500"
                                  onClick={() => handleDelete(item.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default InventoryList;
