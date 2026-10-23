import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus, X } from 'lucide-react-native';
import { mensajeError, validarArchivoImagen } from '@emprende/core';
import { supabase } from '@/lib/supabase';

interface ImageUploaderProps {
  bucket: 'productos' | 'logos' | 'comprobantes';
  value: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  maxFiles?: number;
}

/**
 * Selecciona fotos con expo-image-picker y las sube a Supabase Storage bajo
 * la carpeta <usuario_id>/... (exigida por las políticas RLS de
 * storage.objects, ver supabase/migrations/0003_storage.sql). Para el
 * bucket privado "comprobantes" guarda la ruta (no una URL pública), igual
 * que su equivalente de la web (apps/web/src/components/ImageUploader.tsx).
 */
export function ImageUploader({
  bucket,
  value,
  onChange,
  multiple = false,
  maxFiles = 1,
}: ImageUploaderProps) {
  const [subiendo, setSubiendo] = useState(false);

  async function seleccionar() {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso necesario', 'Activa el acceso a tus fotos para poder subir imágenes.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsMultipleSelection: multiple,
      selectionLimit: Math.max(1, maxFiles - value.length),
    });
    if (resultado.canceled || resultado.assets.length === 0) return;

    const elegidas = resultado.assets.slice(0, maxFiles - value.length);
    for (const asset of elegidas) {
      const motivo = validarArchivoImagen({ type: asset.mimeType, size: asset.fileSize });
      if (motivo) {
        Alert.alert('Imagen no válida', motivo);
        return;
      }
    }

    setSubiendo(true);
    const nuevasUrls: string[] = [];
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');

      for (const asset of elegidas) {
        // solo letras y números en la extensión: viene de la ruta del archivo en el teléfono
        const extension =
          (asset.uri.split('.').pop() ?? '').split('?')[0]!.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) ||
          'jpg';
        const ruta = `${user.id}/${Date.now()}-${Math.round(Math.random() * 1e6)}.${extension}`;
        const bytes = await fetch(asset.uri).then((respuesta) => respuesta.arrayBuffer());

        const { error } = await supabase.storage.from(bucket).upload(ruta, bytes, {
          contentType: asset.mimeType ?? 'image/jpeg',
        });
        if (error) throw error;

        if (bucket === 'comprobantes') {
          nuevasUrls.push(ruta);
        } else {
          const { data } = supabase.storage.from(bucket).getPublicUrl(ruta);
          nuevasUrls.push(data.publicUrl);
        }
      }
    } catch (error) {
      Alert.alert('No se pudo subir la imagen', mensajeError(error, 'Inténtalo de nuevo.'));
    } finally {
      // lo que sí se alcanzó a subir se conserva aunque otra imagen falle
      if (nuevasUrls.length > 0) onChange([...value, ...nuevasUrls]);
      setSubiendo(false);
    }
  }

  return (
    <View className="flex-row flex-wrap gap-2">
      {value.map((url) => (
        <View key={url} className="h-20 w-20 overflow-hidden rounded-lg border border-neutral-200">
          {bucket === 'comprobantes' ? (
            <View className="flex-1 items-center justify-center bg-neutral-100">
              <Text className="text-xs text-neutral-500">Listo ✓</Text>
            </View>
          ) : (
            <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          )}
          <Pressable
            onPress={() => onChange(value.filter((u) => u !== url))}
            className="absolute right-1 top-1 rounded-full bg-black/60 p-1"
          >
            <X size={12} color="#fff" />
          </Pressable>
        </View>
      ))}

      {value.length < maxFiles && (
        <Pressable
          onPress={seleccionar}
          disabled={subiendo}
          className="h-20 w-20 items-center justify-center gap-1 rounded-lg border border-dashed border-neutral-300"
        >
          {subiendo ? (
            <ActivityIndicator size="small" color="#94a3b8" />
          ) : (
            <ImagePlus size={20} color="#94a3b8" />
          )}
          <Text className="text-[10px] text-neutral-400">Subir</Text>
        </Pressable>
      )}
    </View>
  );
}
