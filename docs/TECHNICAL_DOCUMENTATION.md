# Documentación Técnica

> **Nota para Desarrolladores:** Para especificaciones detalladas, consulte las guías autoritativas en `/docs`:
> - [Arquitectura del Editor y Flujo de Datos](arquitectura.md)
> - [Guía de Extensibilidad de Secciones e Ítems](guia-extensibilidad-secciones.md)
> - [Diseño, Invariantes y Accesibilidad](diseno-invariantes.md)
> - [Motor de Impresión PDF y Paridad Visual](motor-impresion-pdf.md)
> - [Manual de Desarrollo](DEVELOPMENT_MANUAL.md)

---

## 1. Arquitectura del Frontend

El cliente es una Single Page Application (SPA) desarrollada con React 18 y Vite. Sigue un patrón arquitectónico basado en flujo de datos unidireccional y una fachada central en `src/context/CVContext.jsx`.

### 1.1 Estado Global (Context API & Descomposición Modular)
El estado de la aplicación reside en `src/context/CVContext.jsx`, descompuesto en 4 hooks modulares especializados:
- `useCVData`: Mutaciones inmutables de perfil, secciones e ítems, sincronizado automáticamente con `localStorage`.
- `useCVHistory`: Pila inmutable de Deshacer / Rehacer (`undo`, `redo`).
- `useCVLayout`: Modos de diseño (2 columnas tradicional vs ATS 1 columna), proporciones de columna, tipografía y espaciado.
- `useCVExport`: Orquestación de exportación limpia de PDF y serialización JSON.

### 1.2 Motor de Drag & Drop (@dnd-kit)
El sistema de ordenamiento utiliza exclusivamente `@dnd-kit` (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`) orquestado por el hook `src/hooks/useCVDndCoordinator.js`:
- El diseño es jerárquico de 2 niveles:
  1. `DndContext` de nivel superior en `App.jsx` que gestiona el orden de las **secciones mayores** y el movimiento polimórfico entre columnas (`leftCol` <-> `rightCol`).
  2. `SortableContext` interno en cada `BaseSection.jsx` con estrategia vertical (`verticalListSortingStrategy`) para manejar el reordenamiento de **elementos internos** (ítems de experiencia, educación, proyectos) y viñetas anidadas (`SortableBulletItem.jsx`).
- Detección de colisiones mediante `closestCorners`.
- Prohibición estricta de `swapy` para evitar colisiones de IDs en el Virtual DOM de React.

---

## 2. Esquema de Datos (JSON Schema)

La estructura semántica del currículum obedece al esquema definido en `src/utils/schema.js`:

```json
{
  "profile": {
    "name": "string",
    "subtitle": "string",
    "email": "string",
    "location": "string",
    "phone": "string",
    "linkedin": "string",
    "github": "string",
    "description": "string"
  },
  "layout": {
    "type": "2-column",
    "isAtsMode": false,
    "fontFamily": "Poppins",
    "fontScale": 1.0,
    "lineHeight": 1.45,
    "pagePadding": 24,
    "sectionGap": 20,
    "itemGap": 8,
    "leftBg": "#f3f4f6",
    "rightBg": "#ffffff",
    "leftColumnWidth": 33.33
  },
  "sections": [
    {
      "id": "string",
      "type": "list",
      "column": "right",
      "title": "string",
      "bottomSpacing": 0,
      "bulletStyle": { "size": "normal", "variant": "bold", "showLine": true },
      "items": [
        {
          "id": "string",
          "title": "string",
          "subtitle": "string",
          "date": "string",
          "bullets": [
            "string"
          ]
        }
      ]
    }
  ]
}
```

---

## 3. Motor de Exportación e Impresión PDF (Client-Side Engine)

El renderizado e impresión a PDF es 100% del lado del cliente, gestionado por `src/utils/staticHtmlPdfEngine.js` (`executeCleanPrint`). No requiere servidores backend, Puppeteer ni dependencias nativas complejas.

### 3.1 Flujo de Ejecución (Aislamiento y Renderizado)
1. **Generación de HTML Limpio (`generateCleanPrintHTML`):** Serializa el estado activo del CV (`cvData`) utilizando los componentes visuales puros de React (`PrintBaseSection`, `PrintBaseItem`), purgando 26 selectores de artefactos interactivos de edición.
2. **Inyección en Iframe Aislado:** Crea un elemento `<iframe>` invisible fuera del flujo visual (`top: -10000px; width: 794px`), inyectando el HTML generado junto con los estilos de producción (`src/index.css` saneado, `src/styles/print.css` y saltos dinámicos).
3. **Paginación y Prevención de Ruptura:** Aplica `break-inside: avoid !important` en todos los super-contenedores y traslada encabezados huérfanos mediante `isOrphanTitle`. Configura `box-decoration-break: slice` en las columnas para impedir la duplicación de paddings en la página 2.
4. **Propagación de Variables CSS:** Transfiere dinámicamente las propiedades `--*` activas en el `#area-cv` del editor a la raíz del documento de impresión.
5. **Sincronización de Fuentes y Disparo:** Espera a que las fuentes web estén listas (`document.fonts.ready`), enfoca el iframe e invoca `contentWindow.print()` (con fallback a `window.print()`).
6. **Limpieza Automática:** Al concluir o cancelar el diálogo de impresión (`afterprint`, `print-dialog-closed`), el iframe temporal es desmontado del DOM sin dejar nodos huérfanos.
