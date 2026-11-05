import { Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

interface CampoTextoProps extends TextInputProps {
  etiqueta: string;
  error?: string;
  icono?: string;
  tema?: 'actual' | 'aqua';
}

export function CampoTexto({
  etiqueta,
  error,
  icono,
  tema = 'actual',
  className,
  ...props
}: CampoTextoProps) {
  const esAqua = tema === 'aqua';

  if (esAqua) {
    return (
      <View className="gap-[4px]">
        <Text className="mt-[4px] text-[10px] font-extrabold uppercase tracking-[1px] text-aqua-texto">
          {etiqueta}
        </Text>
        <View
          className={`min-h-[53px] flex-row items-center rounded-[13px] border px-[14px] ${
            error
              ? 'border-aqua-error bg-aqua-error-fondo'
              : 'border-aqua-borde bg-white/[0.85]'
          }`}
        >
          {icono ? (
            <Text
              accessibilityElementsHidden
              className="w-[28px] text-[12px] font-black text-aqua-azul"
            >
              {icono}
            </Text>
          ) : null}
          <TextInput
            accessibilityLabel={etiqueta}
            className={`min-h-[50px] flex-1 py-[10px] text-[15px] text-aqua-texto ${className ?? ''}`}
            {...props}
          />
        </View>
        {error ? (
          <View
            accessibilityRole="alert"
            className="mt-[3px] flex-row items-start gap-[9px] rounded-[12px] border border-aqua-error-borde bg-aqua-error-fondo p-[12px]"
          >
            <Text className="text-[15px] font-black text-aqua-error">!</Text>
            <Text className="flex-1 text-[12px] leading-[18px] text-aqua-error">
              {error}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-semibold text-texto">{etiqueta}</Text>
      <TextInput
        accessibilityLabel={etiqueta}
        className={`min-h-12 rounded-xl border bg-superficie px-4 py-3 text-base text-texto ${error ? 'border-error' : 'border-borde'} ${className ?? ''}`}
        {...props}
      />
      {error ? (
        <Text accessibilityRole="alert" className="text-sm text-error">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
