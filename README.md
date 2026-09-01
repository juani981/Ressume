# Live Editor CV

## Descripción General

Live Editor CV es un sistema de creación y gestión de currículums interactivo, construido sobre React y Vite. A diferencia de las plantillas estáticas tradicionales, esta aplicación ofrece una experiencia de edición visual directa (WYSIWYG) basada en bloques. 

La arquitectura permite manipular el orden de las secciones y el contenido de forma intuitiva, garantizando que el diseño en pantalla coincida 1:1 con la generación del documento final (PDF) a través de un servicio de renderizado backend automatizado.

## Características Principales

*   **Edición en Línea (Inline Editing):** Toda la información de la interfaz gráfica es editable al hacer clic, eliminando la necesidad de formularios separados.
*   **Gestión de Bloques (Drag and Drop):** Integración profunda con `@dnd-kit` para reordenamiento de secciones enteras y elementos individuales.
*   **Persistencia Local y Portabilidad:** El estado de la aplicación se gestiona a través de un esquema JSON estricto almacenado en el `localStorage` del navegador. Permite la exportación e importación del estado en formato JSON.
*   **Generación de PDF Pixel-Perfect:** Utiliza Netlify Functions y Puppeteer (`@sparticuz/chromium`) para interceptar el estado actual del cliente e inyectarlo en una instancia *headless* del navegador, asegurando que la impresión refleje con precisión las modificaciones del usuario, incluyendo preferencias de modo oscuro.

## Requisitos del Sistema

*   Node.js (v18.0.0 o superior)
*   NPM (v8.0.0 o superior)
*   Netlify CLI (Recomendado para pruebas locales del backend)

## Instalación y Despliegue Local

1. Clonar el repositorio.
2. Instalar las dependencias del frontend:
   ```bash
   npm install
   ```
3. Iniciar el servidor de desarrollo Vite:
   ```bash
   npm run dev
   ```
4. Para probar la función de PDF localmente, se requiere instalar Netlify CLI de forma global (`npm install -g netlify-cli`) y ejecutar:
   ```bash
   netlify dev
   ```

## Documentación

El repositorio contiene documentación técnica y operativa detallada en el directorio `/docs`:

*   [Documentación Técnica](docs/TECHNICAL_DOCUMENTATION.md)
*   [Manual de Desarrollo](docs/DEVELOPMENT_MANUAL.md)
*   [Manual de Usuario](docs/USER_MANUAL.md)
*   [Backlog y Roadmap](docs/BACKLOG.md)

## Licencia

Este proyecto está bajo la Licencia MIT.
