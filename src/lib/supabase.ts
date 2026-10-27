/**
 * La conexión con Supabase (la nube donde se guardan las cuentas y sus datos).
 * La dirección y la key pública salen de .env.local (EXPO_PUBLIC_SUPABASE_URL y
 * EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY). Son públicas a propósito: lo que protege los datos de
 * cada persona son las reglas de supabase/schema.sql. Si faltan, la app funciona sin cuenta.
 */
import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase =
  url && key
    ? createClient(url, key, {
        auth: {
          // Guarda la sesión en el teléfono, para seguir conectado al volver a abrir la app.
          storage: localStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

// Renueva la sesión solo mientras la app está abierta.
AppState.addEventListener('change', (state) => {
  if (!supabase) return;
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
