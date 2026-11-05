import { useState } from 'react';
import { Link } from 'expo-router';
import { Text } from 'react-native';

import { Aviso } from '../../components/ui/Aviso';
import { Boton } from '../../components/ui/Boton';
import { CampoTexto } from '../../components/ui/CampoTexto';
import { PantallaAuth } from '../../components/ui/PantallaAuth';
import { useSesion } from '../../contexts/SesionContext';
import { validarNombre } from '../../domain/validacionesAuth';
import { mensajeErrorAuth } from '../../services/erroresAuth';

export default function PerfilScreen() {
  const { nombre, actualizarNombre } = useSesion();
  const [nombreEditado, setNombreEditado] = useState(nombre ?? '');
  const [errorNombre, setErrorNombre] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function guardarNombre(): Promise<void> {
    const nuevoError = validarNombre(nombreEditado) ?? undefined;
    setErrorNombre(nuevoError);
    setError(null);
    setMensaje(null);

    if (nuevoError) {
      return;
    }

    setOcupado(true);
    try {
      await actualizarNombre(nombreEditado);
      setMensaje('El nombre se actualizó correctamente.');
    } catch (errorAuth: unknown) {
      setError(mensajeErrorAuth(errorAuth));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <PantallaAuth
      titulo="Editar nombre"
      descripcion="Actualiza el nombre que se muestra en tu sesión."
      varianteVisual="aqua"
    >
      <CampoTexto
        autoCapitalize="words"
        autoComplete="name"
        editable={!ocupado}
        error={errorNombre}
        etiqueta="Nombre"
        icono="A"
        onChangeText={(valor) => {
          setNombreEditado(valor);
          setErrorNombre(undefined);
          setError(null);
          setMensaje(null);
        }}
        onSubmitEditing={() => void guardarNombre()}
        placeholder="Nombre y apellido"
        returnKeyType="done"
        tema="aqua"
        textContentType="name"
        value={nombreEditado}
      />
      {error ? <Aviso tipo="error" tema="aqua">{error}</Aviso> : null}
      {mensaje ? <Aviso tipo="exito" tema="aqua">{mensaje}</Aviso> : null}
      <Boton
        alPresionar={() => void guardarNombre()}
        ocupado={ocupado}
        tema="aqua"
      >
        Guardar nombre
      </Boton>
      <Link href="/inicio" asChild>
        <Text className="min-h-12 py-3 text-center font-semibold text-aqua-azul">
          Volver al inicio
        </Text>
      </Link>
    </PantallaAuth>
  );
}
