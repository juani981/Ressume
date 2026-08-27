# Currículum Vitae (Web & PDF ATS-Friendly)

Este proyecto es un Currículum Vitae (CV) interactivo, diseñado con HTML, CSS y JavaScript para una visualización responsiva en múltiples dispositivos. Además, cuenta con un potente script backend en Node.js que utiliza Puppeteer (Chromium Headless) para exportar el currículum a un formato PDF vectorial, seleccionable y 100% amigable con sistemas ATS (Applicant Tracking Systems).

## 🚀 Características Principales

*   **Diseño Web Responsivo:** Adaptable a dispositivos móviles, tablets y escritorio.
*   **Modo Oscuro/Claro:** Botón integrado en la interfaz para cambiar el tema.
*   **Exportación a PDF Perfecta:** El script de Puppeteer emula la vista de pantalla completa y conserva todos los estilos, colores y tipografías.
*   **ATS-Friendly:** El texto del PDF resultante no es una imagen rasterizada; es texto vectorial puro y seleccionable, lo que garantiza que los bots de recursos humanos puedan leer tu perfil sin errores.
*   **Multilenguaje:** Contiene la versión principal en español (`index.html`) y una copia de seguridad en inglés (`index.eng.html`).

## 🛠️ Tecnologías Utilizadas

*   **Frontend:** HTML5 Semántico, CSS3 (Variables, Grid, Flexbox), JavaScript (Vanilla).
*   **Iconos:** Boxicons.
*   **Backend (Generación de PDF):** Node.js y Puppeteer.

---

## 📖 Documentación de Uso

### 1. Requisitos Previos
Para poder generar el PDF y gestionar las dependencias, necesitas tener instalado:
*   [Node.js](https://nodejs.org/) (incluye npm)

### 2. Instalación
Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
npm install
```
Esto instalará `puppeteer` y cualquier otra dependencia necesaria para el motor de renderizado.

### 3. Edición del Currículum
Toda la información visual de tu CV reside en el archivo principal:
*   **`index.html`**: Archivo principal (actualmente en Español).
*   **`index.eng.html`**: Copia de seguridad con la versión en Inglés.

Para modificar tu información (experiencia, educación, etc.), abre el archivo HTML en tu editor de código favorito y modifica el texto. **Nota:** Asegúrate de mantener la estructura semántica de las etiquetas (`<h3>`, `<p>`, `<span>`) para no romper la lectura de los sistemas ATS.

Los estilos de diseño y colores se encuentran en `assets/css/styles.css`.

### 4. Generación del PDF
Una vez que hayas modificado el `index.html` a tu gusto, puedes generar la versión PDF actualizada. En la terminal, ejecuta:

```bash
npm run build:pdf
```
*(Alternativamente: `npm run generate-pdf`)*

**¿Qué hace este script?**
1. Lanza una instancia oculta del navegador Chromium.
2. Carga tu archivo `index.html` local.
3. Espera a que carguen todas las tipografías web.
4. Oculta la interfaz de usuario (botones flotantes, barra lateral).
5. Calcula las dimensiones exactas de tu CV y exporta un documento sin márgenes de paginación llamado **`CV-Carrizo,JuanIgnacio.pdf`** en la carpeta `assets/pdf/`.

### 5. Previsualización Web
Para ver cómo luce tu sitio web mientras lo editas, puedes abrir `index.html` directamente en tu navegador web. Para una mejor experiencia de desarrollo (auto-recarga al guardar), te sugerimos usar la extensión **Live Server** en VSCode.

---

## 📝 Notas sobre los Sistemas ATS
Al postularte a empleos, asegúrate de enviar el PDF generado por el script. No imprimas el sitio web desde el navegador usando `Ctrl + P`, ya que los navegadores alteran los fondos y fragmentan el diseño en hojas A4, lo que puede causar pérdida de información y romper el seguimiento ATS. El script incluido previene esto automáticamente.
