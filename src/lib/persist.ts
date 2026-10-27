/**
 * Guardar en el teléfono, avisando a la nube. Los proveedores (juegos, perfil, contadores,
 * íconos) guardan con `persist` en vez de AsyncStorage directo: así se anota cuándo cambió cada
 * cosa (para saber qué es más nuevo, el teléfono o la nube) y la sincronización se entera.
 * Cuando llega algo nuevo de la nube, `applyRemote` lo guarda y se lo pasa a quien escuche con
 * `onRemote`.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const stampKey = (key: string) => `sync:stamp:${key}`;

/** Lo último guardado de cada cosa, para no volver a guardar (ni subir) lo mismo. */
const last: Record<string, string | null> = {};
const remoteListeners = new Map<string, Set<(value: unknown) => void>>();
const changeListeners = new Set<(key: string) => void>();

export async function persist(key: string, value: unknown) {
  const json = JSON.stringify(value);
  if (last[key] === json) return;
  const stored = key in last ? last[key] : await AsyncStorage.getItem(key);
  last[key] = json;
  // Lo mismo que ya estaba (por ejemplo, al terminar de cargar): no cuenta como cambio.
  if (stored === json) return;
  await AsyncStorage.multiSet([
    [key, json],
    [stampKey(key), String(Date.now())],
  ]);
  changeListeners.forEach((fn) => fn(key));
}

/** Lo guardado en el teléfono y cuándo cambió por última vez (0 si nunca). */
export async function readLocal(key: string) {
  const [[, json], [, stamp]] = await AsyncStorage.multiGet([key, stampKey(key)]);
  return { json, stamp: Number(stamp ?? 0) };
}

/** Guarda lo que llegó de la nube (con la hora de la nube) y se lo pasa a la app. */
export async function applyRemote(key: string, json: string, stamp: number) {
  last[key] = json;
  await AsyncStorage.multiSet([
    [key, json],
    [stampKey(key), String(stamp)],
  ]);
  const value = JSON.parse(json);
  remoteListeners.get(key)?.forEach((fn) => fn(value));
}

/** Escucha lo que llega de la nube para `key`. Devuelve cómo dejar de escuchar. */
export function onRemote(key: string, fn: (value: unknown) => void) {
  if (!remoteListeners.has(key)) remoteListeners.set(key, new Set());
  remoteListeners.get(key)!.add(fn);
  return () => {
    remoteListeners.get(key)?.delete(fn);
  };
}

/** Escucha cada cambio hecho en el teléfono (para subirlo). */
export function onLocalChange(fn: (key: string) => void) {
  changeListeners.add(fn);
  return () => {
    changeListeners.delete(fn);
  };
}
