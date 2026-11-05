import type { EstadoMedidor, EstadoVerificacion } from './tipos';

export function requiereFoto(
  estado: EstadoMedidor,
  consumoAnomalo: boolean | null,
): boolean {
  return estado === 'danado' || consumoAnomalo === true;
}

export interface DatosVerificacion {
  lectura: number | null;
  lecturaAnterior: number | null;
  enLinea: boolean;
}

export function determinarEstadoVerificacion({
  lectura,
  lecturaAnterior,
  enLinea,
}: DatosVerificacion): EstadoVerificacion {
  if (lectura === null) {
    return 'verificada';
  }

  if (!enLinea || lecturaAnterior === null) {
    return 'pendiente_verificar';
  }

  return 'verificada';
}