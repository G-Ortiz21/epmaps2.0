# ADR-012: Guardar la sesión del técnico con expo-secure-store

## Estado
Reemplazado por ADR-016.

## Fecha
2026-10-27

## Requisitos relacionados
R1.

## Contexto
El técnico se identifica con su código de empleado y una clave. En esta prueba los usuarios son datos fijos del código, sin gestión de usuarios. La app debe recordar la sesión tras cerrarse y abrirse, y al cerrar sesión debe pedir de nuevo el código y la clave. Lo que se guarda es información de seguridad (quién está identificado), distinta de los datos de negocio de las lecturas. Un teléfono puede ser compartido o perderse. En un sistema real, esa sesión sería un token de la empresa.

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
|---|---|---|
| Tabla `sesion` en SQLite (ADR-002) | Sin dependencia nueva. | La base no está cifrada y mezcla un dato de seguridad con los de negocio. |
| AsyncStorage | Muy simple. | Texto plano, y sería otra dependencia solo para esto. |
| expo-secure-store | Guarda en el almacén seguro del sistema (Keystore en Android), pensado para credenciales y tokens. Módulo oficial de Expo. | Dependencia nueva para un dato muy pequeño. Con usuarios fijos la ganancia de seguridad es modesta. |

## Decisión
Se usa `expo-secure-store`. Se guarda solo el código del empleado y una marca de sesión; nunca la clave. Al arrancar se lee antes de mostrar cualquier pantalla (ADR-001), y cerrar sesión borra el valor.

## Consecuencias
- Se instala una dependencia (`expo-secure-store`), justificada por R1.
- Se obtiene el hábito correcto para cuando haya un token real, y un valor de seguridad separado de la base de lecturas.
- Costo: con datos fijos de prueba, el beneficio es pequeño y SQLite habría bastado.
- Las lecturas son asíncronas: el arranque debe esperar para no mostrar el login por un instante.

## Verificación
- `package.json` contiene `expo-secure-store`.
- Cerrar y abrir la app mantiene la sesión; cerrar sesión pide credenciales otra vez.
- La clave no aparece en ningún valor guardado.

## Uso de IA

Consulté a Claude sobre dónde almacenar la información de la sesión del usuario. Recomendó utilizar `expo-secure-store`, una herramienta de Expo para guardar datos de forma segura en el dispositivo. También señaló que almacenar la sesión en una tabla de SQLite era una alternativa válida que no requería añadir otra dependencia.

**Decisión personal:** Elegí `expo-secure-store` porque considero que los datos de sesión tienen una finalidad de seguridad diferente a la información operativa de las lecturas. Además, esta decisión permite preparar la aplicación para utilizar un token de autenticación real en el futuro. Descarté SQLite para este propósito porque prefiero mantener la sesión separada de los datos de trabajo almacenados localmente.

Reconozco que, como el proyecto utiliza usuarios fijos, guardar el código del empleado en SQLite habría sido suficiente para el alcance actual. Acepto añadir esta dependencia para mantener esa separación y facilitar una posible evolución de la autenticación. La aplicación guarda únicamente el código del empleado, no su contraseña.
