import { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { CATEGORIAS, crearEmprendimientoSchema } from '@emprende/core';
import { crearEmprendimiento, obtenerMiEmprendimiento, type Database } from '@emprende/db';
import { supabase, supabaseConfigurado } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/Button';

type Emprendimiento = Database['public']['Tables']['emprendimientos']['Row'];

export default function VenderScreen() {
  const { user, cargando: cargandoAuth } = useAuth();
  const [emprendimiento, setEmprendimiento] = useState<Emprendimiento | null | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!user || !supabaseConfigurado) return;
    obtenerMiEmprendimiento(supabase, user.id).then((data) =>
      setEmprendimiento(data as Emprendimiento | null),
    );
  }, [user]);

  if (cargandoAuth) return null;

  if (!user) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-neutral-50 px-8">
        <Text className="text-center text-lg font-semibold text-neutral-900">
          Ingresa para publicar tu emprendimiento
        </Text>
        <Button texto="Ingresar" onPress={() => router.push('/login')} />
      </SafeAreaView>
    );
  }

  if (emprendimiento) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-50 px-4 pt-6">
        <Text className="text-2xl font-bold text-neutral-900">{emprendimiento.nombre}</Text>
        <Text className="mt-1 text-sm text-neutral-500">
          Estado de suscripción:{' '}
          <Text className="font-medium text-neutral-900">{emprendimiento.estado}</Text>
        </Text>
        <Text className="mt-4 text-sm text-neutral-500">
          La gestión completa de productos y pagos está disponible en la app web
          (/mi-emprendimiento). Esta pantalla se completará junto con el flujo de carga de
          fotos desde el celular.
        </Text>
      </SafeAreaView>
    );
  }

  return <FormularioNuevoEmprendimiento usuarioId={user.id} onCreado={setEmprendimiento} />;
}

function FormularioNuevoEmprendimiento({
  usuarioId,
  onCreado,
}: {
  usuarioId: string;
  onCreado: (e: Emprendimiento) => void;
}) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [categoriaSlug, setCategoriaSlug] = useState(CATEGORIAS[0]!.slug);
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    const resultado = crearEmprendimientoSchema.safeParse({
      nombre,
      descripcion,
      whatsapp,
      categoriaSlug,
    });
    if (!resultado.success) {
      Alert.alert('Revisa el formulario', resultado.error.issues[0]?.message);
      return;
    }

    setEnviando(true);
    try {
      const nuevo = await crearEmprendimiento(supabase, usuarioId, resultado.data);
      onCreado(nuevo as Emprendimiento);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo crear');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-50">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text className="text-2xl font-bold text-neutral-900">Crea tu perfil comercial</Text>

        <Campo label="Nombre del emprendimiento" value={nombre} onChangeText={setNombre} />
        <Campo
          label="Descripción"
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
        />
        <Campo label="WhatsApp de contacto" value={whatsapp} onChangeText={setWhatsapp} />

        <View className="gap-1">
          <Text className="text-sm font-medium text-neutral-700">Categoría</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CATEGORIAS.map((categoria) => (
              <Text
                key={categoria.slug}
                onPress={() => setCategoriaSlug(categoria.slug)}
                className={`mr-2 rounded-full border px-4 py-1.5 text-sm ${
                  categoriaSlug === categoria.slug
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-neutral-300 text-neutral-700'
                }`}
              >
                {categoria.nombre}
              </Text>
            ))}
          </ScrollView>
        </View>

        <Button
          texto={enviando ? 'Creando…' : 'Crear mi emprendimiento'}
          onPress={enviar}
          disabled={enviando}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Campo(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <View className="gap-1">
      <Text className="text-sm font-medium text-neutral-700">{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        multiline={props.multiline}
        className="rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900"
        style={props.multiline ? { minHeight: 90, textAlignVertical: 'top' } : undefined}
      />
    </View>
  );
}
