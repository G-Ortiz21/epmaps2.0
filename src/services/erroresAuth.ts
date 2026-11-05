export class ErrorAuthAplicacion extends Error {
  constructor(
    readonly codigo: string,
    message: string,
  ) {
    super(message);
    this.name = 'ErrorAuthAplicacion';
  }
}

export function obtenerCodigoErrorAuth(error: unknown): string | null {
  if (error instanceof ErrorAuthAplicacion) {
    return error.codigo;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return error.code;
  }

  return null;
}

export function mensajeErrorAuth(error: unknown): string {
  if (error instanceof ErrorAuthAplicacion) {
    return error.message;
  }

  switch (obtenerCodigoErrorAuth(error)) {
    case 'auth/invalid-email':
      return 'El correo electrónico no tiene un formato válido.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'El correo o la contraseña no coinciden.';
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con ese correo electrónico.';
    case 'auth/weak-password':
      return 'La contraseña no cumple los requisitos mínimos.';
    case 'auth/too-many-requests':
      return 'Se realizaron demasiados intentos. Espera un momento y vuelve a intentarlo.';
    case 'auth/network-request-failed':
      return 'No se pudo conectar. Comprueba tu conexión e inténtalo nuevamente.';
    case 'auth/requires-recent-login':
      return 'Vuelve a iniciar sesión antes de realizar esta acción.';
    case 'auth/user-disabled':
      return 'Esta cuenta está deshabilitada. Contacta al administrador.';
    case 'auth/operation-not-allowed':
      return 'Este método de acceso no está habilitado en Firebase.';
    case 'auth/email-not-verified':
      return 'Verifica tu correo electrónico antes de acceder.';
    case 'auth/email-already-verified':
      return 'Este correo ya está verificado.';
    case 'auth/invalid-user-token':
    case 'auth/user-token-expired':
      return 'La sesión expiró. Inicia sesión nuevamente.';
    case 'auth/session-unavailable':
      return 'No hay una sesión activa. Inicia sesión nuevamente.';
    case 'auth/email-unavailable':
      return 'La cuenta activa no tiene un correo para reautenticarse.';
    default:
      return 'No se pudo completar la operación. Inténtalo nuevamente.';
  }
}
