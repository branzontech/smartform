export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admisiones: {
        Row: {
          contrato_id: string | null
          created_at: string
          diagnostico_principal: string | null
          estado: string
          factura: string | null
          fecha_fin: string | null
          fecha_inicio: string
          fhir_extensions: Json
          id: string
          motivo: string | null
          notas: string | null
          numero_estudio: string | null
          numero_ingreso: string | null
          paciente_id: string
          profesional_nombre: string | null
          servicio_id: string | null
          tipo_admision_id: string | null
          updated_at: string
        }
        Insert: {
          contrato_id?: string | null
          created_at?: string
          diagnostico_principal?: string | null
          estado?: string
          factura?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string
          fhir_extensions?: Json
          id?: string
          motivo?: string | null
          notas?: string | null
          numero_estudio?: string | null
          numero_ingreso?: string | null
          paciente_id: string
          profesional_nombre?: string | null
          servicio_id?: string | null
          tipo_admision_id?: string | null
          updated_at?: string
        }
        Update: {
          contrato_id?: string | null
          created_at?: string
          diagnostico_principal?: string | null
          estado?: string
          factura?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string
          fhir_extensions?: Json
          id?: string
          motivo?: string | null
          notas?: string | null
          numero_estudio?: string | null
          numero_ingreso?: string | null
          paciente_id?: string
          profesional_nombre?: string | null
          servicio_id?: string | null
          tipo_admision_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admisiones_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admisiones_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admisiones_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "tarifarios_servicios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admisiones_tipo_admision_id_fkey"
            columns: ["tipo_admision_id"]
            isOneToOne: false
            referencedRelation: "tipos_admision"
            referencedColumns: ["id"]
          },
        ]
      }
      catalogo_diagnosticos: {
        Row: {
          activo: boolean
          capitulo: string | null
          codigo: string
          created_at: string
          descripcion: string
          fhir_system_uri: string
          id: string
          sistema: string
        }
        Insert: {
          activo?: boolean
          capitulo?: string | null
          codigo: string
          created_at?: string
          descripcion: string
          fhir_system_uri: string
          id?: string
          sistema: string
        }
        Update: {
          activo?: boolean
          capitulo?: string | null
          codigo?: string
          created_at?: string
          descripcion?: string
          fhir_system_uri?: string
          id?: string
          sistema?: string
        }
        Relationships: []
      }
      configuracion_campos_admision: {
        Row: {
          created_at: string
          es_requerido: boolean
          id: string
          label: string
          maestro: string | null
          opciones: Json | null
          orden: number
          placeholder: string | null
          tipo_dato: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          es_requerido?: boolean
          id?: string
          label: string
          maestro?: string | null
          opciones?: Json | null
          orden?: number
          placeholder?: string | null
          tipo_dato?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          es_requerido?: boolean
          id?: string
          label?: string
          maestro?: string | null
          opciones?: Json | null
          orden?: number
          placeholder?: string | null
          tipo_dato?: string
          updated_at?: string
        }
        Relationships: []
      }
      configuracion_campos_paciente: {
        Row: {
          created_at: string
          es_requerido: boolean
          id: string
          label: string
          maestro: string | null
          opciones: Json | null
          orden: number
          placeholder: string | null
          tipo_dato: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          es_requerido?: boolean
          id?: string
          label: string
          maestro?: string | null
          opciones?: Json | null
          orden?: number
          placeholder?: string | null
          tipo_dato?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          es_requerido?: boolean
          id?: string
          label?: string
          maestro?: string | null
          opciones?: Json | null
          orden?: number
          placeholder?: string | null
          tipo_dato?: string
          updated_at?: string
        }
        Relationships: []
      }
      configuracion_encabezado: {
        Row: {
          campos_personalizados: Json
          created_at: string
          direccion: string | null
          email_institucion: string | null
          id: string
          logo_url: string | null
          nit: string | null
          nombre_institucion: string
          resolucion_habilitacion: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          campos_personalizados?: Json
          created_at?: string
          direccion?: string | null
          email_institucion?: string | null
          id?: string
          logo_url?: string | null
          nit?: string | null
          nombre_institucion?: string
          resolucion_habilitacion?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          campos_personalizados?: Json
          created_at?: string
          direccion?: string | null
          email_institucion?: string | null
          id?: string
          logo_url?: string | null
          nit?: string | null
          nombre_institucion?: string
          resolucion_habilitacion?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contratos: {
        Row: {
          created_at: string
          estado: string
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          nombre_convenio: string
          notas: string | null
          pagador_id: string
          reglas_facturacion: Json
          tarifario_id: string | null
          tipo_contratacion: Database["public"]["Enums"]["tipo_contratacion"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          nombre_convenio: string
          notas?: string | null
          pagador_id: string
          reglas_facturacion?: Json
          tarifario_id?: string | null
          tipo_contratacion?: Database["public"]["Enums"]["tipo_contratacion"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          nombre_convenio?: string
          notas?: string | null
          pagador_id?: string
          reglas_facturacion?: Json
          tarifario_id?: string | null
          tipo_contratacion?: Database["public"]["Enums"]["tipo_contratacion"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contratos_pagador_id_fkey"
            columns: ["pagador_id"]
            isOneToOne: false
            referencedRelation: "pagadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_tarifario_id_fkey"
            columns: ["tarifario_id"]
            isOneToOne: false
            referencedRelation: "tarifarios_maestros"
            referencedColumns: ["id"]
          },
        ]
      }
      formularios: {
        Row: {
          created_at: string
          created_by: string | null
          descripcion: string | null
          estado: string
          fhir_extensions: Json
          id: string
          opciones_diseno: Json
          preguntas: Json
          respuestas_count: number
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          estado?: string
          fhir_extensions?: Json
          id?: string
          opciones_diseno?: Json
          preguntas?: Json
          respuestas_count?: number
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          estado?: string
          fhir_extensions?: Json
          id?: string
          opciones_diseno?: Json
          preguntas?: Json
          respuestas_count?: number
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      geocoded_locations: {
        Row: {
          address: string
          city: string | null
          created_at: string
          entity_id: string
          entity_name: string
          entity_type: string
          geocoded_at: string | null
          id: string
          lat: number | null
          lng: number | null
          state: string | null
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          address: string
          city?: string | null
          created_at?: string
          entity_id: string
          entity_name: string
          entity_type: string
          geocoded_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          state?: string | null
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          address?: string
          city?: string | null
          created_at?: string
          entity_id?: string
          entity_name?: string
          entity_type?: string
          geocoded_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          state?: string | null
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "geocoded_locations_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      pacientes: {
        Row: {
          apellidos: string
          carnet: string | null
          ciudad: string | null
          created_at: string
          direccion: string | null
          email: string | null
          estado: string | null
          estado_paciente: string
          fecha_nacimiento: string | null
          fhir_extensions: Json
          id: string
          nombres: string
          numero_documento: string
          numero_historia: string | null
          ocupacion: string | null
          regimen: string | null
          telefono_principal: string
          telefono_secundario: string | null
          tipo_afiliacion: string | null
          tipo_documento: string | null
          updated_at: string
          user_id: string | null
          zona: string | null
        }
        Insert: {
          apellidos: string
          carnet?: string | null
          ciudad?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          estado?: string | null
          estado_paciente?: string
          fecha_nacimiento?: string | null
          fhir_extensions?: Json
          id?: string
          nombres: string
          numero_documento: string
          numero_historia?: string | null
          ocupacion?: string | null
          regimen?: string | null
          telefono_principal: string
          telefono_secundario?: string | null
          tipo_afiliacion?: string | null
          tipo_documento?: string | null
          updated_at?: string
          user_id?: string | null
          zona?: string | null
        }
        Update: {
          apellidos?: string
          carnet?: string | null
          ciudad?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          estado?: string | null
          estado_paciente?: string
          fecha_nacimiento?: string | null
          fhir_extensions?: Json
          id?: string
          nombres?: string
          numero_documento?: string
          numero_historia?: string | null
          ocupacion?: string | null
          regimen?: string | null
          telefono_principal?: string
          telefono_secundario?: string | null
          tipo_afiliacion?: string | null
          tipo_documento?: string | null
          updated_at?: string
          user_id?: string | null
          zona?: string | null
        }
        Relationships: []
      }
      pagadores: {
        Row: {
          activo: boolean
          created_at: string
          es_particular: boolean
          id: string
          nombre: string
          numero_identificacion: string | null
          pais: string
          tipo_identificacion: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          es_particular?: boolean
          id?: string
          nombre: string
          numero_identificacion?: string | null
          pais?: string
          tipo_identificacion?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          es_particular?: boolean
          id?: string
          nombre?: string
          numero_identificacion?: string | null
          pais?: string
          tipo_identificacion?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          license_number: string | null
          phone: string | null
          specialty: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          license_number?: string | null
          phone?: string | null
          specialty?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          license_number?: string | null
          phone?: string | null
          specialty?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      respuestas_formularios: {
        Row: {
          admision_id: string | null
          created_at: string
          datos_respuesta: Json
          fecha_registro: string
          fhir_extensions: Json
          formulario_id: string
          id: string
          medico_id: string
          paciente_id: string
          updated_at: string
        }
        Insert: {
          admision_id?: string | null
          created_at?: string
          datos_respuesta?: Json
          fecha_registro?: string
          fhir_extensions?: Json
          formulario_id: string
          id?: string
          medico_id: string
          paciente_id: string
          updated_at?: string
        }
        Update: {
          admision_id?: string | null
          created_at?: string
          datos_respuesta?: Json
          fecha_registro?: string
          fhir_extensions?: Json
          formulario_id?: string
          id?: string
          medico_id?: string
          paciente_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "respuestas_formularios_admision_id_fkey"
            columns: ["admision_id"]
            isOneToOne: false
            referencedRelation: "admisiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respuestas_formularios_formulario_id_fkey"
            columns: ["formulario_id"]
            isOneToOne: false
            referencedRelation: "formularios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respuestas_formularios_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      tarifarios_maestros: {
        Row: {
          created_at: string
          descripcion: string | null
          estado: boolean
          fhir_extensions: Json
          id: string
          moneda: string
          nombre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          estado?: boolean
          fhir_extensions?: Json
          id?: string
          moneda?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          estado?: boolean
          fhir_extensions?: Json
          id?: string
          moneda?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      tarifarios_servicios: {
        Row: {
          activo: boolean
          codigo_servicio: string
          created_at: string
          descripcion_servicio: string
          id: string
          metadata_regulatoria: Json
          sistema_codificacion: string
          tarifario_id: string
          updated_at: string
          valor: number
        }
        Insert: {
          activo?: boolean
          codigo_servicio: string
          created_at?: string
          descripcion_servicio: string
          id?: string
          metadata_regulatoria?: Json
          sistema_codificacion?: string
          tarifario_id: string
          updated_at?: string
          valor?: number
        }
        Update: {
          activo?: boolean
          codigo_servicio?: string
          created_at?: string
          descripcion_servicio?: string
          id?: string
          metadata_regulatoria?: Json
          sistema_codificacion?: string
          tarifario_id?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "tarifarios_servicios_tarifario_id_fkey"
            columns: ["tarifario_id"]
            isOneToOne: false
            referencedRelation: "tarifarios_maestros"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_admision: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          orden: number
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          orden?: number
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          orden?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      zone_statistics: {
        Row: {
          calculated_at: string
          id: string
          occupancy_level: string | null
          total_patients: number
          total_professionals: number
          zone_id: string
        }
        Insert: {
          calculated_at?: string
          id?: string
          occupancy_level?: string | null
          total_patients?: number
          total_professionals?: number
          zone_id: string
        }
        Update: {
          calculated_at?: string
          id?: string
          occupancy_level?: string | null
          total_patients?: number
          total_professionals?: number
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_statistics_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          center_lat: number | null
          center_lng: number | null
          color: string
          created_at: string
          description: string | null
          id: string
          name: string
          polygon_coordinates: Json
          updated_at: string
        }
        Insert: {
          center_lat?: number | null
          center_lng?: number | null
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          polygon_coordinates: Json
          updated_at?: string
        }
        Update: {
          center_lat?: number | null
          center_lng?: number | null
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          polygon_coordinates?: Json
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "doctor"
        | "nurse"
        | "receptionist"
        | "patient"
        | "user"
      tipo_contratacion: "evento" | "capita" | "paquete" | "particular"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "doctor", "nurse", "receptionist", "patient", "user"],
      tipo_contratacion: ["evento", "capita", "paquete", "particular"],
    },
  },
} as const
