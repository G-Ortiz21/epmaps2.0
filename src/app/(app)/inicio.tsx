import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInRight, ReduceMotion } from 'react-native-reanimated';

import { Boton } from '../../components/ui/Boton';
import { EncabezadoAqua } from '../../components/ui/EncabezadoAqua';
import { useRegistro } from '../../contexts/RegistroContext';
import { useSesion } from '../../contexts/SesionContext';

const entradasTarjetas = [0, 1, 2, 3, 4, 5].map((indice) =>
  FadeInRight.delay(indice * 110)
    .duration(500)
    .reduceMotion(ReduceMotion.System),
);

export default function HomeScreen() {
  const { nombre, email, tecnicoCodigo, cerrarSesion } = useSesion();
  const {
    registro,
    cargandoBorrador,
    hayRegistroPendiente,
    descartarRegistro,
  } = useRegistro();
  const [cerrando, setCerrando] = useState(false);
  const avisoMostradoRef = useRef(false);
  const indiceTarjetaConsulta = Number(hayRegistroPendiente);
  const indiceTarjetaHistorial = indiceTarjetaConsulta + 1;
  const indiceTarjetaCuenta = indiceTarjetaHistorial + 1;

  useEffect(() => {
    if (cargandoBorrador || avisoMostradoRef.current || !hayRegistroPendiente) {
      return;
    }

    avisoMostradoRef.current = true;

    Alert.alert(
      'Registro sin terminar',
      `Hay un registro pendiente${
        registro.codigoMedidor
          ? ` del medidor ${registro.codigoMedidor}`
          : ''
      }. ¿Qué deseas hacer?`,
      [
        {
          text: 'Descartar registro',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmar descarte',
              'Se eliminará el borrador y se intentará eliminar la fotografía asociada. Esta acción no se puede deshacer.',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Descartar',
                  style: 'destructive',
                  onPress: () => {
                    void descartarRegistro()
                      .then(() => {
                        Alert.alert(
                          'Registro descartado',
                          'El borrador se eliminó correctamente.',
                        );
                      })
                      .catch((error: unknown) => {
                        console.error('No se pudo descartar el registro:', error);
                        Alert.alert(
                          'Error',
                          'No se pudo eliminar el borrador. Inténtalo nuevamente.',
                        );
                      });
                  },
                },
              ],
            );
          },
        },
        {
          text: 'Continuar registro',
          onPress: () => {
            if (registro.codigoMedidor) {
              router.push({
                pathname: '/medidor/[codigo]',
                params: { codigo: registro.codigoMedidor },
              });
            } else {
              router.push('/medidor');
            }
          },
        },
      ],
      { cancelable: true },
    );
  }, [
    cargandoBorrador,
    hayRegistroPendiente,
    registro.codigoMedidor,
    descartarRegistro,
  ]);

  async function salir(): Promise<void> {
    setCerrando(true);
    try {
      await cerrarSesion();
    } catch (error: unknown) {
      console.error('No se pudo cerrar la sesión:', error);
      Alert.alert('Error', 'No se pudo cerrar la sesión.');
    } finally {
      setCerrando(false);
    }
  }

  function continuarRegistro(): void {
    if (registro.codigoMedidor) {
      router.push({
        pathname: '/medidor/[codigo]',
        params: { codigo: registro.codigoMedidor },
      });
    } else {
      router.push('/medidor');
    }
  }

  return (
    <View className="flex-1 bg-aqua-fondo">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 pb-10"
        showsVerticalScrollIndicator={false}
      >
        <EncabezadoAqua
          descripcion="Gestiona tus medidores y administra las lecturas de tu jornada."
          eyebrow="PANEL DEL TÉCNICO"
          titulo="Tu jornada, bajo control."
        >
          <View className="gap-1 rounded-2xl border border-white/[0.30] bg-white/[0.10] p-4">
            <Text className="text-xs font-semibold tracking-widest text-aqua-subtitulo">
              SESIÓN ACTIVA
            </Text>
            <Text className="text-lg font-bold text-blanco">
              {nombre || email || 'Usuario'}
            </Text>
            {nombre && email ? (
              <Text className="text-sm text-aqua-subtitulo">{email}</Text>
            ) : null}
            {tecnicoCodigo ? (
              <Text className="text-xs text-aqua-subtitulo">
                Código: {tecnicoCodigo}
              </Text>
            ) : null}
          </View>
        </EncabezadoAqua>

        <View className="mx-[12px] gap-3">
          <Text className="text-xl font-bold text-aqua-marino">OPERACIONES</Text>
          <Text className="text-sm text-aqua-secundario">
            Accede a las tareas principales.
          </Text>

          {hayRegistroPendiente ? (
            <Animated.View entering={entradasTarjetas[0]}>
              <Pressable
                accessibilityRole="button"
                className="min-h-20 justify-center gap-1 rounded-[18px] border border-aqua-aviso-borde bg-aqua-aviso-fondo p-4"
                disabled={cargandoBorrador}
                onPress={continuarRegistro}
              >
                <Text className="font-bold text-aqua-aviso">
                  Continuar registro pendiente
                </Text>
                <Text className="text-sm text-aqua-secundario">
                  {registro.codigoMedidor
                    ? `Medidor: ${registro.codigoMedidor}`
                    : 'Tienes un registro sin terminar.'}
                </Text>
              </Pressable>
            </Animated.View>
          ) : null}

          <Animated.View entering={entradasTarjetas[indiceTarjetaConsulta]}>
            <Pressable
              accessibilityRole="button"
              className="min-h-24 justify-center gap-2 rounded-[24px] border border-white/[0.45] bg-aqua-azul p-5"
              onPress={() => router.push('/medidor')}
            >
              <Text className="text-xs font-bold tracking-widest text-blanco">
                CONSULTA
              </Text>
              <Text className="text-lg font-bold text-blanco">
                Consultar medidor
              </Text>
              <Text className="text-sm leading-5 text-blanco">
                Busca un suministro por su código y revisa sus datos disponibles.
              </Text>
            </Pressable>
          </Animated.View>

          <Animated.View entering={entradasTarjetas[indiceTarjetaHistorial]}>
            <Pressable
              accessibilityRole="button"
              className="min-h-20 justify-center gap-1 rounded-[18px] border border-white/[0.95] bg-white/[0.70] p-4 shadow-[0px_5px_14px_rgba(12,82,123,0.07)]"
              onPress={() => router.push('/lecturas')}
            >
              <Text className="font-bold text-aqua-texto">Historial de lecturas</Text>
              <Text className="text-sm text-aqua-secundario">
                Consulta registros guardados y su estado de sincronización.
              </Text>
            </Pressable>
          </Animated.View>
        </View>

        <Animated.View entering={entradasTarjetas[indiceTarjetaCuenta]}>
          <View className="mx-[12px] gap-3 rounded-[24px] border border-white/[0.95] bg-white/[0.70] p-5 shadow-[0px_5px_14px_rgba(12,82,123,0.07)]">
            <Text className="text-lg font-bold text-aqua-marino">CUENTA</Text>
            <Boton
              alPresionar={() => router.push('/perfil')}
              tema="aqua"
              variante="secundario"
            >
              Editar nombre
            </Boton>
            <Boton
              alPresionar={() => router.push('/cambiar-clave')}
              tema="aqua"
              variante="secundario"
            >
              Cambiar contraseña
            </Boton>
            <Boton
              alPresionar={() => void salir()}
              deshabilitado={cerrando}
              ocupado={cerrando}
              tema="aqua"
              variante="texto"
            >
              Cerrar sesión
            </Boton>
          </View>
        </Animated.View>

        <View className="mx-[12px] gap-3">
          <View className="gap-1">
            <Text className="text-xl font-bold text-aqua-marino">
              CENTRO DE OPERACIONES
            </Text>
            <Text className="text-sm text-aqua-secundario">
              Información para tu trabajo en campo.
            </Text>
          </View>
          <Animated.View
            entering={entradasTarjetas[indiceTarjetaCuenta + 1]}
          >
            <View className="gap-1 rounded-[18px] border border-white/[0.95] bg-white/[0.70] p-4">
              <Text className="font-bold text-aqua-texto">Trabajo en campo</Text>
              <Text className="text-sm leading-5 text-aqua-secundario">
                Consulta los datos disponibles del medidor antes de registrar una
                lectura.
              </Text>
            </View>
          </Animated.View>
          <Animated.View
            entering={entradasTarjetas[indiceTarjetaCuenta + 2]}
          >
            <View className="gap-1 rounded-[18px] border border-white/[0.95] bg-white/[0.70] p-4">
              <Text className="font-bold text-aqua-texto">Control de registros</Text>
              <Text className="text-sm leading-5 text-aqua-secundario">
                Revisa el historial para identificar lecturas pendientes,
                enviadas o que requieren atención.
              </Text>
            </View>
          </Animated.View>
        </View>
        <Text className="text-center text-xs font-semibold tracking-widest text-aqua-secundario">
          LECTURA ÁGIL · EPMAPS
        </Text>
      </ScrollView>
    </View>
  );
}
