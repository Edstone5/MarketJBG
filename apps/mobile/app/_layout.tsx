import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';

import { AuthProvider } from '@/providers/AuthProvider';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="producto/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="login" options={{ presentation: 'modal', headerShown: true, title: 'Ingresar' }} />
        <Stack.Screen
          name="registro"
          options={{ presentation: 'modal', headerShown: true, title: 'Crear cuenta' }}
        />
      </Stack>
    </AuthProvider>
  );
}
