import { useState } from 'react';
import { Link } from 'expo-router';
import { Text } from 'react-native';

import { Aviso } from '../../components/ui/Aviso';
import { Boton } from '../../components/ui/Boton';
import { CampoTexto } from '../../components/ui/CampoTexto';
import { IndicadorFortaleza } from '../../components/ui/IndicadorFortaleza';
import { PantallaAuth } from '../../components/ui/PantallaAuth';
import { useSesion } from '../../contexts/SesionContext';
import {
  validarClaveAuth,
  validarConfirmacionClaveAuth,
} from '../../domain/validacionesAuth';
import { mensajeErrorAuth } from '../../services/erroresAuth';

export default function CambiarClaveScreen() {
  const { cambiarClave } = useSesion();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [errores, setErrores] = useState<{
    actual?: string;
    nueva?: string;
    confirmacion?: string;
  }>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function guardar(): Promise<void> {
    const nuevosErrores = {
      actual: actual.length === 0 ? 'Ingresa tu contraseña actual.' : undefined,
      nueva: validarClaveAuth(nueva) ?? undefined,
      confirmacion:
        validarConfirmacionClaveAuth(nueva, confirmacion) ?? undefined,
    };
    setErrores(nuevosErrores);
    setMensaje(null);
    setError(null);

    if (Object.values(nuevosErrores).some(Boolean)) {
      return;
    }

    setOcupado(true);
    try {
      await cambiarClave(actual, nueva);
      setActual('');
      setNueva('');
      setConfirmacion('');
      setMensaje('La contraseña se cambió correctamente.');
    } catch (errorAuth: unknown) {
      setError(mensajeErrorAuth(errorAuth));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <PantallaAuth
      titulo="Cambiar contraseña"
      descripcion="Confirma tu contraseña actual antes de elegir una nueva."
      varianteVisual="aqua"
    >
      <CampoTexto
        autoCapitalize="none"
        autoComplete="current-password"
        autoCorrect={false}
        editable={!ocupado}
        error={errores.actual}
        etiqueta="Contraseña actual"
        icono="◆"
        onChangeText={(valor) => {
          setActual(valor);
          setErrores((actuales) => ({ ...actuales, actual: undefined }));
        }}
        placeholder="Contraseña actual"
        secureTextEntry
        tema="aqua"
        textContentType="password"
        value={actual}
      />
      <CampoTexto
        autoCapitalize="none"
        autoComplete="new-password"
        autoCorrect={false}
        editable={!ocupado}
        error={errores.nueva}
        etiqueta="Nueva contraseña"
        icono="◆"
        onChangeText={(valor) => {
          setNueva(valor);
          setErrores((actuales) => ({
            ...actuales,
            nueva: undefined,
            confirmacion: undefined,
          }));
        }}
        placeholder="Al menos 6 caracteres"
        secureTextEntry
        tema="aqua"
        textContentType="newPassword"
        value={nueva}
      />
      <IndicadorFortaleza clave={nueva} tema="aqua" />
      <CampoTexto
        autoCapitalize="none"
        autoComplete="new-password"
        autoCorrect={false}
        editable={!ocupado}
        error={errores.confirmacion}
        etiqueta="Confirmar nueva contraseña"
        icono="◆"
        onChangeText={(valor) => {
          setConfirmacion(valor);
          setErrores((actuales) => ({
            ...actuales,
            confirmacion: undefined,
          }));
        }}
        placeholder="Repite la nueva contraseña"
        secureTextEntry
        tema="aqua"
        textContentType="newPassword"
        value={confirmacion}
      />
      {error ? <Aviso tipo="error" tema="aqua">{error}</Aviso> : null}
      {mensaje ? <Aviso tipo="exito" tema="aqua">{mensaje}</Aviso> : null}
      <Boton alPresionar={() => void guardar()} ocupado={ocupado} tema="aqua">
        Guardar contraseña
      </Boton>
      <Link href="/inicio" asChild>
        <Text className="min-h-12 py-3 text-center font-semibold text-aqua-azul">
          Volver al inicio
        </Text>
      </Link>
    </PantallaAuth>
  );
}
