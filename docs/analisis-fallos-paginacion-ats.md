# Auditoría Forense y Análisis Post-Mortem: Fallos Sistemáticos de Paginación en Modo 1-Columna / ATS

**Fecha:** 11 de Septiembre, 2026  
**Área:** Paginación visual en Editor vs. Impresión nativa PDF  
**Estado:** Diagnóstico Crítico y Registro de Fracasos  

---

## 1. Resumen Ejecutivo y Admisión de Fracaso

A lo largo de múltiples iteraciones en la rama `Reimplementacion-con-React`, se intentó resolver el problema de la fragmentación de páginas y el respeto de márgenes en el editor visual mediante **parches aritméticos de `margin-top` en tiempo de ejecución**. 

A pesar de que la exportación e impresión a PDF (`window.print()`) funciona correctamente y respeta las hojas A4, **el editor en vivo continúa permitiendo que el contenido invada las zonas prohibidas (márgenes y divisor entre páginas)** en modo 1-columna (ATS).

Los fixes previos fracasaron porque se basaron en un **modelo mental erróneo**: asumir que el navegador web posiciona elementos mediante sumas lineales simples de coordenadas (`Y_actual + margin = Y_nuevo`), ignorando por completo la física real del motor de renderizado de CSS (colapso de márgenes, contextos de formato de bloque y flujo de árbol DOM).

---

## 2. Historial de Iteraciones Erróneas (Git Log & Transcripciones)

En el historial del repositorio se registran al menos **9 commits e iteraciones sucesivas** que abordaron este síntoma sin resolver la causa estructural:

| Commit / Iteración | Enfoque / Supuesto Aplicado | Por Qué Fracasó (Causa Real) |
|---|---|---|
| `49dffa3` / `1c5f4e0` | División básica con renderizado react-pdf y cálculo aproximado de alturas. | La simulación en DOM difería en decenas de píxeles respecto al PDF real. |
| `7869240` / `5ca6bfb` | Reemplazo por impresión nativa (`window.print`) y detección de saltos. | Resolvió la impresión, pero dejó al editor con un canvas continuo sin paginación real. |
| `68fc895` / `321efdc` | Inyección de saltos forzados con `data-editor-break-forced` y `margin-top` crudo. | Desalineó elementos hermanos debido a colapso de márgenes con contenedores padre. |
| `721edb2` / `bae30e0` | Creación de spacers dinámicos y spacers 0px en contenedores base. | Parche cosmético: agregaba nodos en el DOM que alteraban el flujo y rompían el drag & drop. |
| `6a93c36` / `0f2f144` | Ajustes iterativos de tolerancias en `recalculatePagination` (pases 1 a 6). | El bucle de 6 pases oscilaba sin converger porque mover un hijo alteraba las dimensiones del padre. |
| **Última iteración (Hoy)** | `effectiveMarginTop = currentMarginTop + neededPush` | **Fallo conceptual grave:** `neededPush` sumado a un margen que luego colapsa en CSS con el contenedor `.cv-section` se cancela parcialmente. El elemento se queda corto entre 16px y 32px y aterriza en plena zona prohibida. |

---

## 3. Discrepancia Arquitectónica: ¿Por qué el PDF se ve bien y el Editor falla?

La discrepancia radica en que **la impresión y el editor utilizan dos motores de renderizado completamente distintos**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  MOTOR DE IMPRESIÓN (window.print en iframe)                            │
│  ───────────────────────────────────────────                           │
│  • Usa el motor nativo de paginación del navegador (Chromium / Blink).  │
│  • @page { size: A4; margin: 0; } fragmenta físicamente el viewport.   │
│  • break-before: page corta el flujo y CREA UNA NUEVA HOJA LIMPIA.     │
│  • Cada hoja es un contexto independiente: el margen superior es real. │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  MOTOR DEL EDITOR (#area-cv en App.jsx)                                │
│  ──────────────────────────────────────                                │
│  • NO ES un conjunto de hojas A4: es un ÚNICO <div> continuo.          │
│  • Las "páginas" son solo dibujos cosméticos superpuestos (insets,     │
│    fold-guides con position: absolute).                                │
│  • Para simular una nueva hoja, se le inyecta margin-top al contenido.  │
│  • Todo el contenido sigue dentro del mismo contexto de flujo normal   │
│    HTML, sujeto a colapso de márgenes, desbordes y desplazamientos.    │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Análisis Técnico del Fracaso del Algoritmo en Modo ATS

### A. Margin Collapsing (Colapso Vertical de Márgenes)
En CSS estándar, en un contenedor de flujo normal (`.resume__single-column`):
- Los márgenes verticales entre elementos adyacentes **colapsan**: no se suman, sino que `margin_efectivo = Math.max(margin_A, margin_B)`.
- Si un `<h2 class="section-title">` o un `<div class="cv-block">` recibe `margin-top: 120px`, pero su contenedor `<section class="cv-section">` no tiene `padding-top` ni `border-top`, **el margen del hijo colapsa y escapa (margin bleeding) hacia el `<section>` padre**.
- Si el elemento anterior tenía `marginBottom: 20px`, el cálculo `currentMarginTop + neededPush` pierde entre 16px y 24px en la absorción del colapso.
- **Resultado físico:** El elemento avanza menos de lo proyectado y aterriza exactamente dentro de la franja prohibida `[1143px .. 1167px]`.

### B. Confusión de Jerarquía en `getBreakableComponents`
El selector en `App.jsx` busca:
```javascript
".section-title, .cv-block, .experience__content, .education__content, .skills__name, .profile__description, .home__data, .simple-list-item, li.cv-block, .contact__item, .editable-item-container"
```
- **Error:** Busca componentes hoja o títulos, pero **NO incluye a las `<section class="cv-section">`**.
- Cuando una sección entera debe saltar a la página 2, el algoritmo le inyecta `margin-top` al `<h2>` interior.
- La `<section>` padre sigue empezando en la página 1 (o en el divisor), dejando sus botones de acción (`.section-action-buttons`) y su manija de arrastre (`.drag-handle`) atrapados dentro del margen prohibido.

### C. El Padding de `#area-cv` en 1-Columna
En `App.jsx` línea 766:
```jsx
padding: is2Col ? 0 : "var(--page-padding, 24px)"
```
- `#area-cv` tiene `padding: 24px` global.
- Este padding genera el margen superior de la **Página 1**.
- Pero la **Página 2** NO tiene padding propio (porque `#area-cv` es un div continuo).
- Se pretendió que un `margin-top` dinámico simulara simultáneamente el margen inferior de la página 1, el divisor de 20px y el margen superior de la página 2. Cualquier desfase de 1px en este cálculo desmorona la ilusión.

---

## 5. La Métrica de la Falsa Seguridad: El Espejismo de JSDOM

Una causa fundamental de haber insistido en soluciones fallidas fue la **confianza ciega en la suite de pruebas unitarias**:

- **Total de pruebas que pasaban:** 667 tests (0 fallos).
- **La trampa técnica:** El entorno de test es **JSDOM**, el cual:
  1. No posee motor de layout CSS (Blink/WebKit/Gecko).
  2. Todos los llamados a `getBoundingClientRect()`, `offsetHeight`, `scrollHeight` devuelven `0` o valores mockeados manualmente vía `vi.fn()` / `Object.defineProperty`.
  3. No calcula colapso de márgenes (`margin-collapse`).
  4. No computa el flujo real de bloques.
- **Consecuencia:** Se crearon más de 40 tests (incluyendo los de estrés y el recientemente creado `forbidden-page-boundary-zone.test.jsx`) que evalúan ecuaciones algebraicas mockeadas (`top + margin == target`). Los tests pasaban al 100%, mientras que en Google Chrome el renderizado físico real fallaba estrepitosamente.

---

## 6. Conclusión y Lecciones Aprendidas

1. **No se puede simular paginación física en un canvas continuo mediante sumas lineales de márgenes a elementos hijos.**
2. **Los tests en JSDOM no son prueba de paridad visual ni de layout.** Solo un entorno con layout real (Playwright / Puppeteer sobre Chromium headless) puede medir colisiones de caja en píxeles reales.
3. Para erradicar definitivamente la invasión de zonas prohibidas en el editor, el sistema debe abandonar el empuje de márgenes a hijos internos y adoptar una de dos vías estructurales:
   - **Contenedores de página reales en el DOM:** `#area-cv` debe componerse de divs `.a4-page-sheet` con dimensiones fijas (`210mm x 297mm`, `overflow: hidden`, `padding: 24px`), donde el flujo se particione a nivel de página y no a nivel de márgenes inyectados.
   - **Aislamiento BFC e inserción de espaciadores de corte:** Si se mantiene el canvas continuo, los saltos deben realizarse mediante un nodo bloqueador explícito (`.page-break-spacer`) con altura fija calculada que tenga `clear: both`, aislamiento de márgenes y no colapse con los hijos.
