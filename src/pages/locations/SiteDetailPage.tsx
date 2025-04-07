
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { BackButton } from '@/App';
import { Office, Site } from '@/types/location-types';
import { 
  getSiteById, 
  getOfficesBySite, 
  addOffice, 
  updateOffice, 
  deleteOffice 
} from '@/utils/location-utils';
import { OfficeFloorPlan } from '@/components/locations/OfficeFloorPlan';
import { OfficeCard } from '@/components/locations/OfficeCard';
import { OfficeForm } from '@/components/locations/OfficeForm';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
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
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Building, MapPin, Phone, Mail, Plus, ListFilter, Grid, LayoutGrid } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SiteDetailPage = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  
  const [site, setSite] = useState<Site | null>(null);
  const [offices, setOffices] = useState<Office[]>([]);
  const [activeTab, setActiveTab] = useState("floorplan");
  
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState<Office | undefined>(undefined);
  
  // Cargar datos de la sede y consultorios
  useEffect(() => {
    if (siteId) {
      const siteData = getSiteById(siteId);
      if (siteData) {
        setSite(siteData);
        const officesData = getOfficesBySite(siteId);
        setOffices(officesData);
      } else {
        navigate('/app/locations/sites');
        toast({
          title: "Sede no encontrada",
          description: "La sede que intentas ver no existe.",
          variant: "destructive"
        });
      }
    }
  }, [siteId, navigate]);
  
  // Manejar apertura de formulario
  const handleAddOffice = () => {
    setSelectedOffice(undefined);
    setFormOpen(true);
  };
  
  const handleEditOffice = (office: Office) => {
    setSelectedOffice(office);
    setFormOpen(true);
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
    } else {
      // Crear nuevo consultorio
      const newOffice = addOffice({
        ...data,
        siteId: siteId!
      });
      setOffices(prevOffices => [...prevOffices, newOffice]);
      toast({
        title: "Consultorio creado",
        description: `El consultorio "${newOffice.name}" ha sido creado correctamente.`,
      });
      
      // Actualizar el conteo en la sede
      if (site) {
        setSite({
          ...site,
          totalOffices: site.totalOffices + 1,
          officeIds: [...site.officeIds, newOffice.id]
        });
      }
    }
    
    setFormOpen(false);
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
        
        // Actualizar el conteo en la sede
        if (site) {
          setSite({
            ...site,
            totalOffices: site.totalOffices - 1,
            officeIds: site.officeIds.filter(id => id !== selectedOffice.id)
          });
        }
        
        toast({
          title: "Consultorio eliminado",
          description: `El consultorio "${selectedOffice.name}" ha sido eliminado correctamente.`,
        });
      }
    }
    setDeleteDialogOpen(false);
  };
  
  // Actualizar datos después de modificar en el plano
  const handleOfficeUpdate = () => {
    if (siteId) {
      const officesData = getOfficesBySite(siteId);
      setOffices(officesData);
    }
  };
  
  if (!site) {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <BackButton />
          <div className="flex justify-center items-center h-64">
            <p>Cargando información de la sede...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <BackButton />
        
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{site.name}</h1>
            <p className="text-muted-foreground flex items-center">
              <MapPin size={14} className="inline mr-1" />
              {site.address}, {site.city} {site.postalCode && `- ${site.postalCode}`}
            </p>
          </div>
          
          <Button onClick={handleAddOffice} className="flex items-center gap-2">
            <Plus size={16} />
            Nuevo consultorio
          </Button>
        </div>
        
        {/* Información de la sede */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Información general</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                  <Building size={16} className="mr-2 text-gray-500" />
                  <span>{site.totalOffices} consultorios en {site.floors} pisos</span>
                </div>
                <div className="flex items-center">
                  <Phone size={16} className="mr-2 text-gray-500" />
                  <span>{site.phone}</span>
                </div>
                {site.email && (
                  <div className="flex items-center">
                    <Mail size={16} className="mr-2 text-gray-500" />
                    <span>{site.email}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Resumen de consultorios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                  <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Disponibles</div>
                  <div className="text-2xl font-bold">
                    {offices.filter(o => o.status === 'Disponible').length}
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg">
                  <div className="text-sm text-red-600 dark:text-red-400 mb-1">Ocupados</div>
                  <div className="text-2xl font-bold">
                    {offices.filter(o => o.status === 'Ocupado').length}
                  </div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-lg">
                  <div className="text-sm text-amber-600 dark:text-amber-400 mb-1">Mantenimiento</div>
                  <div className="text-2xl font-bold">
                    {offices.filter(o => o.status === 'Mantenimiento').length}
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg">
                  <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">Reservados</div>
                  <div className="text-2xl font-bold">
                    {offices.filter(o => o.status === 'Reservado').length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs de visualización */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="floorplan" className="flex items-center gap-2">
                <LayoutGrid size={16} />
                <span className="hidden sm:inline">Plano</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <ListFilter size={16} />
                <span className="hidden sm:inline">Lista</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="floorplan" className="space-y-4">
            {offices.length > 0 ? (
              <OfficeFloorPlan offices={offices} onOfficeUpdate={handleOfficeUpdate} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed">
                <Building size={48} className="text-gray-400 mb-4" />
                <h3 className="text-lg font-medium">No hay consultorios</h3>
                <p className="text-muted-foreground text-center mt-1 max-w-md">
                  Esta sede no tiene consultorios registrados. Comienza a agregar consultorios para visualizarlos en el plano.
                </p>
                <Button onClick={handleAddOffice} className="mt-4">
                  Agregar consultorio
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="list" className="space-y-4">
            {offices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {offices.map(office => (
                  <OfficeCard 
                    key={office.id} 
                    office={office} 
                    onEdit={handleEditOffice} 
                    onDelete={handleDeleteClick} 
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed">
                <Building size={48} className="text-gray-400 mb-4" />
                <h3 className="text-lg font-medium">No hay consultorios</h3>
                <p className="text-muted-foreground text-center mt-1 max-w-md">
                  Esta sede no tiene consultorios registrados. Agrega un consultorio para comenzar.
                </p>
                <Button onClick={handleAddOffice} className="mt-4">
                  Agregar consultorio
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Formulario de consultorio */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedOffice ? 'Editar consultorio' : 'Nuevo consultorio'}</DialogTitle>
            <DialogDescription>
              {selectedOffice 
                ? 'Actualiza la información del consultorio' 
                : 'Completa el formulario para crear un nuevo consultorio'
              }
            </DialogDescription>
          </DialogHeader>
          
          <OfficeForm 
            initialData={selectedOffice} 
            onSubmit={handleFormSubmit} 
            onCancel={() => setFormOpen(false)} 
            siteId={siteId}
          />
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

export default SiteDetailPage;
