/** En el navegador: igual que supabase.ts, pero la sesión queda en el localStorage del navegador. */
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase =
  url && key && typeof window !== 'undefined'
    ? createClient(url, key, {
        auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
      })
    : null;
