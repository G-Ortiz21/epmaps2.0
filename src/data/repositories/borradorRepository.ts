import { getDatabase } from '../database';
import {
  ESTADOS_MEDIDOR,
  PASOS_REGISTRO,
  type BorradorRegistro,
  type DatosRegistroLectura,
  type EstadoMedidor,
  type GuardarBorradorInput,
  type PasoRegistro,
} from '../../domain/tipos';

interface BorradorRow {
  id: number;
  codigo_medidor: string | null;
  estado_medidor: string | null;
  paso: string;
  datos_json: string;
  actualizado_en: string;
}

export async function guardarBorrador(
  input: GuardarBorradorInput,
  fechaActualizacion: Date = new Date(),
): Promise<BorradorRegistro> {
  if (Number.isNaN(fechaActualizacion.getTime())) {
    throw new RangeError('La fecha de actualización del borrador no es válida.');
  }

  const datosJson = JSON.stringify(input.datos);
  if (datosJson === undefined) {
    throw new TypeError('Los datos del borrador no se pueden serializar.');
  }

  const actualizadoEn = fechaActualizacion.toISOString();
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO borrador (
       id, codigo_medidor, estado_medidor, paso, datos_json, actualizado_en
     )
     VALUES (1, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       codigo_medidor = excluded.codigo_medidor,
       estado_medidor = excluded.estado_medidor,
       paso = excluded.paso,
       datos_json = excluded.datos_json,
       actualizado_en = excluded.actualizado_en`,
    [
      input.codigoMedidor,
      input.estadoMedidor,
      input.paso,
      datosJson,
      actualizadoEn,
    ],
  );

  return { ...input, actualizadoEn };
}

export async function obtenerBorrador(): Promise<BorradorRegistro | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<BorradorRow>(
    'SELECT * FROM borrador WHERE id = 1',
  );

  return row === null ? null : mapearBorrador(row);
}

export async function eliminarBorrador(): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM borrador WHERE id = 1');
}

function mapearBorrador(row: BorradorRow): BorradorRegistro {
  const paso = obtenerPaso(row.paso);
  const estadoMedidor =
    row.estado_medidor === null ? null : obtenerEstadoMedidor(row.estado_medidor);
  const datos: unknown = JSON.parse(row.datos_json);

  if (
    row.id !== 1 ||
    (row.codigo_medidor !== null && typeof row.codigo_medidor !== 'string') ||
    !esDatosRegistroLectura(datos)
  ) {
    throw new Error('El borrador local tiene un formato incompatible.');
  }

  return {
    codigoMedidor: row.codigo_medidor,
    estadoMedidor,
    paso,
    datos,
    actualizadoEn: row.actualizado_en,
  };
}

function obtenerPaso(value: string): PasoRegistro {
  const paso = PASOS_REGISTRO.find((candidate) => candidate === value);
  if (paso === undefined) {
    throw new Error('El borrador local contiene un paso de registro desconocido.');
  }
  return paso;
}

function obtenerEstadoMedidor(value: string): EstadoMedidor {
  const estado = ESTADOS_MEDIDOR.find((candidate) => candidate === value);
  if (estado === undefined) {
    throw new Error('El borrador local contiene un estado de medidor desconocido.');
  }
  return estado;
}

function esDatosRegistroLectura(value: unknown): value is DatosRegistroLectura {
  if (!esObjetoRegistro(value)) {
    return false;
  }

  return (
    (value.lectura === undefined ||
      value.lectura === null ||
      typeof value.lectura === 'string' ||
      typeof value.lectura === 'number') &&
    (value.lecturaAnterior === undefined ||
      value.lecturaAnterior === null ||
      typeof value.lecturaAnterior === 'number') &&
    (value.motivo === undefined ||
      value.motivo === null ||
      typeof value.motivo === 'string') &&
    (value.descripcion === undefined ||
      value.descripcion === null ||
      typeof value.descripcion === 'string') &&
    (value.consumoAnomalo === undefined ||
      value.consumoAnomalo === null ||
      typeof value.consumoAnomalo === 'boolean') &&
    (value.confirmacionAnomalia === undefined ||
      typeof value.confirmacionAnomalia === 'boolean') &&
    (value.fotoNombre === undefined ||
      value.fotoNombre === null ||
      typeof value.fotoNombre === 'string')
  );
}

function esObjetoRegistro(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}