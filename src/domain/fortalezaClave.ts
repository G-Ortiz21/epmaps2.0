export type FortalezaClave = 'debil' | 'media' | 'fuerte';

export function evaluarFortaleza(clave: string): FortalezaClave {
  if (clave.length < 8) {
    return 'debil';
  }

  let puntos = 0;

  if (clave.length >= 12) {
    puntos += 1;
  }
  if (/\p{Lu}/u.test(clave) && /\p{Ll}/u.test(clave)) {
    puntos += 1;
  }
  if (/\p{N}/u.test(clave)) {
    puntos += 1;
  }
  if (/[\p{P}\p{S}]/u.test(clave)) {
    puntos += 1;
  }

  if (puntos >= 4) {
    return 'fuerte';
  }
  if (puntos === 3) {
    return 'media';
  }

  return 'debil';
}
