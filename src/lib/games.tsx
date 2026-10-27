import AsyncStorage from '@react-native-async-storage/async-storage';

import { onRemote, persist } from '@/lib/persist';
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

/** Los estados de un juego, en orden: jugando, jugado y pendiente (para jugar después). */
export const GameStatuses = ['playing', 'played', 'backlog'] as const;
export type GameStatus = (typeof GameStatuses)[number];

export type Insight = { id: string; text: string; createdAt: number };

/** La reseña escrita, con título, subtítulo y cuerpo. */
export type WrittenReview = { title: string; subtitle: string; body: string; updatedAt: number };

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
  /** Notas de la versión anterior. Si hay y todavía no hay reseña, pasan a ser su cuerpo. */
  notes: string;
  review?: WrittenReview;
  insights: Insight[];
  /** 0,5 a 5 (de media en media) por categoría, más `overall`. Si una no está, todavía no se puntuó. */
  ratings: Partial<Record<RatingCategory | 'overall', number>>;
  addedAt: number;
  /** El id del mismo juego en RetroAchievements, si está enlazado (para ver los logros). */
  raGameId?: number;
  /** En qué plataformas lo jugaste (de las de tu perfil). Puede ser más de una. */
  platforms?: string[];
};

export type GameList = { id: string; name: string };

const STORAGE_KEY = 'games:v1';

type Saved = { games: Game[]; lists: GameList[] };

type GamesStore = Saved & {
  loaded: boolean;
  /** `extra` agrega o pisa campos del juego nuevo (por ejemplo `raGameId`). */
  addGame: (info: GameInfo, status: GameStatus, extra?: Partial<Game>) => void;
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

  // Si llega algo más nuevo de la nube (otro dispositivo), se usa eso.
  useEffect(() => onRemote(STORAGE_KEY, (value) => setSaved(value as Saved)), []);

  useEffect(() => {
    if (loaded) persist(STORAGE_KEY, saved);
  }, [saved, loaded]);

  const updateGames = (fn: (games: Game[]) => Game[]) =>
    setSaved((s) => ({ ...s, games: fn(s.games) }));

  const store: GamesStore = {
    ...saved,
    loaded,
    addGame: (info, status, extra) =>
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
                ...extra,
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

/** La reseña de un juego, con las notas viejas como cuerpo si todavía no se escribió una. */
export function reviewOf(game: Game): WrittenReview {
  return game.review ?? { title: '', subtitle: '', body: game.notes, updatedAt: game.addedAt };
}

export function useGames() {
  const store = useContext(GamesContext);
  if (!store) throw new Error('useGames tiene que usarse dentro de <GamesProvider>');
  return store;
}
