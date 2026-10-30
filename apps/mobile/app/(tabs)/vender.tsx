import { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  estadoEfectivo,
  ETIQUETAS_TIPO_PRODUCTO,
  formatearFecha,
  mensajeError,
  type CrearEmprendimientoInput,
} from '@emprende/core';
import {
  alternarDisponibilidadProducto,
  crearEmprendimiento,
  eliminarFotosDeProducto,
  eliminarProducto,
  obtenerMiEmprendimiento,
  type Database,
} from '@emprende/db';
import { PlusCircle } from 'lucide-react-native';
import { supabase, supabaseConfigurado } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/Button';
import { EmprendimientoFormulario } from '@/components/EmprendimientoFormulario';

type Emprendimiento = Database['public']['Tables']['emprendimientos']['Row'] & {
  productos?: Database['public']['Tables']['productos']['Row'][];
};

const ETIQUETAS_ESTADO: Record<string, { texto: string; clase: string }> = {
  activo: { texto: 'Activo', clase: 'bg-green-100 text-green-700' },
  pendiente: { texto: 'Pendiente de pago', clase: 'bg-amber-100 text-amber-700' },
  vencido: { texto: 'Suscripción vencida', clase: 'bg-red-100 text-red-700' },
  suspendido: { texto: 'Suspendido', clase: 'bg-neutral-200 text-neutral-700' },
};

export default function VenderScreen() {
  const { user, cargando: cargandoAuth } = useAuth();
  const [emprendimiento, setEmprendimiento] = useState<Emprendimiento | null | undefined>(
    undefined,
  );
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async () => {
    if (!user || !supabaseConfigurado) return;
    setCargando(true);
    try {
      const data = await obtenerMiEmprendimiento(supabase, user.id);
      setEmprendimiento(data as Emprendimiento | null);
    } catch (error) {
      Alert.alert('No se pudo cargar tu emprendimiento', mensajeError(error, 'Desliza hacia abajo para reintentar.'));
    } finally {
      setCargando(false);
    }
  }, [user]);

  // Carga al montar y cada vez que la pestaña vuelve a tener foco (por
  // ejemplo, al volver de "Nuevo producto" o "Suscripción").
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  type Publicacion = NonNullable<Emprendimiento['productos']>[number];

  async function cambiarVisibilidad(producto: Publicacion) {
    try {
      await alternarDisponibilidadProducto(supabase, producto.id, !producto.disponible);
      await cargar();
    } catch (error) {
      Alert.alert('No se pudo cambiar la visibilidad', mensajeError(error, 'Inténtalo de nuevo.'));
    }
  }

  function confirmarEliminar(producto: Publicacion) {
    Alert.alert('Eliminar publicación', `¿Eliminar «${producto.nombre}»? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const fotos = await eliminarProducto(supabase, producto.id);
            await eliminarFotosDeProducto(supabase, fotos);
            await cargar();
          } catch (error) {
            Alert.alert('No se pudo eliminar', mensajeError(error, 'Inténtalo de nuevo.'));
          }
        },
      },
    ]);
  }

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
    const estadoActual = estadoEfectivo(emprendimiento.estado, emprendimiento.activo_hasta);
    const estado = ETIQUETAS_ESTADO[estadoActual];
    return (
      <SafeAreaView className="flex-1 bg-neutral-50">
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 16 }}
          refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargar} />}
        >
          <View>
            <Text className="text-2xl font-bold text-neutral-900">{emprendimiento.nombre}</Text>
            <Text className={`mt-1 self-start rounded-full px-3 py-0.5 text-xs font-medium ${estado?.clase ?? ''}`}>
              {estado?.texto ?? estadoActual}
            </Text>
            {estadoActual === 'activo' && (
              <Text className="mt-1 text-xs text-neutral-500">
                Suscripción vigente hasta el {formatearFecha(emprendimiento.activo_hasta)}
              </Text>
            )}
          </View>

          {estadoActual === 'suspendido' && (
            <View className="rounded-lg border border-neutral-300 bg-neutral-100 p-3">
              <Text className="text-sm text-neutral-700">
                Tu emprendimiento está suspendido y no aparece en el catálogo. Escríbenos para revisar
                tu caso.
              </Text>
            </View>
          )}
          {(estadoActual === 'pendiente' || estadoActual === 'vencido') && (
            <View className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <Text className="text-sm text-amber-800">
                {estadoActual === 'vencido'
                  ? 'Tu suscripción venció y tu emprendimiento ya no aparece en el catálogo público. '
                  : 'Tu emprendimiento aún no aparece en el catálogo público. '}
                Reporta tu pago de suscripción por Yape y un administrador lo validará.
              </Text>
            </View>
          )}

          <View className="flex-row gap-2">
            <Button texto="Editar perfil" variante="secundario" onPress={() => router.push('/negocio/perfil')} />
            <Button
              texto="Suscripción"
              variante="secundario"
              onPress={() => router.push('/negocio/suscripcion')}
            />
            <View className="flex-1">
              <Button texto="Nuevo" onPress={() => router.push('/negocio/productos/nuevo')} />
            </View>
          </View>

          <Text className="text-lg font-semibold text-neutral-900">
            Mis publicaciones ({emprendimiento.productos?.length ?? 0})
          </Text>
          {emprendimiento.productos && emprendimiento.productos.length > 0 ? (
            <View className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
              {emprendimiento.productos.map((producto) => (
                <View key={producto.id} className="gap-2 p-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-2">
                      <Text className="text-sm font-medium text-neutral-900">{producto.nombre}</Text>
                      <Text className="text-xs text-neutral-500">
                        {ETIQUETAS_TIPO_PRODUCTO[producto.tipo]}
                        {!producto.disponible && ' · Oculto'}
                      </Text>
                    </View>
                    <Text className="text-sm text-neutral-500">S/ {producto.precio}</Text>
                  </View>
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => router.push(`/negocio/productos/${producto.id}`)}
                      className="rounded-full border border-neutral-300 px-3 py-1"
                    >
                      <Text className="text-xs font-medium text-neutral-700">Editar</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => cambiarVisibilidad(producto)}
                      className="rounded-full border border-neutral-300 px-3 py-1"
                    >
                      <Text className="text-xs font-medium text-neutral-700">
                        {producto.disponible ? 'Ocultar' : 'Mostrar'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => confirmarEliminar(producto)}
                      className="rounded-full border border-red-200 px-3 py-1"
                    >
                      <Text className="text-xs font-medium text-red-700">Eliminar</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="items-center gap-2 rounded-xl border border-dashed border-neutral-300 p-6">
              <PlusCircle size={20} color="#94a3b8" />
              <Text className="text-center text-sm text-neutral-500">
                Todavía no publicaste productos ni servicios.
              </Text>
            </View>
          )}
        </ScrollView>
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
  const [enviando, setEnviando] = useState(false);

  async function enviar(datos: CrearEmprendimientoInput) {
    setEnviando(true);
    try {
      const nuevo = await crearEmprendimiento(supabase, usuarioId, datos);
      onCreado(nuevo as Emprendimiento);
    } catch (error) {
      Alert.alert('No se pudo crear', mensajeError(error, 'Inténtalo de nuevo.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-50">
      <Text className="px-4 pt-4 text-2xl font-bold text-neutral-900">Crea tu perfil comercial</Text>
      <EmprendimientoFormulario
        enviando={enviando}
        onEnviar={enviar}
        textoBoton={enviando ? 'Creando…' : 'Crear mi emprendimiento'}
      />
    </SafeAreaView>
  );
}
