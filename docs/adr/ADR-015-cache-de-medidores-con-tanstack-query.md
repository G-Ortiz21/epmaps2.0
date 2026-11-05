# ADR-015: Persistir la caché de consultas de medidores con TanStack Query y AsyncStorage

## Estado
Aceptado. Reemplaza a ADR-003 en lo que respecta a la caché de consultas de medidores.

## Fecha
2026-10-29

## Requisitos relacionados
R2, R3 y R9 (también R4, porque consume la última lectura de la oficina).

## Contexto
ADR-003 estableció una caché de medidores en SQLite (`medidores_cache`) con una regla de vigencia por día calendario. En la práctica, cada pantalla del registro (detalle, estado del medidor, datos de lectura, revisión del consumo y resumen) consultaba por su cuenta y replicaba estados de carga, error y "sin conexión sin caché", con riesgo de descargas duplicadas y de divergencias. Además, la caché vivía solo en SQLite: sobrevivía a reinicios, pero no existía una capa de consulta compartida, reactiva y con persistencia explícita. La aplicación ya integra React 19 y React Native 0.86; TanStack Query v5 es compatible con ambos y ofrece persistencia mediante un persister oficial para AsyncStorage.

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
|---|---|---|
| TanStack Query + AsyncStorage (elegida) | Una única consulta reutilizable por clave, estados de carga/error diferenciados, persistencia y restauración antes de interpretar ausencia de datos. | Dependencia adicional y una segunda capa de persistencia junto a SQLite. |
| Mantener la caché en SQLite (ADR-003) | Sin dependencias; datos consultables por SQL. | Cada pantalla reimplementa la lógica de consulta; la persistencia queda implícita en la base de datos. |
| React Context con efectos manuales | Sin dependencias. | Reimplementa caché, reintentos y estados; sin persistencia propia. |

## Decisión
Las consultas de medidores se gestionan con `@tanstack/react-query` v5, con persistencia en `@react-native-async-storage/async-storage` mediante `@tanstack/react-query-persist-client` y `@tanstack/query-async-storage-persister`:

- Existe una única instancia de `QueryClient` (`src/lib/queryClient.ts`) compartida por toda la aplicación.
- La caché se persiste con la clave versionada `LECTURA_AGIL_QUERY_CACHE_V1`, con un tiempo de persistencia (`maxAge`) de 24 horas y `gcTime` igual, para que la retención en memoria nunca sea menor que la persistencia.
- Solo se persisten resultados satisfactorios de claves `['medidor', codigo]`; los errores nunca se guardan como datos válidos.
- El `PersistQueryClientProvider` envuelve la aplicación en `src/app/_layout.tsx`; la restauración termina (o falla con aviso) antes de interpretar que no hay datos guardados, sin bloquear indefinidamente la interfaz.
- La consulta compartida vive en `src/hooks/useMedidorQuery.ts`: clave estable por código normalizado (`['medidor', codigo]`), `enabled` solo con código válido y conexión real (ADR-009), y conservación de datos anteriores si una actualización falla.
- El `fetch` nativo con `AbortController` y la clasificación de errores de `src/api/client.ts` se conservan sin cambios.

## Consecuencias
- Se retiran `consultarMedidor`, `src/services/medidoresService.ts` y `src/data/repositories/medidoresRepository.ts`. La tabla `medidores_cache` queda sin uso; las migraciones existentes no se editan y su eliminación corresponde a una futura migración v2.
- SQLite (ADR-002) sigue siendo el almacenamiento de lecturas, borradores y sincronización; no se modifica su esquema ni sus reglas.
- Con conexión, una consulta revalida pasados 5 minutos (`FRESCURA_CONSULTA_MEDIDOR`), en lugar de esperar al día calendario completo: los datos mostrados son más frescos que con ADR-003. Sin conexión, los datos persistidos siguen siendo utilizables aunque hayan superado su vigencia, como exigía ADR-003.
- Se añaden cuatro dependencias: `@tanstack/react-query`, `@tanstack/react-query-persist-client`, `@tanstack/query-async-storage-persister` y `@react-native-async-storage/async-storage`. Existe una única fuente de verdad para la consulta de un medidor.

## Verificación
- `consultarMedidor`, `guardarMedidorCache` y `obtenerMedidorCache` no aparecen en `src/`.
- Con señal, se consulta un medidor y se muestran los siete datos; la caché persiste en AsyncStorage.
- En modo avión, con la aplicación reiniciada y la restauración terminada, la misma consulta muestra los datos persistidos sin petición remota.
- Sin conexión y sin caché de un código, se informa que no hay datos para ese medidor sin mostrar datos de otro.

## Uso de IA

Se revisó la arquitectura de caché de medidores a petición explícita del desarrollador, que ordenó migrar de la caché en SQLite a TanStack Query + AsyncStorage. La recomendación fue concentrar la consulta en un único hook con clave por código y persistir solo resultados satisfactorios, conservando `fetch` nativo para las peticiones. La decisión de reemplazar la caché de medidores de ADR-003 es del desarrollador; este ADR documenta el cambio para cumplir la regla del proyecto de justificar cada dependencia incorporada.
