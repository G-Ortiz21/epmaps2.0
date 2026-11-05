import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AnimatedStyle } from 'react-native-reanimated';
import { withUniwind } from 'uniwind';
import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';

import { EncabezadoAqua } from './EncabezadoAqua';
import { PanelVidrio } from './PanelVidrio';

const SafeAreaViewConEstilos = withUniwind(SafeAreaView);

interface PantallaAuthProps {
  titulo: string;
  descripcion: string;
  children: ReactNode;
  estiloHoja?: AnimatedStyle<ViewStyle>;
  varianteVisual?: 'actual' | 'aqua';
}

export function PantallaAuth({
  titulo,
  descripcion,
  children,
  estiloHoja,
  varianteVisual = 'actual',
}: PantallaAuthProps) {
  const esAqua = varianteVisual === 'aqua';

  return (
    <SafeAreaViewConEstilos
      className={`flex-1 ${esAqua ? 'bg-aqua-fondo' : 'bg-fondo'}`}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName={
            esAqua
              ? 'grow pb-[48px]'
              : 'grow items-center justify-center px-5 py-8'
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            className={esAqua ? 'w-full' : 'w-full max-w-lg gap-6'}
          >
            {esAqua ? (
              <>
                <EncabezadoAqua titulo={titulo} descripcion={descripcion} />
                <PanelVidrio estiloAnimado={estiloHoja}>
                  {children}
                </PanelVidrio>
              </>
            ) : (
              <>
                <View className="gap-3 rounded-3xl bg-marca px-6 py-7">
                  <Text className="text-sm font-bold tracking-widest text-superficie-suave">
                    LECTURA ÁGIL · EPMAPS
                  </Text>
                  <Text className="text-3xl font-bold text-blanco">
                    {titulo}
                  </Text>
                  <Text className="text-base leading-6 text-superficie-suave">
                    {descripcion}
                  </Text>
                </View>
                <View className="gap-5 rounded-3xl border border-borde bg-superficie p-5">
                  {children}
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaViewConEstilos>
  );
}
