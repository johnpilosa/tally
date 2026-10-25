import { Doto_700Bold, Doto_900Black } from '@expo-google-fonts/doto';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { Colors } from '@/constants/theme';
import { BlurHost } from '@/components/blur-overlay';
import { CustomIconsProvider } from '@/lib/custom-icons';
import { GamesProvider } from '@/lib/games';
import { I18nProvider } from '@/lib/i18n';
import { TallyProvider } from '@/lib/tallies';
import '@/lib/web-scrollbar';

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: Colors.dark.background, card: Colors.dark.background },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Doto_700Bold,
    Doto_900Black,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Mantiene lo que estás escribiendo arriba del teclado (ver KeyboardAwareScrollView). */}
      <KeyboardProvider>
        <ThemeProvider value={theme}>
          <I18nProvider>
            <CustomIconsProvider>
              <TallyProvider>
                <GamesProvider>
                  <BlurHost>
                    {/* Ninguna pantalla usa la barra de arriba del sistema: todas dibujan <ScreenHeader>. */}
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: Colors.dark.background },
                      }}>
                      <Stack.Screen name="index" />
                      <Stack.Screen name="tally/[id]" />
                      <Stack.Screen name="edit/[id]" options={{ presentation: 'modal' }} />
                      <Stack.Screen name="icon-editor/[id]" options={{ presentation: 'modal' }} />
                      <Stack.Screen
                        name="games"
                        options={{ animation: 'fade', animationDuration: 150 }}
                      />
                    </Stack>
                  </BlurHost>
                </GamesProvider>
              </TallyProvider>
            </CustomIconsProvider>
          </I18nProvider>
        </ThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
