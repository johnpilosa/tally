import AsyncStorage from '@react-native-async-storage/async-storage';

import { onRemote, persist } from '@/lib/persist';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export const ShapeKinds = ['circle', 'square', 'triangle', 'star', 'line'] as const;
export type ShapeKind = (typeof ShapeKinds)[number];

export const Motions = [
  'none',
  'spin',
  'pulse',
  'float',
  'blink',
  'orbit',
  'shake',
  'bounce',
] as const;
export type Motion = (typeof Motions)[number];

/** Una forma dentro de un ícono propio. Las medidas están en el lienzo de 100 × 100. */
export type Shape = {
  id: string;
  kind: ShapeKind;
  /** Centro de la forma. */
  x: number;
  y: number;
  /** Ancho y alto. */
  size: number;
  /** Giro base, en grados. */
  rotation: number;
  filled: boolean;
  color: 'white' | 'red';
  motion: Motion;
  /** 0.5, 1 o 2: qué tan rápido hace su movimiento. */
  speed: number;
  /** Cuánto espera antes de moverse, en milisegundos. Sirve para que las formas se muevan en secuencia. */
  delay: number;
};

export type CustomIcon = { id: string; name: string; shapes: Shape[] };

const STORAGE_KEY = 'customIcons:v1';

type CustomIconsStore = {
  icons: CustomIcon[];
  loaded: boolean;
  saveIcon: (icon: CustomIcon) => void;
  deleteIcon: (id: string) => void;
  /** El último ícono creado, para que el editor de contadores lo deje elegido al volver. */
  lastCreatedId: string | null;
};

const CustomIconsContext = createContext<CustomIconsStore | null>(null);

export function newShapeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function CustomIconsProvider({ children }: { children: ReactNode }) {
  const [icons, setIcons] = useState<CustomIcon[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setIcons(JSON.parse(raw));
      })
      .finally(() => setLoaded(true));
  }, []);

  // Si llega algo más nuevo de la nube (otro dispositivo), se usa eso.
  useEffect(() => onRemote(STORAGE_KEY, (value) => setIcons(value as CustomIcon[])), []);

  useEffect(() => {
    if (loaded) persist(STORAGE_KEY, icons);
  }, [icons, loaded]);

  const store: CustomIconsStore = {
    icons,
    loaded,
    lastCreatedId,
    saveIcon: (icon) => {
      const exists = icons.some((i) => i.id === icon.id);
      setIcons((prev) =>
        exists ? prev.map((i) => (i.id === icon.id ? icon : i)) : [...prev, icon],
      );
      if (!exists) setLastCreatedId(icon.id);
    },
    deleteIcon: (id) => setIcons((prev) => prev.filter((i) => i.id !== id)),
  };

  return <CustomIconsContext.Provider value={store}>{children}</CustomIconsContext.Provider>;
}

export function useCustomIcons() {
  const store = useContext(CustomIconsContext);
  if (!store) throw new Error('useCustomIcons tiene que usarse dentro de <CustomIconsProvider>');
  return store;
}
