import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

/** La caza de logros: inicio (elegir juego), el mazo para armar la caza, y la caza en sí. */
export default function HuntLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.dark.background },
      }}
    />
  );
}
