import { getDatabase } from '../database';
import { crearClaveUnica, crearPeriodoLocal } from '../../domain/identidadLectura';
import {
  ESTADOS_MEDIDOR,
  ESTADOS_SINCRONIZACION,
  ESTADOS_VERIFICACION,
  type ActualizarLecturaPendienteInput,
  type CrearLecturaInput,
  type EstadoMedidor,
  type EstadoSincronizacion,
  type EstadoVerificacion,
  type LecturaLocal,
} from '../../domain/tipos';

interface LecturaRow {
  clave_unica: string;
  remote_id: string | null;
  medidor_codigo: string;
  periodo: string;
  estado_medidor: string;
  lectura: number | null;
  lectura_anterior: number | null;
  consumo: number | null;
  promedio_mensual: number | null;
  consumo_anomalo: number | null;
  confirmacion_anomalia: number;
  motivo: string | null;
  descripcion: string | null;
  foto_nombre: string | null;
  verificacion: string;
  sync_estado: string;
  tecnico_codigo: string | null;
  creado_en: string;
  actualizado_en: string;
  intentos_sync: number;
  ultimo_error: string | null;
}

export class LecturaDuplicadaError extends Error {
  constructor(medidorCodigo: string, periodo: string) {
    super(`Ya existe una lectura local para ${medidorCodigo} en ${periodo}.`);
    this.name = 'LecturaDuplicadaError';
  }
}

export class LecturaNoEncontradaError extends Error {
  constructor(claveUnica: string) {
    super(`No existe la lectura local ${claveUnica}.`);
    this.name = 'LecturaNoEncontradaError';
  }
}

export class LecturaNoEditableError extends Error {
  constructor(claveUnica: string, syncEstado: string) {
    super(
      `La lectura ${claveUnica} no se puede editar porque su estado de envío es "${syncEstado}".`,
    );
    this.name = 'LecturaNoEditableError';
  }
}

export interface ActualizarEstadoSincronizacionInput {
  estado: EstadoSincronizacion;
  remoteId?: string | null;
  ultimoError?: string | null;
  registrarIntento?: boolean;
}

export async function crearLecturaLocal(
  input: CrearLecturaInput,
  fechaRegistro: Date = new Date(),
): Promise<LecturaLocal> {
  const periodo = crearPeriodoLocal(fechaRegistro);
  const claveUnica = crearClaveUnica(input.medidorCodigo, periodo);
  const fechaIso = fechaRegistro.toISOString();
  const database = await getDatabase();

  try {
    await database.runAsync(
      `INSERT INTO lecturas (
         clave_unica, remote_id, medidor_codigo, periodo, estado_medidor,
         lectura, lectura_anterior, consumo, promedio_mensual, consumo_anomalo,
         confirmacion_anomalia, motivo, descripcion, foto_nombre, verificacion,
         sync_estado, tecnico_codigo, creado_en, actualizado_en
       )
       VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', ?, ?, ?)`,
      [
        claveUnica,
        input.medidorCodigo,
        periodo,
        input.estadoMedidor,
        input.lectura,
        input.lecturaAnterior,
        input.consumo,
        input.promedioMensual,
        input.consumoAnomalo === null ? null : Number(input.consumoAnomalo),
        Number(input.confirmacionAnomalia),
        input.motivo,
        input.descripcion,
        input.fotoNombre,
        input.verificacion,
        input.tecnicoCodigo,
        fechaIso,
        fechaIso,
      ],
    );
  } catch (error: unknown) {
    if (esErrorUnicidad(error)) {
      throw new LecturaDuplicadaError(input.medidorCodigo, periodo);
    }

    throw error;
  }

  const lectura = await obtenerLecturaPorClave(claveUnica);
  if (lectura === null) {
    throw new Error(`La lectura ${claveUnica} se insertó pero no pudo recuperarse.`);
  }

  return lectura;
}

export async function obtenerLecturaPorClave(
  claveUnica: string,
): Promise<LecturaLocal | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<LecturaRow>(
    'SELECT * FROM lecturas WHERE clave_unica = ?',
    [claveUnica],
  );
  return row === null ? null : mapearLectura(row);
}

export async function obtenerLecturaPorMedidorYPeriodo(
  medidorCodigo: string,
  periodo: string,
): Promise<LecturaLocal | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<LecturaRow>(
    `SELECT * FROM lecturas
     WHERE medidor_codigo = ? AND periodo = ?`,
    [medidorCodigo, periodo],
  );
  return row === null ? null : mapearLectura(row);
}

export async function obtenerLecturasPorMedidor(
  medidorCodigo: string,
): Promise<LecturaLocal[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<LecturaRow>(
    `SELECT * FROM lecturas
     WHERE medidor_codigo = ?
     ORDER BY periodo DESC, creado_en DESC`,
    [medidorCodigo],
  );
  return rows.map(mapearLectura);
}

export async function obtenerTodasLasLecturas(): Promise<LecturaLocal[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<LecturaRow>(
    'SELECT * FROM lecturas ORDER BY creado_en DESC',
  );
  return rows.map(mapearLectura);
}

export async function obtenerLecturasPendientesSincronizacion(): Promise<
  LecturaLocal[]
> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<LecturaRow>(
    `SELECT * FROM lecturas
     WHERE sync_estado IN ('pendiente', 'error', 'enviado')
       AND verificacion <> 'requiere_accion'
     ORDER BY creado_en ASC`,
  );
  return rows.map(mapearLectura);
}

export async function contarLecturasNoEnviadas(): Promise<number> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ cantidad: number }>(
    `SELECT COUNT(*) AS cantidad
     FROM lecturas
     WHERE sync_estado <> 'enviada'`,
  );
  return result?.cantidad ?? 0;
}

export async function actualizarLecturaPendiente(
  claveUnica: string,
  cambios: ActualizarLecturaPendienteInput,
  fechaActualizacion: Date = new Date(),
): Promise<LecturaLocal> {
  const columnas: readonly (
    readonly [keyof ActualizarLecturaPendienteInput, string]
  )[] = [
    ['estadoMedidor', 'estado_medidor'],
    ['lectura', 'lectura'],
    ['lecturaAnterior', 'lectura_anterior'],
    ['consumo', 'consumo'],
    ['promedioMensual', 'promedio_mensual'],
    ['consumoAnomalo', 'consumo_anomalo'],
    ['confirmacionAnomalia', 'confirmacion_anomalia'],
    ['motivo', 'motivo'],
    ['descripcion', 'descripcion'],
    ['fotoNombre', 'foto_nombre'],
    ['verificacion', 'verificacion'],
  ];

  const assignments: string[] = [];
  const values: (string | number | null)[] = [];

  for (const [property, column] of columnas) {
    const value = cambios[property];
    if (value !== undefined) {
      assignments.push(`${column} = ?`);
      values.push(convertirValorSql(value));
    }
  }

  if (assignments.length === 0) {
    throw new TypeError('Indica al menos un campo para actualizar la lectura.');
  }

  if (Number.isNaN(fechaActualizacion.getTime())) {
    throw new RangeError('La fecha de actualización de la lectura no es válida.');
  }

  assignments.push('actualizado_en = ?');
  values.push(fechaActualizacion.toISOString());
  values.push(claveUnica);

  const database = await getDatabase();
  const result = await database.runAsync(
    `UPDATE lecturas
     SET ${assignments.join(', ')}
     WHERE clave_unica = ? AND sync_estado = 'pendiente'`,
    values,
  );

  if (result.changes !== 1) {
    const current = await obtenerLecturaPorClave(claveUnica);
    if (current === null) {
      throw new LecturaNoEncontradaError(claveUnica);
    }
    throw new LecturaNoEditableError(claveUnica, current.syncEstado);
  }

  const updated = await obtenerLecturaPorClave(claveUnica);
  if (updated === null) {
    throw new Error(`La lectura ${claveUnica} no se pudo recuperar tras actualizar.`);
  }
  return updated;
}

export async function actualizarEstadoSincronizacion(
  claveUnica: string,
  cambio: ActualizarEstadoSincronizacionInput,
  fechaActualizacion: Date = new Date(),
): Promise<LecturaLocal> {
  if (Number.isNaN(fechaActualizacion.getTime())) {
    throw new RangeError('La fecha de actualización de la lectura no es válida.');
  }

  const database = await getDatabase();
  const result = await database.runAsync(
    `UPDATE lecturas
     SET sync_estado = ?,
         remote_id = CASE WHEN ? = 1 THEN ? ELSE remote_id END,
         ultimo_error = CASE WHEN ? = 1 THEN ? ELSE ultimo_error END,
         intentos_sync = intentos_sync + ?,
         actualizado_en = ?
     WHERE clave_unica = ? AND sync_estado <> 'enviada'`,
    [
      cambio.estado,
      Number(cambio.remoteId !== undefined),
      cambio.remoteId ?? null,
      Number(cambio.ultimoError !== undefined),
      cambio.ultimoError ?? null,
      Number(cambio.registrarIntento === true),
      fechaActualizacion.toISOString(),
      claveUnica,
    ],
  );

  if (result.changes !== 1) {
    const current = await obtenerLecturaPorClave(claveUnica);
    if (current === null) {
      throw new LecturaNoEncontradaError(claveUnica);
    }
    throw new LecturaNoEditableError(claveUnica, current.syncEstado);
  }

  const updated = await obtenerLecturaPorClave(claveUnica);
  if (updated === null) {
    throw new Error(
      `La lectura ${claveUnica} no se pudo recuperar tras cambiar su estado.`,
    );
  }
  return updated;
}

function mapearLectura(row: LecturaRow): LecturaLocal {
  return {
    claveUnica: row.clave_unica,
    remoteId: row.remote_id,
    medidorCodigo: row.medidor_codigo,
    periodo: row.periodo,
    estadoMedidor: validarEstadoMedidor(row.estado_medidor, row.clave_unica),
    lectura: row.lectura,
    lecturaAnterior: row.lectura_anterior,
    consumo: row.consumo,
    promedioMensual: row.promedio_mensual,
    consumoAnomalo:
      row.consumo_anomalo === null ? null : row.consumo_anomalo === 1,
    confirmacionAnomalia: row.confirmacion_anomalia === 1,
    motivo: row.motivo,
    descripcion: row.descripcion,
    fotoNombre: row.foto_nombre,
    verificacion: validarEstadoVerificacion(row.verificacion, row.clave_unica),
    syncEstado: validarEstadoSincronizacion(row.sync_estado, row.clave_unica),
    tecnicoCodigo: row.tecnico_codigo,
    creadoEn: row.creado_en,
    actualizadoEn: row.actualizado_en,
    intentosSync: row.intentos_sync,
    ultimoError: row.ultimo_error,
  };
}

function validarEstadoMedidor(
  value: string,
  claveUnica: string,
): EstadoMedidor {
  const estado = ESTADOS_MEDIDOR.find((candidate) => candidate === value);
  if (estado === undefined) {
    throw new Error(
      `La lectura ${claveUnica} contiene un estado de medidor desconocido.`,
    );
  }
  return estado;
}

function validarEstadoVerificacion(
  value: string,
  claveUnica: string,
): EstadoVerificacion {
  const estado = ESTADOS_VERIFICACION.find((candidate) => candidate === value);
  if (estado === undefined) {
    throw new Error(
      `La lectura ${claveUnica} contiene un estado de verificación desconocido.`,
    );
  }
  return estado;
}

function validarEstadoSincronizacion(
  value: string,
  claveUnica: string,
): EstadoSincronizacion {
  const estado = ESTADOS_SINCRONIZACION.find(
    (candidate) => candidate === value,
  );
  if (estado === undefined) {
    throw new Error(
      `La lectura ${claveUnica} contiene un estado de sincronización desconocido.`,
    );
  }
  return estado;
}

function convertirValorSql(value: unknown): string | number | null {
  if (value === null || typeof value === 'string' || typeof value === 'number') {
    return value;
  }
  if (typeof value === 'boolean') {
    return Number(value);
  }
  throw new TypeError('El valor de actualización no es compatible con SQLite.');
}

function esErrorUnicidad(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.includes('UNIQUE constraint failed');
}

