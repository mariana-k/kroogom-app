import { supabase } from './supabase';
import type { Event, Profile, EventAttendee } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || '';

// Type definitions
type ApiResponse<T> = {
  data: T | null;
  error: string | null;
};

// Event endpoints
export const eventApi = {
  async getEvents(): Promise<ApiResponse<Event[]>> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          attendees_count:event_attendees(count)
        `)
        .gte('end_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;

      return {
        data: data.map(event => ({
          ...event,
          attendees_count: event.attendees_count[0]?.count || 0,
        })),
        error: null
      };
    } catch (e) {
      return { data: null, error: e.message };
    }
  },

  async getEvent(id: string): Promise<ApiResponse<Event>> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organizer:profiles!events_organizer_id_fkey (*),
          attendees_count:event_attendees(count),
          attendees:event_attendees(
            user_id,
            created_at,
            profile:profiles(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return { 
        data: {
          ...data,
          attendees_count: data.attendees_count[0]?.count || 0,
        },
        error: null 
      };
    } catch (e) {
      return { data: null, error: e.message };
    }
  },

  async createEvent(event: Partial<Event>): Promise<ApiResponse<Event>> {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert(event)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (e) {
      return { data: null, error: e.message };
    }
  },

  async updateEvent(id: string, updates: Partial<Event>): Promise<ApiResponse<Event>> {
    try {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (e) {
      return { data: null, error: e.message };
    }
  },

  async deleteEvent(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { data: null, error: null };
    } catch (e) {
      return { data: null, error: e.message };
    }
  }
};

// Profile endpoints
export const profileApi = {
  async getProfile(id: string): Promise<ApiResponse<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (e) {
      return { data: null, error: e.message };
    }
  },

  async updateProfile(id: string, updates: Partial<Profile>): Promise<ApiResponse<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (e) {
      return { data: null, error: e.message };
    }
  },

  async deleteProfile(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.auth.admin.deleteUser(id);

      if (error) throw error;

      return { data: null, error: null };
    } catch (e) {
      return { data: null, error: e.message };
    }
  }
};

// Attendance endpoints
export const attendanceApi = {
  async updateAttendance(eventId: string, userId: string, status: EventAttendee['status'] | null): Promise<ApiResponse<void>> {
    try {
      if (status === null) {
        const { error } = await supabase
          .from('event_attendees')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('event_attendees')
          .upsert({
            event_id: eventId,
            user_id: userId,
            status,
          });

        if (error) throw error;
      }

      return { data: null, error: null };
    } catch (e) {
      return { data: null, error: e.message };
    }
  }
};

// Notification endpoints
export const notificationApi = {
  async getNotifications(): Promise<ApiResponse<Notification[]>> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          event:events (
            title,
            start_time,
            location,
            image_url
          ),
          sender:profiles!notifications_sender_id_fkey (
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return { data, error: null };
    } catch (e) {
      return { data: null, error: e.message };
    }
  },

  async markAsRead(notificationIds: string[]): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', notificationIds);

      if (error) throw error;

      return { data: null, error: null };
    } catch (e) {
      return { data: null, error: e.message };
    }
  }
};