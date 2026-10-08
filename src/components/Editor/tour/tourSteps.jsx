import React from 'react';

/**
 * Natural, user-focused Joyride tour steps.
 * Designed for real human comprehension, zero marketing fluff, and progressive discovery.
 */

export const MAIN_SCREEN_STEPS = [
  {
    target: 'body',
    placement: 'center',
    disableBeacon: true,
    isWelcome: true,
    maxWidth: 520,
    content: (
      <div style={{ textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div style={{ 
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
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
          }}>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem', lineHeight: 1.5, color: '#334155' }}>
          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#0f172a', display: 'block', marginBottom: '3px' }}>
              📄 ¿Qué hace el sistema?
            </strong>
            Ressume te permite redactar y maquetar tu CV directamente sobre hojas A4 físicas fijas. Lo que ves en tu pantalla es exactamente lo que se imprimirá en el PDF (WYSIWYG estricto), sin saltos de página partidos, viñetas huérfanas ni desbordes inesperados.
          </div>

          <div style={{ background: '#f0fdf4', padding: '10px 14px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <strong style={{ color: '#166534', display: 'block', marginBottom: '4px' }}>
              🛡️ ¿Por qué NO integra IA directa en la nube?
            </strong>
            <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <li>
                <strong>Privacidad total (Local-First):</strong> Tu trayectoria profesional, notas y datos de contacto residen exclusivamente en tu navegador. Nada se envía a servidores de terceros ni entrena modelos ajenos.
              </li>
              <li>
                <strong>Sin costos ni suscripciones:</strong> No dependes de pagos mensuales, cuotas de tokens ni APIs externas caídas.
              </li>
              <li>
                <strong>El profesional lidera:</strong> En vez de dejar que un bot invente o alucine sobre tu experiencia, Ressume genera <em>prompts de auditoría técnica</em> y exportaciones limpias (Markdown y XML) para que audites tu CV en ChatGPT o Claude con total control.
              </li>
            </ul>
          </div>

          <p style={{ margin: '2px 0 0 0', color: '#475569', fontSize: '0.85rem' }}>
            A continuación, te guiaremos paso a paso por las herramientas clave del editor para que aprendas a editar textos, organizar componentes, aprovechar los consejos de redacción y exportar un CV perfecto.
          </p>
        </div>
      </div>
    ),
  },
  {
    target: '.editable-section-container',
    content: (
      <div>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
          1. Edición directa sobre la hoja
        </h4>
        <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.45, color: '#475569' }}>
          Haz clic sobre cualquier texto de la hoja (tu nombre, cargos, empresas o descripciones) para escribirlo o modificarlo en el acto. Puedes usar atajos rápidos como <strong>Ctrl+B</strong> para negrita y <strong>Ctrl+I</strong> para cursiva para resaltar logros clave.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.cv-section',
    content: (
      <div>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
          2. ¿Qué son los componentes?
        </h4>
        <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.45, color: '#475569' }}>
          Tu currículum se compone de bloques modulares (Experiencia, Educación, Habilidades, etc.). Están estructurados para que los reclutadores y los filtros ATS encuentren tus datos al instante. Pasa el cursor sobre cualquier bloque para ver la manija lateral izquierda y arrastrarlo entre columnas o reordenarlo.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.section-action-buttons',
    content: (
      <div>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
          3. Controles del bloque
        </h4>
        <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.45, color: '#475569' }}>
          En la esquina superior de cada sección tienes tres controles clave: la <strong>bombilla</strong> para consultar consejos de redacción específicos de ese componente, el icono de <strong>viñetas</strong> para elegir el formato visual de la lista, y la <strong>papelera</strong> para eliminar la sección si no la necesitas.
        </p>
      </div>
    ),
    placement: 'left',
    disableBeacon: true,
  },
  {
    target: '.add-bullet-btn',
    content: (
      <div>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
          4. Agregar viñetas y logros con métricas
        </h4>
        <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.45, color: '#475569' }}>
          Haz clic aquí para sumar viñetas a tus puestos o proyectos. Te recomendamos redactar cada logro con impacto: <em>Verbo de acción + Contexto técnico + Métrica medible</em> (por ejemplo: <em>"Optimicé el tiempo de carga un 35% migrando microservicios a Go"</em>).
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.add-section-btn',
    content: (
      <div>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
          5. Sumar nuevas secciones
        </h4>
        <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.45, color: '#475569' }}>
          Al pie de cada columna tienes este botón para abrir el catálogo de componentes. Puedes agregar secciones de Proyectos, Certificaciones, Idiomas o bloques personalizados donde mejor se adapten a tu perfil.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-testid="master-tips-toggle"]',
    content: (
      <div>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
          6. Consejos inteligentes de reclutadores
        </h4>
        <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.45, color: '#475569' }}>
          ¿Qué son los consejos? Son recomendaciones basadas en buenas prácticas del mercado tech. Este interruptor activa o desactiva las tarjetas de sugerencias laterales. Te señalan oportunidades de mejora y errores comunes. Puedes cerrar cada tarjeta con su cruz o presionar <strong>Aplicar</strong> para incorporar la redacción sugerida directamente a tu CV.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.layout-mode-toggle-pill',
    content: (
      <div>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
          7. Modos de diseño
        </h4>
        <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.45, color: '#475569' }}>
          Alterna entre <strong>Diseño Tradicional</strong> (2 columnas con barra lateral personalizable, ideal para networking y entrevistas) y <strong>Optimizado ATS</strong> (1 columna lineal estricta, el estándar que leen sin errores los portales de empleo corporativos).
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.action-menu-edge-handle',
    content: (
      <div>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
          8. Barra lateral de herramientas
        </h4>
        <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.45, color: '#475569' }}>
          Acerca el cursor o haz clic sobre esta pestaña para desplegar el panel de utilidades cuando lo necesites: podrás ajustar tipografías y colores, crear copias de tu CV, descargar tu PDF vectorial y copiar prompts para auditar con IA.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
];

export const SIDEBAR_STEPS = [
  {
    target: '[data-testid="action-menu-navbar"] .action-menu-btn',
    content: (
      <div>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
          Deshacer y Rehacer
        </h4>
        <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.45, color: '#475569' }}>
          Revierte cualquier cambio de texto, movimiento o diseño con <strong>Ctrl+Z</strong> y reházlo con <strong>Ctrl+Y</strong>.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '#versiones-item',
    content: (
      <div>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
          Gestor de Versiones
        </h4>
        <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.45, color: '#475569' }}>
          Crea copias de tu currículum para distintas búsquedas (por ejemplo: versión Frontend, versión Fullstack o CV en inglés) sin sobrescribir tu trabajo principal.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '#design-item',
    content: (
      <div>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
          Ajustes de Diseño
        </h4>
        <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.45, color: '#475569' }}>
          Personaliza las tipografías, el espaciado entre secciones y los colores de fondo de las columnas con previsualización en vivo.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-testid="action-menu-ai-group"]',
    content: (
      <div>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
          Herramientas con IA y Prompts
        </h4>
        <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.45, color: '#475569' }}>
          Genera prompts automáticos y estructurados para que ChatGPT o Claude auditen tu CV como un reclutador tech, traduzcan tu perfil a inglés técnico o analicen compatibilidad con una oferta laboral.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-testid="btn-action-native-print"]',
    content: (
      <div>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
          Descargar / Imprimir PDF
        </h4>
        <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.45, color: '#475569' }}>
          Genera una copia limpia en PDF vectorial estándar A4, garantizando que el diseño que ves en pantalla sea exactamente el que se imprime.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-testid="btn-pin-action-menu"]',
    content: (
      <div>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
          Fijar barra abierta
        </h4>
        <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.45, color: '#475569' }}>
          Haz clic aquí si prefieres dejar la barra lateral siempre visible, o desánclala para que se oculte automáticamente y aproveches al máximo el ancho de tu pantalla.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
];

export const ADD_SECTION_MODAL_STEPS = [
  {
    target: '[data-testid="add-section-modal"]',
    placement: 'left',
    disableBeacon: true,
    content: (
      <div>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
          Catálogo de Componentes
        </h4>
        <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.45, color: '#475569' }}>
          Selecciona el estilo inicial de las viñetas en la parte superior y luego haz clic en cualquier sección (Proyectos, Certificaciones, Idiomas, etc.) para insertarla en la columna elegida.
        </p>
      </div>
    ),
  },
];
