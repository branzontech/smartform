export interface CatalogoProcedimiento {
  id: string;
  codigo: string;
  descripcion: string;
  sistema_codificacion: string;
  fhir_system_uri: string;
  capitulo: string | null;
  tipo: 'procedimiento' | 'laboratorio' | 'imagenologia' | 'terapia' | 'otro';
  activo: boolean;
  fhir_extensions: Record<string, any>;
  datos_regulatorios: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ServicioClinico {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  tipo: 'procedimientos' | 'laboratorio' | 'imagenologia' | 'consulta_externa' | 'urgencias' | 'hospitalizacion' | 'cirugia' | 'terapia' | 'odontologia' | 'otro';
  centro_costo: string | null;
  activo: boolean;
  fhir_extensions: Record<string, any>;
  datos_regulatorios: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ServicioProcedimiento {
  id: string;
  servicio_id: string;
  procedimiento_id: string;
  es_predeterminado: boolean;
  orden_visualizacion: number;
  activo: boolean;
  created_at: string;
}
