import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Lang = 'en' | 'es';

/**
 * Todos los textos de la app, en inglés. Los que llevan datos son funciones.
 * Para cambiar o agregar un texto: edítalo aquí y en `es` (TypeScript avisa si falta alguno).
 */
const en = {
  // Inicio
  history: 'HISTORY →',
  todaySince: (today: number, date: string) => `TODAY ${today}  ·  SINCE ${date}`,
  noMarks: 'NO TAPS YET',
  undo: 'UNDO',
  emptyTitle: 'NOTHING TO COUNT',
  emptyHint: 'CREATE YOUR FIRST COUNTER BELOW',
  counterNamePlaceholder: 'COUNTER NAME',
  create: 'CREATE',
  newCounter: '+ NEW',
  editCounter: 'Edit counter',
  addOneTo: (name: string) => `Add one to ${name}`,

  // Historial
  historyTitle: 'HISTORY',
  counterMissing: 'THIS COUNTER DOES NOT EXIST',
  lastTime: (ago: string) => `LAST TIME ${ago}`,
  stillNoMarks: 'NO TAPS YET',
  statToday: 'TODAY',
  statWeek: '7 DAYS',
  statTotal: 'TOTAL',
  confirmAgain: 'SURE? TAP AGAIN',
  deleteCounter: 'DELETE COUNTER',

  // Editor de contador
  editTitle: 'EDIT',
  name: 'NAME',
  iconTryThem: 'ICON · TAP TO TRY THEM',
  chooseIcon: (label: string) => `Choose icon ${label}`,
  editIcon: (label: string) => `Edit icon ${label}`,
  createIcon: 'CREATE ICON',
  createIconA11y: 'Create icon',
  save: 'SAVE',

  // Editor de íconos
  iconEditorTitle: 'ICON EDITOR',
  canvasHint: 'DRAG TO MOVE THE SHAPE · TAP TO PREVIEW',
  canvasA11y: 'Icon canvas',
  myIcon: 'MY ICON',
  shapes: 'SHAPES',
  shape: 'SHAPE',
  size: 'SIZE',
  rotation: 'ROTATION',
  style: 'STYLE',
  outline: 'OUTLINE',
  filled: 'FILLED',
  white: 'WHITE',
  red: '● RED',
  motion: 'MOTION',
  speed: 'SPEED',
  delay: 'DELAY',
  duplicate: 'DUPLICATE',
  deleteShape: 'DELETE SHAPE',
  addShapeToStart: 'ADD A SHAPE TO GET STARTED',
  saveIcon: 'SAVE ICON',
  deleteIcon: 'DELETE ICON',
  kinds: {
    circle: 'CIRCLE',
    square: 'SQUARE',
    triangle: 'TRIANGLE',
    star: 'STAR',
    line: 'LINE',
  },
  motions: {
    none: 'NONE',
    spin: 'SPIN',
    pulse: 'PULSE',
    float: 'FLOAT',
    blink: 'BLINK',
    orbit: 'ORBIT',
    shake: 'SHAKE',
    bounce: 'BOUNCE',
  },

  // Íconos incluidos
  icons: {
    car: 'ROUNDABOUT',
    grawlix: '#$%&!',
    nerd: 'NERD',
    starDestroyer: 'DESTROYER',
  },

  // Fechas
  justNow: 'just now',
  minutesAgo: (n: number) => `${n} min ago`,
  hoursAgo: (n: number) => `${n} h ago`,
  yesterdayAt: (clock: string) => `yesterday ${clock}`,
  today: 'Today',
  yesterday: 'Yesterday',
  months: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],
};

export type Strings = typeof en;

const es: Strings = {
  history: 'HISTORIAL →',
  todaySince: (today, date) => `HOY ${today}  ·  DESDE ${date}`,
  noMarks: 'SIN MARCAS',
  undo: 'DESHACER',
  emptyTitle: 'NADA QUE CONTAR',
  emptyHint: 'CREA TU PRIMER CONTADOR ABAJO',
  counterNamePlaceholder: 'NOMBRE DEL CONTADOR',
  create: 'CREAR',
  newCounter: '+ NUEVO',
  editCounter: 'Editar contador',
  addOneTo: (name) => `Sumar uno a ${name}`,

  historyTitle: 'HISTORIAL',
  counterMissing: 'ESTE CONTADOR NO EXISTE',
  lastTime: (ago) => `ÚLTIMA VEZ ${ago}`,
  stillNoMarks: 'TODAVÍA SIN MARCAS',
  statToday: 'HOY',
  statWeek: '7 DÍAS',
  statTotal: 'TOTAL',
  confirmAgain: '¿SEGURO? TOCA OTRA VEZ',
  deleteCounter: 'ELIMINAR CONTADOR',

  editTitle: 'EDITAR',
  name: 'NOMBRE',
  iconTryThem: 'ÍCONO · TÓCALOS PARA PROBARLOS',
  chooseIcon: (label) => `Elegir ícono ${label}`,
  editIcon: (label) => `Editar ícono ${label}`,
  createIcon: 'CREAR ÍCONO',
  createIconA11y: 'Crear ícono',
  save: 'GUARDAR',

  iconEditorTitle: 'EDITOR DE ÍCONO',
  canvasHint: 'ARRASTRA PARA MOVER LA FORMA · TOCA PARA PROBAR',
  canvasA11y: 'Lienzo del ícono',
  myIcon: 'MI ÍCONO',
  shapes: 'FORMAS',
  shape: 'FORMA',
  size: 'TAMAÑO',
  rotation: 'GIRO',
  style: 'ESTILO',
  outline: 'LÍNEA',
  filled: 'RELLENO',
  white: 'BLANCO',
  red: '● ROJO',
  motion: 'MOVIMIENTO',
  speed: 'VELOCIDAD',
  delay: 'RETRASO',
  duplicate: 'DUPLICAR',
  deleteShape: 'ELIMINAR FORMA',
  addShapeToStart: 'AGREGA UNA FORMA PARA EMPEZAR',
  saveIcon: 'GUARDAR ÍCONO',
  deleteIcon: 'ELIMINAR ÍCONO',
  kinds: {
    circle: 'CÍRCULO',
    square: 'CUADRADO',
    triangle: 'TRIÁNGULO',
    star: 'ESTRELLA',
    line: 'LÍNEA',
  },
  motions: {
    none: 'NADA',
    spin: 'GIRAR',
    pulse: 'LATIR',
    float: 'FLOTAR',
    blink: 'PARPADEAR',
    orbit: 'ORBITAR',
    shake: 'TEMBLAR',
    bounce: 'SALTAR',
  },

  icons: {
    car: 'ROTONDA',
    grawlix: '#$%&!',
    nerd: 'NERD',
    starDestroyer: 'DESTRUCTOR',
  },

  justNow: 'recién',
  minutesAgo: (n) => `hace ${n} min`,
  hoursAgo: (n) => `hace ${n} h`,
  yesterdayAt: (clock) => `ayer ${clock}`,
  today: 'Hoy',
  yesterday: 'Ayer',
  months: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
};

export const Translations: Record<Lang, Strings> = { en, es };

const STORAGE_KEY = 'lang';

type I18nStore = { lang: Lang; setLang: (lang: Lang) => void; t: Strings };

const I18nContext = createContext<I18nStore | null>(null);

/** Guarda el idioma elegido. La app arranca en inglés hasta que se elija otro. */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'en' || saved === 'es') setLangState(saved);
      })
      .finally(() => setLoaded(true));
  }, []);

  const setLang = (next: Lang) => {
    setLangState(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  };

  // No dibuja nada hasta saber el idioma, para no mostrar un instante el equivocado.
  if (!loaded) return null;

  return (
    <I18nContext.Provider value={{ lang, setLang, t: Translations[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const store = useContext(I18nContext);
  if (!store) throw new Error('useI18n tiene que usarse dentro de <I18nProvider>');
  return store;
}
