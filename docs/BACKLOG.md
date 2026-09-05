# Backlog y Roadmap del Proyecto

Este documento consolida las características, deudas técnicas y mejoras planificadas para las futuras iteraciones de la arquitectura de Live Editor CV.

## Prioridad Alta (Próximo Sprint)

*   [ ] **Inyección Dinámica de Secciones desde UI:** Actualmente la modificación y reordenamiento de las secciones existentes funciona correctamente a través de `@dnd-kit`. Se requiere implementar un botón flotante "Añadir Nueva Sección" que permita inyectar un nuevo objeto al array `sections` en el estado global.
*   [ ] **Inyección Dinámica de Ítems (Viñetas):** Proporcionar la capacidad de que el usuario haga clic en un icono `+` dentro de una tarjeta de experiencia para agregar un nuevo "bullet point" en el estado global.
*   [ ] **Importador JSON UI:** Aunque el sistema soporta la lectura del almacenamiento local y la exportación JSON, falta vincular la acción de un `<input type="file" accept=".json">` en el Menú de Acciones que parsee el archivo y lo cargue en el `CVContext`, permitiendo restaurar respaldos previos.

## Prioridad Media

*   [ ] **Soporte para Rich Text:** Transicionar el componente `<InlineEdit />` básico (que actualmente usa `input`/`textarea` simple) hacia una implementación controlada utilizando librerías como TipTap o Slate.js, permitiendo texto en negrita, cursiva, y enlaces dinámicos en las descripciones.
*   [ ] **Selección de Plantillas Base:** Implementar diferentes hojas de estilos CSS intercambiables (ej. "Minimal", "Ejecutivo", "Creativo") que actúen sobre las mismas clases BEM existentes, permitiendo modificar el diseño visual sin alterar el esquema JSON.
*   [ ] **Motor de i18n Nativo:** Integrar una lógica para mantener versiones en múltiples idiomas (ej. `es`, `en`) del mismo currículum, y añadir un conmutador en la interfaz para alternar entre el contexto de renderizado de la estructura JSON.

## Prioridad Baja (Deuda Técnica y Refactorización)

*   [ ] **Validación de Esquema Robusta:** Integrar Zod o Yup en la capa de Contexto. Cuando un JSON es cargado (vía Importador), debe pasar por validación estricta antes de actualizar el estado de React para evitar corrupciones de renderizado si el archivo carece de estructuras requeridas.
*   [ ] **Tests End-to-End:** Redactar tests de Cypress o Playwright que naveguen a la URL local, simulen el reordenamiento de un bloque vía DnD, editen un título, y afirmen que la mutación persiste tras recargar el navegador.
*   [ ] **Módulo de Autenticación Opcional:** Desacoplar el requerimiento estricto del almacenamiento local permitiendo que los usuarios autorizados (vía Supabase o Firebase Auth) guarden su estado en la nube de forma persistente a través de distintos dispositivos.
