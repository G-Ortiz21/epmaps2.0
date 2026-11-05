import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import type { PersistQueryClientProviderProps } from '@tanstack/react-query-persist-client';

import { ApiError } from '../api/client';

/**
 * Tiempo máximo de retención de los datos de medidores en memoria y en
 * AsyncStorage. Debe ser igual o mayor que el tiempo de persistencia.
 */
export const DURACION_CACHE = 24 * 60 * 60 * 1000;

/**
 * Frescura de las consultas de medidores. Con conexión, una consulta se
 * revalida pasado este intervalo; sin conexión, los datos guardados siguen
 * siendo utilizables porque `enabled` impide la petición de red.
 */
export const FRESCURA_CONSULTA_MEDIDOR = 5 * 60 * 1000;

/** Clave estable y versionada del almacenamiento persistente. */
export const CLAVE_CACHE_PERSISTENTE = 'LECTURA_AGIL_QUERY_CACHE_V1';

/**
 * Política de reintentos: un solo reintento para fallos transitorios de red,
 * y ninguno cuando la oficina responde que el medidor no existe.
 */
function debeReintentar(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.kind === 'not_found') {
    return false;
  }
  return failureCount < 1;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: FRESCURA_CONSULTA_MEDIDOR,
      gcTime: DURACION_CACHE,
      retry: debeReintentar,
      // React Native no tiene eventos de foco de ventana como en el navegador.
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

export const medidoresPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: CLAVE_CACHE_PERSISTENTE,
});

/**
 * Solo se persisten resultados satisfactorios de consultas de medidores.
 * Los errores nunca se guardan como si fueran resultados válidos.
 */
export const persistOptions: PersistQueryClientProviderProps['persistOptions'] = {
  persister: medidoresPersister,
  maxAge: DURACION_CACHE,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) =>
      query.state.status === 'success' && query.queryKey[0] === 'medidor',
  },
};
