export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      bookings: {
        Row: {
          id: string
          created_at: string
          customer_name: string
          phone_number: string
          location: string
          notes: string | null
          package_id: string
          package_name: string
          package_price: number
          status: string
          payment_proof_url: string | null
          order_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          customer_name: string
          phone_number: string
          location: string
          notes?: string | null
          package_id: string
          package_name: string
          package_price: number
          status?: string
          payment_proof_url?: string | null
          order_id: string
        }
        Update: {
          id?: string
          created_at?: string
          customer_name?: string
          phone_number?: string
          location?: string
          notes?: string | null
          package_id?: string
          package_name?: string
          package_price?: number
          status?: string
          payment_proof_url?: string | null
          order_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
          website: string | null
          role: string | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          role?: string | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
