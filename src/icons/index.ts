/**
 * Los íconos animados que se pueden elegir para un contador.
 *
 * Para agregar uno nuevo:
 * 1. Crea un archivo en esta carpeta con un componente que reciba `{ trigger, size }`
 *    (copia uno de los existentes como base) y anime con `useOnTrigger`.
 * 2. Agrégalo a la lista de abajo. Aparece solo en el editor.
 */
import { CarIcon } from './car';
import { GrawlixIcon } from './grawlix';
import { NerdIcon } from './nerd';
import { StarDestroyerIcon } from './star-destroyer';
import type { IconDef } from './types';

export const Icons = {
  car: { label: 'ROTONDA', Component: CarIcon },
  grawlix: { label: '#$%&!', Component: GrawlixIcon },
  nerd: { label: 'NERD', Component: NerdIcon },
  starDestroyer: { label: 'DESTRUCTOR', Component: StarDestroyerIcon },
} satisfies Record<string, IconDef>;

export type IconId = keyof typeof Icons;

export const IconIds = Object.keys(Icons) as IconId[];
