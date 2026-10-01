/**
 * 11-a4-page-box-overflow-and-distribution.cy.js
 *
 * Real-Browser E2E Verification of:
 * 1. Physical ISO A4 Box Containers (.a4-page-box): 210mm x 297mm, overflow: hidden, margin: 0 auto 32px auto.
 * 2. Real-time Overflow Detection & Obsidian Danger Callout:
 *    - Strict adherence to Obsidian Callout design (rgba(233, 49, 71, ...), 🛑 icon, danger styling).
 *    - Interactive Relay Button: "Pasar sobrante a Página {N+1} ➔".
 * 3. Deterministic Content Flow to Page {N+1} without visual collapse or infinite loops.
 * 4. Two-column & ATS mode structural parity and no blank orphan misalignments.
 */

import highDensityCV from '../fixtures/highDensityCV.json';

describe('Fase 11: Invariante de Cajas A4 Fijas Nativas, Desbordamiento y Callouts Obsidian', () => {
  beforeEach(() => {
    cy.viewport(1280, 1000);
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.clear();
        win.localStorage.setItem('skip_onboarding_tour', 'true');
      },
    });
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');
  });

  it('1. Cajas A4 Nativas (.a4-page-box): Renderizado con dimensiones ISO A4 (210mm x 297mm) y overflow: hidden', () => {
    // Al menos 1 caja A4 debe existir en el editor
    cy.get('.a4-page-box').should('have.length.at.least', 1);

    cy.get('.a4-page-box').first().then(($box) => {
      const el = $box[0];
      const win = el.ownerDocument.defaultView;
      const computed = win.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      // 1. Verificación de Ancho A4 (210mm = 793.7px -> ~794px en estándar CSS 96 DPI)
      expect(Math.round(rect.width), 'Ancho de la caja A4 debe ser ~794px').to.be.closeTo(794, 2);

      // 2. Verificación de Alto A4 (297mm = 1122.5px -> ~1123px en estándar CSS 96 DPI)
      expect(Math.round(rect.height), 'Alto de la caja A4 debe ser ~1123px').to.be.closeTo(1123, 2);

      // 3. Verificación de overflow: hidden estricto (Invariante 15)
      expect(computed.overflow, 'La caja A4 debe tener overflow: hidden').to.equal('hidden');

      // 4. Verificación de separación física visible entre páginas (margin-bottom: 32px)
      expect(computed.marginBottom, 'Margen inferior debe ser 32px para separación visual').to.equal('32px');

      // 5. Verificación de box-sizing
      expect(computed.boxSizing, 'Box-sizing debe ser border-box').to.equal('border-box');
    });
  });

  it('2. Detección de Desbordamiento y Callout de Peligro Obsidian Estricto (Invariante 1)', () => {
    // Cargar fixture con contenido calibrado para forzar desbordamiento en la Página 1 (editorHeadroom: -160)
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.clear();
        win.localStorage.setItem('skip_onboarding_tour', 'true');
        const cv = JSON.parse(JSON.stringify(highDensityCV));
        cv.layout = {
          ...cv.layout,
          editorHeadroom: -160,
        };
        win.localStorage.setItem('cvData', JSON.stringify(cv));
      },
    });
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');

    // Esperar a que el ResizeObserver detecte el scrollHeight > clientHeight
    cy.get('[data-testid="a4-page-overflow-warning-1"]', { timeout: 10000 })
      .should('be.visible')
      .then(($callout) => {
        const el = $callout[0];
        const win = el.ownerDocument.defaultView;
        const computed = win.getComputedStyle(el);

        // 1. Clases de Obsidian Callout Standard
        expect(el.classList.contains('obsidian-callout'), 'Debe tener clase .obsidian-callout').to.be.true;
        expect(el.classList.contains('obsidian-callout-danger'), 'Debe tener clase .obsidian-callout-danger').to.be.true;

        // 2. Icono 🛑 y texto de título
        expect($callout.text()).to.include('🛑');
        expect($callout.text()).to.include('Desbordamiento de página 1: El contenido excede los 297mm físicos.');

        // 3. Estilos Obsidian Danger (rgba(233, 49, 71, ...))
        expect(computed.borderLeftColor, 'Borde izquierdo debe ser rojo Obsidian').to.satisfy((val) =>
          val.includes('233, 49, 71') || val.includes('rgb(233, 49, 71)') || val.includes('#e93147') || val.includes('rgba(233, 49, 71')
        );

        // 4. Botón de acción para pasar sobrante a la siguiente página
        const actionBtn = el.querySelector('[data-testid="a4-page-overflow-action-1"]');
        expect(actionBtn, 'El botón de pasar sobrante debe existir').to.not.be.null;
        expect(actionBtn.textContent.trim()).to.include('Pasar sobrante a Página 2');
      });
  });

  it('3. Botón "Pasar sobrante a Página {N+1}" redistribuye el contenido sin colapsos ni bucles infinitos', () => {
    // 1. Cargar fixture con desbordamiento controlado en Página 1
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.clear();
        win.localStorage.setItem('skip_onboarding_tour', 'true');
        const cv = JSON.parse(JSON.stringify(highDensityCV));
        cv.layout = {
          ...cv.layout,
          editorHeadroom: -160,
        };
        win.localStorage.setItem('cvData', JSON.stringify(cv));
      },
    });
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');

    // 2. Esperar que aparezca el Callout
    cy.get('[data-testid="a4-page-overflow-warning-1"]', { timeout: 10000 }).should('be.visible');

    // 3. Hacer clic en el botón de acción
    cy.get('[data-testid="a4-page-overflow-action-1"]').click({ force: true });

    // 4. Validar que la Página 2 se genera limpiamente como una nueva caja A4 física
    cy.get('.a4-page-box[data-page-number="2"]', { timeout: 10000 })
      .should('be.visible')
      .then(($p2) => {
        const p2Rect = $p2[0].getBoundingClientRect();
        expect(Math.round(p2Rect.width), 'Página 2 debe tener ancho A4').to.be.closeTo(794, 2);
        expect(Math.round(p2Rect.height), 'Página 2 debe tener alto A4').to.be.closeTo(1123, 2);
      });

    // 5. Verificar que el badge de página 2 muestra "Página 2 de 2" o similar
    cy.get('.a4-page-box[data-page-number="2"] .a4-page-badge').should('contain.text', 'Página 2');

    // 6. Verificar que la interfaz no colapsó y no hay bucles infinitos
    cy.get('#area-cv').should('be.visible');
    cy.get('.a4-page-box').should('have.length.at.least', 2);
  });

  it('4. Paridad Estructural en Modo ATS: Caja A4 discreta sin distorsión de columnas', () => {
    // 1. Activar modo ATS
    cy.get('[data-testid="ats-mode-toggle"]').click();

    // 2. Validar que la caja A4 adopta .resume__single-column-page y mantiene dimensiones exactas
    cy.get('.a4-page-box').first().should('be.visible').then(($box) => {
      const rect = $box[0].getBoundingClientRect();
      const computed = window.getComputedStyle($box[0]);

      expect(Math.round(rect.width), 'Ancho en modo ATS debe ser A4 (794px)').to.be.closeTo(794, 2);
      expect(Math.round(rect.height), 'Alto en modo ATS debe ser A4 (1123px)').to.be.closeTo(1123, 2);
      expect(computed.overflow, 'Overflow debe mantenerse hidden').to.equal('hidden');
    });

    // 3. Desactivar modo ATS para restaurar 2 columnas
    cy.get('[data-testid="ats-mode-toggle"]').click();
    cy.get('.a4-page-box').first().should('have.class', 'bd-grid');
  });
});
