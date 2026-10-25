import * as Sharing from 'expo-sharing';
import { useLocalSearchParams } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

import { Appear } from '@/animations/appear';
import { ReviewCard } from '@/components/review-card';
import { ScreenHeader } from '@/components/screen-header';
import { Colors, Layout, Spacing, Type } from '@/constants/theme';
import { useGames } from '@/lib/games';
import { useI18n } from '@/lib/i18n';

const C = Colors.dark;

/**
 * La reseña como imagen: muestra cómo va a quedar y la comparte (en Android, con el menú de
 * compartir: guardar en Drive, mandar por WhatsApp…) o la descarga (en el navegador).
 */
export default function ShareReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { games, loaded } = useGames();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const game = games.find((g) => g.id === id);
  const card = useRef<ComponentRef<typeof View>>(null);
  const [state, setState] = useState<'idle' | 'working' | 'failed'>('idle');
  const back = `/games/review?id=${encodeURIComponent(id ?? '')}`;

  const share = async () => {
    if (!game || state === 'working') return;
    setState('working');
    try {
      const fileName = `${game.title.replace(/[^\w]+/g, '-').toLowerCase()}-review`;
      if (Platform.OS === 'web') {
        const uri = await captureRef(card, { format: 'png', quality: 1, result: 'data-uri' });
        const a = document.createElement('a');
        a.href = uri;
        a.download = `${fileName}.png`;
        a.click();
      } else {
        const uri = await captureRef(card, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
          fileName,
        });
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: game.title });
      }
      setState('idle');
    } catch {
      setState('failed');
    }
  };

  const label =
    state === 'working'
      ? t.games.creatingImage
      : state === 'failed'
        ? t.games.imageFailed
        : Platform.OS === 'web'
          ? t.games.downloadImage
          : t.games.shareImage;

  return (
    <View style={styles.screen}>
      <ScreenHeader back={back} title={t.games.shareTitle} />
      {game ? (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <Appear style={styles.preview}>
              <ReviewCard ref={card} game={game} />
            </Appear>
          </ScrollView>
          <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.three }]}>
            <Pressable
              onPress={share}
              style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}>
              <Text style={styles.buttonText}>{label}</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <View style={styles.center}>
          {loaded && <Text style={styles.label}>{t.games.missing}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center', paddingVertical: Spacing.three },
  // El borde marca dónde termina la imagen; no sale en ella.
  preview: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Layout.radius,
    overflow: 'hidden',
  },
  bottom: { paddingHorizontal: Layout.gutter, paddingTop: Spacing.three },
  button: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 360,
    borderRadius: 999,
    backgroundColor: C.text,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  buttonText: { fontFamily: Type.monoBold, fontSize: 13, color: C.background, letterSpacing: 2 },
  label: { fontFamily: Type.mono, fontSize: 11, color: C.textSecondary, letterSpacing: 1 },
});
