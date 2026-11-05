import { Text, View } from 'react-native';
import LottieView from 'lottie-react-native';

export type EstadoAnimacionUbicacion = 'buscando' | 'gps' | 'manual' | 'error';

const ETIQUETAS: Record<Exclude<EstadoAnimacionUbicacion, 'buscando'>, string> = {
  gps: 'Ubicación GPS capturada',
  manual: 'Ubicación manual seleccionada',
  error: 'No se obtuvo una ubicación GPS',
};

export default function LottieLocation({
  estado,
}: {
  estado: EstadoAnimacionUbicacion;
}) {
  if (estado === 'buscando') {
    return (
      <View className="items-center gap-1">
        <View className="h-[116px] w-[116px]">
          <LottieView
            autoPlay
            loop
            source={require('../../assets/animations/radar-ubicacion.json')}
            style={{ width: 116, height: 116 }}
          />
        </View>
        <Text accessibilityRole="text" accessibilityLabel="Buscando ubicación GPS" className="text-sm font-semibold text-texto-secundario">Buscando GPS…</Text>
      </View>
    );
  }

  const confirmado = estado === 'gps' || estado === 'manual';
  return (
    <View
      accessibilityRole={estado === 'error' ? 'alert' : 'summary'}
      className="flex-row items-center gap-3"
    >
      <View
        className={[
          'h-12 w-12 items-center justify-center rounded-full',
          confirmado ? 'bg-exito/10' : 'bg-error/10',
        ].join(' ')}
      >
        <Text className={[
          'text-xl font-bold',
          confirmado ? 'text-exito' : 'text-error',
        ].join(' ')}>
          {estado === 'manual' ? 'M' : confirmado ? '✓' : '!'}
        </Text>
      </View>
      <Text className={[
        'flex-1 text-sm font-semibold',
        confirmado ? 'text-exito' : 'text-error',
      ].join(' ')}>
        {ETIQUETAS[estado]}
      </Text>
    </View>
  );
}