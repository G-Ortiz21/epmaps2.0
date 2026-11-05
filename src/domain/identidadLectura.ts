export function crearPeriodoLocal(fecha: Date): string {
  if (Number.isNaN(fecha.getTime())) {
    throw new RangeError('La fecha local para crear el período no es válida.');
  }

  const anioNumerico = fecha.getFullYear();
  if (anioNumerico < 0 || anioNumerico > 9999) {
    throw new RangeError('El año local debe tener cuatro dígitos.');
  }

  const anio = anioNumerico.toString().padStart(4, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  return `${anio}-${mes}`;
}

export function crearClaveUnica(medidorCodigo: string, periodo: string): string {
  return `${medidorCodigo}_${periodo}`;
}
