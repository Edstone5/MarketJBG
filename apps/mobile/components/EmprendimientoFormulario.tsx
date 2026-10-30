import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { CATEGORIAS, crearEmprendimientoSchema, primerError, type CrearEmprendimientoInput } from '@emprende/core';
import { Button } from '@/components/Button';

export interface EmprendimientoInicial {
  nombre: string;
  descripcion: string;
  whatsapp: string;
  categoria_slug: string;
}

/**
 * Formulario del perfil comercial, compartido por «Crea tu perfil comercial» y «Editar perfil». Valida con el mismo
 * esquema que la web y entrega los datos ya validados a `onEnviar`; quien lo usa hace la llamada a la API.
 */
export function EmprendimientoFormulario({
  inicial,
  enviando,
  textoBoton,
  onEnviar,
}: {
  inicial?: EmprendimientoInicial;
  enviando: boolean;
  textoBoton: string;
  onEnviar: (datos: CrearEmprendimientoInput) => void;
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '');
  const [whatsapp, setWhatsapp] = useState(inicial?.whatsapp ?? '');
  const [categoriaSlug, setCategoriaSlug] = useState<string>(inicial?.categoria_slug ?? CATEGORIAS[0]!.slug);

  function enviar() {
    const resultado = crearEmprendimientoSchema.safeParse({
      nombre,
      descripcion,
      whatsapp,
      categoriaSlug,
    });
    if (!resultado.success) {
      Alert.alert('Revisa el formulario', primerError(resultado.error));
      return;
    }
    onEnviar(resultado.data);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Campo label="Nombre del emprendimiento" value={nombre} onChangeText={setNombre} />
      <Campo label="Descripción" value={descripcion} onChangeText={setDescripcion} multiline />
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

      <Button texto={textoBoton} onPress={enviar} disabled={enviando} />
    </ScrollView>
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
