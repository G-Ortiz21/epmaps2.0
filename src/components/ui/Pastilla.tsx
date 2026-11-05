import { Text, View } from 'react-native';
import type { ReactNode } from 'react';

type TipoPastilla = 'encabezado' | 'exito' | 'aviso' | 'error' | 'suave';

interface PastillaProps {
  children: ReactNode;
  tipo?: TipoPastilla;
}

const clasesPorTipo: Record<
  Exclude<TipoPastilla, 'encabezado'>,
  { contenedor: string; texto: string }
> = {
  exito: {
    contenedor: 'border-aqua-exito-borde bg-aqua-exito-fondo',
    texto: 'text-aqua-exito',
  },
  aviso: {
    contenedor: 'border-aqua-aviso-borde bg-aqua-aviso-fondo',
    texto: 'text-aqua-aviso',
  },
  error: {
    contenedor: 'border-aqua-error-borde bg-aqua-error-fondo',
    texto: 'text-aqua-error',
  },
  suave: {
    contenedor: 'border-aqua-borde bg-aqua-suave',
    texto: 'text-aqua-texto',
  },
};

export function Pastilla({ children, tipo = 'suave' }: PastillaProps) {
  if (tipo === 'encabezado') {
    return (
      <View className="self-start flex-row items-center gap-[4px] rounded-full border border-white/[0.18] bg-white/[0.09] px-[8px] py-[6px]">
        <View className="h-[7px] w-[7px] rounded-full bg-[#20B990]" />
        <Text className="text-[9px] font-bold tracking-[0.7px] text-aqua-pastilla">
          {children}
        </Text>
      </View>
    );
  }

  return (
    <View
      className={`self-start rounded-full border px-3 py-1 ${clasesPorTipo[tipo].contenedor}`}
    >
      <Text
        className={`text-[11px] font-bold ${clasesPorTipo[tipo].texto}`}
      >
        {children}
      </Text>
    </View>
  );
}
