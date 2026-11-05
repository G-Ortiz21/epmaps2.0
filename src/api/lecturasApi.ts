
import { API_RESOURCES } from '../config';
import type { LecturaLocal, UbicacionLectura } from '../domain/tipos';
import { validarUbicacion } from '../domain/ubicacion';
import { ApiError, getJson, postJson } from './client';

export interface LecturaRemota {
  id: string;
  claveUnica: string;
  medidorCodigo: string;
  periodo: string;
  ubicacion: UbicacionLectura | null;
}

function parsearLecturaRemota(valor: unknown): LecturaRemota {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) {
    throw new ApiError(
      'invalid_response',
      'La respuesta de lecturas contiene un registro malformado.',
    );
  }

  const registro = valor as Record<string, unknown>;
  const id =
    typeof registro.id === 'string' || typeof registro.id === 'number'
      ? String(registro.id)
      : '';
  const camposUbicacion = [
    'latitud',
    'longitud',
    'origenUbicacion',
    'precisionGps',
  ] as const;
  const tieneUbicacion = camposUbicacion.some((campo) =>
    Object.prototype.hasOwnProperty.call(registro, campo),
  );
  const todosNulos = camposUbicacion.every((campo) => registro[campo] === null);

  if (
    id.length === 0 ||
    typeof registro.claveUnica !== 'string' ||
    typeof registro.medidorCodigo !== 'string' ||
    typeof registro.periodo !== 'string'
  ) {
    throw new ApiError(
      'invalid_response',
      'La respuesta de lecturas no cumple el contrato esperado.',
    );
  }

  let ubicacion: UbicacionLectura | null = null;
  if (tieneUbicacion && !todosNulos) {
    const candidata: unknown = {
      latitud: registro.latitud,
      longitud: registro.longitud,
      origenUbicacion: registro.origenUbicacion,
      precisionGps: registro.precisionGps,
    };
    if (!validarUbicacion(candidata)) {
      throw new ApiError(
        'invalid_response',
        'La respuesta de lecturas contiene una ubicación inválida o incompleta.',
      );
    }
    ubicacion = candidata;
  }

  return {
    id,
    claveUnica: registro.claveUnica,
    medidorCodigo: registro.medidorCodigo,
    periodo: registro.periodo,
    ubicacion,
  };
}

export function coincideUbicacionRemota(
  lectura: Pick<LecturaLocal, 'ubicacion'>,
  remota: LecturaRemota,
): boolean {
  const local = lectura.ubicacion;
  const registrada = remota.ubicacion;
  if (local === null || registrada === null) {
    return local === registrada;
  }

  return (
    local.latitud === registrada.latitud &&
    local.longitud === registrada.longitud &&
    local.origenUbicacion === registrada.origenUbicacion &&
    local.precisionGps === registrada.precisionGps
  );
}

export async function buscarLecturaRemotaPorClave(
  claveUnica: string,
): Promise<LecturaRemota | null> {
  const resultado = await getJson(API_RESOURCES.lecturas, { claveUnica });

  if (!Array.isArray(resultado)) {
    throw new ApiError(
      'invalid_response',
      'La oficina no devolvió una lista válida de lecturas.',
    );
  }

  const lecturas = resultado.map(parsearLecturaRemota);
  const coincidencias = lecturas.filter((item) => item.claveUnica === claveUnica);

  if (coincidencias.length > 1) {
    throw new ApiError(
      'invalid_response',
      `Hay varias lecturas remotas con la clave ${claveUnica}.`,
    );
  }

  return coincidencias[0] ?? null;
}

export async function crearLecturaRemota(
  lectura: LecturaLocal,
): Promise<LecturaRemota> {
  const payload = {
    claveUnica: lectura.claveUnica,
    medidorCodigo: lectura.medidorCodigo,
    periodo: lectura.periodo,
    estadoMedidor: lectura.estadoMedidor,
    lectura: lectura.lectura,
    lecturaAnterior: lectura.lecturaAnterior,
    consumo: lectura.consumo,
    promedioMensual: lectura.promedioMensual,
    consumoAnomalo: lectura.consumoAnomalo,
    confirmacionAnomalia: lectura.confirmacionAnomalia,
    motivo: lectura.motivo,
    descripcion: lectura.descripcion,
    fotoNombre: lectura.fotoNombre,
    latitud: lectura.ubicacion?.latitud ?? null,
    longitud: lectura.ubicacion?.longitud ?? null,
    origenUbicacion: lectura.ubicacion?.origenUbicacion ?? null,
    precisionGps: lectura.ubicacion?.precisionGps ?? null,
    verificacion: lectura.verificacion,
    tecnicoCodigo: lectura.tecnicoCodigo,
    creadoEn: lectura.creadoEn,
  };

  const creada = parsearLecturaRemota(
    await postJson(API_RESOURCES.lecturas, payload),
  );

  if (creada.claveUnica !== lectura.claveUnica) {
    throw new ApiError(
      'invalid_response',
      'La oficina no confirmó correctamente la lectura creada.',
    );
  }

  if (!coincideUbicacionRemota(lectura, creada)) {
    throw new ApiError(
      'invalid_response',
      'La oficina no conservó correctamente la ubicación de la lectura.',
    );
  }

  return creada;
}
