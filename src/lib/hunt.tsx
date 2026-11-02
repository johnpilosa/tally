/**
 * La caza de logros: qué juego estás cazando (uno a la vez), qué logros elegiste del mazo, cuáles
 * saltaste, y el registro de cada logro que la app vio que sacaste (para contar los de hoy y la
 * racha). Se guarda con `persist`, así que también se respalda en tu cuenta.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { onRemote, persist } from '@/lib/persist';

const STORAGE_KEY = 'hunt:v1';

/** Un logro sacado durante la caza. */
export type HuntUnlock = {
  achievementId: number;
  /** El juego en Retro Log. */
  gameId: string;
  title: string;
  badge: string;
  points: number;
  /** Cuándo lo sacaste según RetroAchievements (milisegundos). */
  at: number;
};

export type HuntState = {
  /** El juego que estás cazando (su id en Retro Log), o null. */
  gameId: string | null;
  /** Los logros elegidos, en el orden en que los vas a cazar. */
  targets: number[];
  /** Los que saltaste en el mazo, para no volver a mostrarlos. */
  skipped: number[];
  log: HuntUnlock[];
};

export const EMPTY_HUNT: HuntState = { gameId: null, targets: [], skipped: [], log: [] };

type HuntStore = HuntState & {
  loaded: boolean;
  /** Empieza a cazar otro juego (si es otro, se empieza el mazo de cero). */
  startHunt: (gameId: string) => void;
  addTarget: (id: number) => void;
  skip: (id: number) => void;
  removeTarget: (id: number) => void;
  /** Manda el objetivo actual al final de la fila. */
  later: (id: number) => void;
  resetSkipped: () => void;
  /** Anota logros sacados (los repetidos se ignoran) y los saca de los objetivos. */
  logUnlocks: (unlocks: HuntUnlock[]) => void;
};

const HuntContext = createContext<HuntStore | null>(null);

export function HuntProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HuntState>(EMPTY_HUNT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setState({ ...EMPTY_HUNT, ...JSON.parse(raw) });
      })
      .finally(() => setLoaded(true));
  }, []);

  // Si llega algo más nuevo de la nube (otro dispositivo), se usa eso.
  useEffect(() => onRemote(STORAGE_KEY, (value) => setState(value as HuntState)), []);

  useEffect(() => {
    if (loaded) persist(STORAGE_KEY, state);
  }, [state, loaded]);

  const store: HuntStore = {
    ...state,
    loaded,
    startHunt: (gameId) =>
      setState((s) => (s.gameId === gameId ? s : { ...s, gameId, targets: [], skipped: [] })),
    addTarget: (id) =>
      setState((s) => (s.targets.includes(id) ? s : { ...s, targets: [...s.targets, id] })),
    skip: (id) => setState((s) => ({ ...s, skipped: [...s.skipped, id] })),
    removeTarget: (id) => setState((s) => ({ ...s, targets: s.targets.filter((x) => x !== id) })),
    later: (id) => setState((s) => ({ ...s, targets: [...s.targets.filter((x) => x !== id), id] })),
    resetSkipped: () => setState((s) => ({ ...s, skipped: [] })),
    logUnlocks: (unlocks) =>
      setState((s) => {
        const fresh = unlocks.filter(
          (u) => !s.log.some((l) => l.achievementId === u.achievementId && l.gameId === u.gameId),
        );
        const done = new Set(unlocks.map((u) => u.achievementId));
        if (!fresh.length && !s.targets.some((t) => done.has(t))) return s;
        return {
          ...s,
          log: [...s.log, ...fresh],
          targets: s.targets.filter((t) => !done.has(t)),
        };
      }),
  };

  return <HuntContext.Provider value={store}>{children}</HuntContext.Provider>;
}

export function useHunt() {
  const store = useContext(HuntContext);
  if (!store) throw new Error('useHunt tiene que usarse dentro de <HuntProvider>');
  return store;
}

const DAY = 24 * 60 * 60 * 1000;

/** Cuántos días seguidos (terminando hoy o ayer) sacaste al menos un logro. */
export function streakOf(log: HuntUnlock[], todayStart: number) {
  const days = new Set(log.map((u) => Math.floor((u.at - todayStart) / DAY)));
  let day = days.has(0) ? 0 : -1;
  let streak = 0;
  while (days.has(day)) {
    streak++;
    day--;
  }
  return streak;
}
