import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '../types/database';

const SUPABASE_URL = "https://yaijklexbsvoaaudxpzm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhaWprbGV4YnN2b2FhdWR4cHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNDM4NTgsImV4cCI6MjA4NjkxOTg1OH0.NeLVROBA3YV_bbmYqczu_OGjyC0sfFwrNwy7j1xDlGc";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

