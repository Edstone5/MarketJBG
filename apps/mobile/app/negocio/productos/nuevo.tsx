import { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import {
  CATEGORIAS,
  TIPOS_PRODUCTO,
  ETIQUETAS_TIPO_PRODUCTO,
  crearProductoSchema,
  type TipoProducto,
} from '@emprende/core';
import { crearProducto, obtenerMiEmprendimiento } from '@emprende/db';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/Button';
import { ImageUploader } from '@/components/ImageUploader';

export default function NuevoProductoScreen() {
  const { user } = useAuth();
  const [tipo, setTipo] = useState<TipoProducto>('producto');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoriaSlug, setCategoriaSlug] = useState(CATEGORIAS[0]!.slug);
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  async function publicar() {
    const resultado = crearProductoSchema.safeParse({
      tipo,
      nombre,
      descripcion,
      precio: Number(precio),
      categoriaSlug,
      imagenes,
    });
    if (!resultado.success) {
      Alert.alert('Revisa el formulario', resultado.error.issues[0]?.message);
      return;
    }
    if (!user) return;

    setEnviando(true);
    try {
      const emprendimiento = await obtenerMiEmprendimiento(supabase, user.id);
      if (!emprendimiento) throw new Error('Primero crea tu emprendimiento.');

      await crearProducto(supabase, emprendimiento.id, resultado.data);
      Alert.alert('Publicado', `Tu ${tipo === 'servicio' ? 'servicio' : 'producto'} ya está publicado.`);
      router.back();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo publicar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-50">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text className="text-2xl font-bold text-neutral-900">Nueva publicación</Text>

        <View className="gap-1">
          <Text className="text-sm font-medium text-neutral-700">¿Qué vas a publicar?</Text>
          <View className="flex-row gap-2">
            {TIPOS_PRODUCTO.map((valor) => (
              <Text
                key={valor}
                onPress={() => setTipo(valor)}
                className={`flex-1 rounded-lg border px-3 py-2 text-center text-sm font-medium ${
                  tipo === valor
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-neutral-300 text-neutral-600'
                }`}
              >
                {ETIQUETAS_TIPO_PRODUCTO[valor]}
              </Text>
            ))}
          </View>
        </View>

        <Campo
          label={`Nombre del ${tipo === 'servicio' ? 'servicio' : 'producto'}`}
          value={nombre}
          onChangeText={setNombre}
        />
        <Campo label="Descripción" value={descripcion} onChangeText={setDescripcion} multiline />
        <Campo
          label="Precio (S/)"
          value={precio}
          onChangeText={setPrecio}
          keyboardType="decimal-pad"
        />

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

        <View className="gap-1">
          <Text className="text-sm font-medium text-neutral-700">
            Fotos (opcional, hasta 6){tipo === 'servicio' && ' — ej. trabajos anteriores'}
          </Text>
          <ImageUploader bucket="productos" value={imagenes} onChange={setImagenes} multiple maxFiles={6} />
        </View>

        <Button
          texto={enviando ? 'Publicando…' : `Publicar ${tipo === 'servicio' ? 'servicio' : 'producto'}`}
          onPress={publicar}
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
  keyboardType?: 'default' | 'decimal-pad';
}) {
  return (
    <View className="gap-1">
      <Text className="text-sm font-medium text-neutral-700">{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        multiline={props.multiline}
        keyboardType={props.keyboardType}
        className="rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900"
        style={props.multiline ? { minHeight: 90, textAlignVertical: 'top' } : undefined}
      />
    </View>
  );
}
