/**
 * Los íconos animados que se pueden elegir para un contador.
 *
 * Para agregar uno nuevo:
 * 1. Crea un archivo en esta carpeta con un componente que reciba `{ trigger, size }`
 *    (copia uno de los existentes como base) y anime con `useOnTrigger`.
 * 2. Agrégalo a la lista de abajo, y su nombre en `icons` de src/lib/i18n.tsx (en inglés y
 *    en español). Aparece solo en el editor.
 */
import { CarIcon } from './car';
import { GrawlixIcon } from './grawlix';
import { NerdIcon } from './nerd';
import { StarDestroyerIcon } from './star-destroyer';
import type { IconDef } from './types';

export const Icons = {
  car: { Component: CarIcon },
  grawlix: { Component: GrawlixIcon },
  nerd: { Component: NerdIcon },
  starDestroyer: { Component: StarDestroyerIcon },
} satisfies Record<string, IconDef>;

export type IconId = keyof typeof Icons;

export const IconIds = Object.keys(Icons) as IconId[];

/**
 * Lo que se guarda en un contador: el id de un ícono de esta lista, o `custom:<id>` para uno
 * hecho en el editor de íconos.
 */
export type IconRef = IconId | `custom:${string}`;

export function customIconRef(id: string): IconRef {
  return `custom:${id}`;
}

/** Si `ref` es de un ícono propio, devuelve su id; si no, null. */
export function customIconId(ref: IconRef | undefined): string | null {
  return ref?.startsWith('custom:') ? ref.slice('custom:'.length) : null;
}
