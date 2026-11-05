# ADR-002: Usar SQLite (expo-sqlite) para almacenar los datos en el teléfono

## Estado
Aceptado.

## Fecha
2026-10-27

## Requisitos relacionados
R3, R4, R8, R9 y R10.

## Contexto
Hay datos que deben sobrevivir al cierre de la app y al reinicio del teléfono, y que se necesitan sin conexión: los medidores ya consultados (R3), las lecturas pendientes de envío y las ya enviadas (R4, R9), y el borrador del registro en curso (R8). Una lectura no puede existir dos veces para el mismo medidor en el mismo mes (R10). Además, el cambio de estado de una lectura durante un envío no puede quedar a medias si se corta la señal o la app muere en ese instante (R9). Se consulta por código de medidor, por estado de envío y por mes. El volumen esperado es de decenas a pocos cientos de registros por jornada. La sesión del técnico se trata en otro ADR.

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
|---|---|---|
| AsyncStorage | Muy simple, API de clave y valor, ampliamente conocida. | No tiene restricciones de unicidad ni transacciones: R10 y la atomicidad de R9 habría que programarlas a mano. Para contar pendientes o filtrar por mes hay que leer y recorrer todo. Es una dependencia nueva. |
| WatermelonDB | Está pensada para aplicaciones offline-first con sincronización. | Curva de aprendizaje alta, configuración nativa y modelos con decoradores. Es mucho para dos días y para explicarlo en una defensa de 10 minutos sin IA. |
| expo-sqlite | Base relacional con `UNIQUE (medidor, periodo)` para R10 y transacciones para R9. Consultas por estado y mes. Módulo oficial de Expo. | Hay que escribir SQL y migraciones a mano. Todas las operaciones son asíncronas. |

## Decisión
Se usa `expo-sqlite` con una base única y tres tablas: `medidores_cache`, `lecturas` y `borrador`. La tabla `lecturas` tiene `UNIQUE (medidor_codigo, periodo)`. Los cambios de estado de envío se hacen dentro de transacciones. El esquema se versiona con `PRAGMA user_version`.

## Consecuencias
- Se gana integridad en base de datos y consultas simples para el contador de pendientes.
- Se pierde simplicidad: cada cambio de esquema exige una migración.
- Todo acceso a SQL se concentra en `src/data/` (repositorios); las pantallas no escriben SQL.
- El borrador guarda datos en JSON dentro de una columna, sin validación de esquema de la base; hay que validar al leer (ADR-005).
- Riesgo: si el esquema cambia entre versiones de la app durante las pruebas, una base vieja instalada puede no coincidir; se resuelve con migración o reinstalando.

## Verificación
- Solo `src/data/` contiene sentencias SQL.
- El esquema de `lecturas` incluye la restricción `UNIQUE`.
- Prueba: insertar dos lecturas del mismo medidor y mes produce un error controlado.
- Cerrar la app y reabrirla conserva caché, pendientes y borrador.

## Uso de IA
Se consultó a Claude para elegir el almacenamiento local. Propuso `expo-sqlite` y descartó AsyncStorage por la falta de unicidad y transacciones. Mencionó WatermelonDB como alternativa y la desaconsejó por tiempo y complejidad. Qué decidí yo: Elegí SQLite porque quiero que R10 lo haga cumplir la propia base con UNIQUE y que el cambio de estado de un envío no quede a medias si se corta la señal (R9). Descarté AsyncStorage porque tendría que programar yo la unicidad y las transacciones, y WatermelonDB porque no alcanzo a aprenderlo ni a explicarlo en la defensa. Acepto tener que escribir SQL y migraciones.
