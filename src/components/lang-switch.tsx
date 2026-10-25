import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { LangSwitch as Config } from '@/animations/config';
import { Colors, Type } from '@/constants/theme';
import { useI18n } from '@/lib/i18n';

const C = Colors.dark;
const WIDTH = 72;
const HEIGHT = 26;
const PAD = 2;
const KNOB = (WIDTH - PAD * 2) / 2;

/**
 * El idioma, como un interruptor de luz: un solo botón con EN a un lado y ES al otro. Tocarlo
 * en cualquier parte cambia al otro idioma, y la perilla blanca se desliza hasta él.
 */
export function LangSwitch() {
  const { t, lang, setLang } = useI18n();
  // 0 = inglés (perilla a la izquierda), 1 = español (a la derecha).
  const side = useSharedValue(lang === 'es' ? 1 : 0);

  useEffect(() => {
    side.set(withTiming(lang === 'es' ? 1 : 0, { duration: Config.duration }));
  }, [lang, side]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: side.get() * KNOB }],
  }));
  // El texto sobre la perilla va en negro; el otro, en gris.
  const enStyle = useAnimatedStyle(() => ({
    color: interpolateColor(side.get(), [0, 1], [C.background, C.textSecondary]),
  }));
  const esStyle = useAnimatedStyle(() => ({
    color: interpolateColor(side.get(), [0, 1], [C.textSecondary, C.background]),
  }));

  return (
    <Pressable
      hitSlop={8}
      onPress={() => setLang(lang === 'es' ? 'en' : 'es')}
      accessibilityRole="switch"
      accessibilityLabel={t.language}
      accessibilityState={{ checked: lang === 'es' }}
      style={({ pressed }) => [styles.track, pressed && { opacity: 0.8 }]}>
      <Animated.View style={[styles.knob, knobStyle]} />
      <View style={styles.labels} pointerEvents="none">
        <Animated.Text style={[styles.label, enStyle]}>EN</Animated.Text>
        <Animated.Text style={[styles.label, esStyle]}>ES</Animated.Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: WIDTH,
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: 'center',
  },
  knob: {
    position: 'absolute',
    left: PAD - 1,
    width: KNOB,
    height: HEIGHT - PAD * 2 - 2,
    borderRadius: HEIGHT / 2,
    backgroundColor: C.text,
  },
  labels: { flexDirection: 'row' },
  label: {
    width: KNOB,
    textAlign: 'center',
    fontFamily: Type.mono,
    fontSize: 10,
    letterSpacing: 1,
    marginLeft: PAD - 1,
  },
});
