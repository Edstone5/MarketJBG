import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Página no encontrada' }} />
      <View className="flex-1 items-center justify-center gap-4 bg-white p-6">
        <Text className="text-lg font-semibold text-neutral-900">Esta pantalla no existe.</Text>
        <Link href="/" className="text-primary-700">
          Volver al inicio
        </Link>
      </View>
    </>
  );
}
