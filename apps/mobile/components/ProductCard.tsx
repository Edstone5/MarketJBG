import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { BadgeCheck } from 'lucide-react-native';

export interface ProductoCatalogo {
  id: string;
  nombre: string;
  precio: number;
  imagenes: string[];
  emprendimiento: { id: string; nombre: string; logo_url: string | null } | null;
}

const formatoPEN = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

export function ProductCard({ producto }: { producto: ProductoCatalogo }) {
  return (
    <Pressable
      onPress={() => router.push(`/producto/${producto.id}`)}
      className="w-[48%] overflow-hidden rounded-xl border border-neutral-200 bg-white"
    >
      <View className="aspect-square w-full bg-neutral-100">
        {producto.imagenes[0] ? (
          <Image
            source={{ uri: producto.imagenes[0] }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-xs text-neutral-400">Sin foto</Text>
          </View>
        )}
      </View>

      <View className="gap-1 p-3">
        <Text numberOfLines={2} className="text-sm font-medium text-neutral-900">
          {producto.nombre}
        </Text>
        <Text className="text-base font-semibold text-primary-700">
          {formatoPEN.format(producto.precio)}
        </Text>
        {producto.emprendimiento && (
          <View className="mt-1 flex-row items-center gap-1">
            <BadgeCheck size={13} color="#1a5cff" />
            <Text numberOfLines={1} className="text-xs text-neutral-500">
              {producto.emprendimiento.nombre}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
