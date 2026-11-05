
import {
  actualizarEstadoSincronizacion,
  obtenerLecturasPendientesSincronizacion,
} from '../data/repositories/lecturasRepository';

import {
  buscarLecturaRemotaPorClave,
  crearLecturaRemota,
} from '../api/lecturasApi';

import type { LecturaLocal } from '../domain/tipos';

export interface ResultadoSincronizacion {
  enviadas: number;
  errores: number;
}

let sincronizacionEnCurso = false;

export async function sincronizarLecturasPendientes():
  Promise<ResultadoSincronizacion> {
  if (sincronizacionEnCurso) {
    return { enviadas: 0, errores: 0 };
  }

  sincronizacionEnCurso = true;

  const resultado: ResultadoSincronizacion = {
    enviadas: 0,
    errores: 0,
  };

  try {
    const pendientes = await obtenerLecturasPendientesSincronizacion();

    for (const lectura of pendientes) {
      try {
        await sincronizarUnaLectura(lectura);
        resultado.enviadas += 1;
      } catch (error: unknown) {
        resultado.errores += 1;

        const mensaje =
          error instanceof Error
            ? error.message
            : 'Error desconocido al sincronizar la lectura.';

        try {
          await actualizarEstadoSincronizacion(
            lectura.claveUnica,
            {
              estado: 'error',
              ultimoError: mensaje,
            },
          );
        } catch (errorEstado: unknown) {
          console.error(
            `No se pudo actualizar el estado de ${lectura.claveUnica}:`,
            errorEstado,
          );
        }
      }
    }

    return resultado;
  } finally {
    sincronizacionEnCurso = false;
  }
}

async function sincronizarUnaLectura(
  lectura: LecturaLocal,
): Promise<void> {
  await actualizarEstadoSincronizacion(lectura.claveUnica, {
    estado: 'enviando',
    ultimoError: null,
    registrarIntento: true,
  });

  // Si el servidor ya la recibió en un intento anterior,
  // recuperamos su ID en vez de crear otra.
  const existente = await buscarLecturaRemotaPorClave(
    lectura.claveUnica,
  );

  const remota =
    existente ?? (await crearLecturaRemota(lectura));

  await actualizarEstadoSincronizacion(lectura.claveUnica, {
    estado: 'enviada',
    remoteId: remota.id,
    ultimoError: null,
  });
}
