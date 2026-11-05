# DISEÑO.md --- Lectura Ágil EPMAPS

## Sistema visual y experiencia de uso

> **Concepto visual: "Bitácora de campo del agua"**\
> Una interfaz técnica, clara y reconocible, inspirada en la identidad
> de EPMAPS --- Agua de Quito, en los recorridos del agua por la ciudad
> y en las herramientas de inspección utilizadas en campo.

Este documento define la dirección visual de **Lectura Ágil EPMAPS**,
una aplicación móvil para técnicos que registran lecturas de medidores
con o sin conexión. La interfaz debe sentirse como una herramienta
profesional de operación en campo: precisa, resistente, legible y
rápida, no como una plantilla genérica de administración.

La identidad se inspira en el logotipo de EPMAPS y en las piezas
visuales compartidas como referencia. Los colores tomados visualmente de
las imágenes son aproximaciones de diseño y **no se presentan como una
guía oficial de marca**. Antes de afirmar que un color es institucional
oficial, se necesitaría el manual de identidad correspondiente.

------------------------------------------------------------------------

## 1. Principios de diseño

1.  **Primero el trabajo de campo.** Las acciones principales deben
    poder identificarse de inmediato y funcionar con una mano.
2.  **Información antes que decoración.** Los datos del medidor, la
    lectura y el estado de sincronización deben tener mayor jerarquía
    que los adornos.
3.  **La conectividad es parte de la interfaz.** El usuario siempre debe
    saber si trabaja conectado, sin conexión o con registros pendientes.
4.  **Cada estado se entiende sin depender del color.** Usar siempre
    texto e iconografía, con color como refuerzo.
5.  **Identidad local, no plantilla genérica.** Incorporar recursos
    gráficos inspirados en redes de agua, curvas de flujo, mapas
    esquemáticos y trazos topográficos, sin competir con la lectura de
    datos.
6.  **Consistencia.** Las mismas acciones, estados, márgenes y estilos
    se comportan igual en todas las pantallas.
7.  **Accesibilidad en exteriores.** Alto contraste, texto legible,
    zonas táctiles amplias y mensajes breves para uso en condiciones de
    iluminación variable.

## 2. Dirección artística: "Cartografía del agua"

La propuesta combina tres capas visuales:

-   **Capa institucional:** azul profundo del logotipo, blanco y una
    estructura tipográfica firme.
-   **Capa operativa:** superficies claras, tarjetas ordenadas,
    etiquetas técnicas y cifras grandes para lectura rápida.
-   **Capa de flujo:** líneas curvas, patrones sutiles y pequeños
    acentos cromáticos inspirados en la franja multicolor del logotipo.

### Recursos gráficos distintivos

-   Usar líneas finas y curvas de flujo como separadores o fondos de
    baja intensidad.
-   En cabeceras o pantallas vacías se pueden usar patrones de ondas o
    líneas topográficas, siempre con opacidad muy baja.
-   Presentar el código del medidor como una etiqueta técnica
    monoespaciada, por ejemplo `MED-100001`.
-   Dar protagonismo al valor de lectura y al consumo con números
    grandes y etiquetas cortas.
-   Utilizar una pequeña franja multicolor como acento puntual en
    bienvenida, encabezados especiales o indicadores de progreso; no
    repetirla en cada tarjeta.
-   En la pantalla de registro, mostrar el progreso como una ruta de
    inspección: **Estado → Lectura → Consumo → Foto → Resumen**,
    destacando el paso actual.
-   Los estados de conectividad deben tener un tratamiento constante y
    reconocible, separado del contenido del medidor.

### Evitar

-   Gradientes intensos en todos los fondos.
-   Sombras fuertes, tarjetas apiladas sin jerarquía o esquinas
    excesivamente redondeadas.
-   Iconos decorativos sin significado funcional.
-   Poner todos los colores del logotipo en botones o textos a la vez.
-   Usar una estética de "dashboard empresarial" genérico con gráficas
    innecesarias.
-   Mostrar información importante solo mediante color, animación o una
    fotografía de fondo.

------------------------------------------------------------------------

## 3. Paleta cromática

### 3.1 Colores base

La paleta prioriza el azul del logotipo, blancos y tonos neutros para
lectura prolongada. Los códigos se proponen a partir de las referencias
visuales suministradas; los acentos multicolores son aproximados.

  -------------------------------------------------------------------------
  Token               HEX               Función           Uso recomendado
  ------------------- ----------------- ----------------- -----------------
  `marca`             `#2C4482`         Azul              Encabezado
                                        institucional de  principal,
                                        referencia        navegación
                                                          activa, títulos
                                                          destacados,
                                                          botones
                                                          principales

  `marcaOscura`       `#1D2F60`         Azul profundo     Texto sobre
                                                          fondos claros,
                                                          estados
                                                          presionados y
                                                          elementos de alto
                                                          énfasis

  `marcaMedia`        `#355095`         Azul secundario   Elementos activos
                                                          secundarios,
                                                          bordes destacados
                                                          y gráficos de
                                                          apoyo

  `fondo`             `#F4F6FA`         Fondo general     Fondo de
                                        frío              pantallas y áreas
                                                          de desplazamiento

  `superficie`        `#FFFFFF`         Superficie        Tarjetas,
                                        principal         formularios,
                                                          modales y paneles

  `texto`             `#18233B`         Texto principal   Títulos, valores,
                                                          contenido y
                                                          etiquetas

  `textoSecundario`   `#56627A`         Texto de apoyo    Descripciones,
                                                          metadatos y
                                                          explicaciones

  `borde`             `#D7DEEA`         Separación sutil  Límites de
                                                          tarjetas, campos
                                                          y divisores

  `superficieSuave`   `#EAF0F8`         Superficie azul   Código de
                                        clara             medidor, bloques
                                                          informativos y
                                                          selección suave

  `blanco`            `#FFFFFF`         Contraste sobre   Texto e iconos
                                        azul              sobre el color de
                                                          marca
  -------------------------------------------------------------------------

### 3.2 Acentos derivados de la franja del logotipo

Estos colores se usan como **acentos**, no como colores principales de
grandes superficies. Los valores son aproximaciones visuales extraídas
de la imagen proporcionada.

  -----------------------------------------------------------------------
  Token             HEX aproximado    Función visual    Uso limitado
  ----------------- ----------------- ----------------- -----------------
  `acentoRojo`      `#A61826`         Atención / señal  Marcador gráfico
                                      puntual           o énfasis
                                                        excepcional; no
                                                        reemplaza el
                                                        color semántico
                                                        de error

  `acentoAzul`      `#355095`         Continuidad de    Elementos
                                      marca             secundarios y
                                                        detalles de
                                                        navegación

  `acentoVerde`     `#9CB938`         Flujo / recurso   Pequeños
                                      hídrico           indicadores
                                                        decorativos o de
                                                        progreso

  `acentoNaranja`   `#D06C26`         Actividad         Detalles
                                                        puntuales en
                                                        gráficos o pasos

  `acentoVioleta`   `#763383`         Profundidad       Acentos
                                                        ocasionales

  `acentoMagenta`   `#B51969`         Identidad         Detalle gráfico
                                      multicolor        excepcional

  `acentoCeleste`   `#4F89C8`         Agua /            Detalles de
                                      continuidad       ilustración o
                                                        flujo
  -----------------------------------------------------------------------

**Regla:** no usar los acentos como único indicador de estado. Un
consumo anómalo, un error o una lectura pendiente debe tener su propio
texto e icono semántico.

### 3.3 Colores semánticos de estado

  -----------------------------------------------------------------------
  Token             HEX               Significado       Tratamiento
  ----------------- ----------------- ----------------- -----------------
  `exito`           `#237A52`         Acción completada Icono de
                                      / lectura enviada confirmación +
                                                        texto

  `advertencia`     `#946000`         Revisión          Icono de alerta +
                                      necesaria /       explicación
                                      consumo anómalo   

  `error`           `#B42332`         Error que         Icono de error +
                                      requiere          mensaje claro
                                      corrección        

  `informacion`     `#245DA8`         Información o     Icono
                                      estado neutral    informativo +
                                                        texto

  `sinConexion`     `#5B6475`         Sin conexión      Icono de
                                                        desconexión +
                                                        texto

  `pendiente`       `#946000`         Acción o          Icono de
                                      sincronización    reloj/alerta +
                                      pendiente         etiqueta
  -----------------------------------------------------------------------

Los colores semánticos pueden diferir de la franja del logotipo: su
objetivo es comunicar un estado sin ambigüedad.

### 3.4 Contraste y legibilidad

-   El texto normal debe mantener una relación de contraste de al menos
    **4,5:1** con su fondo.
-   El texto grande y los componentes gráficos esenciales deben cumplir
    las pautas de contraste aplicables.
-   No uses texto blanco sobre acentos claros ni texto secundario gris
    claro sobre el fondo general sin comprobar el contraste.
-   Los códigos hexadecimales deben centralizarse en
    `src/theme/colors.ts`; no escribirlos directamente en las pantallas.
-   Verifica el contraste de cada combinación real antes de declarar que
    cumple WCAG AA. Los valores de esta propuesta son una paleta de
    partida, no una auditoría automática.

------------------------------------------------------------------------

## 4. Tipografía y jerarquía

Usar una tipografía sans serif clara y disponible en el proyecto. No
añadir fuentes externas sin justificar la dependencia o los archivos
adicionales.

  -----------------------------------------------------------------------
  Nivel                   Tratamiento             Aplicación
  ----------------------- ----------------------- -----------------------
  Título principal        26--30 pt,              Pantalla principal o
                          semibold/bold           inicio de un flujo

  Título de sección       18--22 pt, semibold     Datos del medidor,
                                                  registro y resumen

  Valor protagonista      30--40 pt, bold         Lectura actual, consumo
                                                  o pendientes

  Texto principal         16 pt, regular          Instrucciones y
                                                  contenido

  Etiqueta                12--14 pt, medium       Campos, metadatos y
                                                  estados

  Código técnico          14--16 pt,              Código `MED-xxxxxx`,
                          monoespaciado si está   clave o identificador
                          disponible              
  -----------------------------------------------------------------------

-   Priorizar frases cortas y lenguaje directo.
-   Evitar textos extensos en mayúsculas; reservarlas para títulos
    breves y etiquetas de sección.
-   No usar el tamaño como único medio para indicar importancia.
-   Los valores numéricos deben tener suficiente espacio para que se
    lean de un vistazo.

------------------------------------------------------------------------

## 5. Espaciado, formas y elevación

Definir un sistema de espaciado en `src/theme/spacing.ts` basado en
múltiplos de 4:

  Token orientativo     Valor Uso
  ------------------- ------- -----------------------------------------
  `xs`                      4 Separación mínima entre icono y texto
  `sm`                      8 Separación interna compacta
  `md`                     12 Separación entre elementos relacionados
  `lg`                     16 Padding habitual de tarjetas y campos
  `xl`                     24 Separación entre secciones
  `xxl`                    32 Separación de bloques principales

-   Tarjetas: esquinas moderadas, aproximadamente 12--16 pt.
-   Campos y botones: altura suficiente para lectura y toque cómodo.
-   Sombras: muy suaves y solo cuando ayuden a distinguir niveles.
-   Bordes: finos y de bajo contraste, salvo selección, error o foco.
-   Área táctil mínima: **48 × 48 pt**.
-   Respetar las áreas seguras del sistema y evitar que los botones
    principales queden ocultos por el teclado.

Estos valores son una escala de diseño recomendada; deben centralizarse
en el tema y ajustarse de manera consistente.


## 5.1. Recurso visual complementario: glassmorfismo controlado

### Concepto

La interfaz puede incorporar elementos de **glassmorfismo** como recurso visual secundario, combinando superficies translúcidas, fondos suaves y bordes sutiles para aportar profundidad sin perder la identidad técnica de *Lectura Ágil EPMAPS*.

Este recurso complementa el concepto de **«Bitácora de campo del agua»** mediante superficies que evocan transparencia, flujo y reflejos del agua. No sustituye la estructura operativa, la paleta cromática ni la jerarquía visual definida en este documento.

### Principios de aplicación

- **Uso selectivo:** reservar el efecto para cabeceras, paneles informativos, elementos flotantes y superficies de apoyo donde aporte una distinción visual útil.
- **Transparencia controlada:** utilizar fondos semitransparentes con suficiente contraste para mantener la legibilidad.
- **Bordes delicados:** emplear bordes claros y finos que ayuden a delimitar las superficies sin crear divisiones excesivas.
- **Profundidad moderada:** evitar sombras intensas, desenfoques excesivos y capas superpuestas innecesarias.
- **Coherencia cromática:** mantener como base los tonos `marca`, `marcaOscura`, `fondo` y `superficie`, con transparencias que respeten la identidad visual.
- **Prioridad operativa:** los efectos nunca deben dificultar la lectura de códigos, valores numéricos, mensajes de error, estados de conexión o acciones principales.

### Elementos donde puede utilizarse

- **Cabeceras:** superficies azul profundo con detalles translúcidos o líneas suaves inspiradas en el movimiento del agua.
- **Paneles destacados:** bloques informativos que requieran una separación visual respecto al fondo.
- **Elementos flotantes:** controles auxiliares o indicadores que necesiten distinguirse del contenido situado detrás.
- **Detalles decorativos:** reflejos, ondas o formas geométricas de baja intensidad en zonas que no contengan información crítica.

### Elementos que deben conservar superficies sólidas

El glassmorfismo no debe aplicarse indiscriminadamente. Se priorizan fondos
------------------------------------------------------------------------

## 6. Componentes y reglas de interfaz

### 6.1 Botón principal

-   Fondo `marca`, texto `blanco`.
-   Altura recomendada de 48--56 pt.
-   Texto de acción concreto: "Consultar medidor", "Guardar lectura",
    "Continuar" o "Confirmar".
-   Mostrar un estado de carga cuando una operación esté en curso.
-   Deshabilitarlo solo cuando la acción realmente no esté disponible y
    explicar el motivo.
-   Evitar dos botones principales con la misma jerarquía en una
    pantalla.

### 6.2 Botón secundario

-   Fondo blanco o `superficieSuave`, texto `marcaOscura`.
-   Borde visible cuando sea necesario.
-   Usarlo para acciones alternativas como "Volver" o "Editar".

### 6.3 Campos de formulario

-   Etiqueta visible encima del campo.
-   Ejemplo o formato esperado cuando ayude, como `MED-123456`.
-   Error junto al campo, con explicación breve y acción correctiva.
-   Mantener el valor ingresado cuando ocurra un error recuperable.
-   No depender de `Alert` para validar formularios.

### 6.4 Tarjeta de medidor

Orden recomendado:

1.  Código del medidor como etiqueta técnica.
2.  Dirección o referencia de ubicación.
3.  Sector y número de cuenta.
4.  Estado de oficina.
5.  Última lectura y fecha.
6.  Promedio mensual, si está disponible.
7.  Indicador de origen/actualización del dato cuando proceda:
    actualizado, caché o sin conexión.

No mostrar un dato como actualizado si procede de una caché antigua.

### 6.5 Lectura actual

-   La lectura debe ser el dato visual más prominente del formulario.
-   Mostrar la unidad o aclarar que se trata de la lectura del medidor.
-   Si existe una lectura anterior, mostrarla como referencia, sin
    confundirla con el valor que se está ingresando.
-   Mostrar el consumo calculado y explicar el umbral de anomalía.
-   Nunca corregir automáticamente el valor ingresado por el técnico sin
    informarlo.

### 6.6 Estado del registro

Cada estado debe combinar icono, etiqueta y, cuando haga falta, una
explicación:

-   **Pendiente de envío:** el registro está guardado localmente.
-   **Pendiente de verificación:** faltan datos de oficina o una
    comparación necesaria.
-   **Requiere acción:** el técnico debe completar una confirmación o
    fotografía.
-   **Enviando:** se está intentando sincronizar.
-   **Enviada:** el servidor confirmó el registro o se verificó de forma
    fiable que ya existe.
-   **Error:** no se completó el envío; la lectura se conserva para
    reintentar.

No usar un único color para representar todos los tipos de pendiente. El
texto debe diferenciar qué falta.

### 6.7 Banner de conectividad

Mantener una ubicación estable en las pantallas principales. Debe
mostrar:

-   Estado de conexión.
-   Cantidad de lecturas por enviar.
-   Aviso cuando existan registros que requieren acción.
-   Mensajes breves, sin cubrir los controles principales.

Estar conectado a una red no garantiza que la API esté disponible. El
indicador de red y el resultado de las peticiones deben tratarse como
señales diferentes.

### 6.8 Fotografía

-   Mostrar un área de fotografía con borde definido y una acción clara
    para tomar o seleccionar la imagen.
-   Tras seleccionar la foto, mostrar una vista previa y una opción para
    repetirla cuando la lectura aún sea editable.
-   Si es obligatoria, indicar el motivo: "Obligatoria por anomalía" o
    "Obligatoria por medidor dañado".
-   Si no se puede enviar por falta de conexión, conservarla y explicar
    que el registro sigue pendiente.
-   No mostrar una fotografía como guardada si todavía no se ha copiado
    al almacenamiento persistente de la aplicación.

------------------------------------------------------------------------

## 7. Dirección visual por pantalla

### 7.1 Inicio de sesión

**Objetivo:** transmitir confianza y permitir el acceso rápido del
técnico.

-   Fondo `fondo` y encabezado azul `marca`.
-   Logotipo original, sin recolorear ni deformar.
-   Título corto: "LECTURA ÁGIL".
-   Subtítulo: "Registro técnico de medidores".
-   Campos de código de empleado y clave con etiquetas visibles.
-   Botón principal "Ingresar".
-   Mensajes de error junto al formulario, sin alertas genéricas.
-   No incluir ilustraciones grandes que retrasen el acceso a la tarea.

### 7.2 Inicio / resumen de jornada

**Objetivo:** mostrar qué puede hacer el técnico y qué requiere
atención.

-   Encabezado azul compacto con saludo o identificación del técnico.
-   Bloque de conexión y sincronización visible.
-   Acción principal destacada: "Consultar medidor".
-   Tarjetas de resumen para lecturas pendientes y registros que
    requieren acción.
-   Acceso secundario a historial de lecturas.
-   Decoración de líneas de flujo solo en el encabezado o en espacios
    vacíos.

No convertir esta pantalla en un panel de estadísticas innecesarias:
debe ayudar a comenzar o retomar el trabajo.

### 7.3 Búsqueda de medidor

**Objetivo:** identificar correctamente el medidor antes de registrar.

-   Campo amplio para el código `MED-xxxxxx`.
-   Texto auxiliar con el formato esperado.
-   Botón "Consultar medidor".
-   Errores de formato inmediatos, sin hacer peticiones inválidas.
-   Estados diferenciados: consultando, encontrado, no encontrado, datos
    de caché y sin conexión.
-   No usar solo un cambio de color para indicar que el medidor fue
    encontrado.

### 7.4 Detalle del medidor

**Objetivo:** revisar los datos de oficina antes de iniciar la lectura.

-   Código en una etiqueta técnica.
-   Dirección como dato principal de ubicación.
-   Datos agrupados en tarjetas o filas claramente alineadas.
-   Última lectura y promedio mensual en posiciones fáciles de comparar.
-   Indicador de caché cuando corresponda.
-   Acción principal "Registrar lectura".
-   Si el estado de oficina impide continuar, explicar el motivo antes
    de iniciar el registro.

### 7.5 Asistente de registro

**Objetivo:** reducir errores durante la captura de datos.

Presentar el flujo como una ruta de inspección, no como un formulario
largo:

1.  Estado del medidor.
2.  Datos de lectura.
3.  Revisión del consumo.
4.  Fotografía, si es necesaria.
5.  Resumen y guardado.

-   Indicar el paso actual y cuáles ya se completaron.
-   Mantener los datos al retroceder entre pasos.
-   Mostrar una sola tarea principal por pantalla.
-   No permitir avanzar si falta un campo obligatorio.
-   Guardar el borrador con la frecuencia necesaria para recuperar el
    registro si la aplicación se cierra.
-   No perder información al abrir la cámara o cambiar temporalmente de
    aplicación.

### 7.6 Revisión del consumo

**Objetivo:** que el técnico comprenda por qué se muestra una
advertencia.

-   Presentar lectura anterior, lectura actual y consumo calculado en
    bloques diferenciados.
-   Mostrar el promedio mensual como referencia.
-   Si el consumo supera estrictamente tres veces el promedio, mostrar
    un aviso con icono, texto y explicación.
-   Solicitar confirmación explícita cuando corresponda.
-   No presentar la advertencia como un error de la aplicación; es una
    condición que necesita revisión.

### 7.7 Fotografía

**Objetivo:** garantizar evidencia cuando las reglas la exigen.

-   Fondo neutro y área de previsualización amplia.
-   Botón principal para capturar o seleccionar la fotografía.
-   Estado claro de fotografía requerida u opcional.
-   Acciones para repetir o conservar la foto.
-   Mensaje visible si la fotografía aún no se ha guardado de forma
    persistente.
-   Si la lectura está pendiente de verificación y posteriormente
    resulta anómala, explicar que falta completar la evidencia antes de
    sincronizarla.

### 7.8 Resumen y guardado

**Objetivo:** permitir una última revisión antes de finalizar.

-   Mostrar código, período, estado, lectura, consumo y fotografía
    cuando exista.
-   Diferenciar "Guardada en el dispositivo" de "Enviada al sistema de
    la oficina".
-   Confirmar el guardado local aunque no haya conexión.
-   Si requiere acción adicional, indicar exactamente qué falta.
-   No mostrar un mensaje de éxito de sincronización antes de recibir
    una confirmación fiable.

### 7.9 Historial y edición

**Objetivo:** localizar registros y reconocer su estado sin abrir cada
elemento.

-   Filas o tarjetas compactas con código, fecha/período, lectura y
    estado.
-   Filtros simples si están implementados y son útiles.
-   Acción "Editar" solo cuando el registro todavía sea editable.
-   Para registros enviados, mostrar su estado y no ofrecer edición.
-   Los errores de sincronización deben explicar que los datos se
    conservaron.

------------------------------------------------------------------------

## 8. Iconografía, microinteracciones y movimiento

-   Usar `@expo/vector-icons` si ya está disponible en el proyecto.
-   Mantener un estilo de iconos consistente y evitar mezclar familias
    visuales sin motivo.
-   Los iconos acompañan a las etiquetas, especialmente en estados
    críticos.
-   Las animaciones deben ser breves y funcionales: carga, transición de
    paso o confirmación de guardado.
-   No utilizar animación como única señal de éxito o error.
-   Respetar la configuración del sistema para reducir movimiento cuando
    sea posible.
-   No agregar librerías de animación sin un ADR que justifique su
    necesidad.

------------------------------------------------------------------------

## 9. Accesibilidad y uso en campo

-   Contraste mínimo recomendado de 4,5:1 para texto normal.
-   Zonas táctiles de al menos 48 × 48 pt.
-   Texto legible sin necesidad de hacer zoom.
-   Etiquetas visibles para los campos; no usar el placeholder como
    única etiqueta.
-   Mensajes de error concretos: qué ocurrió y cómo corregirlo.
-   No depender exclusivamente del color, la posición o el movimiento.
-   Mantener los controles principales fuera de zonas tapadas por
    teclado, barras del sistema o áreas seguras.
-   Evitar interacciones que requieran precisión excesiva.
-   Comprobar el comportamiento en pantallas pequeñas y con tamaño de
    fuente aumentado.

------------------------------------------------------------------------

## 10. Sistema de tema en el código

Centralizar los valores visuales en `src/theme/`:

``` text
src/theme/
  colors.ts
  spacing.ts
  typography.ts
```

### `colors.ts`

Debe contener la paleta base, los acentos y los colores semánticos
definidos en este documento. Las pantallas no deben declarar colores
hexadecimales de forma directa.

### `spacing.ts`

Debe definir los valores de espaciado, radios y dimensiones recurrentes,
evitando números arbitrarios repetidos en componentes.

### `typography.ts`

Debe centralizar tamaños, pesos y estilos de texto para títulos,
etiquetas, contenido y cifras destacadas.

### Reglas de implementación

-   No duplicar los mismos valores de diseño en múltiples archivos.
-   No introducir estilos globales que modifiquen componentes ajenos al
    alcance solicitado.
-   No cambiar la lógica de negocio al aplicar el tema.
-   Reutilizar componentes compartidos cuando tengan la misma función
    visual y de interacción.
-   Mantener la accesibilidad al modificar tamaños, colores o estados.
-   No afirmar que se cumple WCAG AA sin comprobar las combinaciones de
    color y el tamaño real del texto.

------------------------------------------------------------------------

## 11. Relación entre el diseño y los requisitos funcionales

  -----------------------------------------------------------------------
  Requisito                           Respuesta visual
  ----------------------------------- -----------------------------------
  R1 --- Sesión                       Inicio de sesión claro y
                                      persistencia de sesión sin exponer
                                      la contraseña

  R2 --- Código del medidor           Campo con formato esperado y
                                      validación junto al campo

  R3 --- Consulta y caché             Tarjeta de datos del medidor y
                                      etiqueta que indique el uso de
                                      caché

  R4 --- Registro sin conexión        Guardado local confirmado y estado
                                      de pendiente visible

  R5 --- Estado del medidor           Opciones claras con campos
                                      condicionales según el estado

  R6 --- Consumo y anomalía           Comparación visual de lecturas y
                                      advertencia explicada

  R7 --- Foto                         Indicador de obligatoriedad, vista
                                      previa y conservación del archivo

  R8 --- Registro en curso            Progreso del asistente y
                                      recuperación de borrador

  R9 --- Sincronización               Estado de conexión, contador de
                                      pendientes y mensajes de reintento

  R10 --- Corrección y duplicados     Edición visible solo cuando esté
                                      permitida y mensajes claros para
                                      registros existentes
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 12. Lista de verificación visual

Antes de dar por terminada una pantalla, comprobar:

-   [ ] Usa tokens de `src/theme/` y no colores o tamaños arbitrarios.
-   [ ] Tiene una acción principal claramente identificable.
-   [ ] El texto es legible y el contraste se ha comprobado.
-   [ ] Los estados muestran icono y texto.
-   [ ] Los errores aparecen junto al campo o acción relacionada.
-   [ ] Las zonas táctiles tienen al menos 48 × 48 pt.
-   [ ] El estado de conexión no oculta el contenido ni los controles.
-   [ ] Los datos de caché no se presentan como necesariamente actuales.
-   [ ] El diseño no modifica las reglas de negocio.
-   [ ] La pantalla se ha probado en un dispositivo o emulador con el
    tamaño objetivo.
-   [ ] Las afirmaciones sobre accesibilidad corresponden a
    verificaciones realmente realizadas.

## 13. Referencias visuales y alcance de marca

-   Sitio institucional de referencia: <https://www.aguaquito.gob.ec/>
-   Logotipo EPMAPS --- Agua de Quito proporcionado como referencia
    visual.
-   Pieza gráfica institucional proporcionada como referencia de uso de
    azul, ondas y franja multicolor.

La propuesta toma como inspiración el azul dominante, el contraste
blanco, la franja cromática y los patrones de flujo de las imágenes. No
reproduce una pantalla del sitio web ni afirma que las decisiones
propuestas constituyan el manual oficial de identidad de EPMAPS.

**Resultado esperado:** una aplicación de campo reconocible, de
identidad técnica y local, con una estética propia basada en la
cartografía del agua y la precisión de una bitácora operativa. El estilo
debe reforzar el trabajo del técnico, no competir con él.
