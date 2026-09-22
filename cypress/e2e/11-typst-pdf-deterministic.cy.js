/**
 * 11-typst-pdf-deterministic.cy.js
 * Test E2E para el motor de exportación PDF con Typst WASM.
 *
 * Objetivo: verificar que:
 *  1. El botón "PDF Typst" existe y está accesible en la UI.
 *  2. Al hacer clic, el Worker Typst se inicializa y produce una descarga.
 *  3. El archivo descargado tiene extensión .pdf y un tamaño > 0.
 *
 * LIMITACIÓN INTENCIONAL:
 *  Este test NO puede verificar el conteo exacto de páginas del PDF binario
 *  en Cypress sin un helper server-side (pdf-lib requiere Node.js).
 *  La validación de páginas se debe hacer manualmente según AGENTS.md §8.4.
 *
 *  Para un arnés determinista completo de páginas, usar el test de Playwright
 *  descrito en FORENSIC-ANALYSIS.MD §Arnés de Validación Determinista en CI.
 *
 * Pre-requisitos:
 *  - `npm run dev` corriendo en localhost:5173
 *  - Los binarios WASM están en public/wasm/ (ejecutar npm run copy:wasm)
 *  - Las fuentes están en public/fonts/
 */

describe('Typst PDF Engine — Validación E2E', () => {

  beforeEach(() => {
    cy.visit('http://localhost:5173', { timeout: 30000 });
    cy.get('#area-cv', { timeout: 10000 }).should('be.visible');
  });

  it('El botón de exportación Typst existe en el ActionMenu', () => {
    cy.get('[data-testid="btn-action-typst-pdf"]')
      .should('exist')
      .and('be.visible')
      .and('not.be.disabled');
  });

  it('El botón muestra estado de carga al hacer clic', () => {
    // Interceptamos el fetch de los archivos WASM para evitar esperar 45s
    // Solo verificamos que el botón cambia de estado
    cy.get('[data-testid="btn-action-typst-pdf"]').click();

    // El botón debe deshabilitarse mientras inicializa o compila
    cy.get('[data-testid="btn-action-typst-pdf"]')
      .should('be.disabled');

    // Reestablecer (el test no espera la compilación completa)
  });

  it('Produce una descarga de archivo PDF al completar la compilación', () => {
    // Interceptar la descarga del PDF antes de hacer clic
    const downloadsFolder = Cypress.config('downloadsFolder');

    cy.get('[data-testid="btn-action-typst-pdf"]').click();

    // Esperar hasta 60s para que el WASM compile (primer uso requiere download)
    // El archivo descargado debe tener extensión .pdf
    cy.readFile(`${downloadsFolder}/CV.pdf`, { timeout: 90000 })
      .should('exist')
      .its('length')
      .should('be.greaterThan', 1000); // Un PDF mínimo tiene > 1KB
  });

  it('El botón vuelve al estado normal después de la descarga', () => {
    cy.get('[data-testid="btn-action-typst-pdf"]').click();

    // Esperar a que regrese al estado idle
    cy.get('[data-testid="btn-action-typst-pdf"]', { timeout: 90000 })
      .should('not.be.disabled');
  });

});
