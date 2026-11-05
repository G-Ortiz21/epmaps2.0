# ADR-013: Simular el sistema de la oficina con MockAPI

## Estado
Aceptado.

## Fecha
2026-10-27

## Requisitos relacionados
R3, R4 y R9.

## Contexto
La prueba pide simular el sistema de la oficina con dos recursos, `medidores` y `lecturas`, con libertad de elegir la herramienta. La app se presenta desde un APK instalado en un teléfono (o emulador), por lo que el servidor debe poder alcanzarse desde fuera de la computadora de desarrollo el día de la defensa. Se necesitan datos de prueba con casos límite: consumo normal, consumo anómalo, promedio bajo y medidores no normales. No se quiere gastar tiempo en infraestructura.

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
|---|---|---|
| json-server local | Gratis, sin cuenta, control total de los datos. | Solo alcanzable si el teléfono y la computadora están en la misma red; la IP cambia. En el APK de producción, Android bloquea tráfico HTTP sin cifrar salvo configuración extra. |
| Servidor propio (por ejemplo Express) | Permitiría imponer unicidad e idempotencia en el servidor. | Hay que programarlo y publicarlo, y no es lo que se evalúa. Consume tiempo del plazo de dos días. |
| MockAPI | Servicio alojado con HTTPS público, alcanzable desde cualquier red. Creación de recursos y datos de ejemplo en minutos. | No tiene lógica de servidor: no impone unicidad ni idempotencia. Depende de un tercero y de internet en la defensa. Tiene límites en el plan gratuito. |

## Decisión
Se usa MockAPI con los recursos `medidores` y `lecturas`, y unos 20 medidores de prueba que incluyen los casos límite indicados. Se agregan campos a `lecturas` para mejorar la aplicación: `claveLectura`, `periodo`, `estadoMedidor`, `verificacion`, `tecnicoCodigo` y `creadoEn`. La URL base se define en `src/config.ts`, no en variables de entorno, porque no es un secreto y así viaja en el APK.

## Consecuencias
- No se necesita infraestructura propia.
- La unicidad y la idempotencia que el servidor no ofrece se resuelven en el cliente (ADR-010 y ADR-011).
- Los filtros de MockAPI pueden coincidir parcialmente; por eso se usan códigos completos y claves exactas.
- Riesgo: si el servicio falla o la red de la defensa no tiene internet, no se podrá demostrar la consulta ni el envío. Se mitiga con una copia de los datos de prueba y practicando la demo en la red real.
- Hay que revisar los límites del plan gratuito (recursos y registros) antes de cargar datos.

## Verificación
- Existe `src/config.ts` con la URL base y las rutas de los dos recursos.
- Una petición GET a `medidores` devuelve los datos de prueba, y un envío aparece en `lecturas`.
- Se conserva un respaldo de los datos de prueba fuera del servicio.

## Uso de IA

Consulté a Claude sobre la herramienta que debía utilizar para simular el servidor de la aplicación. Se analizaron alternativas como MockAPI, `json-server` y Express, considerando la necesidad de disponer de una API accesible desde el APK durante la defensa. También se identificó una limitación importante: MockAPI no garantiza por sí mismo la unicidad de las lecturas, lo que motivó la elaboración de los ADR-010 y ADR-011 para documentar las decisiones relacionadas con este problema.

**Decisión personal:** Elegí MockAPI porque necesito un servidor remoto accesible mediante HTTPS desde el APK el día de la defensa. Descarté `json-server` porque, en la configuración local considerada, dependería de que el dispositivo pudiera acceder al servidor en la red local. También descarté desarrollar un servidor propio con Express porque su implementación y configuración requerirían tiempo adicional que prefiero dedicar a los requisitos principales de la aplicación.

Acepto como limitaciones que MockAPI no impone automáticamente la unicidad de las lecturas y que las operaciones que dependen del servidor requieren conexión a internet. Para reducir el riesgo durante la defensa, prepararé datos de respaldo y llevaré un punto de acceso móvil como alternativa de conexión.
