import { Pressable, ScrollView, Text } from 'react-native';
import { CATEGORIAS } from '@emprende/core';

interface Props {
  activa?: string;
  onChange: (slug: string | undefined) => void;
}

export function CategoryChips({ activa, onChange }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
      <Pressable
        onPress={() => onChange(undefined)}
        className={`mr-2 rounded-full border px-4 py-1.5 ${
          !activa ? 'border-primary-600 bg-primary-600' : 'border-neutral-300'
        }`}
      >
        <Text className={`text-sm font-medium ${!activa ? 'text-white' : 'text-neutral-700'}`}>
          Todo
        </Text>
      </Pressable>
      {CATEGORIAS.map((categoria) => (
        <Pressable
          key={categoria.slug}
          onPress={() => onChange(categoria.slug)}
          className={`mr-2 rounded-full border px-4 py-1.5 ${
            activa === categoria.slug ? 'border-primary-600 bg-primary-600' : 'border-neutral-300'
          }`}
        >
          <Text
            className={`text-sm font-medium ${
              activa === categoria.slug ? 'text-white' : 'text-neutral-700'
            }`}
          >
            {categoria.nombre}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
