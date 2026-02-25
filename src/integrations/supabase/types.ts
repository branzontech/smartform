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
          tipo_admision_id: string | null
          updated_at: string
        }
        Insert: {
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
          tipo_admision_id?: string | null
          updated_at?: string
        }
        Update: {
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
          tipo_admision_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admisiones_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
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
    },
  },
} as const
