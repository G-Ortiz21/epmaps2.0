import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useCSSVariable } from 'uniwind';

import {
  evaluarFortaleza,
  type FortalezaClave,
} from '../../domain/fortalezaClave';
interface IndicadorFortalezaProps {
  clave: string;
  tema?: 'actual' | 'aqua';
}

const presentacion: Record<
  FortalezaClave,
  { etiqueta: string; colorTexto: string }
> = {
  debil: {
    etiqueta: 'Débil',
    colorTexto: 'text-error',
  },
  media: {
    etiqueta: 'Media',
    colorTexto: 'text-advertencia',
  },
  fuerte: {
    etiqueta: 'Fuerte',
    colorTexto: 'text-exito',
  },
};

const coloresTextoAqua: Record<FortalezaClave, string> = {
  debil: 'text-aqua-error',
  media: 'text-aqua-aviso',
  fuerte: 'text-aqua-exito',
};

function exigirColorToken(
  valor: string | number | undefined,
  nombre: string,
): string {
  if (typeof valor !== 'string') {
    throw new Error(`No se pudo resolver el token de color ${nombre}.`);
  }

  return valor;
}

export function IndicadorFortaleza({
  clave,
  tema = 'actual',
}: IndicadorFortalezaProps) {
  const fortaleza = evaluarFortaleza(clave);
  const estilo = presentacion[fortaleza];
  const esAqua = tema === 'aqua';
  const reducirMovimiento = useReducedMotion();
  const nombresColores = esAqua
    ? ['--color-aqua-error', '--color-aqua-aviso', '--color-aqua-exito']
    : ['--color-error', '--color-advertencia', '--color-exito'];
  const valoresColores = useCSSVariable(nombresColores);
  const [colorDebilToken, colorMediaToken, colorFuerteToken] = valoresColores;
  const coloresBarra = [
    exigirColorToken(colorDebilToken, nombresColores[0]),
    exigirColorToken(colorMediaToken, nombresColores[1]),
    exigirColorToken(colorFuerteToken, nombresColores[2]),
  ];
  const colorTexto = esAqua
    ? coloresTextoAqua[fortaleza]
    : estilo.colorTexto;
  const progreso = useSharedValue(
    fortaleza === 'debil' ? 0 : fortaleza === 'media' ? 1 : 2,
  );
  const estiloBarra = useAnimatedStyle(() => ({
    width: `${interpolate(
      progreso.value,
      [0, 2],
      [33, 100],
      Extrapolation.CLAMP,
    )}%`,
    height: '100%',
    backgroundColor: interpolateColor(
      progreso.value,
      [0, 1, 2],
      coloresBarra,
    ),
  }));

  useEffect(() => {
    const objetivo = fortaleza === 'debil' ? 0 : fortaleza === 'media' ? 1 : 2;
    progreso.set(
      reducirMovimiento
        ? objetivo
        : withTiming(objetivo, {
            duration: 280,
            reduceMotion: ReduceMotion.System,
          }),
    );
  }, [fortaleza, progreso, reducirMovimiento]);

  return (
    <View className="gap-2">
      <View
        className={`h-2 overflow-hidden rounded-full ${
          esAqua ? 'bg-aqua-borde' : 'bg-borde'
        }`}
      >
        <Animated.View style={estiloBarra}>
          <View className="h-full w-full rounded-full" />
        </Animated.View>
      </View>
      <Text
        accessibilityLabel={`Fortaleza de la contraseña: ${estilo.etiqueta}`}
        className={`text-sm font-semibold ${colorTexto}`}
      >
        Fortaleza: {estilo.etiqueta}
      </Text>
    </View>
  );
}
