import type { UbicacionLectura } from './tipos';

export const UMBRAL_PRECISION_GPS_METROS = 50;

export function validarUbicacion(value: unknown): value is UbicacionLectura {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const ubicacion = value as Record<string, unknown>;
  if (
    typeof ubicacion.latitud !== 'number' ||
    !Number.isFinite(ubicacion.latitud) ||
    ubicacion.latitud < -90 ||
    ubicacion.latitud > 90 ||
    typeof ubicacion.longitud !== 'number' ||
    !Number.isFinite(ubicacion.longitud) ||
    ubicacion.longitud < -180 ||
    ubicacion.longitud > 180
  ) {
    return false;
  }

  if (ubicacion.origenUbicacion === 'manual') {
    return ubicacion.precisionGps === null;
  }

  return (
    ubicacion.origenUbicacion === 'gps' &&
    typeof ubicacion.precisionGps === 'number' &&
    Number.isFinite(ubicacion.precisionGps) &&
    ubicacion.precisionGps >= 0 &&
    ubicacion.precisionGps <= UMBRAL_PRECISION_GPS_METROS
  );
}

export function crearUbicacionManual(
  latitud: number,
  longitud: number,
): UbicacionLectura {
  const ubicacion: UbicacionLectura = {
    latitud,
    longitud,
    origenUbicacion: 'manual',
    precisionGps: null,
  };

  if (!validarUbicacion(ubicacion)) {
    throw new RangeError('Las coordenadas manuales no son válidas.');
  }

  return ubicacion;
}