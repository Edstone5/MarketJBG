import { useState } from 'react';
import { Alert, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { mensajeError, type CrearProductoInput } from '@emprende/core';
import { crearProducto, obtenerMiEmprendimiento } from '@emprende/db';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { ProductoFormulario } from '@/components/ProductoFormulario';

export default function NuevoProductoScreen() {
  const { user } = useAuth();
  const [enviando, setEnviando] = useState(false);

  async function publicar(datos: CrearProductoInput) {
    if (!user) return;

    setEnviando(true);
    try {
      const emprendimiento = await obtenerMiEmprendimiento(supabase, user.id);
      if (!emprendimiento) {
        Alert.alert('Falta tu emprendimiento', 'Primero crea tu perfil comercial en la pestaña Vender.');
        return;
      }

      await crearProducto(supabase, emprendimiento.id, datos);
      Alert.alert('Publicado', `Tu ${datos.tipo === 'servicio' ? 'servicio' : 'producto'} ya está publicado.`);
      router.back();
    } catch (error) {
      Alert.alert('No se pudo publicar', mensajeError(error, 'Inténtalo de nuevo.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-50">
      <ProductoFormulario
        enviando={enviando}
        onEnviar={publicar}
        textoBoton={(tipo) =>
          enviando ? 'Publicando…' : `Publicar ${tipo === 'servicio' ? 'servicio' : 'producto'}`
        }
      />
    </SafeAreaView>
  );
}
