import { ApiError } from '../api/client';

export function mensajeErrorMedidor(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'No se pudo completar la consulta del medidor. Inténtalo de nuevo.';
  }

  switch (error.kind) {
    case 'not_found':
      return 'No se encontró el medidor en la oficina.';
    case 'network':
      return 'No se pudo conectar con la oficina. Revisa la conexión e inténtalo de nuevo.';
    case 'timeout':
      return 'La consulta tardó demasiado. Inténtalo de nuevo.';
    case 'http':
      return 'La oficina no pudo completar la consulta.';
    case 'invalid_json':
    case 'invalid_response':
      return 'La oficina devolvió datos que no cumplen el contrato esperado.';
  }
}
