import { Doto_700Bold, Doto_900Black } from '@expo-google-fonts/doto';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Colors, Type } from '@/constants/theme';
import { CustomIconsProvider } from '@/lib/custom-icons';
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
        <CustomIconsProvider>
          <TallyProvider>
            <Stack
              screenOptions={{
                headerShadowVisible: false,
                headerTintColor: Colors.dark.text,
                headerTitleStyle: { fontFamily: Type.mono, fontSize: 14 },
                contentStyle: { backgroundColor: Colors.dark.background },
              }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="tally/[id]" options={{ title: '' }} />
              <Stack.Screen name="edit/[id]" options={{ title: 'EDITAR', presentation: 'modal' }} />
              <Stack.Screen name="icon-editor/[id]" options={{ title: 'EDITOR DE ÍCONO', presentation: 'modal' }} />
            </Stack>
          </TallyProvider>
        </CustomIconsProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
