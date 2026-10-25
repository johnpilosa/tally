import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { GamesTabBar } from '@/components/games-nav';
import { Colors } from '@/constants/theme';

/**
 * Retro Log: todas sus pantallas van dentro de esta pila, con la barra de pestañas de abajo
 * siempre visible (como en Spotify). Cada pantalla dibuja su propia barra de arriba con
 * <ScreenHeader>, así todas se ven igual.
 */
export default function GamesLayout() {
  return (
    <View style={styles.root}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.dark.background },
        }}>
        {/* Las tres pestañas cambian con un fundido rápido; lo demás entra deslizando. */}
        <Stack.Screen name="index" options={{ animation: 'fade', animationDuration: 150 }} />
        <Stack.Screen name="search" options={{ animation: 'fade', animationDuration: 150 }} />
        <Stack.Screen name="lists" options={{ animation: 'fade', animationDuration: 150 }} />
      </Stack>
      <GamesTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.dark.background },
});
