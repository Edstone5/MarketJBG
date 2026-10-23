import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { mensajeError, type CrearProductoInput } from '@emprende/core';
import { actualizarProducto, eliminarFotosDeProducto, obtenerMiEmprendimiento } from '@emprende/db';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { ProductoFormulario, type ProductoInicial } from '@/components/ProductoFormulario';

/** Editar una publicación propia. La ruta fija `nuevo` tiene prioridad sobre este `[id]`. */
export default function EditarProductoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [producto, setProducto] = useState<ProductoInicial | null | undefined>(undefined);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    let activo = true;
    (async () => {
      try {
        // Solo se edita lo propio: se busca entre las publicaciones de su emprendimiento.
        const emprendimiento = await obtenerMiEmprendimiento(supabase, user.id);
        const encontrado = emprendimiento?.productos?.find((p) => p.id === id);
        if (activo) setProducto(encontrado ?? null);
      } catch (error) {
        if (activo) {
          setProducto(null);
          Alert.alert('No se pudo cargar la publicación', mensajeError(error, 'Inténtalo de nuevo.'));
        }
      }
    })();
    return () => {
      activo = false;
    };
  }, [user, id]);

  async function guardar(datos: CrearProductoInput) {
    if (!producto || !id) return;
    setEnviando(true);
    try {
      await actualizarProducto(supabase, id, datos);
      // las fotos que ya no se usan se borran del almacenamiento una vez guardados los cambios
      await eliminarFotosDeProducto(
        supabase,
        producto.imagenes.filter((url) => !datos.imagenes.includes(url)),
      );
      Alert.alert('Cambios guardados', 'Tu publicación se actualizó.');
      router.back();
    } catch (error) {
      Alert.alert('No se pudo guardar', mensajeError(error, 'Inténtalo de nuevo.'));
    } finally {
      setEnviando(false);
    }
  }

  if (producto === undefined) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-neutral-50">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }
  if (producto === null) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-neutral-50 px-8">
        <Text className="text-center text-sm text-neutral-600">No se encontró esta publicación.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-50">
      <ProductoFormulario
        inicial={producto}
        enviando={enviando}
        onEnviar={guardar}
        textoBoton={() => (enviando ? 'Guardando…' : 'Guardar cambios')}
      />
    </SafeAreaView>
  );
}
