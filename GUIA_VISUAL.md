# GUIA_VISUAL — Diseño "aqua" de Lectura Ágil EPMAPS

Fuente de verdad visual para **toda** la app (login, registro, recuperar, verificación, perfil, cambiar clave, inicio, lecturas, medidor, registro de lectura). Extraída de `login`, `lecturas.tsx` y `medidor/index.tsx` del proyecto original (tag `v1-prueba1`, ahí están con StyleSheet para comparar).

**Reglas:** todo con `className` de Uniwind · usar los tokens de abajo (definidos en `src/global.css` con `@theme`) · los valores sueltos que no sean token van como clases arbitrarias con el valor **exacto** de esta guía · **no** usar `src/theme/colors.ts` (paleta institucional azul #2C4482): es de andamiaje y no es este diseño · no inventar colores ni radios.

## 1. Paleta (tokens)
| Token | Valor | Uso |
|---|---|---|
| `fondo` | #EAF4F8 | Fondo de pantalla |
| `marino` | #062B52 | Encabezado, títulos, botón presionado |
| `azul` | #087FC4 | Botón primario, íconos, acentos |
| `turquesa` | #65DCE5 | Indicador del panel, flecha, separadores |
| `texto` | #173650 | Texto principal, etiquetas |
| `secundario` | #688196 | Texto de apoyo, notas |
| `borde` | #D5E5ED | Bordes de campos |
| `error` / `error-fondo` / `error-borde` | #C0394B / #FFF0F1 / #F2CDD2 | Errores |
| `exito` / `exito-fondo` / `exito-borde` | #087F62 / #D9F7E9 / #B5EBD3 | Éxito |
| `aviso` / `aviso-fondo` / `aviso-borde` | #A96500 / #FFF8E8 / #F2DDAA | Pendiente, advertencia |
| `suave` | #DDF4FA (y #E5F5FC) | Fondos de chips/íconos |
| sobre marino | #D5EAF7 · #BDEBFA · #DDF8FF · #8DEBFF | Subtítulo · marca · pastilla · gota |

## 2. Piezas (medidas exactas, en px)
**Encabezado:** fondo marino · `px 16` · `pt/pb 36` · esquinas inferiores 30 · `overflow hidden`.
- Orbe 1: absoluto, top −95, right −60, círculo 250, `rgba(34,178,224,.16)`, borde 1 `rgba(179,239,255,.20)`.
- Orbe 2: absoluto, bottom −110, left −50, círculo 220, `rgba(0,207,190,.12)`, borde 1 `rgba(179,239,255,.15)`.
- Fila de marca: gap 8, mb 16. Icono 34×34, radio 12, fondo blanco 13 %, borde blanco 25 %, glifo de gota #8DEBFF 24 bold. Texto de marca #BDEBFA, 11 px, espaciado 1.1.
- Título: blanco 28/35 bold, mb 8. Subtítulo: #D5EAF7 16/22.
- Pastilla: se alinea al inicio, gap 4, mt 16, px 8, py 6, redondeada total, fondo blanco 9 %, borde blanco 18 %; punto 7 px #20B990; texto 9 px bold #DDF8FF espaciado .7.

**Panel de vidrio (formularios):** fondo blanco 88 % · radio 24 · borde blanco 95 % · padding 23 · `mt −12` · `mx 8` · sombra #153E5B (y 10, opacidad .09, radio 22). Arriba, barra indicadora 35×4, radio 2, turquesa, mb 19.
**Tarjetas de listas (lecturas):** radio 24, fondo blanco 70 %, sombra #0C527B (y 5, .07, radio 14); ítems radio 18, fondo blanco 78 %. **Resumen:** radio 25, fondo blanco 76 %, borde blanco, sombra #073C68 (y 8, .12, r 18).

**Texto del formulario:** título marino 23 / 800 / espaciado −0.4 · descripción secundario 13/19, mt 6, mb 23 · etiqueta texto 10 / 800 / espaciado 1, MAYÚSCULAS, mt 4 · separación entre campos 11.
**Campo:** fila centrada, alto mín. 53, radio 13, borde 1 `borde`, fondo blanco 85 %, px 14. Icono azul 12/900, ancho 28. Input 15 px, color texto, alto mín. 50, py 10. **Con error:** borde `error`, fondo `error-fondo`.
**Mensaje de error:** fila, gap 9, p 12, radio 12, fondo `error-fondo`, borde `error-borde`, mt 3; icono `error` 15/900; texto `error` 12/18.
**Botón primario:** fila centrada, gap 12, alto mín. 54, fondo `azul`, radio 14, mt 10, px 18, sombra `azul` (y 5, .18, r 9). Presionado: fondo `marino` y escala .99. Deshabilitado: opacidad .65. Texto blanco 14 / 800 / espaciado .3; flecha turquesa 22 bold.
**Botón secundario / enlaces:** misma altura y radio; fondo transparente o `suave`, borde 1 `azul`, texto `azul`. Pie de pantalla: texto `secundario` 9 px bold espaciado .7, puntos de 5 px `azul`, separadores turquesa.
**Estados** (pastillas, avisos, chips): usar los tríos éxito / aviso / error / suave de la paleta.

## 3. Componentes compartidos a crear (src/components/ui/)
`EncabezadoAqua` (encabezado con orbes, marca, título, subtítulo, pastilla opcional) · `PanelVidrio` · `CampoTexto` · `Boton` (primario y secundario) · `Aviso` (error / éxito / aviso) · `Pastilla` · `IndicadorFortaleza`. Las pantallas existentes se pueden dejar con sus clases si ya coinciden; las nuevas **deben** usar estos componentes.

## 4. Animación del diseño
Los **orbes del encabezado** son el elemento distintivo: se animan (flotar suave / "respirar" en bucle) con Reanimated. Es la animación #4 del plan. Respetar "reducir movimiento".