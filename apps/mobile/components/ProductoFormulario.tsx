import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import {
  CATEGORIAS,
  TIPOS_PRODUCTO,
  ETIQUETAS_TIPO_PRODUCTO,
  crearProductoSchema,
  primerError,
  type CrearProductoInput,
  type TipoProducto,
} from '@emprende/core';
import { Button } from '@/components/Button';
import { ImageUploader } from '@/components/ImageUploader';

export interface ProductoInicial {
  tipo: TipoProducto;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria_slug: string;
  imagenes: string[];
}

/**
 * Formulario de una publicación, compartido por «Nueva publicación» y «Editar publicación». Valida con el mismo
 * esquema que la web y entrega los datos ya validados a `onEnviar`; quien lo usa hace la llamada a la API.
 */
export function ProductoFormulario({
  inicial,
  enviando,
  textoBoton,
  onEnviar,
}: {
  inicial?: ProductoInicial;
  enviando: boolean;
  /** Recibe el tipo elegido para poder escribir «Publicar servicio» / «Guardar cambios», etc. */
  textoBoton: (tipo: TipoProducto) => string;
  onEnviar: (datos: CrearProductoInput) => void;
}) {
  const [tipo, setTipo] = useState<TipoProducto>(inicial?.tipo ?? 'producto');
  const [nombre, setNombre] = useState(inicial?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '');
  const [precio, setPrecio] = useState(inicial ? String(inicial.precio) : '');
  const [categoriaSlug, setCategoriaSlug] = useState<string>(inicial?.categoria_slug ?? CATEGORIAS[0]!.slug);
  const [imagenes, setImagenes] = useState<string[]>(inicial?.imagenes ?? []);

  function enviar() {
    const resultado = crearProductoSchema.safeParse({
      tipo,
      nombre,
      descripcion,
      precio: Number(precio),
      categoriaSlug,
      imagenes,
    });
    if (!resultado.success) {
      Alert.alert('Revisa el formulario', primerError(resultado.error));
      return;
    }
    onEnviar(resultado.data);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View className="gap-1">
        <Text className="text-sm font-medium text-neutral-700">¿Qué vas a publicar?</Text>
        <View className="flex-row gap-2">
          {TIPOS_PRODUCTO.map((valor) => (
            <Text
              key={valor}
              onPress={() => setTipo(valor)}
              className={`flex-1 rounded-lg border px-3 py-2 text-center text-sm font-medium ${
                tipo === valor
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-neutral-300 text-neutral-600'
              }`}
            >
              {ETIQUETAS_TIPO_PRODUCTO[valor]}
            </Text>
          ))}
        </View>
      </View>

      <Campo
        label={`Nombre del ${tipo === 'servicio' ? 'servicio' : 'producto'}`}
        value={nombre}
        onChangeText={setNombre}
      />
      <Campo label="Descripción" value={descripcion} onChangeText={setDescripcion} multiline />
      <Campo label="Precio (S/)" value={precio} onChangeText={setPrecio} keyboardType="decimal-pad" />

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

      <View className="gap-1">
        <Text className="text-sm font-medium text-neutral-700">
          Fotos (opcional, hasta 6){tipo === 'servicio' && ' — ej. trabajos anteriores'}
        </Text>
        <ImageUploader bucket="productos" value={imagenes} onChange={setImagenes} multiple maxFiles={6} />
      </View>

      <Button texto={textoBoton(tipo)} onPress={enviar} disabled={enviando} />
    </ScrollView>
  );
}

function Campo(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'decimal-pad';
}) {
  return (
    <View className="gap-1">
      <Text className="text-sm font-medium text-neutral-700">{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        multiline={props.multiline}
        keyboardType={props.keyboardType}
        className="rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900"
        style={props.multiline ? { minHeight: 90, textAlignVertical: 'top' } : undefined}
      />
    </View>
  );
}
