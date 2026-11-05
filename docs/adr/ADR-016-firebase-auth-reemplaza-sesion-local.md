# ADR-016: Autenticar con Firebase Authentication (reemplaza a ADR-012)

## Estado
Aceptado. Reemplaza a ADR-012.

## Fecha
2026-11-02

## Requisitos relacionados
A1, A2, A3, A4, A5, A6, A7, A9, A10 (ver `CONTEXTO_AUTH.md`).

## Contexto
ADR-012 identificaba al técnico con usuarios fijos escritos en el código y guardaba su código de empleado en `expo-secure-store`. Eso no es autenticación contra un servidor y no permite registro, recuperación de contraseña ni verificación de correo. El Deber 5 pide migrar el acceso a Firebase Authentication con la lógica del taller de clase (registro, inicio de sesión, recuperación y cambio de contraseña), verificación de correo, edición del nombre y sesión persistente.

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
|---|---|---|
| Mantener usuarios fijos + SecureStore (ADR-012) | Sin cambios. | No cumple lo pedido; no hay cuentas reales. |
| React Native Firebase (`@react-native-firebase`) | Librería nativa más completa. | Exige development build; no funciona en Expo Go. |
| **SDK web `firebase` (JS)** | Funciona en Expo Go y en APK. Es lo practicado en clase. | La sesión requiere persistencia manual con AsyncStorage. |

## Decisión
Se usa el paquete `firebase` (SDK JS) con `initializeAuth` y `getReactNativePersistence(AsyncStorage)`. Solo `src/lib/firebase.ts`, `src/services/authService.ts` y `src/services/erroresAuth.ts` importan `firebase/*`. `SesionContext` expone el estado `cargando | no_autenticado | sin_verificar | autenticado` y las rutas se protegen con tres grupos de `Stack.Protected`. Solo las cuentas con correo verificado acceden al grupo `(app)`.

`tecnicoCodigo` pasa a tomar el `uid` de Firebase **de forma temporal**, para no modificar el contrato de lecturas (API, SQLite, `registroService`). `expo-secure-store` deja de usarse y se retira.

## Consecuencias
- Se agrega la dependencia `firebase`; se retira `expo-secure-store`. AsyncStorage ya estaba instalado (ADR-015).
- La sesión sobrevive al cierre de la app; la sesión local previa deja de existir.
- **Limitación:** `uid` y código operativo del técnico son conceptos distintos. No existe una vinculación autorizada cuenta↔técnico; el registro de cuentas es abierto.
- Las variables `EXPO_PUBLIC_FIREBASE_*` son configuración pública del cliente (no secretos); la seguridad real depende de la configuración de Firebase.
- Los enlaces de verificación y recuperación abren una página web de Firebase, no la app.
- SQLite (ADR-002) no cambia.

## Verificación
- `package.json` contiene `firebase` y no contiene `expo-secure-store`.
- Cerrar y abrir la app mantiene la sesión; cerrar sesión devuelve al login.
- Una cuenta sin verificar no puede abrir pantallas de `(app)`.
- Las lecturas registradas siguen enviándose con `tecnicoCodigo` presente.

## Uso de IA
## Uso de IA

Durante el análisis de la integración de Firebase Authentication en Lectura Ágil EPMAPS, consulté a la IA sobre cómo adaptar el sistema de autenticación del taller a la arquitectura existente del proyecto, procurando conservar la lógica de registro de lecturas, la sincronización y el almacenamiento local. La IA recomendó utilizar el **UID de Firebase** como identificador de la cuenta autenticada, ya que es único y permanece estable aunque el usuario cambie su correo electrónico. También recomendó mantener separada la autenticación de Firebase de la identificación operativa del técnico utilizada por los módulos de EPMAPS.
Después de analizar esta recomendación, decidí utilizar temporalmente el `uid` de Firebase como valor de `tecnicoCodigo` para mantener la compatibilidad con los componentes existentes que necesitan identificar al usuario que registra una lectura. Tomé esta decisión como una solución de transición, porque permite integrar la autenticación sin modificar inmediatamente las estructuras, ni los servicios de registro y sincronización.
Reconozco que el `uid` y el código institucional del técnico representan conceptos diferentes. Por ello, esta decisión no significa que sean equivalentes de forma permanente. En una siguiente etapa, se deberá implementar una vinculación entre la cuenta de Firebase y el código real del técnico autorizado, evitando afectar la trazabilidad de las lecturas.La decisión final fue aprovechar Firebase Authentication para gestionar las cuentas y las sesiones, conservar temporalmente la compatibilidad con la aplicación existente y documentar esta limitación para una futura mejora arquitectónica.