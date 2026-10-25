import { router, usePathname } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Rect } from 'react-native-svg';

import { Appear } from '@/animations/appear';
import { eraseTitleThen } from '@/animations/title-bus';
import { BlurOverlay } from '@/components/blur-overlay';
import { Colors, Layout, Spacing, Type } from '@/constants/theme';
import { useI18n } from '@/lib/i18n';

const C = Colors.dark;

export type GamesSection = 'games' | 'search' | 'lists';

/** Las secciones de Retro Log, en el orden en que aparecen en el menú y la barra de abajo. */
const SECTIONS: { id: GamesSection; route: string }[] = [
  { id: 'games', route: '/games' },
  { id: 'search', route: '/games/search' },
  { id: 'lists', route: '/games/lists' },
];

/**
 * Ir a una sección como en una barra de pestañas: se cierran las pantallas abiertas encima
 * (fichas, reseñas) y se cambia a la sección, sin ir apilando historial.
 */
function go(section: GamesSection, from: GamesSection) {
  const route = SECTIONS.find((s) => s.id === section)!.route;
  const navigate = () => {
    if (router.canDismiss()) router.dismissAll();
    router.replace(route as '/');
  };
  // Entre pestañas distintas, el título actual se borra letra por letra antes de cambiar.
  if (section !== from) eraseTitleThen(navigate);
  else navigate();
}

/** En qué sección estamos según la ruta. Las fichas y reseñas cuentan como "mis juegos". */
function sectionOf(pathname: string): GamesSection {
  if (pathname.startsWith('/games/search')) return 'search';
  if (pathname.startsWith('/games/list')) return 'lists';
  return 'games';
}

/** Los íconos de cada sección, dibujados en líneas finas. */
function SectionIcon({ section, color }: { section: GamesSection; color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      {section === 'games' &&
        [
          [2, 2],
          [11, 2],
          [2, 11],
          [11, 11],
        ].map(([x, y]) => (
          <Rect
            key={`${x}${y}`}
            x={x}
            y={y}
            width={7}
            height={7}
            rx={1.5}
            stroke={color}
            strokeWidth={1.3}
            fill="none"
          />
        ))}
      {section === 'search' && (
        <>
          <Circle cx={8.5} cy={8.5} r={5.5} stroke={color} strokeWidth={1.3} fill="none" />
          <Line
            x1={12.6}
            y1={12.6}
            x2={17.5}
            y2={17.5}
            stroke={color}
            strokeWidth={1.3}
            strokeLinecap="round"
          />
        </>
      )}
      {section === 'lists' &&
        [4.5, 10, 15.5].map((y) => (
          <Line
            key={y}
            x1={3}
            y1={y}
            x2={17}
            y2={y}
            stroke={color}
            strokeWidth={1.3}
            strokeLinecap="round"
          />
        ))}
    </Svg>
  );
}

function sectionLabel(t: ReturnType<typeof useI18n>['t'], section: GamesSection) {
  return section === 'games'
    ? t.games.navMyGames
    : section === 'search'
      ? t.games.navSearch
      : t.games.navLists;
}

/**
 * Botón de arriba a la derecha en las pantallas de Retro Log: abre un menú (con el fondo
 * desenfocado) para ir a buscar, a mis juegos o a las listas.
 */
export function GamesMenuButton() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const current = sectionOf(usePathname());

  const pick = (section: GamesSection) => {
    setOpen(false);
    go(section, current);
  };

  return (
    <>
      <Pressable
        hitSlop={12}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t.games.menu}
        style={styles.menuButton}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.menuDot} />
        ))}
      </Pressable>

      <BlurOverlay visible={open} onClose={() => setOpen(false)}>
        <View style={[styles.menu, { top: insets.top + Layout.headerHeight }]}>
          {SECTIONS.map((s, i) => (
            <Appear key={s.id} options={{ direction: -1, index: i }}>
              <Pressable
                onPress={() => pick(s.id)}
                style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.6 }]}>
                <SectionIcon section={s.id} color={C.text} />
                <Text style={styles.menuText}>{sectionLabel(t, s.id)}</Text>
              </Pressable>
            </Appear>
          ))}
        </View>
      </BlurOverlay>
    </>
  );
}

/** Barra de abajo, como en Spotify: mis juegos, buscar y listas. Está en todas las pantallas. */
export function GamesTabBar() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const current = sectionOf(pathname);
  const labels: Record<GamesSection, string> = {
    games: t.games.tabGames,
    search: t.games.tabSearch,
    lists: t.games.tabLists,
  };
  // Escribiendo una reseña no se muestra: esa pantalla es solo para escribir.
  if (pathname.startsWith('/games/write') || pathname.startsWith('/games/share')) return null;

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, Spacing.three) }]}>
      {SECTIONS.map((s) => {
        const active = s.id === current;
        const color = active ? C.text : C.textSecondary;
        return (
          <Pressable
            key={s.id}
            onPress={() => go(s.id, current)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [styles.tab, pressed && { opacity: 0.6 }]}>
            <SectionIcon section={s.id} color={color} />
            <View style={styles.tabLabelRow}>
              {active && <View style={styles.dot} />}
              <Text style={[styles.tabLabel, { color }]}>{labels[s.id]}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  menuButton: { flexDirection: 'row', gap: 3, paddingVertical: Spacing.two },
  menuDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.text },
  menu: { position: 'absolute', right: Layout.gutter, width: 220, gap: Spacing.two },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    backgroundColor: C.background,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  menuText: { fontFamily: Type.mono, fontSize: 12, color: C.text, letterSpacing: 2 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.background,
    paddingTop: Spacing.three,
  },
  tab: { flex: 1, alignItems: 'center', gap: Spacing.two },
  tabLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  tabLabel: { fontFamily: Type.mono, fontSize: 10, letterSpacing: 1 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.accent },
});
