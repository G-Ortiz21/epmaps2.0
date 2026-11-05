# ADR-018: Ubicación obligatoria por lectura y animaciones de estado

## Estado
Aceptado.

## Contexto
ADR-017 decidió la captura puntual con Expo Location, selección manual con
Leaflet/WebView y persistencia local en SQLite, pero acotó esa fase inicial
al servicio de GPS. La implementación completa necesita mantener una
ubicación asociada a cada lectura nueva y permitir recuperar lecturas
históricas, que no tendrán coordenadas.

La aplicación ya mantiene el borrador en React Context/SQLite, las lecturas
en SQLite y su envío en el motor existente de MockAPI. TanStack Query se
utiliza para la consulta compartida de medidores y no se empleará para
capturas de sensores ni para duplicar el historial local.

## Decisión
- Cada lectura nueva requiere un par de coordenadas válidas antes de
  confirmarse. El GPS puntual es la opción inicial; el técnico puede ajustar
  o elegir un punto manualmente si el permiso está denegado, el servicio no
  está disponible o la precisión supera el umbral documentado en el servicio.
- La ubicación pertenece a la lectura. Se guardan latitud, longitud, origen
  (`gps` o `manual`) y precisión GPS nullable. Los puntos manuales tienen
  precisión nula.
- La ubicación se mantiene en `RegistroContext` y el JSON del borrador.
  Lecturas existentes se conservan con campos nullable mediante una
  migración SQLite aditiva, sin reconstruir tablas ni inventar posiciones.
- El mapa Leaflet se presenta en `react-native-webview`. Los mensajes del
  mapa se limitan a coordenadas JSON validadas; la navegación externa queda
  bloqueada. Las teselas estándar de OpenStreetMap requieren red, atribución
  visible y cumplimiento de su política; GPS y guardado local siguen
  disponibles sin mapa o conexión.
- El payload de ubicación se agrega a la lectura que ya envía el motor
  MockAPI. No se crea una cola nueva ni una consulta/mutación TanStack.
- `lottie-react-native` reproduce dos animaciones locales creadas para este
  proyecto: radar durante la captura y confirmación de lectura solo tras
  completar el guardado local. No afirman que MockAPI haya sincronizado la
  lectura.

## Consecuencias
- Se agregan `leaflet`, `react-native-webview` y `lottie-react-native`, además
  de `expo-location` justificado por ADR-017. Las versiones deben ser
  compatibles con Expo SDK 57 y React Native 0.86.
- Se añade una migración aditiva de `lecturas`; datos históricos permanecen
  válidos y sin ubicación.
- La obligatoriedad se verifica en dominio/servicio y de nuevo al confirmar,
  no solo en la interfaz.
- La capa cartográfica de OSM no se promete offline; la lectura sí puede
  guardarse con GPS offline o un punto manual proporcionado por el técnico.
- Las animaciones son recursos originales en formato Lottie, sin descargar
  activos de terceros ni incorporar una licencia de arte externa.

## Verificación
- La migración preserva las filas existentes y deja ubicación nula en las
  lecturas previas.
- Una nueva lectura no se guarda sin ubicación válida y acepta tanto un
  punto GPS con precisión válida como un punto manual sin precisión.
- El borrador antiguo se puede recuperar; antes de confirmar se exige
  completar su ubicación.
- Las coordenadas aparecen en el payload existente y se recuperan desde el
  historial local; registros antiguos muestran «Ubicación no registrada».
- Las animaciones solo representan captura GPS y éxito local después del
  guardado. Permisos, mapa y ubicación deben probarse en un APK instalado.