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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          booked_at: string
          cancelled_at: string | null
          completed_at: string | null
          id: string
          meeting_id: string
          mentor_id: string
          reminder_sent_at: string | null
          slot_id: string
          status: Database["public"]["Enums"]["booking_status"]
          student_id: string
        }
        Insert: {
          booked_at?: string
          cancelled_at?: string | null
          completed_at?: string | null
          id?: string
          meeting_id?: string
          mentor_id: string
          reminder_sent_at?: string | null
          slot_id: string
          status?: Database["public"]["Enums"]["booking_status"]
          student_id: string
        }
        Update: {
          booked_at?: string
          cancelled_at?: string | null
          completed_at?: string | null
          id?: string
          meeting_id?: string
          mentor_id?: string
          reminder_sent_at?: string | null
          slot_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentors: {
        Row: {
          bio: string
          created_at: string
          experience: number
          id: string
          profile_id: string
          rating: number
          specialization: string
          total_reviews: number
        }
        Insert: {
          bio?: string
          created_at?: string
          experience?: number
          id?: string
          profile_id: string
          rating?: number
          specialization?: string
          total_reviews?: number
        }
        Update: {
          bio?: string
          created_at?: string
          experience?: number
          id?: string
          profile_id?: string
          rating?: number
          specialization?: string
          total_reviews?: number
        }
        Relationships: [
          {
            foreignKeyName: "mentors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string
          email: string
          id: string
          name: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          email?: string
          id: string
          name?: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          mentor_id: string
          rating: number
          review: string
          student_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          mentor_id: string
          rating: number
          review?: string
          student_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          mentor_id?: string
          rating?: number
          review?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      slots: {
        Row: {
          created_at: string
          date: string
          end_time: string
          id: string
          mentor_id: string
          start_time: string
          status: Database["public"]["Enums"]["slot_status"]
        }
        Insert: {
          created_at?: string
          date: string
          end_time: string
          id?: string
          mentor_id: string
          start_time: string
          status?: Database["public"]["Enums"]["slot_status"]
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          mentor_id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["slot_status"]
        }
        Relationships: [
          {
            foreignKeyName: "slots_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      book_slot: {
        Args: { _slot_id: string }
        Returns: {
          booked_at: string
          cancelled_at: string | null
          completed_at: string | null
          id: string
          meeting_id: string
          mentor_id: string
          reminder_sent_at: string | null
          slot_id: string
          status: Database["public"]["Enums"]["booking_status"]
          student_id: string
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_booking: {
        Args: { _booking_id: string }
        Returns: {
          booked_at: string
          cancelled_at: string | null
          completed_at: string | null
          id: string
          meeting_id: string
          mentor_id: string
          reminder_sent_at: string | null
          slot_id: string
          status: Database["public"]["Enums"]["booking_status"]
          student_id: string
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_booking: {
        Args: { _booking_id: string }
        Returns: {
          booked_at: string
          cancelled_at: string | null
          completed_at: string | null
          id: string
          meeting_id: string
          mentor_id: string
          reminder_sent_at: string | null
          slot_id: string
          status: Database["public"]["Enums"]["booking_status"]
          student_id: string
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      expire_stale_sessions: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "mentor" | "student" | "admin"
      booking_status: "BOOKED" | "CANCELLED" | "COMPLETED" | "EXPIRED"
      slot_status:
        | "AVAILABLE"
        | "BOOKED"
        | "CANCELLED"
        | "COMPLETED"
        | "EXPIRED"
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
      app_role: ["mentor", "student", "admin"],
      booking_status: ["BOOKED", "CANCELLED", "COMPLETED", "EXPIRED"],
      slot_status: ["AVAILABLE", "BOOKED", "CANCELLED", "COMPLETED", "EXPIRED"],
    },
  },
} as const
