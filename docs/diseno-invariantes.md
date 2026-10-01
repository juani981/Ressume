# Guía de Estilo, Invariantes Arquitectónicos, Accesibilidad y UI Standards

Este documento establece las directrices visuales, tokens de diseño, estándares de accesibilidad y los **invariantes arquitectónicos obligatorios** definidos en `AGENTS.md` para el desarrollo y evolución de la interfaz de usuario en **Ressume**.

---

## 1. Invariantes Arquitectónicos Obligatorios (`AGENTS.md`)

Cualquier contribución o modificación en el código debe respetar estrictamente los siguientes cuatro pilares invariantes. La violación de cualquiera de estas reglas invalida la integración y rompe la arquitectura del sistema:

### Invariante 1: Estándar Visual de Callouts Estilo Obsidian
Todas las tarjetas de sugerencia, alertas de validación y popovers contextuales de feedback deben adherirse visualmente al estándar **Obsidian Callout**:
- **Estructura HTML Requerida**:
  - Contenedor con clase `.obsidian-callout`.
  - Título con clase `.callout-title` (`display: flex; gap: 8px; font-weight: 600; align-items: center;`).
  - Contenido descriptivo con clase `.callout-content` (`font-size: 12px; line-height: 1.45;`).
- **Paleta Cromática Estricta por Severidad**:
  - **Danger / Critical**:
    - Color base: `rgba(233, 49, 71, ...)`
    - Fondo: `rgba(233, 49, 71, 0.1)`
    - Borde izquierdo: `4px solid rgba(233, 49, 71, 1)`
    - Título: Color `rgba(233, 49, 71, 1)`, peso `600`
    - Icono: `OctagonAlert` (Lucide) o emoji `🛑` / `🚨`
  - **Caution / Warning**:
    - Color base: `rgba(219, 139, 0, ...)`
    - Fondo: `rgba(219, 139, 0, 0.1)`
    - Borde izquierdo: `4px solid rgba(219, 139, 0, 1)`
    - Título: Color `rgba(219, 139, 0, 1)`, peso `600`
    - Icono: `TriangleAlert` (Lucide) o emoji `⚠️`
  - **Info**:
    - Color base: `rgba(8, 109, 221, ...)`
    - Fondo: `rgba(8, 109, 221, 0.1)`
    - Borde izquierdo: `4px solid rgba(8, 109, 221, 1)`
    - Título: Color `rgba(8, 109, 221, 1)`, peso `600`
    - Icono: `Info` (Lucide) o emoji `ℹ️`

### Invariante 2: Arquitectura de Drag-and-Drop Exclusiva con `@dnd-kit`
- **Librería Obligatoria**: Usar exclusivamente `@dnd-kit` (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`).
- **Prohibición Expresa de `swapy`**: El uso de librerías de intercambio basadas en DOM plano (como `swapy`) está terminantemente vetado. Dichas bibliotecas producen colisiones de IDs de ranura (slot collisions) en árboles anidados de React y corrompen la reconciliación del Virtual DOM, generando desincronización de estado en reordenamientos rápidos.

### Invariante 3: Posicionamiento Dinámico de Tooltips con `getBoundingClientRect()`
- En layouts multicomponente o documentos centrados (como la hoja A4 de `#area-cv`), los tooltips y popovers **nunca deben fijarse a coordenadas estáticas en pantalla ni a offsets globales fijos**.
- El anclaje debe calcularse en tiempo real sobre el rectángulo de coordenadas del elemento activo (`target.getBoundingClientRect()`):
  1. **Posición adyacente**: `left = Math.round(rect.right + 20)`.
  2. **Flip horizontal**: Si el tooltip se aproxima al borde derecho (`left + width > window.innerWidth`), se invierte automáticamente al lado izquierdo (`left = Math.round(rect.left - 320)`).
  3. **Clamping vertical**: Se acota el valor superior (`top`) para que el popover nunca sobrepase el límite inferior de la ventana (`window.innerHeight`).
  4. **Márgenes de seguridad**: Se asegura un padding mínimo de `20px` respecto a cualquier borde de la pantalla.

### Invariante 4: Motor de Sugerencias IA y Enfoque de Dominio Tech
- Las recomendaciones de redacción y advertencias de diseño provienen de bases de conocimiento estructuradas en archivos JSON locales (`src/ai-knowledge/`), no de inferencia en tiempo real de LLMs en el cliente.
- El foco actual está estrictamente optimizado para la industria **Tech** (desarrollo, ingeniería de software, arquitectura cloud, DevOps, QA) y directrices universales (`all`). Módulos para carreras creativas o ejecutivas tradicionales permanecen reservados para fases futuras.

---

## 2. Tokens de Estilo y Variables CSS (`src/index.css`)

El diseño visual de **Ressume** se gobierna mediante CSS Custom Properties aplicadas al nodo `#area-cv` y transferidas a la raíz de impresión.

### 2.1 Colores Semánticos y Superficies
```css
:root {
  /* Colores de Fondo y Contenedores */
  --body-color: #ffffff;
  --container-color: #ffffff;
  --container-color-alt: #f3f4f6;

  /* Tipografía y Contraste */
  --title-color: #0f172a;       /* Titulares principales y nombres (slate-900) */
  --text-color: #334155;        /* Texto de párrafo y viñetas (slate-700) */
  --text-color-light: #64748b;  /* Fechas, subtítulos y metadatos (slate-500) */

  /* Acentos y Decoración */
  --first-color: #3874ff;       /* Azul interactivo principal */
  --circle-color: #3874ff;      /* Viñeta de timeline en títulos */
}
```

### 2.2 Escala Tipográfica Dinámica
La escala de fuentes se parametriza mediante un factor multiplicador global `--font-scale` (rango habitual: 0.85 a 1.25):

```css
#area-cv {
  --body-font: 'Poppins', sans-serif;
  --font-scale: 1.0;
  --title-scale: 1.0;
  --body-scale: 1.0;
  --list-scale: 1.0;
  --line-height: 1.45;

  /* Tamaños calculados en tiempo real */
  --h1-font-size: calc(1.5rem * var(--font-scale, 1));        /* ~24px */
  --h2-font-size: calc(1.25rem * var(--font-scale, 1));       /* ~20px */
  --h3-font-size: calc(1rem * var(--font-scale, 1));          /* ~16px */
  --normal-font-size: calc(0.938rem * var(--font-scale, 1));  /* ~15px */
  --small-font-size: calc(0.875rem * var(--font-scale, 1));   /* ~14px */
  --smaller-font-size: calc(0.75rem * var(--font-scale, 1));  /* ~12px */
}
```

### 2.3 Familias Tipográficas Certificadas
Las 5 fuentes disponibles en el editor están preconfiguradas para lectura óptima tanto por reclutadores humanos como por sistemas de seguimiento de candidatos (ATS):

| Fuente | Categoría | Recomendación de Uso | Fallback Stack |
|---|---|---|---|
| **Poppins** | Sans-Serif geométrica | Por defecto; diseño moderno, amigable y legible en pantalla. | `'Poppins', sans-serif` |
| **Inter** | Sans-Serif neutral | Máxima legibilidad en densidad alta de texto y entornos corporativos. | `'Inter', sans-serif` |
| **Roboto** | Neo-grotesque | Excelente renderizado en sistemas móviles y documentos técnicos. | `'Roboto', sans-serif` |
| **Merriweather** | Serif editorial | Currículums académicos, legales o perfiles con perfil de investigación. | `'Merriweather', serif` |
| **JetBrains Mono** | Monospace moderna | Especialistas en infraestructura, DevOps, backend y seguridad informática. | `'JetBrains Mono', monospace` |

### 2.4 Espaciado Perimetral y Entre Elementos
Los espaciados se controlan de forma reactiva desde el panel "Espaciado":
- `--page-padding`: Margen perimetral del documento A4 (default: `24px`, rango: 16px a 40px).
- `--section-gap`: Separación vertical entre secciones consecutivas (default: `20px`, rango: 10px a 36px).
- `--item-gap`: Separación vertical entre ítems individuales dentro de una sección (default: `8px`, rango: 4px a 20px).

---

## 3. Geometría Responsiva del Canvas A4

El contenedor `#area-cv` simula hojas de papel físico A4 manteniendo consistencia geométrica absoluta:
- **Ancho Fijo Estricto**: `794px` (equivalente a 210mm a 96 DPI). No se estira en pantallas anchas ni se comprime arbitrariamente; en pantallas pequeñas se implementa scroll horizontal o escala de vista.
- **Altura Base**: Múltiplos de `297mm` (`1123px` por hoja a 96 DPI).
- **Separador Visual de Pantalla (`gapPx = 20`)**: En el editor interactivo, cada página simulada está dividida por un espaciador visual de `20px` (`.a4-page-fold-guide`). **Este espaciador es puramente visual para la experiencia de edición y nunca se traslada al documento PDF impreso.**

### Modo Tradicional (2 Columnas) vs Modo ATS (1 Columna)
1. **Modo Tradicional (2 Columnas)**:
   - Utiliza CSS Grid: `display: grid; grid-template-columns: var(--grid-template-columns)`.
   - La columna izquierda (`.resume__left`) contiene datos de contacto, perfil, educación, idiomas y habilidades con un fondo personalizable (`leftBg`).
   - La columna derecha (`.resume__right`) alberga la experiencia laboral y proyectos destacados sobre fondo blanco (`#ffffff`).
   - Separador redimensionable interactivo (`ColumnResizer`) que permite alternar el ancho entre 20% y 55%.
2. **Modo ATS Optimizado (1 Columna)**:
   - Desactiva el grid y pasa a flujo lineal vertical: `display: block; background: #ffffff`.
   - Remueve fondos decorativos y sombras en tarjetas para garantizar que los lectores OCR/ATS extraigan el texto de forma secuencial sin ambigüedades.
   - Encabezados de sección con subrayado sobrio: `border-bottom: 1.5px solid #0f172a; padding-bottom: 4px`.

---

## 4. Implementación del Algoritmo de Tooltips Dinámicos

El siguiente extracto documenta la matemática de cálculo utilizada en `SuggestionTooltip.jsx`:

```javascript
// Coordenadas del elemento de referencia
const rect = targetElement.getBoundingClientRect();
const vw = window.innerWidth;
const vh = window.innerHeight;
const TOOLTIP_WIDTH = 300;

// 1. Cálculo horizontal adyacente
let left = Math.round(rect.right + 20);

// Flip horizontal al aproximarse al borde derecho de la ventana
if (left + TOOLTIP_WIDTH > vw) {
  left = Math.round(rect.left - 320);
}
// Margen de seguridad izquierdo
if (left < 20) {
  left = 20;
}

// 2. Cálculo vertical anclado a la parte superior del elemento
let top = Math.round(rect.top);

// Clamping vertical para evitar desbordes inferiores
if (top + 400 > vh) {
  top = vh - 420;
}
// Margen de seguridad superior
if (top < 20) {
  top = 20;
}
```

---

## 5. Estándar de Iconografía Homogénea (`lucide-react`)

Toda la iconografía de la aplicación está unificada en componentes SVG nativos de `lucide-react`. Está **estrictamente prohibido** utilizar fuentes de iconos externas (como BoxIcons `bx bx-*`), stylesheets CDN externos o imágenes rasterizadas para iconos.

### Mapeo Canónico de Iconos
- **Acciones Generales**:
  - Agregar: `<Plus size={18} />` o `<PlusCircle size={16} />`
  - Eliminar: `<Trash2 size={13} />` (sección) o `<Minus size={14} />` (ítem)
  - Arrastrar: `<GripVertical size={16} />`
  - Cerrar modal/tooltip: `<X size={14} />`
  - Editar / Redactar: `<Edit3 size={15} />`
- **Secciones del Currículum**:
  - Experiencia: `<Briefcase size={16} />`
  - Educación: `<GraduationCap size={16} />`
  - Proyectos: `<FolderGit2 size={16} />`
  - Habilidades: `<Wrench size={16} />`
  - Idiomas: `<Languages size={16} />`
  - Certificaciones: `<BadgeCheck size={16} />`
  - Premios: `<Trophy size={16} />`
  - Publicaciones: `<BookOpen size={16} />`
  - Voluntariado: `<HeartHandshake size={16} />`
  - Referencias: `<UserCheck size={16} />`
  - Mentoría: `<Brain size={16} />`
  - Espaciador en blanco: `<MoveVertical size={16} />`
- **Contacto y Redes**:
  - Correo electrónico: `<Mail size={14} />`
  - Teléfono: `<Phone size={14} />`
  - Ubicación: `<MapPin size={14} />`
  - LinkedIn: `<Linkedin size={14} />`
  - GitHub: `<Github size={14} />`
  - Web / Portfolio: `<Globe size={14} />`

---

## 6. Accesibilidad (a11y) y Atajos de Teclado

### Atajos en Edición de Texto
En cualquier campo interactivo (`InlineEdit.jsx`), el editor responde a atajos estándar de teclado:
- `Ctrl + B` (`Cmd + B` en macOS): Alterna formato **Negrita**.
- `Ctrl + I` (`Cmd + I` en macOS): Alterna formato *Cursiva*.
- `Ctrl + Z` (`Cmd + Z` en macOS): Deshacer la última acción (`undo`).
- `Ctrl + Shift + Z` / `Ctrl + Y`: Rehacer la última acción (`redo`).

### Requisitos Semánticos
1. Todos los botones que contengan únicamente iconos deben proveer un atributo `aria-label` o `title` descriptivo.
2. Los modales y popovers deben manejar el foco y cerrarse mediante la tecla `Escape`.
3. Todos los inputs de edición deben mantener contraste cromático suficiente respecto al fondo sobre el cual se montan (verificado con `getContrastYIQ`).

---

## 7. Documentos Relacionados

- [Arquitectura del Editor](arquitectura.md): Estructura general y orquestación de componentes.
- [Guía de Extensibilidad de Secciones](guia-extensibilidad-secciones.md): Tutorial para agregar nuevas secciones con sus iconos Lucide.
- [Invariantes de Impresión PDF](../FRACASO_SALTOS_DE_PAGINA.md): Directivas obligatorias de impresión sin reflow dinámico y cajas A4.
- [Manual de Desarrollo](DEVELOPMENT_MANUAL.md): Guía de desarrollo y estándares de contribución.
