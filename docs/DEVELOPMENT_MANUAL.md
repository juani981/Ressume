# Manual de Desarrollo

Este documento establece las pautas de arquitectura, estructura de directorios, estándares de código y guías de desarrollo para los colaboradores del proyecto **Ressume**.

---

## 1. Guías Técnicas Especializadas en `/docs`

Para profundizar en áreas específicas del sistema, consulte las guías técnicas autoritativas:
- **[Arquitectura del Editor y Flujo de Datos](arquitectura.md)**: Flujo de datos unidireccional con `CVContext.jsx`, descomposición modular en hooks (`useDocumentPages`, `useCVDndCoordinator`, `useColumnResizer`), subcomponentes de presentación y utilidades de geometría y color.
- **[Guía de Extensibilidad de Secciones e Ítems](guia-extensibilidad-secciones.md)**: Tutorial paso a paso para añadir nuevas secciones mediante `src/registry/sectionRegistry.js` respetando el patrón Open/Closed y Template + Strategy sin tocar componentes del núcleo.
- **[Diseño, Invariantes y Accesibilidad](diseno-invariantes.md)**: Estándar visual Obsidian Callouts, exclusividad de `@dnd-kit`, posicionamiento dinámico de tooltips con `getBoundingClientRect()`, tokens tipográficos y unificación de iconos en `lucide-react`.
- **[Invariante de Paginación e Impresión PDF](../FRACASO_SALTOS_DE_PAGINA.md)**: Proyección 1:1 sin reflow dinámico (`executeCleanPrint` en `src/services/print/`), cajas discretas A4 (`210mm x 297mm`, `overflow: hidden`) y prohibición de `break-before` en selectores repetidos.

---

## 2. Estructura de Directorios

El código fuente de la aplicación se encuentra estructurado en `src/`:

```text
├── src/
│   ├── components/
│   │   ├── CV/                # Componentes de renderizado del currículum (BaseSection, BaseItem, A4PageBox, items/)
│   │   │   └── items/         # Renderizadores atómicos de ítems (ExperienceItem, EducationItem, CertificatesItem, etc.)
│   │   └── Editor/            # Componentes de UI interactiva (ActionMenu, DragHandle, InlineEdit, Modals)
│   ├── constants/             # SSOT canónico (geometry.js, spacing.js, typography.js, colors.js)
│   ├── context/               # Estado Global y Fachada (CVContext.jsx, hooks/useCVData, hooks/useCVHistory, hooks/useCVLayout, hooks/useCVExport)
│   ├── hooks/                 # Custom hooks modulares (useDocumentPages, useCVDndCoordinator, useColumnResizer)
│   ├── registry/              # Catálogo abierto de secciones (sectionRegistry.js, itemFormatters.js)
│   ├── services/print/        # Pipeline de impresión (cleanHtmlGenerator.js, printExecutionDriver.js, pdfTitleService.js)
│   ├── styles/                # Estilos dedicados (print.css - SSOT de impresión)
│   ├── utils/                 # Utilidades puras (pageGeometry.js, pageDistributor.js, colorUtils.js, typographyUtils.js)
│   ├── tests/                 # Suites de pruebas automatizadas en Vitest
│   ├── index.css              # Estilos base y tokens CSS en pantalla (sin reglas @media print)
│   ├── App.jsx                # Orquestador declarativo de alto nivel
│   └── main.jsx               # Entry point de Vite
```

---

## 3. Pautas para Componentes de la Interfaz (UI)

### 3.1 Adición de Nuevas Secciones (Patrón Open/Closed)
Está **estrictamente prohibido** agregar bloques condicionales `if (type === ...)` o `switch(type)` dentro de `App.jsx`, `BaseSection.jsx` o `BaseItem.jsx`. 

Para crear un nuevo tipo de sección:
1. Cree el componente visual del ítem en `src/components/CV/items/NuevoItem.jsx`.
2. Si el ítem contiene listas con viñetas, utilice obligatoriamente el componente compartido `SortableBulletItem.jsx`.
3. Registre el descriptor de la sección en `src/registry/sectionRegistry.js` mediante la función `registerSectionType`.
4. Defina las funciones de formateo para exportación en `src/registry/itemFormatters.js`.

Consulte la **[Guía de Extensibilidad de Secciones](guia-extensibilidad-secciones.md)** para el tutorial detallado y ejemplos de código.

### 3.2 Componentes Editables
Para evitar manipular referencias del DOM directamente, cualquier cadena de texto que deba ser editable por el usuario **debe obligatoriamente** utilizar el componente `InlineEdit.jsx`:

```jsx
// ❌ Incorrecto
<p>{item.description}</p>

// ✅ Correcto
<InlineEdit 
  value={item.description} 
  onSave={(newValue) => updateItemDescription(item.id, newValue)} 
  isPrint={isPrint}
/>
```

### 3.3 Estandarización de Iconos en `lucide-react`
No utilice clases CSS de fuentes de iconos externas (como BoxIcons `bx bx-*`). Todo icono debe importarse directamente como componente SVG desde `lucide-react` (por ejemplo: `import { Plus, Trash2, GripVertical } from 'lucide-react';`).

---

## 4. Invariantes de Diseño y Drag & Drop (`AGENTS.md`)

Todo colaborador debe acatar las directrices de `AGENTS.md`:
- **Drag & Drop**: Utilice siempre `@dnd-kit`. Está prohibido el uso de `swapy`.
- **Tooltips y Popovers**: Deben posicionarse dinámicamente según `getBoundingClientRect()`, con flip horizontal al acercarse al borde de la ventana y clamp vertical.
- **Obsidian Callouts**: Las tarjetas de sugerencia y alertas deben seguir el diseño Obsidian con bordes izquierdos de 4px y colores `rgba(233, 49, 71, ...)` (Danger), `rgba(219, 139, 0, ...)` (Caution), o `rgba(8, 109, 221, ...)` (Info).

Consulte la **[Guía de Diseño e Invariantes](diseno-invariantes.md)** para más detalles.

---

## 5. Pruebas Automatizadas

El proyecto cuenta con suites de pruebas unitarias, de integración, geométricas y de regresión ejecutadas mediante **Vitest** y **React Testing Library**.

**Comandos disponibles:**
* Ejecutar la suite completa una sola vez: `npm test -- --run`
* Modo watcher interactivo durante desarrollo: `npm test`
* Compilación de producción (bundle Vite): `npm run build`

**Criterios de Aceptación:**
- La suite de pruebas debe finalizar con **100% de tests exitosos y 0 fallos**.
- La compilación de producción con `npm run build` debe completarse con **0 errores y 0 advertencias**.
