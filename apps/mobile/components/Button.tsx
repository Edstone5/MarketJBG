import { Pressable, Text } from 'react-native';

interface ButtonProps {
  texto: string;
  onPress: () => void;
  disabled?: boolean;
  variante?: 'primario' | 'secundario' | 'peligro';
}

const ESTILOS = {
  primario: 'bg-primary-600 active:bg-primary-700',
  secundario: 'border border-neutral-300 bg-white active:bg-neutral-50',
  peligro: 'bg-danger active:opacity-90',
};

const ESTILOS_TEXTO = {
  primario: 'text-white',
  secundario: 'text-neutral-900',
  peligro: 'text-white',
};

export function Button({ texto, onPress, disabled, variante = 'primario' }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`items-center rounded-full px-5 py-3 ${ESTILOS[variante]} ${
        disabled ? 'opacity-60' : ''
      }`}
    >
      <Text className={`text-sm font-semibold ${ESTILOS_TEXTO[variante]}`}>{texto}</Text>
    </Pressable>
  );
}
