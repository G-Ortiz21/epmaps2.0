import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Aviso } from '../../components/ui/Aviso';
import { Boton } from '../../components/ui/Boton';
import { PantallaAuth } from '../../components/ui/PantallaAuth';
import { useSesion } from '../../contexts/SesionContext';
import {
  mensajeErrorAuth,
  obtenerCodigoErrorAuth,
} from '../../services/erroresAuth';

export default function VerificarCorreoScreen() {
  const {
    email,
    reenviarVerificacion,
    recargarUsuario,
    cerrarSesion,
  } = useSesion();
  const [segundosEspera, setSegundosEspera] = useState(0);
  const [reenvioOcupado, setReenvioOcupado] = useState(false);
  const [comprobando, setComprobando] = useState(false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const comprobacionEnCurso = useRef(false);
  const pulso = useSharedValue(1);
  const reducirMovimiento = useReducedMotion();
  const estiloSobre = useAnimatedStyle(() => ({
    transform: [{ scale: pulso.value }],
  }));

  useEffect(() => {
    if (reducirMovimiento) {
      pulso.set(1);
      return;
    }

    pulso.set(
      withRepeat(
        withTiming(1.04, { duration: 900 }),
        -1,
        true,
        undefined,
        ReduceMotion.System,
      ),
    );

    return () => cancelAnimation(pulso);
  }, [pulso, reducirMovimiento]);

  const comprobarCorreo = useCallback(
    async (mostrarPendiente: boolean): Promise<void> => {
      if (comprobacionEnCurso.current) {
        return;
      }

      comprobacionEnCurso.current = true;
      setComprobando(true);
      setError(null);

      try {
        const verificado = await recargarUsuario();
        if (!verificado && mostrarPendiente) {
          setMensaje(
            'Todavía no aparece la verificación. Si acabas de abrir el enlace, espera unos segundos e inténtalo otra vez.',
          );
        } else if (verificado) {
          setMensaje('Correo verificado. Abriendo la aplicación…');
        }
      } catch (errorAuth: unknown) {
        setError(mensajeErrorAuth(errorAuth));
      } finally {
        comprobacionEnCurso.current = false;
        setComprobando(false);
      }
    },
    [recargarUsuario],
  );

  useEffect(() => {
    const comprobacionInicial = setTimeout(() => {
      void comprobarCorreo(false);
    }, 0);

    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') {
        void comprobarCorreo(false);
      }
    });

    return () => {
      clearTimeout(comprobacionInicial);
      suscripcion.remove();
    };
  }, [comprobarCorreo]);

  useEffect(() => {
    if (segundosEspera <= 0) {
      return;
    }

    const temporizador = setTimeout(() => {
      setSegundosEspera((actual) => Math.max(0, actual - 1));
    }, 1000);

    return () => clearTimeout(temporizador);
  }, [segundosEspera]);

  async function reenviar(): Promise<void> {
    if (reenvioOcupado || segundosEspera > 0) {
      return;
    }

    setReenvioOcupado(true);
    setMensaje(null);
    setError(null);

    try {
      await reenviarVerificacion();
      setMensaje(`Enviamos un nuevo enlace a ${email ?? 'tu correo'}.`);
      setSegundosEspera(60);
    } catch (errorAuth: unknown) {
      setError(mensajeErrorAuth(errorAuth));
      if (obtenerCodigoErrorAuth(errorAuth) === 'auth/too-many-requests') {
        setSegundosEspera(60);
      }
    } finally {
      setReenvioOcupado(false);
    }
  }

  async function usarOtraCuenta(): Promise<void> {
    setCerrandoSesion(true);
    setError(null);

    try {
      await cerrarSesion();
    } catch (errorAuth: unknown) {
      setError(mensajeErrorAuth(errorAuth));
    } finally {
      setCerrandoSesion(false);
    }
  }

  return (
    <PantallaAuth
      titulo="Verifica tu correo"
      descripcion="Confirma tu dirección para habilitar el acceso a Lectura Ágil."
      varianteVisual="aqua"
    >
      <View className="self-center">
        <Animated.View
          accessibilityLabel="Sobre de verificación"
          accessibilityRole="image"
          style={estiloSobre}
        >
          <View className="relative h-12 w-20 items-center justify-center rounded-[12px] border-2 border-aqua-azul bg-white/[0.85]">
            <View
              className="absolute left-4 top-1 h-8 w-8 rotate-45 border-b-2 border-r-2 border-aqua-azul"
              importantForAccessibility="no"
            />
          </View>
        </Animated.View>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-semibold text-aqua-texto">
          Enlace enviado a
        </Text>
        <Text className="text-lg font-bold text-aqua-marino">
          {email ?? 'Correo no disponible'}
        </Text>
        <Text className="text-sm leading-5 text-aqua-secundario">
          Abre el mensaje de Firebase y sigue el enlace. Si no lo encuentras,
          revisa la carpeta de correo no deseado.
        </Text>
      </View>

      {error ? <Aviso tipo="error" tema="aqua">{error}</Aviso> : null}
      {mensaje ? (
        <Aviso tipo="informacion" tema="aqua">
          {mensaje}
        </Aviso>
      ) : null}

      <Boton
        alPresionar={() => void comprobarCorreo(true)}
        deshabilitado={comprobando}
        ocupado={comprobando}
        tema="aqua"
        variante="secundario"
      >
        Ya verifiqué
      </Boton>

      <Boton
        alPresionar={() => void reenviar()}
        deshabilitado={segundosEspera > 0}
        ocupado={reenvioOcupado}
        tema="aqua"
      >
        {segundosEspera > 0
          ? `Reenviar en ${segundosEspera} s`
          : 'Reenviar correo'}
      </Boton>

      <View className="gap-2">
        <Text className="text-center text-sm text-aqua-secundario">
          La aplicación comprobará de nuevo al volver a primer plano.
        </Text>
        <Boton
          alPresionar={() => void usarOtraCuenta()}
          deshabilitado={cerrandoSesion}
          ocupado={cerrandoSesion}
          tema="aqua"
          variante="texto"
        >
          Usar otra cuenta
        </Boton>
      </View>
    </PantallaAuth>
  );
}
