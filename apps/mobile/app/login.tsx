import { useState } from 'react';
import { Alert, SafeAreaView, Text, TextInput, View } from 'react-native';
import { Link, router } from 'expo-router';
import { loginSchema } from '@emprende/core';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function ingresar() {
    const resultado = loginSchema.safeParse({ email, password });
    if (!resultado.success) {
      Alert.alert('Revisa el formulario', resultado.error.issues[0]?.message);
      return;
    }

    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword(resultado.data);
    setEnviando(false);

    if (error) {
      Alert.alert('No se pudo ingresar', 'Correo o contraseña incorrectos.');
      return;
    }
    router.back();
  }

  return (
    <SafeAreaView className="flex-1 justify-center gap-4 bg-white px-6">
      <Text className="text-center text-2xl font-bold text-neutral-900">Ingresa a tu cuenta</Text>

      <View className="gap-1">
        <Text className="text-sm font-medium text-neutral-700">Correo institucional</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="tunombre@unjbg.edu.pe"
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

      <Button texto={enviando ? 'Ingresando…' : 'Ingresar'} onPress={ingresar} disabled={enviando} />

      <Link href="/registro" className="text-center text-sm text-primary-700">
        ¿No tienes cuenta? Regístrate
      </Link>
    </SafeAreaView>
  );
}
