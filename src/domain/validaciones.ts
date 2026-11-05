import type {
  BorradorRegistro,
  DatosRegistroLectura,
  DecisionEstadoOficina,
  ErroresRegistro,
  EstadoMedidor,
  MedidorOficina,
} from './tipos';
import { requiereFoto } from './reglasLectura';

const CODIGO_MEDIDOR_REGEX = /^MED-\d{6}$/;
const LECTURA_REGEX = /^\d+$/;

export function validarCodigoMedidor(codigo: unknown): string | null {
  if (
    typeof codigo !== 'string' ||
    codigo.length !== 10 ||
    !CODIGO_MEDIDOR_REGEX.test(codigo)
  ) {
    return 'El código debe tener el formato MED-123456.';
  }

  return null;
}

export function esMedidorOficina(value: unknown): value is MedidorOficina {
  if (!esObjetoRegistro(value)) {
    return false;
  }

  const campos = [
    'codigo',
    'direccion',
    'sector',
    'numeroCuenta',
    'estadoOficina',
    'ultimaLectura',
    'fechaUltimaLectura',
    'promedioMensual',
  ] as const;
  if (
    !campos.every((campo) =>
      Object.prototype.hasOwnProperty.call(value, campo),
    )
  ) {
    return false;
  }

  if ('id' in value && typeof value.id !== 'string') {
    return false;
  }

  return (
    validarCodigoMedidor(value.codigo) === null &&
    esTextoNoVacio(value.direccion) &&
    esTextoNullable(value.sector) &&
    esTextoNullable(value.numeroCuenta) &&
    esTextoNoVacio(value.estadoOficina) &&
    esLecturaNullable(value.ultimaLectura) &&
    esFechaNullable(value.fechaUltimaLectura) &&
    esPromedioNullable(value.promedioMensual) &&
    ((value.ultimaLectura === null) === (value.fechaUltimaLectura === null))
  );
}

export function parsearMedidorOficina(value: unknown): MedidorOficina | null {
  if (!esMedidorOficina(value)) {
    return null;
  }

  return {
    codigo: value.codigo,
    direccion: value.direccion,
    sector: value.sector,
    numeroCuenta: value.numeroCuenta,
    estadoOficina: value.estadoOficina,
    ultimaLectura: value.ultimaLectura,
    fechaUltimaLectura: value.fechaUltimaLectura,
    promedioMensual: value.promedioMensual,
  };
}

export function evaluarEstadoOficina(
  estadoOficina: string,
): DecisionEstadoOficina {
  if (estadoOficina === 'activo') {
    return {
      permiteContinuar: true,
      requiereRevision: false,
      mensaje: 'El estado de oficina permite continuar con el registro.',
    };
  }

  if (estadoOficina === 'suspendido') {
    return {
      permiteContinuar: false,
      requiereRevision: false,
      mensaje: 'El medidor está suspendido y no se puede continuar.',
    };
  }

  return {
    permiteContinuar: false,
    requiereRevision: true,
    mensaje: `El estado de oficina «${estadoOficina}» requiere revisión antes de continuar.`,
  };
}

function esObjetoRegistro(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function esTextoNoVacio(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function esTextoNullable(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function esLecturaNullable(value: unknown): value is number | null {
  return (
    value === null ||
    (typeof value === 'number' &&
      Number.isFinite(value) &&
      Number.isInteger(value) &&
      value >= 0)
  );
}

function esPromedioNullable(value: unknown): value is number | null {
  return (
    value === null ||
    (typeof value === 'number' && Number.isFinite(value) && value >= 0)
  );
}

function esFechaNullable(value: unknown): value is string | null {
  if (value === null) {
    return true;
  }
  if (typeof value !== 'string') {
    return false;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null || match[0] !== value) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12) {
    return false;
  }

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day >= 1 && day <= daysInMonth;
}

function tieneContenido(valor: number | string | null | undefined): boolean {
  if (valor === null || valor === undefined) {
    return false;
  }

  return typeof valor === 'string' ? valor.trim().length > 0 : true;
}

function convertirLectura(valor: number | string | null | undefined): number | null {
  if (typeof valor === 'number') {
    return Number.isFinite(valor) && Number.isInteger(valor) && valor >= 0
      ? valor
      : null;
  }

  if (typeof valor !== 'string') {
    return null;
  }

  const texto = valor.trim();
  if (!LECTURA_REGEX.test(texto)) {
    return null;
  }

  const lectura = Number(texto);
  return Number.isFinite(lectura) && Number.isInteger(lectura) ? lectura : null;
}

function validarTextoObligatorio(valor: string | null | undefined): boolean {
  return typeof valor === 'string' && valor.trim().length > 0;
}

export function validarRegistro(
  estado: EstadoMedidor,
  datos: DatosRegistroLectura,
): ErroresRegistro {
  const errores: ErroresRegistro = {};
  const lecturaInformada = tieneContenido(datos.lectura);

  if (estado === 'inaccesible') {
    if (lecturaInformada) {
      errores.lectura = 'Un medidor inaccesible no admite una lectura.';
    }

    if (!validarTextoObligatorio(datos.motivo)) {
      errores.motivo = 'Indica el motivo por el que no fue accesible.';
    }
  } else {
    if (estado === 'normal' && !lecturaInformada) {
      errores.lectura = 'Ingresa la lectura del medidor.';
    } else if (lecturaInformada) {
      const lectura = convertirLectura(datos.lectura);
      if (lectura === null) {
        errores.lectura = 'La lectura debe ser un entero no negativo.';
      } else if (datos.lecturaAnterior !== null && datos.lecturaAnterior !== undefined) {
        if (
          !Number.isFinite(datos.lecturaAnterior) ||
          !Number.isInteger(datos.lecturaAnterior) ||
          datos.lecturaAnterior < 0
        ) {
          errores.lecturaAnterior = 'La lectura anterior no es válida.';
        } else if (lectura < datos.lecturaAnterior) {
          errores.lectura = 'La lectura actual no puede ser menor que la anterior.';
        }
      }
    }

    if (estado === 'danado' && !validarTextoObligatorio(datos.descripcion)) {
      errores.descripcion = 'Describe el daño observado en el medidor.';
    }
  }

  const anomalo =
    estado !== 'inaccesible' &&
    lecturaInformada &&
    datos.consumoAnomalo === true;
  if (anomalo && datos.confirmacionAnomalia !== true) {
    errores.confirmacionAnomalia = 'Confirma que revisaste el consumo anómalo.';
  }

  if (
    requiereFoto(estado, anomalo) &&
    !validarTextoObligatorio(datos.fotoNombre)
  ) {
    errores.fotoNombre = 'La fotografía es obligatoria para este registro.';
  }

  return errores;
}

/**
 * Indica si un borrador contiene un registro en curso que vale la pena
 * recuperar (R8). El registro empieza al definirse el código del medidor
 * o el estado observado, o al escribirse el primer dato. Una fila sin
 * código, sin estado y sin datos es un residuo de una versión anterior:
 * no debe presentarse como una recuperación posible ni conservarse.
 */
export function esBorradorRecuperable(
  borrador: Pick<BorradorRegistro, 'codigoMedidor' | 'estadoMedidor' | 'datos'>,
): boolean {
  return (
    borrador.codigoMedidor !== null ||
    borrador.estadoMedidor !== null ||
    Object.keys(borrador.datos).length > 0
  );
}