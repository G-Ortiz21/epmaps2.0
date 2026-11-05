# ADR-006: Manejar los formularios con componentes controlados y useState, sin librería de formularios

## Estado
Aceptado.

## Fecha
2026-10-27

## Requisitos relacionados
R5, R6, R7 y R8.

## Contexto
La app tiene formularios pequeños: inicio de sesión (2 campos), búsqueda de medidor (1 campo) y los pasos del registro, con pocos campos cada uno. En el registro, algunos campos cambian según el estado elegido (R5: con "inaccesible" la lectura se bloquea y el motivo es obligatorio). Los valores deben guardarse en el estado compartido a medida que se escriben (ADR-004) y los errores de las reglas (ADR-005) deben mostrarse junto a cada campo.

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
|---|---|---|
| react-hook-form | Menos re-renderizados y manejo de errores y campos tocados ya resuelto. | Mantiene su propio estado interno, que duplicaría el del `RegistroContext` que ya se persiste. Hay que sincronizar ambos para que el borrador de R8 sea fiel. Dependencia nueva. |
| Formik | Estado de formulario, errores y envío integrados. | Mismo problema de estado duplicado, y es menos usado en proyectos React Native recientes. Dependencia nueva. |
| Componentes controlados con `useState` y el contexto | El estado ya existe y ya se persiste (ADR-004). Sin dependencias. Un componente `Campo` reutilizable con su error. | Hay que escribir a mano cuándo mostrar errores. Cada tecla actualiza el estado y re-renderiza. |

## Decisión
Cada campo es un componente controlado (`Campo`) cuyo valor viene del `RegistroContext` (o de `useState` local en login y búsqueda). Los errores salen de las funciones del ADR-005. Se muestran al intentar avanzar de paso, y en tiempo real solo en el código del medidor, para no consultar con código incompleto.

## Consecuencias
- No se agrega ninguna dependencia, y no hay dos copias del mismo dato.
- Se pierde la gestión automática de "campo tocado", errores y reinicio del formulario: se escribe a mano.
- Riesgo: repetir lógica de errores en cada paso. Se mitiga con el componente `Campo` y las funciones comunes.
- Con formularios más grandes esta decisión dejaría de ser adecuada; aquí cada formulario tiene pocos campos.

## Verificación
- `package.json` no contiene `react-hook-form` ni `formik`.
- Existe un solo componente `Campo` reutilizado en las pantallas.
- Al elegir "inaccesible", el campo de lectura se deshabilita y aparece el motivo obligatorio.

## Uso de IA

Consulté a Claude sobre las alternativas para gestionar los formularios de registro de lecturas. Recomendó evaluar React Hook Form, una biblioteca que facilita la gestión de campos, validaciones y errores. Sin embargo, también señaló que debía considerar cómo se integraría con el estado persistente del registro.

**Decisión personal:** Decidí no incorporar una biblioteca de formularios porque los datos del registro ya se administrarán mediante `RegistroContext` y se guardarán en el almacenamiento local para permitir la recuperación de borradores. Utilizar React Hook Form o Formik podría introducir otra capa de gestión del estado que tendría que coordinar con el registro persistente. Como los formularios de esta aplicación son pequeños y tienen reglas concretas, considero suficiente gestionarlos directamente con React Context y funciones de validación propias.

Reconozco que esta decisión implica implementar manualmente la presentación de errores, el seguimiento de los campos modificados y las condiciones para mostrar mensajes de validación. Por ello, mantendré estas reglas organizadas y comprobaré su funcionamiento mediante casos de prueba.
