import {
  eliminarBorrador,
  obtenerBorrador,
} from '../data/repositories/borradorRepository';
import {
  crearLecturaLocal,
  LecturaDuplicadaError,
  obtenerLecturaPorMedidorYPeriodo,
} from '../data/repositories/lecturasRepository';
import { calcularConsumo } from '../domain/consumo';
import { crearPeriodoLocal } from '../domain/identidadLectura';
import { determinarEstadoVerificacion } from '../domain/reglasLectura';
import type {
  BorradorRegistro,
  CrearLecturaInput,
  DatosRegistroLectura,
  EstadoMedidor,
  LecturaLocal,
} from '../domain/tipos';
import {
  esBorradorRecuperable,
  validarCodigoMedidor,
  validarRegistro,
} from '../domain/validaciones';
import { eliminarFoto } from './fotoService';

/**
 * Caso de uso de guardado local de una lectura (R4). Usa el repositorio
 * existente: la identidad única por medidor y periodo (ADR-010) la
 * impone SQLite, y este servicio no duplica SQL ni reglas de dominio.
 */

/** El medidor ya tiene una lectura registrada en el periodo actual (R10). */
export class LecturaYaRegistradaError extends Error {
  constructor(medidorCodigo: string, periodo: string) {
    super(`Ya existe una lectura para ${medidorCodigo} en ${periodo}.`);
    this.name = 'LecturaYaRegistradaError';
  }
}

export interface GuardarLecturaParams {
  codigoMedidor: string;
  estadoMedidor: EstadoMedidor;
  datos: DatosRegistroLectura;
  tecnicoCodigo: string | null;
  /** Estado de conexión al guardar; define la verificación (ADR-014). */
  enLinea: boolean;
  /** Promedio mensual de los datos de oficina o caché del medidor. */
  promedioMensual: number | null;
  fechaRegistro?: Date;
}

/**
 * Guarda la lectura en la base local como `pendiente` de envío y borra
 * el borrador del asistente (ADR-004). No envía nada al servidor.
 */
export async function guardarLecturaLocal(
  params: GuardarLecturaParams,
): Promise<LecturaLocal> {
  const errorCodigo = validarCodigoMedidor(params.codigoMedidor);
  if (errorCodigo !== null) {
    throw new TypeError(errorCodigo);
  }

  const errores = validarRegistro(params.estadoMedidor, params.datos);
  if (Object.keys(errores).length > 0) {
    throw new TypeError(
      'La lectura tiene datos incompletos: ' + Object.values(errores).join(' '),
    );
  }

  const fechaRegistro = params.fechaRegistro ?? new Date();
  const lectura = convertirLectura(params.datos.lectura);
  const lecturaAnterior = params.datos.lecturaAnterior ?? null;

  const input: CrearLecturaInput = {
    medidorCodigo: params.codigoMedidor,
    estadoMedidor: params.estadoMedidor,
    lectura,
    lecturaAnterior,
    consumo: calcularConsumo(lectura, lecturaAnterior),
    promedioMensual: params.promedioMensual,
    consumoAnomalo: params.datos.consumoAnomalo ?? null,
    confirmacionAnomalia: params.datos.confirmacionAnomalia === true,
    motivo: params.datos.motivo ?? null,
    descripcion: params.datos.descripcion ?? null,
    fotoNombre: params.datos.fotoNombre ?? null,
    verificacion: determinarEstadoVerificacion({
      lectura,
      lecturaAnterior,
      enLinea: params.enLinea,
    }),
    tecnicoCodigo: params.tecnicoCodigo,
  };

  try {
    const guardada = await crearLecturaLocal(input, fechaRegistro);
    // Al guardar la lectura, el borrador del asistente se borra (ADR-004).
    await eliminarBorrador();
    return guardada;
  } catch (error: unknown) {
    if (error instanceof LecturaDuplicadaError) {
      throw new LecturaYaRegistradaError(
        params.codigoMedidor,
        crearPeriodoLocal(fechaRegistro),
      );
    }
    throw error;
  }
}

/**
 * Comprueba si el medidor ya tiene una lectura en el periodo actual,
 * para rechazar un segundo registro antes de entrar al asistente (R10).
 */
export async function existeLecturaEnPeriodo(
  codigoMedidor: string,
  fecha: Date = new Date(),
): Promise<boolean> {
  const lectura = await obtenerLecturaPorMedidorYPeriodo(
    codigoMedidor,
    crearPeriodoLocal(fecha),
  );
  return lectura !== null;
}

/** Convierte la lectura capturada (texto o número) a entero o null. */
function convertirLectura(lectura: DatosRegistroLectura['lectura']): number | null {
  if (lectura === null || lectura === undefined || lectura === '') {
    return null;
  }
  if (typeof lectura === 'number') {
    return lectura;
  }
  return Number(lectura);
}
