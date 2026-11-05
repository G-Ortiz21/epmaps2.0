import { useState } from 'react';
import { Link } from 'expo-router';
import { Text } from 'react-native';

import { Aviso } from '../../components/ui/Aviso';
import { Boton } from '../../components/ui/Boton';
import { CampoTexto } from '../../components/ui/CampoTexto';
import { PantallaAuth } from '../../components/ui/PantallaAuth';
import { useSesion } from '../../contexts/SesionContext';
import { validarCorreoAuth } from '../../domain/validacionesAuth';
import { mensajeErrorAuth } from '../../services/erroresAuth';

export default function RecuperarScreen() {
  const { enviarCorreoRecuperacion } = useSesion();
  const [correo, setCorreo] = useState('');
  const [errorCorreo, setErrorCorreo] = useState<string | undefined>();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function enviar(): Promise<void> {
    const nuevoError = validarCorreoAuth(correo) ?? undefined;
    setErrorCorreo(nuevoError);
    setError(null);
    setMensaje(null);

    if (nuevoError) {
      return;
    }

    setOcupado(true);
    try {
      await enviarCorreoRecuperacion(correo);
      setMensaje(
        'Si el correo está asociado a una cuenta, recibirás instrucciones para restablecer la contraseña.',
      );
    } catch (errorAuth: unknown) {
      setError(mensajeErrorAuth(errorAuth));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <PantallaAuth
      titulo="Recuperar contraseña"
      descripcion="Te enviaremos instrucciones al correo que indiques."
      varianteVisual="aqua"
    >
      <CampoTexto
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        editable={!ocupado}
        error={errorCorreo}
        etiqueta="Correo electrónico"
        icono="@"
        keyboardType="email-address"
        onChangeText={(valor) => {
          setCorreo(valor);
          setErrorCorreo(undefined);
          setMensaje(null);
          setError(null);
        }}
        onSubmitEditing={() => void enviar()}
        placeholder="nombre@ejemplo.com"
        returnKeyType="send"
        tema="aqua"
        textContentType="emailAddress"
        value={correo}
      />
      {error ? <Aviso tipo="error" tema="aqua">{error}</Aviso> : null}
      {mensaje ? (
        <Aviso tipo="informacion" tema="aqua">
          {mensaje}
        </Aviso>
      ) : null}
      <Boton alPresionar={() => void enviar()} ocupado={ocupado} tema="aqua">
        Enviar instrucciones
      </Boton>
      <Link href="/login" asChild>
        <Text className="min-h-12 py-3 text-center font-semibold text-aqua-azul">
          Volver al inicio de sesión
        </Text>
      </Link>
    </PantallaAuth>
  );
}
