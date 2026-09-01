# Manual de Usuario

Bienvenido a Live Editor CV. Este manual proporciona las instrucciones necesarias para interactuar con la interfaz visual, gestionar tu contenido y exportar tu currículum final.

## 1. Interfaz de Edición

La aplicación funciona bajo un paradigma WYSIWYG (Lo que ves es lo que obtienes). No existen paneles de configuración complejos; la edición ocurre directamente sobre la previsualización del documento.

### 1.1 Modificación de Texto
Cualquier bloque de texto visible en pantalla es editable.
1. Haz clic directamente sobre el título, subtítulo, fecha o párrafo que deseas modificar.
2. El bloque se transformará instantáneamente en un campo de texto editable.
3. Escribe tus cambios.
4. Para guardar, simplemente haz clic fuera del campo de texto o presiona la tecla `Enter` (en bloques de texto de una sola línea).

### 1.2 Reordenamiento de Secciones (Drag and Drop)
Al pasar el cursor sobre cualquier sección (ej. "Experiencia Laboral" o "Proyectos Destacados"), aparecerá un indicador sutil (ícono de arrastre) en la parte superior izquierda de la misma.
*   Mantén presionado el botón primario del ratón sobre el indicador y arrastra el bloque hacia arriba o hacia abajo.
*   Suelta el bloque cuando esté en la posición deseada. 

*Nota: Es posible arrastrar secciones enteras o elementos individuales dentro de una sección (ej. un puesto de trabajo específico).*

## 2. Gestión del Estado y Sesiones

### 2.1 Autoguardado
El editor no posee un botón explícito de "Guardar". Cada pulsación de tecla y modificación de diseño se guarda de forma persistente y automática en el almacenamiento de tu navegador web (`localStorage`). Si cierras la pestaña accidentalmente y vuelves a ingresar a la URL, tu progreso estará exactamente donde lo dejaste.

### 2.2 Menú Flotante de Acciones
En el lado izquierdo de la pantalla (o accesible mediante iconos flotantes) encontrarás el **Menú de Acciones**, el cual contiene las siguientes opciones:

*   **Exportar JSON:** Permite descargar un archivo `.json` que contiene el estado exacto de tu currículum. Utiliza esta función para respaldar versiones específicas de tu documento o migrar tu información a otro dispositivo.
*   **Modo Oscuro:** Alterna el esquema de colores de la interfaz entre modo claro y oscuro. (El modo activo será respetado al momento de generar el documento final).

## 3. Generación del Currículum (Exportación)

Para obtener el documento final listo para postular:
1. Dirígete al Menú de Acciones.
2. Haz clic en el botón **Generar PDF**.
3. El botón mostrará un indicador de carga. Detrás de escena, el servidor tomará tu diseño actual, lo procesará a través de un navegador especializado y rasterizará un documento vectorial.
4. Una vez finalizado (usualmente entre 3 y 10 segundos), la descarga de tu archivo PDF iniciará automáticamente.
