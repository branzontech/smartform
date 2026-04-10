export interface OrdenProcedimientoItem {
  id: string;
  orden_id: string;
  procedimiento_id: string;
  codigo_procedimiento: string;
  descripcion_procedimiento: string;
  cantidad: number;
  dias: number;
  notas: string | null;
  fhir_extensions: Record<string, any>;
  created_at: string;
}

/** La orden en sí usa la tabla ordenes_medicas existente con tipo='procedimiento' */
export interface OrdenProcedimientoConItems {
  id: string;
  numero_orden: string;
  tipo: 'procedimiento';
  admision_id: string;
  paciente_id: string;
  medico_id: string;
  medico_nombre: string;
  servicio_id: string | null;
  estado: string;
  prioridad: string;
  alcance: string;
  indicaciones: string | null;
  diagnostico_codigo: string | null;
  diagnostico_descripcion: string | null;
  diagnostico_sistema: string | null;
  fecha_orden: string | null;
  fecha_vigencia: string | null;
  created_at: string;
  items: Record<string, any>[];
  items_detalle?: OrdenProcedimientoItem[];
  servicio?: { nombre: string; codigo: string } | null;
}
