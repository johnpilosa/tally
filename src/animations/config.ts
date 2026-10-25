/**
 * TODAS LAS ANIMACIONES DE LA APP, EN UN SOLO LUGAR.
 *
 * Cambia un número, guarda, y lo ves al instante en la app.
 *
 * Dos tipos de animación:
 * - "timing": dura exactamente `duration` milisegundos (1000 = 1 segundo) y sigue una curva `easing`.
 * - "spring" (resorte): no tiene duración fija; se siente física.
 *     damping   → freno. Bajo (5) = rebota mucho. Alto (30) = casi no rebota.
 *     stiffness → fuerza. Alto (500) = rápido y seco. Bajo (100) = lento y blando.
 *
 * Curvas de easing útiles (de react-native-reanimated):
 *   Easing.linear                      velocidad constante
 *   Easing.inOut(Easing.cubic)         arranca suave, acelera, frena suave
 *   Easing.out(Easing.cubic)           arranca rápido y frena suave
 *   Easing.inOut(Easing.back(1.5))     se pasa un poquito y vuelve
 *   Easing.elastic(1)                  efecto elástico
 */
import { Easing } from 'react-native-reanimated';

/** El auto dando la vuelta en la rotonda cada vez que tocas el botón. */
export const CarLap = {
  /** Cuántos grados recorre por toque. 360 = vuelta completa; 180 = media vuelta. */
  degrees: 360,
  /** 'counterclockwise' = países que manejan por la derecha; 'clockwise' = por la izquierda (Reino Unido). */
  direction: 'counterclockwise' as 'clockwise' | 'counterclockwise',
  duration: 1100,
  easing: Easing.inOut(Easing.cubic),
};

/** El botón circular al presionarlo y soltarlo. */
export const ButtonPress = {
  /** Cuánto se achica al presionar (1 = nada, 0.9 = 10% más chico). */
  pressedScale: 0.96,
  press: { damping: 20, stiffness: 600 },
  release: { damping: 9, stiffness: 300 },
};

/** El anillo fino que se expande desde el botón al tocarlo. */
export const RingPulse = {
  duration: 700,
  /** Hasta qué tamaño crece (1.3 = 30% más grande que el botón). */
  maxScale: 1.3,
  /** Qué tan visible arranca (0 a 1). */
  startOpacity: 0.6,
  easing: Easing.out(Easing.cubic),
};

/** El número del contador al cambiar: entra desde abajo al sumar y desde arriba al deshacer. */
export const CountChange = {
  damping: 16,
  stiffness: 260,
};

/* ─────────────────────────── ÍCONOS ─────────────────────────── */

/** Los símbolos de insulto: cada uno salta y se ladea, uno detrás de otro, y el grupo tiembla. */
export const Grawlix = {
  /** Los símbolos que se muestran. Puedes poner los que quieras. */
  text: '#$%&!',
  /** Cuál de los símbolos va en rojo (0 = el primero). Pon -1 para ninguno. */
  redIndex: 4,
  /** Cuánto saltan, en puntos. Cada uno salta un poco distinto al azar. */
  jump: 22,
  /** Cuánto se ladean como máximo, en grados (al azar, para un lado u otro). */
  maxTilt: 30,
  /** Milisegundos entre que salta uno y el siguiente (efecto ola). */
  stagger: 45,
  /** Cuánto tarda en subir. */
  riseDuration: 110,
  /** El aterrizaje: un resorte bien rebotón. */
  land: { damping: 6, stiffness: 260 },
  /** El temblor de todo el grupo: cuánto se mueve de lado a lado y cuántas veces. */
  shake: { distance: 5, times: 3, stepDuration: 45 },
};

/** El nerd: se acomoda los lentes, pestañea y ladea la cabeza. */
export const Nerd = {
  /** Cuánto suben los lentes al acomodárselos, en puntos del dibujo (lienzo de 100). */
  glassesLift: 7,
  glassesUpDuration: 110,
  glassesSettle: { damping: 7, stiffness: 220 },
  /** Pestañeo: cuánto tarda en cerrar y abrir los ojos, y con qué retraso empieza. */
  blinkDelay: 140,
  blinkClose: 70,
  blinkOpen: 120,
  /** Ladeo de cabeza, en grados. */
  tilt: 8,
  tiltDuration: 140,
  tiltSettle: { damping: 8, stiffness: 180 },
};

/** La nave: se parte a la mitad con un destello, queda flotando y se vuelve a juntar. */
export const StarDestroyer = {
  /** Cuánto se separan las mitades hacia los lados, en puntos del dibujo (lienzo de 100). */
  split: 14,
  /** Cuánto gira cada mitad al separarse, en grados. */
  tilt: 16,
  /** Cuánto se van hacia atrás las mitades al romperse, en puntos del dibujo. */
  drift: 6,
  breakDuration: 260,
  breakEasing: Easing.out(Easing.cubic),
  /** Cuánto rato quedan separadas antes de volver, en milisegundos. */
  hold: 450,
  /** Cómo se vuelven a juntar. */
  rejoin: { damping: 12, stiffness: 140 },
  /** El destello rojo del centro. */
  flashDuration: 450,
  flashMaxScale: 2.2,
};

/* ─────────────────────────── LISTA DE CONTADORES ─────────────────────────── */

/** Reordenar los contadores de abajo: mantener presionado uno y arrastrarlo. */
export const ChipDrag = {
  /** Cuánto hay que mantener presionado antes de poder arrastrar, en milisegundos. */
  longPress: 300,
  /** Cuánto crece el contador que estás arrastrando. */
  liftScale: 1.08,
  /** Cuánto tardan los demás en correrse para hacerle espacio. */
  shiftDuration: 150,
};

/* ─────────────────────────── MILESTONES ─────────────────────────── */

/**
 * El festejo al llegar a un múltiplo de `every` (5, 10, 15…): una explosión de pixeles desde
 * el botón, el número da un salto y aparece el letrero. Cada `bigEvery` (25, 50…) es más grande.
 */
export const Milestone = {
  every: 5,
  bigEvery: 25,
  /** Cuántos pixeles salen disparados en uno normal y en uno grande. */
  particles: 14,
  bigParticles: 28,
  /** Hasta dónde vuelan, en puntos, desde el borde del botón. */
  distance: 60,
  bigDistance: 110,
  /** Tamaño de cada pixel. */
  pixelSize: 6,
  /** Cada cuántos pixeles va uno rojo (4 = uno de cada cuatro). */
  redEvery: 4,
  duration: 850,
  easing: Easing.out(Easing.cubic),
  /** El salto del número: cuánto crece y cómo vuelve. */
  countPop: 1.3,
  countSpring: { damping: 7, stiffness: 220 },
  /** El letrero que aparece bajo el botón. `{n}` se reemplaza por el número. */
  label: '{n} · MILESTONE',
  bigLabel: '{n} · MEGA MILESTONE',
  labelDuration: 1400,
};

/* ─────────────────────────── ÍCONOS PROPIOS ─────────────────────────── */

/**
 * Los movimientos que se le pueden poner a cada forma en el editor de íconos.
 * Cada toque del botón reproduce el movimiento una vez. `duration` es a velocidad 1x
 * (a 2x dura la mitad). Las distancias están en puntos del lienzo (que mide 100 × 100).
 */
export const CustomMotion = {
  spin: { duration: 700, turns: 1 },
  pulse: { duration: 450, grow: 0.4 },
  float: { duration: 700, height: 12 },
  blink: { duration: 400 },
  orbit: { duration: 900, radius: 10 },
  shake: { duration: 450, distance: 6, times: 3 },
  bounce: { duration: 550, height: 18 },
  easing: Easing.inOut(Easing.quad),
};

/* ─────────────────────────── VENTANAS Y MENÚS ─────────────────────────── */

/**
 * Cómo aparece TODO en pantalla: menús, popups, filas de listas, tarjetas, secciones.
 * Se desvanece de transparente a visible mientras sube un poco desde abajo hasta su lugar,
 * rápido y frenando limpio. Nunca crece ni hace zoom.
 */
export const Overlay = {
  /** Qué tan fuerte se desenfoca el fondo (1 a 100). */
  blur: 40,
  /** Capa oscura encima del desenfoque, para que lo de adelante resalte. */
  dim: 'rgba(0, 0, 0, 0.45)',
  /** Cuánto tarda en aparecer y desaparecer el fondo desenfocado. */
  fadeIn: 180,
  fadeOut: 140,
  /** Cómo entra el contenido (menú, popup, dropdown). */
  enter: {
    duration: 240,
    /** Desde cuántos puntos más abajo sube hasta su lugar. */
    rise: 12,
    /** Desde qué tamaño crece. 1 = sin crecer (sin zoom). */
    fromScale: 1,
    /** Retraso entre una opción y la siguiente en un menú (cascada sutil). */
    stagger: 25,
  },
  /**
   * El menú de apps se despliega como una escalera extensible: cada opción sale desde detrás
   * de la anterior y baja hasta su lugar.
   */
  ladder: {
    /** Cuánto tarda cada opción en bajar a su lugar. */
    duration: 260,
    /** Cuánto espera cada opción antes de empezar a salir detrás de la anterior. */
    stagger: 90,
  },
};

/* ─────────────────────────── TÍTULOS ─────────────────────────── */

/**
 * Los títulos grandes ("MY GAMES", "SEARCH", "LISTS") se escriben letra por letra al aparecer,
 * y al cambiar de pestaña se borran desde la última letra hasta la primera.
 */
export const TitleTyping = {
  /** Milisegundos por letra al escribir. */
  typeMs: 26,
  /** Milisegundos por letra al borrar (un poco más rápido que escribir). */
  eraseMs: 16,
};

/* ─────────────────────────── FILTROS ─────────────────────────── */

/**
 * Los filtros de arriba (ALL, PLAYING, PLAYED, FAVORITES): al elegir uno, el contorno del
 * anterior se va dando la vuelta y desaparece, y el del nuevo se dibuja dando la vuelta.
 */
export const ChipLap = {
  /** Cuánto tarda en dar la vuelta, en milisegundos. */
  duration: 340,
  /** Grosor de la línea que da la vuelta. */
  strokeWidth: 1.2,
  /**
   * Cuánto espera el contorno del filtro anterior antes de empezar a irse. Con el mismo valor
   * que `duration`, se va justo cuando el nuevo termina de dibujarse.
   */
  leaveDelay: 140,
};

/** La lista de My Games al cambiar de filtro. */
export const FilterSwitch = {
  /**
   * Cuánto tarda la lista actual en desvanecerse antes de que entre la del nuevo filtro, en
   * milisegundos.
   */
  leave: 140,
};
