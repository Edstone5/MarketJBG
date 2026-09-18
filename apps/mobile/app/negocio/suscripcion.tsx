import { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { PRECIO_SUSCRIPCION_MENSUAL, reportarPagoSchema } from '@emprende/core';
import { obtenerMiEmprendimiento, reportarPago, type Database } from '@emprende/db';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/Button';
import { ImageUploader } from '@/components/ImageUploader';

type Pago = Database['public']['Tables']['pagos']['Row'];

const ETIQUETAS_PAGO: Record<string, string> = {
  pendiente: 'Pendiente de revisión',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
};

export default function SuscripcionScreen() {
  const { user } = useAuth();
  const [emprendimientoId, setEmprendimientoId] = useState<string | null>(null);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [monto, setMonto] = useState(String(PRECIO_SUSCRIPCION_MENSUAL));
  const [comprobante, setComprobante] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!user) return;
    obtenerMiEmprendimiento(supabase, user.id)
      .then((emprendimiento) => {
        if (!emprendimiento) return;
        setEmprendimientoId(emprendimiento.id);
        setPagos((emprendimiento.pagos ?? []) as Pago[]);
      })
      .finally(() => setCargando(false));
  }, [user]);

  async function reportar() {
    const resultado = reportarPagoSchema.safeParse({
      montoReportado: Number(monto),
      comprobanteUrl: comprobante[0],
    });
    if (!resultado.success) {
      Alert.alert('Revisa el formulario', resultado.error.issues[0]?.message);
      return;
    }
    if (!emprendimientoId) return;

    setEnviando(true);
    try {
      await reportarPago(supabase, emprendimientoId, resultado.data);
      Alert.alert(
        'Pago reportado',
        'Un administrador revisará tu comprobante en menos de 24 horas.',
      );
      router.back();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo reportar el pago.');
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) return null;

  return (
    <SafeAreaView className="flex-1 bg-neutral-50">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text className="text-2xl font-bold text-neutral-900">Suscripción mensual</Text>
        <Text className="text-sm text-neutral-500">
          Tu emprendimiento aparece en el catálogo público mientras la suscripción esté activa.
          Paga S/ {PRECIO_SUSCRIPCION_MENSUAL} por Yape y sube el comprobante para su revisión
          manual.
        </Text>

        {pagos.length > 0 && (
          <View className="rounded-xl border border-neutral-200 bg-white p-4">
            <Text className="mb-2 text-sm font-semibold text-neutral-900">
              Historial de pagos
            </Text>
            {pagos.map((pago) => (
              <View key={pago.id} className="flex-row items-center justify-between py-1">
                <Text className="text-sm text-neutral-700">S/ {pago.monto_reportado}</Text>
                <Text className="text-sm font-medium text-neutral-700">
                  {ETIQUETAS_PAGO[pago.estado] ?? pago.estado}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View className="gap-1">
          <Text className="text-sm font-medium text-neutral-700">Monto pagado (S/)</Text>
          <TextInput
            value={monto}
            onChangeText={setMonto}
            keyboardType="decimal-pad"
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900"
          />
        </View>

        <View className="gap-1">
          <Text className="text-sm font-medium text-neutral-700">
            Captura del comprobante Yape
          </Text>
          <ImageUploader
            bucket="comprobantes"
            value={comprobante}
            onChange={setComprobante}
            maxFiles={1}
          />
        </View>

        <Button
          texto={enviando ? 'Enviando…' : 'Reportar pago'}
          onPress={reportar}
          disabled={enviando || !emprendimientoId}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
