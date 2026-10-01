# Arquitectura del Editor, Flujo de Datos Unidireccional y Distribución de Páginas Discretas

Este documento constituye la referencia técnica autoritativa sobre la arquitectura interna de **Ressume**, el flujo de datos unidireccional de la aplicación, la descomposición modular de componentes y hooks, y los contratos que gobiernan la distribución de páginas discretas y el pipeline de impresión en PDF.

---

## 1. Visión General del Sistema

**Ressume** es un editor de currículums interactivo de alta fidelidad construido como una Single Page Application (SPA) client-side sobre **React 18** y **Vite 5**. No depende de microservicios externos ni de servidores backend (como Puppeteer o Chromium headless) para compilar, paginar o exportar el documento: toda la renderización, manipulación geométrica y generación de PDF vectorial ocurre íntegramente en el navegador del usuario.

### Principios Fundamentales e Invariantes Arquitectónicos
1. **Unidireccionalidad Estricta**: Los datos del currículum fluyen desde una única fuente de verdad (`CVContext.jsx`) hacia el árbol de componentes; cualquier mutación se canaliza a través de despachadores inmutables con soporte undo/redo (`useCVHistory`).
2. **Cajas A4 Fijas Nativas en el Editor (`<A4PageBox>`, Invariante 15 de `AGENTS.md`)**:
   - El editor (`#area-cv`) **no es un lienzo continuo infinito** ni utiliza pliegues o líneas punteadas simuladas.
   - La interfaz se compone directamente de una lista de cajas cerradas `<A4PageBox pageNumber={N}>` con dimensiones inmutables: `210mm x 297mm`, `overflow: hidden`, `box-sizing: border-box`.
   - La partición de contenido entre páginas se decide de manera reactiva y determinista en el estado de React mediante `useDocumentPages` y `pageDistributor.js`.
3. **Estructura Fija Tallada en Piedra (Zero Dynamic Reflow on Print, Invariante 16 de `AGENTS.md`)**:
   - El editor es la **única fuente de verdad** de la estructura del documento.
   - El motor de impresión (`src/services/print/`) tiene prohibido ejecutar algoritmos heurísticos o reposicionamientos dinámicos; su rol es proyectar de forma puramente pasiva y determinista la estructura que el editor le suministra (WYSIWYG 1:1 absoluto).
4. **Open/Closed mediante Registry**: La adición de nuevas secciones o tipos de ítems no modifica los componentes del núcleo (`App.jsx`, `BaseSection.jsx`), sino que se delega a `src/registry/sectionRegistry.js`.
5. **Obsidian Callout Standard (Regla 1 de `AGENTS.md`)**:
   - Todos los mensajes de advertencia, sugerencias y alertas de IA siguen estrictamente el estándar visual de callouts de Obsidian (Danger/Critical, Caution/Warning, Info).
6. **Drag and Drop con `@dnd-kit` (Regla 2 de `AGENTS.md`)**:
   - Uso exclusivo de `@dnd-kit` para arrastre polimórfico de secciones e ítems (prohibición terminante de `swapy`).
7. **Tooltips Flotantes Dinámicos (Regla 3 de `AGENTS.md`)**:
   - Posicionamiento dinámico adaptado a coordenadas relativas del viewport (`getBoundingClientRect()`).

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
| `useCVData` | `src/context/hooks/useCVData.js` | Inicializa y muta el objeto `cvData` (perfil, secciones, ítems, viñetas). Sincroniza atómicamente con `localStorage` ante cada cambio. |
| `useCVHistory` | `src/context/hooks/useCVHistory.js` | Administra la pila histórica inmutable de deshacer/rehacer (`past`, `present`, `future`, `undo()`, `redo()`). |
| `useCVLayout` | `src/context/hooks/useCVLayout.js` | Controla el modo de diseño (2 columnas tradicional vs ATS 1 columna), proporciones de columna (`leftColumnWidth`), escala tipográfica y espaciados. |
| `useCVExport` | `src/context/hooks/useCVExport.js` | Coordina la exportación limpia en PDF (`exportCleanPDF`), descarga de JSON y notificación de estados de carga mediante toasts. |

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
    titleScale: 1.0,
    bodyScale: 1.0,
    listScale: 1.0,
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
      type: "list",            // Resuelto por sectionRegistry.js (aliased a 'experience')
      column: "right",         // 'left' | 'right'
      title: "EXPERIENCIA LABORAL",
      bottomSpacing: 0,
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

El shell principal del editor (`src/App.jsx`) actúa como un **orquestador declarativo** limpio, delegando la interacción de drag-and-drop, partición de páginas y redimensionamiento en hooks especializados:

```
App.jsx (Orquestador)
├── Joyride & CustomTooltip (Tour interactivo inicial)
├── ActionMenu (Barra flotante: Diseño, Espaciado, Exportación, Idiomas, Versiones, IA)
├── DndContext (@dnd-kit/core gestionado por useCVDndCoordinator)
│   └── main#area-cv (Contenedor flex vertical)
│       └── pages.map(pageModel => (
│           └── <A4PageBox pageNumber={N}> (Caja A4 cerrada 210mm x 297mm)
│               ├── DroppableColumn #column-left (en 2-columnas)
│               │   └── SortableContext (secciones de la página N)
│               │       └── BaseSection -> EditableBaseSection
│               │           ├── DragHandle
│               │           ├── InlineEdit (título)
│               │           └── SortableContext (ítems)
│               │               └── BaseItem -> ItemComponent (ej. ExperienceItem)
│               │                   └── SortableBulletItem
│               ├── ColumnResizer (en página 1 en 2-col)
│               └── DroppableColumn #column-right (secciones de la página N)
├── AddSectionModal (Catálogo flotante de secciones disponibles)
├── SuggestionTooltip (Popover dinámico con sugerencias IA estilo Obsidian)
├── ToastNotification (Feedback no bloqueante para exportación y guardado)
└── CVDragOverlay (Ghost preview fluido durante el arrastre)
```

### 3.1 Custom Hooks Especializados (`src/hooks/`)

- **`useDocumentPages.js`**: Hook reactivo que consume `cvData` y `pageDistributor.js`. Genera el array `pages` con la asignación determinista de secciones e ítems para cada hoja `<A4PageBox>`.
- **`useCVDndCoordinator.js`**: Centraliza la coordinación de drag-and-drop de dos niveles con `@dnd-kit` (sensores de puntero y teclado, colisión `closestCorners`, reordenamiento polimórfico).
- **`useColumnResizer.js`**: Controla el divisor interactivo entre columnas, clampeando el porcentaje entre 20% y 55% para garantizar la estabilidad visual.

---

## 4. Distribución Determinista de Páginas (`src/utils/pageDistributor.js`)

El motor de paginación opera de forma pura y determinista:

1. **Presupuesto de Altura por Página**:
   - Altura A4 ISO 216: `297mm` (1123px a 96 DPI).
   - Presupuesto en el editor: `272mm` (`EDITOR_HEIGHT_REDUCTION_MM = 25`) para proporcionar un margen de seguridad vertical contra desbordes en motores de impresión reales.
2. **Estimación Geométrica de Elementos**:
   - `estimateSectionHeight(section, options)`: Calcula la altura esperada de una sección sumando el encabezado, separación (`sectionGap`), y la suma de alturas de sus ítems.
   - `estimateItemHeight(item, type, options)`: Computa la altura del ítem basada en tipografía, líneas de texto aproximadas y viñetas (`itemGap`).
3. **Distribución en Modelos de Página (`PageModel`)**:
   - Las secciones e ítems se asignan secuencialmente a `Page 1`. Al sobrepasar el presupuesto vertical, el exceso se transfiere limpiamente a `Page 2` (o subsiguientes), permitiendo división a nivel de ítem cuando una sección no cabe completa.
4. **Independencia de Columnas en 2-Col**:
   - En modo 2 columnas, la columna izquierda y la derecha calculan sus alturas independientemente, extendiendo fondos hasta el límite físico de la hoja `<A4PageBox>`.

---

## 5. Pipeline de Impresión PDF y Paridad Visual (`src/services/print/`)

El pipeline de impresión nativa y generación de PDF libre de artefactos interactivos está modularizado bajo el principio de Responsabilidad Única (SRP):

```
src/services/print/
├── index.js                    # API Façade pública (executeCleanPrint, generateCleanPrintHTML)
├── pdfTitleService.js          # Sanitización y formateo de nombre dinámico de archivo PDF
├── cleanHtmlGenerator.js       # Sanitización de DOM (cloneNode), inyección de estilos y HTML fallback
└── printExecutionDriver.js     # Orquestación de iframe oculto, espera de fuentes y window.print()
```

### 5.1 Ciclo de Ejecución de Impresión

```
             Usuario pulsa "Imprimir / Guardar PDF"
                               │
                               ▼
  1. Captura y Sanitización de Clon del DOM (createSanitizedPrintClone)
     - cloneNode(true) sobre #area-cv
     - Purga de [data-editor-ui="true"], .no-print, manijas de arrastre
     - Purga de placeholders vacíos y atributos contenteditable
     - Conservación exacta de las cajas discretas .a4-page-box
                               │
                               ▼
  2. Inyección de Estilos y Tokens de Diseño
     - Inyección de index.css y print.css con @media print
     - Transferencia de variables CSS (--*) desde #area-cv a :root
                               │
                               ▼
  3. Carga en Iframe Aislado Fuera de Pantalla
     - Creación de iframe oculto
     - Escritura de documento HTML limpio
     - Espera activa de fuentes web (doc.fonts.ready)
                               │
                               ▼
  4. Disparo de Impresión Nativa (window.print)
     - iframe.contentWindow.focus()
     - iframe.contentWindow.print()
                               │
                               ▼
  5. Limpieza de Recursos
     - Desmontaje del iframe tras el evento afterprint
```

---

## 6. Documentos Relacionados
 
 - [Guía de Requisitos Estrictos y Anti-Regresión](REQUIREMENTS_SPECIFICATION.md): Especificación formal de contratos y restricciones inmutables del sistema.
 - [Hoja de Ruta de Refactorización y Calidad](REFACTORING_ROADMAP.md): Fases planificadas para evolución técnica sin regresiones.
 - [Guía de Extensibilidad de Secciones](guia-extensibilidad-secciones.md): Tutorial para registrar nuevos tipos de sección en `sectionRegistry.js`.
 - [Invariantes de Impresión PDF y Cajas A4](../FRACASO_SALTOS_DE_PAGINA.md): Lecciones aprendidas y prohibición de reflow dinámico o parches en DOM.
 - [Diseño e Invariantes UI](diseno-invariantes.md): Guía de callouts Obsidian, accesibilidad y tokens de interfaz.
