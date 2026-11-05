# ADR-008: Copiar la foto al directorio de documentos de la app con expo-file-system

## Estado
Aceptado.

## Fecha
2026-10-27

## Requisitos relacionados
R7 (la foto debe conservarse aunque pasen varios días y tras reiniciar el teléfono) y R8.

## Contexto
La cámara deja la foto en una ubicación temporal que el sistema puede limpiar cuando necesita espacio. La foto de una lectura pendiente debe seguir disponible varios días y después de reiniciar el teléfono, hasta que la lectura se envíe. Una foto puede pesar desde cientos de kilobytes hasta varios megabytes. La base local (ADR-002) guarda una referencia a la foto. Las rutas absolutas de archivos pueden cambiar entre actualizaciones o instalaciones de la app.

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
|---|---|---|
| Dejar la foto donde la entrega la cámara y guardar su URI | Cero código adicional. | La ubicación es temporal: el archivo puede desaparecer antes del envío, y R7 se incumple. |
| Guardar la foto en base64 dentro de SQLite | Todo en un solo lugar, sin manejar archivos. | Infla la base con megabytes por registro y ralentiza las consultas de la lista. |
| Guardar en la galería con expo-media-library | La foto queda visible para el usuario. | Pide otro permiso, mezcla fotos de trabajo con personales y agrega una dependencia sin requisito propio. |
| Copiar al directorio de documentos de la app (expo-file-system) | Almacenamiento persistente y privado de la app. La base guarda solo el nombre del archivo. | Hay que gestionar archivos: copiar, borrar y reconstruir rutas. Nueva dependencia. |

## Decisión
Al aceptar la foto, se copia de inmediato al directorio de documentos de la app, en una subcarpeta de lecturas, con el nombre derivado de la clave de la lectura (ADR-010). En SQLite se guarda solo el nombre relativo; la ruta completa se reconstruye al leer. Al descartar una lectura o un borrador, se borra su archivo. Tras el envío, la foto se conserva localmente como respaldo.

## Consecuencias
- Se instala una dependencia (`expo-file-system`), justificada por R7.
- La base se mantiene liviana.
- Costo: el almacenamiento crece con cada foto conservada; la limpieza de fotos de lecturas enviadas queda pendiente como mejora.
- Riesgo: la API de `expo-file-system` cambió entre versiones del SDK; hay que consultar la documentación de la versión 57 antes de implementar.
- Si el archivo se borra desde fuera de la app, la referencia queda rota; la pantalla debe tolerar un archivo inexistente.

## Verificación
- La base solo almacena nombres de archivo, nunca contenido de imagen.
- Tomar una foto sin conexión, reiniciar el teléfono, abrir la lectura pendiente y ver la foto.
- Descartar un borrador elimina su archivo.

## Uso de IA

Consulté a Claude sobre cómo almacenar las fotografías de los medidores para conservarlas mientras las lecturas estén pendientes de sincronización. Recomendó copiar las imágenes al directorio de documentos de la aplicación y guardar en SQLite únicamente la ruta del archivo. También desaconsejó utilizar la caché como almacenamiento permanente o guardar las imágenes codificadas en Base64 dentro de la base de datos.

**Decisión personal:** Elegí guardar las fotografías en el directorio de documentos de la aplicación porque los archivos de la cámara o de la galería pueden encontrarse en ubicaciones temporales. Necesito conservar las imágenes durante varios días, incluso si la lectura todavía no se ha enviado al servidor, como requiere R7.

Descarté almacenar las fotografías en Base64 dentro de SQLite porque aumentaría el tamaño de la base de datos y dificultaría la gestión de archivos grandes. También decidí no copiarlas a la galería del dispositivo, ya que no es necesario que las fotografías de trabajo aparezcan entre las imágenes personales del técnico.

Reconozco que conservar los archivos localmente hará que el espacio ocupado por la aplicación aumente con el tiempo. Por el momento, priorizaré conservar las fotografías de las lecturas pendientes y dejaré la limpieza automática de las imágenes que ya se hayan enviado correctamente como una mejora futura.
