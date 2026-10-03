# Especificación de Requisitos Estrictos y Directrices Anti-Regresión

**Proyecto:** Ressume  
**Versión de Especificación:** 2.0.0 (Septiembre 2026)  
**Nivel de Cumplimiento:** Obligatorio e Inmutable  

Este documento define la totalidad de requisitos funcionales, arquitectónicos y de calidad técnica que rigen **Ressume**. Cualquier cambio en el código debe satisfacer estas directivas al 100%. Queda terminantemente prohibido introducir regresiones funcionales o visuales.

---

## 1. INVARIANTES ARQUITECTÓNICOS FUNDAMENTALES

### REQ-ARCH-01: Editor con Cajas A4 Discretas Nativas (Regla 15)
- El contenedor `#area-cv` **no debe ser un lienzo vertical continuo infinito**.
- La visualización del documento debe componerse estrictamente de una lista de componentes `<A4PageBox pageNumber={N}>`.
- Cada `.a4-page-box` en pantalla debe tener dimensiones exactas:
  ```css
  width: 210mm;
  min-width: 210mm;
  max-width: 210mm;
  height: 297mm;
  min-height: 297mm;
  max-height: 297mm;
  overflow: hidden;
  box-sizing: border-box;
  position: relative;
  ```
- **Prohibición de Pliegues Simulados**: Prohibido usar líneas rojas o punteadas sobre un canvas continuo para simular cortes de página. El corte físico debe ser visible y real mediante la separación de cajas `<A4PageBox>`.

### REQ-ARCH-02: Estructura Fija Tallada en Piedra en Impresión (Regla 16)
- El Editor es la **única fuente de verdad** para la distribución de páginas y la pertenencia de elementos a columnas y hojas.
- El motor de impresión (iframe `@media print`) tiene **terminantemente prohibido ejecutar disposición dinámica, algoritmos heurísticos de corte o mutaciones en caliente**. Su rol es proyectar pasiva y deterministamente el DOM exacto del editor.

### REQ-ARCH-03: Drag & Drop Exclusivo con `@dnd-kit` (Regla 2)
- Toda la funcionalidad de reordenamiento y arrastre de secciones, ítems y viñetas debe implementarse exclusivamente con `@dnd-kit` (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`).
- **Prohibición Terminante de `swapy`**: Queda vetada la inclusión de `swapy` por causar colisiones de IDs de slots en árboles anidados de React.

### REQ-ARCH-04: Callouts Estilo Obsidian (Regla 1)
- Todas las alertas, sugerencias de IA y mensajes modales deben adoptar el diseño de Obsidian Callouts:
  - **Danger / Critical**: Fondo `rgba(233, 49, 71, 0.1)`, borde izquierdo 4px sólido `rgba(233, 49, 71, 1)`, título negrita rojo, icono `🛑` o `🚨` (o SVG lucide equivalente).
  - **Caution / Warning**: Fondo `rgba(219, 139, 0, 0.1)`, borde izquierdo 4px sólido `rgba(219, 139, 0, 1)`, título negrita naranja, icono `⚠️`.
  - **Info**: Fondo `rgba(8, 109, 221, 0.1)`, borde izquierdo 4px sólido `rgba(8, 109, 221, 1)`, título negrita azul, icono `ℹ️`.
  - Estructura DOM: `.obsidian-callout`, `.callout-title` con `display: flex; gap: 8px; font-weight: 600`, y `.callout-content`.

### REQ-ARCH-05: Tooltips con Posicionamiento Dinámico Relativo (Regla 3)
- Los tooltips y popovers informativos nunca deben fijarse a coordenadas globales arbitrarias.
- Deben calcular dinámicamente su posición relativa usando `getBoundingClientRect()` del elemento activo hovered:
  - Situarse adyacente al elemento (`rect.right + 20px`).
  - Invertirse (`rect.left - 320px`) al aproximarse al borde derecho de la ventana.
  - Clampearse verticalmente para no desbordar el alto de la ventana (`window.innerHeight`).

---

## 2. REQUISITOS DE GEOMETRÍA, ESPACIADO Y TIPOGRAFÍA

### REQ-GEO-01: Constantes Canónicas Centralizadas (SSOT)
- Todas las dimensiones deben provenir de `src/constants/geometry.js`:
  - `A4_WIDTH_PX = 794`
  - `A4_PAGE_HEIGHT_PX = 1123`
  - `A4_PRINT_WIDTH_MM = 210`
  - `A4_PRINT_HEIGHT_MM = 297`
  - `EDITOR_HEIGHT_REDUCTION_MM = 25` (Buffer de seguridad vertical: Editor 272mm vs Print 297mm).

### REQ-GEO-02: Control Reactivo de Espaciado y Tipografía
- Los siguientes controles deslizantes (sliders) de `cvData.layout` deben modificar sincrónicamente el documento en vivo y en la exportación PDF:
  - `fontFamily`: Tipografía global (`Poppins`, `Inter`, `Roboto`, `Merriweather`, `JetBrains Mono`).
  - `fontScale`: Escala base general (0.85 a 1.25).
  - `titleScale`: Escala de títulos de sección (0.85 a 1.30).
  - `bodyScale`: Escala de cuerpo y descripciones (0.85 a 1.15).
  - `lineHeight`: Interlineado relativo (1.15 a 1.80).
  - `pagePadding`: Margen interno por hoja (12px a 36px, default 24px).
  - `sectionGap`: Separación vertical entre secciones (8px a 32px, default 20px).
  - `itemGap`: Separación vertical entre ítems de una sección (4px a 16px, default 8px).
  - `leftColumnWidth`: Ancho porcentual de la columna lateral en modo 2-col (20% a 55%, default 33.33%).

---

## 3. REQUISITOS DEL PIPELINE DE IMPRESIÓN Y PDF

### REQ-PRINT-01: Prohibición de Doble Motor y Parches de Pantalla (Regla 5 y Regla 7)
- **Cero Parches Heurísticos**: Nunca inyectar estilos en línea (`margin-top`, `padding-top` dinámicos basados en `getBoundingClientRect()` de pantalla) sobre el DOM antes de imprimir.
- **Prohibición de `break-before` en Listas**: Nunca aplicar `break-before: page` a selectores repetidos (`.cv-block`, `.experience__content`, `.education__content`, `li`, etc.). Dicho error fragmenta el documento produciendo PDFs con páginas casi vacías (historial documentado en `FRACASO_SALTOS_DE_PAGINA.md`).

### REQ-PRINT-02: Limpieza de Controles Interactivos mediante `data-editor-ui`
- Todo control de interfaz (manijas de arrastre, botones de añadir, selectores, modales, guías) debe marcarse con `data-editor-ui="true"` o clase `.no-print`.
- El servicio `cleanHtmlGenerator.js` debe purgar el 100% de estos elementos en el árbol clonado (`createSanitizedPrintClone`).
- Los campos editables deben despojarse de `contenteditable`, contornos de foco e indicadores de placeholder vacío.

### REQ-PRINT-03: Nombre Dinámico de Archivo PDF
- `pdfTitleService.js` debe generar dinámicamente el nombre del archivo PDF a partir del nombre y profesión del usuario:
  - Formato: `CV_[Nombre]_[Titulo_Profesional].pdf` (limpiando caracteres especiales y acentos para compatibilidad de sistema de archivos).
  - Si los campos están vacíos, emplear el nombre por defecto sanitizado.

---

## 4. REQUISITOS DE LA CAPA DE IA Y CONTRATOS DE DATOS

### REQ-AI-01: Representación Canónica YAML + Markdown
- El exportador de IA (`aiExporter.js`) debe generar un formato híbrido:
  - **Frontmatter YAML**: Metadatos estructurados (idioma, modo de diseño ATS/2-col, tokens de espaciado, industria objetivo, lista de secciones).
  - **Cuerpo Markdown Semántico**: Estructura limpia con encabezados `#`, `##`, `###`, metadatos en negrita y viñetas `- `.
  - **Plantilla ATS Optimizada**: Texto plano lineal sin tablas ni columnas sintéticas para maximizar compatibilidad con Applicant Tracking Systems.

### REQ-AI-02: Ingestión Segura de Respuestas LLM (Cero Regresión de Estado)
- La aplicación permite pegar respuestas de modelos externos (ChatGPT, Claude, Gemini).
- El parser de ingestión (`cleanAndParseRawJSON` en `src/utils/textSanitizer.js`):
  - Debe extraer bloques de código delimitados por ````json ... ```` o parsing JSON directo.
  - Ante entradas corruptas, malformadas o textos conversacionales del LLM ("Here is your CV:"), debe atrapar el error sin arrojar excepciones no controladas y mostrar un Callout Danger estilo Obsidian.
  - **Backup Preventivo Automático**: Antes de aplicar el JSON devuelto por el LLM, el sistema debe crear un snapshot de respaldo en el gestor de versiones con la etiqueta de idioma previa.

### REQ-AI-03: Catálogo Precomputado de Sugerencias
- Las sugerencias de redacción residen en `src/ai-knowledge/`.
- El dominio activo actual está restringido estrictamente a **Tech** (`tech` y `all`). Los dominios ejecutivo y creativo permanecen inactivos para fases posteriores.

---

## 5. VALIDACIÓN DE CALIDAD Y CRITERIOS DE PRUEBA

### REQ-TEST-01: Prohibición de Declarar Paridad Solo con Vitest (Regla 6)
- JSDOM no cuenta con motor de renderizado de fuentes ni calcula el modelo de caja de medios impresos (`@media print`).
- Las pruebas verdes de Vitest son condición **necesaria pero no suficiente**.
- Toda modificación que altere la geometría o los saltos de página debe validarse visualmente en navegadores reales (Cypress en Chromium/Gecko y verificación en Zen Browser / Chrome).

### REQ-TEST-02: 100% de Pruebas Unitarias e Integración en Verde
- Toda ejecución de `npm test` debe completar el 100% de las suites de prueba sin fallos.
- No se admiten tests ignorados (`.skip`) ni mocks que encubran errores de tipos o desbordes de memoria.
