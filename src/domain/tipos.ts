export const ESTADOS_MEDIDOR = ['normal', 'inaccesible', 'danado'] as const;

export type EstadoMedidor = (typeof ESTADOS_MEDIDOR)[number];

export const ESTADOS_VERIFICACION = [
  'verificada',
  'pendiente_verificar',
  'requiere_accion',
] as const;

export type EstadoVerificacion = (typeof ESTADOS_VERIFICACION)[number];

export const ESTADOS_SINCRONIZACION = [
  'pendiente',
  'enviando',
  'enviada',
  'error',
] as const;

export type EstadoSincronizacion = (typeof ESTADOS_SINCRONIZACION)[number];

export const PASOS_REGISTRO = [
  'estado_medidor',
  'datos_lectura',
  'revision_consumo',
  'fotografia',
  'resumen',
] as const;

export type PasoRegistro = (typeof PASOS_REGISTRO)[number];

export interface DatosRegistroLectura {
  lectura?: number | string | null;
  lecturaAnterior?: number | null;
  motivo?: string | null;
  descripcion?: string | null;
  consumoAnomalo?: boolean | null;
  confirmacionAnomalia?: boolean;
  fotoNombre?: string | null;
}

export type CampoErrorRegistro =
  | 'estado'
  | 'lectura'
  | 'lecturaAnterior'
  | 'motivo'
  | 'descripcion'
  | 'confirmacionAnomalia'
  | 'fotoNombre';

export type ErroresRegistro = Partial<Record<CampoErrorRegistro, string>>;

export interface MedidorOficina {
  codigo: string;
  direccion: string;
  sector: string | null;
  numeroCuenta: string | null;
  estadoOficina: string;
  ultimaLectura: number | null;
  fechaUltimaLectura: string | null;
  promedioMensual: number | null;
}

export type DecisionEstadoOficina =
  | { permiteContinuar: true; requiereRevision: false; mensaje: string }
  | { permiteContinuar: false; requiereRevision: boolean; mensaje: string };

export interface LecturaLocal {
  claveUnica: string;
  remoteId: string | null;
  medidorCodigo: string;
  periodo: string;
  estadoMedidor: EstadoMedidor;
  lectura: number | null;
  lecturaAnterior: number | null;
  consumo: number | null;
  promedioMensual: number | null;
  consumoAnomalo: boolean | null;
  confirmacionAnomalia: boolean;
  motivo: string | null;
  descripcion: string | null;
  fotoNombre: string | null;
  verificacion: EstadoVerificacion;
  syncEstado: EstadoSincronizacion;
  tecnicoCodigo: string | null;
  creadoEn: string;
  actualizadoEn: string;
  intentosSync: number;
  ultimoError: string | null;
}

export interface CrearLecturaInput {
  medidorCodigo: string;
  estadoMedidor: EstadoMedidor;
  lectura: number | null;
  lecturaAnterior: number | null;
  consumo: number | null;
  promedioMensual: number | null;
  consumoAnomalo: boolean | null;
  confirmacionAnomalia: boolean;
  motivo: string | null;
  descripcion: string | null;
  fotoNombre: string | null;
  verificacion: EstadoVerificacion;
  tecnicoCodigo: string | null;
}

export type ActualizarLecturaPendienteInput = Partial<
  Pick<
    CrearLecturaInput,
    | 'estadoMedidor'
    | 'lectura'
    | 'lecturaAnterior'
    | 'consumo'
    | 'promedioMensual'
    | 'consumoAnomalo'
    | 'confirmacionAnomalia'
    | 'motivo'
    | 'descripcion'
    | 'fotoNombre'
    | 'verificacion'
  >
>;

export interface BorradorRegistro {
  codigoMedidor: string | null;
  estadoMedidor: EstadoMedidor | null;
  paso: PasoRegistro;
  datos: DatosRegistroLectura;
  actualizadoEn: string;
}

export type GuardarBorradorInput = Omit<BorradorRegistro, 'actualizadoEn'>;