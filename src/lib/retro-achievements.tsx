/**
 * RetroAchievements: tu cuenta (usuario + Web API Key) y las consultas a su API.
 *
 * La cuenta se guarda solo en este teléfono (AsyncStorage), nunca en el código: así no termina
 * en GitHub. La key se saca en retroachievements.org → tu avatar → Settings → Keys.
 * Docs de la API: https://api-docs.retroachievements.org
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const API = 'https://retroachievements.org/API';
const MEDIA = 'https://media.retroachievements.org';
const STORAGE_KEY = 'ra:account';

export type RAAccount = { user: string; key: string };

export type RAProfile = { user: string; userPic: string; totalPoints: number };

/** Un juego que jugaste hace poco, con cuántos logros llevas. */
export type RARecentGame = {
  gameId: number;
  title: string;
  console: string;
  icon: string;
  boxArt: string;
  earned: number;
  total: number;
};

/** Un juego de tu historial completo (para enlazar un juego que ya tienes en Retro Log). */
export type RAPlayedGame = { gameId: number; title: string; console: string; icon: string };

export type RAAchievement = {
  id: number;
  title: string;
  description: string;
  points: number;
  badge: string;
  earned: boolean;
  /** Cuándo lo obtuviste (milisegundos), o null si todavía no. */
  earnedAt: number | null;
  /** Si lo sacaste en modo hardcore (sin guardar ni rebobinar). */
  hardcore: boolean;
  /** Cuántos jugadores lo tienen, en total y en hardcore. */
  numAwarded: number;
  numAwardedHardcore: number;
  /** Puntos ponderados por rareza ("true ratio"). */
  trueRatio: number;
  /** "progression", "win_condition", "missable" o null. */
  type: string | null;
  author: string;
  createdAt: number | null;
};

export type RAProgress = {
  title: string;
  console: string;
  earned: number;
  total: number;
  /** "mastered", "completed", "beaten-hardcore"… o null si todavía nada. */
  award: string | null;
  /** Cuántas personas jugaron este juego (para sacar el % de cada logro). */
  players: number;
  achievements: RAAchievement[];
};

/** La dirección completa de una imagen de RetroAchievements ("/Images/0123.png"). */
export const raImage = (path: string) => `${MEDIA}${path}`;

/** La insignia de un logro; en gris si todavía no lo tienes. */
export const raBadge = (badge: string, earned: boolean) =>
  `${MEDIA}/Badge/${badge}${earned ? '' : '_lock'}.png`;

async function call<T>(account: RAAccount, endpoint: string, params: Record<string, string>) {
  const query = new URLSearchParams({ ...params, y: account.key }).toString();
  const res = await fetch(`${API}/${endpoint}.php?${query}`);
  // 401: el usuario o la key están mal.
  if (res.status === 401) throw new Error('unauthorized');
  if (!res.ok) throw new Error(`RetroAchievements ${res.status}`);
  return (await res.json()) as T;
}

export async function fetchProfile(account: RAAccount): Promise<RAProfile> {
  const data = await call<{ User: string; UserPic: string; TotalPoints: number }>(
    account,
    'API_GetUserProfile',
    { u: account.user },
  );
  return { user: data.User, userPic: raImage(data.UserPic), totalPoints: data.TotalPoints };
}

export async function fetchRecentGames(account: RAAccount): Promise<RARecentGame[]> {
  const data = await call<
    {
      GameID: number;
      Title: string;
      ConsoleName: string;
      ImageIcon: string;
      ImageBoxArt: string;
      NumAchieved: number;
      AchievementsTotal: number;
    }[]
  >(account, 'API_GetUserRecentlyPlayedGames', { u: account.user, c: '50' });
  return data.map((g) => ({
    gameId: g.GameID,
    title: g.Title,
    console: g.ConsoleName,
    icon: raImage(g.ImageIcon),
    boxArt: raImage(g.ImageBoxArt),
    earned: g.NumAchieved,
    total: g.AchievementsTotal,
  }));
}

export async function fetchPlayedGames(account: RAAccount): Promise<RAPlayedGame[]> {
  const data = await call<{
    Results: { GameID: number; Title: string; ConsoleName: string; ImageIcon: string }[];
  }>(account, 'API_GetUserCompletionProgress', { u: account.user, c: '500' });
  return data.Results.map((g) => ({
    gameId: g.GameID,
    title: g.Title,
    console: g.ConsoleName,
    icon: raImage(g.ImageIcon),
  }));
}

/** Las fechas de la API vienen como "2016-03-12 17:47:29", en hora UTC. */
function parseDate(date: string | undefined) {
  return date ? Date.parse(date.replace(' ', 'T') + 'Z') : null;
}

export async function fetchProgress(account: RAAccount, gameId: number): Promise<RAProgress> {
  const data = await call<{
    Title: string;
    ConsoleName: string;
    NumAchievements: number;
    NumAwardedToUser: number;
    HighestAwardKind: string | null;
    NumDistinctPlayers?: number;
    NumDistinctPlayersCasual?: number;
    Achievements: Record<
      string,
      {
        ID: number;
        Title: string;
        Description: string;
        Points: number;
        BadgeName: string;
        DisplayOrder: number;
        DateEarned?: string;
        DateEarnedHardcore?: string;
        NumAwarded?: number;
        NumAwardedHardcore?: number;
        TrueRatio?: number;
        type?: string | null;
        Author?: string;
        DateCreated?: string;
      }
    >;
  }>(account, 'API_GetGameInfoAndUserProgress', { u: account.user, g: String(gameId) });
  return {
    title: data.Title,
    console: data.ConsoleName,
    earned: data.NumAwardedToUser,
    total: data.NumAchievements,
    award: data.HighestAwardKind ?? null,
    players: data.NumDistinctPlayers ?? data.NumDistinctPlayersCasual ?? 0,
    // Primero los obtenidos, del más reciente al más antiguo; después los que faltan, en el
    // orden del juego.
    achievements: Object.values(data.Achievements ?? {})
      .map((a) => ({
        id: a.ID,
        title: a.Title,
        description: a.Description,
        points: a.Points,
        badge: a.BadgeName,
        earned: !!a.DateEarned,
        earnedAt: parseDate(a.DateEarned),
        hardcore: !!a.DateEarnedHardcore,
        numAwarded: a.NumAwarded ?? 0,
        numAwardedHardcore: a.NumAwardedHardcore ?? 0,
        trueRatio: a.TrueRatio ?? 0,
        type: a.type ?? null,
        author: a.Author ?? '',
        createdAt: parseDate(a.DateCreated),
        order: a.DisplayOrder,
      }))
      .sort((a, b) =>
        a.earnedAt !== null && b.earnedAt !== null
          ? b.earnedAt - a.earnedAt
          : a.earnedAt !== null
            ? -1
            : b.earnedAt !== null
              ? 1
              : a.order - b.order,
      )
      .map(({ order: _order, ...a }) => a),
  };
}

/**
 * El nombre como lo escribiría una persona: RetroAchievements pone el artículo al final
 * ("Simpsons, The: Hit & Run") y marca los hacks ("~Hack~ …"). Esto lo deja como "The
 * Simpsons: Hit & Run", para buscarlo en Wikipedia.
 */
export function cleanTitle(title: string) {
  const plain = title
    .replace(/~[^~]*~\s*/g, '')
    .replace(/\s*\[[^\]]*\]/g, '')
    .trim();
  return plain.replace(/^(.*?), (The|A|An)(?=:|$)/, '$2 $1');
}

/** Qué tanto se parecen dos nombres de juego, de 0 (nada) a 1 (iguales). */
export function titleSimilarity(a: string, b: string) {
  const words = (s: string) =>
    new Set(
      cleanTitle(s)
        .toLowerCase()
        .replace(/[^a-z0-9 ]+/g, ' ')
        .split(' ')
        .filter((w) => w && w !== 'the'),
    );
  const wa = words(a);
  const wb = words(b);
  if (!wa.size || !wb.size) return 0;
  const shared = [...wa].filter((w) => wb.has(w)).length;
  return shared / new Set([...wa, ...wb]).size;
}

type RAStore = {
  account: RAAccount | null;
  loaded: boolean;
  setAccount: (account: RAAccount | null) => void;
};

const RAContext = createContext<RAStore | null>(null);

export function RAProvider({ children }: { children: ReactNode }) {
  const [account, setAccountState] = useState<RAAccount | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setAccountState(JSON.parse(raw));
      })
      .finally(() => setLoaded(true));
  }, []);

  const setAccount = (next: RAAccount | null) => {
    setAccountState(next);
    if (next) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else AsyncStorage.removeItem(STORAGE_KEY);
  };

  return (
    <RAContext.Provider value={{ account, loaded, setAccount }}>{children}</RAContext.Provider>
  );
}

export function useRA() {
  const store = useContext(RAContext);
  if (!store) throw new Error('useRA tiene que usarse dentro de <RAProvider>');
  return store;
}
