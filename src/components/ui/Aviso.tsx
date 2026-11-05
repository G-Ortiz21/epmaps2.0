import { Text, View } from 'react-native';

type TipoAviso = 'error' | 'exito' | 'informacion' | 'aviso';

interface AvisoProps {
  tipo: TipoAviso;
  children: string;
  tema?: 'actual' | 'aqua';
}

const clasesPorTipo: Record<TipoAviso, string> = {
  error: 'border-error bg-superficie',
  exito: 'border-exito bg-superficie',
  informacion: 'border-informacion bg-superficie',
  aviso: 'border-advertencia bg-superficie',
};

const textoPorTipo: Record<TipoAviso, string> = {
  error: 'text-error',
  exito: 'text-exito',
  informacion: 'text-informacion',
  aviso: 'text-advertencia',
};

const clasesAquaPorTipo: Record<TipoAviso, string> = {
  error: 'border-aqua-error-borde bg-aqua-error-fondo',
  exito: 'border-aqua-exito-borde bg-aqua-exito-fondo',
  informacion: 'border-aqua-aviso-borde bg-aqua-aviso-fondo',
  aviso: 'border-aqua-aviso-borde bg-aqua-aviso-fondo',
};

const textoAquaPorTipo: Record<TipoAviso, string> = {
  error: 'text-aqua-error',
  exito: 'text-aqua-exito',
  informacion: 'text-aqua-aviso',
  aviso: 'text-aqua-aviso',
};

export function Aviso({ tipo, children, tema = 'actual' }: AvisoProps) {
  const esAqua = tema === 'aqua';

  if (esAqua) {
    return (
      <View
        accessibilityRole={tipo === 'error' ? 'alert' : 'summary'}
        className={`mt-[3px] flex-row items-start gap-[9px] rounded-[12px] border p-[12px] ${clasesAquaPorTipo[tipo]}`}
      >
        <Text className={`text-[15px] font-black ${textoAquaPorTipo[tipo]}`}>
          {tipo === 'error' ? '!' : tipo === 'exito' ? '✓' : 'i'}
        </Text>
        <Text
          className={`flex-1 text-[12px] leading-[18px] ${textoAquaPorTipo[tipo]}`}
        >
          {children}
        </Text>
      </View>
    );
  }

  return (
    <View
      accessibilityRole={tipo === 'error' ? 'alert' : 'summary'}
      className={`rounded-xl border-l-4 px-4 py-3 ${clasesPorTipo[tipo]}`}
    >
      <Text className={`text-sm leading-5 ${textoPorTipo[tipo]}`}>
        {children}
      </Text>
    </View>
  );
}
