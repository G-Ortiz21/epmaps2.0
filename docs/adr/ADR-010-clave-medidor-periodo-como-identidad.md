# ADR-010: Identificar cada lectura con una clave determinista medidor + periodo

## Estado
Aceptado.

## Fecha
2026-10-27

## Requisitos relacionados
R10 (no registrar dos veces el mismo medidor en el mismo mes) y R9 (no duplicar lecturas aunque la señal se corte durante un envío).

## Contexto
Una lectura se crea en el teléfono, a menudo sin conexión, así que su identificador debe generarse localmente. Debe servir para dos fines: impedir un segundo registro del mismo medidor en el mismo mes (R10) y permitir comprobar en el servidor si una lectura ya llegó antes de reenviarla (R9). El sistema de la oficina simulado no impone restricciones de unicidad ni ofrece claves de idempotencia propias (ver ADR-013). Además, el servidor asigna su propio identificador a cada registro, que es un dato distinto de la identidad de negocio de la lectura.

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
|---|---|---|
| UUID aleatorio generado en el teléfono | Identificador único sin colisiones. | Requiere una dependencia o código extra para generarlo, y además una restricción aparte (`UNIQUE medidor + periodo`) para R10. Son dos mecanismos para dos problemas. |
| Identificador autoincremental local | Muy simple. | No sirve para buscar la lectura en el servidor, porque el servidor no conoce ese número. |
| Clave de negocio `MED-123456_2026-10` (medidor + periodo) | Un solo valor resuelve R10 y R9. Se puede enviar al servidor y consultar con ella. No necesita dependencias. | Depende del reloj del teléfono. Queda atada al mes calendario. |

## Decisión
Cada lectura tiene tres campos con funciones distintas:

| Campo | Función |
|---|---|
| `medidor_codigo` | Medidor al que corresponde la lectura. |
| `periodo` | Mes de registro en formato `YYYY-MM`, calculado con la fecha local del teléfono al guardar. |
| `clave_unica` | Identidad de negocio: `${codigo}_${periodo}`. Es la clave primaria local y se envía al servidor como `claveLectura`. |

En SQLite hay además `UNIQUE (medidor_codigo, periodo)` (ADR-002). El identificador que devuelve el servidor se guarda aparte en `remote_id`. No se asume que el servidor respete un `id` enviado por la app: eso se comprueba con una prueba previa contra MockAPI. Si lo respeta, se puede enviar también como `id`; si no, la identidad de negocio se busca por `claveLectura` (ADR-011).

## Consecuencias
- Se gana una sola regla para R10 y R9 y ninguna dependencia.
- Separar `clave_unica` de `remote_id` evita confundir la identidad de negocio con la del servidor.
- Riesgo: si el reloj del teléfono está mal configurado, el periodo y la clave serán incorrectos.
- Una lectura enviada por error no puede repetirse en el mismo mes. Es coherente con R10, pero exige que el flujo de corrección solo sirva para lecturas pendientes.
- El periodo se fija al guardar: una lectura tomada el último día del mes y enviada después sigue perteneciendo al mes en que se registró.

## Verificación
- El esquema de `lecturas` incluye `clave_unica` como clave primaria, `remote_id` y la restricción `UNIQUE`.
- Intentar registrar el mismo medidor dos veces en el mismo mes es rechazado antes de abrir el asistente o al guardar.
- Antes de implementar el envío se prueba en MockAPI si respeta un `id` enviado en la creación; el resultado se registra en `DISEÑO.md` y define si el `id` se envía además de `claveLectura`.
- En el servidor simulado no aparecen dos lecturas con la misma `claveLectura` tras las pruebas de corte de señal.

## Uso de IA

Consulté a Claude sobre cómo evitar registros duplicados al guardar y sincronizar las lecturas. Inicialmente, recomendó utilizar una clave de negocio como identificador, formada por el código del medidor y el período de lectura (`MED-xxxxxx_AAAA-MM`). De esta manera, se puede identificar una lectura correspondiente a un mismo medidor y mes, sin incorporar una biblioteca adicional. En una revisión posterior del diseño, se recomendó separar esta clave del identificador asignado por el servidor.

**Decisión personal:** Elegí utilizar `MED-xxxxxx_AAAA-MM` como identidad de negocio de cada lectura, ya que permite reconocer el medidor y el mes al que corresponde. Esta clave sirve para comprobar si ya existe una lectura para ese período (R10) y para identificar el mismo registro durante los reintentos de sincronización (R9). Descarté utilizar un UUID como única solución porque, aunque identifica cada registro de forma única, no impide por sí solo crear dos lecturas para el mismo medidor y mes; además, sería necesario implementar una restricción adicional para controlar esa duplicidad.

También decidí mantener `remote_id` separado, para distinguir la identidad utilizada por la aplicación de la que asigna el servidor. Así, ambos identificadores cumplen funciones diferentes y se evita confundirlos.

Como limitación, acepto que el período incluido en la clave depende de la fecha y hora del teléfono. Por ello, la aplicación debe obtener y validar correctamente el período de lectura para evitar que una fecha incorrecta genere una identidad equivocada.
