import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Custom storage implementation for Supabase
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return Platform.OS !== 'web' 
      ? SecureStore.getItemAsync(key)
      : AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    return Platform.OS !== 'web'
      ? SecureStore.setItemAsync(key, value)
      : AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    return Platform.OS !== 'web'
      ? SecureStore.deleteItemAsync(key)
      : AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Event = Database['public']['Tables']['events']['Row'];
export type EventAttendee = Database['public']['Tables']['event_attendees']['Row'];