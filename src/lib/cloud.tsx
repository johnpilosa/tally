/**
 * Tu cuenta en la nube (Supabase) y la sincronización de tus datos.
 *
 * Cada cosa guardada (juegos, perfil, contadores, íconos) es una fila en la tabla `user_data`
 * de tu cuenta. Al entrar, y cada vez que vuelves a la app, se compara con el teléfono y gana
 * lo más reciente. Cada cambio en el teléfono se sube unos segundos después.
 * La primera vez que entras con una cuenta en este teléfono, lo que ya tenías se junta con lo
 * de la cuenta, para no perder nada de ninguno de los dos lados.
 *
 * No se suben: la key de RetroAchievements ni el idioma (quedan solo en este teléfono).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { applyRemote, onLocalChange, readLocal } from '@/lib/persist';
import { supabase } from '@/lib/supabase';

/** Lo que se sincroniza, y cómo juntarlo la primera vez (`merge(local, nube)`). */
const SYNCED: Record<string, { empty: unknown; merge: (local: any, remote: any) => unknown }> = {
  'games:v1': {
    empty: { games: [], lists: [] },
    merge: (local, remote) => ({
      games: unionById(remote.games ?? [], local.games ?? []),
      lists: unionById(remote.lists ?? [], local.lists ?? []),
    }),
  },
  'profile:v1': {
    empty: { photo: null, username: '', bio: '', platforms: [] },
    merge: (local, remote) => ({
      ...local,
      ...Object.fromEntries(Object.entries(remote).filter(([, v]) => v !== '' && v !== null)),
      platforms: [
        ...(remote.platforms ?? []),
        ...(local.platforms ?? []).filter((p: string) => !(remote.platforms ?? []).includes(p)),
      ],
    }),
  },
  'tallies:v1': { empty: [], merge: (local, remote) => unionById(remote, local) },
  'customIcons:v1': { empty: [], merge: (local, remote) => unionById(remote, local) },
};
const KEYS = Object.keys(SYNCED);

/** Junta dos listas por `id`; si un id está en las dos, gana la primera. */
function unionById<T extends { id: string }>(first: T[], second: T[]): T[] {
  const ids = new Set(first.map((x) => x.id));
  return [...first, ...second.filter((x) => !ids.has(x.id))];
}

/** Marca que esta cuenta ya se juntó con este teléfono (después ya no se junta, gana lo nuevo). */
const linkedKey = (userId: string) => `sync:linked:${userId}`;

export type CloudStatus = 'off' | 'signedOut' | 'syncing' | 'synced' | 'offline';

type CloudStore = {
  /** false si la app no tiene Supabase configurado: entonces no hay cuentas. */
  available: boolean;
  session: Session | null;
  status: CloudStatus;
  lastSync: number | null;
  signIn: (email: string, password: string) => Promise<void>;
  /** Devuelve true si hay que confirmar el email antes de poder entrar. */
  signUp: (email: string, password: string) => Promise<boolean>;
  /** Sale de la cuenta y deja este teléfono vacío (tus datos quedan en la nube). */
  signOut: () => Promise<void>;
  /** Sube una foto de perfil y devuelve su dirección pública. */
  uploadPhoto: (uri: string) => Promise<string>;
};

const CloudContext = createContext<CloudStore | null>(null);

export function CloudProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  // El estado de la última sincronización; sin cuenta o sin Supabase se calcula abajo.
  const [syncStatus, setStatus] = useState<'syncing' | 'synced' | 'offline'>('syncing');
  const [lastSync, setLastSync] = useState<number | null>(null);
  const pending = useRef(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  /** Sube una cosa guardada a la nube, con la hora en que cambió en el teléfono. */
  const push = async (uid: string, key: string) => {
    const { json, stamp } = await readLocal(key);
    if (!json || !supabase) return;
    const { error } = await supabase.from('user_data').upsert({
      user_id: uid,
      key,
      data: JSON.parse(json),
      updated_at: new Date(stamp || Date.now()).toISOString(),
    });
    if (error) throw error;
  };

  /** Compara todo con la nube: baja lo más nuevo de allá, sube lo más nuevo de acá. */
  const syncAll = async (uid: string) => {
    if (!supabase) return;
    try {
      const { data: rows, error } = await supabase
        .from('user_data')
        .select('key, data, updated_at')
        .eq('user_id', uid);
      if (error) throw error;
      const remote = new Map(rows.map((r) => [r.key, r]));
      const firstTime = !(await AsyncStorage.getItem(linkedKey(uid)));

      for (const key of KEYS) {
        const local = await readLocal(key);
        const row = remote.get(key);
        const remoteStamp = row ? Date.parse(row.updated_at) : 0;

        if (row && firstTime) {
          // Primera vez en este teléfono: se junta lo de los dos lados y se sube el resultado.
          const merged = SYNCED[key].merge(
            local.json ? JSON.parse(local.json) : SYNCED[key].empty,
            row.data,
          );
          await applyRemote(key, JSON.stringify(merged), Date.now());
          await push(uid, key);
        } else if (row && remoteStamp > local.stamp) {
          await applyRemote(key, JSON.stringify(row.data), remoteStamp);
        } else if (local.json && (!row || local.stamp > remoteStamp)) {
          await push(uid, key);
        }
      }
      await AsyncStorage.setItem(linkedKey(uid), '1');
      setLastSync(Date.now());
      setStatus('synced');
    } catch {
      setStatus('offline');
    }
  };

  // Al entrar a la cuenta (o abrir la app ya dentro), y cada vez que la app vuelve a primer plano.
  useEffect(() => {
    if (!userId) return;
    // (Después del render: la sincronización cambia el estado cuando termina.)
    const first = setTimeout(() => syncAll(userId), 0);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncAll(userId);
    });
    return () => {
      clearTimeout(first);
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Cada cambio en el teléfono se sube un poco después (juntando los cambios seguidos).
  useEffect(() => {
    if (!userId) return;
    return onLocalChange((key) => {
      if (!KEYS.includes(key)) return;
      pending.current.add(key);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        const keys = [...pending.current];
        pending.current.clear();
        try {
          await Promise.all(keys.map((k) => push(userId, k)));
          setLastSync(Date.now());
          setStatus('synced');
        } catch {
          // Sin internet: queda anotado como más nuevo acá y se sube en la próxima sincronización.
          setStatus('offline');
        }
      }, 1500);
    });
  }, [userId]);

  const status: CloudStatus = !supabase ? 'off' : !userId ? 'signedOut' : syncStatus;

  const store: CloudStore = {
    available: !!supabase,
    session,
    status,
    lastSync,
    signIn: async (email, password) => {
      if (!supabase) return;
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    signUp: async (email, password) => {
      if (!supabase) return false;
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return !data.session;
    },
    signOut: async () => {
      if (!supabase) return;
      // Antes de salir, lo pendiente se sube; después el teléfono queda vacío para otra persona.
      if (userId) await Promise.all(KEYS.map((k) => push(userId, k).catch(() => {})));
      await supabase.auth.signOut();
      for (const key of KEYS) await applyRemote(key, JSON.stringify(SYNCED[key].empty), 0);
    },
    uploadPhoto: async (uri) => {
      if (!supabase || !userId) throw new Error('signed out');
      const body = await (await fetch(uri)).arrayBuffer();
      const path = `${userId}/avatar.jpg`;
      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, body, { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      // El ?v= cambia en cada foto nueva, para que no se muestre la anterior guardada en caché.
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      return `${data.publicUrl}?v=${Date.now()}`;
    },
  };

  return <CloudContext.Provider value={store}>{children}</CloudContext.Provider>;
}

export function useCloud() {
  const store = useContext(CloudContext);
  if (!store) throw new Error('useCloud tiene que usarse dentro de <CloudProvider>');
  return store;
}
