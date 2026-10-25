import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import type { GameInfo } from '@/lib/wiki-games';

/** Las categorías que se puntúan de 1 a 5, en este orden. Sus nombres están en i18n. */
export const RatingCategories = [
  'graphics',
  'music',
  'story',
  'pacing',
  'gameplay',
  'replayability',
] as const;
export type RatingCategory = (typeof RatingCategories)[number];

export type GameStatus = 'playing' | 'played';

export type Insight = { id: string; text: string; createdAt: number };

export type Game = {
  /** El identificador de Wikipedia del juego; también sirve como id acá. */
  id: string;
  title: string;
  description: string;
  summary: string;
  coverUrl: string | null;
  status: GameStatus;
  favorite: boolean;
  /** Ids de las listas en las que está ("PS2", "5ta generación"…). */
  listIds: string[];
  notes: string;
  insights: Insight[];
  /** 1 a 5 por categoría, más `overall`. Si una no está, todavía no se puntuó. */
  ratings: Partial<Record<RatingCategory | 'overall', number>>;
  addedAt: number;
};

export type GameList = { id: string; name: string };

const STORAGE_KEY = 'games:v1';

type Saved = { games: Game[]; lists: GameList[] };

type GamesStore = Saved & {
  loaded: boolean;
  addGame: (info: GameInfo, status: GameStatus) => void;
  updateGame: (id: string, changes: Partial<Game>) => void;
  removeGame: (id: string) => void;
  createList: (name: string) => string;
  toggleInList: (gameId: string, listId: string) => void;
  renameList: (id: string, name: string) => void;
  /** Borra la lista. Los juegos no se borran: solo dejan de estar en ella. */
  deleteList: (id: string) => void;
};

const GamesContext = createContext<GamesStore | null>(null);

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function GamesProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Saved>({ games: [], lists: [] });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setSaved(JSON.parse(raw));
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }, [saved, loaded]);

  const updateGames = (fn: (games: Game[]) => Game[]) =>
    setSaved((s) => ({ ...s, games: fn(s.games) }));

  const store: GamesStore = {
    ...saved,
    loaded,
    addGame: (info, status) =>
      updateGames((games) =>
        games.some((g) => g.id === info.key)
          ? games
          : [
              {
                id: info.key,
                title: info.title,
                description: info.description,
                summary: info.summary,
                coverUrl: info.coverUrl,
                status,
                favorite: false,
                listIds: [],
                notes: '',
                insights: [],
                ratings: {},
                addedAt: Date.now(),
              },
              ...games,
            ],
      ),
    updateGame: (id, changes) =>
      updateGames((games) => games.map((g) => (g.id === id ? { ...g, ...changes } : g))),
    removeGame: (id) => updateGames((games) => games.filter((g) => g.id !== id)),
    createList: (name) => {
      const id = newId();
      setSaved((s) => ({ ...s, lists: [...s.lists, { id, name }] }));
      return id;
    },
    toggleInList: (gameId, listId) =>
      updateGames((games) =>
        games.map((g) =>
          g.id !== gameId
            ? g
            : {
                ...g,
                listIds: g.listIds.includes(listId)
                  ? g.listIds.filter((l) => l !== listId)
                  : [...g.listIds, listId],
              },
        ),
      ),
    renameList: (id, name) =>
      setSaved((s) => ({ ...s, lists: s.lists.map((l) => (l.id === id ? { ...l, name } : l)) })),
    deleteList: (id) =>
      setSaved((s) => ({
        lists: s.lists.filter((l) => l.id !== id),
        games: s.games.map((g) => ({ ...g, listIds: g.listIds.filter((l) => l !== id) })),
      })),
  };

  return <GamesContext.Provider value={store}>{children}</GamesContext.Provider>;
}

export function useGames() {
  const store = useContext(GamesContext);
  if (!store) throw new Error('useGames tiene que usarse dentro de <GamesProvider>');
  return store;
}
