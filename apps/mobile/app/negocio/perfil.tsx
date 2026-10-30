import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, Text } from 'react-native';
import { router } from 'expo-router';
import { mensajeError, type CrearEmprendimientoInput } from '@emprende/core';
import { actualizarEmprendimiento, obtenerMiEmprendimiento } from '@emprende/db';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { EmprendimientoFormulario } from '@/components/EmprendimientoFormulario';

type Datos = { id: string; nombre: string; descripcion: string; whatsapp: string; categoria_slug: string };

/** Editar el perfil comercial propio (nombre, descripción, categoría y WhatsApp). */
export default function EditarPerfilComercialScreen() {
  const { user } = useAuth();
  const [negocio, setNegocio] = useState<Datos | null | undefined>(undefined);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!user) return;
    let activo = true;
    (async () => {
      try {
        const emprendimiento = await obtenerMiEmprendimiento(supabase, user.id);
        if (activo) setNegocio(emprendimiento);
      } catch (error) {
        if (activo) {
          setNegocio(null);
          Alert.alert('No se pudo cargar tu emprendimiento', mensajeError(error, 'Inténtalo de nuevo.'));
        }
      }
    })();
    return () => {
      activo = false;
    };
  }, [user]);

  async function guardar(datos: CrearEmprendimientoInput) {
    if (!negocio) return;
    setEnviando(true);
    try {
      await actualizarEmprendimiento(supabase, negocio.id, datos);
      Alert.alert('Cambios guardados', 'Tu perfil comercial se actualizó.');
      router.back();
    } catch (error) {
      Alert.alert('No se pudo guardar', mensajeError(error, 'Inténtalo de nuevo.'));
    } finally {
      setEnviando(false);
    }
  }

  if (negocio === undefined) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-neutral-50">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }
  if (negocio === null) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-neutral-50 px-8">
        <Text className="text-center text-sm text-neutral-600">Todavía no creaste tu emprendimiento.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-50">
      <EmprendimientoFormulario
        inicial={negocio}
        enviando={enviando}
        onEnviar={guardar}
        textoBoton={enviando ? 'Guardando…' : 'Guardar cambios'}
      />
    </SafeAreaView>
  );
}
