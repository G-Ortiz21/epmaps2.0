import { API_BASE_URL, API_RESOURCES } from '../config';

type ApiResource = (typeof API_RESOURCES)[keyof typeof API_RESOURCES];

export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'not_found'
  | 'http'
  | 'invalid_json'
  | 'invalid_response';

export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const REQUEST_TIMEOUT_MS = 10_000;

async function solicitarJson(
  resource: ApiResource,
  method: 'GET' | 'POST',
  query: Readonly<Record<string, string>>,
  body?: unknown,
): Promise<unknown> {
  const url = new URL(resource, `${API_BASE_URL}/`);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }

  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    let response: Response;
    try {
      response = await fetch(url.toString(), {
        method,
        headers: {
          Accept: 'application/json',
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: controller.signal,
      });
    } catch {
      if (timedOut) {
        throw new ApiError('timeout', 'La consulta a la oficina excedió 10 segundos.');
      }
      throw new ApiError('network', 'No se pudo conectar con la oficina.', undefined);
    }

    if (!response.ok) {
      if (response.status === 404) {
        throw new ApiError(
          'not_found',
          'El recurso solicitado no contiene el registro buscado.',
          response.status,
        );
      }
      throw new ApiError(
        'http',
        `La oficina respondió con un error HTTP (${response.status}).`,
        response.status,
      );
    }

    let responseText: string;
    try {
      responseText = await response.text();
    } catch {
      if (timedOut) {
        throw new ApiError('timeout', 'La consulta a la oficina excedió 10 segundos.');
      }
      throw new ApiError('network', 'No se pudo recibir la respuesta de la oficina.');
    }

    let responseJson: unknown;
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      throw new ApiError('invalid_json', 'La respuesta de la oficina no es JSON válido.');
    }
    if (timedOut) {
      throw new ApiError('timeout', 'La consulta a la oficina excedió 10 segundos.');
    }
    return responseJson;
  } finally {
    clearTimeout(timeout);
  }
}

export function getJson(
  resource: ApiResource,
  query: Readonly<Record<string, string>> = {},
): Promise<unknown> {
  return solicitarJson(resource, 'GET', query);
}

export function postJson(
  resource: ApiResource,
  body: unknown,
): Promise<unknown> {
  return solicitarJson(resource, 'POST', {}, body);
}