# Motor de Impresión PDF Nítido, Pipeline de Renderizado Estático y Paridad Visual 1:1

Este documento detalla la arquitectura, el ciclo de vida y los algoritmos del motor de impresión y exportación a PDF de **Ressume**, implementado en `src/utils/staticHtmlPdfEngine.js` y gobernado por la hoja de estilos de impresión única `src/styles/print.css`.

---

## 1. Principios Fundamentales del Motor de Impresión

El objetivo central del motor es garantizar una **paridad visual 1:1 absoluta (0px de discrepancia)** entre la vista previa del editor interactivo (`#area-cv`) y el documento PDF final emitido por `window.print()`, respetando tres principios inviolables:

1. **Cero Rasterización (100% Vectorial y Seleccionable)**:
   Está prohibido el uso de librerías de captura basadas en `canvas` (como `html2canvas`). Todo el contenido exportado es HTML semántico nativo, tipografía vectorial nítida con renderizado subpíxel del navegador, iconos SVG vectoriales y enlaces hipertexto activos.
2. **Aislamiento en Iframe Fuera de Pantalla**:
   La exportación se ejecuta en un `<iframe>` invisible desacoplado del DOM principal del editor, garantizando que los eventos de impresión no alteren el estado ni el scroll del usuario.
3. **Límite Estricto de Páginas y Auto-Escalado Proporcional**:
   Por defecto, el currículum se optimiza para caber en un máximo de **2 páginas A4** (`MAX_A4_2PAGE_HEIGHT_PX = 2246px`). Si el contenido excede levemente los límites de corte por discrepancias de fuentes del sistema operativo, el motor calcula un factor de escala tipográfica adaptativo (`calculatePrintScale`) para asegurar que no se genere una página en blanco residual.

---

## 2. Pipeline de Renderizado Estático (`generateCleanPrintHTML`)

El generador `generateCleanPrintHTML(cvData, lang, snapshot)` construye una cadena de documento HTML5 completa, semántica y autónoma a partir del estado de la aplicación.

```
                    cvData + snapshot del editor
                                 │
                                 ▼
         Paso 1: Purga Exhaustiva de 26 Artefactos Interactivos
                 - Drag handles (.drag-handle)
                 - Botones de borrado (.round-btn-del, .item-del-btn)
                 - Botones de añadir (.round-btn-add, .add-bullet-btn)
                 - Tooltips, callouts, modales y barras flotantes
                                 │
                                 ▼
         Paso 2: Renderizado Estático mediante Componentes Puros
                 - PrintBaseSection y PrintBaseItem (renderToStaticMarkup)
                 - Conversión de InlineEdit en nodos de texto limpios
                 - Inyección de enlaces hipertexto nativos <a>
                                 │
                                 ▼
         Paso 3: Ensamblado Secuencial de las 3 Hojas de Estilo
                 1. <style id="cv-base-styles">: index.css saneado
                 2. <style id="cv-print-styles">: print.css (@media print)
                 3. <style id="cv-snapshot-breaks">: saltos calculados
                                 │
                                 ▼
                    Documento HTML Limpio Generado
```

### 2.1 Lista Negra de Artefactos de Edición (`ARTIFACTS_BLACKLIST`)
Durante la generación estática y el saneamiento regex de hojas de estilo, se neutralizan estrictamente 26 selectores de interfaz para asegurar que ningún control de edición sea visible en el documento final:

1. `.drag-handle`
2. `.section-drag-handle`
3. `.item-drag-handle`
4. `.round-btn-del`
5. `.section-del-btn`
6. `.item-del-btn`
7. `.bullet-del-btn`
8. `.round-btn-add`
9. `.add-bullet-btn`
10. `.section-add-container`
11. `.column-add-section`
12. `.bullet-add-row`
13. `.section-action-buttons`
14. `.section-tips-toggle-btn`
15. `.section-bullet-style-btn`
16. `.section-bullet-style-popover`
17. `.suggestion-tooltip`
18. `.obsidian-callout`
19. `.column-resizer`
20. `.rich-text-toolbar`
21. `.action-menu`
22. `.action-menu-btn`
23. `.l-navbar`
24. `.a4-page-fold-guide`
25. `.spacer-resize-handle`
26. `.inline-edit-active`

---

## 3. Arquitectura CSS de Impresión (`src/styles/print.css`)

El archivo `src/styles/print.css` es la **Única Fuente de la Verdad (Single Source of Truth - SSOT)** para todas las reglas de diseño en modo impresión.

### 3.1 Estructura Estricta con `@media print`
Para evitar colisiones de estilos o sobreescrituras no deseadas durante la edición en pantalla:
- **`src/index.css`**: Contiene exclusivamente estilos del editor y diseño en pantalla. **Tiene prohibido contener bloques `@media print`.**
- **`src/styles/print.css`**: Todas sus reglas residen dentro de una directiva unificada `@media print { ... }`.

### 3.2 Geometría Base A4 y Cero Márgenes del Navegador
```css
@media print {
  @page {
    size: A4;
    margin: 0; /* Suprime encabezados y pies de página predeterminados del navegador */
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  html, body {
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    background-color: #ffffff !important;
  }

  #area-cv,
  .resume {
    width: 794px !important;
    min-width: 794px !important;
    max-width: 794px !important;
    margin: 0 auto !important;
    box-shadow: none !important;
    box-sizing: border-box !important;
  }
}
```

### 3.3 Solución Crítica: `box-decoration-break: slice`
En currículums de 2 columnas que abarcan más de una página, el uso tradicional de `box-decoration-break: clone` en `.resume__left` y `.resume__right` causaba que el navegador repitiera los paddings superior e inferior de la columna en cada fragmento de página, inyectando hasta **48px de padding fantasma** en la página 2 y desalineando las columnas respecto al editor.

La regla definitiva implementada en `print.css`:
```css
.resume__left,
.resume__right {
  min-height: var(--print-target-height-mm, 297mm) !important;
  height: 100% !important;
  align-self: stretch !important;
  box-sizing: border-box !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  
  /* Migrado de clone a slice para eliminar la inyección de doble padding en páginas subsiguientes */
  -webkit-box-decoration-break: slice !important;
  box-decoration-break: slice !important;
}
```

### 3.4 Prevención de Fractura de Super-Contenedores
Para evitar que un bloque de experiencia o educación se divida por la mitad entre dos hojas de papel:
```css
.cv-section,
.cv-block,
.spacer-section,
.experience__content,
.education__content,
.skills__name,
.profile__description,
.home__data,
.simple-list-item,
li.cv-block,
.contact__item,
.experience__bullets,
.simple-list-ul {
  break-inside: avoid !important;
  page-break-inside: avoid !important;
  -webkit-column-break-inside: avoid !important;
}

/* Protección de Encabezados Huérfanos */
.section-title,
h1,
h2,
h3 {
  break-after: avoid !important;
  page-break-after: avoid !important;
  break-inside: avoid !important;
}
```

---

## 4. Detección de Zonas Prohibidas y Salto de Página

El motor cuenta con un detector algorítmico de **Zonas Prohibidas de Corte** (Forbidden Boundary Zones), definido en `src/utils/pageGeometry.js` y `src/utils/paginationEngine.js`.

### 4.1 Definición Matemática de la Zona Prohibida
Dado un corte de página en el píxel $H = k \times \text{A4\_PAGE\_HEIGHT\_PX}$ (donde $k \in \{1, 2, \dots\}$ y $A4 = 1123\text{px}$ a 96 DPI), y un padding de página $P = \text{pagePadding}$ (por defecto 24px):

$$\text{Zona Prohibida}_k = [H - P \quad \dots \quad H + P]$$

Ningún componente atómico (`.cv-block`, `.section-title`) debe tener sus límites físicos dentro de este intervalo. Si un elemento penetra la zona prohibida:
1. El algoritmo detecta la invasión.
2. Inyecta `break-before: page !important;` y `margin-top: var(--page-padding, 24px) !important;`.
3. Registra el elemento en el `snapshot` del editor (`brokenElements`).

### 4.2 Inyección Dinámica de Saltos en `staticHtmlPdfEngine.js`
Durante la generación del snapshot de impresión, se inyectan dinámicamente los estilos calculados para replicar con exactitud de subpíxel los saltos del editor en el iframe:

```javascript
snapshot.brokenElements.forEach((b) => {
  const targetEl = b.isTitle
    ? doc.querySelector(`[data-section-title="${b.sectionId}"]`)
    : doc.querySelector(`[data-item-id="${b.itemId}"]`);

  if (targetEl) {
    targetEl.style.setProperty('break-before', 'page', 'important');
    targetEl.style.setProperty('page-break-before', 'always', 'important');
    targetEl.style.setProperty('margin-top', 'var(--page-padding, 24px)', 'important');
    targetEl.classList.add('force-page-break-before');
    targetEl.setAttribute('data-page-break-forced', 'true');
  }
});
```

---

## 5. Ciclo de Vida de Ejecución (`executeCleanPrint`)

El proceso completo de invocación de impresión nativa consta de 7 fases secuenciales:

```
                  Llamada a executeCleanPrint(cvData, lang)
                                     │
                                     ▼
      1. Cálculo de Título Seguro de Documento (getDynamicPdfTitle)
         - Basado en el nombre de la versión activa o 'CV_Nombre_Puesto'
         - Sanitiza caracteres no permitidos en sistemas de archivos
                                     │
                                     ▼
      2. Captura del Snapshot del Editor (captureEditorSnapshot)
         - Ancho exacto en píxeles del elemento #area-cv
         - Array de elementos con salto forzado activo
                                     │
                                     ▼
      3. Creación y Montaje del <iframe> Invisible
         - style: position: fixed; top: -10000px; left: -10000px;
         - width: 794px; height: 1123px; visibility: hidden;
                                     │
                                     ▼
      4. Escritura Síncrona del HTML Limpio
         - doc.open() -> doc.write(html) -> doc.close()
                                     │
                                     ▼
      5. Transferencia de Variables CSS desde el Editor al Iframe
         - Itera todas las variables (--*) presentes en editor #area-cv
         - Las inyecta en doc.documentElement.style del iframe
                                     │
                                     ▼
      6. Sincronización de Fuentes y Disparo
         - await Promise.race([doc.fonts.ready, timeout(1000)])
         - iframe.contentWindow.focus()
         - iframe.contentWindow.print()
                                     │
                                     ▼
      7. Limpieza y Desmontaje del DOM
         - Evento 'afterprint' o cierre de diálogo
         - iframe.parentNode.removeChild(iframe)
```

### Transferencia de Propiedades CSS
Para garantizar que cualquier tema personalizado de color, padding o escala tipográfica activa en el editor se aplique sin desfase:
```javascript
const editorAreaCv = document.getElementById('area-cv');
if (editorAreaCv && editorAreaCv.style && doc.documentElement) {
  for (let i = 0; i < editorAreaCv.style.length; i++) {
    const prop = editorAreaCv.style[i];
    if (prop && prop.startsWith('--')) {
      const val = editorAreaCv.style.getPropertyValue(prop);
      const priority = editorAreaCv.style.getPropertyPriority(prop);
      doc.documentElement.style.setProperty(prop, val, priority);
    }
  }
}
```

---

## 6. Verificación de Paridad en Tests Automatizados

La fidelidad del motor de impresión se evalúa en suites dedicadas de Vitest:
- **`src/tests/pixelParityEditorPrint.test.jsx`**: Comprueba con tolerancia de 0px que `top`, `left`, `width`, `height` y variables CSS calculadas son idénticas entre `#area-cv` y el snapshot del iframe.
- **`src/tests/cleanPrintEngineVerification.test.jsx`**: Valida los 4 pilares de impresión limpia, la presencia de los 3 bloques de estilo (`cv-base-styles`, `cv-print-styles`, `cv-snapshot-breaks`) y la total ausencia de artefactos interactivos.
- **`src/tests/forbidden-page-boundary-zone.test.jsx`**: Verifica que ningún contenido vulnere las zonas de corte perimetrales.

---

## 7. Documentos Relacionados

- [Arquitectura del Editor](arquitectura.md): Flujo unidireccional y orquestación general.
- [Guía de Extensibilidad de Secciones](guia-extensibilidad-secciones.md): Configuración de `printItemStyle` y `printContainerStyle` en descriptores.
- [Diseño e Invariantes](diseno-invariantes.md): Tokens de diseño y variables CSS.
- [Manual de Desarrollo](DEVELOPMENT_MANUAL.md): Guía de comandos de desarrollo y testing.
