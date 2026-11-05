import { API_RESOURCES } from '../config';
import { ApiError, getJson } from './client';
import type { MedidorOficina } from '../domain/tipos';
import { parsearMedidorOficina } from '../domain/validaciones';

export type ResultadoBusquedaRemota =
  | { estado: 'no_encontrado' }
  | { estado: 'encontrado'; medidor: MedidorOficina };

export async function buscarMedidorRemoto(
  codigo: string,
): Promise<ResultadoBusquedaRemota> {
  const response = await getJson(API_RESOURCES.medidores, { codigo });

  if (!Array.isArray(response)) {
    throw new ApiError(
      'invalid_response',
      'La respuesta de medidores no tiene el formato de colección esperado.',
    );
  }

  if (response.length === 0) {
    return { estado: 'no_encontrado' };
  }

  const coincidencias = response.filter((item) => {
    if (!esObjetoRegistro(item) || typeof item.codigo !== 'string') {
      throw new ApiError(
        'invalid_response',
        'La respuesta de medidores contiene un registro malformado.',
      );
    }

    return item.codigo === codigo;
  });

  if (coincidencias.length === 0) {
    return { estado: 'no_encontrado' };
  }
  if (coincidencias.length > 1) {
    throw new ApiError(
      'invalid_response',
      'La oficina devolvió más de un registro para el mismo medidor.',
    );
  }

  const medidor = parsearMedidorOficina(coincidencias[0]);
  if (medidor === null) {
    throw new ApiError(
      'invalid_response',
      'La respuesta del medidor no cumple el contrato acordado.',
    );
  }

  return { estado: 'encontrado', medidor };
}

function esObjetoRegistro(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}