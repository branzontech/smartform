export type EstadoCotizacion = "borrador" | "enviada" | "aceptada" | "rechazada" | "vencida";
export type TipoPersona = "natural" | "juridica";

export interface ClienteCotizacion {
  id: string;
  tipo_persona: TipoPersona;
  tipo_documento: string;
  numero_documento: string;
  nombre_razon_social: string;
  correo: string | null;
  telefono_contacto: string | null;
  direccion: string | null;
  ciudad: string | null;
  pais: string;
  pagador_id: string | null;
  fhir_extensions: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Cotizacion {
  id: string;
  numero_cotizacion: string;
  cliente_cotizacion_id: string;
  fecha_emision: string;
  fecha_validez: string;
  estado: EstadoCotizacion;
  subtotal: number;
  descuento_porcentaje: number;
  descuento_valor: number;
  impuesto_porcentaje: number;
  impuesto_valor: number;
  total: number;
  moneda: string;
  observaciones: string | null;
  leyenda_validez: string | null;
  creado_por: string;
  fhir_extensions: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // joined
  clientes_cotizacion?: ClienteCotizacion;
}

export interface CotizacionItem {
  id: string;
  cotizacion_id: string;
  tarifario_servicio_id: string | null;
  codigo_servicio: string | null;
  descripcion_servicio: string;
  cantidad: number;
  valor_unitario: number;
  descuento_porcentaje: number;
  valor_total: number;
  orden: number;
  fhir_extensions: Record<string, unknown>;
  created_at: string;
}

export interface ConfiguracionCotizaciones {
  id: string;
  dias_validez: number;
  leyenda_validez_defecto: string | null;
  moneda_defecto: string;
  impuesto_defecto: number;
  nombre_impuesto: string;
  notas_legales: string | null;
  fhir_extensions: Record<string, unknown>;
  updated_at: string;
}

export interface CotizacionItemDraft {
  tempId: string;
  tarifario_servicio_id: string | null;
  codigo_servicio: string;
  descripcion_servicio: string;
  cantidad: number;
  valor_unitario: number;
  descuento_porcentaje: number;
  valor_total: number;
}
