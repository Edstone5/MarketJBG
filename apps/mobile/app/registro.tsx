import { useState } from 'react';
import { Alert, SafeAreaView, Text, TextInput, View } from 'react-native';
import { Link, router } from 'expo-router';
import { DOMINIO_INSTITUCIONAL, registroSchema } from '@emprende/core';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button';

export default function RegistroScreen() {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function registrarse() {
    const resultado = registroSchema.safeParse({ nombreCompleto, email, password });
    if (!resultado.success) {
      Alert.alert('Revisa el formulario', resultado.error.issues[0]?.message);
      return;
    }

    setEnviando(true);
    const { error } = await supabase.auth.signUp({
      email: resultado.data.email,
      password: resultado.data.password,
      options: { data: { nombre_completo: resultado.data.nombreCompleto } },
    });
    setEnviando(false);

    if (error) {
      Alert.alert('No se pudo crear la cuenta', error.message);
      return;
    }
    Alert.alert('Revisa tu correo', 'Te enviamos un enlace para confirmar tu cuenta.');
    router.back();
  }

  return (
    <SafeAreaView className="flex-1 justify-center gap-4 bg-white px-6">
      <Text className="text-center text-2xl font-bold text-neutral-900">Crea tu cuenta</Text>
      <Text className="text-center text-sm text-neutral-500">
        Exclusivo para correos {DOMINIO_INSTITUCIONAL}
      </Text>

      <View className="gap-1">
        <Text className="text-sm font-medium text-neutral-700">Nombre completo</Text>
        <TextInput
          value={nombreCompleto}
          onChangeText={setNombreCompleto}
          className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
        />
      </View>

      <View className="gap-1">
        <Text className="text-sm font-medium text-neutral-700">Correo institucional</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder={`tunombre${DOMINIO_INSTITUCIONAL}`}
          className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
        />
      </View>

      <View className="gap-1">
        <Text className="text-sm font-medium text-neutral-700">Contraseña</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
        />
      </View>

      <Button
        texto={enviando ? 'Creando cuenta…' : 'Crear cuenta'}
        onPress={registrarse}
        disabled={enviando}
      />

      <Link href="/login" className="text-center text-sm text-primary-700">
        ¿Ya tienes cuenta? Ingresa
      </Link>
    </SafeAreaView>
  );
}
