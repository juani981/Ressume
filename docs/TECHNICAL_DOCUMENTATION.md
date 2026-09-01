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

## 3. Arquitectura del Backend (PDF Engine)

El backend es un entorno Serverless alojado en Netlify Functions (`generate-pdf.js`). Su propósito exclusivo es la rasterización y renderizado a PDF.

### 3.1 Flujo de Ejecución (Inyección de Estado)
1.  **Recepción:** El endpoint recibe un método `POST` desde el cliente, cuyo cuerpo (`event.body`) contiene la URL actual (`url`) y el árbol de estado JSON (`cv_state`).
2.  **Inicialización Headless:** Se instancia un navegador Chrome en modo headless usando `@sparticuz/chromium` para asegurar compatibilidad con la limitación de 50MB de AWS Lambda.
3.  **Inyección en Tiempo de Ejecución:** Antes del renderizado del DOM en React, Puppeteer navega hacia la `url`, evalúa un script en el contexto de la página (`page.evaluate`) que inyecta la carga útil `cv_state` directamente en el `localStorage` de la instancia.
4.  **Reflow y Pintado:** Se invoca `page.reload()` esperando `networkidle0`. React inicializa leyendo el `localStorage` inyectado, renderizando las ediciones del usuario local.
5.  **Aislamiento CSS:** El script de Puppeteer inyecta una etiqueta `<style>` que aplica un filtro para ocultar los componentes de la interfaz de edición (ej. `ActionMenu`, `DragHandle`) y fuerza el ancho del contenedor (`968px`) anulando reglas responsivas perjudiciales para formatos A4/Letter.
6.  **Cálculo Dinámico de Altura:** El backend calcula el `offsetHeight` real de la página post-renderizado para garantizar que el PDF emitido no sufra recortes.
7.  **Emisión:** Devuelve un buffer en base64 de vuelta al cliente.
