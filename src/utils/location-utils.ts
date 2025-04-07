
import { nanoid } from "nanoid";
import { Office, Site, OfficeFormValues, SiteFormValues } from "@/types/location-types";

// Clave para el local storage
const SITES_STORAGE_KEY = "smart_doctor_sites";
const OFFICES_STORAGE_KEY = "smart_doctor_offices";

// Datos de ejemplo para las sedes
const MOCK_SITES: Site[] = [
  {
    id: "site-001",
    name: "Centro Médico Principal",
    address: "Av. Reforma 123",
    city: "Ciudad de México",
    postalCode: "06500",
    phone: "+52 55 1234 5678",
    email: "info@centromedico.com",
    openingHours: "Lun-Vie: 8:00-20:00, Sáb: 9:00-14:00",
    totalOffices: 10,
    floors: 3,
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop",
    coordinates: { lat: 19.4326, lng: -99.1332 },
    officeIds: ["office-001", "office-002", "office-003", "office-004"]
  },
  {
    id: "site-002",
    name: "Clínica Sur",
    address: "Av. Universidad 456",
    city: "Ciudad de México",
    postalCode: "04500",
    phone: "+52 55 9876 5432",
    email: "contacto@clinicasur.com",
    openingHours: "Lun-Dom: 24 horas",
    totalOffices: 15,
    floors: 4,
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?q=80&w=2073&auto=format&fit=crop",
    coordinates: { lat: 19.3208, lng: -99.1852 },
    officeIds: ["office-005", "office-006", "office-007"]
  }
];

// Datos de ejemplo para los consultorios
const MOCK_OFFICES: Office[] = [
  {
    id: "office-001",
    name: "Consultorio General",
    number: "101",
    floor: 1,
    capacity: 4,
    area: 25,
    status: "Disponible",
    equipment: ["Camilla", "Escritorio", "Estetoscopio", "Báscula"],
    currentPatients: 0,
    maxPatients: 20,
    specialties: ["Medicina General"],
    assignedDoctor: "Dr. Juan Pérez",
    location: { x: 10, y: 20 },
    siteId: "site-001"
  },
  {
    id: "office-002",
    name: "Consultorio Pediatría",
    number: "102",
    floor: 1,
    capacity: 6,
    area: 30,
    status: "Ocupado",
    equipment: ["Camilla pediátrica", "Escritorio", "Balanza infantil", "Juguetes"],
    currentPatients: 3,
    maxPatients: 15,
    specialties: ["Pediatría"],
    assignedDoctor: "Dra. María Rodríguez",
    location: { x: 40, y: 20 },
    siteId: "site-001"
  },
  {
    id: "office-003",
    name: "Consultorio Cardiología",
    number: "201",
    floor: 2,
    capacity: 3,
    area: 35,
    status: "Reservado",
    equipment: ["Electrocardiograma", "Camilla", "Escritorio", "Monitor de signos vitales"],
    currentPatients: 0,
    maxPatients: 12,
    specialties: ["Cardiología"],
    assignedDoctor: "Dr. Carlos González",
    location: { x: 10, y: 60 },
    siteId: "site-001"
  },
  {
    id: "office-004",
    name: "Sala de Procedimientos",
    number: "202",
    floor: 2,
    capacity: 8,
    area: 45,
    status: "Mantenimiento",
    equipment: ["Mesa quirúrgica", "Lámparas", "Monitor de signos vitales", "Equipo de anestesia"],
    currentPatients: 0,
    maxPatients: 10,
    specialties: ["Cirugía menor", "Procedimientos"],
    location: { x: 40, y: 60 },
    siteId: "site-001"
  },
  {
    id: "office-005",
    name: "Consultorio Ginecología",
    number: "101",
    floor: 1,
    capacity: 4,
    area: 28,
    status: "Disponible",
    equipment: ["Camilla ginecológica", "Ecógrafo", "Escritorio"],
    currentPatients: 1,
    maxPatients: 18,
    specialties: ["Ginecología", "Obstetricia"],
    assignedDoctor: "Dra. Laura Martínez",
    location: { x: 10, y: 20 },
    siteId: "site-002"
  },
  {
    id: "office-006",
    name: "Laboratorio de Análisis",
    number: "102",
    floor: 1,
    capacity: 10,
    area: 40,
    status: "Ocupado",
    equipment: ["Microscopios", "Centrífuga", "Refrigerador médico", "Analizador automático"],
    currentPatients: 5,
    maxPatients: 30,
    specialties: ["Análisis clínicos"],
    location: { x: 40, y: 20 },
    siteId: "site-002"
  },
  {
    id: "office-007",
    name: "Consultorio Psicología",
    number: "201",
    floor: 2,
    capacity: 3,
    area: 20,
    status: "Disponible",
    equipment: ["Sofá", "Escritorio", "Material terapéutico"],
    currentPatients: 0,
    maxPatients: 12,
    specialties: ["Psicología", "Terapia familiar"],
    assignedDoctor: "Lic. Roberto Díaz",
    location: { x: 10, y: 60 },
    siteId: "site-002"
  }
];

// Inicializar datos
export const initializeLocationData = (): void => {
  const existingSites = localStorage.getItem(SITES_STORAGE_KEY);
  const existingOffices = localStorage.getItem(OFFICES_STORAGE_KEY);
  
  if (!existingSites) {
    localStorage.setItem(SITES_STORAGE_KEY, JSON.stringify(MOCK_SITES));
  }
  
  if (!existingOffices) {
    localStorage.setItem(OFFICES_STORAGE_KEY, JSON.stringify(MOCK_OFFICES));
  }
};

// Obtener todas las sedes
export const getAllSites = (): Site[] => {
  initializeLocationData();
  const sitesData = localStorage.getItem(SITES_STORAGE_KEY);
  return sitesData ? JSON.parse(sitesData) : [];
};

// Obtener sede por ID
export const getSiteById = (id: string): Site | undefined => {
  const sites = getAllSites();
  return sites.find(site => site.id === id);
};

// Obtener todos los consultorios
export const getAllOffices = (): Office[] => {
  initializeLocationData();
  const officesData = localStorage.getItem(OFFICES_STORAGE_KEY);
  return officesData ? JSON.parse(officesData) : [];
};

// Obtener consultorio por ID
export const getOfficeById = (id: string): Office | undefined => {
  const offices = getAllOffices();
  return offices.find(office => office.id === id);
};

// Obtener consultorios por sede
export const getOfficesBySite = (siteId: string): Office[] => {
  const offices = getAllOffices();
  return offices.filter(office => office.siteId === siteId);
};

// Agregar nueva sede
export const addSite = (siteData: SiteFormValues): Site => {
  const sites = getAllSites();
  
  const newSite: Site = {
    id: `site-${nanoid(8)}`,
    ...siteData,
    totalOffices: 0,
    officeIds: []
  };
  
  const updatedSites = [...sites, newSite];
  localStorage.setItem(SITES_STORAGE_KEY, JSON.stringify(updatedSites));
  
  return newSite;
};

// Actualizar sede existente
export const updateSite = (id: string, siteData: SiteFormValues): Site | undefined => {
  const sites = getAllSites();
  const siteIndex = sites.findIndex(site => site.id === id);
  
  if (siteIndex === -1) return undefined;
  
  const existingSite = sites[siteIndex];
  const updatedSite: Site = {
    ...existingSite,
    ...siteData,
    id
  };
  
  sites[siteIndex] = updatedSite;
  localStorage.setItem(SITES_STORAGE_KEY, JSON.stringify(sites));
  
  return updatedSite;
};

// Agregar nuevo consultorio
export const addOffice = (officeData: OfficeFormValues): Office => {
  const offices = getAllOffices();
  const sites = getAllSites();
  
  const newOffice: Office = {
    id: `office-${nanoid(8)}`,
    ...officeData,
    currentPatients: 0
  };
  
  // Actualizar lista de consultorios
  const updatedOffices = [...offices, newOffice];
  localStorage.setItem(OFFICES_STORAGE_KEY, JSON.stringify(updatedOffices));
  
  // Actualizar la sede correspondiente
  const siteIndex = sites.findIndex(site => site.id === officeData.siteId);
  if (siteIndex !== -1) {
    sites[siteIndex].officeIds.push(newOffice.id);
    sites[siteIndex].totalOffices += 1;
    localStorage.setItem(SITES_STORAGE_KEY, JSON.stringify(sites));
  }
  
  return newOffice;
};

// Actualizar consultorio existente
export const updateOffice = (id: string, officeData: OfficeFormValues): Office | undefined => {
  const offices = getAllOffices();
  const officeIndex = offices.findIndex(office => office.id === id);
  
  if (officeIndex === -1) return undefined;
  
  const existingOffice = offices[officeIndex];
  const updatedOffice: Office = {
    ...existingOffice,
    ...officeData,
    id
  };
  
  // Si cambió la sede, actualizar las referencias
  if (existingOffice.siteId !== officeData.siteId) {
    const sites = getAllSites();
    
    // Remover de la sede anterior
    const oldSiteIndex = sites.findIndex(site => site.id === existingOffice.siteId);
    if (oldSiteIndex !== -1) {
      sites[oldSiteIndex].officeIds = sites[oldSiteIndex].officeIds.filter(oid => oid !== id);
      sites[oldSiteIndex].totalOffices -= 1;
    }
    
    // Agregar a la nueva sede
    const newSiteIndex = sites.findIndex(site => site.id === officeData.siteId);
    if (newSiteIndex !== -1) {
      sites[newSiteIndex].officeIds.push(id);
      sites[newSiteIndex].totalOffices += 1;
    }
    
    localStorage.setItem(SITES_STORAGE_KEY, JSON.stringify(sites));
  }
  
  offices[officeIndex] = updatedOffice;
  localStorage.setItem(OFFICES_STORAGE_KEY, JSON.stringify(offices));
  
  return updatedOffice;
};

// Eliminar sede
export const deleteSite = (id: string): boolean => {
  const sites = getAllSites();
  const updatedSites = sites.filter(site => site.id !== id);
  
  if (updatedSites.length === sites.length) return false;
  
  // Eliminar también los consultorios asociados
  const offices = getAllOffices();
  const updatedOffices = offices.filter(office => office.siteId !== id);
  
  localStorage.setItem(SITES_STORAGE_KEY, JSON.stringify(updatedSites));
  localStorage.setItem(OFFICES_STORAGE_KEY, JSON.stringify(updatedOffices));
  
  return true;
};

// Eliminar consultorio
export const deleteOffice = (id: string): boolean => {
  const offices = getAllOffices();
  const officeToDelete = offices.find(office => office.id === id);
  
  if (!officeToDelete) return false;
  
  const updatedOffices = offices.filter(office => office.id !== id);
  
  // Actualizar la sede correspondiente
  const sites = getAllSites();
  const siteIndex = sites.findIndex(site => site.id === officeToDelete.siteId);
  
  if (siteIndex !== -1) {
    sites[siteIndex].officeIds = sites[siteIndex].officeIds.filter(oid => oid !== id);
    sites[siteIndex].totalOffices -= 1;
    localStorage.setItem(SITES_STORAGE_KEY, JSON.stringify(sites));
  }
  
  localStorage.setItem(OFFICES_STORAGE_KEY, JSON.stringify(updatedOffices));
  
  return true;
};

// Cambiar el estado de un consultorio
export const updateOfficeStatus = (id: string, status: Office["status"], currentPatients?: number): Office | undefined => {
  const offices = getAllOffices();
  const officeIndex = offices.findIndex(office => office.id === id);
  
  if (officeIndex === -1) return undefined;
  
  const updatedOffice = {
    ...offices[officeIndex],
    status,
    ...(currentPatients !== undefined && { currentPatients })
  };
  
  offices[officeIndex] = updatedOffice;
  localStorage.setItem(OFFICES_STORAGE_KEY, JSON.stringify(offices));
  
  return updatedOffice;
};

// Buscar sedes por nombre o ciudad
export const searchSites = (query: string): Site[] => {
  if (!query.trim()) return getAllSites();
  
  const sites = getAllSites();
  const lowerCaseQuery = query.toLowerCase();
  
  return sites.filter(site => 
    site.name.toLowerCase().includes(lowerCaseQuery) ||
    site.city.toLowerCase().includes(lowerCaseQuery) ||
    site.address.toLowerCase().includes(lowerCaseQuery)
  );
};

// Buscar consultorios por nombre, especialidad o doctor
export const searchOffices = (query: string): Office[] => {
  if (!query.trim()) return getAllOffices();
  
  const offices = getAllOffices();
  const lowerCaseQuery = query.toLowerCase();
  
  return offices.filter(office => 
    office.name.toLowerCase().includes(lowerCaseQuery) ||
    (office.assignedDoctor && office.assignedDoctor.toLowerCase().includes(lowerCaseQuery)) ||
    (office.specialties && office.specialties.some(s => s.toLowerCase().includes(lowerCaseQuery)))
  );
};
