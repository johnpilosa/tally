import { Doto_700Bold, Doto_900Black } from '@expo-google-fonts/doto';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { Colors, Type } from '@/constants/theme';
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
    <ThemeProvider value={theme}>
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
        </Stack>
      </TallyProvider>
    </ThemeProvider>
  );
}
