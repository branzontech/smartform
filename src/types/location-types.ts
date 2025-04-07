
export type LocationStatus = 
  | "Disponible" 
  | "Ocupado" 
  | "Mantenimiento" 
  | "Reservado";

export interface Office {
  id: string;
  name: string;
  number: string;
  floor: number;
  capacity: number;
  area: number; // metros cuadrados
  status: LocationStatus;
  equipment?: string[];
  currentPatients: number;
  maxPatients: number;
  specialties?: string[];
  assignedDoctor?: string;
  location?: { x: number; y: number }; // coordenadas para el plano
  siteId: string; // referencia a la sede
}

export interface Site {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode?: string;
  phone: string;
  email?: string;
  openingHours?: string;
  totalOffices: number;
  floors: number;
  image?: string;
  coordinates?: { lat: number; lng: number }; // coordenadas geográficas
  officeIds: string[]; // referencias a los consultorios en esta sede
}

export interface OfficeFormValues {
  name: string;
  number: string;
  floor: number;
  capacity: number;
  area: number;
  status: LocationStatus;
  equipment?: string[];
  maxPatients: number;
  specialties?: string[];
  assignedDoctor?: string;
  location?: { x: number; y: number };
  siteId: string;
}

export interface SiteFormValues {
  name: string;
  address: string;
  city: string;
  postalCode?: string;
  phone: string;
  email?: string;
  openingHours?: string;
  floors: number;
  image?: string;
  coordinates?: { lat: number; lng: number };
}
