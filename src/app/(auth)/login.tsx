import { useState } from 'react';
import { Link, router } from 'expo-router';
import { Text, View } from 'react-native';
import {
  cancelAnimation,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Aviso } from '../../components/ui/Aviso';
import { Boton } from '../../components/ui/Boton';
import { CampoTexto } from '../../components/ui/CampoTexto';
import { EntradaEscalonada } from '../../components/ui/EntradaEscalonada';
import { PantallaAuth } from '../../components/ui/PantallaAuth';
import { useSesion } from '../../contexts/SesionContext';
import {
  validarClaveAuth,
  validarCorreoAuth,
} from '../../domain/validacionesAuth';
import {
  mensajeErrorAuth,
  obtenerCodigoErrorAuth,
} from '../../services/erroresAuth';

export default function LoginScreen() {
  const { iniciarSesion } = useSesion();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [errores, setErrores] = useState<{
    correo?: string;
    clave?: string;
  }>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const desplazamiento = useSharedValue(0);
  const estiloHoja = useAnimatedStyle(() => ({
    transform: [{ translateX: desplazamiento.value }],
  }));

  function sacudir(): void {
    cancelAnimation(desplazamiento);
    desplazamiento.set(0);
    desplazamiento.set(
      withSequence(
        ReduceMotion.System,
        withTiming(-18, { duration: 80 }),
        withTiming(18, { duration: 80 }),
        withTiming(-14, { duration: 70 }),
        withTiming(14, { duration: 70 }),
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(0, { duration: 70 }),
      ),
    );
  }

  async function ingresar(): Promise<void> {
    const nuevosErrores = {
      correo: validarCorreoAuth(correo) ?? undefined,
      clave: validarClaveAuth(clave) ?? undefined,
    };
    setErrores(nuevosErrores);
    setMensaje(null);

    if (nuevosErrores.correo || nuevosErrores.clave) {
      sacudir();
      return;
    }

    setOcupado(true);
    try {
      await iniciarSesion(correo, clave);
      router.replace('/inicio');
    } catch (error: unknown) {
      if (obtenerCodigoErrorAuth(error) === 'auth/email-not-verified') {
        router.replace('/verificar-correo');
        return;
      }

      setMensaje(mensajeErrorAuth(error));
      sacudir();
    } finally {
      setOcupado(false);
    }
  }

  return (
    <PantallaAuth
      titulo="Iniciar sesión"
      descripcion="Accede con el correo y la contraseña de tu cuenta."
      estiloHoja={estiloHoja}
      varianteVisual="aqua"
    >
      <EntradaEscalonada demora={0}>
        <CampoTexto
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          editable={!ocupado}
          error={errores.correo}
          etiqueta="Correo electrónico"
          icono="@"
          keyboardType="email-address"
          onChangeText={(valor) => {
            setCorreo(valor);
            setErrores((actuales) => ({ ...actuales, correo: undefined }));
            setMensaje(null);
          }}
          onSubmitEditing={() => void ingresar()}
          placeholder="nombre@ejemplo.com"
          returnKeyType="next"
          tema="aqua"
          textContentType="emailAddress"
          value={correo}
        />
      </EntradaEscalonada>
      <EntradaEscalonada demora={80}>
        <CampoTexto
          autoCapitalize="none"
          autoComplete="password"
          autoCorrect={false}
          editable={!ocupado}
          error={errores.clave}
          etiqueta="Contraseña"
          icono="◆"
          onChangeText={(valor) => {
            setClave(valor);
            setErrores((actuales) => ({ ...actuales, clave: undefined }));
            setMensaje(null);
          }}
          onSubmitEditing={() => void ingresar()}
          placeholder="Ingresa tu contraseña"
          returnKeyType="go"
          secureTextEntry
          tema="aqua"
          textContentType="password"
          value={clave}
        />
      </EntradaEscalonada>
      {mensaje ? <Aviso tipo="error" tema="aqua">{mensaje}</Aviso> : null}
      <EntradaEscalonada demora={160}>
        <Boton
          alPresionar={() => void ingresar()}
          ocupado={ocupado}
          tema="aqua"
        >
          Ingresar
        </Boton>
      </EntradaEscalonada>
      <View className="items-center gap-2">
        <Link href="/recuperar" asChild>
          <Text className="min-h-12 py-3 text-center font-semibold text-aqua-azul">
            ¿Olvidaste tu contraseña?
          </Text>
        </Link>
        <Text className="text-center text-sm text-aqua-secundario">
          ¿Aún no tienes cuenta?
        </Text>
        <Link href="/registro" asChild>
          <Text className="min-h-12 py-3 text-center font-semibold text-aqua-azul">
            Crear cuenta
          </Text>
        </Link>
      </View>
    </PantallaAuth>
  );
}
