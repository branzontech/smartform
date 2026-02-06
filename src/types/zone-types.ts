export interface Zone {
  id: string;
  name: string;
  description?: string;
  color: string;
  polygon_coordinates: LatLng[];
  center_lat?: number;
  center_lng?: number;
  created_at: string;
  updated_at: string;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeocodedLocation {
  id: string;
  entity_type: 'patient' | 'professional';
  entity_id: string;
  entity_name: string;
  address: string;
  city?: string;
  state?: string;
  lat?: number;
  lng?: number;
  zone_id?: string;
  geocoded_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ZoneStatistics {
  id: string;
  zone_id: string;
  total_patients: number;
  total_professionals: number;
  occupancy_level: 'low' | 'medium' | 'high';
  calculated_at: string;
}

export interface ZoneWithStats extends Zone {
  statistics?: ZoneStatistics;
  locations?: GeocodedLocation[];
}

export interface MapViewState {
  center: LatLng;
  zoom: number;
}

export type DrawingMode = 'none' | 'polygon' | 'marker';
