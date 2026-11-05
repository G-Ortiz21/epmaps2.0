import * as Location from 'expo-location';
import type { UbicacionLectura } from '../domain/tipos';
import {
  UMBRAL_PRECISION_GPS_METROS,
  validarUbicacion,
} from '../domain/ubicacion';

export type CodigoErrorUbicacion =
  | 'permiso_denegado'
  | 'servicios_desactivados'
  | 'tiempo_agotado'
  | 'precision_insuficiente'
  | 'posicion_invalida'
  | 'captura_fallida';

export class ErrorUbicacion extends Error {
  constructor(
    readonly codigo: CodigoErrorUbicacion,
    message: string,
    readonly precisionGps: number | null = null,
  ) {
    super(message);
    this.name = 'ErrorUbicacion';
  }
}

export type ProveedorUbicacion = Pick<
  typeof Location,
  | 'Accuracy'
  | 'requestForegroundPermissionsAsync'
  | 'hasServicesEnabledAsync'
  | 'getCurrentPositionAsync'
>;

const TIEMPO_MAXIMO_CAPTURA_MS = 20_000;

export async function capturarUbicacionGPS(
  proveedor: ProveedorUbicacion = Location,
  tiempoMaximoMs = TIEMPO_MAXIMO_CAPTURA_MS,
): Promise<UbicacionLectura> {
  let permiso: Awaited<
    ReturnType<ProveedorUbicacion['requestForegroundPermissionsAsync']>
  >;

  try {
    permiso = await proveedor.requestForegroundPermissionsAsync();
  } catch {
    throw new ErrorUbicacion(
      'captura_fallida',
      'No se pudo consultar el permiso de ubicación.',
    );
  }

  if (!permiso.granted) {
    throw new ErrorUbicacion(
      'permiso_denegado',
      'Se denegó el permiso de ubicación. Puedes seleccionar el punto manualmente.',
    );
  }

  let serviciosActivos: boolean;
  try {
    serviciosActivos = await proveedor.hasServicesEnabledAsync();
  } catch {
    throw new ErrorUbicacion(
      'captura_fallida',
      'No se pudo comprobar si la ubicación del dispositivo está activada.',
    );
  }

  if (!serviciosActivos) {
    throw new ErrorUbicacion(
      'servicios_desactivados',
      'Activa la ubicación del dispositivo o selecciona el punto manualmente.',
    );
  }

  let temporizador: ReturnType<typeof setTimeout> | null = null;
  try {
    const posicion = await Promise.race([
      proveedor.getCurrentPositionAsync({
        accuracy: proveedor.Accuracy.High,
        mayShowUserSettingsDialog: true,
      }),
      new Promise<never>((_, reject) => {
        temporizador = setTimeout(
          () =>
            reject(
              new ErrorUbicacion(
                'tiempo_agotado',
                'La búsqueda GPS tardó demasiado. Inténtalo otra vez o selecciona el punto manualmente.',
              ),
            ),
          tiempoMaximoMs,
        );
      }),
    ]);

    const precisionGps = posicion.coords.accuracy;
    const ubicacion: unknown = {
      latitud: posicion.coords.latitude,
      longitud: posicion.coords.longitude,
      origenUbicacion: 'gps',
      precisionGps,
    };

    if (!validarUbicacion(ubicacion)) {
      if (
        typeof precisionGps === 'number' &&
        Number.isFinite(precisionGps) &&
        precisionGps > UMBRAL_PRECISION_GPS_METROS
      ) {
        throw new ErrorUbicacion(
          'precision_insuficiente',
          `La precisión GPS es de ${Math.round(precisionGps)} m. Reintenta o ajusta el punto en el mapa.`,
          precisionGps,
        );
      }

      throw new ErrorUbicacion(
        'posicion_invalida',
        'El dispositivo devolvió una posición incompleta o inválida.',
      );
    }

    return ubicacion;
  } catch (error: unknown) {
    if (error instanceof ErrorUbicacion) {
      throw error;
    }

    throw new ErrorUbicacion(
      'captura_fallida',
      'No se pudo obtener la posición GPS. Inténtalo otra vez o selecciona el punto manualmente.',
    );
  } finally {
    if (temporizador !== null) {
      clearTimeout(temporizador);
    }
  }
}