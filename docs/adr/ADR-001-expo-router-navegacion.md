# ADR-001: Usar Expo Router para la navegación

## Estado
Aceptado.

## Fecha
2026-10-27

## Requisitos relacionados
R1 (separar la zona autenticada de la de inicio de sesión) y R8 (llevar al técnico al paso donde se quedó el registro).

## Contexto
La aplicación tiene una pantalla de inicio de sesión, una pantalla de búsqueda de medidor, el detalle del medidor, un registro de lectura dividido en varios pasos y una lista de lecturas pendientes y enviadas. Según R1, sin sesión no se debe poder entrar a las pantallas internas y, al cerrar sesión, se vuelve a pedir el código y la clave. Según R8, si la aplicación se cierra a mitad del registro, al abrirla se ofrece continuar o descartar, y al continuar el técnico debe llegar directamente al paso en que se quedó. El proyecto se genera con la plantilla de Expo SDK 57.

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
|---|---|---|
| Expo Router | Ya viene en la plantilla, sin dependencias nuevas. Permite proteger un grupo de rutas según la sesión (R1) y enviar al técnico a una ruta concreta desde código (R8). La estructura de pantallas se ve en las carpetas. Ya se usó en proyectos anteriores del curso. | Cualquier archivo dentro de `app/` se vuelve ruta. Es una capa sobre React Navigation que hay que entender cuando algo falla. |
| React Navigation configurado a mano | Control total de cada navegador. | Hay que instalarla y configurarla, y la plantilla ya lo resuelve. Las rutas quedan declaradas en código y no se ven en las carpetas. |
| Una sola pantalla con los pasos por renderizado condicional | Ninguna librería de navegación para el registro. | El botón atrás de Android no retrocede entre pasos sin código extra. Mezcla la lógica de todos los pasos en un componente enorme. |

## Decisión
Se usa Expo Router. Las pantallas internas van en un grupo protegido con `Stack.Protected`, cuyo guardia depende de la sesión (ADR-012). Los pasos del registro son rutas separadas dentro de `registro/` (`estado_medidor`, `datos_lectura`, `revision_consumo`, `fotografia` y `resumen`) y el paso actual se guarda en el borrador (ADR-004), no en los parámetros de la ruta.

## Consecuencias
- No se agrega ninguna dependencia para la navegación.
- Los componentes que no son pantallas deben estar fuera de `app/` para que no se conviertan en rutas.
- La navegación no conserva los datos ingresados. Eso se decide en el ADR-004.
- Riesgo: si al abrir la app se navega al paso pendiente antes de leer el borrador de la base local, la pantalla aparece vacía o se ve un parpadeo del login. La navegación debe ocurrir solo después de cargar sesión y borrador, con una pantalla de arranque hasta entonces.
- Las rutas tipadas se regeneran al arrancar el servidor de desarrollo; un error de tipos en una ruta nueva puede deberse a eso.

## Verificación
- La carpeta `src/app/` contiene solo pantallas y layouts.
- En el teléfono, el botón atrás de Android retrocede de un paso al anterior dentro del registro.
- Sin sesión, ninguna ruta interna es accesible. Al cerrar sesión se vuelve al login.
- Quitar la app de recientes en el paso 3 y reabrirla lleva a ese paso tras elegir "Continuar".
- En `package.json` no hay paquetes de React Navigation instalados a mano.

## Uso de IA

Consulté a Claude (Anthropic) para comparar alternativas de navegación para la aplicación y analizar cómo cumplir los requisitos R1 y R8. Claude recomendó Expo Router y el uso de Stack.Protected para controlar el acceso a las pantallas.
Decisión personal: Elegí Expo Router porque ya está incluido en mi proyecto y tengo experiencia utilizándolo en cv-creator-app. Además, me permite organizar las pantallas en rutas y separar el inicio de sesión de las pantallas de la aplicación.
Para cumplir R1, utilizaré la navegación para controlar el acceso a las pantallas según el estado de la sesión. Para R8, guardaré los datos del registro en el almacenamiento local, de modo que puedan recuperarse si la aplicación se cierra inesperadamente.
Descarté React Navigation configurado manualmente porque Expo Router ya se adapta a la estructura de mi proyecto y considero que implementarlo manualmente no aportaría una ventaja importante para este desarrollo.También decidí mantener los componentes reutilizables fuera de src/app, porque los archivos que se encuentran dentro de esa carpeta se utilizan para definir las rutas de navegación. Así, las pantallas quedan separadas de los componentes y de la lógica del negocio.
