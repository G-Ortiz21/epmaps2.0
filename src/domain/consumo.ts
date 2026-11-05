export function calcularConsumo(
  lecturaActual: number | null,
  lecturaAnterior: number | null,
): number | null {
  if (lecturaActual === null || lecturaAnterior === null) {
    return null;
  }

  return lecturaActual - lecturaAnterior;
}

export function esAnomalo(
  consumo: number | null,
  promedioMensual: number | null,
): boolean | null {
  if (consumo === null || promedioMensual === null) {
    return null;
  }

  return consumo > 3 * promedioMensual;
}