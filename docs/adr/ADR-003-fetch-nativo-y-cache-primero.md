# ADR-003: Consultar la oficina con fetch nativo y usar la base local como caché de medidores

## Estado
Reemplazado por ADR-015 en lo que respecta a la caché de consultas de medidores. El uso de `fetch` nativo con `AbortController` y la clasificación de errores se mantiene vigente.

## Fecha
2026-10-27

## Requisitos relacionados
R2, R3 y R9 (también R4, porque se compara con la lectura anterior).

## Contexto
Los datos del medidor vienen de una API REST del sistema de la oficina. La conexión es intermitente: con señal débil una petición puede quedarse esperando mucho tiempo. La aplicación debe distinguir tres situaciones para el técnico: sin conexión, medidor no encontrado y error del servidor. R2 prohíbe consultar con un código incompleto. R3 exige mostrar los siete datos y que una segunda consulta del mismo medidor funcione incluso sin señal, sin esperar una nueva descarga durante la jornada. Los datos del medidor cambian poco durante un día. Ya existe una base local (ADR-002).

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
|---|---|---|
| TanStack Query con persistencia | Caché, reintentos y estados de carga resueltos. | Agrega una dependencia y una segunda capa de persistencia que duplica la base local. Su caché no es consultable por el motor de envío ni por R4. |
| axios con caché manual | Interceptores y timeouts integrados. | Dependencia sin requisito propio: `fetch` con `AbortController` cubre el timeout. |
| `fetch` nativo con caché en la base local | Sin dependencias. La caché vive en la misma base que las lecturas, así R4 puede leerla. Control total del timeout y de la clasificación de errores. | Hay que escribir el timeout, la clasificación de errores y la regla de caducidad. |

## Decisión
Se usa `fetch` con `AbortController` y un timeout de 10 segundos. Un único módulo (`src/api/client.ts`) hace las peticiones y clasifica los errores en `SIN_RED`, `NO_ENCONTRADO` y `SERVIDOR`. La consulta es caché primero:
- Si hay una fila en `medidores_cache` descargada el mismo día calendario local, se devuelve sin llamar a la red.
- Si no hay caché, o es de otro día, y hay red, se descarga y se reemplaza.
- Sin red se usa cualquier caché existente, mostrando la fecha de descarga.
- Sin red y sin caché, se informa y se permite registrar igualmente (ADR-011).
Antes de cualquier consulta, el código se valida con las reglas del ADR-005.

## Consecuencias
- No se agrega ninguna dependencia.
- La "última lectura" mostrada puede estar desactualizada hasta un día si la oficina la actualiza durante la jornada. Es un costo aceptado.
- Hay que tratar el caso de que la API simulada devuelva 404 cuando un filtro no encuentra resultados, y mapearlo a `NO_ENCONTRADO` (verificar el comportamiento real).
- Todo `fetch` pasa por un solo archivo; llamar a `fetch` desde una pantalla rompe esta decisión.

## Verificación
- `fetch` aparece solo en `src/api/`.
- Con señal, se consulta un medidor y se ven los siete datos. Se activa el modo avión y la segunda consulta del mismo medidor funciona sin error.
- Con un código incompleto no se genera ninguna petición.
- Un código inexistente muestra "no encontrado", distinto de "sin conexión".

## Uso de IA

Consulté a Claude sobre cómo cumplir el requisito R3, que consiste en consultar la información de los medidores y guardarla localmente para evitar descargarla repetidamente durante la jornada. Me recomendó utilizar `fetch` para consultar la API y SQLite para almacenar la información en el dispositivo.

**Decisión personal:** Elegí `fetch` con caché en SQLite porque la aplicación necesita una base de datos local para trabajar sin conexión. De esta manera, puedo reutilizar la información guardada para consultar los medidores y apoyar la comparación de lecturas cuando no haya internet, según el requisito R4.

Descarté TanStack Query porque, para las necesidades actuales del proyecto, añadir su mecanismo de caché persistente podría duplicar responsabilidades con SQLite. También descarté Axios porque `fetch`, junto con `AbortController`, es suficiente para realizar las solicitudes y cancelarlas cuando sea necesario.

Establecí que la información de un medidor se reutilice durante el mismo día calendario para evitar descargarla nuevamente en cada consulta. Acepto que los datos mostrados podrían no reflejar cambios recientes durante ese período, por lo que la información almacenada se actualizará cuando corresponda según esta regla de caché.
