# **Reimplementación del Motor de Impresión de Ressume: Diagnóstico de Fragmentación CSS y Transición a Particionado Determinista en Cliente**

El fallo recurrente del motor de impresión en Ressume —donde cinco generaciones sucesivas de agentes de inteligencia artificial produjeron documentos fracturados con suites de pruebas reportando un 100% de éxito— responde a una contradicción arquitectónica fundamental: delegar la fragmentación de páginas al motor de renderizado CSS del navegador (window.print() sobre CSS Paged Media) mientras se le proporciona un único árbol DOM continuo estructurado mediante CSS Grid y Flexbox. Los motores de renderizado Blink (Chromium) y Gecko (Firefox) presentan discrepancias insalvables en la implementación de la especificación *CSS Fragmentation Module Level 3* cuando interactúan con modelos de caja modernos, renderizado subpíxel de fuentes web y conversión de medios continuos a paginados. Continuar ajustando selectores globales como break-before: page, break-inside: avoid o márgenes dinámicos sobre un árbol continuo es un callejón sin salida técnico.

Para alcanzar una paridad 1:1 estricta, vectorial y 100% desconectada del servidor, el sistema debe abandonar la fragmentación reactiva en tiempo de impresión y adoptar una arquitectura de particionado preventivo. La solución definitiva exige que el cálculo geométrico y la distribución del contenido ocurran antes de invocar la interfaz de impresión del navegador, garantizando que el documento se presente ante el motor de salida como una sucesión de cajas físicas A4 cerradas e inmutables.

Existen dos rutas viables para materializar este desacoplamiento en el cliente:

> 1. **Particionado Previo por Modelo de Datos (AST Bin-Packing en React):** El estado del currículum se procesa en memoria mediante un pase de medición en un sandbox aislado y un algoritmo de empaquetamiento unidimensional (*1D Bin Packing*). Este particionado segmenta las secciones en una colección discreta de páginas (PageModel\[\]), haciendo que React renderice contenedores DOM independientes con dimensiones físicas fijas (794px x 1123px a 96 DPI). Esta vía preserva el 100% de los estilos visuales existentes, añade menos de 15 KB al paquete de distribución y elimina todas las heurísticas frágiles de print.css.  
> 2. **Compilación Tipográfica en WebAssembly (Typst WASM vía @myriaddreamin/typst.ts):** El estado del CV se serializa a marcado tipográfico compilado directamente a bytes de PDF dentro de un Web Worker1. Typst reemplaza íntegramente el subsistema de impresión del navegador por un compilador tipográfico determinista escrito en Rust, logrando una paridad matemática absoluta entre plataformas a cambio de incorporar \~13 MB de binarios WASM1.

Para el estado actual de Ressume, la adopción del Particionado Previo por Modelo de Datos en React representa la decisión técnica óptima por su balance entre coste de refactorización, peso de dependencias y reutilización de componentes visuales. Typst WASM constituye la alternativa de máxima precisión cuando se requiere un control microtipográfico idéntico al de LaTeX en entornos locales1.

## **Mecánica del Fallo de Fragmentación en Navegadores y la Invalidez de JSDOM**

El artefacto documentado en muestra\_fracaso.pdf —donde la sección Educación fragmenta cada una de sus tres entradas en páginas independientes, expandiendo un currículum de 2 páginas a 3— es la consecuencia directa de cómo Blink y Gecko resuelven la fragmentación de cajas en contextos vectoriales.

| Dimensión Operativa | Entorno de Pantalla (DOM Vivo) | Contexto de Impresión Vectorial (Chromium/Gecko Print) | Impacto Arquitectónico en Ressume |
| :---- | :---- | :---- | :---- |
| **Unidad de Medida** | Píxeles CSS (px) calibrados a 96 DPI sobre pantalla física. | Puntos tipográficos absolutos (pt, donde 1 pt \= 1/72 pulgada \= 1.333 px). | Desincronización métrica entre las coordenadas calculadas en JS y el raster final. |
| **Rasterizado de Fuentes** | Rasterización subpíxel con *hinting* adaptado a la densidad del monitor. | Curvas vectoriales continuas proyectadas a la resolución de salida física. | Una viñeta de 87.4 px en pantalla computa como 91.2 pt en impresión, acumulando desbordamientos invisibles en pantalla. |
| **Modelo de Fragmentación** | Flujo continuo con scroll unidimensional infinito. | Partición ortogonal en cajas de página discretas (A4: 210mm x 297mm). | Desconexión entre la vista interactiva y el paginador nativo del motor de impresión. |
| **Tratamiento de CSS Grid** | Rejilla elástica bidimensional con resolución simultánea de ejes. | Inconsistencia crítica: incapacidad de fragmentar columnas asimétricas de forma sincronizada. | Elementos de la columna derecha se truncan o fuerzan saltos artificiales cuando la columna izquierda se satura. |

### **La divergencia métrica entre pantalla e impresión vectorial**

Cuando se invoca getBoundingClientRect() en pantalla para determinar si un bloque cruza el límite de la página (A4\_PAGE\_HEIGHT\_PX \= 1123px), el navegador computa los límites utilizando la densidad de píxeles del monitor y el redondeo subpíxel del motor de texto. Al abrir el diálogo de impresión o ejecutar iframe.contentWindow.print(), el motor entra en el modo de fragmentación de *CSS Paged Media*. En este modo, las fuentes vectoriales (como Poppins o Roboto) se proyectan sin redondeo de subpíxel, recalculando los anchos de avance de los glifos (*glyph advance widths*) y el interlineado (*leading*).

Una discrepancia de 3 a 4 puntos por bloque atómico se amplifica a lo largo de 10 a 15 entradas de experiencia y educación. Cuando la suma acumulada rebasa los 1123 px de la primera página por una fracción de punto, el motor de fragmentación del navegador interviene automáticamente e introduce una partición de emergencia, desplazando el contenido hacia una página subsiguiente no prevista por el algoritmo en JavaScript.

### **El bucle de doble espaciado en distribuciones de dos columnas**

En la distribución de dos columnas (layout.type \=== '2-column'), la aplicación confía en dos contenedores paralelos (.resume\_\_left y .resume\_\_right) que abarcan múltiples páginas:

> * **Efecto de box-decoration-break: clone:** La especificación obliga al navegador a replicar los rellenos (padding), bordes y márgenes del contenedor padre en cada fragmento generado por el salto de página. Si la barra lateral posee un padding-top: 24px, el fragmento que inicia en la segunda página recibe automáticamente otros 24 px en su borde superior. Si el motor de paginación en JavaScript detectó un desbordamiento e inyectó un margin-top: 24px sobre el primer elemento de esa página, el desplazamiento efectivo real se convierte en ![][image1]. Este desplazamiento empuja el contenido hacia abajo y fuerza una tercera página artificial.  
> * **Efecto de box-decoration-break: slice:** Evita la duplicación del relleno en el punto de corte, pero el navegador corta los fondos de color de manera abrupta en la coordenada de fragmentación, produciendo desfases verticales notables entre la columna izquierda y la derecha al perder la continuidad del diseño.

### **Semántica destructiva de break-before: page en selectores repetidos**

La causa raíz inmediata del fracaso en la iteración M5 reside en la inyección de directivas de salto sobre selectores de clase compartidos:

&nbsp;

&nbsp;

&nbsp;

CSS

/\* Patrón erróneo que produjo muestra\_fracaso.pdf \*/  
.education\_\_content,  
.experience\_\_content,  
.cv-block {  
&nbsp;&nbsp;break-before: page;  
}

La propiedad break-before: page posee una semántica atómica e incondicional: ordena al motor de composición generar un salto de página antes de cada caja coincidente. Si un currículum posee tres bloques bajo la clase .education\_\_content, el navegador ejecuta tres particiones obligatorias consecutivas. Cada elemento queda aislado en su propio folio A4, destruyendo la cohesión visual del documento. Estas directivas de ruptura sólo pueden aplicarse sobre un identificador único por documento, o erradicarse por completo adoptando un particionado estructural previo.

### **La trampa de simulación en JSDOM**

El entorno de pruebas unitarias con Vitest y JSDOM carece por diseño de un subsistema de renderizado. JSDOM no implementa cálculo de cajas CSS, conformación tipográfica (*font shaping*), modelos de empaquetamiento Flexbox/Grid ni el algoritmo de fragmentación de *CSS Paged Media*. Las pruebas unitarias que verifican la presencia de atributos como data-editor-break-forced="true" o clases .force-page-break-before únicamente comprueban transformaciones sintácticas sobre cadenas de texto en memoria. La coexistencia de 903 pruebas unitarias aprobadas con un documento físicamente roto (muestra\_fracaso.pdf) demuestra que la suite de Vitest sobre JSDOM introduce una validación engañosa incapaz de detectar anomalías geométricas en la salida de impresión.

## **Matriz Comparativa de Paradigmas Arquitectónicos Client-Side**

Se han evaluado cinco alternativas arquitectónicas capaces de ejecutarse de forma autónoma en el navegador, ordenadas según su idoneidad para resolver el desacoplamiento geométrico en Ressume.

&nbsp;

| Criterio Técnico | (1) CSS Paged Media Polyfill (Paged.js) | (2) Motor Tipográfico WASM (Typst vía typst.ts) | (3) Motor de Layout WASM (Yoga Layout) | (4) Generador Vectorial (@react-pdf/renderer) | (5) Particionado AST Bin-Packing (React Nativo) |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **Mecanismo Central** | Polyfill JS que fragmenta el DOM mediante columnas CSS4. | Compilador y renderizador tipográfico nativo en Rust compilado a WASM1. | Cálculo matemático de árboles Flexbox en C++ compilado a WebAssembly6. | Reconciliador React dedicado que emite comandos vectoriales directos. | Pre-cálculo de alturas en sandbox DOM y división del estado en Page\[\]. |
| **Sobrecarga en Bundle** | \~180 KB minificado9. | \~8 MB (compilador) \+ \~5 MB (renderizador)1. | \~100 KB (binario WASM optimizado). | \~600 KB \- 1.2 MB (incluye buffers y polyfills de Node)10. | **\< 15 KB** (código puro TypeScript sin dependencias pesadas). |
| **Manejo de Dos Columnas** | Deficiente; rompe flujos en Flexbox y Grid multilínea11. | **Nativo y determinista**; primitivas \#grid y control de bloques atómicos1. | Soporte Flexbox completo; requiere lógica externa para saltos12. | Limitado; requiere modelado manual estricto con primitivas \<View\>. | **Excelente**; particionado asimétrico independiente por columna. |
| **Fidelidad Tipográfica** | Depende del navegador subyacente (Blink/Gecko). | **Máxima calidad industrial**; paridad total con estándares de imprenta1. | Nula; no calcula glifos, kerning ni partición de líneas13. | Alta; renderizado vectorial tipográfico independiente del navegador. | Alta; utiliza fuentes CSS nativas en cajas cerradas de 1123 px. |
| **Intervención del DOM** | Muta y clona el DOM fuera del ciclo de reconciliación de React14. | Nula; opera sobre cadenas de marcado en memoria o Web Workers1. | Nula; computa coordenadas en un árbol de nodos en memoria6. | Nula; genera directamente un flujo de bytes binarios. | Declarativa; controlada al 100% por el Virtual DOM de React 18\. |
| **Licencia del Ecosistema** | MIT9. | Apache 2.05. | MIT6. | MIT. | MIT. |
| **Impacto de Migración** | Medio; sustituye el iframe actual por el componente Previewer15. | Alto; requiere serializar el estado del CV a marcado Typst1. | Muy alto; requiere construir un motor tipográfico sobre Yoga. | Muy alto; reescritura total de componentes HTML a primitivas PDF. | **Bajo a Medio**; reutiliza los componentes JSX y tokens CSS existentes. |

## **Evaluación de Motores CSS Paged Media y Layout Declarativo**

El análisis de bibliotecas consolidadas en el ecosistema web revela que delegar el problema en intermediarios genéricos introduce vulnerabilidades adicionales en proyectos con layouts asimétricos.

### **Limitaciones estructurales de Paged.js en interfaces React**

Paged.js está diseñado para maquetar publicaciones editoriales secuenciales (libros, artículos científicos) a partir de HTML semántico continuo4. Su arquitectura se divide en tres componentes: el *Polisher* (analizador sintáctico que traduce CSS Paged Media mediante CSStree), el *Chunker* (gestor de fragmentación) y el *Previewer* (orquestador de vista previa)4.

El Chunker determina los puntos de corte inyectando el contenido en un contenedor de columnas CSS oculto donde la altura y el ancho coinciden con las dimensiones de la página4. Cuando el contenido desborda la columna, el Chunker crea una nueva página y traslada el remanente4.

Esta estrategia presenta tres fallos insalvables para Ressume:

> * **Incompatibilidad con Grid y Flexbox Multicolumna:** En distribuciones con barra lateral y columna principal, si cualquiera de las columnas rebasa la altura de la página, el mecanismo de fragmentación de Paged.js colapsa11. Se producen anomalías donde la columna izquierda salta a la página siguiente mientras la derecha desaparece del árbol de renderizado, o viceversa11.  
> * **Desconexión con el ciclo de vida de React:** Paged.js manipula y reestructura directamente los nodos del DOM14. Al interactuar con componentes dinámicos de React 18, genera estados inconsistentes en el árbol de renderizado, interfiere con las transiciones concurrentes y produce condiciones de carrera durante actualizaciones en caliente (*HMR*)14.  
> * **Pérdida de texto por recorte arbitrario:** Cuando se aplican restricciones de fragmentación sobre elementos hijos complejos, el Chunker suele dividir contenedores en puntos intermedios inesperados, eliminando líneas de texto en los márgenes de partición16.

### **La barrera legal y operativa de Vivliostyle**

Vivliostyle Core ofrece un motor de composición para estándares de *CSS Paged Media* significativamente más riguroso que Paged.js, incorporando soporte para elementos flotantes de página, numeración compleja y encabezados dinámicos18. Sin embargo, resulta inviable para Ressume debido a dos restricciones críticas:

> * **Contaminación de Licencia:** Los paquetes @vivliostyle/core y @vivliostyle/viewer están bajo licencia **AGPL-3.0**20. Su incorporación en una aplicación cliente obligaría a licenciar bajo términos recíprocos el código fuente completo del proyecto, descartando su uso en distribuciones que requieran protección de propiedad intelectual.  
> * **Sobrecarga de Ejecución:** Vivliostyle está concebido como una plataforma editorial completa20. Su paquete base supera los 15 MB de dependencias compiladas23, imponiendo penalizaciones severas en los tiempos de carga inicial y consumo de memoria que degradan la experiencia en navegadores móviles o equipos con recursos limitados.

### **Insuficiencia de Yoga Layout WASM para paginación tipográfica**

Yoga Layout es una implementación en C++ del modelo Flexbox de CSS desarrollada por Meta, compilada a WebAssembly para cálculos geométricos multiplataforma6. Permite construir un árbol de nodos en memoria, asignar reglas de flexibilidad y calcular coordenadas exactas (left, top, width, height) de manera determinista6.

A pesar de su velocidad y precisión en el cálculo de cajas, Yoga no resuelve el problema tipográfico de Ressume:

> * Yoga es exclusivamente un motor estructural de cajas rectangulares; carece de capacidades de inspección de texto, conformado de glifos (*glyph shaping*) y cálculo de partición de líneas (*line-breaking*)12.  
> * Para utilizar Yoga en un motor de paginación, la aplicación tendría que proporcionar una función de medición manual para cada nodo de texto mediante YGNodeSetMeasureFunc. Esto requeriría reintroducir llamadas continuas a la API del DOM o implementar un motor de texto independiente, reintroduciendo las mismas inconsistencias de subpíxel que provocaron los fallos originales.

## **Compilación Tipográfica Desacoplada en el Navegador con Typst WASM**

Typst es un motor de composición tipográfica moderno diseñado en Rust que proporciona algoritmos avanzados de particionado de páginas, control de huérfanas y cálculo de layouts multicapa con rendimiento determinista3. Mediante el paquete @myriaddreamin/typst.ts, el compilador y el renderizador de Typst se ejecutan íntegramente dentro del navegador vía WebAssembly1.

&nbsp;

| Etapa del Pipeline | Disparador / Entrada | Mecanismo en Web Worker | Estado Resultante |
| :---- | :---- | :---- | :---- |
| **1\. Inicialización** | Carga de la aplicación o montaje del componente de exportación. | Descarga de binarios WASM (typst\_ts\_web\_compiler y typst\_ts\_renderer) y montaje de fuentes en memoria1. | Compilador listo para procesar sin bloquear el hilo principal de React1. |
| **2\. Serialización** | Petición de descarga o vista previa activada por el usuario. | Función pura que traduce el objeto JSON inmutable (cvData) a sintaxis de marcado Typst estructurado1. | Cadena de texto que contiene directivas \#set page, \#grid y \#block1. |
| **3\. Compilación AST** | Envío de la cadena al worker con identificador secuencial (id). | El compilador WASM (\~8 MB) parsea la sintaxis y genera el árbol tipográfico resuelto1. | Documento tipográfico fragmentado con control exacto de saltos1. |
| **4\. Renderizado Binario** | Emisión automática tras completar la fase de compilación. | El renderizador WASM (\~5 MB) convierte el AST en un flujo de bytes vectoriales1. | Uint8Array que contiene el archivo PDF ISO nativo listo para descarga1. |

&nbsp;

&nbsp;

&nbsp;

TypeScript

// typst.worker.ts \- Pipeline de compilación en segundo plano  
import { $typst } from '@myriaddreamin/typst.ts/dist/esm/contrib/snippet.mjs';

let initialized \= false;

self.onmessage \= async (event: MessageEvent) \=\> {  
&nbsp;&nbsp;const { id, type, typstSource, fonts } \= event.data;

&nbsp;&nbsp;if (type \=== 'INIT') {  
&nbsp;&nbsp;&nbsp;&nbsp;await $typst.setCompilerInitOptions({  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;getModule: () \=\> '/wasm/typst\_ts\_web\_compiler\_bg.wasm',  
&nbsp;&nbsp;&nbsp;&nbsp;});  
&nbsp;&nbsp;&nbsp;&nbsp;await $typst.setRendererInitOptions({  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;getModule: () \=\> '/wasm/typst\_ts\_renderer\_bg.wasm',  
&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;&nbsp;&nbsp;&nbsp;if (fonts && Array.isArray(fonts)) {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;for (const font of fonts) {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;await $typst.addFont(font.buffer);  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}  
&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;&nbsp;&nbsp;initialized \= true;  
&nbsp;&nbsp;&nbsp;&nbsp;self.postMessage({ type: 'INIT\_DONE' });  
&nbsp;&nbsp;&nbsp;&nbsp;return;  
&nbsp;&nbsp;}

&nbsp;&nbsp;if (type \=== 'COMPILE' && initialized) {  
&nbsp;&nbsp;&nbsp;&nbsp;try {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const pdfBytes \= await $typst.pdf({ mainContent: typstSource });  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;self.postMessage({ id, type: 'COMPILE\_SUCCESS', pdfBytes }, \[pdfBytes.buffer\]);  
&nbsp;&nbsp;&nbsp;&nbsp;} catch (error: any) {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;self.postMessage({ id, type: 'COMPILE\_ERROR', error: error.message });  
&nbsp;&nbsp;&nbsp;&nbsp;}  
&nbsp;&nbsp;}  
};

La protección contra resultados obsoletos (*stale results*) se resuelve asociando a cada petición un identificador monótono incremental (id). Cuando el usuario edita su currículum con rapidez, las compilaciones completadas cuyo identificador no coincida con el último emitido por el hilo principal son descartadas de inmediato, preservando la coherencia del estado visual1.

El marcado generado define de forma declarativa la distribución de dos columnas mediante primitivas de cuadrícula (\#grid), protegiendo los bloques individuales con \#block(breakable: false). De este modo, Typst garantiza que ningún ítem de educación o experiencia laboral se fracture por la mitad, trasladando el bloque íntegro a la página siguiente si no cabe en el espacio remanente1:

&nbsp;

&nbsp;

&nbsp;

Fragmento de código

\#set page(  
&nbsp;&nbsp;paper: "a4",  
&nbsp;&nbsp;margin: (top: 20mm, bottom: 20mm, left: 15mm, right: 15mm)  
)  
\#set text(font: "Roboto", size: 9.5pt, fill: rgb("\#333333"))

\#grid(  
&nbsp;&nbsp;columns: (65mm, 1fr),  
&nbsp;&nbsp;column-gutter: 12mm,  
&nbsp;&nbsp;\[  
&nbsp;&nbsp;&nbsp;&nbsp;// Columna Izquierda: Información de Perfil y Habilidades  
&nbsp;&nbsp;&nbsp;&nbsp;\#block(breakable: false)\[  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\#text(weight: "bold", size: 12pt)\[Contacto\] \\  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Buenos Aires, Argentina \\  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;contacto@ressume.dev  
&nbsp;&nbsp;&nbsp;&nbsp;\]  
&nbsp;&nbsp;&nbsp;&nbsp;\#v(14pt)  
&nbsp;&nbsp;&nbsp;&nbsp;\#block(breakable: false)\[  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\#text(weight: "bold", size: 12pt)\[Habilidades\] \\  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;TypeScript, React, Rust, Arquitectura Web  
&nbsp;&nbsp;&nbsp;&nbsp;\]  
&nbsp;&nbsp;\],  
&nbsp;&nbsp;\[  
&nbsp;&nbsp;&nbsp;&nbsp;// Columna Derecha: Trayectoria Profesional y Educación  
&nbsp;&nbsp;&nbsp;&nbsp;\#block(breakable: false)\[  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\#text(weight: "bold", size: 13pt)\[Experiencia Laboral\] \\  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\*Staff Software Engineer\* \--- Acme Corporation \\  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\#text(fill: rgb("\#666666"), size: 8.5pt)\[2021 \- Presente\]  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\- Liderazgo técnico del motor de paginación y renderizado en cliente.  
&nbsp;&nbsp;&nbsp;&nbsp;\]  
&nbsp;&nbsp;&nbsp;&nbsp;\#v(16pt)  
&nbsp;&nbsp;&nbsp;&nbsp;\#block(breakable: false)\[  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\#text(weight: "bold", size: 13pt)\[Educación\] \\  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\*Licenciatura en Ciencias de la Computación\* \--- Universidad de Buenos Aires \\  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\#text(fill: rgb("\#666666"), size: 8.5pt)\[2015 \- 2020\]  
&nbsp;&nbsp;&nbsp;&nbsp;\]  
&nbsp;&nbsp;\]  
)

## **Particionado Previo por Modelo de Datos: Algoritmo de Bin-Packing en React**

Para resolver las deficiencias de fragmentación sin incurrir en la descarga de binarios WASM ni reescribir las plantillas visuales a otro lenguaje, el sistema debe trasladar la partición al modelo de datos en memoria. La aplicación transforma el objeto continuo cvData en una colección declarativa PageModel\[\], donde cada página agrupa exactamente los bloques que caben dentro de los límites físicos de una hoja A4.

### **Formalización Matemática del Empaquetamiento**

Sea la altura física disponible de una página A4 a 96 DPI definida por la constante ![][image2]. Considerando un relleno vertical interior ![][image3], la capacidad útil máxima de la página queda establecida de forma estricta:

![][image4]

Cada sección del currículum ![][image5] está compuesta por un encabezado de altura ![][image6] y un conjunto de ![][image7] ítems atómicos ![][image8] con alturas ![][image9]. El espacio vertical consumido al insertar un nuevo elemento incluye el margen o separación entre bloques ![][image10].

El particionado sigue un algoritmo de empaquetamiento unidimensional (*1D Bin Packing*) con restricciones de integridad atómica:

> 1. **Condición de Entrada de Sección:** Un título de sección ![][image11] no puede ubicarse al final de una página a menos que exista capacidad suficiente para albergar simultáneamente el título, la separación y su primer ítem atómico:

![][image12]

Si la capacidad remanente no satisface esta restricción, se cierra la página actual, se incrementa el contador de páginas y el título se sitúa como primer nodo de la nueva página.

> 2. **Condición de Inclusión de Ítem:** Un ítem atómico ![][image13] se asigna a la página activa si y solo si:

![][image14]

En caso de desbordamiento, el ítem se traslada a la página siguiente. En distribuciones de dos columnas, este cálculo se realiza de forma independiente para la columna izquierda y la derecha, sincronizando la apertura de páginas adicionales según la columna que presente mayor altura acumulada.

### **Pre-medición Precisa mediante Sandbox Aislado en el DOM**

Para alimentar el algoritmo de bin-packing con valores reales y evitar las aproximaciones empíricas basadas en factores mágicos (como los fallidos \* 0.84 de iteraciones previas), las alturas de cada bloque deben registrarse en el navegador asegurando que las fuentes tipográficas hayan finalizado su carga.

&nbsp;

&nbsp;

&nbsp;

TypeScript

// src/utils/layoutMeasurer.ts  
export interface BlockMeasurement {  
&nbsp;&nbsp;id: string;  
&nbsp;&nbsp;height: number;  
}

export async function measureAtomicBlocks(  
&nbsp;&nbsp;blocks: { id: string; html: string }\[\],  
&nbsp;&nbsp;columnWidthPx: number,  
&nbsp;&nbsp;scaleTokens: Record\<string, string\>  
): Promise\<Map\<string, number\>\> {  
&nbsp;&nbsp;// Garantizar que las fuentes vectoriales estén completamente disponibles  
&nbsp;&nbsp;await document.fonts.ready;

&nbsp;&nbsp;const measurements \= new Map\<string, number\>();

&nbsp;&nbsp;// Contenedor de medición fuera de pantalla con contención de layout estricta  
&nbsp;&nbsp;const sandbox \= document.createElement('div');  
&nbsp;&nbsp;sandbox.id \= 'measurement-sandbox';  
&nbsp;&nbsp;sandbox.style.position \= 'fixed';  
&nbsp;&nbsp;sandbox.style.top \= '-10000px';  
&nbsp;&nbsp;sandbox.style.left \= '-10000px';  
&nbsp;&nbsp;sandbox.style.width \= \`${columnWidthPx}px\`;  
&nbsp;&nbsp;sandbox.style.visibility \= 'hidden';  
&nbsp;&nbsp;sandbox.style.contain \= 'paint layout style';  
&nbsp;&nbsp;  
&nbsp;&nbsp;// Propagación de variables CSS activas en el editor vivo  
&nbsp;&nbsp;Object.entries(scaleTokens).forEach((\[key, val\]) \=\> {  
&nbsp;&nbsp;&nbsp;&nbsp;sandbox.style.setProperty(key, val);  
&nbsp;&nbsp;});

&nbsp;&nbsp;document.body.appendChild(sandbox);

&nbsp;&nbsp;try {  
&nbsp;&nbsp;&nbsp;&nbsp;for (const block of blocks) {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const wrapper \= document.createElement('div');  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;wrapper.className \= 'cv-measurement-block-wrapper';  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;wrapper.innerHTML \= block.html;  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;sandbox.appendChild(wrapper);

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// getBoundingClientRect registra la altura vectorial exacta del modelo de caja  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const rect \= wrapper.getBoundingClientRect();  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const style \= window.getComputedStyle(wrapper);  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const marginVertical \= parseFloat(style.marginTop) \+ parseFloat(style.marginBottom);

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;measurements.set(block.id, Math.ceil(rect.height \+ marginVertical));  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;sandbox.removeChild(wrapper);  
&nbsp;&nbsp;&nbsp;&nbsp;}  
&nbsp;&nbsp;} finally {  
&nbsp;&nbsp;&nbsp;&nbsp;document.body.removeChild(sandbox);  
&nbsp;&nbsp;}

&nbsp;&nbsp;return measurements;  
}

Al medir contra el ancho exacto de la columna destino habiendo resuelto document.fonts.ready, las alturas computadas reflejan fielmente el renderizado final, eliminando las desviaciones causadas por fuentes no cargadas o transformaciones asíncronas.

### **Estructura de Datos Paginada y Componente de Renderizado**

Una vez ejecutado el algoritmo de bin-packing, el estado resultante se representa mediante un árbol desacoplado que React proyecta directamente en cajas A4 independientes:

&nbsp;

&nbsp;

&nbsp;

TypeScript

// src/types/pagination.ts  
export interface PageModel {  
&nbsp;&nbsp;pageIndex: number;  
&nbsp;&nbsp;sidebarBlocks: RenderableBlock\[\];  
&nbsp;&nbsp;mainBlocks: RenderableBlock\[\];  
}

export interface RenderableBlock {  
&nbsp;&nbsp;id: string;  
&nbsp;&nbsp;sectionId: string;  
&nbsp;&nbsp;isSectionHeader: boolean;  
&nbsp;&nbsp;htmlContent: string;  
}

En la capa de presentación, React itera sobre PageModel\[\], renderizando contenedores .a4-page-box cerrados con dimensiones fijas de 210mm x 297mm. Cada contenedor encierra su propio contenido con overflow: hidden, convirtiendo la salida en una secuencia de láminas estáticas inmunes a los desbordamientos.

## **Resolución Definitiva del Layout de Dos Columnas sin Duplicación de Relleno**

El diseño asimétrico clásico de un currículum —caracterizado por una barra lateral con color de fondo continuo y un cuerpo principal neutro— no debe implementarse mediante columnas continuas de altura indeterminada (min-height: 594mm) fragmentadas por el navegador.

| Capa del Layout | Propiedades CSS Críticas en Impresión | Función Arquitectónica |
| :---- | :---- | :---- |
| **Contenedor Raíz (\#area-cv)** | display: block; width: 210mm; margin: 0; padding: 0; | Actúa exclusivamente como un contenedor secuencial sin reglas de partición ni márgenes globales. |
| **Caja de Página (.a4-page-box)** | width: 210mm; height: 297mm; max-height: 297mm; overflow: hidden; page-break-after: always; break-after: page; display: grid; | Define los límites físicos de cada hoja A4. El corte ocurre de forma estricta entre cajas de página, nunca dentro de ellas. |
| **Fondo Asimétrico Sintético** | background: linear-gradient(to right, var(--sidebar-bg) 0, var(--sidebar-bg) 70mm, \#ffffff 70mm, \#ffffff 100%); | Proyecta la barra lateral coloreada en cada hoja A4 sin usar columnas infinitas ni box-decoration-break: clone. |
| **Columnas Locales** | .page-sidebar { width: 70mm; } .page-main { width: 140mm; } | Albergan únicamente los bloques atómicos asignados por el algoritmo para esa página específica. |

Bajo este modelo estructural, el archivo src/styles/print.css queda reducido a un conjunto de reglas mínimas y deterministas, suprimiendo cualquier intento de cálculo de márgenes correctivos en tiempo de impresión:

&nbsp;

&nbsp;

&nbsp;

CSS

@media print {  
&nbsp;&nbsp;@page {  
&nbsp;&nbsp;&nbsp;&nbsp;size: A4 portrait;  
&nbsp;&nbsp;&nbsp;&nbsp;margin: 0;  
&nbsp;&nbsp;}

&nbsp;&nbsp;html, body {  
&nbsp;&nbsp;&nbsp;&nbsp;width: 210mm \!important;  
&nbsp;&nbsp;&nbsp;&nbsp;height: auto \!important;  
&nbsp;&nbsp;&nbsp;&nbsp;margin: 0 \!important;  
&nbsp;&nbsp;&nbsp;&nbsp;padding: 0 \!important;  
&nbsp;&nbsp;&nbsp;&nbsp;background: \#ffffff \!important;  
&nbsp;&nbsp;&nbsp;&nbsp;\-webkit-print-color-adjust: exact \!important;  
&nbsp;&nbsp;&nbsp;&nbsp;print-color-adjust: exact \!important;  
&nbsp;&nbsp;}

&nbsp;&nbsp;\#area-cv {  
&nbsp;&nbsp;&nbsp;&nbsp;width: 210mm \!important;  
&nbsp;&nbsp;&nbsp;&nbsp;margin: 0 \!important;  
&nbsp;&nbsp;&nbsp;&nbsp;padding: 0 \!important;  
&nbsp;&nbsp;}

&nbsp;&nbsp;/\* Cada hoja es una caja física independiente e inmutable \*/  
&nbsp;&nbsp;.a4-page-box {  
&nbsp;&nbsp;&nbsp;&nbsp;width: 210mm \!important;  
&nbsp;&nbsp;&nbsp;&nbsp;height: 297mm \!important;  
&nbsp;&nbsp;&nbsp;&nbsp;min-height: 297mm \!important;  
&nbsp;&nbsp;&nbsp;&nbsp;max-height: 297mm \!important;  
&nbsp;&nbsp;&nbsp;&nbsp;margin: 0 \!important;  
&nbsp;&nbsp;&nbsp;&nbsp;padding: var(--page-padding, 20mm) \!important;  
&nbsp;&nbsp;&nbsp;&nbsp;box-sizing: border-box \!important;  
&nbsp;&nbsp;&nbsp;&nbsp;page-break-after: always \!important;  
&nbsp;&nbsp;&nbsp;&nbsp;break-after: page \!important;  
&nbsp;&nbsp;&nbsp;&nbsp;overflow: hidden \!important;  
&nbsp;&nbsp;&nbsp;&nbsp;display: grid \!important;  
&nbsp;&nbsp;&nbsp;&nbsp;grid-template-columns: var(--sidebar-width, 65mm) 1fr \!important;  
&nbsp;&nbsp;&nbsp;&nbsp;column-gap: var(--column-gap, 10mm) \!important;  
&nbsp;&nbsp;&nbsp;&nbsp;background: linear-gradient(  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;to right,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;var(--sidebar-bg-color, \#f4f5f7) 0,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;var(--sidebar-bg-color, \#f4f5f7) calc(var(--sidebar-width, 65mm) \+ var(--page-padding, 20mm)),  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\#ffffff calc(var(--sidebar-width, 65mm) \+ var(--page-padding, 20mm)),  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\#ffffff 100%  
&nbsp;&nbsp;&nbsp;&nbsp;) \!important;  
&nbsp;&nbsp;}

&nbsp;&nbsp;/\* Desactivación total de fragmentación en elementos internos \*/  
&nbsp;&nbsp;.cv-block,  
&nbsp;&nbsp;.section-title,  
&nbsp;&nbsp;.education\_\_content,  
&nbsp;&nbsp;.experience\_\_content {  
&nbsp;&nbsp;&nbsp;&nbsp;break-inside: auto \!important;  
&nbsp;&nbsp;&nbsp;&nbsp;break-before: auto \!important;  
&nbsp;&nbsp;&nbsp;&nbsp;page-break-inside: auto \!important;  
&nbsp;&nbsp;&nbsp;&nbsp;page-break-before: auto \!important;  
&nbsp;&nbsp;&nbsp;&nbsp;margin-top: 0 \!important;  
&nbsp;&nbsp;}  
}

Al utilizar un degradado lineal estático sobre la propia caja de página A4, se garantiza que el color de fondo de la barra lateral se renderice completo en todas las páginas sin requerir que la columna se extienda verticalmente a lo largo de varias hojas ni recurrir a box-decoration-break: clone.

## **Arnés de Validación Determinista en CI con CDP y pdf-lib**

La persistencia del error a lo largo de cinco iteraciones de agentes automáticos se debió a la ausencia de una prueba que verificara la geometría del documento compilado. Para erradicar los falsos positivos derivados de JSDOM y asegurar que ninguna regresión llegue a producción, el pipeline de integración continua debe ejecutar una validación física sobre el binario PDF real generado por un navegador sin cabeza (*headless*).

&nbsp;

| Fase de la Prueba | Herramienta / Tecnología | Operación Verificada | Criterio de Rechazo Inmediato |
| :---- | :---- | :---- | :---- |
| **1\. Renderizado de Interfaz** | Playwright / Chromium Headless | Carga de dataset problemático (muestra\_fracaso.json) y resolución de fuentes. | Tiempo de espera superado en document.fonts.ready. |
| **2\. Emisión Vectorial** | Chrome DevTools Protocol (Page.printToPDF) | Generación directa de bytes de PDF sin intervención de diálogos nativos. | Generación de buffers nulos o malformados. |
| **3\. Inspección Estructural** | pdf-lib (PDFDocument.load) | Conteo estricto de páginas en la estructura binaria del documento27. | Recuento de páginas mayor a 2 (getPageCount() \> 2). |
| **4\. Inspección Semántica** | pdfjs-dist (getTextContent) | Extracción de coordenadas verticales (![][image15]) del encabezado y primer ítem27. | Coexistencia de títulos en una página e ítems en otra (huérfanos). |

&nbsp;

&nbsp;

&nbsp;

TypeScript

// tests/e2e/printVerification.spec.ts  
import { test, expect } from '@playwright/test';  
import { PDFDocument } from 'pdf-lib';  
import \* as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

test('Garantía determinista: El dataset crítico genera estrictamente 2 páginas sin huérfanas', async ({ page }) \=\> {  
&nbsp;&nbsp;// Navegar al editor cargando el estado documentado de fallo  
&nbsp;&nbsp;await page.goto('/?fixture=muestra\_fracaso\_dataset');  
&nbsp;&nbsp;await page.waitForSelector('\#area-cv');  
&nbsp;&nbsp;await page.evaluate(() \=\> document.fonts.ready);

&nbsp;&nbsp;// Emitir el PDF real mediante Chrome DevTools Protocol  
&nbsp;&nbsp;const pdfBuffer \= await page.pdf({  
&nbsp;&nbsp;&nbsp;&nbsp;format: 'A4',  
&nbsp;&nbsp;&nbsp;&nbsp;printBackground: true,  
&nbsp;&nbsp;&nbsp;&nbsp;margin: { top: 0, bottom: 0, left: 0, right: 0 }  
&nbsp;&nbsp;});

&nbsp;&nbsp;// 1\. Verificación Estructural Estricta con pdf-lib  
&nbsp;&nbsp;const pdfDoc \= await PDFDocument.load(pdfBuffer);  
&nbsp;&nbsp;const totalPages \= pdfDoc.getPageCount();  
&nbsp;&nbsp;expect(totalPages, 'El documento rebasó la capacidad física máxima prevista').toBe(2);

&nbsp;&nbsp;// 2\. Extracción de Capa de Texto con pdfjs-dist  
&nbsp;&nbsp;const loadingTask \= pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) });  
&nbsp;&nbsp;const pdf \= await loadingTask.promise;

&nbsp;&nbsp;// Extraer texto de la Página 2 para comprobar la integridad de la sección Educación  
&nbsp;&nbsp;const pageTwo \= await pdf.getPage(2);  
&nbsp;&nbsp;const textContent \= await pageTwo.getTextContent();  
&nbsp;&nbsp;const textItems \= textContent.items.map((item: any) \=\> ({  
&nbsp;&nbsp;&nbsp;&nbsp;str: item.str,  
&nbsp;&nbsp;&nbsp;&nbsp;y: item.transform\[5\] // Coordenada Y en puntos tipográficos  
&nbsp;&nbsp;}));

&nbsp;&nbsp;const educationHeader \= textItems.find(item \=\> item.str.includes('Educación'));  
&nbsp;&nbsp;const firstEducationItem \= textItems.find(item \=\> item.str.includes('Licenciatura'));

&nbsp;&nbsp;// Aserción semántica: el encabezado y el ítem deben residir juntos en la página 2  
&nbsp;&nbsp;expect(educationHeader, 'El encabezado de educación debe situarse en la página 2').toBeDefined();  
&nbsp;&nbsp;expect(firstEducationItem, 'El contenido de educación no debe fracturarse a una página adicional').toBeDefined();

&nbsp;&nbsp;// Aserción de proximidad: el ítem no debe estar desfasado fuera de la página  
&nbsp;&nbsp;if (educationHeader && firstEducationItem) {  
&nbsp;&nbsp;&nbsp;&nbsp;const verticalGap \= Math.abs(educationHeader.y \- firstEducationItem.y);  
&nbsp;&nbsp;&nbsp;&nbsp;expect(verticalGap, 'El ítem educativo está desplazado anormalmente').toBeLessThan(150);  
&nbsp;&nbsp;}  
});

Este procedimiento de prueba elimina por completo la indeterminación: la suite falla si y solo si el motor de diseño real del navegador genera una página de más o fractura visualmente el texto.

## **Plan de Migración Secuencial para el Repositorio Ressume**

Para estabilizar la rama de desarrollo Re-do-total-de-impresion-PDF y erradicar las regresiones acumuladas, se define una intervención estructurada en cuatro fases de ejecución obligatoria.

| Fase | Ámbito de Archivos | Modificación Técnica Concreta | Condición de Aprobación |
| :---- | :---- | :---- | :---- |
| **Fase 1: Saneamiento y Purgado de Deuda** | src/utils/staticHtmlPdfEngine.js src/index.css | \- Eliminar factores de escala empíricos (\* 0.84, \* 0.92). \- Suprimir la función stubbada enforceTwoColumnComponentPagination. \- Purgar cualquier bloque @media print residual de index.css. | npm run build sin errores de compilación ni selectores CSS en conflicto. |
| **Fase 2: Motor de Particionado Previo** | src/utils/layoutMeasurer.ts src/utils/binPackingEngine.ts src/hooks/usePaginationEngine.js | \- Implementar measureAtomicBlocks con contenedor sandbox aislado. \- Desarrollar el algoritmo de empaquetamiento 1D con prevención de huérfanas. \- Refactorizar el hook reactivo para emitir un estado estructurado PageModel\[\]. | Pruebas unitarias de empaquetamiento verificando la asignación correcta de bloques. |
| **Fase 3: Renderizado de Cajas A4 Estáticas** | src/App.jsx src/components/A4PageBox.jsx src/styles/print.css | \- Actualizar App.jsx para iterar sobre PageModel\[\] renderizando componentes \<A4PageBox /\>. \- Sustituir columnas continuas por degradados lineales estáticos en cada caja. \- Simplificar print.css a directivas fijas de 210mm x 297mm. | Visualización en pantalla con guías de página sincronizadas con el corte real. |
| **Fase 4: Blindaje de Validación Continua** | cypress/e2e/04-cdp-pdf-generation.cy.js tests/e2e/printVerification.spec.ts | \- Integrar aserciones basadas en pdf-lib y pdfjs-dist contra el binario PDF emitido vía CDP. \- Incorporar la prueba en el flujo de pre-push y en las acciones de integración continua. | Ejecución exitosa del test determinista generando exactamente 2 páginas sobre muestra\_fracaso\_dataset. |

El traspaso del control de fragmentación desde el motor CSS del navegador hacia una estructura de datos particionada en memoria resuelve de raíz la inestabilidad histórica del motor de impresión de Ressume. Al convertir el documento en una colección finita de páginas A4 rígidas antes de alcanzar el contexto de impresión, se elimina la sensibilidad a las variaciones de subpíxel entre monitores, se neutraliza la duplicación de márgenes en distribuciones multicolumna y se dota al proyecto de un pipeline determinista, reproducible y blindado contra regresiones.

#### **Obras citadas**

> 1. Building a Privacy-First Resume Editor with Typst WASM and React, [https://dev.to/kakutixyz/building-a-privacy-first-resume-editor-with-typst-wasm-and-react-1d13](https://dev.to/kakutixyz/building-a-privacy-first-resume-editor-with-typst-wasm-and-react-1d13)  
> 2. Myriad-Dreamin/typst.ts: Run Typst in JavaScriptWorld. \- GitHub, [https://github.com/myriad-dreamin/typst.ts](https://github.com/myriad-dreamin/typst.ts)  
> 3. Built a browser-based PDF exporter using Typst \+ WASM ... \- Reddit, [https://www.reddit.com/r/ObsidianMD/comments/1ppmoql/built\_a\_browserbased\_pdf\_exporter\_using\_typst/](https://www.reddit.com/r/ObsidianMD/comments/1ppmoql/built_a_browserbased_pdf_exporter_using_typst/)  
> 4. Our position paper for the W3C CSS print workshop \- Paged.js —, [https://pagedjs.org/posts/en/our-position-paper-for-the-w3c-css-print-workshop/](https://pagedjs.org/posts/en/our-position-paper-for-the-w3c-css-print-workshop/)  
> 5. Open Source \- Typst, [https://typst.app/open-source/](https://typst.app/open-source/)  
> 6. yoga-layout-taffy 0.1.0 on npm \- Libraries.io, [https://libraries.io/npm/yoga-layout-taffy](https://libraries.io/npm/yoga-layout-taffy)  
> 7. How does the new React Native architecture work? \- 前端学习之路, [https://segmentfault.com/a/1190000041182092/en](https://segmentfault.com/a/1190000041182092/en)  
> 8. Announcing Yoga 3.0 \- Yoga Layout, [https://www.yogalayout.dev/blog/announcing-yoga-3.0](https://www.yogalayout.dev/blog/announcing-yoga-3.0)  
> 9. Paged.js —, [https://pagedjs.org/](https://pagedjs.org/)  
> 10. diegomura/react-pdf \- ReferenceError: Buffer is not defined \- GitHub, [https://github.com/diegomura/react-pdf/issues/2758](https://github.com/diegomura/react-pdf/issues/2758)  
> 11. Newest 'pagedjs' Questions \- Stack Overflow, [https://stackoverflow.com/questions/tagged/pagedjs?tab=Newest](https://stackoverflow.com/questions/tagged/pagedjs?tab=Newest)  
> 12. React Native layout management with Yoga 3.0 \- LogRocket Blog, [https://blog.logrocket.com/react-native-layout-management-yoga-3/](https://blog.logrocket.com/react-native-layout-management-yoga-3/)  
> 13. baseline\` does not align flexbox items perfectly on a common, [https://github.com/vercel/satori/issues/691](https://github.com/vercel/satori/issues/691)  
> 14. Paged.js in Vue 3 ignores page-break attempts \- Stack Overflow, [https://stackoverflow.com/questions/78440645/paged-js-in-vue-3-ignores-page-break-attempts](https://stackoverflow.com/questions/78440645/paged-js-in-vue-3-ignores-page-break-attempts)  
> 15. Integrating Paged.JS into React/JS website \- Stack Overflow, [https://stackoverflow.com/questions/78514243/integrating-paged-js-into-react-js-website](https://stackoverflow.com/questions/78514243/integrating-paged-js-into-react-js-website)  
> 16. Error log \- Creative Crowds wiki, [https://cc.vvvvvvaria.org/wiki/Error\_log](https://cc.vvvvvvaria.org/wiki/Error_log)  
> 17. Flex Items Do Not Overflow To Next Page In Printed PDF (Paged.js), [https://stackoverflow.com/questions/78040487/flex-items-do-not-overflow-to-next-page-in-printed-pdf-paged-js](https://stackoverflow.com/questions/78040487/flex-items-do-not-overflow-to-next-page-in-printed-pdf-paged-js)  
> 18. CSS Paged Media \- PolyDoc Documentation, [https://docs.polydoc.tech/guides/css-paged-media/](https://docs.polydoc.tech/guides/css-paged-media/)  
> 19. Vivliostyle Foundation FY2020 Activity Report, [https://vivliostyle.github.io/vivliostyle\_doc/en/reports/vivliostyle-report-2020/vf2020report.html](https://vivliostyle.github.io/vivliostyle_doc/en/reports/vivliostyle-report-2020/vf2020report.html)  
> 20. Vivlio \- Obsidian Plugin, [https://community.obsidian.md/plugins/vivlio](https://community.obsidian.md/plugins/vivlio)  
> 21. FAQ | Vivliostyle, [https://vivliostyle.org/faq/](https://vivliostyle.org/faq/)  
> 22. MIND THE GAP \- Ouvrir la Science, [https://www.ouvrirlascience.fr/wp-content/uploads/2019/09/Mind-the-Gap\_A-Landscape-Analysis-of-Open-Source-Publishing-Tools-and-Platforms.pdf](https://www.ouvrirlascience.fr/wp-content/uploads/2019/09/Mind-the-Gap_A-Landscape-Analysis-of-Open-Source-Publishing-Tools-and-Platforms.pdf)  
> 23. subev/libratory \- GitHub, [https://github.com/subev/libratory](https://github.com/subev/libratory)  
> 24. React Native — Behind the scenes \- Medium, [https://medium.com/@bhavsarurvi143/react-native-behind-the-scenes-a1fd2f896607](https://medium.com/@bhavsarurvi143/react-native-behind-the-scenes-a1fd2f896607)  
> 25. React Native Fabric Rendering Explained \- Manmeet Singh, [https://thatsmanmeet.com/blog/react-native-fabric-rendering-explained/](https://thatsmanmeet.com/blog/react-native-fabric-rendering-explained/)  
> 26. typst.ts vs typst \- compare differences and reviews? | LibHunt, [https://www.libhunt.com/compare-typst.ts-vs-typst](https://www.libhunt.com/compare-typst.ts-vs-typst)  
> 27. pdfjs-dist vs pdf-lib vs pdf2json vs compare-pdf, [https://npm-compare.com/compare-pdf,pdf-lib,pdf2json,pdfjs-dist](https://npm-compare.com/compare-pdf,pdf-lib,pdf2json,pdfjs-dist)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMUAAAAZCAYAAACBxOqkAAAD4klEQVR4Xu2YC7EbMQxFF0MpFEMplEIpPAqPQhkUQiGUQRmUQQg8AG3OJHdGUWWvtZ98dWY87fM6a+nqYyfTVBRFURRFURRFURTFLnw+ju/H8fv879fLxyFvx/HDTz4RSzRBD3R5JT4dx6/j+OIfTCfN0ITn79Np7UOAMwT+23RyAgf+Tv3g4tzHdPrcM7JEE9axhgJ6JfAXv33TQCt0Y55BURymBykMDPWBZA5H6ZYRSpJ7LorR7h6R1YRA67n/3DND88DnqChomr4Afk4PcruQU/b4U/VHAaZ76vmzFkVWEwLde/6sEH9890WhU9MXBdrQUO8e3fmsA60As0aFMFIUOjp17SDJdCWx0H21lqFkjOZGWVMUGU3Yg/VKBP/cM6oJ89Z/NMIeP3cr8NM2SGs/djJ3cPN/ptNnWoxqs0e+zKLrkTeGeW02VxQYznN1XT6LgDiMOAwlHXOs5chlrY5YRJW42WN3TVFERJqoSShZ54oiown+ai26sAbtpRFrlTzXBjvU8aOiAJ0giqd8bZHRZo986aJ7Ivc/i7qCYE2vKIQctZWLANEXdfZg7fv5b2xYGvgti6KlCcJrj5GiEBlNlFxaS3KMdEHs4V2ZMXrysFYJ2ioKsIWBb71TQmS02TJfmuAoovvg22uTyBaFhz2884CQCIDY3o4If6XQ4LOI5eej4PVoacJ7bDdaUhSelibqlLsEPYmuTfbvqCiwE5tVnCqOOfuz2mTzJQ1HVvRi5r3Ta4tCYqrKLYjJs5HORYDYw4/DdHqPn2eMvFdEmqhQ7HeOLYqipYk6JT7dEhLSxzwqCv7vf33CJ+YYPbLaQCZfUhB4G3x9mQGfVDJcR9rbeV3EnJPRZ/kM77adOMsW16eWJkoOOxQYEpe/fUezZDVhX71/5AoCrRO0N2wSR2CX9xt/sUsNCNAsih17+ALyZLWBLfLlP3iZ34yK9HMWDJQIPVpO0oGj6tYVgf0zSeBZWxRZTRTwNSdFpImurvpyS/C9ZhGsx5bMmCuKCCWr1Ro7Wwnq/fNktIGt8uUCXqiObwdzvaTKFoXtnPri6oXDMTqOyCSBZ01RLNFkSVHMaUKS2q7L33Rmq9GtiYqCxPTXJyC+czkzqg1smS8XsFlrRPg1jF4iyEkFl+GPOgmroePc75NhTVH4fXs2RHbKhxYjmmiN3dfrNJdge+JtsXaC9Ym1+Iq9vlA8I9r4vbfIl6siJ0F38jlhtmBNUezNrTS5NvjGqUsset+xLC+hjXXymiDm6mN0J26lySPw1Nro1w/9anLPSXotSpM2L6FN9LMlR+krU5q0KW2KoiiKoigej3+MXgW3ZghALwAAAABJRU5ErkJggg==>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJAAAAAaCAYAAABYbdUGAAADYElEQVR4Xu2ZjZHTQAxGXQMtUAMt0AIt0AIt0AElUAId0AEdXANXAORN7oHQaG0n8U3Osd7Mzvi88v5In7QbmKamaZqmaZqmaW7i46n9LtqXl/5fRd/Pl74jgH8+5ZeJd6f2Nb8MMMa3U/sxne3e/9/9l8/TPxuedwULRxyVsxTZ99zxoBA8gmjyVOJABLzHJ8/T2a5CUShExsT+Q7BBgCQltjxji82uEvVpGjsBR9G3u6y4EvZpWxIQwSbQle+w4T02+R3+FuehSolj7sLnbmqkeDczKr2PipW3ElBkJCC/p5pEtFdYCohKJdp4lXjTzGUa5Iw5CrcKiOMIUcTKAllAEI808EQYJa1HnUcj+JzH0s7Gt4yb310N57hqz5Pxjr6j3H8i7P8WAY2gItFGQVtzZfA+ZXIjVGJFY+wYL9YXbRGYRYNGfxbdRTCoA+Vm39xm7gmOymuea0tiiLyGgEzIyp+80+dUrZHAIooi2iKuat2ISFsqEH+vmWOWt3b/cT6Cd2+2FhBZTnWoxBMhqAR3TYBHsUMo+e5FDK1OfHNT1RE2M+ckFZ4Z2Y+4xP4RBYQQ8OOSeMRKFS/WFSMBuaYsEqvTZlcS7z9VwHRgNVm16BGMsxSEyGg9FTgI27UtO3QO97+09iUBWVGieBjbqk5Q8XGsNs49Ny4sCSifHMz1NJ0rUe67CgYbLXJ0mVN09Mc+FsfZTYu/DJiDDWHvovlO2xygSwREpvL92ua61rCVgKrjgsqiLxRKnMeTAeHNMRIQAsHvEdaALfPStzT2Igw4WgB4c6+Umh1mFgnPBsvgRdgAwQfmj0K8RECvyRYCwg8mUGzRnr/xdfRz/GU8BzaMH6uXx19MFi/NvjP2JPDFxPIYm0G0KsWWRZYdRn90NM9+UwkI2ASbzd8y9j0FxFry/kc+qJprH/k5j4UfCC6iYW6Cik3lswx2xIuKhr3/tZITMs+riG1r5toUJgWzhk1kAVkio4C0ZwP+VM0Ci0E4EuwZPxD8qupXRFF4H9wFLNzgA8qP5dD7DZhVPpuZYvY41lEFdA25mu0GBBNFg5gQAn9bSj2XLdH0IQx/lWDHEea/Syg0nMJYa7PwiOAbExFf6tddUS24eie5rwVyPRxzJF1s+Zde0zRN0zRNsxF/AKAIeRNSWCdYAAAAAElFTkSuQmCC>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAaCAYAAACzdqxAAAAA2UlEQVR4Xu2UURHCMBBETwMW0IAFLGABLThAAhJwgAMcYAABJW/CDiGTpFyTL6Zv5j6a9vYue2nMVv6GXYipEc8QlxAbJXghGaF9ts4z4vds/WceFoVL3KxcdJatxUQESqioW/hoMfGUv7DPDBB3U/OXgbELPKaAG22VjhXn9zpFscqN/GXqdJzG4iMGLX+7qPnbTev8phwsNqEhXq3h/dz5FewGyxioLNNMvqAqR0j3gaLmswTIUZd8W+3YA+LpfUH3Q6BDfAU6xZohIEbHCNYs62LRr70yhhd0rj/X3WdB5AAAAABJRU5ErkJggg==>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAAlCAYAAAD/XbWoAAACl0lEQVR4Xu3c0XHTQBQFUNVAC9RAC7RAC7RAC3RACZRAB3RAB2mAAsB3kjtZNnJiGztR4nNmdizJtrRP+bnzVs6yAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABcmY+78WcYX3bj17D/8/6jmzbXEVus4/NufF9u7/OxPiz/1pjxezfejR8CAN6uhpz6utyGi9fkZj6wPKzrJWV+7++2G9yOtfUaAYALSXhIQBu9xhCwNue1gPNS0uUbQ/DafJ8yfyddty3VCABcSJfosqyYke05GLwGmXNraB2ndLGeQ4LWKcu0498lS6E5R84FALxhWaKbw1lCwHzsUHO3p89dXVrqmANQ9rsEeao+B7cm5x4D4jgeC1HpsuXZszW53j65Xt7vNTy7BgBXIh2oOZBk/9TOVILEbD7/Y+bgc2gIynzHa2f70OtmOXht3nHMeQ6RGlrH2jOC++YRc40AwJW4WR4Gkuw3TPxY7jtV7WD1BwkJHt/u9j/dvZdAkaXIHGsHqOfPOeZn5WZ5f9/oNdakjlE+P9aVsDNeO/POiHS7xoDamuKcgW3uAj7WTVsz11i5Lw2B/9tRBAA2pEGkIwGs4a2jut3uzhxwcjzfzevYAcr3uiSaUJHXBKFTu3dr5jpirGNeJo3xWLYzxnn3+bJ23s4V2MZ59l4cYv53Hmsa1AQ2ALhSDQkNNXltFyrhKGGvoWcObA08+cy+sPHcMudKl6tzb0ewtZ07sF3KeM8BgCuVAJPAleXRLHfmNR2zBIUGti6dNsz1/fFHDTmWEPRSXaB29hLMGsqy3cCZ7Yx2AXMsdW09sOV+poZDO3YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8Az+AhAcq4cxNJbGAAAAAElFTkSuQmCC>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAaCAYAAACzdqxAAAABEUlEQVR4Xu3U4W3CMBCGYc/ACszACl2BFVihK3QDRugIbMAG3YAFGKD1I3LIOTkqGAn+8EqnOJHz3d3nS0p580rWNbY1PqY1Ns16iH2NU42vKX5qfE7XVbPvLr5rHMtcwFoiMYS2f0u/XZVLOgQLCPcgvMsPb+VQLsJEMroY9ldFhMW5XBI5tGHBFnYQjQTioWnIOEiWRBKVB2GZPf9i+Hv4SLLv/F465BnaNLs9YgTbibBe2j9DVUsbibCj9dg868AzFjmXLjG/2Q73RPP8+gIVQ9TVni7xL/BCVBP/iywa/tqnYpELuiJrENNAsDdinivEOxL3Pv8hdBITQjgKeRjVRusOnIXZriGyPfn+zZP4A654Q+HGeSchAAAAAElFTkSuQmCC>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADEAAAAaCAYAAAAe97TpAAAB7klEQVR4Xu2Wf1HEMBCFowELaMACFrCABSzgAAlIwAEOcICBEwD9rryZ8G632R7tDH/0m8nMXZpu9u2PpK0dHPwrbqdx45MbgE1sXwUvVl++m8Z720cEvLV5jzKv0/j6Gc/2LALHP9pvwcwhqjqe5tdSsPfZ6kE989hmEff+IADRLpb3EfZgc9h86eZwCuf8/QjeR3AZZWMETrDOIxSlXzY9MAjwuYxTq689R6eimjIg4j0qJQebUWAQ7EHIIBCMIYouEeI3jvZl0YMALwUy4OtlMxLXl9cISopsDFHtsiGqSR/ORg6wzh2OkE0XvBZ8icr3AtUuGws291JQdCs1mvXDWsp7EnWvc1LuIhSVocGW9wPgGPtlz53hnjRllHacoAF7qiKW+kGsOT6He1LfvohG9fKCqohKP0R3TcZwz6hsNEeWEKnbVVlbNNjmDI7WkWmekzXEZDd4KXDRKcR/zfmZznGXbShY44HpUbmRcbKGCC9dIRGLsMCdIhPqCS8p5qLLh/XY8sG82+A/87ovEJUdoQj0Q+cC/1QQzEeGcaB0+SygW5jgjRzkuQd5E4hi5cLLwDH1g0olanKeE7BdPvcR4H1UBYeUSX1uE+moIijdXbIgVA7X4JH1/0DZRr23OTRm1Dd/BVFReR0c7Mk3YoSbbgagbyoAAAAASUVORK5CYII=>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAaCAYAAAC6nQw6AAAAwElEQVR4Xu2SURECMQxEowELaDgLWMACFrBwDpCABBzgAAcYQADktbdMLi18M0PfzE4hbbJNemaDwQ+ycR1c2xDbuY4pNlk9x9rlajXpafUg/1kV27surtPy++GaS2aADTmTdLN6Q0GMxHgLjNAKXZWVJFoSKs5NIpg1hcTZqnPkW3G66HK31oWbkBTR3OIjvJFLHmCvOG0hwGj1gmohBj8VV4wHySZlI8+HueTioEGjvFeq93puDi5gEj+RwX/zAm1IMvC4HKj8AAAAAElFTkSuQmCC>

[image8]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJQAAAAaCAYAAABRhnV8AAAC/UlEQVR4Xu2ZjU3DMBCFMwMrMAMrsAIrsAIrsAEjMAIbsAEbsAADAJ+qJ5nr+S910wv1J0Vtaie5e372pcmyTCaTyWQymUwmk1A8/m7fzvaUdtqQ1+U4Fra7tNMV8rkca/L1p0cw3pZDkA+24UIgFvHc2IYrhkmFJh+2ISKaARG4XQ6xvNuGK0fV5Nk2RCPaAO5GuI3R7cC9bYhGtAHcjXAbE6mKFIk2gLsRbkOiVZEikQZwV8JtSLQqkiU3gPzOv4lWo/FvbESyOeF64mGlZdV9Wf7P44ZcFUEn/hFbvS5GbgCBNms0D46lX8tg18gJBy3xcJxyoT9iY8a9U6oitHl6XYTSANLmGc2D43MJ91ASriUezVjBqlY7Jjq5KgJqC0NpAOV8gmZQSk/Pa4ai9NRWipJw0BIPbenDWY7xDFWLhxLuTbKUEeegvfbwtrWK8J0y78WEJrRxPXTjO5/kwHmZrCffHujJqzeAGlz6ECgX5Wl6jpKhdJ3aqwISzAnXGw8Qk1fyWuLRmwPPtDDiHMq3lofO45lTq7bMQTzWGLq/ZWPFloE5J1qCTLUKOd5u6UDSh9mNk4FBsQOTUjIUx+lVSk4UG4vt2xsPoiGeFRdq8QDXoT33KkrnKL0GqZ2D35WrB/laTWxf+rAgKE8vH2lFP8Ui8wli9SbyMBhkNpxfEk2UDCUI2Eu4hZ54MBN9NRNz1zwlnpF4FaIFrdrkgCY54wr6ShN0TFdGjOlNvmEQIIEqaJCDubBdxlsMtVY4KMWDkKmYmIl9+vOZm3mnxDMKBrhW8nKQm3JQ6WMl18qtMggyneCaGkP6YChiUQUYCifWcsh3LpYGp6Vas5skSIzfCMib9brvWUMtHpUW4HdbIkbHMxKM4MXXAnnLFOTCfpoTBpLh1C7Se0t0pC99an8QVmNPbPcxVc8SaVe0Xuz17X6vOU6NZwTkoJviNVgN7D5IF9tm7z9t++acZWlcCWL0GuoaUMkPD+7uWZ3ODcJdfIYFZBdmmkwmk/PxAxa5CRJ9wfqpAAAAAElFTkSuQmCC>

[image9]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADkAAAAaCAYAAAANIPQdAAACFklEQVR4Xu2X4VHDMAxGPQMrMAMrsAIrsAIrsAEjMAIbsAEbsAADQF/LB0bIkkxy4Ufz7nxtHVuRPklO2trOzllxeRgXdnIDruzEDDjNqMCNntv/BHl9GI92MoMN75/j3lzzILCX5gvCnGz146lftAL4+WAnM27byRlUykCUTIy7drI37cgEr63m7xfKZoYy5WWxR/amnJgEIWmZMqhS2YBhSjUDexXRllAV/IgWU4J8J5CbHyu+IcCsVGWvItpSEBN/U9SPOEWZUWIE4znJupEAQvYyMdZAPqeof3BO4KAtN2Uo67Mt+lFwLy8ZvyBrts84FW2QOF1xftSPPEYq+3uommg9yUiD5JnnlRaO2mdbJcioH3VtBjIVveGUgkQp6zhGbflCJcioH7mWOjRJKUivLDVHlhFBp5eyHgUZ9aNeIrCDzehFAaFZ64nVQ4BpkN4p2m+kZPvn0FuLj2yuW9EELSDR+GSthx5jMLIl8DMT4mjEOo3C6klbsszZIxvVFVw/evHUj+wlk4xRrzHPdarBHogWbGaPtPBG3psEQY8yEME+HMYhBPRsW7KX8KgaFqOymwFnVVbsJ0v6TdbUqz1UQnSfyh+FP8ONbR9nkEVVDXtpEbUCWSUj1mEdfh7YQqzR9VVARdvLEdYZ73dvL+pH1iLUqNVWhRKs9FYFAsQWgfHdO/QE85sEuDbqPQJEvKgXd86OD/NqoT+Uh5qDAAAAAElFTkSuQmCC>

[image10]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAaCAYAAAC+aNwHAAAAyklEQVR4Xu2SbQ2EMAyGpwELaMACFs4CFs4CDpCAExyckBPA9QkrKWsZyf0kPMmbBdbvLqWHK1pRL3rlU2lEnfl2YLyIvqJZNOaTfwT9ZJuQSbSmzYlMFpy4QyFk4XIoLwxkR4532pypoAZtOBtKpV9Ull1CANc//ZKdFq5giA56IgDr+gudbFQ++6ZkK/cGaqvR/TMfbKiWlg/oZQ1tM6py3//ZDHDS7CFMliowiDJoArd/C4Mp3z8iKI8M57MKDxAIB5zdg3m4JT+Uajg1cXQRygAAAABJRU5ErkJggg==>

[image11]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAaCAYAAABYQRdDAAAA30lEQVR4Xu2UYQ0CMQyFqwELaMACFrCABSzgAAlIwAEOcIABBMC+LA2j23W93S+S+5L+aS9vb++uJ7LyV+xT3WcUz3e5prql2pneO9Wh6CFGLyT6SLUxvadkAQtOu+DkbHpbyYItAQx0OUoWsT1E7WFwsY0ommcouyhTeQ7j5Qm8Aw6dmjfx8lSIx5tXRPLEqTeveImfp8YDCOO4XJAKNsrLE4iHOUK63qefJ+R7cqv40MvVBeKhjzgwt9s4G/LEGeLDi1CCI81TY+Cm6noIcuRvBponL2rx9UuBxWIrMT5RakF7UpzFEgAAAABJRU5ErkJggg==>

[image12]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAAlCAYAAAD/XbWoAAAD+UlEQVR4Xu3cgY3bNhQGYM/QFTpDV+gKXaErdIVu0BEyQjboBt0gC2SANj/OD3kl+GT57KS46/cBgm1aJCXqAP6gdL5cAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA+Pm6xQ/9i3duOtcPX7Zf18KT/lwLnijH+8vl67Wq10f9eN12fro895w+rgUAwLFM+JmME1Cy5f1f/9rjffr0Zfv7MgeeP9r7jMm07ervyp4hgSrH/Pvl5fgSpPL+Ubnu1e5O/h56mKvjqO1eCZ1TOAQAFtMq0lsLbAkuWbW5NygltO1kXLq+CjfVWX2+zKt3r5FgtB5XQtutPs6ujE3Ba1p5y7HcO95dxueR+gDwv5AJM9vOW55Ia5XwlgTVhJSEvWwltxt7eOmBtuqckeN41q2/aSVvWhHrzoxFAlnaymvOv5vC+9lxmGQsp78/AOAqE26/7feeZNVpChql3wZMcKjwk9epbtU5I+2cXY07kqA29XlrdS3OBLaEp+yX88u59zpT31P5WUfnBQBcZbI8M+G/RWceku+BtYeUvE51U2f9bgplUyDJseW73ba79Zj+1nZ6nVXa6N/n3I72jx5QMybV33QO0csr9E7WVbsytQ0AXE2T5RpIvrfX3kZMuMix70LPTj//vK96twLbGno+LZ/LUdi5R8Zj106C1RSEuulcunUssuIW0znk+347tv4JYTLduj2qAwBcXibLdcLPLbGUZQJOIPjt8rIKly2Tbv2kRCbsfJeybPUwfOrkc7WbsJD3Vbf2qYfl833aqpWu9JsAVKGo2ru1ElgB4mxYix5kaoUpq1/pcwo5u4BRIW4NJfm82/9eObddOznmW+MS07l0a2BLu3Xtd32v/3CQY6xrubsG69jEFAYBgCbhJJN+Jt9MqOvEXiGmJu3+TFbtW6998s77Cl29vIJX/XxI9un91r71ufbt/T5L+ur/aJA+q9+U9yCx/oRFtl63h70u7T3rGcG6Bllty3ik3YSjM9brupNwVjLW6af09zU2tZXUOepnF9hS1m/FAgAHMln3CbvUBLy73TUFtkzcCRIp3wW2er6ql61t5HP9lETf91tKP3216p6AmLHbBbM12D0q45GxXVdFbzkKUjs55r5KdiYY5lwzhtOx7QJbwtru7w4AOCkTdh4iryBSP9CaCTkTc77LRF6/pZVVmOxbgS2fExSqPPtkgs5ryqutlFVb2Tf99om873sk++22XVA460xYrONa+0r4e2ZY+6/dCn11vervJdexxiNluabrtRDWAICHVUh9jTOrUm/NbhXxyO5ZtvLacQUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+Pb+AUo2AKqzOHC3AAAAAElFTkSuQmCC>

[image13]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAaCAYAAABLlle3AAABBElEQVR4Xu2UAQ3CQAxFqwELaMACFrCABSzgAAlIwAEOcICBCQAetyaXptcNRgkke8llg972e//fTmRmJoHtY9ycsasnZXGSIraxhUyuUkS/xlKK4NkWMtFc97aQyVGK6NoWMvmZPPn/0tdegU+NZ0OiPKnZZiIWUj49riFRntS8ZiYT5UmNZrAL8eiU4lA59NeQlfh5gmbNHGxGFOs8EKI5hveuJ63ztraSOayU7oEmWhtEo+F5nf8W5MnAUnbxGFjloL0RCGmemrk6geVevswb3LkteLCr7rEZEcSA1dgdz/1YR5rYju1vhLUJmJznGBDAehzRVdZNfBzEVEAPkFTB/+EOyalHCBagN34AAAAASUVORK5CYII=>

[image14]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAAlCAYAAAD/XbWoAAADU0lEQVR4Xu3c0XEkNRiFUcdACsRACqTAK4+kQApkQAiEQAZkQAabwAYA/mr3rxKq7pm21wu2OadKNZ5utVrqeZhbksYPDwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwNfy7WP54bF8//n9N8u59+y7/cDit/3AF/h9P/CC+qzWzw4AeIf6ov/4WH55+BRSCm9//qPG+/Thsfy1H/zs58fy63asulM6/xSFqp7rS6vN+tNnV38LoC8ZNAGAV6Av+5+2Y4W1txbYCi5/7AcvOLvmLPQU8p6rUHxlFuxKnfTZ7f0stJ2FUADgjWnGpwBxtPRZiLkaGl6bxtNsU+VobKuCauOs7ro02vLikep/SRjq+p75PVee/dlnNGMHAN6BvtTPwsfXWLr7txWOmiW8FdqanWpvWQFtDVJngaf6Z8/sigLWleuPgtjqVjuN99aYAYA3ZPZivVeFrlvLuoWadfxr3bNl0urPuSv7/I72uR098/pSCJvSdev7XX3Y21nrH10DALxBzSjtX/qvQeHlub+onH1sVwLLutergLQ+i1uBbW173z92xZVnfq//PZ+jdhrT2XIuAPAGnS3vTQgp/BQACgeFqP6efWEFmpYc51eJ6x6wjtVGwWECVH93bJbqqjPhovMFplmG7P2Hh0+hZe5bubfMV/2nBKhmxyaYzY8sZjy9HtmfV/1sjEdLqI1tD0/1cW/jyL3AdraX7t4SMADwBhVOmmkr6BzNzsySXyGgOgWTQkqvE3YmXKwBYuplzs9m+Nqcv9ewMzNjlWm7NrtvZdp7KbU9IXPC27zvdd3HNwFpyhybPu17/mbMe/C7t0w77gW2zJJugbp2u1d9AgDeocJJM1xH/0B2glOBZA0RtwLbhJj9/IS0PXidBbb5/2JXwstz7OPd79MzuWWC5K0AdhSA77WbvS9nekaFtP0+AMD/RGFg/eVkIapwVTgoeHSusNAMTwGjcNUsT4Gs147/+Pm197PsuC6vdl3Haqf2qtv5CTaFqvW+ZyZAHpXafI76cCs4zbNpvBPC1oB5dO2VsAYAwBPss3D3FERnNnKfeZuZRAAA/kMT8ApnTw17AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAK/Q3wjXDkujOn4QAAAAASUVORK5CYII=>

[image15]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAWCAYAAAAfD8YZAAAAk0lEQVR4XmNgGAUkAzcg/o8FCyErAoJnSHIgXIksCeKABHciCyIBZSD+zACxDAOAbMJlK4h/AohN0cRRAMhWkOYMNHGQxnA0MQwA0oTu9JVQcYIA2ekgP4LCAaSZaAByHkjzdQZMvxMEMKejRAWxAORMkGa8IYsLgBIDKD5JBqBAQg9tggCUatCTHwhjTU2jgEwAAPJAKVETddWmAAAAAElFTkSuQmCC>