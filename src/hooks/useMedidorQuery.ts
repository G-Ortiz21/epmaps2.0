import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { ApiError } from '../api/client';
import { buscarMedidorRemoto } from '../api/medidoresApi';
import { mensajeErrorMedidor } from '../components/medidoresUi';
import { validarCodigoMedidor } from '../domain/validaciones';
import type { MedidorOficina } from '../domain/tipos';

/** Datos satisfactorios de una consulta de medidor. */
export interface ResultadoConsultaMedidor {
  medidor: MedidorOficina;
  consultadoEn: string;
}

/** Estado que las pantallas muestran al técnico tras interpretar la consulta. */
export type EstadoConsultaMedidor =
  | {
      estado: 'encontrado';
      medidor: MedidorOficina;
      origen: 'oficina' | 'cache_local';
      consultadoEn: string;
    }
  | { estado: 'sin_cache_sin_conexion'; codigo: string }
  | null;

export interface LecturaConsultaMedidor {
  resultado: EstadoConsultaMedidor;
  /** Error sin datos previos que mostrar (medidor inexistente, red, contrato). */
  error: string | null;
  /** Hay datos guardados, pero la última actualización con la oficina falló. */
  avisoActualizacion: string | null;
  cargando: boolean;
}

/**
 * Normaliza el código del medidor para la clave de caché y para la consulta
 * remota, sin alterar su significado: solo recorta espacios y unifica
 * mayúsculas, de forma coherente con la validación `/^MED-\d{6}$/`.
 */
export function normalizarCodigoMedidor(codigo: string): string {
  return codigo.trim().toUpperCase();
}

/**
 * Ejecuta la consulta remota de un medidor con su código ya normalizado.
 *
 * - Un código inválido lanza `TypeError` sin llegar a la red.
 * - Un medidor inexistente se informa como `ApiError('not_found')`, distinto
 *   de un error de red o de una respuesta que no cumple el contrato.
 * - Solo se devuelven resultados válidos: los errores se propagan y nunca se
 *   convierten en datos.
 */
export async function consultarMedidorRemotoValidado(
  codigoNormalizado: string,
): Promise<ResultadoConsultaMedidor> {
  const errorCodigo = validarCodigoMedidor(codigoNormalizado);
  if (errorCodigo !== null) {
    throw new TypeError(errorCodigo);
  }

  const resultado = await buscarMedidorRemoto(codigoNormalizado);
  if (resultado.estado === 'no_encontrado') {
    throw new ApiError('not_found', 'El medidor no existe en la oficina.', 404);
  }

  return {
    medidor: resultado.medidor,
    consultadoEn: new Date().toISOString(),
  };
}

/**
 * Consulta un medidor por su código mediante TanStack Query.
 *
 * - La clave es específica de cada código normalizado: dos medidores nunca
 *   comparten datos.
 * - Solo se emite una petición de red con conexión y con un código válido;
 *   un código inválido jamás llega al servidor.
 * - Los datos satisfactorios quedan en la caché del QueryClient, que a su vez
 *   se persiste en AsyncStorage, por lo que siguen disponibles sin conexión.
 * - Los errores se propagan como estado de error; nunca se guardan como si
 *   fueran resultados válidos. Si ya existían datos anteriores, se conservan.
 */
export function useMedidorQuery(
  codigo: string,
  hayConexion: boolean,
): UseQueryResult<ResultadoConsultaMedidor, Error> {
  const codigoNormalizado = normalizarCodigoMedidor(codigo);
  const codigoValido = validarCodigoMedidor(codigoNormalizado) === null;

  return useQuery({
    queryKey: ['medidor', codigoNormalizado],
    queryFn: () => consultarMedidorRemotoValidado(codigoNormalizado),
    enabled: codigoValido && hayConexion,
  });
}

interface ContextoInterpretacion {
  codigoNormalizado: string;
  codigoValido: boolean;
  enLinea: boolean;
  /** La caché persistida todavía se está restaurando. */
  restaurando: boolean;
}

/**
 * Traduce el estado de la consulta a los estados que las pantallas muestran
 * al técnico, distinguiendo entre:
 *
 * - medidor encontrado (de oficina o de caché local),
 * - sin conexión y sin datos guardados para ese código,
 * - error sin datos previos que mostrar,
 * - datos anteriores conservados tras una actualización fallida.
 *
 * Los datos de un código nunca se presentan bajo otro código: la clave de la
 * consulta ya los separa, y aquí solo se interpreta el resultado de esa clave.
 */
export function interpretarConsultaMedidor(
  consulta: Pick<
    UseQueryResult<ResultadoConsultaMedidor, Error>,
    'data' | 'error' | 'isError' | 'isPending' | 'isStale'
  >,
  contexto: ContextoInterpretacion,
): LecturaConsultaMedidor {
  const { codigoNormalizado, codigoValido, enLinea, restaurando } = contexto;

  if (!codigoValido) {
    return {
      resultado: null,
      error: null,
      avisoActualizacion: null,
      cargando: false,
    };
  }

  const error =
    consulta.isError && consulta.data === undefined
      ? mensajeErrorMedidor(consulta.error)
      : null;

  const avisoActualizacion =
    consulta.isError && consulta.data !== undefined
      ? 'No se pudo actualizar la información con la oficina. Se muestran los últimos datos guardados.'
      : null;

  if (consulta.data !== undefined) {
    return {
      resultado: {
        estado: 'encontrado',
        medidor: consulta.data.medidor,
        origen: enLinea && !consulta.isStale ? 'oficina' : 'cache_local',
        consultadoEn: consulta.data.consultadoEn,
      },
      error,
      avisoActualizacion,
      cargando: false,
    };
  }

  if (error !== null) {
    return {
      resultado: null,
      error,
      avisoActualizacion: null,
      cargando: false,
    };
  }

  // Sin conexión la consulta queda deshabilitada (pending + idle). Si no hay
  // datos persistidos para este código, se informa sin esperar a la red.
  if (!enLinea && !restaurando) {
    return {
      resultado: { estado: 'sin_cache_sin_conexion', codigo: codigoNormalizado },
      error: null,
      avisoActualizacion: null,
      cargando: false,
    };
  }

  return {
    resultado: null,
    error: null,
    avisoActualizacion: null,
    cargando: restaurando || (enLinea && consulta.isPending),
  };
}
