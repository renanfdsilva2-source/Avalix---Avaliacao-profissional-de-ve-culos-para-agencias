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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          alarm_fired: boolean
          created_at: string
          evaluation_id: string | null
          google_event_id: string | null
          id: string
          notes: string | null
          scheduled_at: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alarm_fired?: boolean
          created_at?: string
          evaluation_id?: string | null
          google_event_id?: string | null
          id?: string
          notes?: string | null
          scheduled_at: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alarm_fired?: boolean
          created_at?: string
          evaluation_id?: string | null
          google_event_id?: string | null
          id?: string
          notes?: string | null
          scheduled_at?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          ano: string | null
          blindado: boolean
          cambio: string | null
          client_updated_at: string | null
          cor: string | null
          created_at: string
          custom_repairs: Json
          documentation: Json
          financiado: boolean
          financiado_valor: number
          fipe: number | null
          fipe_value: number
          gnv: string | null
          higienizacao: boolean
          id: string
          km: string | null
          last_sync_error: string | null
          manutencao_status: string | null
          manutencao_valor: number
          marca: string | null
          modelo: string | null
          multas: number
          outros_descontos: number
          photos: Json
          pintura_pecas: number
          pintura_total: string | null
          placa: string | null
          pneus: number
          repairs: Json
          signature: string | null
          status: string
          sync_version: number
          total_descontos: number
          updated_at: string
          user_id: string | null
          valor_final: number
        }
        Insert: {
          ano?: string | null
          blindado?: boolean
          cambio?: string | null
          client_updated_at?: string | null
          cor?: string | null
          created_at?: string
          custom_repairs?: Json
          documentation?: Json
          financiado?: boolean
          financiado_valor?: number
          fipe?: number | null
          fipe_value?: number
          gnv?: string | null
          higienizacao?: boolean
          id?: string
          km?: string | null
          last_sync_error?: string | null
          manutencao_status?: string | null
          manutencao_valor?: number
          marca?: string | null
          modelo?: string | null
          multas?: number
          outros_descontos?: number
          photos?: Json
          pintura_pecas?: number
          pintura_total?: string | null
          placa?: string | null
          pneus?: number
          repairs?: Json
          signature?: string | null
          status?: string
          sync_version?: number
          total_descontos?: number
          updated_at?: string
          user_id?: string | null
          valor_final?: number
        }
        Update: {
          ano?: string | null
          blindado?: boolean
          cambio?: string | null
          client_updated_at?: string | null
          cor?: string | null
          created_at?: string
          custom_repairs?: Json
          documentation?: Json
          financiado?: boolean
          financiado_valor?: number
          fipe?: number | null
          fipe_value?: number
          gnv?: string | null
          higienizacao?: boolean
          id?: string
          km?: string | null
          last_sync_error?: string | null
          manutencao_status?: string | null
          manutencao_valor?: number
          marca?: string | null
          modelo?: string | null
          multas?: number
          outros_descontos?: number
          photos?: Json
          pintura_pecas?: number
          pintura_total?: string | null
          placa?: string | null
          pneus?: number
          repairs?: Json
          signature?: string | null
          status?: string
          sync_version?: number
          total_descontos?: number
          updated_at?: string
          user_id?: string | null
          valor_final?: number
        }
        Relationships: []
      }
      google_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          refresh_token: string
          scope: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          refresh_token: string
          scope?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          refresh_token?: string
          scope?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
