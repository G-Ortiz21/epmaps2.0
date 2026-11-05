import { useEffect } from 'react';
import { Text, View } from 'react-native';
import type { ReactNode } from 'react';
import Animated, {
  cancelAnimation,
  interpolate,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Pastilla } from './Pastilla';

interface EncabezadoAquaProps {
  titulo: string;
  descripcion: string;
  eyebrow?: string;
  pastilla?: string;
  children?: ReactNode;
}

export function EncabezadoAqua({
  titulo,
  descripcion,
  eyebrow,
  pastilla,
  children,
}: EncabezadoAquaProps) {
  const reducirMovimiento = useReducedMotion();
  const movimientoSuperior = useSharedValue(reducirMovimiento ? 0.5 : 0);
  const movimientoInferior = useSharedValue(reducirMovimiento ? 0.5 : 0);
  const estiloOrbeSuperior = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(movimientoSuperior.value, [0, 1], [-4, 5]) },
      { translateY: interpolate(movimientoSuperior.value, [0, 1], [3, -8]) },
      { scale: interpolate(movimientoSuperior.value, [0, 1], [1, 1.04]) },
    ],
  }));
  const estiloOrbeInferior = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(movimientoInferior.value, [0, 1], [4, -5]) },
      { translateY: interpolate(movimientoInferior.value, [0, 1], [-3, 7]) },
      { scale: interpolate(movimientoInferior.value, [0, 1], [1, 0.96]) },
    ],
  }));

  useEffect(() => {
    if (reducirMovimiento) {
      movimientoSuperior.set(0.5);
      movimientoInferior.set(0.5);
      return;
    }

    movimientoSuperior.set(
      withRepeat(
        withTiming(1, { duration: 5200 }),
        -1,
        true,
        undefined,
        ReduceMotion.System,
      ),
    );
    movimientoInferior.set(
      withRepeat(
        withTiming(1, { duration: 6400 }),
        -1,
        true,
        undefined,
        ReduceMotion.System,
      ),
    );

    return () => {
      cancelAnimation(movimientoSuperior);
      cancelAnimation(movimientoInferior);
    };
  }, [movimientoInferior, movimientoSuperior, reducirMovimiento]);

  return (
    <View className="relative overflow-hidden rounded-bl-[30px] rounded-br-[30px] bg-aqua-marino px-[16px] pb-[36px] pt-[36px]">
      <View
        accessibilityElementsHidden
        className="absolute -right-[60px] -top-[95px]"
        importantForAccessibility="no"
        pointerEvents="none"
      >
        <Animated.View style={estiloOrbeSuperior}>
          <View className="h-[250px] w-[250px] rounded-full border border-[rgba(179,239,255,0.20)] bg-[rgba(34,178,224,0.16)]" />
        </Animated.View>
      </View>
      <View
        accessibilityElementsHidden
        className="absolute -bottom-[110px] -left-[50px]"
        importantForAccessibility="no"
        pointerEvents="none"
      >
        <Animated.View style={estiloOrbeInferior}>
          <View className="h-[220px] w-[220px] rounded-full border border-[rgba(179,239,255,0.15)] bg-[rgba(0,207,190,0.12)]" />
        </Animated.View>
      </View>

      <View className="mb-[16px] flex-row items-center gap-[8px]">
        <View className="h-[34px] w-[34px] items-center justify-center rounded-[12px] border border-white/[0.25] bg-white/[0.13]">
          <Text className="text-[24px] font-bold text-aqua-gota">◇</Text>
        </View>
        <Text className="text-[11px] font-medium tracking-[1.1px] text-aqua-marca">
          LECTURA ÁGIL · EPMAPS
        </Text>
      </View>

      {eyebrow ? (
        <Text className="mb-[8px] text-[9px] font-extrabold tracking-[1.4px] text-aqua-turquesa">
          {eyebrow}
        </Text>
      ) : null}
      <Text className="mb-[8px] text-[28px] font-bold leading-[35px] text-blanco">
        {titulo}
      </Text>
      <Text className="text-[16px] leading-[22px] text-aqua-subtitulo">
        {descripcion}
      </Text>

      {children ? <View className="mt-[16px]">{children}</View> : null}
      {pastilla ? (
        <View className="mt-[16px]">
          <Pastilla tipo="encabezado">{pastilla}</Pastilla>
        </View>
      ) : null}
    </View>
  );
}
