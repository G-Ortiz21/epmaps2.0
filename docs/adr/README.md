# Registro de decisiones de arquitectura (ADR)

Aplicación móvil de registro de lecturas de medidores de agua en campo (Expo SDK 57, React Native, TypeScript).

Cada archivo registra una sola decisión. Un ADR aceptado no se edita: si cambia la decisión, se escribe uno nuevo y el anterior pasa a "Reemplazado por ADR-0XX".

| N° | Decisión | Requisitos | Dependencia que justifica |
|---|---|---|---|
| [001](ADR-001-expo-router-navegacion.md) | Usar Expo Router para la navegación | R1, R8 | (plantilla Expo) |
| [002](ADR-002-sqlite-almacenamiento-local.md) | Usar SQLite (expo-sqlite) para almacenar los datos en el teléfono | R3, R4, R8, R9, R10 | `expo-sqlite` |
| [003](ADR-003-fetch-nativo-y-cache-primero.md) | Consultar la oficina con fetch nativo y usar la base local como caché | R2, R3, R9 | ninguna |
| [004](ADR-004-context-y-borrador-persistente.md) | Compartir el estado del registro con React Context y guardarlo en cada cambio | R8 | ninguna |
| [005](ADR-005-validadores-propios-en-typescript.md) | Validar con funciones propias en TypeScript | R2, R5, R6, R7 | ninguna |
| [006](ADR-006-formularios-controlados-sin-libreria.md) | Manejar los formularios con componentes controlados | R5, R6, R7, R8 | ninguna |
| [007](ADR-007-image-picker-captura-de-foto.md) | Capturar la foto con expo-image-picker | R7, R8 | `expo-image-picker` |
| [008](ADR-008-foto-en-directorio-de-documentos.md) | Copiar la foto al directorio de documentos con expo-file-system | R7, R8 | `expo-file-system` |
| [009](ADR-009-expo-network-deteccion-de-conexion.md) | Detectar la conexión con expo-network | R9 | `expo-network` |
| [010](ADR-010-clave-medidor-periodo-como-identidad.md) | Identificar cada lectura con la clave medidor + periodo | R9, R10 | ninguna |
| [011](ADR-011-envio-con-estados-y-comprobacion-previa.md) | Enviar con estados explícitos y comprobar en el servidor antes de reenviar | R9, R4 | ninguna |
| [012](ADR-012-secure-store-sesion-del-tecnico.md) | Guardar la sesión con expo-secure-store (reemplazado por ADR-016) | R1 | `expo-secure-store` |
| [013](ADR-013-mockapi-oficina-simulada.md) | Simular el sistema de la oficina con MockAPI | R3, R4, R9 | ninguna |
| [014](ADR-014-verificar-lectura-antes-de-enviar.md) | Verificar la lectura contra los datos de la oficina antes de enviarla | R4, R6, R7 | ninguna |
| [015](ADR-015-cache-de-medidores-con-tanstack-query.md) | Persistir la caché de consultas de medidores con TanStack Query y AsyncStorage (reemplaza a 003 en esa caché) | R2, R3, R9 | `@tanstack/react-query`, `@tanstack/react-query-persist-client`, `@tanstack/query-async-storage-persister`, `@react-native-async-storage/async-storage` |
| [016](ADR-016-firebase-auth-reemplaza-sesion-local.md) | Autenticar con Firebase Authentication (reemplaza a ADR-012) | A1–A10 | `firebase`, `@react-native-async-storage/async-storage` |
