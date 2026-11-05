import { useState } from 'react';
import { Link, router } from 'expo-router';
import { Text } from 'react-native';

import { Aviso } from '../../components/ui/Aviso';
import { Boton } from '../../components/ui/Boton';
import { CampoTexto } from '../../components/ui/CampoTexto';
import { EntradaEscalonada } from '../../components/ui/EntradaEscalonada';
import { IndicadorFortaleza } from '../../components/ui/IndicadorFortaleza';
import { PantallaAuth } from '../../components/ui/PantallaAuth';
import { useSesion } from '../../contexts/SesionContext';
import {
  validarClaveAuth,
  validarConfirmacionClaveAuth,
  validarCorreoAuth,
  validarNombreAuth,
} from '../../domain/validacionesAuth';
import { mensajeErrorAuth } from '../../services/erroresAuth';

type ErroresRegistro = Partial<
  Record<'nombre' | 'correo' | 'clave' | 'confirmacion', string>
>;

export default function RegistroScreen() {
  const { registrarse } = useSesion();
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [errores, setErrores] = useState<ErroresRegistro>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function crearCuenta(): Promise<void> {
    const nuevosErrores: ErroresRegistro = {
      nombre: validarNombreAuth(nombre) ?? undefined,
      correo: validarCorreoAuth(correo) ?? undefined,
      clave: validarClaveAuth(clave) ?? undefined,
      confirmacion:
        validarConfirmacionClaveAuth(clave, confirmacion) ?? undefined,
    };
    setErrores(nuevosErrores);
    setMensaje(null);

    if (Object.values(nuevosErrores).some(Boolean)) {
      return;
    }

    setOcupado(true);
    try {
      await registrarse(nombre, correo, clave);
      router.replace('/verificar-correo');
    } catch (error: unknown) {
      setMensaje(mensajeErrorAuth(error));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <PantallaAuth
      titulo="Crear cuenta"
      descripcion="Registra tu nombre, correo y contraseña para Lectura Ágil."
      varianteVisual="aqua"
    >
      <EntradaEscalonada demora={0}>
        <CampoTexto
          autoCapitalize="words"
          autoComplete="name"
          editable={!ocupado}
          error={errores.nombre}
          etiqueta="Nombre"
          icono="A"
          onChangeText={(valor) => {
            setNombre(valor);
            setErrores((actuales) => ({ ...actuales, nombre: undefined }));
          }}
          placeholder="Nombre y apellido"
          tema="aqua"
          textContentType="name"
          value={nombre}
        />
      </EntradaEscalonada>
      <EntradaEscalonada demora={80}>
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
          }}
          placeholder="nombre@ejemplo.com"
          tema="aqua"
          textContentType="emailAddress"
          value={correo}
        />
      </EntradaEscalonada>
      <EntradaEscalonada demora={160}>
        <CampoTexto
          autoCapitalize="none"
          autoComplete="new-password"
          autoCorrect={false}
          editable={!ocupado}
          error={errores.clave}
          etiqueta="Contraseña"
          icono="◆"
          onChangeText={(valor) => {
            setClave(valor);
            setErrores((actuales) => ({
              ...actuales,
              clave: undefined,
              confirmacion: undefined,
            }));
          }}
          placeholder="Al menos 6 caracteres"
          secureTextEntry
          tema="aqua"
          textContentType="newPassword"
          value={clave}
        />
      </EntradaEscalonada>
      <EntradaEscalonada demora={200}>
        <IndicadorFortaleza clave={clave} tema="aqua" />
      </EntradaEscalonada>
      <EntradaEscalonada demora={240}>
        <CampoTexto
          autoCapitalize="none"
          autoComplete="new-password"
          autoCorrect={false}
          editable={!ocupado}
          error={errores.confirmacion}
          etiqueta="Confirmar contraseña"
          icono="◆"
          onChangeText={(valor) => {
            setConfirmacion(valor);
            setErrores((actuales) => ({
              ...actuales,
              confirmacion: undefined,
            }));
          }}
          placeholder="Repite la contraseña"
          secureTextEntry
          tema="aqua"
          textContentType="newPassword"
          value={confirmacion}
        />
      </EntradaEscalonada>
      {mensaje ? <Aviso tipo="error" tema="aqua">{mensaje}</Aviso> : null}
      <EntradaEscalonada demora={320}>
        <Boton
          alPresionar={() => void crearCuenta()}
          ocupado={ocupado}
          tema="aqua"
        >
          Crear cuenta
        </Boton>
      </EntradaEscalonada>
      <Link href="/login" asChild>
        <Text className="min-h-12 py-3 text-center font-semibold text-aqua-azul">
          Ya tengo una cuenta
        </Text>
      </Link>
    </PantallaAuth>
  );
}
