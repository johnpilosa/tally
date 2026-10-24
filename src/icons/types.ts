import { useEffect, useRef, type ComponentType } from 'react';

export type IconProps = {
  /** Sube en 1 cada vez que se toca el botón. Cada ícono anima cuando cambia. */
  trigger: number;
  /** Ancho y alto del espacio disponible para el ícono, en puntos. */
  size: number;
};

export type IconDef = {
  /** Nombre corto que se muestra en el editor. */
  label: string;
  Component: ComponentType<IconProps>;
};

/**
 * Corre `play` cada vez que `trigger` cambia, pero no al aparecer el ícono en pantalla.
 * Así, al cambiar de ícono o de contador, el nuevo no se anima solo.
 */
export function useOnTrigger(trigger: number, play: () => void) {
  const last = useRef(trigger);
  useEffect(() => {
    if (trigger === last.current) return;
    last.current = trigger;
    play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);
}
