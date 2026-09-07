# Manual de Desarrollo

Este documento establece las pautas, estructuras de directorios y estándares de código para los colaboradores del proyecto.

## 1. Estructura de Directorios

El código fuente de la aplicación se encuentra estructurado en `src/`:

```text
├── src/
│   ├── components/
│   │   ├── CV/                # Componentes de renderizado visual del CV (pantalla e impresión)
│   │   └── Editor/            # Componentes de interacción y UI del editor (Menu, DragHandles, Modals)
│   ├── context/
│   │   └── CVContext.jsx      # Estado Global, sincronización con LocalStorage y Undo/Redo
│   ├── utils/
│   │   ├── schema.js          # Esquema de datos por defecto (Source of Truth)
│   │   ├── staticHtmlPdfEngine.js # Motor cliente de impresión y paginación A4
│   │   └── versionStorage.js  # Motor de persistencia en IndexedDB (Version Hub)
│   ├── App.jsx                # Raíz de la jerarquía de componentes y DndContext
│   ├── index.css              # Estilos base de la aplicación y modo visual
│   └── main.jsx               # Entry point de Vite
```

## 2. Pautas para Componentes de la Interfaz (UI)

### 2.1 Adición de Nuevas Secciones
Si se requiere construir un tipo de sección con una topología diferente a las secciones genéricas (ej. Gráficos de habilidades radiales):
1. Defina un identificador estricto para `type` en el esquema JSON (ej. `"type": "skills_radial"`).
2. En `App.jsx`, implemente un patrón *Factory* o un bloque *Switch* que parsee el atributo `type` iterado del `cvData.sections` y renderice un componente específico en lugar de `CVSection.jsx`.
3. Todo componente nuevo debe estar envuelto en el HOC o los *hooks* de `@dnd-kit/sortable` para mantener la capacidad de reordenamiento global.

### 2.2 Componentes Editables
Para evitar manipular referencias del DOM directamente, cualquier cadena de texto que deba ser editable por el usuario **debe obligatoriamente** utilizar el componente `InlineEdit.jsx`.
```jsx
// Incorrecto
<p>{item.description}</p>

// Correcto
<InlineEdit 
    value={item.description} 
    onSave={(newValue) => updateItemDescription(item.id, newValue)} 
/>
```

## 3. Pruebas Automatizadas
El proyecto cuenta con suites de pruebas unitarias, de integración y E2E ejecutadas mediante **Vitest** y **React Testing Library**.

**Ejecución de pruebas:**
*   Ejecutar suite completa: `npm test`
*   Modo interactivo / watcher: `npm run test:watch`

## 4. Convenciones de Estilo y CSS
*   Se emplea la metodología BEM (Block Element Modifier) heredada del diseño base.
*   Los estilos globales viven en `src/index.css` y las reglas específicas de impresión en `src/styles/print.css`.
*   Para ocultar elementos en la impresión, utilice la clase utilitaria `.no-print`.
