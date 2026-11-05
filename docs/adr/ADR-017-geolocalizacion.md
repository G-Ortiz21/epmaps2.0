# ADR-017: Captura puntual de ubicación por lectura

## Estado
Aceptado.

## Contexto
El registro de lecturas se realiza en campo y debe conservarse localmente
cuando el dispositivo no tiene conexión. La ubicación describe el lugar de
la lectura, no una propiedad permanente del medidor. El proyecto utiliza
Expo SDK 57, guarda lecturas y borradores en SQLite, consulta medidores con
TanStack Query y envía lecturas con el mecanismo MockAPI existente.

## Decisión
- Usar `expo-location` compatible con Expo SDK 57 para una captura puntual
  mediante `getCurrentPositionAsync`; no iniciar seguimiento continuo ni
  ubicación en segundo plano.
- Solicitar únicamente permiso de ubicación en primer plano, cuando el
  técnico solicite capturar su posición.
- Usar Leaflet dentro de `react-native-webview` para el mapa interactivo y
  OpenStreetMap como fuente de teselas, con atribución visible y respetando
  la política del proveedor.
- Asociar ubicación a cada lectura, nunca al medidor.
- Mantener SQLite como persistencia local de lecturas y borradores. La
  ubicación es nullable para conservar lecturas históricas existentes.
- Conservar TanStack Query únicamente en las consultas de medidores que ya
  lo utilizan; no crear una caché paralela para posiciones GPS.
- Conservar el cliente, la cola offline y el mecanismo de sincronización
  MockAPI existentes; las coordenadas se incorporarán al mismo registro
  cuando se complete la fase de persistencia e integración.
- Permitir captura GPS como primera opción y selección manual como
  alternativa. La regla de obligatoriedad de ubicación se aplicará al
  confirmar una lectura nueva en la fase que integre el formulario y el
  almacenamiento; esta decisión no cambia lecturas históricas.

## Consecuencias
- `expo-location` requiere permisos Android de primer plano (`ACCESS_COARSE_LOCATION`
  y `ACCESS_FINE_LOCATION`) y una explicación de uso para el usuario. No se
  habilitarán `ACCESS_BACKGROUND_LOCATION` ni servicios de seguimiento.
- `expo-location`, WebView y Leaflet requieren cambios en una compilación
  nativa para probarse de forma representativa en APK.
- Las teselas estándar de OpenStreetMap requieren conexión para áreas no
  almacenadas en caché; no se ofrecerá descarga anticipada ni uso offline.
- Si no se obtiene GPS, la futura interfaz permitirá ubicación manual; si
  no existe una ubicación válida, la fase de integración bloqueará la
  confirmación de una lectura nueva.
- La lectura sin coordenadas seguirá siendo válida al mapear datos
  históricos y migrar el esquema.

## Límites de esta decisión
Esta fase solo incorpora el servicio de captura GPS, validación de posición,
permisos nativos y pruebas unitarias del servicio. No modifica SQLite,
formularios, historial, API, sincronización ni TanStack Query. La persistencia,
el mapa y la obligatoriedad al confirmar quedan para fases posteriores.

## Referencias
- Expo Location SDK 57: https://docs.expo.dev/versions/v57.0.0/sdk/location/
- React Native WebView SDK 57: https://docs.expo.dev/versions/v57.0.0/sdk/webview/
- OpenStreetMap Tile Usage Policy: https://operations.osmfoundation.org/policies/tiles/