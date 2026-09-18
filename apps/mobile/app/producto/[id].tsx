import { useEffect, useState } from 'react';
import { Linking, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { BadgeCheck, MessageCircle } from 'lucide-react-native';
import { obtenerProductoPorId } from '@emprende/db';
import { supabase } from '@/lib/supabase';

const formatoPEN = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

export default function ProductoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [producto, setProducto] = useState<Awaited<ReturnType<typeof obtenerProductoPorId>> | null>(
    null,
  );

  useEffect(() => {
    if (!id) return;
    obtenerProductoPorId(supabase, id).then(setProducto).catch(console.warn);
  }, [id]);

  if (!producto) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-neutral-500">Cargando…</Text>
      </SafeAreaView>
    );
  }

  const emprendimiento = producto.emprendimiento as unknown as {
    nombre: string;
    whatsapp: string;
  } | null;

  function contactar() {
    if (!emprendimiento) return;
    const numero = emprendimiento.whatsapp.replace(/\D/g, '');
    const mensaje = encodeURIComponent(
      `Hola, vi "${producto?.nombre}" en Emprende UNJBG y me interesa 🙂`,
    );
    Linking.openURL(`https://wa.me/${numero}?text=${mensaje}`);
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView>
        <View className="aspect-square w-full bg-neutral-100">
          {producto.imagenes[0] && (
            <Image
              source={{ uri: producto.imagenes[0] }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          )}
        </View>

        <View className="gap-3 p-4">
          <Text className="text-2xl font-bold text-neutral-900">{producto.nombre}</Text>
          <Text className="text-3xl font-bold text-primary-700">
            {formatoPEN.format(producto.precio)}
          </Text>
          <Text className="text-neutral-600">{producto.descripcion}</Text>

          {emprendimiento && (
            <View className="mt-2 flex-row items-center gap-2 rounded-xl border border-neutral-200 p-3">
              <BadgeCheck size={18} color="#1a5cff" />
              <Text className="text-sm font-medium text-neutral-900">
                {emprendimiento.nombre} · Emprendimiento verificado
              </Text>
            </View>
          )}

          {emprendimiento && (
            <Pressable
              onPress={contactar}
              className="mt-2 flex-row items-center justify-center gap-2 rounded-full bg-green-600 px-5 py-3 active:bg-green-700"
            >
              <MessageCircle size={18} color="#fff" />
              <Text className="font-semibold text-white">Contactar por WhatsApp</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
