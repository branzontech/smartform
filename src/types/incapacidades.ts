export interface Incapacidad {
  id: string;
  admision_id: string;
  paciente_id: string;
  medico_id: string;
  numero_incapacidad: string;
  fecha_inicio: string;
  duracion_dias: number;
  fecha_fin: string;
  es_prorroga: boolean;
  prorroga_tipo: 'no_prorrogable' | 'prorrogable' | null;
  incapacidad_origen_id: string | null;
  tipo_incapacidad: 'enfermedad_general' | 'accidente_trabajo' | 'enfermedad_laboral' | 'licencia_maternidad' | 'licencia_paternidad';
  grupo_servicios: 'consulta_externa' | 'urgencias' | 'hospitalizacion' | 'cirugia';
  modalidad_prestacion: 'presencial' | 'extramural_domiciliaria' | 'telemedicina_interactiva' | 'telemedicina_no_interactiva' | 'telemedicina_telexperticia' | 'telemedicina_telemonitoreo';
  presunto_origen: 'comun' | 'laboral';
  diagnostico_principal: string;
  diagnostico_rel_1: string | null;
  diagnostico_rel_2: string | null;
  diagnostico_rel_3: string | null;
  medico_nombre: string;
  es_retroactiva: boolean;
  causa_retroactividad: 'no_aplica' | 'urgencia_internacion' | 'trastorno_psiquico_funcional' | 'evento_catastrofico_terrorista' | null;
  causa_atencion: string | null;
  observaciones: string | null;
  estado: 'activa' | 'anulada' | 'cerrada';
  fhir_extensions: Record<string, any>;
  datos_regulatorios: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type IncapacidadFormData = Omit<Incapacidad, 'id' | 'numero_incapacidad' | 'fecha_fin' | 'created_at' | 'updated_at'>;
