// Supabase types for mobile app, updated to include all new tables
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          college: string | null
          created_at: string
          display_name: string
          games_played: number | null
          id: string
          phone_number: string | null
          rating: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          college?: string | null
          created_at?: string
          display_name: string
          games_played?: number | null
          id?: string
          phone_number?: string | null
          rating?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          college?: string | null
          created_at?: string
          display_name?: string
          games_played?: number | null
          id?: string
          phone_number?: string | null
          rating?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      game_plans: {
        Row: {
          created_at: string
          current_players: number | null
          date: string
          description: string | null
          id: string
          lat: number | null
          location: string
          lng: number | null
          city: string | null
          country_code: string | null
          max_players: number
          organizer_id: string
          sport: Database["public"]["Enums"]["sport_type"]
          status: Database["public"]["Enums"]["plan_status"] | null
          time: string
          title: string
          total_cost: number
          updated_at: string
          group_id: string | null
          public: boolean | null
        }
        Insert: {
          created_at?: string
          current_players?: number | null
          date: string
          description?: string | null
          id?: string
          lat?: number | null
          location: string
          lng?: number | null
          city?: string | null
          country_code?: string | null
          max_players: number
          organizer_id: string
          sport: Database["public"]["Enums"]["sport_type"]
          status?: Database["public"]["Enums"]["plan_status"] | null
          time: string
          title: string
          total_cost: number
          updated_at?: string
          group_id?: string | null
          public?: boolean | null
        }
        Update: {
          created_at?: string
          current_players?: number | null
          date?: string
          description?: string | null
          id?: string
          lat?: number | null
          location?: string
          lng?: number | null
          city?: string | null
          country_code?: string | null
          max_players?: number
          organizer_id?: string
          sport?: Database["public"]["Enums"]["sport_type"]
          status?: Database["public"]["Enums"]["plan_status"] | null
          time?: string
          title?: string
          total_cost?: number
          updated_at?: string
          group_id?: string | null
          public?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_game_plans_organizer"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_game_plans_group"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      join_requests: {
        Row: {
          created_at: string
          id: string
          plan_id: string
          status: Database["public"]["Enums"]["request_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_id: string
          status?: Database["public"]["Enums"]["request_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["request_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_join_requests_plan"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "game_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_join_requests_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          plan_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          plan_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          plan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_messages_plan"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "game_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_messages_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      plan_participants: {
        Row: {
          has_paid: boolean | null
          id: string
          joined_at: string
          plan_id: string
          user_id: string
        }
        Insert: {
          has_paid?: boolean | null
          id?: string
          joined_at?: string
          plan_id: string
          user_id: string
        }
        Update: {
          has_paid?: boolean | null
          id?: string
          joined_at?: string
          plan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_plan_participants_plan"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "game_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_plan_participants_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          is_admin: boolean | null
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          is_admin?: boolean | null
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          is_admin?: boolean | null
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      group_messages: {
        Row: {
          id: string
          group_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
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
      plan_status: "open" | "full" | "completed" | "cancelled"
      request_status: "pending" | "approved" | "rejected"
      sport_type:
        | "football"
        | "cricket"
        | "badminton"
        | "basketball"
        | "tennis"
        | "volleyball"
        | "table_tennis"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      game_plans: {
        Row: {
          created_at: string
          current_players: number | null
          date: string
          description: string | null
          id: string
          lat: number | null
          location: string
          lng: number | null
          city: string | null
          country_code: string | null
          max_players: number
          organizer_id: string
          sport: Database["public"]["Enums"]["sport_type"]
          status: Database["public"]["Enums"]["plan_status"] | null
          time: string
          title: string
          total_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_players?: number | null
          date: string
          description?: string | null
          id?: string
          lat?: number | null
          location: string
          lng?: number | null
          city?: string | null
          country_code?: string | null
          max_players: number
          organizer_id: string
          sport: Database["public"]["Enums"]["sport_type"]
          status?: Database["public"]["Enums"]["plan_status"] | null
          time: string
          title: string
          total_cost: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_players?: number | null
          date?: string
          description?: string | null
          id?: string
          lat?: number | null
          location?: string
          lng?: number | null
          city?: string | null
          country_code?: string | null
          max_players?: number
          organizer_id?: string
          sport?: Database["public"]["Enums"]["sport_type"]
          status?: Database["public"]["Enums"]["plan_status"] | null
          time?: string
          title?: string
          total_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_game_plans_organizer"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      join_requests: {
        Row: {
          created_at: string
          id: string
          plan_id: string
          status: Database["public"]["Enums"]["request_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_id: string
          status?: Database["public"]["Enums"]["request_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["request_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_join_requests_plan"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "game_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_join_requests_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          plan_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          plan_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          plan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_messages_plan"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "game_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_messages_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      plan_participants: {
        Row: {
          has_paid: boolean | null
          id: string
          joined_at: string
          plan_id: string
          user_id: string
        }
        Insert: {
          has_paid?: boolean | null
          id?: string
          joined_at?: string
          plan_id: string
          user_id: string
        }
        Update: {
          has_paid?: boolean | null
          id?: string
          joined_at?: string
          plan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_plan_participants_plan"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "game_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_plan_participants_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
  profiles: {
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      },
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          is_admin: boolean | null
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          is_admin?: boolean | null
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          is_admin?: boolean | null
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      },
      group_messages: {
        Row: {
          id: string
          group_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      },
        Row: {
          avatar_url: string | null
          city: string | null
          college: string | null
          created_at: string
          display_name: string
          games_played: number | null
          id: string
          phone_number: string | null
          rating: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          college?: string | null
          created_at?: string
          display_name: string
          games_played?: number | null
          id?: string
          phone_number?: string | null
          rating?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          college?: string | null
          created_at?: string
          display_name?: string
          games_played?: number | null
          id?: string
          phone_number?: string | null
          rating?: number | null
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
      plan_status: "open" | "full" | "completed" | "cancelled"
      request_status: "pending" | "approved" | "rejected"
      sport_type:
        | "football"
        | "cricket"
        | "badminton"
        | "basketball"
        | "tennis"
        | "volleyball"
        | "table_tennis"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

