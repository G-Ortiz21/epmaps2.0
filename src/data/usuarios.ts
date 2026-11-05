/**
 * Usuarios fijos de la aplicación (ADR-012).
 *
 * En esta prueba no hay gestión de usuarios ni servidor de autenticación:
 * el técnico se identifica contra estos datos locales incluidos en el
 * código. Este archivo es la única fuente autorizada de credenciales.
 * La clave se usa únicamente para compararla en el dispositivo y nunca
 * se guarda en el almacén seguro ni en SQLite.
 */
export interface CredencialesTecnico {
  /** Código de empleado. Es la identidad de la sesión y del registro. */
  codigo: string;
  /** Clave del técnico. Solo se compara; no se persiste. */
  clave: string;
}

/** Técnico de prueba autorizado para las demostraciones en campo. */
export const USUARIOS_PRUEBA: readonly CredencialesTecnico[] = [
  { codigo: 'TEC-0001', clave: 'lectura2026' },
];
