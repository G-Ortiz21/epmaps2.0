import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reload,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  type Unsubscribe,
} from 'firebase/auth';

import { auth } from '../lib/firebase';
import { ErrorAuthAplicacion, obtenerCodigoErrorAuth } from './erroresAuth';

export interface UsuarioSesion {
  uid: string;
  email: string | null;
  nombre: string | null;
  emailVerificado: boolean;
}

function crearUsuarioSesion(
  usuario: NonNullable<typeof auth.currentUser>,
): UsuarioSesion {
  return {
    uid: usuario.uid,
    email: usuario.email,
    nombre: usuario.displayName,
    emailVerificado: usuario.emailVerified,
  };
}

export function observarSesion(
  alCambiar: (usuario: UsuarioSesion | null) => void,
  alFallar: (error: Error) => void,
): Unsubscribe {
  return onAuthStateChanged(
    auth,
    (usuario) => {
      alCambiar(usuario === null ? null : crearUsuarioSesion(usuario));
    },
    alFallar,
  );
}

export async function iniciarSesion(
  correo: string,
  clave: string,
): Promise<void> {
  const { user } = await signInWithEmailAndPassword(
    auth,
    correo.trim().toLowerCase(),
    clave,
  );

  if (!user.emailVerified) {
    throw new ErrorAuthAplicacion(
      'auth/email-not-verified',
      'Debes verificar tu correo para acceder.',
    );
  }
}

export async function registrarse(
  nombre: string,
  correo: string,
  clave: string,
): Promise<void> {
  const { user } = await createUserWithEmailAndPassword(
    auth,
    correo.trim().toLowerCase(),
    clave,
  );

  await updateProfile(user, { displayName: nombre.trim() });
  await sendEmailVerification(user);
}

export async function reenviarVerificacion(): Promise<void> {
  const usuario = auth.currentUser;

  if (usuario === null) {
    throw new ErrorAuthAplicacion(
      'auth/session-unavailable',
      'No hay una sesión activa. Inicia sesión nuevamente.',
    );
  }

  if (usuario.emailVerified) {
    throw new ErrorAuthAplicacion(
      'auth/email-already-verified',
      'Este correo ya está verificado.',
    );
  }

  await sendEmailVerification(usuario);
}

export async function recargarUsuario(): Promise<UsuarioSesion | null> {
  const usuario = auth.currentUser;

  if (usuario === null) {
    return null;
  }

  await reload(usuario);

  const usuarioActualizado = auth.currentUser;
  return usuarioActualizado === null
    ? null
    : crearUsuarioSesion(usuarioActualizado);
}

export async function enviarCorreoRecuperacion(
  correo: string,
): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, correo.trim().toLowerCase());
  } catch (error: unknown) {
    if (obtenerCodigoErrorAuth(error) === 'auth/user-not-found') {
      return;
    }

    throw error;
  }
}

export async function cambiarClave(
  claveActual: string,
  claveNueva: string,
): Promise<void> {
  const usuario = auth.currentUser;

  if (usuario === null) {
    throw new ErrorAuthAplicacion(
      'auth/session-unavailable',
      'No hay una sesión activa. Inicia sesión nuevamente.',
    );
  }

  if (usuario.email === null) {
    throw new ErrorAuthAplicacion(
      'auth/email-unavailable',
      'La cuenta activa no tiene un correo para reautenticarse.',
    );
  }

  const credencial = EmailAuthProvider.credential(usuario.email, claveActual);
  await reauthenticateWithCredential(usuario, credencial);
  await updatePassword(usuario, claveNueva);
}

export async function actualizarNombre(
  nombre: string,
): Promise<UsuarioSesion> {
  const usuario = auth.currentUser;

  if (usuario === null) {
    throw new ErrorAuthAplicacion(
      'auth/session-unavailable',
      'No hay una sesión activa. Inicia sesión nuevamente.',
    );
  }

  const nombreActualizado = nombre.trim();
  await updateProfile(usuario, { displayName: nombreActualizado });

  return {
    ...crearUsuarioSesion(usuario),
    nombre: nombreActualizado,
  };
}

export async function cerrarSesion(): Promise<void> {
  await signOut(auth);
}
