# ADR-011: Enviar las lecturas con estados explícitos y comprobar en el servidor antes de reenviar

## Estado
Aceptado.

## Fecha
2026-10-27

## Requisitos relacionados
R9 (envío automático sin duplicados) y R4 (verificar con la lectura anterior al recuperar la conexión). También R10, porque una lectura enviada no se puede editar.

## Contexto
Las lecturas pendientes deben enviarse solas al recuperar la conexión. La señal puede cortarse en cualquier instante, incluso después de que el servidor recibió la lectura pero antes de que la app reciba la respuesta, y la app puede cerrarse justo entonces. En ese caso la app no sabe si la lectura llegó. El servidor simulado no deduplica. El técnico debe ver cuántas lecturas faltan por enviar. El envío debe poder iniciarse desde el arranque de la app y reaccionar a cambios de conexión y de estado de la app, sin depender de que haya una pantalla abierta. Ya se decidió la identidad de la lectura (ADR-010), cómo se detecta la conexión (ADR-009) y dónde se guarda el estado (ADR-002).

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
|---|---|---|
| Enviar y reintentar hasta recibir éxito, sin comprobar | La más simple. | Si la respuesta se pierde después de que el servidor guardó la lectura, el reintento la duplica: incumple R9. |
| Tarea en segundo plano (expo-background-task) | Podría enviar con la app cerrada. | Sin garantía de horario, dependencia nueva y ningún requisito la pide; el envío automático se cumple con la app abierta. |
| Envío dentro de un contexto o efecto de React | Cercano a lo ya conocido del curso. | El envío dependería de que un componente esté montado, y se podría ejecutar dos veces con re-renderizados. |
| Cola con estados y comprobación previa por clave, en un módulo independiente de React | Recuperable tras un cierre inesperado. Se inicia una sola vez desde el arranque. Sin dependencias. | Una petición extra por lectura (consultar antes de enviar). Más casos borde que probar. |

## Decisión
El envío es un módulo de TypeScript independiente de React (`src/sync/syncEngine.ts`), que se inicia una vez al arrancar la app. Los contextos solo se suscriben para mostrar el contador y la conexión. Cada lectura pasa por los estados `pendiente`, `enviando`, `enviada` y `error`. Para cada pendiente, en orden de creación:
1. Marcar `enviando` en una transacción.
2. Completar la verificación contra los datos de la oficina si hace falta (ADR-014). Si la lectura queda retenida, no se envía.
3. Consultar al servidor por `claveLectura`. Si ya existe, marcar `enviada` sin reenviar.
4. Si no existe, enviar con un timeout de 10 segundos.
5. Con respuesta correcta, marcar `enviada` y guardar `remote_id`.
6. Con fallo de red o de servidor, volver a `pendiente`, sumar un intento y detener la ronda; se reintenta con espera creciente. Un error 4xx deja la lectura en `error` y no se reintenta en bucle.

Al arrancar, toda lectura en `enviando` vuelve a `pendiente`. Solo hay una ejecución a la vez. El envío se dispara al arrancar, al pasar a "en línea", al volver la app a primer plano, tras guardar una lectura y con un temporizador mientras haya pendientes. El contador de pendientes se lee siempre de SQLite. Una lectura `enviada` o `enviando` no se puede editar: la consulta de actualización exige `sync_estado = 'pendiente'`.

## Consecuencias
- No se agregan dependencias.
- Con un solo dispositivo y una ejecución a la vez, se evita el duplicado en el caso de la respuesta perdida y en el del cierre de la app durante un envío.
- Límite explícito: esta solución no garantiza entrega exactamente una vez ante varios dispositivos o peticiones simultáneas, porque el servidor simulado no impone unicidad. La consulta previa reduce el riesgo, pero no lo elimina. Esto debe decirse así en la defensa.
- Costo: una petición adicional por lectura, relevante con señal débil.
- Limitación: si la app está cerrada, no se envía nada. Se acepta; la mejora sería una tarea en segundo plano.
- Es la parte con más casos borde del proyecto: hay que probar explícitamente el corte a mitad del envío.

## Verificación
- Existe un único módulo de envío en `src/sync/` y no importa React.
- Prueba: con 8 a 10 lecturas pendientes, activar el modo avión durante el envío y reconectar; en MockAPI cada `claveLectura` aparece una sola vez.
- Prueba: cerrar la app mientras una lectura está en `enviando`, reabrir, y comprobar que termina `enviada` sin duplicado.
- Antes de implementar el envío se prueba en MockAPI el filtro por `claveLectura` (coincidencia exacta y respuesta ante una lista vacía); el resultado se registra en `DISEÑO.md`.
- Una lectura enviada no se puede editar desde la interfaz ni por la consulta de actualización.

## Uso de IA

Consulté a Claude sobre cómo evitar duplicados durante la sincronización de lecturas. Propuso comprobar si ya existe un registro con la misma clave antes de enviarlo y explicó el riesgo de que el servidor guarde una lectura, pero la aplicación no reciba la respuesta debido a un corte de conexión. También presentó el envío en segundo plano como una alternativa, aunque recomendó no incorporarlo porque ningún requisito lo solicita. En una revisión posterior del diseño, se señaló que el motor de sincronización no debe depender de que una pantalla esté abierta y que, al utilizar MockAPI, no se puede garantizar una entrega exactamente una vez en todos los escenarios. Incorporé estas observaciones.

**Decisión personal:** Elegí comprobar la clave de negocio antes de enviar cada lectura, porque me preocupa especialmente el caso en que el servidor guarda el registro, pero la aplicación pierde la conexión antes de recibir la confirmación. Si la aplicación vuelve a enviar la lectura sin ninguna comprobación, podría generar un duplicado. Descarté el envío sin comprobación porque aumenta ese riesgo y no incorporé una tarea de sincronización en segundo plano porque no es necesaria para los requisitos actuales.

Acepto que esta estrategia requiere una petición adicional por lectura y que la sincronización no se ejecutará automáticamente cuando la aplicación esté cerrada. También reconozco que la comprobación previa no garantiza por sí sola la ausencia de duplicados, especialmente si dos dispositivos intentan registrar la misma lectura simultáneamente. Por ello, en la defensa no afirmaré que el sistema garantiza una entrega exactamente una vez en todos los escenarios.
