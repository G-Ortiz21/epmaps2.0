import { useMemo, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';

interface EntradaEscalonadaProps {
  children: ReactNode;
  demora: number;
}

export function EntradaEscalonada({
  children,
  demora,
}: EntradaEscalonadaProps) {
  const entrada = useMemo(
    () => FadeInDown.delay(demora).reduceMotion(ReduceMotion.System),
    [demora],
  );

  return (
    <View className="w-full">
      <Animated.View entering={entrada}>
        <View className="w-full">{children}</View>
      </Animated.View>
    </View>
  );
}
