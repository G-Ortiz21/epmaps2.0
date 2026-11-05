import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

type VarianteBoton = 'marca' | 'secundario' | 'texto';
type TemaBoton = 'actual' | 'aqua';

interface BotonProps {
  children: ReactNode;
  alPresionar: () => void;
  variante?: VarianteBoton;
  tema?: TemaBoton;
  ocupado?: boolean;
  deshabilitado?: boolean;
  etiquetaAccesible?: string;
}

const clasesPorVariante: Record<VarianteBoton, string> = {
  marca: 'bg-marca',
  secundario: 'border border-borde bg-superficie',
  texto: 'bg-transparent',
};

const textoPorVariante: Record<VarianteBoton, string> = {
  marca: 'text-blanco',
  secundario: 'text-marca',
  texto: 'text-marca',
};

export function Boton({
  children,
  alPresionar,
  variante = 'marca',
  tema = 'actual',
  ocupado = false,
  deshabilitado = false,
  etiquetaAccesible,
}: BotonProps) {
  const inactivo = ocupado || deshabilitado;
  const esAqua = tema === 'aqua';
  const escala = useSharedValue(1);
  const reducirMovimiento = useReducedMotion();
  const estiloEscala = useAnimatedStyle(() => ({
    transform: [{ scale: escala.value }],
  }));

  function presionar(): void {
    if (inactivo || reducirMovimiento) {
      return;
    }

    escala.set(
      withSpring(esAqua ? 0.99 : 0.96, {
        damping: 16,
        stiffness: 220,
        reduceMotion: ReduceMotion.System,
      }),
    );
  }

  function soltar(): void {
    if (reducirMovimiento) {
      escala.set(1);
      return;
    }

    escala.set(
      withSpring(1, {
        damping: 16,
        stiffness: 220,
        reduceMotion: ReduceMotion.System,
      }),
    );
  }

  return (
    <View className="w-full">
      <Animated.View style={estiloEscala}>
        <Pressable
          accessibilityLabel={etiquetaAccesible}
          accessibilityRole="button"
          className={`flex-row items-center justify-center gap-3 ${
            esAqua
              ? `mt-[10px] min-h-[54px] rounded-[14px] px-[18px] ${
                  variante === 'marca'
                    ? 'bg-aqua-azul shadow-[0px_5px_9px_rgba(8,127,196,0.18)] active:bg-aqua-marino'
                    : variante === 'secundario'
                      ? 'border border-aqua-azul bg-transparent'
                      : 'bg-transparent'
                }`
              : `min-h-12 rounded-xl px-5 py-3 ${clasesPorVariante[variante]}`
          } ${inactivo ? (esAqua ? 'opacity-[0.65]' : 'opacity-60') : ''}`}
          disabled={inactivo}
          onPress={alPresionar}
          onPressIn={presionar}
          onPressOut={soltar}
        >
          {ocupado ? (
            <ActivityIndicator
              accessibilityLabel="Procesando"
              colorClassName={
                esAqua
                  ? variante === 'marca'
                    ? 'text-blanco'
                    : 'text-aqua-azul'
                  : variante === 'marca'
                    ? 'text-blanco'
                    : 'text-marca'
              }
            />
          ) : (
            <>
              <Text
                className={`text-center ${
                  esAqua
                    ? `text-[14px] font-extrabold tracking-[0.3px] ${
                        variante === 'marca'
                          ? 'text-blanco'
                          : 'text-aqua-azul'
                      }`
                    : `text-base font-semibold ${textoPorVariante[variante]}`
                }`}
              >
                {children}
              </Text>
              {esAqua && variante === 'marca' ? (
                <Text className="text-[22px] font-bold text-aqua-turquesa">
                  →
                </Text>
              ) : null}
            </>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}
