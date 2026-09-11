# Arquitectura del Editor, Flujo de Datos Unidireccional y Motor de Paginación

Este documento constituye la referencia técnica autoritativa sobre la arquitectura interna de **Ressume**, el flujo de datos unidireccional de la aplicación, la descomposición modular de componentes y hooks, y los algoritmos matemáticos que gobiernan el motor de paginación en tiempo real.

---

## 1. Visión General del Sistema

**Ressume** es un editor de currículums interactivo de alta fidelidad construido como una Single Page Application (SPA) client-side sobre **React 18** y **Vite 5**. No depende de microservicios externos ni de motores backend (como Puppeteer o Chromium headless) para compilar, paginar o exportar el documento: toda la renderización, manipulación geométrica y generación estática ocurre íntegramente en el navegador del usuario.

### Principios Fundamentales
1. **Unidireccionalidad Estricta**: Los datos del currículum fluyen desde una única fuente de la verdad hacia el árbol de componentes; cualquier mutación se canaliza a través de despachadores inmutables.
2. **Dualidad de Renderizado con Cero Desfase (0px Drift)**:
   - **Canvas Interactivo (`#area-cv`)**: Vista editable en vivo con manijas de arrastre (`@dnd-kit`), campos de texto enriquecido y guías visuales de corte (`A4PageGuides`).
   - **Snapshot de Impresión (`staticHtmlPdfEngine.js`)**: Renderizado estático en un `<iframe>` aislado fuera de pantalla con las mismas dimensiones físicas (794px), tipografías y variables CSS calculadas, libre de artefactos interactivos.
3. **Open/Closed mediante Registry**: La adición de nuevas secciones o tipos de ítems no modifica los componentes del núcleo (`App.jsx`, `BaseSection.jsx`, `BaseItem.jsx`), sino que se delega a `src/registry/sectionRegistry.js`.
4. **Respeto a los Invariantes Arquitectónicos**:
   - Exclusividad de `@dnd-kit` (prohibición de `swapy`).
   - Tooltips flotantes anclados a coordenadas relativas del viewport (`getBoundingClientRect()`).
   - Callouts con diseño Obsidian estándar (Danger, Caution, Info).

---

## 2. Flujo de Datos Unidireccional (`CVContext.jsx`)

El estado global de la aplicación se gestiona a través de la API Context de React mediante un patrón **Facade** modularizado que previene el *prop drilling* sin caer en el antipatrón de un "god context" monolítico.

```
       ┌──────────────────────────────────────────────────────────┐
       │                   CVProvider (Facade)                    │
       │                   src/context/CVContext.jsx              │
       └─────┬───────────────┬──────────────────┬───────────────┬─┘
             │               │                  │               │
             ▼               ▼                  ▼               ▼
      ┌─────────────┐ ┌─────────────┐    ┌─────────────┐ ┌─────────────┐
      │  useCVData  │ │ useCVHistory│    │ useCVLayout │ │ useCVExport │
      │  (Estado y  │ │ (Undo/Redo  │    │  (Modos de  │ │ (Exportación│
      │ Persistencia│ │ Inmutable)  │    │  Diseño y   │ │   PDF/JSON  │
      │localStorage)│ │             │    │  Espaciado) │ │   y Toasts) │
      └─────────────┘ └─────────────┘    └─────────────┘ └─────────────┘
             │                                  │
             │ dispatch(mutation)               │ updateLayout(prop, val)
             ▼                                  ▼
      ┌──────────────────────────────────────────────────────────┐
      │                        Consumidores                      │
      │    App.jsx  │  BaseSection.jsx  │  ActionMenu.jsx        │
      └──────────────────────────────────────────────────────────┘
```

### 2.1 Descomposición de Hooks en `src/context/`

| Hook de Dominio | Archivo | Responsabilidad Principal |
|---|---|---|
| `useCVData` | `src/context/useCVData.js` | Inicializa y muta el objeto `cvData` (perfil, secciones, ítems, viñetas). Sincroniza atómicamente con `localStorage` ante cada cambio. |
| `useCVHistory` | `src/context/useCVHistory.js` | Administra la pila histórica inmutable de deshacer/rehacer (`past`, `present`, `future`, `undo()`, `redo()`). |
| `useCVLayout` | `src/context/useCVLayout.js` | Controla el modo de diseño (2 columnas tradicional vs ATS 1 columna), proporciones de columna (`leftColumnWidth`), escala tipográfica y espaciados. |
| `useCVExport` | `src/context/useCVExport.js` | Coordina la exportación limpia en PDF (`exportCleanPDF`), descarga de JSON y notificación de estados de carga mediante toasts. |

### 2.2 Esquema de Datos Canónico (`cvData`)

El estado persistido en `localStorage` responde a la estructura definida en `src/utils/schema.js`:

```javascript
{
  profile: {
    name: "Juan Pérez",
    subtitle: "Senior Software Engineer",
    email: "juan@ejemplo.com",
    phone: "+54 9 11 1234-5678",
    location: "Buenos Aires, Argentina",
    linkedin: "linkedin.com/in/juanperez",
    github: "github.com/juanperez",
    description: "Desarrollador full stack especializado en arquitecturas reactivas..."
  },
  layout: {
    type: "2-column",           // '2-column' | '1-column'
    isAtsMode: false,          // true para modo ATS sobrio sin fondos decorativos
    leftColumnWidth: 33.33,    // Porcentaje de ancho para columna lateral
    fontFamily: "Poppins",      // Poppins | Inter | Roboto | Merriweather | JetBrains Mono
    fontScale: 1.0,            // Escala base (0.85 a 1.25)
    lineHeight: 1.45,          // Altura de línea relativa
    pagePadding: 24,           // Margen perimetral en píxeles (default: 24px)
    sectionGap: 20,            // Separación vertical entre secciones (default: 20px)
    itemGap: 8,                // Separación vertical entre ítems (default: 8px)
    leftBg: "#f3f4f6",         // Color de fondo de columna izquierda
    rightBg: "#ffffff"         // Color de fondo de columna derecha
  },
  sections: [
    {
      id: "sec_exp_1",
      type: "list",            // Resuelto por sectionRegistry.js
      column: "right",         // 'left' | 'right'
      title: "EXPERIENCIA LABORAL",
      bottomSpacing: 0,        // Compensación de espaciador integrado
      bulletStyle: { size: "normal", variant: "bold", showLine: true },
      items: [
        {
          id: "item_exp_101",
          title: "Tech Lead",
          subtitle: "Empresa Global | Remoto",
          date: "2023 – Presente",
          bullets: ["Liderazgo de equipo...", "Optimización de microservicios..."]
        }
      ]
    }
  ]
}
```

---

## 3. Jerarquía de Componentes y Descomposición

El shell principal del editor (`src/App.jsx`) actúa como un **orquestador declarativo** limpio (~419 líneas), delegando la interacción de drag-and-drop, redimensionamiento y cálculos geométricos en hooks especializados y subcomponentes visuales.

```
App.jsx (Orquestador)
├── Joyride & CustomTooltip (Tour interactivo inicial)
├── ActionMenu (Barra flotante: Diseño, Espaciado, Exportación, Idiomas)
├── LayoutModeToggle (Selector: 2 Columnas Tradicional vs ATS 1 Columna)
├── DndContext (@dnd-kit/core gestionado por useCVDndCoordinator)
│   └── main#area-cv (Canvas A4 con geometría estricta de 794px)
│       ├── A4PageGuides (Líneas y marcadores de corte entre hojas A4)
│       ├── DroppableColumn #column-left (en modo 2-columnas)
│       │   ├── SortableContext (verticalListSortingStrategy)
│       │   │   └── BaseSection -> EditableBaseSection
│       │   │       ├── DragHandle (Manija de arrastre de sección)
│       │   │       ├── InlineEdit (Edición de título en línea)
│       │   │       ├── SortableContext (ítems)
│       │   │       │   └── BaseItem -> EditableBaseItem
│       │   │       │       └── ItemComponent (p. ej. SkillsItem, EducationItem)
│       │   │       │           └── SortableBulletItem (Viñetas anidadas)
│       │   │       └── IntegratedBottomSpacer
│       │   └── Button (Agregar Sección Lateral)
│       ├── ColumnResizer (Divisor arrastrable para redimensionar columnas)
│       └── DroppableColumn #column-right
│           └── ... (Secciones principales)
├── AddSectionModal (Catálogo flotante de secciones disponibles)
├── SuggestionTooltip (Popover dinámico con sugerencias IA estilo Obsidian)
├── ToastNotification (Feedback no bloqueante para exportación y guardado)
└── CVDragOverlay (Ghost preview fluido durante el arrastre)
```

### 3.1 Custom Hooks Especializados (`src/hooks/`)

Para mantener `App.jsx` como un componente puramente orquestador y legible, la lógica compleja está aislada en hooks modulares con responsabilidades unitarias:

#### `usePaginationEngine.js`
Coordina la detección y recálculo reactivo de páginas y saltos de corte:
- Escucha eventos de redimensionamiento de ventana y mutaciones de tamaño (`ResizeObserver`) sobre `#area-cv`.
- Implementa un mecanismo de debouncing y enfriamiento programado con `requestAnimationFrame` (RAF) para evitar parpadeos y recálculos innecesarios durante el tipeo o el arrastre activo (`activeDragItem !== null`).
- Invoca la suite de paginación pura (`src/utils/paginationEngine.js`) y actualiza `totalPages` en el estado global.

#### `useCVDndCoordinator.js`
Centraliza la coordinación de drag-and-drop de dos niveles con `@dnd-kit`:
- Configura sensores de alta precisión (`PointerSensor` con `distance: 4` para evitar falsos arrastres al hacer clic en botones de edición, y `KeyboardSensor` para accesibilidad).
- Aplica el algoritmo de detección de colisiones `closestCorners`.
- Gestiona los ciclos `handleDragStart`, `handleDragOver` y `handleDragEnd`.
- Administra el movimiento polimórfico entre columnas (`moveSectionToColumnAndIndex`) y entre secciones de distinta naturaleza (`moveItemBetweenSections`), adaptando los esquemas de datos transparentemente.

#### `useColumnResizer.js`
Encapsula la interacción de redimensionamiento de columnas:
- Maneja eventos de cursor `mousedown`, `mousemove` y `mouseup` globales sobre el documento.
- Calcula el porcentaje dinámico de la columna izquierda relativo al ancho total del contenedor `#area-cv`.
- Aplica un clampeo estricto entre **20%** y **55%** para evitar que la columna se colapse o desborde la geometría visual del documento.

### 3.2 Subcomponentes de Presentación (`src/components/Editor/`)

- **`A4PageGuides.jsx`**: Renderiza las guías visuales punteadas de corte (`.a4-page-fold-guide`), líneas horizontales (`.a4-page-fold-line`) e insignias de número de hoja (`.a4-page-fold-badge`) únicamente en el editor de pantalla.
- **`ColumnResizer.jsx`**: Divisor visual vertical interactivo (`.column-resizer`) ubicado exactamente entre la columna izquierda y derecha. Incluye manija de agarre centrada (`.column-resizer-handle`) y señal de estado activo (`.is-resizing`).
- **`CVDragOverlay.jsx`**: Renderiza el clon visual flotante (ghost preview) optimizado a 60 FPS dentro de un portal de `@dnd-kit`, representando con precisión la sección o el ítem en movimiento.

---

## 4. Utilidades Puras y Algoritmos Centralizados (`src/utils/`)

Toda la lógica algorítmica y matemática reside en módulos puramente funcionales, desacoplados del ciclo de vida de React y de dependencias directas del DOM del navegador:

### 4.1 `src/utils/pageGeometry.js`
Define las constantes geométricas universales y funciones de cálculo métrico:
- `A4_PAGE_HEIGHT_PX = 1123`: Altura exacta de 1 hoja A4 a 96 DPI (297 mm).
- `A4_WIDTH_PX = 794`: Ancho exacto de 1 hoja A4 a 96 DPI (210 mm).
- `A4_GAP_PX = 20`: Separación visual vertical entre hojas en el canvas del editor (`.a4-page-fold-guide`). **Este valor es estrictamente exclusivo del editor interactivo y nunca se introduce en el pipeline de impresión PDF.**
- `DEFAULT_PAGE_PADDING = 24`: Padding perimetral por defecto en píxeles.
- `getRulerHeightPx(containerEl)`: Crea una regla oculta temporal de `297mm` en el DOM para medir con precisión subpíxel la conversión de milímetros a píxeles según la resolución real del dispositivo o el motor de renderizado.
- `getRelativeBounds(el, parentEl)`: Retorna las coordenadas relativas (`top`, `bottom`, `height`) de cualquier elemento respecto a la parte superior de `#area-cv`.
- `isInForbiddenBoundaryZone(top, bottom, pageHeight, pagePadding)`: Evalúa si un rango vertical intersecta la zona prohibida de corte `[k * pageHeight - padding .. k * pageHeight + padding]`.

### 4.2 `src/utils/colorUtils.js`
Implementa algoritmos de contraste cromático y legibilidad basados en la norma YIQ:
- `calculateYIQ(hexColor)`: Convierte un color hexadecimal al espacio YIQ (`(r * 299 + g * 587 + b * 114) / 1000`).
- `getContrastYIQ(hexColor)`: Determina si el texto sobre un fondo debe ser oscuro (`'dark'`) o claro (`'light'`) con un umbral de 128.
- `getDynamicTextVariables(backgroundColor)`: Genera un mapa completo de variables CSS (`--title-color`, `--text-color`, `--text-color-light`, `--circle-color`, `--container-color-alt`) optimizadas para garantizar máximo contraste y accesibilidad visual (WCAG AA/AAA).

### 4.3 `src/utils/typographyUtils.js`
Unifica la configuración de tipografías y el cálculo de tokens:
- `FONT_FAMILIES`: Mapa canónico de familias tipográficas seleccionables (`Poppins`, `Inter`, `Roboto`, `Merriweather`, `JetBrains Mono`).
- `computeTypographyTokens(layout)`: Calcula el diccionario de variables CSS aplicadas al contenedor raíz:
  - `--body-font`
  - `--font-scale`, `--title-scale`, `--body-scale`, `--list-scale`, `--line-height`
  - `--page-padding`, `--section-gap`, `--item-gap`
  - Tamaños derivados calculados mediante `calc(...)` (`--h1-font-size`, `--h2-font-size`, etc.).

### 4.4 `src/utils/paginationEngine.js`
Implementa el algoritmo de corte de página y prevención de orfandad:
- `BREAKABLE_SELECTOR`: Selector unificado de componentes atómicos fragmentables (`.section-title, .cv-block, .experience__content, .education__content, .skills__name, .profile__description, .home__data, .simple-list-item, li.cv-block, .contact__item`).
- `getBreakableComponents(container)`: Extrae y filtra los elementos fragmentables, ignorando nodos anidados cuyo contenedor padre ya gestiona el salto.
- `executePaginationAlgorithm(container, options)`: Algoritmo multi-pase (hasta 6 iteraciones de estabilización):
  1. Limpia saltos de página forzados previos (`resetForcedPageBreaks`).
  2. Evalúa las coordenadas de cada elemento contra las líneas de corte `k * pageHeightPx`.
  3. Detecta invasiones en la **Zona Prohibida de Borde** (Forbidden Boundary Zone).
  4. Detecta **Encabezados Huérfanos** (`isOrphanTitle`): Si un título queda a menos de 60px del borde inferior o su primer ítem hijo es desplazado a la siguiente página, el título se traslada preventivamente al siguiente folio.
  5. Inyecta atributos `data-editor-break-forced="true"` y estilos `margin-top: var(--page-padding, 24px) !important; break-before: page !important;`.
  6. Si los saltos inyectados alteran la geometría del flujo subsiguiente, itera hasta convergencia matemática.

---

## 5. Ciclo de Vida del Motor de Impresión PDF (`staticHtmlPdfEngine.js`)

El pipeline de impresión nativa y generación de PDF libre de artefactos interactivos se ejecuta a través de `executeCleanPrint(cvData, lang, customSnapshot)`.

```
                  Usuario pulsa "Imprimir / Guardar PDF"
                                    │
                                    ▼
       1. Captura de Instantánea del Editor (captureEditorSnapshot)
          - Lee coordenadas de saltos forzados en vivo (#area-cv)
          - Identifica data-section-title y data-item-id desplazados
                                    │
                                    ▼
       2. Generación de HTML Limpio (generateCleanPrintHTML)
          - RenderToStaticMarkup de PrintBaseSection y PrintBaseItem
          - Purga de 26 selectores interactivos (ARTIFACTS_BLACKLIST)
          - Inyección de las 3 hojas de estilo:
            * <style id="cv-base-styles">: index.css limpio
            * <style id="cv-print-styles">: print.css (@media print)
            * <style id="cv-snapshot-breaks">: saltos calculados
                                    │
                                    ▼
       3. Creación del Iframe Aislado Fuera de Pantalla
          - iframe style: top: -10000px; left: -10000px; width: 794px;
          - doc.open() -> doc.write(html) -> doc.close()
                                    │
                                    ▼
       4. Sincronización y Propagación de Variables CSS
          - Recorre variables (--*) de #area-cv y las inyecta en :root
          - Espera carga de tipografías web (doc.fonts.ready)
                                    │
                                    ▼
       5. Disparo de Impresión Nativa (window.print)
          - Enfoca iframe: iframe.contentWindow.focus()
          - Dispara diálogo nativo: iframe.contentWindow.print()
                                    │
                                    ▼
       6. Limpieza Automática de Recursos
          - Escucha evento 'afterprint'
          - Desmonta el iframe del DOM sin dejar fugas de memoria
```

### Invariantes de Paridad de Impresión (0px Drift)
1. **Ancho Fijo A4**: El contenedor `#area-cv` en el iframe tiene un ancho inmutable de `794px` con margen `0 auto`.
2. **Cero Zoom**: Se garantiza estrictamente un `zoom: 1.0` en el documento salvo desborde accidental extremo de fuentes del sistema operativo.
3. **box-decoration-break: slice**: En `print.css`, los contenedores de columna (`.resume__left` y `.resume__right`) emplean `box-decoration-break: slice !important` para impedir que los saltos de hoja dupliquen los 48px de padding vertical sobre la segunda página.
4. **Protección Anti-Ruptura de Super-Contenedores**: Todos los bloques de experiencia, educación, viñetas y títulos declaran `break-inside: avoid !important; page-break-inside: avoid !important;`.

---

## 6. Documentos Relacionados

Para profundizar en áreas específicas de la arquitectura, consulte las guías complementarias:
- [Guía de Extensibilidad de Secciones e Ítems](guia-extensibilidad-secciones.md): Tutorial paso a paso para añadir nuevas secciones y registrar descriptores en `sectionRegistry.js`.
- [Diseño, Invariantes y Accesibilidad](diseno-invariantes.md): Especificaciones de los callouts estilo Obsidian, tooltips dinámicos con `getBoundingClientRect()` y tokens de diseño.
- [Motor de Impresión PDF y Paridad Visual](motor-impresion-pdf.md): Detalle exhaustivo del pipeline de renderizado estático y prevención de rupturas de página.
- [Manual de Desarrollo](DEVELOPMENT_MANUAL.md): Guía de contribución y convenciones del repositorio.
