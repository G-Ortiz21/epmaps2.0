import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  actualizarNombre as actualizarNombreAuth,
  cambiarClave as cambiarClaveAuth,
  cerrarSesion as cerrarSesionAuth,
  enviarCorreoRecuperacion as enviarCorreoRecuperacionAuth,
  iniciarSesion as iniciarSesionAuth,
  observarSesion,
  recargarUsuario as recargarUsuarioAuth,
  reenviarVerificacion as reenviarVerificacionAuth,
  registrarse as registrarseAuth,
  type UsuarioSesion,
} from '../services/authService';

export type EstadoSesion =
  | 'cargando'
  | 'no_autenticado'
  | 'sin_verificar'
  | 'autenticado';

interface ContextoSesion {
  estado: EstadoSesion;
  uid: string | null;
  email: string | null;
  nombre: string | null;
  tecnicoCodigo: string | null;
  iniciarSesion: (correo: string, clave: string) => Promise<void>;
  registrarse: (nombre: string, correo: string, clave: string) => Promise<void>;
  enviarCorreoRecuperacion: (correo: string) => Promise<void>;
  cambiarClave: (actual: string, nueva: string) => Promise<void>;
  actualizarNombre: (nombre: string) => Promise<void>;
  reenviarVerificacion: () => Promise<void>;
  recargarUsuario: () => Promise<boolean>;
  cerrarSesion: () => Promise<void>;
}

const SesionContext = createContext<ContextoSesion | null>(null);

export function SesionProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoSesion>('cargando');
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);

  const actualizarUsuario = useCallback(
    (usuarioActual: UsuarioSesion | null): void => {
      setUsuario(usuarioActual);
      setEstado(
        usuarioActual === null
          ? 'no_autenticado'
          : usuarioActual.emailVerificado
            ? 'autenticado'
            : 'sin_verificar',
      );
    },
    [],
  );

  const recargarUsuario = useCallback(async (): Promise<boolean> => {
    const usuarioActual = await recargarUsuarioAuth();
    actualizarUsuario(usuarioActual);
    return usuarioActual?.emailVerificado ?? false;
  }, [actualizarUsuario]);

  const actualizarNombre = useCallback(
    async (nombre: string): Promise<void> => {
      const usuarioActualizado = await actualizarNombreAuth(nombre);
      actualizarUsuario(usuarioActualizado);
    },
    [actualizarUsuario],
  );

  useEffect(() => {
    let vigente = true;

    const cancelar = observarSesion(
      (usuarioActual) => {
        if (!vigente) {
          return;
        }

        actualizarUsuario(usuarioActual);
      },
      (error) => {
        if (!vigente) {
          return;
        }

        console.error('No se pudo restaurar la sesión de Firebase:', error);
        setUsuario(null);
        setEstado('no_autenticado');
      },
    );

    return () => {
      vigente = false;
      cancelar();
    };
  }, [actualizarUsuario]);

  const valor = useMemo<ContextoSesion>(
    () => ({
      estado,
      uid: usuario?.uid ?? null,
      email: usuario?.email ?? null,
      nombre: usuario?.nombre ?? null,
      tecnicoCodigo: usuario?.uid ?? null,
      iniciarSesion: iniciarSesionAuth,
      registrarse: registrarseAuth,
      enviarCorreoRecuperacion: enviarCorreoRecuperacionAuth,
      cambiarClave: cambiarClaveAuth,
      actualizarNombre,
      reenviarVerificacion: reenviarVerificacionAuth,
      recargarUsuario,
      cerrarSesion: cerrarSesionAuth,
    }),
    [actualizarNombre, estado, recargarUsuario, usuario],
  );

  return (
    <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>
  );
}

export function useSesion(): ContextoSesion {
  const context = useContext(SesionContext);
  if (context === null) {
    throw new Error('useSesion debe utilizarse dentro de SesionProvider.');
  }

  return context;
}
