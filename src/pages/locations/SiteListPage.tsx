
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { BackButton } from '@/App';
import { getAllSites, addSite, updateSite, deleteSite } from '@/utils/location-utils';
import { Site, SiteFormValues } from '@/types/location-types';
import { SiteCard } from '@/components/locations/SiteCard';
import { SiteForm } from '@/components/locations/SiteForm';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
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
import { Plus, Building, Search, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SiteListPage = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState<Site[]>([]);
  const [filteredSites, setFilteredSites] = useState<Site[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | undefined>(undefined);
  
  // Cargar sedes
  useEffect(() => {
    const loadSites = () => {
      const allSites = getAllSites();
      setSites(allSites);
      setFilteredSites(allSites);
    };
    
    loadSites();
  }, []);
  
  // Filtrar sedes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredSites(sites);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = sites.filter(site => 
        site.name.toLowerCase().includes(query) ||
        site.city.toLowerCase().includes(query) ||
        site.address.toLowerCase().includes(query)
      );
      setFilteredSites(filtered);
    }
  }, [searchQuery, sites]);
  
  // Manejar apertura de formulario
  const handleAddSite = () => {
    setSelectedSite(undefined);
    setFormOpen(true);
  };
  
  const handleEditSite = (site: Site) => {
    setSelectedSite(site);
    setFormOpen(true);
  };
  
  // Manejar envío de formulario
  const handleFormSubmit = (data: SiteFormValues) => {
    if (selectedSite) {
      // Actualizar sede existente
      const updated = updateSite(selectedSite.id, data);
      if (updated) {
        setSites(prevSites => prevSites.map(site => 
          site.id === selectedSite.id ? updated : site
        ));
        toast({
          title: "Sede actualizada",
          description: `La sede "${updated.name}" ha sido actualizada correctamente.`,
        });
      }
    } else {
      // Crear nueva sede
      const newSite = addSite(data);
      setSites(prevSites => [...prevSites, newSite]);
      toast({
        title: "Sede creada",
        description: `La sede "${newSite.name}" ha sido creada correctamente.`,
      });
    }
    
    setFormOpen(false);
  };
  
  // Manejar eliminación
  const handleDeleteClick = (siteId: string) => {
    const site = sites.find(s => s.id === siteId);
    setSelectedSite(site);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (selectedSite) {
      const deleted = deleteSite(selectedSite.id);
      if (deleted) {
        setSites(prevSites => prevSites.filter(site => site.id !== selectedSite.id));
        toast({
          title: "Sede eliminada",
          description: `La sede "${selectedSite.name}" ha sido eliminada correctamente.`,
        });
      }
    }
    setDeleteDialogOpen(false);
  };
  
  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <BackButton />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sedes médicas</h1>
            <p className="text-muted-foreground">Administra tus sedes y consultorios</p>
          </div>
          
          <Button onClick={handleAddSite} className="flex items-center gap-2">
            <Plus size={16} />
            Nueva sede
          </Button>
        </div>
        
        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
          <Input 
            className="pl-10"
            placeholder="Buscar por nombre, dirección o ciudad..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Listado de sedes */}
        {filteredSites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSites.map(site => (
              <SiteCard 
                key={site.id} 
                site={site} 
                onEdit={handleEditSite} 
                onDelete={handleDeleteClick} 
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            {searchQuery ? (
              <>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full mb-4">
                  <Search size={36} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium">No se encontraron resultados</h3>
                <p className="text-muted-foreground text-center mt-1">
                  No hay sedes que coincidan con "{searchQuery}"
                </p>
              </>
            ) : (
              <>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full mb-4">
                  <Building size={36} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium">No hay sedes registradas</h3>
                <p className="text-muted-foreground text-center mt-1">
                  Crea tu primera sede para comenzar a administrar tus consultorios
                </p>
                <Button onClick={handleAddSite} className="mt-4">
                  Nueva sede
                </Button>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Formulario de sede */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedSite ? 'Editar sede' : 'Nueva sede'}</DialogTitle>
            <DialogDescription>
              {selectedSite 
                ? 'Actualiza la información de la sede' 
                : 'Completa el formulario para crear una nueva sede'
              }
            </DialogDescription>
          </DialogHeader>
          
          <SiteForm 
            initialData={selectedSite} 
            onSubmit={handleFormSubmit} 
            onCancel={() => setFormOpen(false)} 
          />
        </DialogContent>
      </Dialog>
      
      {/* Confirmación de eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la sede "{selectedSite?.name}" y todos sus consultorios de forma permanente.
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

export default SiteListPage;
