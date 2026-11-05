# ADR-005: Validar con funciones propias en TypeScript, sin librería de esquemas

## Estado
Aceptado.

## Fecha
2026-10-27

## Requisitos relacionados
R2, R5, R6 y R7 (regla de foto obligatoria). También R3, por los datos que llegan de la oficina.

## Contexto
Hay que validar dos tipos de datos. Los que ingresa el técnico: el código `MED-` seguido de seis dígitos (R2), las reglas de los tres estados (R5: normal exige lectura; inaccesible exige motivo y no admite lectura; dañado exige descripción y la lectura es opcional), la lectura numérica, el consumo anómalo (más del triple del promedio) con su confirmación (R6) y la foto obligatoria (R7). Y los que llegan del sistema de la oficina, que no se pueden dar por buenos: pueden faltar campos o venir con tipos distintos, y de eso depende mostrar los siete datos de R3. Las mismas reglas se necesitan en la pantalla y antes de guardar o consultar. La defensa oral se hace sin IA: cada regla debe poder explicarse línea por línea.

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
|---|---|---|
| Zod | Un esquema por estado y tipos de TypeScript inferidos. Valida también las respuestas de la API. | Dependencia nueva. Sus conceptos (uniones discriminadas, refinamientos) son más difíciles de explicar en 10 minutos sin IA que unas cuantas condiciones. |
| Yup | Validación declarativa muy usada con formularios. | Dependencia nueva, sin inferencia de tipos tan directa, y mismo costo de explicación. |
| Funciones propias en `src/domain/` | Sin dependencias. Cada regla es una función corta y legible. Las mismas funciones sirven en pantalla, servicio y repositorio. | Más código escrito a mano. El tipo de TypeScript y el validador pueden desincronizarse. |

## Decisión
Se escriben funciones puras en `src/domain/`: `validarCodigoMedidor`, `validarRegistro(estado, datos)`, `calcularConsumo`, `esAnomalo` y `requiereFoto`, que devuelven un resultado con los errores por campo. Para los datos de la oficina se usa una guardia de tipo (`esMedidorOficina`) que verifica los siete campos y convierte los números. El código se valida con `/^MED-\d{6}$/` de forma estricta; la UI pone el teclado en mayúsculas pero la regla no corrige entradas inválidas.

## Consecuencias
- No se agrega ninguna dependencia.
- Las reglas de negocio quedan separadas de la interfaz y se pueden probar sin abrir la app.
- Riesgo: si se cambia un tipo de TypeScript y no el validador, o al revés, el error aparece en ejecución. Se mitiga con una tabla de casos de prueba manual.
- Los mensajes de error se escriben a mano.
- `src/domain/` no debe importar React ni Expo.

## Verificación
- Ningún archivo de `src/domain/` importa `react` ni `expo-*`.
- Casos: `MED-12345`, `med-123456`, `MED-1234567`, `MED-12345A` son rechazados sin consulta de red; `MED-123456` es aceptado.
- Estado inaccesible con lectura, dañado sin descripción y normal sin lectura producen error.
- Un medidor de la oficina con un campo faltante no se muestra a medias: se informa el problema.

## Uso de IA

Consulté a Claude sobre las alternativas para validar los datos ingresados en la aplicación. Inicialmente, recomendó Zod, una biblioteca que permite definir esquemas de validación. Después, sugirió considerar funciones propias debido al alcance de las reglas y a la necesidad de mantener una implementación sencilla.

**Decisión personal:** Elegí implementar funciones de validación propias porque las reglas del proyecto son específicas y pueden resolverse mediante comprobaciones directas, como verificar el formato del código del medidor, validar valores numéricos y comprobar campos obligatorios. Esta alternativa evita añadir una dependencia y permite mantener las validaciones explícitas y adaptadas a las reglas del negocio.

Descarté Zod y Yup no porque sean técnicamente inferiores, sino porque sus capacidades adicionales no resultan indispensables para las validaciones previstas actualmente. Si en el futuro aumentara la complejidad de los esquemas, reconsideraría estas alternativas.

Reconozco que los tipos definidos en TypeScript y las reglas de validación deben mantenerse coherentes. Para reducir ese riesgo, documentaré las reglas y utilizaré casos de prueba con datos válidos e inválidos para comprobar su comportamiento.
