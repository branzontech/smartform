export type TipoProducto = 'medicamento' | 'insumo' | 'dispositivo_medico';

export type FhirResourceType = 'Medication' | 'Device' | 'Supply';

export interface CatalogoProducto {
  id: string;
  codigo: string;
  nombre_generico: string;
  nombre_comercial: string | null;
  tipo_producto: TipoProducto;
  principio_activo: string | null;
  codigo_atc: string | null;
  codigo_snomed: string | null;
  fhir_resource_type: FhirResourceType;
  fabricante: string | null;
  requiere_cadena_frio: boolean;
  controlado: boolean;
  activo: boolean;
  fhir_extensions: Record<string, any>;
  created_at: string;
  updated_at: string;
}
