import AsyncStorage from '@react-native-async-storage/async-storage';

import { onRemote, persist } from '@/lib/persist';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import type { IconRef } from '@/icons';

export type Tally = {
  id: string;
  name: string;
  color: string;
  /** El ícono animado del botón. Los contadores viejos no lo tienen y usan el auto. */
  icon?: IconRef;
  /** Timestamps (ms) de cada vez que se marcó, del más viejo al más nuevo. */
  events: number[];
};

const STORAGE_KEY = 'tallies:v1';
const LAST_USED_KEY = 'tallies:lastUsed';

export const TallyColors = ['#F97316', '#3B82F6', '#22C55E', '#EC4899', '#A855F7', '#EAB308'];

type TallyStore = {
  tallies: Tally[];
  loaded: boolean;
  /** El contador que se muestra al centro: el último usado. */
  current: Tally | null;
  addTally: (name: string) => void;
  increment: (id: string) => void;
  undo: (id: string) => void;
  select: (id: string) => void;
  updateTally: (id: string, changes: Partial<Pick<Tally, 'name' | 'icon'>>) => void;
  /** Mueve un contador a otra posición de la lista (para reordenar arrastrando). */
  moveTally: (id: string, toIndex: number) => void;
  removeTally: (id: string) => void;
};

const TallyContext = createContext<TallyStore | null>(null);

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function TallyProvider({ children }: { children: ReactNode }) {
  const [tallies, setTallies] = useState<Tally[]>([]);
  const [lastUsedId, setLastUsedId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(STORAGE_KEY), AsyncStorage.getItem(LAST_USED_KEY)])
      .then(([raw, lastUsed]) => {
        if (raw) setTallies(JSON.parse(raw));
        setLastUsedId(lastUsed);
      })
      .finally(() => setLoaded(true));
  }, []);

  // Si llega algo más nuevo de la nube (otro dispositivo), se usa eso.
  useEffect(() => onRemote(STORAGE_KEY, (value) => setTallies(value as Tally[])), []);

  useEffect(() => {
    // No guardar antes de cargar, o pisaríamos lo guardado con la lista vacía.
    if (loaded) persist(STORAGE_KEY, tallies);
  }, [tallies, loaded]);

  useEffect(() => {
    if (loaded && lastUsedId) AsyncStorage.setItem(LAST_USED_KEY, lastUsedId);
  }, [lastUsedId, loaded]);

  const update = (id: string, fn: (t: Tally) => Tally) =>
    setTallies((prev) => prev.map((t) => (t.id === id ? fn(t) : t)));

  // Si el último usado no existe (por ejemplo, se eliminó), cae al que tuvo la marca más reciente.
  const current =
    tallies.find((t) => t.id === lastUsedId) ??
    [...tallies].sort((a, b) => (b.events.at(-1) ?? 0) - (a.events.at(-1) ?? 0))[0] ??
    null;

  const store: TallyStore = {
    tallies,
    loaded,
    current,
    addTally: (name) => {
      const id = newId();
      setTallies((prev) => [
        ...prev,
        { id, name, color: TallyColors[prev.length % TallyColors.length], events: [] },
      ]);
      setLastUsedId(id);
    },
    increment: (id) => {
      update(id, (t) => ({ ...t, events: [...t.events, Date.now()] }));
      setLastUsedId(id);
    },
    undo: (id) => update(id, (t) => ({ ...t, events: t.events.slice(0, -1) })),
    select: setLastUsedId,
    updateTally: (id, changes) => update(id, (t) => ({ ...t, ...changes })),
    moveTally: (id, toIndex) =>
      setTallies((prev) => {
        const from = prev.findIndex((t) => t.id === id);
        if (from < 0 || from === toIndex) return prev;
        const next = [...prev];
        const [moved] = next.splice(from, 1);
        next.splice(toIndex, 0, moved);
        return next;
      }),
    removeTally: (id) => setTallies((prev) => prev.filter((t) => t.id !== id)),
  };

  return <TallyContext.Provider value={store}>{children}</TallyContext.Provider>;
}

export function useTallies() {
  const store = useContext(TallyContext);
  if (!store) throw new Error('useTallies tiene que usarse dentro de <TallyProvider>');
  return store;
}
