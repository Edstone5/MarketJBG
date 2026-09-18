import { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, Text, TextInput, View } from 'react-native';
import { Search } from 'lucide-react-native';
import { listarProductosCatalogo, type FiltroCatalogo } from '@emprende/db';
import { supabase, supabaseConfigurado } from '@/lib/supabase';
import { ProductCard, type ProductoCatalogo } from '@/components/ProductCard';
import { CategoryChips } from '@/components/CategoryChips';

export default function BuscarScreen() {
  const [query, setQuery] = useState('');
  const [categoria, setCategoria] = useState<string | undefined>();
  const [productos, setProductos] = useState<ProductoCatalogo[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!supabaseConfigurado) return;
    const timeout = setTimeout(async () => {
      setCargando(true);
      try {
        const filtro: Partial<FiltroCatalogo> = {
          query: query || undefined,
          categoriaSlug: categoria as FiltroCatalogo['categoriaSlug'],
          ordenarPor: 'recientes',
        };
        const data = await listarProductosCatalogo(supabase, filtro);
        setProductos((data ?? []) as unknown as ProductoCatalogo[]);
      } catch (error) {
        console.warn('Error al buscar', error);
      } finally {
        setCargando(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [query, categoria]);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50">
      <View className="gap-3 px-4 pb-2 pt-4">
        <View className="flex-row items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-2.5">
          <Search size={16} color="#94a3b8" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Busca productos, comida, servicios..."
            className="flex-1 text-sm text-neutral-900"
          />
        </View>
        <CategoryChips activa={categoria} onChange={setCategoria} />
      </View>

      <FlatList
        data={productos}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        renderItem={({ item }) => <ProductCard producto={item} />}
        ListEmptyComponent={
          !cargando ? (
            <Text className="mt-6 px-4 text-center text-sm text-neutral-500">
              {supabaseConfigurado
                ? 'No encontramos productos con esos filtros.'
                : 'Configura Supabase para ver el catálogo (apps/mobile/.env).'}
            </Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
