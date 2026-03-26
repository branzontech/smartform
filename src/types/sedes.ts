export type TipoSede =
  | 'hospital'
  | 'clinica'
  | 'consultorio'
  | 'laboratorio'
  | 'centro_diagnostico'
  | 'farmacia'
  | 'bodega'
  | 'sede_administrativa';

export type PaisSede = 'CO' | 'MX' | 'EC' | 'PE' | 'AR';

export interface DatosRegulatoriosCO {
  codigo_habilitacion?: string;
  resolucion_habilitacion?: string;
}

export interface DatosRegulatoriosMX {
  clues?: string;
  licencia_sanitaria?: string;
}

export interface DatosRegulatoriosEC {
  permiso_funcionamiento_arcsa?: string;
}

export interface DatosRegulatoriosPE {
  codigo_renipress?: string;
}

export interface DatosRegulatoriosAR {
  matricula_establecimiento?: string;
}

export type DatosRegulatoriosSede =
  | DatosRegulatoriosCO
  | DatosRegulatoriosMX
  | DatosRegulatoriosEC
  | DatosRegulatoriosPE
  | DatosRegulatoriosAR
  | Record<string, any>;

export interface Sede {
  id: string;
  nombre: string;
  codigo: string;
  tipo: TipoSede;
  direccion: string | null;
  ciudad: string | null;
  departamento_estado: string | null;
  pais: PaisSede;
  codigo_postal: string | null;
  telefono: string | null;
  email: string | null;
  latitud: number | null;
  longitud: number | null;
  responsable_nombre: string | null;
  responsable_id: string | null;
  sede_principal: boolean;
  activo: boolean;
  datos_regulatorios: DatosRegulatoriosSede;
  fhir_extensions: Record<string, any>;
  created_at: string;
  updated_at: string;
}
