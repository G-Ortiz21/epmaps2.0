# ADR-009: Detectar la conexión con expo-network y confirmarla con el resultado real de las peticiones

## Estado
Aceptado.

## Fecha
2026-10-27

## Requisitos relacionados
R9 (estado de conexión visible en todas las pantallas y envío automático al recuperarla). También R3 y R4.

## Contexto
En todas las pantallas el técnico debe ver si tiene conexión. Al recuperarla, el envío de pendientes debe iniciar solo. En zonas rurales el teléfono puede indicar que está conectado a una red sin que haya salida real a internet, y el modo avión debe reflejarse de inmediato. El indicador debe llegar a un componente global, no a una pantalla. La app trabaja en primer plano durante la jornada.

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
|---|---|---|
| @react-native-community/netinfo | Muy usada, con comprobación de alcance configurable. | Dependencia de terceros que duplica lo que ya ofrece un módulo de Expo. |
| Sin detector: solo intentar peticiones y ver si fallan | Sin dependencias. Es la verdad final sobre el alcance. | El indicador global no se actualiza hasta que haya una petición, y no se puede disparar el envío al recuperar la señal sin sondear. |
| expo-network | Módulo oficial, con hook `useNetworkState` y suscripción a cambios, que informa si hay conexión y si hay alcance a internet. Incluido en el SDK. | El estado del sistema puede no coincidir con la realidad (red sin salida). El campo de alcance es opcional y puede no venir. |

## Decisión
Se usa `expo-network` para el indicador global y para disparar el envío cuando cambia a "en línea". Se considera "en línea" cuando hay conexión y el alcance a internet no es falso. El resultado de cada petición (éxito, timeout o error de red) es la decisión final del motor de envío (ADR-011): si falla, la lectura sigue pendiente aunque el indicador diga "en línea".

## Consecuencias
- Se instala una dependencia (`expo-network`), justificada por R9.
- El indicador puede equivocarse brevemente (por ejemplo, con una red sin salida); por eso el motor de envío no depende solo de él.
- Si el campo de alcance no viene, se trata como "no confirmado" y se confía en la petición.
- `ConexionContext` es el único lugar que se suscribe a los cambios de red.

## Verificación
- `package.json` contiene `expo-network` y no `@react-native-community/netinfo`.
- Activar y desactivar el modo avión cambia el indicador en todas las pantallas, incluido el login.
- Conectado a una red sin internet, las lecturas siguen pendientes y no se pierden.

## Uso de IA

Consulté a Claude sobre cómo detectar los cambios en la conexión de red de la aplicación. Recomendó `expo-network` frente a NetInfo, porque es un módulo del ecosistema Expo. También señaló que permite consultar el estado de la red y escuchar sus cambios mediante `useNetworkState` y `addNetworkStateListener`.

**Decisión personal:** Elegí `expo-network` porque mi proyecto utiliza Expo y mi archivo `AGENTS.md` establece que se deben priorizar los módulos de este ecosistema. Descarté NetInfo porque ofrece funcionalidades similares para detectar el estado de la red y no considero necesario añadir otra dependencia para cubrir esa misma necesidad.

Además, decidí que el resultado real de cada petición al servidor tenga prioridad sobre el indicador de conexión. Esto se debe a que estar conectado a una red Wi-Fi o móvil no garantiza que exista acceso a internet ni que el servidor esté disponible. Por ello, la aplicación utilizará el estado de la red como una señal inicial, pero comprobará el resultado de las peticiones para determinar si una operación se completó correctamente o debe quedar pendiente de sincronización.
