# Lectura Ágil EPMAPS
 
Aplicación móvil (Expo SDK 57, React Native, TypeScript) para que el técnico registre en campo las lecturas de los medidores de agua, con una foto de respaldo, y para que la información llegue al sistema de la oficina aunque durante la jornada no haya señal.
 
Prueba I de Desarrollo Móvil, ESFOT.
 
## Qué hace
 
- Identifica al técnico con código de empleado y clave, y recuerda la sesión hasta que cierre sesión.
- Consulta un medidor por su código (`MED-` y seis dígitos) y muestra los ocho campos del contrato de negocio. Lo consultado queda en caché y funciona sin conexión.
- Registra la lectura en un asistente de varios pasos, con reglas distintas para los estados normal, inaccesible y dañado.
- Calcula el consumo y advierte cuando supera el triple del promedio mensual.
- Pide foto cuando el consumo es anómalo o el medidor está dañado, y la conserva aunque se reinicie el teléfono.
- Guarda el registro en curso para continuarlo si la app se cierra.
- Envía solas las lecturas pendientes cuando vuelve la conexión, sin duplicarlas.
- Muestra el estado de conexión y el número de lecturas por enviar en todas las pantallas.
- Permite corregir una lectura pendiente, pero no una enviada, y rechaza un segundo registro del mismo medidor en el mismo mes.
## Estado de implementación
 
Marca cada requisito cuando lo hayas probado en el APK.
 
- [ ] R1 Sesión
- [ ] R2 Código del medidor
- [ ] R3 Consulta y caché
- [ ] R4 Registro sin conexión
- [ ] R5 Reglas por estado
- [ ] R6 Consumo y anomalía
- [ ] R7 Foto
- [ ] R8 Registro en curso
- [ ] R9 Sincronización
- [ ] R10 Corrección y duplicados
## Requisitos para ejecutarla
 
- Node.js (versión compatible con Expo SDK 57)
- Una cuenta de Expo, si vas a compilar con EAS
- Un teléfono Android o un emulador
## Instalar y ejecutar en desarrollo
 
```bash
npm install
npx expo start
```
 
La cámara, el modo avión y el almacenamiento se comprueban mejor en el APK instalado que en Expo Go.
 
## Configuración
 
La URL base de MockAPI se define localmente en `.env`; `src/config.ts` la valida
y es el único punto de configuración utilizado por los servicios:

```dotenv
EXPO_PUBLIC_API_URL=https://<id-del-proyecto>.mockapi.io
```

`EXPO_PUBLIC_API_URL` se incorpora en el paquete de la aplicación y es visible
para quien la instale. No incluyas credenciales, claves privadas ni secretos en
esta variable.

El contrato de negocio aprobado para `medidores` contiene ocho propiedades:
`codigo`, `direccion`, `sector`, `numeroCuenta`, `estadoOficina`,
`ultimaLectura`, `fechaUltimaLectura` y `promedioMensual`. Las ocho claves
deben estar presentes. `sector`, `numeroCuenta`, `ultimaLectura`,
`fechaUltimaLectura` y `promedioMensual` admiten `null`; cuando no exista una
última lectura, su valor y su fecha deben ser ambos `null`. La fecha usa
`YYYY-MM-DD`; la lectura es un entero no negativo y el promedio un número
finito no negativo. El código debe cumplir `^MED-\d{6}$`.

El `id` técnico de MockAPI no es parte del contrato de negocio. `consultadoEn`
y el origen del dato son metadatos locales de caché, separados de
`fechaUltimaLectura`. La mención histórica de siete campos en ADR-005 no
define una correspondencia con estas ocho propiedades ni con las filas
agrupadas de la tarjeta.

La respuesta actual de MockAPI todavía no cumple este contrato: los registros
observados tienen un esquema anterior y códigos que no pasan la validación.
Hasta migrar esos datos manualmente, la aplicación los rechazará y no los
mostrará ni guardará en caché.
 
## Generar el APK
 
Con EAS (compila en la nube):
 
```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```
 
El perfil `preview` de `eas.json` usa `buildType: apk`. Al terminar, descarga el `.apk` del enlace e instálalo en el teléfono.
 
Compilación local (necesita JDK y Android SDK):
 
```bash
npx expo prebuild -p android
cd android && ./gradlew assembleRelease
```
 
El APK queda en `android/app/build/outputs/apk/release/`.
 
 
## Estructura
 
```
src/
  app/          Pantallas y layouts (Expo Router)
  components/   Componentes de interfaz (ui y shared)
  theme/        Colores, tipografía y espaciado
  domain/       Reglas de negocio puras, sin React ni Expo
  data/         SQLite: migraciones y repositorios (único lugar con SQL)
  api/          Cliente HTTP y recursos de MockAPI (único lugar con fetch)
  services/     Casos de uso: sesión, medidores, registro, foto
  sync/         Motor de envío de lecturas pendientes
  contexts/     Sesión, conexión y registro en curso
docs/adr/       Registro de decisiones de arquitectura
```
 
## Decisiones de arquitectura
 
Cada decisión técnica tiene su registro en [`docs/adr`](docs/adr). El índice está en [`docs/adr/README.md`](docs/adr/README.md) y la relación entre requisitos, decisiones y archivos está en [`DISEÑO.md`](DISEÑO.md).
 
## Límites conocidos
 
- El sistema de la oficina simulado no impone unicidad. La app evita duplicados con una clave por medidor y mes y comprobando en el servidor antes de reenviar, pero no puede garantizar entrega exactamente una vez si dos dispositivos envían a la vez.
- El envío automático ocurre con la app abierta. Con la app cerrada no se envía hasta que se vuelva a abrir.
- Una lectura registrada sin conexión que resulta anómala al reconectar queda retenida hasta que el técnico agregue la foto y la confirmación.
- El periodo de la lectura depende de la fecha del teléfono.
 