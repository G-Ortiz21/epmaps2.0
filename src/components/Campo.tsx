import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors } from '../theme/colors';

/**
 * Campo de formulario controlado con etiqueta visible y error junto al
 * campo (ADR-006, DISEÑO.md §6.3). El valor vive fuera del componente,
 * en la pantalla o en el RegistroContext.
 */
export interface CampoProps {
  etiqueta: string;
  valor: string;
  onChangeText: (texto: string) => void;
  /** Texto de ayuda breve bajo la etiqueta. */
  ayuda?: string;
  /** Mensaje de error junto al campo. Si existe, el borde cambia de estado. */
  error?: string | null;
  placeholder?: string;
  editable?: boolean;
  multiline?: boolean;
  maxLength?: number;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
}

export function Campo({
  etiqueta,
  valor,
  onChangeText,
  ayuda,
  error,
  placeholder,
  editable = true,
  multiline = false,
  maxLength,
  keyboardType,
  autoCapitalize,
}: CampoProps) {
  return (
    <View className="gap-1">
      <Text className="text-sm font-medium leading-5 text-texto">{etiqueta}</Text>
      {ayuda !== undefined && (
        <Text className="text-xs font-medium leading-4 text-texto-secundario">
          {ayuda}
        </Text>
      )}
      <TextInput
        accessibilityLabel={etiqueta}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        editable={editable}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textoSecundario}
        textAlignVertical={multiline ? 'top' : undefined}
        className={`min-h-12 rounded-lg border bg-superficie px-3 py-2 text-base leading-6 text-texto ${error != null ? 'border-error' : 'border-borde'} ${multiline ? 'min-h-24' : ''}`}
        value={valor}
      />
      {error != null && (
        <Text accessibilityRole="alert" className="text-base leading-6 text-error">
          {error}
        </Text>
      )}
    </View>
  );
}
