# CONTEXTO_AUTH — Migración del acceso a Firebase Authentication

Contrato único para trabajar con IA en esta migración. **Léelo completo antes de tocar código.**
No leas `DISEÑO.md` ni los ADR salvo ADR-016 y los que este archivo cite.

## 1. Objetivo
Migrar el login local de Lectura Ágil EPMAPS a **Firebase Authentication** (misma lógica del taller de clase, incluidos sus dos retos) y agregar: indicador de fortaleza de contraseña, pantalla para editar el nombre, 5+ animaciones de Reanimated y estilos con **Uniwind** (sin `StyleSheet`). El registro de lecturas **no se modifica**.

## 2. Requisitos (marcar al probarlos en el teléfono)
| ID | Requisito | Fase |
|---|---|---|
| A1 | Iniciar sesión con correo y contraseña (Firebase) | 2 |
| A2 | Registrarse con nombre, correo y contraseña (guarda `displayName`) | 2 |
| A3 | Recuperar contraseña por correo (mensaje neutro, sin revelar si el correo existe) | 2 |
| A4 | Cambiar contraseña reautenticando con la actual | 2 |
| A5 | Sesión persistente al cerrar y abrir la app | 2 |
| A6 | Validaciones en el teléfono y errores de Firebase traducidos al español | 2 |
| A7 | **Reto:** verificación de correo con `sendEmailVerification`; solo cuentas verificadas llegan al inicio | 3 |
| A8 | **Reto:** animación shake cuando falla el login | 3 |
| A9 | Indicador débil / media / fuerte mientras se escribe la contraseña | 4 |
| A10 | Pantalla para editar el nombre con `updateProfile` | 4 |
| A11 | 5 animaciones de Reanimated con sentido para la app | 5 |
| A12 | **Toda** la app con Uniwind (`className`): cero `StyleSheet` en `src/` | 1–6 |
| A13 | Diseño propio, no genérico  | 5 |
 GitHub | 7 |

## 3. Decisiones tomadas
- **ADR-016** reemplaza a ADR-012 (la sesión pasa de SecureStore a Firebase + AsyncStorage). ADR-012 se marca "Reemplazado por ADR-016"; no se borra.
- **`tecnicoCodigo = uid` de Firebase, de forma temporal.** Se mantiene el nombre para no tocar la API de lecturas, SQLite ni `registroService`. Limitación documentada en ADR-016: no existe vinculación cuenta↔técnico.
- **SQLite se queda.** Lo exige ADR-002 (unicidad medidor+periodo, CHECK, índices). **Prohibido modificar `src/data/`.**
- **Uniwind en TODA la app (decisión del estudiante, obligatoria).** Archivos nuevos: Uniwind desde que se crean. Archivos que se tocan en fases 1–5 (`_layout.tsx`, `inicio.tsx`, login, etc.): se migran en esa fase. Resto de pantallas y componentes: fase 6. Al final `grep -r "StyleSheet" src` no devuelve nada.
- Tokens: `src/global.css` replica `colors.ts`, `spacing.ts` y `typography.ts` (con `@theme`) para que la equivalencia visual sea exacta. Al terminar la fase 6, `src/theme/` se elimina si ningún archivo lo importa.
- Firebase JS SDK (paquete `firebase`), no React Native Firebase. Funciona en Expo Go.

## 4. Arquitectura resultante
```
src/lib/firebase.ts           initializeApp + initializeAuth (AsyncStorage), languageCode 'es'
src/config.ts                 + variables EXPO_PUBLIC_FIREBASE_* validadas (único punto de configuración)
src/services/authService.ts   ÚNICO archivo (junto a lib/firebase.ts y erroresAuth.ts) que importa firebase/*
src/services/erroresAuth.ts   códigos de Firebase → mensajes en español
src/domain/validacionesAuth.ts  validaciones puras (sin React/Expo/Firebase)
src/domain/fortalezaClave.ts    función pura: 'debil' | 'media' | 'fuerte'
src/contexts/SesionContext.tsx  estado + funciones; mismo contexto, nueva API
src/components/ui/            Boton, CampoTexto, Aviso, PantallaAuth, IndicadorFortaleza (Uniwind)
src/global.css                @import 'tailwindcss'; @import 'uniwind'; tokens de color
metro.config.js               SOLO withUniwindConfig (sin workarounds de Firebase)
```
**Rutas (Stack.Protected, tres grupos):**
- `(auth)` → `estado === 'no_autenticado'`: `login`, `registro`, `recuperar`
- `(verificacion)` → `estado === 'sin_verificar'`: `verificar-correo`
- `(app)` → `estado === 'autenticado'`: `inicio`, `perfil` (editar nombre), `cambiar-clave`, y las existentes (`lecturas`, `medidor/*`, `registro/*`)

**API del contexto:** `estado: 'cargando' | 'no_autenticado' | 'sin_verificar' | 'autenticado'`, `uid`, `email`, `nombre`, `tecnicoCodigo` (= `uid`), `iniciarSesion(correo, clave)`, `registrarse(nombre, correo, clave)`, `enviarCorreoRecuperacion(correo)`, `cambiarClave(actual, nueva)`, `actualizarNombre(nombre)`, `reenviarVerificacion()`, `recargarUsuario()`, `cerrarSesion()`.

## 5. Intocable / se elimina / se crea
- **No tocar:** `src/data/`, `src/domain/` (salvo los 2 archivos nuevos), `src/api/`, `src/sync/`, `registroService`, `fotoService`, `ConexionContext`, `RegistroContext`, `tests/medidores.test.cjs`, ADR 001–011 y 013–015.
- **Eliminar (solo después de `grep` sin usos):** `src/data/usuarios.ts`, funciones antiguas de `authService.ts`, dependencia `expo-secure-store` y su plugin en `app.json`, y `src/theme/` al terminar la fase 6.
- **Reescribir:** `(auth)/login.tsx` (542 líneas), `authService.ts`, internos de `SesionContext.tsx`, `app/index.tsx`, `app/_layout.tsx` (grupo nuevo + importar `global.css`).

## 6. Trampas conocidas (la IA suele equivocarse aquí)
1. **Verificación de correo:** Firebase no avisa al verificar en el navegador. Hay que llamar `user.reload()` (botón "Ya verifiqué" y al volver la app a primer plano) y copiar el resultado al estado del contexto. Reenviar con espera de 60 s (`auth/too-many-requests`).
2. **`updateProfile` no cambia la referencia del usuario:** guardar `nombre` en estado propio del contexto.
3. **Cambiar contraseña** exige `reauthenticateWithCredential` antes de `updatePassword`.
4. **`initializeAuth` solo una vez:** usar `getApps()` y `try/catch` con `getAuth` (ver referencia).
5. **Tipos de Firebase:** agregar `paths` de `@firebase/auth` a `tsconfig.json` (ver `docs/referencia-firebase/tsconfig.paths.json.txt`). No agregar `@/*`.
6. **Uniwind:** solo Tailwind 4; `withUniwindConfig` debe envolver al final; tras tocar Metro, `npx expo start -c`; incluir el archivo `uniwind-types.d.ts` en `include` del tsconfig.
7. **Reanimated 4 necesita `react-native-worklets`.** Instalar ambos con `npx expo install`. No crear `babel.config.js` a mano.
8. **Variables de entorno:** valores reales en `.env.local` (ignorado por git) y plantilla en `.env.example`. El `.env` actual ya está versionado: no poner ahí claves de Firebase. En APK de EAS, cargar las variables en EAS.
9. **Registro abierto:** cualquiera puede crear cuenta; es una limitación conocida, no un error.

## 7. Reglas para la IA
- Una sola fase por sesión. Si el prompt no nombra la fase, pregunta cuál.
- Antes de editar en fases 2 y 3: muestra el plan de archivos y espera confirmación.
- No reimprimas archivos completos en la respuesta: resume los cambios (archivo + qué cambió).
- No inventes APIs: verifica contra `https://docs.expo.dev/versions/v57.0.0/`, `https://docs.expo.dev/llms.txt`, `https://docs.uniwind.dev/quickstart` y `https://docs.swmansion.com/react-native-reanimated/`. Consulta solo la página necesaria.
- Imports relativos. Nombres de archivo y textos en español. **Cero `StyleSheet` en archivos nuevos o modificados.**
- Instalar con `npx expo install <paquete>`, nunca `npm install` para módulos de Expo.
- Si una instrucción contradice un ADR vigente, detente e informa (regla de `AGENTS.md`).
- Si un comando de verificación falla, no avances: corrige o reporta si el fallo ya existía en la línea base.

## 8. Verificación (al final de cada fase)
```
npx tsc --noEmit
npx expo lint
npm test
npx expo install --check
npx expo-doctor
```
**Compuerta extra (fases 6 y 7):** `grep -r "StyleSheet" src` debe devolver 0 resultados.

**Línea base (completar en fase 0):** tsc ___ · lint ___ · test ___ · install --check ___ · doctor ___

Cada fase termina con: gates en verde → prueba manual en el teléfono → commit → merge a `main`.
APK de prueba (EAS) después de la fase 3 y al final.

## 9. Decisiones pendientes del estudiante
- Alcance de Uniwind: ☑ **toda la app** (decidido). Fase 6 es obligatoria.
- Identidad del técnico: ☑ `uid` temporal (ADR-016)

## 10. Brief de diseño (completar ANTES de la fase 5)
Concepto: ______ · Paleta (partir de `src/theme/colors.ts`): ______ · Tipografías (2): ______
Elemento distintivo (propuesta: ondas de agua animadas en el encabezado): ______
Tono de los textos: ______ · Prohibido: gradientes morados, tarjetas idénticas repetidas, emojis como íconos, copiar el diseño del taller.

## 11. Animaciones previstas (Reanimated)
| # | Animación | Dónde | APIs | Estado |
|---|---|---|---|---|
| 1 | Shake ante error de validación o autenticación | Tarjeta del login | `withSequence`, `withTiming` | Implementada; probada en teléfono y simplificada a una secuencia |
| 2 | Entrada escalonada de campos | Login/registro | `FadeInDown.delay(i*80)` | Implementada; prueba telefónica no registrada |
| 3 | Barra de fortaleza (ancho + color) | Registro, cambiar clave | `withTiming`, `interpolateColor` | Implementada; prueba telefónica no registrada |
| 4 | Ondas de agua en bucle | Encabezado | `withRepeat`, `useAnimatedStyle` | Implementada; prueba telefónica no registrada |
| 5 | Botón con resorte al presionar | `Boton` | `withSpring` | Implementada; prueba telefónica no registrada |
| 6 | Sobre que pulsa + éxito al verificar | `verificar-correo` | `withRepeat`, `ZoomIn` | Implementada; prueba telefónica no registrada |
| 7 | Entrada sutil y escalonada de tarjetas | Panel técnico (`inicio.tsx`) | `FadeInRight.delay(i*110).duration(500)` | Implementada y aceptada en teléfono |
Respetar "reducir movimiento" del sistema. Las animaciones de entrada de tarjetas usan `ReduceMotion.System`; cada animación debe poder mostrarse visible para el usuario.
