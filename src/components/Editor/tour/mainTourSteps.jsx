import React from 'react';
import { createTourStep } from './tourUtils';

/**
 * Natural, user-focused Joyride tour steps for the main CV canvas.
 * Designed for real human comprehension, zero marketing fluff, and progressive discovery.
 */

export const WELCOME_STEP = {
   target: "body",
   placement: "center",
   disableBeacon: true,
   disableOverlayClose: true,
   overlayClickAction: false,
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
                  borderRadius: "8px",
                  border: "1px solid #bbf7d0",
               }}>
               {/* <strong
                  style={{
                     color: "#166534",
                     display: "block",
                     marginBottom: "4px",
                  }}>
                  ¿Por qué NO integra IA directa en la nube?
               </strong> */}
               <ul
                  style={{
                     margin: 0,
                     paddingLeft: "18px",
                     display: "flex",
                     flexDirection: "column",
                     gap: "5px",
                  }}>
                  {/* <li>
                     <strong>Sin costos ni suscripciones:</strong> No dependes
                     de pagos mensuales, cuotas de tokens ni APIs externas
                     caídas.
                  </li> */}
                  <li>
                     En vez de dejar que un bot invente o alucine sobre tu
                     experiencia y arme un archivo fijo, elige desde una
                     colección verificada{" "}
                     <em>
                        prompts de auditoría, posicionamiento laboral, y
                        crecimiento profesional
                     </em>{" "}
                     para que refines tu CV con ayuda de ChatGPT, Gemini, Claude
                     (o el que elijas) con total control. Se aconseja utilizar
                     diversos modelos de IA para ampliar el alcance de la
                     devolución.
                  </li>
                  <strong
                     style={{
                        color: "#166534",
                        display: "block",
                        marginBottom: "4px",
                     }}>
                     La responsabilidad de revisar y constatar que los
                     resultados no sean sesgados o erróneos recae en criterio
                     del usuario.
                  </strong>
               </ul>
            </div>

            <p
               style={{
                  margin: "2px 0 0 0",
                  color: "#475569",
                  fontSize: "0.85rem",
               }}>
               A continuación, te guiaremos paso a paso por las herramientas del
               editor para que aprendas a editar, organizar componentes,
               aprovechar los consejos de redacción y generar un CV lo más
               rápido posible.
            </p>
         </div>
      </div>
   ),
};

export const CANVAS_STEPS = [
   WELCOME_STEP,
   createTourStep({
      target: ".editable-section-container",
      title: "Edición directa sobre la hoja",
      description: (
         <p style={{ margin: 0 }}>
            Haz clic sobre cualquier texto de la hoja (tu nombre, cargos,
            empresas o descripciones) para empezar a modificar. Puedes usar
            atajos de teclado como <strong>Ctrl+Z/Ctrl+Y</strong> para
            deshacer/rehacer, <strong>Ctrl+B</strong> para texto en negrita y{" "}
            <strong>Ctrl+I</strong> para cursiva.
         </p>
      ),
      placement: "bottom",
   }),

   createTourStep({
      target: '[data-section-id="about_section"]',
      title: "Cada sección es un bloque",
      description: (
         <p style={{ margin: 0 }}>
            Tu currículum se compone de bloques (Experiencia, Educación,
            Habilidades, etc.). Pasa el cursor sobre cualquier bloque, mantén
            pulsado para arrastrar y reordenar.
         </p>
      ),
      placement: "bottom",
   }),
   createTourStep({
      target: '[data-section-id="experience"] .section-action-buttons',
      title: "Acciones de bloque",
      description: (
         <p style={{ margin: 0 }}>
            En la esquina superior de cada sección puedes: elegir el formato
            visual de la lista (si aplica), y eliminar elemento.
         </p>
      ),
      placement: "left",
   }),
   createTourStep({
      target: '[data-section-id="experience"] .add-bullet-btn',
      title: "Agregar viñetas y logros con métricas",
      description: (
         <p style={{ margin: 0 }}>
            Haz clic aquí para sumar viñetas a tus puestos o proyectos. Te
            recomendamos redactar cada logro con su impacto:{" "}
            <em>Verbo de acción + Contexto técnico + Métrica medible</em> (por
            ejemplo:{" "}
            <em>
               "Optimicé el tiempo de carga un 35% migrando microservicios a Go"
            </em>
            ).
         </p>
      ),
      placement: "right",
   }),
   createTourStep({
      target: ".add-section-btn",
      title: "Añadir más secciones",
      description: (
         <p style={{ margin: 0 }}>
            Al pie de página tienes este botón para abrir el catálogo de
            componentes. Puedes agregar las secciones que mejor se adapten a tu
            perfil.
         </p>
      ),
      placement: "top",
   }),
   createTourStep({
      target: '[data-testid="master-tips-toggle"]',
      title: "Consejos basados en criterios de reclutadores",
      description: (
         <p style={{ margin: 0 }}>
            Señalan oportunidades de mejora y errores comunes con ejemplos.
            Puedes mostrar/ocultar los consejos cuando quieras usando éste botón
         </p>
      ),
      placement: "bottom",
   }),
];

export const SIDEBAR_TRANSITION_STEP = createTourStep({
   target: '[data-testid="action-menu-navbar"]',
   title: "Barra de herramientas",
   description: (
      <p style={{ margin: 0 }}>
         Acerca el cursor o haz clic sobre esta pestaña para desplegar el panel
         de utilidades cuando lo necesites: podrás deshacer/rehacer, ajustar
         tipografías, diseño, gestionar versiones de tu CV, copiar prompts
         útiles para usar con IA y descargar tu CV en formato PDF.
      </p>
   ),
   placement: "right",
});

export const MAIN_SCREEN_STEPS = [...CANVAS_STEPS, SIDEBAR_TRANSITION_STEP];
