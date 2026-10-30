import { useCallback, useState } from 'react';
import { Alert, RefreshControl, SafeAreaView, ScrollView, Share, Text, Pressable, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  estadoEfectivo,
  etiquetaHora,
  formatearDia,
  mensajeError,
  PERIODO_ESTADISTICAS_POR_DEFECTO,
  PERIODOS_ESTADISTICAS,
  reporteTexto,
  tasaDeContacto,
  totalVisitas,
  type Estadisticas,
} from '@emprende/core';
import { obtenerEstadisticas, obtenerMiEmprendimiento } from '@emprende/db';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/Button';

/** Barras sencillas: cada una mide su valor frente al máximo; la destacada va en otro color. */
function Barras({
  valores,
  destacada,
  etiquetaInicio,
  etiquetaFin,
}: {
  valores: number[];
  destacada?: number | null;
  etiquetaInicio: string;
  etiquetaFin: string;
}) {
  const maximo = Math.max(1, ...valores);
  return (
    <View>
      <View className="h-32 flex-row items-end gap-px rounded-xl bg-neutral-50 px-2 pb-2 pt-4">
        {valores.map((valor, indice) => (
          <View key={indice} className="h-full flex-1 justify-end">
            <View
              className={`w-full rounded-t ${indice === destacada ? 'bg-accent-500' : 'bg-primary-500'}`}
              style={{ height: valor === 0 ? 2 : `${Math.max(4, (valor / maximo) * 100)}%` }}
            />
          </View>
        ))}
      </View>
      <View className="mt-1 flex-row justify-between">
        <Text className="text-xs text-neutral-500">{etiquetaInicio}</Text>
        <Text className="text-xs text-neutral-500">Máx. {maximo}</Text>
        <Text className="text-xs text-neutral-500">{etiquetaFin}</Text>
      </View>
    </View>
  );
}

export default function EstadisticasScreen() {
  const { user } = useAuth();
  const [negocio, setNegocio] = useState<{ nombre: string; visible: boolean } | null>(null);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [periodo, setPeriodo] = useState<number>(PERIODO_ESTADISTICAS_POR_DEFECTO);
  const [cargando, setCargando] = useState(false);
  const [sinNegocio, setSinNegocio] = useState(false);

  const cargar = useCallback(
    async (dias: number) => {
      if (!user) return;
      setCargando(true);
      try {
        const emprendimiento = await obtenerMiEmprendimiento(supabase, user.id);
        if (!emprendimiento) {
          setSinNegocio(true);
          return;
        }
        setNegocio({
          nombre: emprendimiento.nombre,
          visible: estadoEfectivo(emprendimiento.estado, emprendimiento.activo_hasta) === 'activo',
        });
        setEstadisticas(await obtenerEstadisticas(supabase, emprendimiento.id, dias));
      } catch (error) {
        Alert.alert('No se pudieron cargar las estadísticas', mensajeError(error, 'Desliza hacia abajo para reintentar.'));
      } finally {
        setCargando(false);
      }
    },
    [user],
  );

  // Se recarga cada vez que la pantalla vuelve a estar a la vista.
  useFocusEffect(
    useCallback(() => {
      cargar(periodo);
    }, [cargar, periodo]),
  );

  async function compartir() {
    if (!negocio || !estadisticas) return;
    try {
      await Share.share({ message: reporteTexto(negocio.nombre, estadisticas) });
    } catch (error) {
      Alert.alert('No se pudo compartir el reporte', mensajeError(error, 'Inténtalo de nuevo.'));
    }
  }

  if (sinNegocio) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-neutral-50 px-8">
        <Text className="text-center text-neutral-600">Primero crea tu perfil comercial en la pestaña Vender.</Text>
      </SafeAreaView>
    );
  }

  const total = estadisticas ? totalVisitas(estadisticas) : 0;
  const sinActividad = estadisticas !== null && total === 0 && estadisticas.contactos === 0;

  return (
    <SafeAreaView className="flex-1 bg-neutral-50">
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={() => cargar(periodo)} />}
      >
        {negocio && (
          <Text className="text-sm text-neutral-500">
            {negocio.nombre}
            {estadisticas && ` · del ${formatearDia(estadisticas.desde)} al ${formatearDia(estadisticas.hasta)}`}
          </Text>
        )}

        <View className="flex-row gap-2">
          {PERIODOS_ESTADISTICAS.map((dias) => (
            <Pressable
              key={dias}
              onPress={() => setPeriodo(dias)}
              className={`rounded-full border px-4 py-1.5 ${
                dias === periodo ? 'border-primary-600 bg-primary-600' : 'border-neutral-300 bg-white'
              }`}
            >
              <Text className={`text-sm font-medium ${dias === periodo ? 'text-white' : 'text-neutral-700'}`}>
                {dias} días
              </Text>
            </Pressable>
          ))}
        </View>

        {negocio && !negocio.visible && (
          <View className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <Text className="text-sm text-amber-800">
              Las visitas solo se cuentan mientras tu emprendimiento es visible en el catálogo (con la
              suscripción vigente).
            </Text>
          </View>
        )}

        {estadisticas && (
          <>
            <View className="gap-3">
              <View className="rounded-2xl border border-neutral-100 bg-white p-4">
                <Text className="text-sm text-neutral-500">Visitas</Text>
                <Text className="text-3xl font-bold text-neutral-900">{total}</Text>
                <Text className="text-xs text-neutral-500">
                  {estadisticas.visitas_perfil} al perfil · {estadisticas.visitas_productos} a publicaciones
                </Text>
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1 rounded-2xl border border-neutral-100 bg-white p-4">
                  <Text className="text-sm text-neutral-500">Clics en WhatsApp</Text>
                  <Text className="text-3xl font-bold text-neutral-900">{estadisticas.contactos}</Text>
                  <Text className="text-xs text-neutral-500">
                    {estadisticas.visitas_productos > 0
                      ? `${tasaDeContacto(estadisticas)} % de las visitas a publicaciones`
                      : 'Sin visitas a publicaciones'}
                  </Text>
                </View>
                <View className="flex-1 rounded-2xl border border-neutral-100 bg-white p-4">
                  <Text className="text-sm text-neutral-500">Hora pico</Text>
                  <Text className="text-3xl font-bold text-neutral-900">
                    {estadisticas.hora_pico === null ? '—' : etiquetaHora(estadisticas.hora_pico).split(' – ')[0]}
                  </Text>
                  <Text className="text-xs text-neutral-500">
                    {estadisticas.hora_pico === null ? 'Aún sin visitas' : `${etiquetaHora(estadisticas.hora_pico)} (Perú)`}
                  </Text>
                </View>
              </View>
            </View>

            {sinActividad ? (
              <View className="rounded-xl border border-dashed border-neutral-300 p-6">
                <Text className="text-center text-sm text-neutral-500">
                  Todavía no hay visitas en este periodo. Cuando alguien abra tu perfil o una de tus publicaciones, o
                  toque «Contactar por WhatsApp», lo verás aquí.
                </Text>
              </View>
            ) : (
              <>
                <View className="gap-2 rounded-2xl border border-neutral-100 bg-white p-4">
                  <Text className="text-base font-semibold text-neutral-900">Visitas por día</Text>
                  <Barras
                    valores={estadisticas.por_dia.map((dia) => dia.visitas)}
                    etiquetaInicio={formatearDia(estadisticas.desde)}
                    etiquetaFin={formatearDia(estadisticas.hasta)}
                  />
                </View>

                <View className="gap-2 rounded-2xl border border-neutral-100 bg-white p-4">
                  <Text className="text-base font-semibold text-neutral-900">Visitas por hora del día</Text>
                  <Barras
                    valores={estadisticas.por_hora.map((hora) => hora.visitas)}
                    destacada={estadisticas.hora_pico}
                    etiquetaInicio="00:00"
                    etiquetaFin="23:00"
                  />
                </View>

                <View className="gap-2 rounded-2xl border border-neutral-100 bg-white p-4">
                  <Text className="text-base font-semibold text-neutral-900">Publicaciones más vistas</Text>
                  {estadisticas.productos.length > 0 ? (
                    estadisticas.productos.map((producto, indice) => (
                      <View key={producto.producto_id} className="flex-row items-center justify-between gap-2">
                        <Text className="flex-1 text-sm text-neutral-900">
                          {indice + 1}. {producto.nombre}
                        </Text>
                        <Text className="text-xs text-neutral-500">
                          {producto.visitas} visitas · {producto.contactos} clics
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text className="text-sm text-neutral-500">Todavía nadie abrió tus publicaciones en este periodo.</Text>
                  )}
                </View>
              </>
            )}

            <Button texto="Compartir reporte" onPress={compartir} />
            <Text className="text-xs text-neutral-500">
              No se cuentan tus propias visitas. Si la misma persona vuelve a abrir lo mismo antes de 30 minutos, cuenta
              una sola vez.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
