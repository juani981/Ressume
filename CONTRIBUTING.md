# Guía de Contribución a Ressume 🚀

¡Gracias por tu interés en contribuir a **Ressume**! Este proyecto es un editor de currículums de alta fidelidad basado en React, diseñado para garantizar **WYSIWYG 100% (What You See Is What You Get)** entre lo que el usuario edita en pantalla y el PDF vectorial final.

---

## 1. Las Reglas de Oro Inmutables (Invariantes de Arquitectura)

Antes de escribir cualquier línea de código, debes conocer las 3 leyes fundamentales del proyecto (documentadas en `AGENTS.md` y `FRACASO_SALTOS_DE_PAGINA.md`):

1. **La Caja A4 es Sagrada e Inmutable (`210mm x 297mm`, `overflow: hidden`)**:
   - El editor (`#area-cv`) **no es un lienzo continuo infinito**. Se compone estrictamente de cajas discretas `<A4PageBox pageNumber={N}>`.
   - Si un bloque no cabe en la Página 1, el distribuidor de páginas (`pageDistributor`) lo asigna a la Página 2.
2. **Estructura Fija Tallada en Piedra (Zero Dynamic Reflow on Print)**:
   - El editor es la **única fuente de verdad**. El motor de exportación a PDF (`src/services/print/`) es pasivo y determinista: proyecta exactamente las mismas cajas que el editor. No calcula saltos ni altera posiciones al imprimir.
3. **Prohibición de `break-before: page` en selectores repetidos**:
   - **NUNCA** apliques `break-before: page` a viñetas, ítems de experiencia o bloques `.cv-block`. Hacerlo provoca que un CV de 2 páginas se fracture en un PDF de 5 páginas.

---

## 2. Mapa Rápido de la Base de Código (SOLID & SSOT)

```
src/
├── constants/               # [SSOT] Dimensiones físicas A4, espaciados, paletas, fuentes
│   ├── geometry.js          # 210mm x 297mm, 794px x 1123px, A4_GEOMETRY
│   ├── spacing.js           # Defaults: pagePadding (24px), sectionGap (20px), itemGap (8px)
│   ├── colors.js            # Tokens semánticos y reglas Obsidian Callout
│   └── typography.js        # Fuentes soportadas y límites de escalado
│
├── styles/                  # [CSS Modular]
│   ├── tokens.css           # Variables :root canónicas
│   ├── print.css            # Reglas de fragmentación para impresión
│   └── bundle.js            # Bundle pre-concatenado para iframe y exportación
│
├── services/print/          # [SRP: Motor de Exportación]
│   ├── pdfTitleService.js   # Generación y sanitización determinista del título de archivo
│   ├── cleanHtmlGenerator.js# Serialización estática de cajas A4 sin controles interactivos
│   └── printExecutionDriver.js # Ciclo de vida del iframe de impresión y window.print()
│
├── registry/                # [OCP: Extensibilidad de Secciones]
│   ├── sectionRegistry.js   # Registro desacoplado de tipos de sección
│   └── itemFormatters.js    # Serializadores a Markdown, XML y Texto Plano
│
├── components/
│   ├── CV/                  # Componentes visuales del CV (A4PageBox, BaseSection, BaseItem)
│   └── Editor/              # Barra de herramientas (ActionMenu), modales y paneles
│       └── ActionMenu/      # Compound Components (DesignPanel, ActionMenuRoot)
│
└── tests/                   # 69 suites y +1,015 pruebas unitarias e integradas (Vitest)
```

---

## 3. Cómo Agregar una Nueva Sección en 3 Pasos (Principio Open/Closed)

El sistema está diseñado para que agregues nuevos tipos de sección (por ejemplo, *Certificaciones*, *Idiomas*, *Proyectos*) **sin modificar archivos nucleares**.

### Paso 1: Crea el componente de visualización del ítem
Crea el archivo en `src/components/CV/items/CertificatesItem.jsx`:

```jsx
import React from 'react';
import InlineEdit from '../../Editor/InlineEdit';

const CertificatesItem = ({ item = {}, sectionId, isPrint = false }) => {
  return (
    <div className="certificate__data cv-block" data-item-id={item.id}>
      <h3 className="certificate__title">
        <InlineEdit
          value={item.title || ''}
          placeholder="Nombre del Certificado"
          sectionId={sectionId}
          itemId={item.id}
          field="title"
          isPrint={isPrint}
        />
      </h3>
      <span className="certificate__issuer">
        <InlineEdit
          value={item.issuer || ''}
          placeholder="Entidad Emisora (ej. AWS)"
          sectionId={sectionId}
          itemId={item.id}
          field="issuer"
          isPrint={isPrint}
        />
      </span>
    </div>
  );
};

export default CertificatesItem;
```

### Paso 2: Registra la sección en `src/registry/sectionRegistry.js`
Agrega el descriptor en el registro llamando a `registerSectionType`:

```javascript
import CertificatesItem from '../components/CV/items/CertificatesItem';

registerSectionType({
  type: 'certificates',
  label: 'Certificados y Licencias',
  defaultTitle: 'CERTIFICADOS',
  defaultColumn: 'right',
  icon: 'Award',
  sectionClass: 'certificates',
  itemComponent: CertificatesItem,
  createDefaultItem: () => ({
    id: generateUniqueId('cert'),
    title: 'AWS Certified Solutions Architect',
    issuer: 'Amazon Web Services',
    date: '2024',
  }),
  // Cálculo de altura encapsulado para el paginador:
  estimateItemHeight: (item, options) => {
    return 36 + (options.itemGapPx ?? 8);
  },
  schema: {
    title: 'string',
    issuer: 'string',
    date: 'string',
  },
});
```

### Paso 3: Verifica tus pruebas
Ejecuta la suite de pruebas automatizadas:
```bash
npm test
```
¡Tu sección ya está completamente integrada! Se mostrará en el menú modal de agregar secciones, soportará arrastre con `@dnd-kit`, calculará su paginación y se imprimirá en el PDF sin tocar `App.jsx` ni el motor de impresión.

---

## 4. Guía de Ejecución de Pruebas y Validación de Calidad

### Pruebas Automatizadas
```bash
# Ejecutar todas las pruebas una vez
npm test

# Modo observador (watch) para desarrollo
npm run test:watch

# Ejecutar una suite específica
npx vitest run src/tests/registry.test.jsx
```

### Criterio de Aceptación para Pull Requests (PR)
1. **100% de tests en verde**: Los 1,015 tests deben pasar sin excepciones.
2. **Cero Números Mágicos**: Si usas dimensiones físicas A4, impórtalas de `src/constants/`.
3. **Verificación Visual Empírica (Regla 6 de `AGENTS.md`)**:
   - JSDOM no evalúa fuentes subpíxel ni el motor `@media print`.
   - Abre la aplicación en tu navegador (`npm run dev`), presiona **Descargar / Imprimir PDF**, y confirma visualmente que el documento tiene **exactamente el número de páginas esperado** sin viñetas fracturadas ni saltos inesperados.
