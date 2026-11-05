# Lectura Ágil EPMAPS

Aplicación móvil (Expo SDK 57, React Native y TypeScript) para registrar en campo las lecturas de los medidores de agua, con o sin conexión, y enviarlas al sistema de la oficina.

Antes de escribir código, lee `DISEÑO.md` (requisitos, reglas y pruebas) y los ADR de `docs/adr/`. Si una instrucción contradice un ADR, no la sigas automáticamente: informa del conflicto, explica por qué existe y solicita una decisión antes de modificar la arquitectura.

## Comandos

| Tarea | Comando |
|---|---|
| Instalar dependencias del proyecto | `npm install` |
| Instalar un paquete de Expo | `npx expo install <paquete>` (no uses `npm install` directamente para instalar módulos de Expo) |
| Servidor de desarrollo | `npx expo start` |
| Comprobar tipos | `npx tsc --noEmit` |
| Lint | `npx expo lint` |
| Revisar compatibilidad de versiones | `npx expo install --check` y `npx expo-doctor` |
| Generar APK para pruebas | `npx eas-cli@latest build -p android --profile preview` |

La cámara, el modo avión, la persistencia de datos y el almacenamiento de fotografías deben probarse en el APK instalado, no únicamente en Expo Go.

Antes de utilizar una API de Expo, comprueba que sea compatible con Expo SDK 57 y con las versiones instaladas en el proyecto.

## Arquitectura

Las rutas están en `src/app/`, mediante Expo Router. El resto de `src/` se organiza en capas con responsabilidades específicas.

```text
src/
  app/          Pantallas y layouts (Expo Router)
  components/   Componentes de interfaz (ui y shared)
  theme/        Colores, tipografía y espaciado
  domain/       Reglas de negocio puras
  data/         SQLite: migraciones y repositorios
  api/          Cliente HTTP y recursos de la API
  services/     Casos de uso
  sync/         Motor de envío de lecturas pendientes
  contexts/     Sesión, conexión y registro en curso

docs/adr/       Registro de decisiones de arquitectura
```

### Dependencias entre capas

```text
src/app             → components, contexts, services, theme
src/services        → domain, data/repositories, api
src/sync            → services, domain, data/repositories, api
src/data/repositories → data/database, data/eventos
src/api             → domain (solo tipos), config
src/domain          → ninguna capa externa
```

Respeta estas reglas:

- `src/domain/` no importa `react` ni módulos `expo-*`.
- Las sentencias SQL se escriben únicamente en `src/data/`.
- Las llamadas a `fetch()` se realizan únicamente en `src/api/client.ts`.
- El motor `src/sync/syncEngine.ts` no importa React ni depende de que una pantalla esté montada.
- Los componentes que no sean pantallas deben ubicarse fuera de `src/app/`, ya que los archivos de esa carpeta participan en el sistema de rutas de Expo Router.
- No crees archivos ni carpetas duplicados si ya existe una estructura equivalente.
- Antes de modificar un módulo, revisa su contenido actual, sus importaciones y los módulos que dependen de él.

## Dependencias

No agregues una dependencia nueva sin documentar y justificar su incorporación mediante un ADR en `docs/adr/`. Las dependencias incluidas en la plantilla de Expo están exentas de esta regla.

### Dependencias del proyecto

- `expo-sqlite`
- `expo-secure-store`
- `expo-network`
- `expo-file-system`
- `expo-image-picker`
- `@tanstack/react-query`
- `@tanstack/react-query-persist-client`
- `@tanstack/query-async-storage-persister`
- `@react-native-async-storage/async-storage`

Prefiere módulos del ecosistema Expo cuando cubran las necesidades del proyecto.

No incorpores las siguientes bibliotecas, porque se evaluaron y descartaron en los ADR:

- Zustand
- Zod
- Axios
- React Hook Form
- Formik

No las reinstales ni las sustituyas por otras equivalentes sin una justificación documentada.

Si no estás seguro de una API de Expo para SDK 57, consulta la documentación correspondiente a esa versión antes de implementarla. No supongas que una API de otra versión funciona igual.

## Reglas de negocio

### Identificación del medidor

- El código debe cumplir la expresión regular `/^MED-\d{6}$/`.
- Valida el código tanto en la pantalla como en el servicio correspondiente.
- Si el código es inválido, no se realiza ninguna petición al servidor.
- No confundas el estado que registra el técnico con el estado administrativo del medidor en la oficina.

### Estados del medidor

Los estados seleccionados por el técnico son:

- `normal`
- `inaccesible`
- `danado`

Los estados de oficina pueden incluir `activo`, `suspendido` u otros valores provenientes de la API. Son conceptos diferentes y no deben mezclarse.

Reglas por estado:

- **Normal:** exige una lectura numérica.
- **Inaccesible:** exige un motivo y no admite una lectura.
- **Dañado:** exige una descripción; la lectura es opcional.

### Lecturas y consumo

- Las lecturas son números enteros no negativos.
- La lectura actual no puede ser menor que la lectura anterior, cuando esta se conoce.
- El consumo se calcula como `lectura actual - lectura anterior`.
- El consumo es anómalo cuando es estrictamente mayor que tres veces el promedio mensual.
- Si el consumo es exactamente tres veces el promedio, no se considera anómalo.
- Una lectura que no pueda compararse por falta de datos previos debe quedar pendiente de verificación cuando corresponda.

### Fotografías

- La fotografía es obligatoria si el medidor está dañado o si el consumo es anómalo.
- En los demás casos, la fotografía es opcional.
- La aplicación debe conservar las fotografías necesarias aunque se cierre o reinicie el teléfono.
- Una fotografía tomada se copia al directorio de documentos de la aplicación mediante la API compatible con SDK 57.
- En SQLite se guarda únicamente el nombre de la fotografía, no su contenido en Base64.
- No elimines una fotografía pendiente de envío mientras todavía sea necesaria para completar o sincronizar su lectura.
- Si la cámara no está disponible o se deniega un permiso, informa al usuario y permite continuar cuando la fotografía no sea obligatoria.
- No permitas enviar una lectura que requiere una fotografía obligatoria si esta todavía no está disponible.

### Período e identidad de la lectura

- El período tiene el formato `AAAA-MM`.
- Se calcula con la fecha local del teléfono al guardar la lectura.
- La clave de negocio se construye como `${codigo}_${periodo}`.
- La clave se utiliza como identidad local y se envía al servidor mediante el campo `claveLectura`.
- SQLite debe imponer `UNIQUE (medidor_codigo, periodo)` para evitar dos lecturas del mismo medidor durante el mismo período en el almacenamiento local.
- No confundas la clave de negocio con el identificador que asigna el servidor, almacenado en `remote_id`.
- La fecha del dispositivo puede ser incorrecta y provocar que una lectura quede asociada a un período equivocado. No afirmes que el reloj del teléfono garantiza la fecha correcta.

### Estados de verificación y envío

El estado de verificación y el estado de envío representan aspectos diferentes de una lectura. No los combines en un único campo.

**Estado de verificación (`verificacion`):**

- `verificada`: se dispone de los datos necesarios y se completaron las comprobaciones correspondientes.
- `pendiente_verificar`: la lectura requiere consultar o confirmar los datos del medidor, por ejemplo, porque se registró sin conexión o no había datos previos.
- `requiere_accion`: la lectura necesita una acción del técnico, como completar una fotografía o confirmar un consumo anómalo.

**Estado de envío (`sync_estado`):**

- `pendiente`: la lectura está guardada localmente y puede ser candidata a sincronización cuando cumpla las condiciones necesarias.
- `enviando`: se está intentando enviar la lectura.
- `enviada`: el servidor confirmó el registro o la aplicación verificó de forma fiable que el registro correspondiente ya existía.
- `error`: el intento de envío falló y la lectura debe conservarse para su posterior recuperación o reintento.

Respeta las siguientes reglas:

- Una lectura registrada sin conexión, o sin datos previos suficientes para verificarla, queda `pendiente_verificar`.
- Antes de enviar una lectura `pendiente_verificar`, el motor de sincronización consulta los datos actuales del medidor, actualiza la caché y recalcula el consumo y la anomalía.
- Si no hay anomalía y se cumplen las demás condiciones, la lectura puede pasar a `verificada` y continuar con el envío.
- Si existe una anomalía y falta la confirmación o la fotografía obligatoria, la lectura pasa a `requiere_accion` y no se envía.
- La interfaz debe indicar claramente la acción pendiente.
- El motor no debe enviar lecturas que todavía requieren verificación o una acción del técnico.
- Las lecturas con estado de envío `error` deben conservarse localmente. Antes de reintentarlas, aplica las comprobaciones necesarias para evitar duplicados.
- Un fallo de red no debe provocar la pérdida de una lectura ni de su fotografía.
- Una lectura enviada no puede editarse.
- Solo se puede actualizar una lectura cuyo estado de envío sea `pendiente`, de acuerdo con las reglas de edición de R10. Si se requiere corregir otra situación, informa del conflicto en lugar de modificar una lectura enviada.

No cambies estos nombres de estado sin revisar las migraciones, los repositorios, los servicios, el motor de sincronización y los componentes que los utilizan.

### Sincronización y prevención de duplicados

- La sincronización automática se ejecuta mientras la aplicación está abierta y puede conectarse al servidor.
- El motor de sincronización no depende de que una pantalla esté montada.
- Antes de enviar una lectura, consulta al servidor utilizando su clave de negocio. Nunca envíes a ciegas una lectura pendiente.
- Si el registro ya existe, verifica que corresponda a la lectura esperada antes de marcarla como enviada.
- Si el registro no existe, intenta enviarlo y conserva la lectura local si la operación falla.
- Un corte de conexión puede hacer que el servidor guarde la lectura sin que la aplicación reciba la respuesta. Los reintentos deben considerar este escenario.
- MockAPI no impone por sí solo la unicidad necesaria para garantizar que dos dispositivos no creen simultáneamente el mismo registro.
- No afirmes que existe una garantía de entrega exactamente una vez en todos los escenarios.
- La sincronización no se ejecuta en segundo plano cuando la aplicación está cerrada. Se reanuda cuando la aplicación vuelve a abrirse y se cumplen las condiciones necesarias.

### Caché de medidores

- Los datos satisfactorios de un medidor se persisten en AsyncStorage durante 24 horas; con conexión, la consulta se revalida pasados 5 minutos (ADR-015).
- Si existe conexión, utiliza la API según las reglas de consulta y actualización de caché.
- Sin conexión, permite utilizar cualquier dato almacenado en caché, aunque haya superado su período de validez.
- No presentes datos almacenados como si estuvieran necesariamente actualizados. Cuando corresponda, informa que se están utilizando datos locales.
- Los datos actuales del servidor deben utilizarse para verificar el consumo antes de sincronizar una lectura pendiente de verificación.

### Sesión

- No guardes la contraseña del técnico en el teléfono.
- Guarda únicamente el código del empleado en `expo-secure-store`, según la decisión de arquitectura.
- Mantén la sesión hasta que el usuario cierre sesión, de acuerdo con R1.
- No consideres que almacenar el código del empleado demuestra por sí solo que la autenticación es válida.
- No incorpores tokens, mecanismos de autenticación remota ni cambios en el flujo de acceso sin revisar los requisitos y ADR correspondientes.

## Diseño visual

La identidad visual se basa en el sitio de EPMAPS (`aguaquito.gob.ec`) y en los colores derivados de su logotipo. Consulta `DISEÑO.md`, sección 9.

- Los colores, tamaños, espaciados y fuentes deben definirse en `src/theme/`.
- No utilices valores hexadecimales ni tamaños arbitrarios directamente en las pantallas.
- Utiliza los colores según su función semántica (`marca`, `fondo`, `texto`, entre otros), no por el nombre de un tono.
- No utilices emojis como iconos. Usa `@expo/vector-icons` si está disponible en el proyecto y es compatible con la configuración instalada.
- Los estados como pendiente, enviada, error y anómalo deben representarse mediante un icono y texto, nunca únicamente mediante color.
- Los errores de validación se muestran junto al campo correspondiente. No utilices `Alert` para los errores de validación de formularios.
- La zona táctil mínima debe ser de 48 × 48 puntos.
- Mantén un contraste mínimo de 4,5:1 para texto normal.
- Utiliza títulos de sección cortos y en mayúsculas, tarjetas para agrupar datos y cifras grandes con una descripción pequeña debajo, siguiendo las referencias visuales de EPMAPS.
- No alteres el logotipo: utiliza la versión de color sobre fondos claros y la versión blanca sobre el fondo de marca.
- No modifiques las reglas de negocio para conseguir un efecto visual.

## Cómo trabajar

Trabaja de forma incremental y no realices cambios fuera del alcance solicitado.

### Orden de implementación

1. Tema y componentes.
2. Base de datos y migraciones.
3. Repositorios.
4. Dominio.
5. API y servicio de medidores.
6. Contextos y layout raíz.
7. Login.
8. Búsqueda y detalle del medidor.
9. Asistente de registro.
10. Fotografía.
11. Lista y edición de lecturas.
12. Motor de sincronización y banner de conexión.

Este orden orienta el trabajo, pero antes de comenzar cada módulo comprueba qué partes ya están implementadas y cuáles faltan.

### Antes de escribir código

1. Lee `DISEÑO.md` y los ADR relacionados con la tarea.
2. Inspecciona los archivos existentes y sus dependencias.
3. Identifica el requisito que se va a implementar o corregir.
4. Indica los archivos que se modificarán.
5. Explica las funciones que se crearán o cambiarán, sus entradas, salidas y posibles errores.
6. Señala cualquier contradicción entre el diseño, los requisitos y el código actual antes de realizar cambios.

### Después de escribir código

1. Ejecuta `npx tsc --noEmit`.
2. Ejecuta `npx expo lint`.
3. Si procede, ejecuta `npx expo install --check` y `npx expo-doctor`.
4. Informa de los comandos ejecutados y de sus resultados reales.
5. Explica cada función nueva o modificada en lenguaje sencillo.
6. Indica qué requisito de la rúbrica cubre cada cambio y cómo probarlo en el teléfono.
7. Diferencia claramente las pruebas ejecutadas de las pruebas pendientes.
8. No afirmes que una funcionalidad funciona si solo se ha comprobado que el código compila.
9. Si una prueba falla por una funcionalidad no implementada o por una configuración pendiente, informa del resultado y explica qué falta.
10. Si detectas un problema fuera del alcance solicitado, descríbelo sin modificar otros archivos.

### Restricciones de cambios

- Modifica únicamente los archivos necesarios para la tarea solicitada.
- No reemplaces archivos completos si basta con un cambio localizado.
- No elimines funciones existentes sin justificarlo.
- No agregues dependencias sin el ADR correspondiente.
- No cambies los nombres de rutas, estados, campos de base de datos o funciones públicas sin revisar sus usos.
- No declares que una regla de negocio está implementada si solo existe en la interfaz.
- Si una instrucción de este archivo contradice un requisito, una decisión de arquitectura o el comportamiento real del proyecto, explica la contradicción antes de resolverla.

## Migración de autenticación (Firebase, Uniwind y Reanimated)

Antes de tocar código lee `CONTEXTO_AUTH.md`. No leas `DISEÑO.md` ni los ADR salvo ADR-016 y los que ese archivo cite.

Esta migración tiene excepciones a las reglas anteriores, ya decididas en ADR-016:

- ADR-012 queda **reemplazado** por ADR-016: la sesión es de Firebase Authentication.
- Los imports de `firebase/*` se permiten **únicamente** en `src/lib/firebase.ts`, `src/services/authService.ts` y `src/services/erroresAuth.ts`.
- La configuración de Firebase se lee solo desde `src/config.ts`.
- `src/domain/` sigue sin importar `react`, `expo-*` ni `firebase`.
- **No modifiques `src/data/`** (SQLite se mantiene, ADR-002).
- Archivos nuevos o modificados: estilos con `className` (Uniwind), **sin `StyleSheet`**; imports relativos.
- Las animaciones usan `react-native-reanimated`; respeta "reducir movimiento".
- Antes de usar una API de Uniwind o Reanimated, consulta su documentación oficial (no la memoria).
- Una fase por sesión; al terminar ejecuta los comandos de verificación de `CONTEXTO_AUTH.md` §8.