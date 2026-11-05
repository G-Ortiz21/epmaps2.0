export function validarNombre(nombre: string): string | null {
  if (nombre.trim().length === 0) {
    return 'Ingresa tu nombre.';
  }

  return null;
}

export const validarNombreAuth = validarNombre;

export function validarCorreoAuth(correo: string): string | null {
  const correoNormalizado = correo.trim();

  if (correoNormalizado.length === 0) {
    return 'Ingresa tu correo electrónico.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoNormalizado)) {
    return 'Ingresa un correo electrónico válido.';
  }

  return null;
}

export function validarClaveAuth(clave: string): string | null {
  if (clave.length === 0) {
    return 'Ingresa tu contraseña.';
  }

  if (clave.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }

  return null;
}

export function validarConfirmacionClaveAuth(
  clave: string,
  confirmacion: string,
): string | null {
  if (confirmacion.length === 0) {
    return 'Confirma tu contraseña.';
  }

  if (clave !== confirmacion) {
    return 'Las contraseñas no coinciden.';
  }

  return null;
}
