import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { BackButton } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Search, Plus, Users, Calendar, Eye, FileText, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Patient } from "@/types/patient-types";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Datos de ejemplo
const mockPatients: Patient[] = [
  {
    id: "1",
    name: "Juan Pérez",
    documentId: "1234567890",
    dateOfBirth: "1985-05-15",
    gender: "Masculino",
    contactNumber: "555-123-4567",
    email: "juan.perez@example.com",
    createdAt: new Date("2023-01-10"),
    lastVisitAt: new Date("2023-06-20"),
  },
  {
    id: "2",
    name: "María García",
    documentId: "0987654321",
    dateOfBirth: "1990-08-20",
    gender: "Femenino",
    contactNumber: "555-987-6543",
    email: "maria.garcia@example.com",
    createdAt: new Date("2023-02-15"),
    lastVisitAt: new Date("2023-05-10"),
  },
  {
    id: "3",
    name: "Carlos Rodríguez",
    documentId: "5678901234",
    dateOfBirth: "1978-12-03",
    gender: "Masculino",
    contactNumber: "555-456-7890",
    address: "Calle Principal 123",
    createdAt: new Date("2023-03-05"),
  }
];

// Generar más pacientes de prueba para demostrar escalabilidad
const generateMoreMockPatients = (startId: number, count: number): Patient[] => {
  const result: Patient[] = [];
  const names = ["Ana Martínez", "Luis Rodríguez", "Elena Santos", "Pedro Gómez", "Carmen López", "Miguel Torres", "Isabel Ramírez", "José García", "Laura Fernández", "Pablo Ruiz"];
  
  for (let i = 0; i < count; i++) {
    const id = startId + i;
    const randomIndex = Math.floor(Math.random() * names.length);
    const hasLastVisit = Math.random() > 0.3;
    
    result.push({
      id: id.toString(),
      name: names[randomIndex],
      documentId: Math.floor(10000000 + Math.random() * 90000000).toString(),
      dateOfBirth: `198${Math.floor(Math.random() * 10)}-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`,
      gender: Math.random() > 0.5 ? "Masculino" : "Femenino",
      contactNumber: `555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      email: `paciente${id}@example.com`,
      createdAt: new Date(Date.now() - Math.random() * 10000000000),
      lastVisitAt: hasLastVisit ? new Date(Date.now() - Math.random() * 5000000000) : undefined
    });
  }
  
  return result;
};

// Agregar pacientes adicionales al mock - Generar más para probar escalabilidad
const extendedMockPatients = [...mockPatients, ...generateMoreMockPatients(mockPatients.length + 1, 500)];

type SortField = 'name' | 'documentId' | 'dateOfBirth' | 'lastVisitAt' | 'createdAt';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

const PatientList = () => {
  // Fixed: Removed all infinite scroll code and loadingMore references
  console.log('PatientList: Modern table implementation loaded');
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [hasVisitFilter, setHasVisitFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const navigate = useNavigate();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when searching
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load patients data
  useEffect(() => {
    const timer = setTimeout(() => {
      const savedPatients = localStorage.getItem("patients");
      if (savedPatients) {
        try {
          const parsedPatients = JSON.parse(savedPatients).map((patient: any) => ({
            ...patient,
            createdAt: new Date(patient.createdAt),
            lastVisitAt: patient.lastVisitAt ? new Date(patient.lastVisitAt) : undefined,
          }));
          setPatients(parsedPatients);
        } catch (error) {
          console.error("Error parsing patients:", error);
          setPatients(extendedMockPatients);
          localStorage.setItem("patients", JSON.stringify(extendedMockPatients));
        }
      } else {
        setPatients(extendedMockPatients);
        localStorage.setItem("patients", JSON.stringify(extendedMockPatients));
      }
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Filter and sort patients
  const filteredAndSortedPatients = useMemo(() => {
    let filtered = patients.filter(patient => {
      const matchesSearch = patient.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                          patient.documentId.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      
      const matchesGender = genderFilter === "all" || patient.gender === genderFilter;
      
      const matchesVisit = hasVisitFilter === "all" || 
                          (hasVisitFilter === "has-visit" && patient.lastVisitAt) ||
                          (hasVisitFilter === "no-visit" && !patient.lastVisitAt);

      return matchesSearch && matchesGender && matchesVisit;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle dates
      if (sortField === 'dateOfBirth' || sortField === 'lastVisitAt' || sortField === 'createdAt') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      // Handle strings
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [patients, debouncedSearchTerm, genderFilter, hasVisitFilter, sortField, sortDirection]);

  // Paginate the results
  const paginatedPatients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedPatients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedPatients, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedPatients.length / itemsPerPage);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Render sort icon
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const handleCreateConsultation = () => {
    navigate("/app/pacientes/nueva-consulta");
  };

  const handleViewPatient = (id: string) => {
    navigate(`/app/pacientes/${id}`);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setGenderFilter("all");
    setHasVisitFilter("all");
    setCurrentPage(1);
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="h-8 w-48 bg-muted rounded mb-6 mx-auto"></div>
            <div className="max-w-6xl mx-auto px-4">
              <div className="h-12 bg-muted rounded mb-4"></div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-muted rounded mb-2"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4 max-w-7xl">
        <BackButton />
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold flex items-center">
              <Users className="mr-2 text-primary" />
              Pacientes
            </h1>
            <Badge variant="secondary" className="text-sm">
              {filteredAndSortedPatients.length} pacientes
            </Badge>
          </div>
          <Button onClick={handleCreateConsultation} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2" size={16} />
            Nueva consulta
          </Button>
        </div>

        {/* Filters - Modern Windows 11 Style */}
        <div className="mb-6 p-6 bg-card/80 backdrop-blur-xl rounded-3xl border border-border/50 shadow-lg">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-xl bg-primary/10">
              <Filter className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Filtros y búsqueda</h2>
          </div>
          
          {/* Search - Modern Style */}
          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 bg-muted/50 border-0 rounded-2xl text-base focus-visible:ring-2 focus-visible:ring-primary/30 placeholder:text-muted-foreground/60"
            />
          </div>
          
          {/* Filter row - Modern Style */}
          <div className="flex flex-wrap gap-6 items-center">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-muted-foreground">Género:</label>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="w-36 h-10 bg-muted/50 border-0 rounded-xl focus:ring-2 focus:ring-primary/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50 bg-popover/95 backdrop-blur-xl">
                  <SelectItem value="all" className="rounded-lg">Todos</SelectItem>
                  <SelectItem value="Masculino" className="rounded-lg">Masculino</SelectItem>
                  <SelectItem value="Femenino" className="rounded-lg">Femenino</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-muted-foreground">Visitas:</label>
              <Select value={hasVisitFilter} onValueChange={setHasVisitFilter}>
                <SelectTrigger className="w-40 h-10 bg-muted/50 border-0 rounded-xl focus:ring-2 focus:ring-primary/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50 bg-popover/95 backdrop-blur-xl">
                  <SelectItem value="all" className="rounded-lg">Todos</SelectItem>
                  <SelectItem value="has-visit" className="rounded-lg">Con visitas</SelectItem>
                  <SelectItem value="no-visit" className="rounded-lg">Sin visitas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-muted-foreground">Mostrar:</label>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-24 h-10 bg-muted/50 border-0 rounded-xl focus:ring-2 focus:ring-primary/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50 bg-popover/95 backdrop-blur-xl">
                  {ITEMS_PER_PAGE_OPTIONS.map(option => (
                    <SelectItem key={option} value={option.toString()} className="rounded-lg">{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(searchTerm || genderFilter !== "all" || hasVisitFilter !== "all") && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetFilters}
                className="h-10 px-4 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>

        {/* Results - Modern Windows 11 Style */}
        {filteredAndSortedPatients.length === 0 ? (
          <div className="p-12 bg-card/80 backdrop-blur-xl rounded-3xl border border-border/50 shadow-lg text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Users size={40} className="text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No hay pacientes registrados</h3>
            <p className="text-muted-foreground mb-6">Registra una nueva consulta para agregar pacientes.</p>
            <Button onClick={handleCreateConsultation} className="rounded-xl h-11 px-6">
              <Plus className="mr-2 h-4 w-4" />
              Nueva consulta
            </Button>
          </div>
        ) : (
          <div className="bg-card/80 backdrop-blur-xl rounded-3xl border border-border/50 shadow-lg overflow-hidden">
            {/* Table */}
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-border/50">
                    <TableHead className="w-[200px] py-4 px-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-semibold text-foreground hover:text-primary gap-2"
                        onClick={() => handleSort('name')}
                      >
                        Nombre
                        {renderSortIcon('name')}
                      </Button>
                    </TableHead>
                    <TableHead className="py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-semibold text-foreground hover:text-primary gap-2"
                        onClick={() => handleSort('documentId')}
                      >
                        Documento
                        {renderSortIcon('documentId')}
                      </Button>
                    </TableHead>
                    <TableHead className="py-4 font-semibold text-foreground">Edad</TableHead>
                    <TableHead className="py-4 font-semibold text-foreground">Género</TableHead>
                    <TableHead className="py-4 font-semibold text-foreground">Contacto</TableHead>
                    <TableHead className="py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-semibold text-foreground hover:text-primary gap-2"
                        onClick={() => handleSort('lastVisitAt')}
                      >
                        Última visita
                        {renderSortIcon('lastVisitAt')}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[150px] py-4 font-semibold text-foreground">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPatients.map((patient, index) => (
                    <TableRow 
                      key={patient.id} 
                      className="hover:bg-primary/5 transition-colors duration-200 border-b border-border/30 last:border-0"
                    >
                      <TableCell className="py-4 px-6">
                        <span className="font-medium text-foreground">{patient.name}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="font-mono text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">
                          {patient.documentId}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-muted-foreground">
                        {calculateAge(patient.dateOfBirth)} años
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge 
                          variant={patient.gender === 'Masculino' ? 'default' : 'secondary'} 
                          className="text-xs rounded-lg px-3 py-1"
                        >
                          {patient.gender}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="text-sm text-foreground">{patient.contactNumber}</div>
                        {patient.email && (
                          <div className="text-muted-foreground text-xs mt-0.5">{patient.email}</div>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        {patient.lastVisitAt ? (
                          <div className="text-sm">
                            <span className="text-foreground">{format(patient.lastVisitAt, "dd/MM/yyyy", { locale: es })}</span>
                            <div className="text-muted-foreground text-xs mt-0.5">
                              {format(patient.lastVisitAt, "HH:mm")}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs rounded-lg border-border/50">
                            Sin visitas
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewPatient(patient.id)}
                            className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/app/pacientes/${patient.id}?tab=consultations`)}
                            className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination - Modern Style */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-5 border-t border-border/50 bg-muted/20">
                <div className="text-sm text-muted-foreground">
                  Mostrando <span className="font-medium text-foreground">{((currentPage - 1) * itemsPerPage) + 1}</span> a{' '}
                  <span className="font-medium text-foreground">{Math.min(currentPage * itemsPerPage, filteredAndSortedPatients.length)}</span> de{' '}
                  <span className="font-medium text-foreground">{filteredAndSortedPatients.length}</span> pacientes
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 disabled:opacity-40"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNumber = currentPage <= 3 
                        ? i + 1 
                        : currentPage >= totalPages - 2
                        ? totalPages - 4 + i
                        : currentPage - 2 + i;
                      
                      if (pageNumber < 1 || pageNumber > totalPages) return null;
                      
                      return (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNumber)}
                          className={cn(
                            "w-9 h-9 rounded-xl transition-all",
                            currentPage === pageNumber 
                              ? "bg-primary text-primary-foreground shadow-md" 
                              : "hover:bg-primary/10"
                          )}
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 disabled:opacity-40"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default PatientList;