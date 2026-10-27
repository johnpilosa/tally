/**
 * Tu perfil en Retro Log: foto, nombre de usuario, una frase y las plataformas en las que
 * juegas. Las plataformas son las opciones para marcar en qué jugaste cada juego.
 * Se guarda solo en este dispositivo.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { onRemote, persist } from '@/lib/persist';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'profile:v1';

export type Profile = {
  /** La foto: un archivo en el teléfono o, en el navegador, la imagen como texto. */
  photo: string | null;
  username: string;
  bio: string;
  /** Tus plataformas, en el orden en que las agregaste ("PS2", "Switch", "PC"…). */
  platforms: string[];
};

/** Algunas para agregar con un toque. */
export const SuggestedPlatforms = [
  'PS1',
  'PS2',
  'PS3',
  'PS4',
  'PS5',
  'PSP',
  'Switch',
  'Wii',
  'GameCube',
  'N64',
  'SNES',
  'Game Boy',
  'GBA',
  'DS',
  '3DS',
  'Xbox',
  'Xbox 360',
  'PC',
  'Steam Deck',
  'Mega Drive',
  'Dreamcast',
];

/** Cómo llama RetroAchievements a algunas consolas, y el nombre corto que solemos usar. */
const CONSOLE_ALIASES: Record<string, string> = {
  playstation: 'ps1',
  playstation2: 'ps2',
  playstation3: 'ps3',
  playstationportable: 'psp',
  nintendo64: 'n64',
  supernintendoentertainmentsystem: 'snes',
  snessuperfamicom: 'snes',
  gameboyadvance: 'gba',
  nintendods: 'ds',
  nintendo3ds: '3ds',
  megadrivegenesis: 'megadrive',
  genesis: 'megadrive',
};

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Cuál de tus plataformas corresponde a una consola de RetroAchievements ("PlayStation 2" →
 * "PS2"), o null si ninguna.
 */
export function matchPlatform(consoleName: string, platforms: string[]) {
  const name = squash(consoleName);
  const alias = CONSOLE_ALIASES[name];
  return platforms.find((p) => squash(p) === name || squash(p) === alias) ?? null;
}

const EMPTY: Profile = { photo: null, username: '', bio: '', platforms: [] };

type ProfileStore = {
  profile: Profile;
  loaded: boolean;
  updateProfile: (changes: Partial<Profile>) => void;
  /** Agrega una plataforma si no está (sin importar mayúsculas). */
  addPlatform: (name: string) => void;
  removePlatform: (name: string) => void;
};

const ProfileContext = createContext<ProfileStore | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setProfile({ ...EMPTY, ...JSON.parse(raw) });
      })
      .finally(() => setLoaded(true));
  }, []);

  // Si llega algo más nuevo de la nube (otro dispositivo), se usa eso.
  useEffect(() => onRemote(STORAGE_KEY, (value) => setProfile(value as Profile)), []);

  useEffect(() => {
    if (loaded) persist(STORAGE_KEY, profile);
  }, [profile, loaded]);

  const store: ProfileStore = {
    profile,
    loaded,
    updateProfile: (changes) => setProfile((p) => ({ ...p, ...changes })),
    addPlatform: (name) =>
      setProfile((p) => {
        const clean = name.trim();
        if (!clean || p.platforms.some((x) => x.toLowerCase() === clean.toLowerCase())) return p;
        return { ...p, platforms: [...p.platforms, clean] };
      }),
    removePlatform: (name) =>
      setProfile((p) => ({ ...p, platforms: p.platforms.filter((x) => x !== name) })),
  };

  return <ProfileContext.Provider value={store}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const store = useContext(ProfileContext);
  if (!store) throw new Error('useProfile tiene que usarse dentro de <ProfileProvider>');
  return store;
}
