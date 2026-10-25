import { Doto_700Bold, Doto_900Black } from '@expo-google-fonts/doto';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Colors, Type } from '@/constants/theme';
import { BlurHost } from '@/components/blur-overlay';
import { CustomIconsProvider } from '@/lib/custom-icons';
import { GamesProvider } from '@/lib/games';
import { I18nProvider } from '@/lib/i18n';
import { TallyProvider } from '@/lib/tallies';

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
      <ThemeProvider value={theme}>
        <I18nProvider>
          <CustomIconsProvider>
            <TallyProvider>
              <GamesProvider>
                <BlurHost>
                  <Stack
                    screenOptions={{
                      headerShadowVisible: false,
                      headerTintColor: Colors.dark.text,
                      headerTitleStyle: { fontFamily: Type.mono, fontSize: 14 },
                      contentStyle: { backgroundColor: Colors.dark.background },
                    }}>
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="tally/[id]" options={{ title: '' }} />
                    <Stack.Screen name="edit/[id]" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="icon-editor/[id]" options={{ presentation: 'modal' }} />
                    <Stack.Screen
                      name="games/index"
                      options={{ headerShown: false, animation: 'fade' }}
                    />
                    <Stack.Screen name="games/search" options={{ title: '' }} />
                    <Stack.Screen name="games/game" options={{ title: '' }} />
                    <Stack.Screen name="games/review" options={{ title: '' }} />
                    <Stack.Screen
                      name="games/lists"
                      options={{ headerShown: false, animation: 'fade' }}
                    />
                    <Stack.Screen name="games/list" options={{ title: '' }} />
                  </Stack>
                </BlurHost>
              </GamesProvider>
            </TallyProvider>
          </CustomIconsProvider>
        </I18nProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
