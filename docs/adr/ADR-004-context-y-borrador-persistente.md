# ADR-004: Compartir el estado del registro con React Context y guardarlo en la base local en cada cambio

## Estado
Aceptado.

## Fecha
2026-10-27

## Requisitos relacionados
R8, y los datos de los pasos de R5, R6 y R7.

## Contexto
El registro de una lectura ocupa varias pantallas (estado, lectura o motivo o daño, resumen con consumo, foto y confirmación). Los datos ingresados deben acompañar al técnico al ir atrás y adelante. Además, deben sobrevivir a que el sistema cierre el proceso y a que el técnico quite la app de recientes, y al reabrir, con "Continuar", deben aparecer intactos (R8). Los parámetros de ruta no persisten (ADR-001). Otras partes de la app necesitan su propio estado con otra frecuencia de cambio: la sesión, la conexión y el número de pendientes, visibles en todas las pantallas (R9).

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
|---|---|---|
| Zustand | Selectores que evitan re-renderizados. Se puede usar fuera de componentes. | Dependencia nueva. Su persistencia habría que conectarla a la base local de todas formas. No se ha usado en los proyectos del curso. |
| Parámetros de ruta | Sin código adicional. | Se pierden al cerrar la app: no cumple R8. Los datos viajan en la URL de cada paso. |
| React Context con persistencia en la base local | Sin dependencias. Patrón ya usado en proyectos anteriores (formulario de varias pantallas). Fácil de explicar. | Todos los consumidores de un contexto se re-renderizan con cualquier cambio. La sincronización con la base hay que programarla. |

## Decisión
Se usan tres contextos separados: `SesionContext`, `ConexionContext` y `RegistroContext`. `RegistroContext` guarda el borrador y el paso actual. Cada cambio se escribe en la tabla `borrador` (ADR-002) con una espera de unos 300 ms. Además, se escribe de inmediato al cambiar de paso y cuando la app pasa a segundo plano. Al montar, el contexto lee el borrador antes de que la app decida a qué pantalla ir. Al guardar la lectura, el borrador se borra.

## Consecuencias
- No se agrega ninguna dependencia.
- Separar los contextos evita que un cambio de conexión re-renderice el formulario.
- Riesgo: si el proceso muere dentro de la ventana de 300 ms, se pierde el último cambio. Se mitiga guardando al cambiar de paso y al ir a segundo plano.
- Hay que escribir a mano la lectura y escritura del borrador y validarla al leer (ADR-005), porque puede venir de una versión anterior del formato.
- El contexto del registro solo debe incluirse donde se usa, no en toda la app.

## Verificación
- Existen tres archivos de contexto (`.tsx`) en `src/contexts/`.
- Prueba: escribir en el paso 2, quitar la app de recientes, reabrir, elegir "Continuar" y ver los datos intactos en el mismo paso.
- Elegir "Descartar" borra el borrador y no hay datos residuales en el siguiente registro.

## Uso de IA

Consulté a Claude sobre cómo compartir información entre las distintas pantallas de la aplicación. Inicialmente, recomendó Zustand, pero después de revisar mis proyectos anteriores, donde ya había utilizado Context, recomendó mantener esta alternativa para evitar dependencias adicionales.

**Decisión personal:** Elegí React Context porque ya lo utilicé en `cv-creator-app` para compartir los datos de un formulario con varias pantallas. Por eso, conozco su funcionamiento y puedo explicar cómo lo implementaré sin depender de otra herramienta.

Descarté Zustand porque no considero necesario incorporar una biblioteca adicional para las necesidades actuales del proyecto.

Decidí separar el estado en tres contextos: sesión, conexión y registro. Así, cada uno administra información diferente y se reduce la posibilidad de que los cambios en un contexto afecten innecesariamente a los componentes que utilizan los otros.

También decidí implementar manualmente el guardado del borrador en el almacenamiento local. Esto requiere escribir más lógica, pero me permite controlar cuándo se guardan los datos. Para reducir el riesgo de perder información si la aplicación se cierra inesperadamente, guardaré el borrador cada vez que el técnico avance a otro paso del registro.
