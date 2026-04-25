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
          status: 'pending' | 'pending_payment' | 'payment_failed' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          payment_method: 'cash' | 'manual_transfer' | 'bayarcash' | null
          payment_proof_url: string | null
          before_photo_url: string | null
          after_photo_url: string | null
          additional_items: Json | null
          admin_remarks: string | null
          order_id: string
          payment_balance: number | null
          updated_at: string | null
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
          status?: 'pending' | 'pending_payment' | 'payment_failed' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          payment_method?: 'cash' | 'manual_transfer' | 'bayarcash' | null
          payment_proof_url?: string | null
          before_photo_url?: string | null
          after_photo_url?: string | null
          additional_items?: Json | null
          admin_remarks?: string | null
          order_id: string
          payment_balance?: number | null
          updated_at?: string | null
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
          status?: 'pending' | 'pending_payment' | 'payment_failed' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          payment_method?: 'cash' | 'manual_transfer' | 'bayarcash' | null
          payment_proof_url?: string | null
          before_photo_url?: string | null
          after_photo_url?: string | null
          additional_items?: Json | null
          admin_remarks?: string | null
          order_id?: string
          payment_balance?: number | null
          updated_at?: string | null
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
