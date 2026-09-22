---
title: "Ressume — PDF Print Engine: Contexto Completo para Agentes de IA Externos"
project: Ressume
repository: https://github.com/juani981/Ressume
branch_active: Re-do-total-de-impresion-PDF
document_type: ai_context_brief
language: es
scope: pdf_print_engine
version: "2026-09-21"
criticality: MÁXIMA
warning: >
  Este documento existe porque al menos 5 iteraciones de agentes de IA,
  incluyendo modelos frontier (Claude, GPT-4o, Gemini), produjeron PDFs
  rotos mientras sus suites de tests reportaban 100% verde. Si estás
  leyendo esto como IA externa, eres la siguiente en la cadena.
  Léelo completo antes de escribir una sola línea de código.
keywords:
  - css-paged-media
  - break-before
  - break-inside
  - box-decoration-break
  - jsdom-limitation
  - print-engine
  - pagination
  - pdf-parity
  - iframe-print
  - a4-layout
  - vitest-false-positive
must_read_first:
  - FRACASO_SALTOS_DE_PAGINA.md
  - AGENTS.md
  - BRAIN.md
  - HANDOVER_CONTEXT.md
high_risk_files:
  - src/styles/print.css
  - src/utils/staticHtmlPdfEngine.js
  - src/utils/paginationEngine.js
  - src/hooks/usePaginationEngine.js
  - src/index.css (bloque @media print — prohibido tenerlo aquí)
evidence_of_failure: muestra_fracaso.pdf
---

# Ressume — Motor de Impresión PDF: Contexto Comprimido para Agentes de IA Externos

## ⚠️ Aviso de lectura obligatoria

Este documento es un **briefing técnico de alta densidad** diseñado para ser entregado a un agente de IA externo antes de que toque cualquier línea de código relacionada con la paginación o el PDF de este proyecto. No es documentación estándar. Es una **autopsia en tiempo real** de un bug que ha sobrevivido a múltiples generaciones de agentes de IA altamente capaces.

Cada sección de este documento existe porque un agente ignoró ese punto y rompió el PDF. Cada prohibición tiene detrás un commit de regresión, un muestra_fracaso.pdf adjunto, o un ciclo de 48 horas de depuración.

---

## 1. Qué es Ressume (Contexto mínimo)

Ressume es un editor de CV (currículum vitae) de una sola página, construido con **React 18 + Vite**, que opera 100% en el cliente. No tiene backend. Almacena todo en `localStorage`. El usuario edita su CV en tiempo real y puede exportarlo como:

- **PDF** via `window.print()` del navegador (pipeline vectorial, sin canvas)
- Markdown semántico para consumo de otras IAs
- Snapshots versionados en localStorage

El CV se renderiza dentro de un contenedor `#area-cv` que simula una hoja A4 en pantalla (794px a 96 DPI). Cuando el contenido supera una página, un motor de paginación JavaScript calcula dónde insertar saltos visuales en el editor, y el motor de impresión replica esos saltos en el PDF.

### Stack relevante

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Framework | React 18 | Hooks, Context API, renderToStaticMarkup |
| Build | Vite 5 | ESM nativo, HMR |
| Tests unitarios | Vitest + jsdom | **⚠️ jsdom no tiene motor de impresión** |
| Tests E2E | Cypress + Chromium | Sí ejecuta impresión real |
| DnD | @dnd-kit | Prohibido usar swapy |
| PDF Export | window.print() en iframe | Sin html2canvas, sin pdfkit |
| CSS | CSS Custom Properties + BEM | Theming via tokens, sin CSS-in-JS |
| Íconos | lucide-react | Sin CDN externo |

---

## 2. Arquitectura del Motor de Impresión PDF

### 2.1 Evolución: de Doble Árbol Sintético a cloneNode

El motor de impresión pasó por **dos generaciones arquitectónicas**:

#### Generación 1 — Árbol Sintético (Obsoleta, fuente de bugs)

La primera implementación usaba `renderToStaticMarkup(React.createElement(PrintBaseSection, ...))` para reconstruir el DOM desde cero a partir del estado (`cvData`). Esto creaba un árbol paralelo que **nunca era idéntico** al árbol que el usuario veía en pantalla, generando:

- Diferencias en la estructura de bullets
- Mutaciones regex sobre clases CSS (`.editable-section-container`)
- Factores de zoom arbitrarios en `body.style.zoom`
- Variables CSS hardcodeadas en lugar de derivarlas del DOM vivo

#### Generación 2 — cloneNode (Actual, commit `2fc0b8d`)

La implementación actual usa `cloneNode(true)` sobre el `#area-cv` vivo:

```
Usuario hace click en "Exportar PDF"
  → executeCleanPrint(cvData, lang)
  → createSanitizedPrintClone(liveAreaCv)
      1. cloneNode(true): clon profundo del DOM renderizado en memoria
      2. UI Scrubber: elimina [data-editor-ui="true"] y .no-print
      3. Placeholder Scrubber: elimina [data-is-empty="true"]
      4. Focus Scrubber: limpia contenteditable y .inline-edit-active
      5. Break Scrubber: normaliza márgenes de salto del editor
      6. Geometry Scrubber: elimina min-height/height del #area-cv
  → Escribe HTML limpio en un <iframe> fuera de pantalla con:
      - cv-base-styles (index.css completo)
      - cv-print-styles (print.css con @media print)
      - Transferencia de CSS custom properties (--*) desde #area-cv
  → Espera doc.fonts.ready
  → iframe.contentWindow.print()
  → Cleanup: removeChild(iframe)
```

### 2.2 El iframe fuera de pantalla

El `<iframe>` se monta con:
```javascript
iframe.style.position = 'fixed';
iframe.style.top = '-10000px';
iframe.style.left = '-10000px';
iframe.style.width = '794px';
iframe.style.height = '1123px';
iframe.style.opacity = '0';
iframe.style.pointerEvents = 'none';
```

Esto garantiza que el diálogo de impresión del navegador se dispare desde un contexto aislado, sin alterar el scroll ni el estado del editor principal.

### 2.3 El pipeline de estilos

Dentro del iframe se inyectan exactamente **tres bloques de estilo**:

```html
<style id="cv-base-styles">  /* index.css completo */  </style>
<style id="cv-print-styles"> /* print.css con @media print */ </style>
<style id="cv-snapshot-breaks"> /* saltos calculados por el editor */ </style>
```

Las variables CSS se propagan desde el DOM vivo al iframe:
```javascript
for (let i = 0; i < liveAreaCv.style.length; i++) {
  const prop = liveAreaCv.style[i]; // --font-scale, --page-padding, etc.
  if (prop.startsWith('--')) {
    doc.documentElement.style.setProperty(prop, val, priority);
  }
}
```

### 2.4 El motor de paginación del editor

El motor de paginación (`paginationEngine.js` + `usePaginationEngine.js`) es un algoritmo JS que corre **en pantalla**, no en el contexto de impresión. Su trabajo es:

1. Medir la altura A4 real via un `<div style="height: 297mm">` oculto → típicamente 1123px a 96 DPI
2. Detectar "Zonas Prohibidas": bandas de `[foldTop - pagePadding, foldBottom + pagePadding]` alrededor de cada corte de página
3. Iterar elementos candidatos (`.section-title`, `.cv-block`, `.experience__content`, etc.)
4. Empujar elementos que cruzan la zona prohibida con `margin-top: Npx !important` y `data-editor-break-forced="true"`
5. El salto visual en pantalla es un `.a4-page-fold-guide` de 20px que **NO existe en el PDF**

El `gapPx = 20` del editor es **exclusivamente visual**. El PDF no tiene ese gap. Cada hoja A4 física comienza exactamente en 0mm. Este dato ha causado al menos 3 iteraciones de bugs.

### 2.5 Archivos de alto riesgo y su rol

| Archivo | Rol | Riesgo |
|---------|-----|--------|
| `src/styles/print.css` | SSOT de estilos de impresión. Solo contiene `@media print`. | 🔴 CRÍTICO |
| `src/utils/staticHtmlPdfEngine.js` | Clona el DOM, sanitiza, escribe el iframe, dispara print. +1600 líneas. | 🔴 CRÍTICO |
| `src/utils/paginationEngine.js` | Calcula breaks en pantalla. Factores mágicos aquí = PDF roto. | 🔴 CRÍTICO |
| `src/hooks/usePaginationEngine.js` | Hook React que corre el motor via ResizeObserver + RAF. | 🟠 ALTO |
| `src/index.css` | Estilos del editor. **PROHIBIDO tener bloques `@media print` aquí.** | 🟠 ALTO |
| `src/App.jsx` | Componente dios (~471 líneas). Contiene el `gapPx = 20` del editor. | 🟡 MEDIO |

---

## 3. El Problema Que Ninguna IA Ha Podido Resolver

### 3.1 El síntoma

Cada vez que un agente de IA modifica el código de paginación, el PDF resultante tiene **más páginas de las esperadas**, con **saltos de página dentro de secciones** que deberían fluir juntas.

El archivo `muestra_fracaso.pdf` en la raíz del proyecto es evidencia física directa. Fue generado **después** de que un agente declaró "paridad 1:1 resuelta" y "903 tests pasando al 100%". El PDF tiene **3 páginas**. Debería tener **2**. La sección Educación muestra un salto de página después de cada ítem individual.

### 3.2 El ciclo que se repite

```
1. IA detecta problema de paginación.
2. IA agrega break-before: page o break-inside: avoid en selectores incorrectos.
3. Tests de Vitest y Cypress pasan (miden presencia de atributos CSS, no comportamiento real).
4. IA declara "paridad 1:1 resuelta". Cierra el ticket.
5. Usuario imprime. El PDF tiene 3 páginas con contenido fracturado.
6. El ciclo se repite con la siguiente IA.
```

Este ciclo se ha repetido **al menos 5 veces**, con diferentes modelos de IA, en diferentes sesiones, produciendo siempre el mismo resultado.

### 3.3 Historial documentado de fracasos

| Iteración | Agente | Acción | Tests | PDF Real |
|-----------|--------|--------|-------|----------|
| M1 | teamwork multi-agente | Purgó heurísticas de pantalla, estableció CSS Paged Media declarativo | ✅ | No validado |
| M2 | teamwork multi-agente | Sincronizó sliders en print, armonizó tokens tipográficos | ✅ | No validado |
| M3 | teamwork multi-agente | Implementó `overflowingBullet` en `paginationEngine.js` | ✅ | No validado |
| M4 | teamwork multi-agente | Escribió spec Cypress 09, CDP PDF generation | ✅ | No validado |
| M5 (FINAL) | teamwork multi-agente | Remediación completa, purgó overrides, factores 0.84, min-height inflado | ✅ 44/44 Cypress, 903 Vitest | **PDF: 3 páginas. Educación fracturada. FRACASO.** |

El resultado empírico es que **ninguna combinación de tests automatizados puede detectar este bug**. La única validación válida es que el usuario abra el PDF en su navegador real (Zen Browser / Gecko / Chromium), cuente las páginas, y confirme el contenido.

---

## 4. Por Qué Los Modelos de IA Fallan en Este Problema

Esta sección es el núcleo del documento. Si la lees y la comprendes, tienes más posibilidades de no repetir el patrón.

### 4.1 Razonamiento desde texto, no desde ejecución real

Los LLMs aprenden de texto: documentación de MDN, artículos de StackOverflow, libros de CSS. Nunca ejecutaron un motor de fragmentación CSS real. Cuando razonan sobre `@media print`, `break-inside: avoid`, `box-decoration-break: clone`, o saltos de página A4, están **interpolando patrones estadísticos**, no calculando resultados reales.

Esta interpolación produce código que **parece correcto sintácticamente** y que **supera cualquier test de presencia de atributos**, pero que el motor de impresión del navegador interpreta de forma completamente diferente.

La brecha entre "código que parece correcto a una IA" y "código que produce un PDF correcto en Gecko/Blink" es exactamente el espacio donde vive este bug.

### 4.2 JSDOM es una trampa de falsa seguridad

**JSDOM no tiene motor de renderizado de fuentes. No calcula `@media print`. No particiona páginas A4. No ejecuta el algoritmo de fragmentación CSS del navegador.**

Cuando un test de Vitest afirma que `break-inside: avoid` está presente en el HTML generado, está midiendo **sintaxis de un string**, no **comportamiento físico**. Un PDF roto puede coexistir con 903 tests en verde. Este proyecto lo demuestra empíricamente con `muestra_fracaso.pdf`.

Las mocks del entorno de tests lo confirman:
```javascript
// src/tests/setup.js
window.print = vi.fn();                          // Print es un no-op
window.ResizeObserver = class { observe() {} }; // ResizeObserver es un no-op
```

No se ejecuta ningún motor de impresión. No se genera ningún PDF. Los tests miden que el código JavaScript *llama* a las funciones correctas, no que el PDF resultante tenga la geometría correcta.

### 4.3 El error más frecuente y más dañino: `break-before: page` en selectores de lista

Este es el patrón que produjo el `muestra_fracaso.pdf`:

```css
/* ❌ PROHIBIDO: break-before en selector que aplica a múltiples ítems */
.education__content,
.experience__content,
.cv-block {
  break-before: page;
}
```

Si `.education__content` aplica a 3 entradas de educación, el resultado es **3 saltos de página** — uno antes de cada entrada. Una sección con 3 ítems produce 3 páginas extra. Una sección con 5 ítems produce 5 páginas extra.

**Regla de oro absoluta**: `break-before: page` solo puede aplicarse a un selector que represente exactamente **UN elemento por documento** — nunca a un selector de lista o repetido.

Los selectores donde `break-before: page` es seguro (hay exactamente uno en el documento):
- `[data-item-id="experience_1"]` (ID único de un elemento específico)
- `.force-page-break-before` (solo inyectado por el motor en el elemento específico)
- `[data-editor-break-forced="true"]` (marcador único por elemento)

### 4.4 Los motores de pantalla e impresión son físicamente distintos

`getBoundingClientRect()` devuelve métricas en **píxeles de pantalla** a la resolución del monitor. El motor de impresión del navegador trabaja en **puntos tipográficos** (pt) en un contexto DPI completamente diferente.

Las fuentes web (Poppins, Roboto, Inter) tienen métricas de renderizado **diferentes** en pantalla vs. en el contexto de impresión vectorial:
- En pantalla: rasterizado subpíxel a la resolución del monitor
- En impresión: renderizado vectorial para salida A4 (Gecko) o PDF (Chromium --headless)

Una viñeta de `87px` en pantalla puede ser `91pt` en impresión. Estos ~4pt acumulados en múltiples ítems desplazan los saltos de página naturales del navegador, haciendo que el contenido caiga en páginas distintas a las calculadas por el agente.

**Consecuencia directa**: Cualquier código que calcule posiciones de salto de página con `getBoundingClientRect()` de pantalla y luego inyecte `margin-top`, `padding-top`, o `break-before` dinámicos para "compensar" la diferencia está **condenado a fallar**. Los números de pantalla nunca coinciden con los números del motor de impresión.

### 4.5 El doble padding de `box-decoration-break: clone`

En el modo de 2 columnas (`layout.type === '2-column'`), las columnas `.resume__left` y `.resume__right` tienen `min-height: 594mm` (para un CV de 2 páginas) y `box-decoration-break: clone`.

`box-decoration-break: clone` hace que el navegador **replique el padding del contenedor** en cada fragmento de página. Si la columna tiene `padding-top: 24px` y un elemento dentro de ella tiene `break-before: page` con `margin-top: 24px`, en la Página 2 ese elemento queda desplazado `24px + 24px = 48px` desde el borde, en lugar de los 24px esperados.

Este bug solo aparece en modo 2 columnas. En modo 1 columna, `box-decoration-break` es `slice` por defecto y el problema no ocurre.

El tradeoff es real: `clone` es necesario para que el color de fondo de la columna izquierda se extienda por ambas páginas. `slice` elimina el double-padding pero puede cortar el gradiente de fondo. La solución correcta es usar `slice` y resolver el fondo con un gradiente en `#area-cv` directamente — pero incluso esta solución tiene casos edge no completamente validados en Gecko vs Blink.

### 4.6 El gapPx = 20 que no existe en el PDF

En el editor, entre cada "hoja" A4 visual, hay un gap de 20px. Este gap es una separación visual que el usuario ve en la pantalla para entender dónde termina una página y comienza la siguiente. Está implementado como `.a4-page-fold-guide`.

Este gap **no existe en el PDF**. El papel físico no tiene gaps entre hojas.

```javascript
// App.jsx — línea 108
const gapPx = 20; // SOLO en el editor. NUNCA en el path de impresión.
```

La altura total del editor para un CV de 2 páginas es `2 * 297mm + 1 * 20px`. La altura del PDF es `2 * 297mm`. Son números distintos. Cualquier cálculo que use la altura del editor directamente para determinar saltos de página del PDF está equivocado por exactamente 20px.

Este error aparece cuando un agente ve:
```javascript
const estimatedPages = Math.ceil((contentHeight + gapPx) / (pageHeightPx + gapPx));
```
...y lo "simplifica" a:
```javascript
const estimatedPages = Math.ceil(contentHeight / pageHeightPx);
```

Ambos producen el mismo número de páginas para la mayoría de los CVs, pero difieren en los casos edge donde el contenido está exactamente en el borde de una página. Estos casos edge producen el PDF de 3 páginas.

### 4.7 Cada agente llega sin memoria del parche anterior

El agente nuevo ve código con overrides que no entiende. Los comenta o elimina porque "parecen innecesarios". Restaura el bug original. El patrón reinicia.

Esto es regresión de deuda técnica circular. El único mecanismo de defensa disponible es este documento y `FRACASO_SALTOS_DE_PAGINA.md`. Si los ignoras, repites la historia.

---

## 5. Las Reglas que DEBES Seguir

### 5.1 ✅ Lo que ESTÁ permitido

- Usar `break-inside: avoid` en contenedores que representan **un ítem atómico** (ej: `.cv-block` aplicado a UN ítem específico mediante inyección directa, no como selector global)
- Usar `@page { size: A4; margin: 0; }` para geometría base
- Usar `orphans` y `widows` para controlar líneas sueltas
- Dejar que el motor de impresión del navegador decida **naturalmente** dónde cortar — es más preciso que cualquier heurística JavaScript
- Usar `break-after: avoid` en títulos de sección para evitar que queden huérfanos sin su primer ítem
- Validar SIEMPRE imprimiendo realmente en el navegador y contando páginas manualmente
- Modificar selectores CSS solo después de leer `FRACASO_SALTOS_DE_PAGINA.md` completo

### 5.2 ❌ Lo que está PROHIBIDO (con evidencia de por qué)

| Prohibición | Evidencia del daño |
|-------------|-------------------|
| `break-before: page` en selectores de lista repetidos | Produjo el PDF de 3+ páginas en `muestra_fracaso.pdf` |
| `getBoundingClientRect()` antes de imprimir para calcular offsets | Los números de pantalla no coinciden con los del motor de impresión |
| `margin-top` dinámico calculado desde píxeles de pantalla | Acumula errores de subpíxel que se manifiestan en la impresión |
| `min-height: NNNmm` inflado artificialmente en `#area-cv` | Con zoom < 1.0, Chromium escala la altura y genera una página extra |
| Factores mágicos de escala (`* 0.84`, `* 0.92`) | Nunca son precisos; dependen de la fuente, el OS y el navegador |
| Declarar el problema resuelto sin que el usuario imprima | Los tests no detectan este bug — solo el ojo humano sobre el PDF impreso |
| Modificar `print.css` sin leer `FRACASO_SALTOS_DE_PAGINA.md` | Invariante del proyecto |
| Agregar reglas `@media print` en `index.css` | Compite con `print.css`; produce comportamiento impredecible |
| Usar `html2canvas` o cualquier librería de captura | El PDF debe ser vectorial. El texto debe ser seleccionable |
| `body.style.zoom` como corrección de escala | Genera páginas en blanco en Chromium al interactuar con `min-height` en mm |

---

## 6. El Estado Actual del Código (Septiembre 2026)

### 6.1 Arquitectura CSS de impresión

El archivo `src/styles/print.css` es la **Única Fuente de Verdad** para estilos de impresión. Todas sus reglas viven dentro de `@media print { }`.

Estructura actual:

```css
@media print {
  @page {
    size: A4;
    margin: 0;
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Geometría base */
  #area-cv, .resume {
    width: 794px !important;
    min-width: 794px !important;
    max-width: 794px !important;
    margin: 0 auto !important;
  }

  /* Columnas 2-col: min-height para llenar ambas páginas */
  .resume__left, .resume__right {
    min-height: var(--print-target-height-mm, 297mm) !important;
    box-decoration-break: slice !important; /* migrado de clone para evitar double-padding */
  }

  /* Prevención de fractura de ítems atómicos */
  .cv-block, .experience__content, .education__content, ... {
    break-inside: avoid !important;
  }

  /* Prevención de títulos huérfanos */
  .section-title, h1, h2, h3 {
    break-after: avoid !important;
    break-inside: avoid !important;
  }

  /* Saltos forzados (inyectados por el motor, elemento por elemento) */
  .force-page-break-before,
  [data-editor-break-forced="true"] {
    break-before: page !important;
    margin-top: var(--page-padding, 24px) !important;
    /* margin-top: 0 provocaría que el elemento toque el borde superior de la página */
  }
}
```

### 6.2 Variables CSS disponibles en el iframe de impresión

Estas variables se transfieren desde el DOM vivo al iframe:

| Variable | Valor default | Descripción |
|----------|--------------|-------------|
| `--page-padding` | 24px | Padding interior de la página (top/bottom) |
| `--section-gap` | 20px | Espacio entre secciones |
| `--item-gap` | 8px | Espacio entre ítems de una sección |
| `--font-scale` | 1.0 | Factor de escala global de fuentes |
| `--title-scale` | 1.0 | Factor de escala de títulos |
| `--body-scale` | 1.0 | Factor de escala de cuerpo |
| `--line-height` | 1.5 | Interlineado |
| `--body-font` | 'Poppins' | Familia tipográfica |
| `--print-target-height-mm` | Npx | Calculado en runtime: totalPages * 297mm |
| `--print-total-pages` | N | Calculado en runtime |

### 6.3 Constantes críticas del motor

```javascript
// pageGeometry.js
const A4_PAGE_HEIGHT_PX = 1123;      // Medido con ruler div a 96 DPI
const MAX_A4_2PAGE_HEIGHT_PX = 2246; // 2 * 1123
const MIN_SCALE_FLOOR = 0.75;        // Escala mínima permitida

// App.jsx
const gapPx = 20;                    // Gap visual del editor. NUNCA en print.
```

Estas constantes están hardcodeadas porque son resultado de medición empírica. No las cambies sin medir primero.

### 6.4 Dead code documentado en staticHtmlPdfEngine.js

La auditoría del agente explorador identificó:

- **`enforceTwoColumnComponentPagination` (líneas 564–717)**: Código de fallback para entornos headless/JSDOM. Nunca se ejecuta en el browser porque `snapshot.brokenElements` siempre es truthy. Tiene tests de Vitest que lo prueban directamente, por lo que no se puede eliminar aún.
- **`renderItemHTML` (líneas 227–237)**: Función muerta. No la llama nadie en producción ni en tests.
- **`computeAdaptivePrintLayout` (líneas 113–154)**: Exportada, con tests. Conservar.

### 6.5 Bugs activos en el branch `Re-do-total-de-impresion-PDF`

Estos bugs existen desde el commit `2fc0b8d` (rewrite a cloneNode) y aún no han sido resueltos con validación visual del usuario:

1. **Iframe Visibility**: `opacity: 0` en lugar de `visibility: hidden` — falla tests legacy
2. **Drag-handle en CSS inlineado**: `.drag-handle` aparece en `cv-base-styles` porque index.css se inyecta sin scrubbing — falla tests que buscan ausencia de este selector
3. **Selectores de 1 columna**: En modo 1-col, el CSS inlineado aún contiene `.resume__left` / `.resume__right`
4. **`enforceTwoColumnComponentPagination` stubbada**: Retorna no-op, falla 9 tests de Vitest
5. **Page Break Carry-Over**: `createSanitizedPrintClone` elimina los `margin-top` del editor, pero los elementos que necesitan saltar páginas ahora dependen 100% del motor CSS nativo — que en CSS Grid (2-col) puede ser impredecible en Chromium

---

## 7. Por Qué Ninguna IA Ha Podido Resolverlo Definitivamente

Esta es la pregunta central. La respuesta tiene varias capas:

### 7.1 El problema es epistémicamente inaccesible para una IA

Una IA no puede **ver** el PDF. Puede generar código, puede razonar sobre CSS, puede leer los tests. Pero la única validación que importa —contar las páginas del PDF impreso y confirmar que el contenido está correctamente distribuido— requiere un ser humano con ojos frente a una pantalla.

Ninguna IA puede cerrar el loop de feedback por sí sola. Los tests automatizados disponibles no detectan el bug. La IA no tiene acceso al navegador en tiempo real de ejecución del usuario. La validación requiere intervención humana manual, y esa intervención nunca ha ocurrido hasta que el usuario abre el PDF y ve 3 páginas cuando esperaba 2.

### 7.2 El entorno de ejecución de la IA y el del problema son incompatibles

La IA razona en texto. El problema vive en la física de fragmentación CSS de motores de renderizado de documentos (Gecko, Blink). Estos motores implementan la especificación CSS Paged Media con diferencias sutiles entre sí, y con comportamientos que no están completamente documentados ni en MDN ni en ningún corpus de texto que la IA haya visto.

Hay comportamientos de `box-decoration-break`, `break-inside` en Grid containers, y comportamiento de `margin-top` al cruzar un `break-before` que son **contradictorios entre Gecko y Blink**, y que el comportamiento real solo emerge al ejecutar el motor.

### 7.3 Los tests dan una señal equivocada

El proyecto tiene 797 tests de Vitest y 44 tests de Cypress, todos pasando al 100% antes del `muestra_fracaso.pdf`. La señal de "tests en verde" es tan fuerte que cualquier IA razonable concluiría que el problema está resuelto. Esta es exactamente la trampa.

Los tests de Vitest corren en JSDOM, que no tiene motor de impresión. Los tests de Cypress corren en Chromium headless, pero verifican **presencia de atributos CSS** en el DOM, no geometría física de las páginas del PDF resultante.

No existe en este proyecto ningún test que pueda decir: "esta función produce exactamente 2 páginas con X líneas de texto en la primera y Y líneas en la segunda". Tal test requeriría una librería de parsing de PDF que pueda extraer la geometría exacta del texto por página, y aun así dependería de que el PDF fuera generado por el motor real del navegador del usuario.

### 7.4 El problema acumula deuda de cada iteración

Cada agente que "arregla" el problema deja código adicional: comentarios, overrides, flags condicionales, variantes de CSS. El siguiente agente ve ese código extra, lo encuentra confuso, lo "limpia", y en el proceso restaura el bug. El código base crece en complejidad mientras el bug permanece constante.

El archivo `staticHtmlPdfEngine.js` fue tocado en más de 12 commits. `App.jsx` en más de 15. `print.css` en más de 10. El historial de git muestra oscilaciones constantes en torno a las mismas variables: `margin-top`, `box-decoration-break`, `min-height`, factores de zoom.

### 7.5 No hay reproducibilidad determinística del bug

El bug no aparece siempre. Depende de:
- El contenido específico del CV (número de ítems, longitud de bullets)
- La familia tipográfica activa (Poppins vs Roboto tiene kerning diferente)
- El slider de `lineHeight` activo
- El slider de `bodyScale` activo
- Si el modo es 2 columnas o 1 columna (ATS)
- El navegador específico (Gecko vs Blink producen saltos levemente diferentes)
- La versión del OS (las fuentes del sistema afectan el rasterizado)

Un CV con 3 ítems de experiencia y 2 de educación puede producir 2 páginas perfectas. El mismo CV con `lineHeight: 1.7` produce 3 páginas. La IA no puede cubrir este espacio combinatorial con tests estáticos.

---

## 8. La Única Estrategia que Podría Funcionar

Basada en el análisis de todas las iteraciones fallidas, la única estrategia que tiene posibilidad de producir un resultado correcto y validable es:

### 8.1 CSS Paged Media declarativo puro, sin ninguna heurística JavaScript

El navegador es el experto en fragmentación de páginas. Su algoritmo CSS Fragmentation (Level 3) es más preciso que cualquier cálculo JavaScript basado en `getBoundingClientRect`. La estrategia correcta es:

1. Definir `break-inside: avoid` en **contenedores atómicos** (un ítem de CV = un contenedor atómico)
2. Definir `break-after: avoid` en títulos de sección
3. No intervenir con `break-before: page` salvo cuando el usuario explícitamente lo haya solicitado para un elemento específico
4. Dejar que el motor de impresión decida naturalmente dónde cortar

### 8.2 Eliminar toda heurística de pantalla del path de impresión

El motor de paginación JavaScript (`paginationEngine.js`) es correcto para mostrar los fold guides en el editor. Pero sus cálculos **no deben influir directamente en los estilos del PDF**. Los `margin-top` dinámicos inyectados por el motor deben ser neutralizados en el clone, no replicados.

### 8.3 Validación con PDFium o `pdfinfo` en el pipeline de CI

Para cerrar el loop de feedback sin intervención humana en cada PR, el pipeline de CI debería:
1. Generar el PDF con Playwright/Puppeteer en modo headless
2. Parsear el PDF con `pdf2json` o `pdfinfo`
3. Extraer el número exacto de páginas
4. Comparar el recuento con el esperado

Esto no ha sido implementado. Es el único mecanismo técnico que podría detectar el bug automáticamente.

### 8.4 El estándar de validación no negociable

**Un fix de paginación solo está completo cuando el usuario abre el PDF en su navegador (Zen Browser / Gecko / Chromium), cuenta las páginas, y confirma que el contenido está correctamente distribuido.**

Ninguna cantidad de tests verdes, ningún log de consola, ningún `pdfinfo` que diga "2 páginas" desde un headless, equivale a que el usuario haya validado visualmente el documento impreso en su navegador de producción.

---

## 9. Glosario de Conceptos Clave

| Término | Definición en este proyecto |
|---------|----------------------------|
| `#area-cv` | El contenedor principal del CV en el editor. 794px de ancho. |
| `gapPx = 20` | Separador visual entre páginas en el editor. NO existe en el PDF. |
| `A4_PAGE_HEIGHT_PX` | 1123px a 96 DPI. Medido con ruler div, no hardcodeado arbitrariamente. |
| `pageHeightPx` | Sinónimo de A4_PAGE_HEIGHT_PX en el contexto del editor. |
| `foldTop` | Coordenada Y donde comienza el gap visual de una página. |
| `Zona Prohibida` | Banda `[foldTop - pagePadding, foldBottom + pagePadding]` donde no puede haber cortes. |
| `break-before: page` | Propiedad CSS que fuerza un salto de página. Peligrosa en selectores de lista. |
| `break-inside: avoid` | Propiedad CSS que evita que un contenedor se corte entre páginas. Segura en contenedores atómicos. |
| `box-decoration-break: clone` | Replica padding/border del contenedor en cada fragmento de página. Causa double-padding. |
| `box-decoration-break: slice` | No replica padding. Puede cortar fondos de color. |
| `cloneNode(true)` | Clona el DOM vivo del editor para impresión. Generación 2 del engine. |
| `createSanitizedPrintClone` | Función que clona y limpia el DOM del editor para el PDF. |
| `executeCleanPrint` | Función principal del motor de impresión. Orquesta el pipeline completo. |
| `snapshotBreaksCSS` | CSS generado dinámicamente con los saltos calculados por el motor del editor. |
| `data-editor-ui="true"` | Atributo que marca elementos que solo existen en el editor. Se eliminan en el clone. |
| `data-editor-break-forced="true"` | Marca un elemento que el motor empujó a la siguiente página. |
| `force-page-break-before` | Clase CSS inyectada en elementos con salto forzado. |
| JSDOM | Implementación DOM para Node.js. Sin motor de impresión. Sin cálculo de layouts. |
| `muestra_fracaso.pdf` | Evidencia física del bug. 3 páginas en lugar de 2. Generado en M5. |

---

## 10. Checklist para Cualquier IA que Toque Este Código

Antes de hacer cualquier cambio en los archivos de impresión:

- [ ] ¿Leíste `FRACASO_SALTOS_DE_PAGINA.md` completo?
- [ ] ¿Leíste este documento completo (`PDF_PRINT_CONTEXT_FOR_AI.md`)?
- [ ] ¿El cambio que propones usa `break-before: page` en algún selector?
  - Si sí: ¿Ese selector aplica a exactamente UN elemento en el documento? Si aplica a N > 1 elementos, **no lo hagas**.
- [ ] ¿El cambio que propones usa `getBoundingClientRect()` o métricas de pantalla para calcular offsets de impresión?
  - Si sí: **no lo hagas**.
- [ ] ¿El cambio que propones agrega estilos `@media print` en `index.css`?
  - Si sí: **no lo hagas**. Solo `print.css` puede tener `@media print`.
- [ ] ¿El cambio que propones modifica `min-height` de `#area-cv` con un valor en mm?
  - Si sí: asegúrate de que no hay ningún factor de zoom (`body.style.zoom`) activo al mismo tiempo.
- [ ] ¿El cambio que propones puede ser validado solo con Vitest?
  - Si sí: **eso no es suficiente**. La única validación válida es el PDF impreso en el navegador real.
- [ ] ¿El cambio que propones declara "paridad 1:1 resuelta" basado en tests verdes?
  - Si sí: **borra esa declaración**. Solo el usuario puede confirmar la paridad.

---

## Apéndice A: Referencia Rápida de Archivos

```
Ressume/
├── FRACASO_SALTOS_DE_PAGINA.md    ← LEER PRIMERO. Historial de bugs de paginación.
├── AGENTS.md                      ← Reglas del proyecto para agentes de IA.
├── BRAIN.md                       ← Conocimiento completo del proyecto (818 líneas).
├── HANDOVER_CONTEXT.md            ← Contexto de la sesión activa de refactoring.
├── muestra_fracaso.pdf            ← Evidencia del bug. PDF de 3 páginas.
├── PROJECT.md                     ← Feature inventory y milestones.
│
├── src/
│   ├── utils/
│   │   ├── staticHtmlPdfEngine.js ← Motor principal de impresión. +1600 líneas. 🔴
│   │   ├── paginationEngine.js    ← Motor de paginación del editor. 🔴
│   │   └── pageGeometry.js        ← Constantes A4, zonas prohibidas.
│   ├── hooks/
│   │   ├── usePaginationEngine.js ← Hook React del motor de paginación. 🟠
│   │   └── useBlankPageCleaner.js ← Elimina páginas en blanco reactivamente.
│   ├── styles/
│   │   ├── print.css              ← SSOT de estilos de impresión. 🔴
│   │   └── index.css              ← Estilos del editor. SIN @media print. 🟠
│   └── tests/
│       └── setup.js               ← Mocks: window.print es vi.fn(). No ejecuta nada.
│
├── docs/
│   └── motor-impresion-pdf.md     ← Documentación arquitectural del motor.
│
└── cypress/e2e/
    ├── 01-print-lifecycle.cy.js
    ├── 02-print-geometry-and-pagination.cy.js
    ├── 04-cdp-pdf-generation.cy.js
    └── 08-two-column-print-synchronization.cy.js
```

---

## Apéndice B: Los Commits Clave del Git History

```
2fc0b8d  cloneNode Print Engine Rewrite — transición de árbol sintético a DOM mirroring
216ae63  Eliminadas reglas residuales para CTRL+P — corrección de margin-top en breaks
6a93c36  Mejora en el trabajo de paridad para impresion PDF — corrección de títulos huérfanos
0f2f144  WIP: Fixes de paridad con pdf
02a9aab  WIP: Fixes de paridad con pdf
68fc895  Mejora la paridad de impresion PDF, y corte de pagina
5ca6bfb  Refactor de impresion PDF
```

El commit `2fc0b8d` es el más importante. Introdujo el cambio arquitectónico de árbol sintético a cloneNode. También introdujo varios bugs en los tests legacy que aún no están resueltos. El código posterior a este commit tiene la arquitectura correcta pero el comportamiento del PDF en el navegador real del usuario nunca fue validado empíricamente de forma definitiva.

---

*Este documento fue generado el 2026-09-21. Está basado en análisis directo de los archivos `FRACASO_SALTOS_DE_PAGINA.md`, `BRAIN.md`, `HANDOVER_CONTEXT.md`, `docs/motor-impresion-pdf.md`, `.agents/teamwork_preview_explorer_survey_print/handoff.md`, `AGENTS.md`, y `PROJECT.md`. Si detectas información desactualizada respecto al estado actual del código, actualiza este documento antes de hacer cambios.*
