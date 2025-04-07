
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout';
import { BackButton } from '@/App';
import { getAllOffices, updateOffice, deleteOffice } from '@/utils/location-utils';
import { Office } from '@/types/location-types';
import { OfficeCard } from '@/components/locations/OfficeCard';
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { OfficeForm } from '@/components/locations/OfficeForm';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Building2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const OfficeListPage = () => {
  const [offices, setOffices] = useState<Office[]>([]);
  const [filteredOffices, setFilteredOffices] = useState<Office[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState<Office | undefined>(undefined);
  
  // Cargar consultorios
  useEffect(() => {
    const loadOffices = () => {
      const allOffices = getAllOffices();
      setOffices(allOffices);
      setFilteredOffices(allOffices);
    };
    
    loadOffices();
  }, []);
  
  // Filtrar consultorios
  useEffect(() => {
    let filtered = offices;
    
    // Filtrar por estado si no es "all"
    if (statusFilter !== "all") {
      filtered = filtered.filter(office => office.status === statusFilter);
    }
    
    // Filtrar por búsqueda si hay texto
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(office => 
        office.name.toLowerCase().includes(query) ||
        office.number.toLowerCase().includes(query) ||
        (office.assignedDoctor && office.assignedDoctor.toLowerCase().includes(query)) ||
        (office.specialties && office.specialties.some(s => s.toLowerCase().includes(query)))
      );
    }
    
    setFilteredOffices(filtered);
  }, [searchQuery, statusFilter, offices]);
  
  // Manejar apertura de formulario
  const handleEditOffice = (office: Office) => {
    setSelectedOffice(office);
    setEditDialogOpen(true);
  };
  
  // Manejar envío de formulario
  const handleFormSubmit = (data: any) => {
    if (selectedOffice) {
      // Actualizar consultorio existente
      const updated = updateOffice(selectedOffice.id, data);
      if (updated) {
        setOffices(prevOffices => prevOffices.map(office => 
          office.id === selectedOffice.id ? updated : office
        ));
        toast({
          title: "Consultorio actualizado",
          description: `El consultorio "${updated.name}" ha sido actualizado correctamente.`,
        });
      }
    }
    
    setEditDialogOpen(false);
  };
  
  // Manejar eliminación
  const handleDeleteClick = (officeId: string) => {
    const office = offices.find(o => o.id === officeId);
    setSelectedOffice(office);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (selectedOffice) {
      const deleted = deleteOffice(selectedOffice.id);
      if (deleted) {
        setOffices(prevOffices => prevOffices.filter(office => office.id !== selectedOffice.id));
        toast({
          title: "Consultorio eliminado",
          description: `El consultorio "${selectedOffice.name}" ha sido eliminado correctamente.`,
        });
      }
    }
    setDeleteDialogOpen(false);
  };
  
  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <BackButton />
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Todos los consultorios</h1>
          <p className="text-muted-foreground">Vista general de todos los consultorios</p>
        </div>
        
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
            <Input 
              className="pl-10"
              placeholder="Buscar por nombre, número, doctor o especialidad..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="Disponible">Disponible</SelectItem>
              <SelectItem value="Ocupado">Ocupado</SelectItem>
              <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
              <SelectItem value="Reservado">Reservado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Listado de consultorios */}
        {filteredOffices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffices.map(office => (
              <OfficeCard 
                key={office.id} 
                office={office} 
                onEdit={handleEditOffice} 
                onDelete={handleDeleteClick} 
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            {searchQuery || statusFilter !== "all" ? (
              <>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full mb-4">
                  <Search size={36} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium">No se encontraron resultados</h3>
                <p className="text-muted-foreground text-center mt-1">
                  No hay consultorios que coincidan con los filtros aplicados
                </p>
              </>
            ) : (
              <>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full mb-4">
                  <Building2 size={36} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium">No hay consultorios registrados</h3>
                <p className="text-muted-foreground text-center mt-1">
                  No se encontraron consultorios en ninguna sede
                </p>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Formulario de edición */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar consultorio</DialogTitle>
          </DialogHeader>
          
          {selectedOffice && (
            <OfficeForm 
              initialData={selectedOffice} 
              onSubmit={handleFormSubmit} 
              onCancel={() => setEditDialogOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Confirmación de eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el consultorio "{selectedOffice?.name}" de forma permanente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default OfficeListPage;
