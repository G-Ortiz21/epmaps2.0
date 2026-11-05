import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { crearClaveUnica, crearPeriodoLocal } from '../domain/identidadLectura';

/**
 * Captura y persistencia de la fotografía de la lectura (ADR-007 y
 * ADR-008). La foto se copia al directorio de documentos de la app, en la
 * subcarpeta `lecturas`, con el nombre derivado de la clave de la
 * lectura. En SQLite solo se almacena el nombre del archivo; la ruta se
 * reconstruye al leer.
 */

export class PermisoCamaraDenegadoError extends Error {
  constructor() {
    super('La aplicación no tiene permiso para usar la cámara.');
    this.name = 'PermisoCamaraDenegadoError';
  }
}

export class CamaraNoDisponibleError extends Error {
  constructor() {
    super('No se encontró una cámara disponible en el dispositivo.');
    this.name = 'CamaraNoDisponibleError';
  }
}

const CARPETA_FOTOS = 'lecturas';
const EXTENSION_FOTO = '.jpg';

/**
 * Nombre persistido de la fotografía de una lectura: deriva de la clave
 * negocio medidor + periodo (ADR-010).
 */
export function nombreFotoDeLectura(
  medidorCodigo: string,
  fecha: Date = new Date(),
): string {
  return `${crearClaveUnica(medidorCodigo, crearPeriodoLocal(fecha))}${EXTENSION_FOTO}`;
}

/**
 * Abre la cámara del sistema y copia la foto aceptada al almacenamiento
 * persistente. Devuelve el nombre del archivo copiado, o null si el
 * técnico canceló la captura.
 */
export async function capturarFoto(nombreArchivo: string): Promise<string | null> {
  const nombre = validarNombreArchivo(nombreArchivo);

  const permiso = await ImagePicker.requestCameraPermissionsAsync();
  if (!permiso.granted) {
    throw new PermisoCamaraDenegadoError();
  }

  let resultado: ImagePicker.ImagePickerResult;
  try {
    resultado = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.6,
    });
  } catch {
    // launchCameraAsync falla cuando el dispositivo no tiene cámara.
    throw new CamaraNoDisponibleError();
  }

  if (resultado.canceled || resultado.assets.length === 0) {
    return null;
  }

  await copiarAlmacenamientoPersistente(resultado.assets[0].uri, nombre);
  return nombre;
}

/**
 * Si Android cerró la app durante la captura (ADR-007), recupera el
 * resultado pendiente y lo copia al almacenamiento persistente.
 * Devuelve el nombre del archivo o null si no había nada pendiente.
 */
export async function recuperarFotoPendiente(
  nombreArchivo: string,
): Promise<string | null> {
  const nombre = validarNombreArchivo(nombreArchivo);

  const pendiente = await ImagePicker.getPendingResultAsync();
  if (
    pendiente === null ||
    !('canceled' in pendiente) ||
    pendiente.canceled ||
    pendiente.assets.length === 0
  ) {
    return null;
  }

  await copiarAlmacenamientoPersistente(pendiente.assets[0].uri, nombre);
  return nombre;
}

/**
 * Ruta completa de una foto guardada, para mostrarla. Devuelve null si el
 * archivo ya no existe (por ejemplo, borrado desde fuera de la app).
 */
export function obtenerRutaFoto(nombreArchivo: string): string | null {
  const archivo = archivoDeLectura(nombreArchivo);
  return archivo.exists ? archivo.uri : null;
}

/**
 * Borra la foto de una lectura si existe. Usado al descartar un
 * registro; tolera archivos ya ausentes (ADR-008).
 */
export function eliminarFoto(nombreArchivo: string): void {
  const archivo = archivoDeLectura(nombreArchivo);
  if (archivo.exists) {
    archivo.delete();
  }
}

async function copiarAlmacenamientoPersistente(
  uriOrigen: string,
  nombreArchivo: string,
): Promise<void> {
  const carpeta = new Directory(Paths.document, CARPETA_FOTOS);
  if (!carpeta.exists) {
    carpeta.create();
  }

  const destino = new File(carpeta, nombreArchivo);
  if (destino.exists) {
    // Repetir la foto de la misma lectura reemplaza el archivo anterior.
    destino.delete();
  }

  await new File(uriOrigen).copy(destino);
}

function archivoDeLectura(nombreArchivo: string): File {
  return new File(Paths.document, CARPETA_FOTOS, validarNombreArchivo(nombreArchivo));
}

/** Impide que un nombre con separadores salga de la subcarpeta de fotos. */
function validarNombreArchivo(nombreArchivo: string): string {
  const nombre = nombreArchivo.trim();
  if (nombre.length === 0 || nombre.includes('/') || nombre.includes('\\')) {
    throw new TypeError('El nombre del archivo de fotografía no es válido.');
  }
  return nombre;
}
