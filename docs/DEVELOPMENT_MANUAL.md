# Manual de Desarrollo

Este documento establece las pautas, estructuras de directorios y estándares de código para los colaboradores del proyecto.

## 1. Estructura de Directorios

El código fuente del frontend se encuentra en `src/`, y el backend en `netlify/`.

```text
├── netlify/
│   └── functions/
│       └── generate-pdf.js      # Lógica de renderizado Headless Chrome
├── src/
│   ├── components/
│   │   ├── CV/                # Componentes que conforman la vista principal del CV
│   │   └── Editor/            # Componentes de interacción y UI del editor (Menu, DragHandles)
│   ├── context/
│   │   └── CVContext.jsx        # Estado Global y lógica de LocalStorage
│   ├── utils/
│   │   └── schema.js            # Esquema de datos por defecto (Source of Truth inicial)
│   ├── App.jsx                  # Raíz de la jerarquía de componentes y gestor principal del DndContext
│   ├── index.css                # Estilos base y configuraciones de Grid heredadas
│   └── main.jsx                 # Entry point de Vite
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

## 3. Pruebas del Backend (Entorno Local)

Debido a que `generate-pdf.js` requiere dependencias nativas complejas (`puppeteer-core`, binaries de Chromium), las pruebas locales estándar mediante Node fallarán sin el entorno adecuado.

**Proceso de pruebas local:**
1. Instale las utilidades de Netlify: `npm i -g netlify-cli`.
2. Asegúrese de tener las variables de entorno configuradas si fuese necesario en `.env`.
3. Inicie el emulador Serverless: `netlify dev`.
4. El servidor escuchará en el puerto 8888. Las peticiones a `http://localhost:8888/.netlify/functions/generate-pdf` emularán las restricciones exactas del entorno de AWS Lambda.

## 4. Convenciones de Estilo y CSS
*   Se emplea la metodología BEM (Block Element Modifier) heredada del proyecto base.
*   Todo el CSS se compila globalmente a través de `index.css`.
*   Para garantizar que la inyección de Puppeteer no falle, **no utilice medias queries responsivas severas (`display: none`)** sobre elementos críticos del área `#area-cv`.
*   Los componentes de la UI del editor (botones flotantes) deben incluir clases de utilidad que faciliten su ocultación por parte de Puppeteer (ej. inyección de `.generate-pdf { display: none }`).
