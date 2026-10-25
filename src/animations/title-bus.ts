/**
 * Conecta la navegación con el título grande que está en pantalla, para que al cambiar de
 * pestaña el título actual se borre letra por letra ANTES de ir a la otra pantalla.
 */
type ActiveTitle = { erase: (done: () => void) => void };

let active: ActiveTitle | null = null;

/** El título de la pantalla enfocada se anota aquí; devuelve cómo borrarse de la lista. */
export function registerTitle(title: ActiveTitle) {
  active = title;
  return () => {
    if (active === title) active = null;
  };
}

/** Borra el título que está en pantalla (si hay) y después llama a `then`. */
export function eraseTitleThen(then: () => void) {
  if (active) active.erase(then);
  else then();
}
