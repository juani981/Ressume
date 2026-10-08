/**
 * Natural, user-focused Joyride tour steps.
 * Designed for real human comprehension, zero marketing fluff, and progressive discovery.
 */

export const MAIN_SCREEN_STEPS = [
   {
      target: "body",
      placement: "center",
      disableBeacon: true,
      isWelcome: true,
      maxWidth: 520,
      content: (
         <div style={{ textAlign: "left" }}>
            <div
               style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "14px",
               }}>
               <div
                  style={{
                     width: "38px",
                     height: "38px",
                     borderRadius: "10px",
                     background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                     display: "flex",
                     alignItems: "center",
                     justifyContent: "center",
                     color: "#fff",
                     fontSize: "1.3rem",
                     fontWeight: 800,
                     boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
                  }}>
                  R
               </div>
               <div>
                  <h3
                     style={{
                        margin: 0,
                        fontSize: "1.2rem",
                        fontWeight: 700,
                        color: "#0f172a",
                     }}>
                     ¡Bienvenido!
                  </h3>
               </div>
            </div>

            <div
               style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  fontSize: "0.875rem",
                  lineHeight: 1.5,
                  color: "#334155",
               }}>
               <div
                  style={{
                     background: "#f8fafc",
                     padding: "10px 14px",
                     borderRadius: "8px",
                     border: "1px solid #e2e8f0",
                  }}>
                  Easy CV Editor te permite redactar el contenido de tu CV
                  directamente sobre una plantilla diseñada específicamente para
                  resistir filtros ATS. Sólo cambia los datos en base a la
                  plantilla, añade o reordena los bloques, y genera tu PDF.
               </div>

               <div
                  style={{
                     background: "#f0fdf4",
                     padding: "10px 14px",
                     borderRadius: "8px",
                     border: "1px solid #bbf7d0",
                  }}>
                  <strong
                     style={{
                        color: "#166534",
                        display: "block",
                        marginBottom: "4px",
                     }}>
                     ¿Por qué NO integra IA directa en la nube?
                  </strong>
                  <ul
                     style={{
                        margin: 0,
                        paddingLeft: "18px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "5px",
                     }}>
                     <li>
                        <strong>Sin costos ni suscripciones:</strong> No
                        dependes de pagos mensuales, cuotas de tokens ni APIs
                        externas caídas.
                     </li>
                     <li>
                        En vez de dejar que un bot invente o alucine sobre tu
                        experiencia y arme un archivo fijo, elige desde una
                        colección verificada{" "}
                        <em>
                           prompts de auditoría, posicionamiento laboral, y
                           crecimiento profesional
                        </em>{" "}
                        para que refines tu CV con ayuda de ChatGPT, Gemini,
                        Claude (o el que elijas) con total control.
                     </li>
                     <strong
                        style={{
                           color: "#166534",
                           display: "block",
                           marginBottom: "4px",
                        }}>
                        Se aconseja utilizar diversos modelos de IA para ampliar
                        el alcance de la devolución. La responsabilidad de
                        revisar y constatar que los resultados no sean sesgados
                        o erróneos recae en criterio del usuario.
                     </strong>
                  </ul>
               </div>

               <p
                  style={{
                     margin: "2px 0 0 0",
                     color: "#475569",
                     fontSize: "0.85rem",
                  }}>
                  A continuación, te guiaremos paso a paso por las herramientas
                  del editor para que aprendas a editar, organizar componentes,
                  aprovechar los consejos de redacción y generar un CV lo más
                  rápido posible.
               </p>
            </div>
         </div>
      ),
   },
   {
      target: ".editable-section-container",
      content: (
         <div>
            <h4
               style={{
                  margin: "0 0 6px 0",
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#0f172a",
               }}>
               1. Edición directa sobre la hoja
            </h4>
            <p
               style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  lineHeight: 1.45,
                  color: "#475569",
               }}>
               Haz clic sobre cualquier texto de la hoja (tu nombre, cargos,
               empresas o descripciones) para empezar a modificar. Puedes usar
               atajos de teclado como <strong>Ctrl+Z/Ctrl+Y</strong> para
               deshacer/rehacer
               <strong>Ctrl+B</strong> para negrita y <strong>Ctrl+I</strong>{" "}
               para cursiva.
            </p>
         </div>
      ),
      placement: "bottom",
      disableBeacon: true,
   },
   {
      target: ".cv-section",
      content: (
         <div>
            <h4
               style={{
                  margin: "0 0 6px 0",
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#0f172a",
               }}>
               Cada sección es un bloque
            </h4>
            <p
               style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  lineHeight: 1.45,
                  color: "#475569",
               }}>
               Tu currículum se compone de bloques (Experiencia, Educación,
               Habilidades, etc.). Pasa el cursor sobre cualquier bloque, mantén
               pulsado para arrastrar y reordenar.
            </p>
         </div>
      ),
      placement: "bottom",
      disableBeacon: true,
   },
   {
      target: ".section-action-buttons",
      content: (
         <div>
            <h4
               style={{
                  margin: "0 0 6px 0",
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#0f172a",
               }}>
               Acciones de bloque
            </h4>
            <p
               style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  lineHeight: 1.45,
                  color: "#475569",
               }}>
               En la esquina superior de cada sección puedes: mostrar/ocultar
               consejos de redacción específicos para cada componente, elegir el
               formato visual de la lista (si aplica), y eliminar elemento.
            </p>
         </div>
      ),
      placement: "left",
      disableBeacon: true,
   },
   {
      target: ".add-bullet-btn",
      content: (
         <div>
            <h4
               style={{
                  margin: "0 0 6px 0",
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#0f172a",
               }}>
               Agregar viñetas y logros con métricas
            </h4>
            <p
               style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  lineHeight: 1.45,
                  color: "#475569",
               }}>
               Haz clic aquí para sumar viñetas a tus puestos o proyectos. Te
               recomendamos redactar cada logro con su impacto:{" "}
               <em>Verbo de acción + Contexto técnico + Métrica medible</em>{" "}
               (por ejemplo:{" "}
               <em>
                  "Optimicé el tiempo de carga un 35% migrando microservicios a
                  Go"
               </em>
               ).
            </p>
         </div>
      ),
      placement: "top",
      disableBeacon: true,
   },
   {
      target: ".add-section-btn",
      content: (
         <div>
            <h4
               style={{
                  margin: "0 0 6px 0",
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#0f172a",
               }}>
               Añadir secciones
            </h4>
            <p
               style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  lineHeight: 1.45,
                  color: "#475569",
               }}>
               Al pie de tienes este botón para abrir el catálogo de
               componentes. Puedes agregar las secciones que mejor se adapten a
               tu perfil.
            </p>
         </div>
      ),
      placement: "top",
      disableBeacon: true,
   },
   {
      target: '[data-testid="master-tips-toggle"]',
      content: (
         <div>
            <h4
               style={{
                  margin: "0 0 6px 0",
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#0f172a",
               }}>
               Consejos basados en feedback de reclutadores
            </h4>
            <p
               style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  lineHeight: 1.45,
                  color: "#475569",
               }}>
               Son recomendaciones basadas en buenas prácticas del mercado tech.
               Te señalan oportunidades de mejora y errores comunes con
               ejemplos. Puedes mostrar/ocultar los consejos cuando quieras
               usando éste botón
            </p>
         </div>
      ),
      placement: "bottom",
      disableBeacon: true,
   },
   {
      target: ".action-menu-edge-handle",
      content: (
         <div>
            <h4
               style={{
                  margin: "0 0 6px 0",
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#0f172a",
               }}>
               Barra de herramientas
            </h4>
            <p
               style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  lineHeight: 1.45,
                  color: "#475569",
               }}>
               Acerca el cursor o haz clic sobre esta pestaña para desplegar el
               panel de utilidades cuando lo necesites: podrás ajustar
               tipografías y diseño, gestionar vesriones de tu CV, copiar
               prompts útiles para usar con IA y descargar tu CV en formato PDF.
            </p>
         </div>
      ),
      placement: "right",
      disableBeacon: true,
   },
];

export const SIDEBAR_STEPS = [
   {
      target: '[data-testid="action-menu-navbar"] .action-menu-btn',
      content: (
         <div>
            <h4
               style={{
                  margin: "0 0 6px 0",
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#0f172a",
               }}>
               Deshacer y Rehacer
            </h4>
            <p
               style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  lineHeight: 1.45,
                  color: "#475569",
               }}>
               Revierte cualquier cambio de texto, movimiento o diseño con{" "}
               <strong>Ctrl+Z</strong> y reházlo con <strong>Ctrl+Y</strong>.
            </p>
         </div>
      ),
      placement: "right",
      disableBeacon: true,
   },
   {
      target: "#versiones-item",
      content: (
         <div>
            <h4
               style={{
                  margin: "0 0 6px 0",
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#0f172a",
               }}>
               Gestor de Versiones
            </h4>
            <p
               style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  lineHeight: 1.45,
                  color: "#475569",
               }}>
               Adapta tu currículum para distintas búsquedas (por ejemplo:
               versión Frontend, versión Fullstack, versión en inglés) y úsalas
               cuando quieras.
            </p>
         </div>
      ),
      placement: "right",
      disableBeacon: true,
   },
   {
      target: "#design-item",
      content: (
         <div>
            <h4
               style={{
                  margin: "0 0 6px 0",
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#0f172a",
               }}>
               Ajustes de Diseño
            </h4>
            <p
               style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  lineHeight: 1.45,
                  color: "#475569",
               }}>
               Personaliza las tipografías, el tamaño y el espaciado entre
               secciones.
            </p>
         </div>
      ),
      placement: "right",
      disableBeacon: true,
   },
   {
      target: '[data-testid="action-menu-ai-group"]',
      content: (
         <div>
            <h4
               style={{
                  margin: "0 0 6px 0",
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#0f172a",
               }}>
               Biblioteca de Prompts
            </h4>
            <p
               style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  lineHeight: 1.45,
                  color: "#475569",
               }}>
               Elige de una biblioteca de prompts estructurados para que
               cualquier modelo de IA audite tu CV como un reclutador tech,
               traduzca tu perfil, analicen compatibilidad con una oferta, entre
               otros.
            </p>
         </div>
      ),
      placement: "right",
      disableBeacon: true,
   },
   {
      target: '[data-testid="btn-action-native-print"]',
      content: (
         <div>
            <h4
               style={{
                  margin: "0 0 6px 0",
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#0f172a",
               }}>
               Descargar / Imprimir PDF
            </h4>
            <p
               style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  lineHeight: 1.45,
                  color: "#475569",
               }}>
               Genera tu CV en formato PDF, tamaño estándar A4.
            </p>
         </div>
      ),
      placement: "right",
      disableBeacon: true,
   },
   {
      target: '[data-testid="btn-pin-action-menu"]',
      content: (
         <div>
            <h4
               style={{
                  margin: "0 0 6px 0",
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#0f172a",
               }}>
               Fijar barra abierta
            </h4>
            <p
               style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  lineHeight: 1.45,
                  color: "#475569",
               }}>
               Haz clic aquí si prefieres dejar la barra lateral siempre
               visible, o desánclala para que se oculte automáticamente.
            </p>
         </div>
      ),
      placement: "right",
      disableBeacon: true,
   },
];

export const ADD_SECTION_MODAL_STEPS = [
   {
      target: '[data-testid="add-section-modal"]',
      placement: "left",
      disableBeacon: true,
      content: (
         <div>
            <h4
               style={{
                  margin: "0 0 6px 0",
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#0f172a",
               }}>
               Catálogo de Componentes
            </h4>
            <p
               style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  lineHeight: 1.45,
                  color: "#475569",
               }}>
               Selecciona el estilo inicial de las viñetas en la parte superior
               y luego haz clic en cualquier sección (Proyectos,
               Certificaciones, Idiomas, etc.) para insertarla en la columna
               elegida.
            </p>
         </div>
      ),
   },
];
