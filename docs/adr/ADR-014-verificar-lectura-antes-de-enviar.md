# ADR-014: Verificar la lectura contra los datos de la oficina antes de enviarla

## Estado
Aceptado.

## Fecha
2026-10-27

## Requisitos relacionados
R4 (registro sin conexión, pendiente de verificar), R6 (consumo y anomalía) y R7 (foto obligatoria con anomalía).

## Contexto
R4 permite registrar una lectura sin conexión y la deja pendiente de verificar con la lectura anterior cuando vuelva la conexión. R6 necesita la lectura anterior y el consumo promedio para calcular el consumo y detectar anomalías, y R7 exige una foto cuando hay anomalía. Hay un caso límite: el técnico está sin señal y nunca consultó ese medidor, por lo que no hay datos previos en la base local y no se puede saber en campo si la lectura es anómala. También ocurre que, aun con datos en caché, una lectura registrada sin conexión debe marcarse como pendiente de verificar. Al recuperar la conexión, el técnico ya pudo haberse ido del medidor.

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
|---|---|---|
| Bloquear el registro sin datos previos | Nunca queda una anomalía sin foto. | Contradice R4: sin conexión debe poder completarse el registro. |
| Enviar y marcar para revisión si resulta anómala | Simple, y no retiene lecturas. | La lectura anómala llega sin foto obligatoria y la regla de R7 queda incumplida. |
| Retener la lectura hasta que el técnico complete foto y confirmación | R7 se mantiene. La lectura no se envió, así que aún se puede editar (R10). | La lectura puede quedar retenida si el técnico no vuelve a abrirla. No cubre que el técnico ya esté lejos del medidor. |

## Decisión
Se aplica la retención. Al guardar, `verificacion` toma el valor `pendiente_verificar` si hay una lectura numérica y no hay conexión en ese momento o no hay datos previos; en cualquier otro caso es `verificada` (también si el medidor es inaccesible o dañado sin lectura, pues no hay nada que comparar). Antes de enviar una lectura `pendiente_verificar`, el motor del ADR-011 consulta los datos actuales del medidor, actualiza la caché y recalcula consumo y anomalía:
- Si no es anómala, o es anómala pero ya tiene confirmación y foto, pasa a `verificada` y se envía.
- Si es anómala y falta la confirmación o la foto, pasa a `requiere_accion`, no se envía y la lista muestra «Falta foto o confirmación» para que el técnico la complete.

## Consecuencias
- Se respeta que registrar sin conexión siempre es posible (R4) sin renunciar a la foto obligatoria (R7).
- Se agrega un estado de verificación y una condición en la selección de lecturas a enviar.
- Limitación: una lectura puede quedar retenida y el técnico quizá ya no esté frente al medidor. Hay que documentarla y consultar al docente cómo espera que se maneje esta situación.
- Una lectura retenida sigue siendo `pendiente`, por lo que cuenta en el contador y es editable.
- Si los datos del medidor cambian entre la caché y la verificación, el consumo final puede diferir del mostrado al técnico.

## Verificación
- En modo avión, una lectura normal queda marcada como «Pendiente de verificar».
- Con un medidor nunca consultado (por ejemplo MED-100020) se puede registrar sin conexión.
- Al reconectar, una lectura anómala sin foto queda retenida y no aparece en MockAPI hasta que se completa.
- Una lectura no anómala se envía sin intervención.

## Uso de IA

Una revisión externa del diseño identificó un posible conflicto entre los requisitos R4, R6 y R7. Consulté a Claude sobre cómo manejar las lecturas registradas sin conexión cuando todavía no es posible determinar si el consumo es anómalo. Propuso conservarlas localmente hasta verificar los datos del medidor y completar la fotografía y la confirmación requeridas, en lugar de enviarlas incompletas.

**Decisión personal:** Elegí aplicar una estrategia de retención y verificación antes del envío, porque permite cumplir los requisitos sin descartar lecturas registradas sin conexión. Según R4, el técnico debe poder guardar una lectura sin conexión y mantenerla pendiente de verificación. Cuando se recupera la conexión, la aplicación consulta los datos actuales del medidor y recalcula el consumo y las posibles anomalías, como establece R6. Si se detecta una anomalía, la lectura permanece retenida hasta que se complete la confirmación y la fotografía exigidas por R7. Si no existe anomalía, puede continuar con la sincronización.

Descarté bloquear el registro cuando no hay conexión o datos previos, porque impediría cumplir R4. También descarté enviar la lectura y solicitar la evidencia después, porque permitiría que una lectura que requiere fotografía llegue al servidor sin cumplir R7.

Acepto que una lectura puede permanecer pendiente de acción si el técnico ya se ha retirado del medidor. Para manejar este caso, la aplicación conserva la lectura como pendiente, permite editarla y muestra que falta la fotografía o la confirmación. De esta manera, se prioriza la conservación del registro y el cumplimiento de las condiciones necesarias antes de enviarlo. 