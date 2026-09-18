import { useState } from 'react';
import { Alert, Linking, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:3000';

export default function PerfilScreen() {
  const { user, session, cargando } = useAuth();
  const [eliminando, setEliminando] = useState(false);

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
        <EnlacesLegales />
      </SafeAreaView>
    );
  }

  async function confirmarEliminarCuenta() {
    Alert.alert(
      'Eliminar cuenta',
      'Esto eliminará tu cuenta, tu emprendimiento, tus productos y tu historial de pagos de forma permanente. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar definitivamente', style: 'destructive', onPress: eliminarCuenta },
      ],
    );
  }

  async function eliminarCuenta() {
    if (!session) return;
    setEliminando(true);
    try {
      const respuesta = await fetch(`${WEB_URL}/api/cuenta`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!respuesta.ok) {
        const cuerpo = await respuesta.json().catch(() => ({ error: null }));
        throw new Error(cuerpo?.error ?? 'No se pudo eliminar la cuenta.');
      }
      await supabase.auth.signOut();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo eliminar la cuenta.');
    } finally {
      setEliminando(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-50">
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <Text className="text-2xl font-bold text-neutral-900">Mi cuenta</Text>
        <View className="rounded-xl border border-neutral-200 bg-white p-4">
          <Text className="text-sm text-neutral-500">Correo institucional</Text>
          <Text className="text-base font-medium text-neutral-900">{user.email}</Text>
        </View>

        <Button texto="Cerrar sesión" variante="peligro" onPress={() => supabase.auth.signOut()} />

        <View className="mt-4 gap-2 rounded-xl border border-red-200 bg-red-50 p-4">
          <Text className="text-sm font-semibold text-neutral-900">Zona de peligro</Text>
          <Text className="text-sm text-neutral-600">
            Elimina tu cuenta y todos tus datos de forma permanente.
          </Text>
          <Button
            texto={eliminando ? 'Eliminando…' : 'Eliminar mi cuenta'}
            variante="peligro"
            onPress={confirmarEliminarCuenta}
            disabled={eliminando}
          />
        </View>

        <EnlacesLegales />
      </ScrollView>
    </SafeAreaView>
  );
}

function EnlacesLegales() {
  return (
    <View className="mt-6 items-center gap-2">
      <Text className="text-xs text-primary-700" onPress={() => Linking.openURL(`${WEB_URL}/privacidad`)}>
        Política de Privacidad
      </Text>
      <Text className="text-xs text-primary-700" onPress={() => Linking.openURL(`${WEB_URL}/terminos`)}>
        Términos y Condiciones
      </Text>
    </View>
  );
}
