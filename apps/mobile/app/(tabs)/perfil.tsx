import { useState } from 'react';
import { mensajeError } from '@emprende/core';
import { Alert, Linking, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button';

// En una app publicada la URL del sitio es obligatoria: un teléfono real no puede usar localhost.
const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? (__DEV__ ? 'http://localhost:3000' : '');

export default function PerfilScreen() {
  const { user, session, cargando } = useAuth();
  const [eliminando, setEliminando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [password, setPassword] = useState('');

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

  async function eliminarCuenta() {
    if (!session) return;
    if (!password) {
      Alert.alert('Falta la contraseña', 'Escribe tu contraseña para confirmar.');
      return;
    }
    if (!WEB_URL) {
      Alert.alert(
        'No disponible',
        'No se pudo contactar con el servidor. Elimina tu cuenta desde la web (marketjbg.com/eliminar-cuenta).',
      );
      return;
    }
    setEliminando(true);
    try {
      const respuesta = await fetch(`${WEB_URL}/api/cuenta`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!respuesta.ok) {
        const cuerpo = await respuesta.json().catch(() => ({ error: null }));
        Alert.alert('No se pudo eliminar', cuerpo?.error ?? 'Inténtalo de nuevo.');
        setPassword('');
        return;
      }
      await supabase.auth.signOut();
    } catch (error) {
      Alert.alert('No se pudo eliminar', mensajeError(error, 'Inténtalo de nuevo.'));
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
          {!confirmando ? (
            <Button texto="Eliminar mi cuenta" variante="peligro" onPress={() => setConfirmando(true)} />
          ) : (
            <View className="gap-3">
              <Text className="text-sm text-red-800">
                Esto eliminará tu cuenta, tu emprendimiento, tus productos y tu historial de pagos de forma
                permanente. Esta acción no se puede deshacer. Para confirmar, escribe tu contraseña.
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Contraseña"
                editable={!eliminando}
                className="rounded-lg border border-red-300 bg-white px-3 py-2.5 text-sm text-neutral-900"
              />
              <Button
                texto={eliminando ? 'Eliminando…' : 'Sí, eliminar definitivamente'}
                variante="peligro"
                onPress={eliminarCuenta}
                disabled={eliminando || password.length === 0}
              />
              <Button
                texto="Cancelar"
                variante="secundario"
                onPress={() => {
                  setConfirmando(false);
                  setPassword('');
                }}
                disabled={eliminando}
              />
            </View>
          )}
        </View>

        <EnlacesLegales />
      </ScrollView>
    </SafeAreaView>
  );
}

function EnlacesLegales() {
  if (!WEB_URL) return null;
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
