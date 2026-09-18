import { useCallback, useState } from 'react';
import { Alert, RefreshControl, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { CATEGORIAS, crearEmprendimientoSchema, ETIQUETAS_TIPO_PRODUCTO } from '@emprende/core';
import { crearEmprendimiento, obtenerMiEmprendimiento, type Database } from '@emprende/db';
import { PlusCircle } from 'lucide-react-native';
import { supabase, supabaseConfigurado } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/Button';

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
    const estado = ETIQUETAS_ESTADO[emprendimiento.estado];
    return (
      <SafeAreaView className="flex-1 bg-neutral-50">
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 16 }}
          refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargar} />}
        >
          <View>
            <Text className="text-2xl font-bold text-neutral-900">{emprendimiento.nombre}</Text>
            <Text className={`mt-1 self-start rounded-full px-3 py-0.5 text-xs font-medium ${estado?.clase ?? ''}`}>
              {estado?.texto ?? emprendimiento.estado}
            </Text>
          </View>

          {emprendimiento.estado !== 'activo' && (
            <View className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <Text className="text-sm text-amber-800">
                Tu emprendimiento aún no aparece en el catálogo público. Reporta tu pago de
                suscripción por Yape para activarlo.
              </Text>
            </View>
          )}

          <View className="flex-row gap-2">
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
                <View key={producto.id} className="flex-row items-center justify-between p-3">
                  <View>
                    <Text className="text-sm font-medium text-neutral-900">{producto.nombre}</Text>
                    <Text className="text-xs text-neutral-500">
                      {ETIQUETAS_TIPO_PRODUCTO[producto.tipo]}
                    </Text>
                  </View>
                  <Text className="text-sm text-neutral-500">S/ {producto.precio}</Text>
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
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [categoriaSlug, setCategoriaSlug] = useState(CATEGORIAS[0]!.slug);
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    const resultado = crearEmprendimientoSchema.safeParse({
      nombre,
      descripcion,
      whatsapp,
      categoriaSlug,
    });
    if (!resultado.success) {
      Alert.alert('Revisa el formulario', resultado.error.issues[0]?.message);
      return;
    }

    setEnviando(true);
    try {
      const nuevo = await crearEmprendimiento(supabase, usuarioId, resultado.data);
      onCreado(nuevo as Emprendimiento);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo crear');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-50">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text className="text-2xl font-bold text-neutral-900">Crea tu perfil comercial</Text>

        <Campo label="Nombre del emprendimiento" value={nombre} onChangeText={setNombre} />
        <Campo
          label="Descripción"
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
        />
        <Campo label="WhatsApp de contacto" value={whatsapp} onChangeText={setWhatsapp} />

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

        <Button
          texto={enviando ? 'Creando…' : 'Crear mi emprendimiento'}
          onPress={enviar}
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
}) {
  return (
    <View className="gap-1">
      <Text className="text-sm font-medium text-neutral-700">{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        multiline={props.multiline}
        className="rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900"
        style={props.multiline ? { minHeight: 90, textAlignVertical: 'top' } : undefined}
      />
    </View>
  );
}
