# Documentación Técnica

## 1. Arquitectura del Frontend

El cliente es una Single Page Application (SPA) desarrollada con React 18 y Vite. Sigue un patrón arquitectónico basado en estado global para evitar el *prop drilling* excesivo.

### 1.1 Estado Global (Context API)
El estado de la aplicación reside íntegramente en `src/context/CVContext.jsx`. 
*   **Inicialización:** El contexto verifica si existe la clave `cvData` en el `localStorage`. Si no existe o es inválida, inyecta la estructura base definida en `src/utils/schema.js`.
*   **Sincronización:** Un `useEffect` acoplado al estado de `cvData` asegura que cada mutación (edición de texto, reordenamiento de bloques) se persista automáticamente en el almacenamiento local con latencia cero.
*   **Mutaciones:** Las funciones controladoras (`updateProfile`, `updateSectionTitle`, `reorderSections`, `reorderSectionItems`) abstraen la lógica de inmutabilidad de React, proporcionando una interfaz limpia a los componentes de la vista.

### 1.2 Motor de Drag & Drop
El sistema de ordenamiento utiliza `@dnd-kit/core` y `@dnd-kit/sortable`. 
*   El diseño es jerárquico. Existe un `DndContext` de nivel superior en `App.jsx` que gestiona el orden de las **secciones mayores** (Experiencia, Habilidades).
*   Cada componente `CVSection` inicializa un segundo `DndContext` interno con restricción de movimiento vertical (`verticalListSortingStrategy`) para manejar el reordenamiento de **elementos internos** (ítems de experiencia, proyectos).
*   Se utiliza un algoritmo de detección de colisiones (`closestCenter`) para optimizar la experiencia gráfica.

## 2. Esquema de Datos (JSON Schema)

La estructura semántica del currículum obedece al siguiente esquema tipo:

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
  "sections": [
    {
      "id": "string",
      "type": "generic",
      "title": "string",
      "items": [
        {
          "id": "string",
          "title": "string",
          "subtitle": "string",
          "date": "string",
          "bullets": [
             { "id": "string", "text": "string" }
          ]
        }
      ]
    }
  ]
}
```
Cualquier alteración en el esquema requiere migración del estado persistido de los clientes.

## 3. Motor de Exportación e Impresión PDF (Client-Side Engine)

El renderizado e impresión a PDF es 100% del lado del cliente, gestionado por `src/utils/staticHtmlPdfEngine.js` (`executeCleanPrint`). No requiere servidores backend, Puppeteer ni dependencias nativas complejas.

### 3.1 Flujo de Ejecución (Aislamiento y Renderizado)
1. **Generación de HTML Limpio (`generateCleanPrintHTML`):** Serializa el estado activo del CV (`cvData`) utilizando los mismos componentes visuales de React (`PrintBaseSection`, `PrintBaseItem`), purgando todo elemento interactivo o de edición (botones, toolbars, handlers de drag-and-drop).
2. **Inyección en Iframe Aislado:** Crea un elemento `<iframe>` invisible fuera del flujo visual (`top: -10000px`), inyectando el HTML generado junto con los estilos de producción (`src/index.css` y `src/styles/print.css`).
3. **Paginación y Prevención de Ruptura (2-Column & Single-Column):** La función `enforceTwoColumnComponentPagination` calcula la altura de cada columna contra la geometría A4 (`1123px` a 96 DPI), inyectando clases de salto de página (`force-page-break-before`) y ajustando márgenes dinámicamente para evitar cortes indeseados en títulos y bloques de contenido.
4. **Sincronización de Fuentes y Disparo:** Espera a que las fuentes web estén listas (`document.fonts.ready`), enfoca el iframe e invoca `contentWindow.print()` (con fallback a `window.print()`).
5. **Limpieza Automática:** Al concluir o cancelar el diálogo de impresión (`afterprint`, `print-dialog-closed`), el iframe temporal es desmontado del DOM sin dejar nodos huérfanos.
