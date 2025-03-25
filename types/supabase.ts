export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type EventCategory = 
  | 'tech'
  | 'business'
  | 'arts'
  | 'sports'
  | 'music'
  | 'food'
  | 'education'
  | 'social'
  | 'charity'
  | 'other';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          avatar_url: string | null
          location: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          location?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          location?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          location: string
          start_time: string
          end_time: string
          image_url: string | null
          capacity: number | null
          organizer_id: string
          created_at: string
          updated_at: string
          categories: EventCategory[]
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          location: string
          start_time: string
          end_time: string
          image_url?: string | null
          capacity?: number | null
          organizer_id: string
          created_at?: string
          updated_at?: string
          categories?: EventCategory[]
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          location?: string
          start_time?: string
          end_time?: string
          image_url?: string | null
          capacity?: number | null
          organizer_id?: string
          created_at?: string
          updated_at?: string
          categories?: EventCategory[]
        }
      }
      event_attendees: {
        Row: {
          event_id: string
          user_id: string
          status: 'attending' | 'waitlist' | 'declined'
          created_at: string
        }
        Insert: {
          event_id: string
          user_id: string
          status?: 'attending' | 'waitlist' | 'declined'
          created_at?: string
        }
        Update: {
          event_id?: string
          user_id?: string
          status?: 'attending' | 'waitlist' | 'declined'
          created_at?: string
        }
      }
      event_comments: {
        Row: {
          id: string
          event_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'event_invite' | 'event_update' | 'event_reminder' | 'event_cancelled' | 'new_attendee'
          title: string
          message: string
          event_id: string
          sender_id: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'event_invite' | 'event_update' | 'event_reminder' | 'event_cancelled' | 'new_attendee'
          title: string
          message: string
          event_id: string
          sender_id?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'event_invite' | 'event_update' | 'event_reminder' | 'event_cancelled' | 'new_attendee'
          title?: string
          message?: string
          event_id?: string
          sender_id?: string | null
          read?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      attendance_status: 'attending' | 'waitlist' | 'declined'
      notification_type: 'event_invite' | 'event_update' | 'event_reminder' | 'event_cancelled' | 'new_attendee'
      event_category: EventCategory
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Event = Database['public']['Tables']['events']['Row'];
export type EventAttendee = Database['public']['Tables']['event_attendees']['Row'];
export type EventComment = Database['public']['Tables']['event_comments']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];