import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { TallyProvider } from '@/lib/tallies';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <TallyProvider>
        <Stack screenOptions={{ headerShadowVisible: false }}>
          <Stack.Screen name="index" options={{ title: 'Tally' }} />
          <Stack.Screen name="tally/[id]" options={{ title: '' }} />
        </Stack>
      </TallyProvider>
    </ThemeProvider>
  );
}
