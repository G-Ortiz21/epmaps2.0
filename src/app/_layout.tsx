import '../global.css';
import { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import Animated, {
  FadeOut,
  ReduceMotion,
  ZoomIn,
} from 'react-native-reanimated';
import { useIsRestoring } from '@tanstack/react-query';
import {
  PersistQueryClientProvider,
} from '@tanstack/react-query-persist-client';

import { persistOptions, queryClient } from '../lib/queryClient';
import { colors } from '../theme/colors';
import { ConexionProvider } from '../contexts/ConexionContext';
import { SesionProvider, useSesion } from '../contexts/SesionContext';
import SincronizacionAutomatica from '../components/SincronizacionAutomatica';

function informarErrorRestauracion() {
  // Si la restauración falla, la aplicación continúa con la caché vacía:
  // cada consulta intentará volver a obtener los datos cuando haya conexión.
  console.warn(
    'No se pudo restaurar la caché persistente de consultas de medidores.',
  );
}

function PantallaArranque() {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-fondo">
      <ActivityIndicator
        accessibilityLabel="Cargando aplicación"
        colorClassName="text-marca"
      />
      <Text className="text-base text-texto-secundario">
        Restaurando datos y comprobando la sesión…
      </Text>
    </View>
  );
}

function NavegacionRaiz() {
  const { estado } = useSesion();
  const restaurandoCache = useIsRestoring();
  const estadoAnterior = useRef(estado);
  const [mostrarVerificacionCompletada, setMostrarVerificacionCompletada] =
    useState(false);

  useEffect(() => {
    const verificacionCompletada =
      estadoAnterior.current === 'sin_verificar' && estado === 'autenticado';
    estadoAnterior.current = estado;

    if (!verificacionCompletada) {
      return;
    }

    const temporizadorMostrar = setTimeout(() => {
      setMostrarVerificacionCompletada(true);
    }, 0);

    return () => clearTimeout(temporizadorMostrar);
  }, [estado]);

  useEffect(() => {
    if (!mostrarVerificacionCompletada) {
      return;
    }

    const temporizador = setTimeout(
      () => setMostrarVerificacionCompletada(false),
      2200,
    );

    return () => clearTimeout(temporizador);
  }, [mostrarVerificacionCompletada]);

  if (estado === 'cargando' || restaurandoCache) {
    return <PantallaArranque />;
  }

  const noAutenticado = estado === 'no_autenticado';
  const sinVerificar = estado === 'sin_verificar';
  const autenticado = estado === 'autenticado';

  return (
    <View className="flex-1">
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.fondo },
        }}
      >
        <Stack.Protected guard={noAutenticado}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>

        <Stack.Protected guard={sinVerificar}>
          <Stack.Screen name="(verificacion)" />
        </Stack.Protected>

        <Stack.Protected guard={autenticado}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>

        <Stack.Screen name="index" />
      </Stack>
      {mostrarVerificacionCompletada ? (
        <View
          accessibilityRole="alert"
          className="absolute left-5 right-5 top-12 z-50"
          pointerEvents="none"
        >
          <Animated.View
            entering={ZoomIn.reduceMotion(ReduceMotion.System)}
            exiting={FadeOut.reduceMotion(ReduceMotion.System)}
          >
            <View className="items-center rounded-2xl bg-exito px-5 py-3">
              <Text className="text-base font-bold text-blanco">
                Correo verificado
              </Text>
              <Text className="text-sm text-blanco">
                Ya puedes usar Lectura Ágil.
              </Text>
            </View>
          </Animated.View>
        </View>
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
      onError={informarErrorRestauracion}
    >
      <SesionProvider>
        <ConexionProvider>
          <SincronizacionAutomatica />
          <NavegacionRaiz />
        </ConexionProvider>
      </SesionProvider>
    </PersistQueryClientProvider>
  );
}
