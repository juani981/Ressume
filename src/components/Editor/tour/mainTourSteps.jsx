import React from 'react';
import { createTourStep } from './tourUtils';

/**
 * Natural, user-focused Joyride tour steps for the main CV canvas.
 * Designed for real human comprehension, zero marketing fluff, and progressive discovery.
 */

export const WELCOME_STEP = {
  target: 'body',
  placement: 'center',
  disableBeacon: true,
  isWelcome: true,
  maxWidth: 520,
  content: (
    <div style={{ textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '1.3rem',
            fontWeight: 800,
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
          }}
        >
          R
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
            ¡Bienvenido a Ressume!
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
            Editor de Currículums A4 de Alta Precisión y Compatibilidad ATS
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          fontSize: '0.875rem',
          lineHeight: 1.5,
          color: '#334155',
        }}
      >
        <div
          style={{
            background: '#f8fafc',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
          }}
        >
          <strong style={{ color: '#0f172a', display: 'block', marginBottom: '3px' }}>
            📄 ¿Qué hace el sistema?
          </strong>
          Ressume te permite redactar y maquetar tu CV directamente sobre hojas A4 físicas fijas.
          Lo que ves en tu pantalla es exactamente lo que se imprimirá en el PDF (WYSIWYG estricto),
          sin saltos de página partidos, viñetas huérfanas ni desbordes inesperados.
        </div>

        <div
          style={{
            background: '#f0fdf4',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #bbf7d0',
          }}
        >
          <strong style={{ color: '#166534', display: 'block', marginBottom: '4px' }}>
            🛡️ ¿Por qué NO integra IA directa en la nube?
          </strong>
          <ul
            style={{
              margin: 0,
              paddingLeft: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
            }}
          >
            <li>
              <strong>Privacidad total (Local-First):</strong> Tu trayectoria profesional, notas y
              datos de contacto residen exclusivamente en tu navegador. Nada se envía a servidores
              de terceros ni entrena modelos ajenos.
            </li>
            <li>
              <strong>Sin costos ni suscripciones:</strong> No dependes de pagos mensuales, cuotas
              de tokens ni APIs externas caídas.
            </li>
            <li>
              <strong>El profesional lidera:</strong> En vez de dejar que un bot invente o alucine
              sobre tu experiencia, Ressume genera <em>prompts de auditoría técnica</em> y
              exportaciones limpias (Markdown y XML) para que audites tu CV en ChatGPT o Claude con
              total control.
            </li>
          </ul>
        </div>

        <p style={{ margin: '2px 0 0 0', color: '#475569', fontSize: '0.85rem' }}>
          A continuación, te guiaremos paso a paso por las herramientas clave del editor para que
          aprendas a editar textos, organizar componentes, aprovechar los consejos de redacción y
          conocer las funciones de la barra lateral.
        </p>
      </div>
    </div>
  ),
};

export const CANVAS_STEPS = [
  WELCOME_STEP,
  createTourStep({
    target: '.editable-section-container',
    title: '1. Edición directa sobre la hoja',
    description: (
      <p style={{ margin: 0 }}>
        Haz clic sobre cualquier texto de la hoja (tu nombre, cargos, empresas o descripciones) para
        escribirlo o modificarlo en el acto. Puedes usar atajos rápidos como <strong>Ctrl+B</strong>{' '}
        para negrita y <strong>Ctrl+I</strong> para cursiva para resaltar logros clave.
      </p>
    ),
    placement: 'bottom',
  }),
  createTourStep({
    target: '.cv-section',
    title: '2. ¿Qué son los componentes?',
    description: (
      <p style={{ margin: 0 }}>
        Tu currículum se compone de bloques modulares (Experiencia, Educación, Habilidades, etc.).
        Están estructurados para que los reclutadores y los filtros ATS encuentren tus datos al
        instante. Pasa el cursor sobre cualquier bloque para ver la manija lateral izquierda y
        arrastrarlo entre columnas o reordenarlo.
      </p>
    ),
    placement: 'bottom',
  }),
  createTourStep({
    target: '.section-action-buttons',
    title: '3. Controles del bloque',
    description: (
      <p style={{ margin: 0 }}>
        En la esquina superior de cada sección tienes tres controles clave: la{' '}
        <strong>bombilla</strong> para consultar consejos de redacción específicos de ese
        componente, el icono de <strong>viñetas</strong> para elegir el formato visual de la lista,
        y la <strong>papelera</strong> para eliminar la sección si no la necesitas.
      </p>
    ),
    placement: 'left',
  }),
  createTourStep({
    target: '.add-bullet-btn',
    title: '4. Agregar viñetas y logros con métricas',
    description: (
      <p style={{ margin: 0 }}>
        Haz clic aquí para sumar viñetas a tus puestos o proyectos. Te recomendamos redactar cada
        logro con impacto:{' '}
        <em>Verbo de acción + Contexto técnico + Métrica medible</em> (por ejemplo:{' '}
        <em>"Optimicé el tiempo de carga un 35% migrando microservicios a Go"</em>).
      </p>
    ),
    placement: 'top',
  }),
  createTourStep({
    target: '.add-section-btn',
    title: '5. Sumar nuevas secciones',
    description: (
      <p style={{ margin: 0 }}>
        Al pie de cada columna tienes este botón para abrir el catálogo de componentes. Puedes
        agregar secciones de Proyectos, Certificaciones, Idiomas o bloques personalizados donde mejor
        se adapten a tu perfil.
      </p>
    ),
    placement: 'top',
  }),
  createTourStep({
    target: '[data-testid="master-tips-toggle"]',
    title: '6. Consejos inteligentes de reclutadores',
    description: (
      <p style={{ margin: 0 }}>
        ¿Qué son los consejos? Son recomendaciones basadas en buenas prácticas del mercado tech.
        Este interruptor activa o desactiva las tarjetas de sugerencias laterales. Te señalan
        oportunidades de mejora y errores comunes. Puedes cerrar cada tarjeta con su cruz o presionar{' '}
        <strong>Aplicar</strong> para incorporar la redacción sugerida directamente a tu CV.
      </p>
    ),
    placement: 'bottom',
  }),
  createTourStep({
    target: '.layout-mode-toggle-pill',
    title: '7. Modos de diseño',
    description: (
      <p style={{ margin: 0 }}>
        Alterna entre <strong>Diseño Tradicional</strong> (2 columnas con barra lateral
        personalizable, ideal para networking y entrevistas) y <strong>Optimizado ATS</strong> (1
        columna lineal estricta, el estándar que leen sin errores los portales de empleo
        corporativos).
      </p>
    ),
    placement: 'bottom',
  }),
];

export const SIDEBAR_TRANSITION_STEP = createTourStep({
  target: '[data-testid="action-menu-navbar"]',
  title: '8. Barra lateral de herramientas',
  description: (
    <p style={{ margin: 0 }}>
      A continuación, abriremos automáticamente la barra de utilidades para mostrarte paso a paso
      los consejos y funciones de cada botón: historial de cambios, versiones, diseño, prompts con
      IA y exportación en PDF.
    </p>
  ),
  placement: 'right',
});

export const MAIN_SCREEN_STEPS = [...CANVAS_STEPS, SIDEBAR_TRANSITION_STEP];
