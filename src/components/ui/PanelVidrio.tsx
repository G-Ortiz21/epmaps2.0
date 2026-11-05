import { View } from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';

interface PanelVidrioProps {
  children: ReactNode;
  estiloAnimado?: AnimatedStyle<ViewStyle>;
}

export function PanelVidrio({ children, estiloAnimado }: PanelVidrioProps) {
  return (
    <View className="mx-[8px] -mt-[12px]">
      <Animated.View style={estiloAnimado}>
        <View className="rounded-[24px] border border-white/[0.95] bg-[rgba(255,255,255,0.88)] p-[23px] shadow-[0px_10px_22px_rgba(21,62,91,0.09)]">
          <View className="mb-[19px] h-[4px] w-[35px] rounded-[2px] bg-aqua-turquesa" />
          <View className="gap-[11px]">{children}</View>
        </View>
      </Animated.View>
    </View>
  );
}
