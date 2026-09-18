import { SafeAreaView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button';

export default function PerfilScreen() {
  const { user, cargando } = useAuth();

  if (cargando) return null;

  if (!user) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-neutral-50 px-8">
        <Text className="text-center text-lg font-semibold text-neutral-900">
          Ingresa a tu cuenta
        </Text>
        <View className="w-full gap-3">
          <Button texto="Ingresar" onPress={() => router.push('/login')} />
          <Button
            texto="Crear cuenta"
            variante="secundario"
            onPress={() => router.push('/registro')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 gap-4 bg-neutral-50 px-6 pt-8">
      <Text className="text-2xl font-bold text-neutral-900">Mi cuenta</Text>
      <View className="rounded-xl border border-neutral-200 bg-white p-4">
        <Text className="text-sm text-neutral-500">Correo institucional</Text>
        <Text className="text-base font-medium text-neutral-900">{user.email}</Text>
      </View>
      <Button texto="Cerrar sesión" variante="peligro" onPress={() => supabase.auth.signOut()} />
    </SafeAreaView>
  );
}
