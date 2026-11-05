# ADR-007: Capturar la foto del medidor con expo-image-picker

## Estado
Aceptado.

## Fecha
2026-10-27

## Requisitos relacionados
R7 (permiso de cámara y foto obligatoria u opcional) y R8 (recuperar el trabajo si la app se cierra).

## Contexto
La foto es obligatoria con consumo anómalo o medidor dañado y opcional en los demás casos. Si el técnico no concede el permiso de cámara, la app debe explicarle por qué lo necesita y dejarlo continuar solo cuando la foto no es obligatoria. El técnico trabaja en campo, normalmente con una mano, en teléfonos Android de gama variada. En Android el sistema puede cerrar el proceso de la app mientras otra aplicación (la cámara) está abierta. No se necesita vista previa propia, superposiciones ni procesamiento de imagen. El plazo es de dos días y ya existe experiencia con esta librería.

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
|---|---|---|
| expo-camera | Cámara dentro de la app, sin salir de ella, y sin el riesgo de que Android cierre la app mientras se abre otra. | Hay que construir la pantalla de cámara (vista previa, botón, flash, errores). Más código y más puntos de fallo en dos días. |
| react-native-vision-camera | Control avanzado de la cámara. | No hay requisito que lo necesite. Configuración nativa más compleja y dependencia de terceros. |
| expo-image-picker | Abre la cámara del sistema, que ya maneja enfoque, flash y orientación. Ya usada en proyectos anteriores. Ofrece el hook de permisos de cámara y calidad de compresión. | No se controla la interfaz de la cámara. El resultado depende de la cámara de cada fabricante. Android puede cerrar la app mientras la cámara está abierta. |

## Decisión
Se usa `expo-image-picker` con `launchCameraAsync` y calidad de compresión moderada. Antes de pedir el permiso se muestra una pantalla propia que explica el motivo. Si el permiso queda denegado de forma definitiva, se ofrece abrir los ajustes. Si la foto no es obligatoria, se permite continuar sin ella; si lo es, no se puede avanzar. El texto del permiso se declara en el plugin de `app.json`. Si Android cerró la app durante la captura, al arrancar se recupera el resultado pendiente con `getPendingResultAsync`.

## Consecuencias
- Se instala una dependencia (`expo-image-picker`), justificada por R7.
- Se pierde el control de la interfaz de cámara y su comportamiento varía entre dispositivos.
- Riesgo: el cierre del proceso durante la captura. Se mitiga con el borrador persistente (ADR-004) y la recuperación del resultado pendiente.
- La calidad de la imagen es el único control sobre el tamaño del archivo.

## Verificación
- `package.json` contiene `expo-image-picker` y no `expo-camera`.
- Con el permiso de cámara denegado, aparece la explicación; con la foto opcional se puede continuar y con la obligatoria no.
- Con consumo anómalo o medidor dañado, el registro no avanza sin foto.

## Uso de IA

Consulté a Claude sobre qué biblioteca utilizar para capturar fotografías de los medidores. Inicialmente, recomendó `expo-camera` porque permite controlar la cámara desde la aplicación. Después de considerar la experiencia previa con `expo-image-picker` y el tiempo disponible para desarrollar el proyecto, recomendó mantener esta última alternativa y tomar medidas para recuperar el registro si la aplicación se interrumpe.

**Decisión personal:** Elegí `expo-image-picker` por mi experiencia previa, ya que, permite tomar o seleccionar fotografías sin tener que desarrollar una interfaz de cámara propia. Esto reduce el trabajo de implementación y me permite concentrarme en los requisitos de registro y almacenamiento de lecturas.

Descarté `expo-camera` porque ofrece un control más directo sobre la cámara, pero requeriría implementar una interfaz y gestionar su funcionamiento, algo que no considero indispensable para las necesidades actuales. También descarté `react-native-vision-camera` porque sus capacidades adicionales no se justifican para este proyecto.

Reconozco que Android puede cerrar o recrear la actividad de la aplicación mientras se utiliza una aplicación externa de cámara o galería. Para reducir el riesgo de perder información, implementaré el guardado persistente del borrador y la recuperación del resultado de la fotografía al regresar a la aplicación. Estas medidas deberán probarse en el dispositivo Android.
