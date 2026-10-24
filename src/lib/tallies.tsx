import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Tally = {
  id: string;
  name: string;
  color: string;
  /** Timestamps (ms) de cada vez que se marcó, del más viejo al más nuevo. */
  events: number[];
};

const STORAGE_KEY = 'tallies:v1';

export const TallyColors = ['#F97316', '#3B82F6', '#22C55E', '#EC4899', '#A855F7', '#EAB308'];

type TallyStore = {
  tallies: Tally[];
  loaded: boolean;
  addTally: (name: string) => void;
  increment: (id: string) => void;
  undo: (id: string) => void;
  removeTally: (id: string) => void;
};

const TallyContext = createContext<TallyStore | null>(null);

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function TallyProvider({ children }: { children: ReactNode }) {
  const [tallies, setTallies] = useState<Tally[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setTallies(JSON.parse(raw));
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    // No guardar antes de cargar, o pisaríamos lo guardado con la lista vacía.
    if (loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tallies));
  }, [tallies, loaded]);

  const update = (id: string, fn: (t: Tally) => Tally) =>
    setTallies((prev) => prev.map((t) => (t.id === id ? fn(t) : t)));

  const store: TallyStore = {
    tallies,
    loaded,
    addTally: (name) =>
      setTallies((prev) => [
        ...prev,
        { id: newId(), name, color: TallyColors[prev.length % TallyColors.length], events: [] },
      ]),
    increment: (id) => update(id, (t) => ({ ...t, events: [...t.events, Date.now()] })),
    undo: (id) => update(id, (t) => ({ ...t, events: t.events.slice(0, -1) })),
    removeTally: (id) => setTallies((prev) => prev.filter((t) => t.id !== id)),
  };

  return <TallyContext.Provider value={store}>{children}</TallyContext.Provider>;
}

export function useTallies() {
  const store = useContext(TallyContext);
  if (!store) throw new Error('useTallies tiene que usarse dentro de <TallyProvider>');
  return store;
}
