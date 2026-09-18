import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, SafeAreaView, Text, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { listarProductosCatalogo } from '@emprende/db';
import { supabase, supabaseConfigurado } from '@/lib/supabase';
import { ProductCard, type ProductoCatalogo } from '@/components/ProductCard';

export default function InicioScreen() {
  const [productos, setProductos] = useState<ProductoCatalogo[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    if (!supabaseConfigurado) {
      setCargando(false);
      return;
    }
    try {
      const data = await listarProductosCatalogo(supabase, { ordenarPor: 'recientes' });
      setProductos((data ?? []) as unknown as ProductoCatalogo[]);
    } catch (error) {
      console.warn('Error al cargar el catálogo', error);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    // Carga de datos al montar: el estado se actualiza dentro de `cargar`,
    // no de forma síncrona en el cuerpo del efecto.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50">
      <View className="gap-4 px-4 pb-2 pt-4">
        <View className="rounded-2xl bg-primary-800 p-5">
          <View className="mb-2 flex-row items-center gap-1.5 self-start rounded-full bg-white/10 px-3 py-1">
            <Sparkles size={14} color="#fff" />
            <Text className="text-xs font-medium text-white">Exclusivo comunidad UNJBG</Text>
          </View>
          <Text className="text-xl font-bold text-white">
            El catálogo de emprendimientos de la UNJBG
          </Text>
          <Text className="mt-1 text-sm text-primary-100">
            Compra a estudiantes verificados de tu propia universidad.
          </Text>
        </View>
        <Text className="text-lg font-semibold text-neutral-900">Recién publicado</Text>
      </View>

      <FlatList
        data={productos}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargar} />}
        renderItem={({ item }) => <ProductCard producto={item} />}
        ListEmptyComponent={
          !cargando ? (
            <Text className="mt-6 px-4 text-center text-sm text-neutral-500">
              {supabaseConfigurado
                ? 'Todavía no hay productos publicados.'
                : 'Configura EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY en apps/mobile/.env'}
            </Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
