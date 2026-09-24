describe('Fase 3: Reactividad Editor → Impresión (Edición en vivo)', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');
  });

  it('1. Edición en vivo de texto: Modificar el nombre en el editor se refleja fielmente en la impresión', () => {
    const nuevoNombre = 'Ing. Alex Vance';

    // 1. Iniciar edición inline en el título principal
    cy.get('.home__title').click();

    // 2. Escribir el nuevo nombre en el contenedor contenteditable y presionar Enter para guardar
    cy.get('.home__title [contenteditable="true"]')
      .should('exist')
      .clear()
      .type(`${nuevoNombre}{enter}`);

    // 3. Confirmar que el editor guardó el nuevo nombre
    cy.get('.home__title').should('contain.text', nuevoNombre);

    // 4. Disparar impresión nativa
    cy.stubPrint();
    cy.get('[data-testid="btn-action-native-print"]').click();

    // 5. Verificar que el documento de impresión contiene el nuevo texto y cero residuos de edición
    cy.getLastPrintDoc().should((doc) => {
      const printTitle = doc.querySelector('.home__title');
      expect(printTitle, 'El título del perfil debe existir en impresión').to.not.be.null;
      expect(printTitle.textContent).to.include(nuevoNombre);

      // No deben filtrarse atributos ni clases activas de edición
      const activeInputs = doc.querySelectorAll('.inline-edit-active, [contenteditable="true"]');
      expect(activeInputs.length, 'No deben existir campos de edición activos en el documento impreso').to.equal(0);
    });
  });

  it('2. Tipografía reactiva: Cambiar la fuente en el menú de diseño actualiza --body-font en la impresión', () => {
    // 1. Abrir panel de Ajustes de Diseño
    cy.get('[data-testid="btn-open-design"]').click();
    cy.get('[data-testid="design-submenu"]').should('be.visible');

    // 2. Asegurar pestaña Tipografía activa y seleccionar Merriweather
    cy.get('[data-testid="tab-typography"]').click();
    cy.get('select[aria-label="Selector de Tipo de Letra"]').select('Merriweather');

    // 3. Disparar impresión
    cy.stubPrint();
    cy.get('[data-testid="btn-action-native-print"]').click();

    // 4. Verificar que --body-font en el documento impreso adopta Merriweather
    cy.getLastPrintDoc().should((doc) => {
      const printAreaCv = doc.getElementById('area-cv');
      const printRoot = doc.documentElement;

      const bodyFont = (
        printAreaCv?.style?.getPropertyValue('--body-font') ||
        printRoot?.style?.getPropertyValue('--body-font') ||
        ''
      );

      expect(bodyFont, '--body-font debe incluir Merriweather').to.include('Merriweather');
    });
  });

  it('3. Espaciado reactivo: Modificar el margen de página actualiza --page-padding en la impresión', () => {
    const nuevoPadding = 40;

    // 1. Abrir panel de diseño y cambiar a pestaña Espaciado
    cy.get('[data-testid="btn-open-design"]').click();
    cy.get('[data-testid="design-submenu"]').should('be.visible');
    cy.get('[data-testid="tab-spacing"]').click();

    // 2. Cambiar valor del slider de margen de página
    cy.get('input[aria-label="Control de Margen de Página"]')
      .setSliderValue(nuevoPadding);

    // 3. Disparar impresión
    cy.stubPrint();
    cy.get('[data-testid="btn-action-native-print"]').click();

    // 4. Verificar que --page-padding en el documento de impresión adopta el nuevo valor
    cy.getLastPrintDoc().should((doc) => {
      const printAreaCv = doc.getElementById('area-cv');
      const printRoot = doc.documentElement;

      const pagePadding = (
        printAreaCv?.style?.getPropertyValue('--page-padding') ||
        printRoot?.style?.getPropertyValue('--page-padding') ||
        ''
      );

      expect(pagePadding, '--page-padding debe reflejar los 40px modificados').to.include(String(nuevoPadding));
    });
  });

  it('4. Eliminación reactiva: Eliminar un elemento en el editor actualiza la estructura impresa sin residuos', () => {
    // 1. Contar elementos editables antes de la eliminación
    cy.get('.item-del-btn').then(($buttons) => {
      const initialCount = $buttons.length;
      expect(initialCount, 'Debe haber elementos con botón de eliminar').to.be.greaterThan(0);

      // 2. Eliminar el primer elemento
      cy.get('.item-del-btn').first().click({ force: true });

      // 3. Confirmar que en el editor hay 1 elemento menos
      cy.get('.item-del-btn').should('have.length', initialCount - 1);

      // 4. Disparar impresión
      cy.stubPrint();
      cy.get('[data-testid="btn-action-native-print"]').click();

      // 5. Verificar que el documento impreso está sanitizado y consistente
      cy.getLastPrintDoc().should((doc) => {
        // Cero botones de borrado en la impresión
        const delBtnsInPrint = doc.querySelectorAll('.item-del-btn, .round-btn-del');
        expect(delBtnsInPrint.length, 'Los botones de borrado no deben existir en el documento impreso').to.equal(0);
      });
    });
  });
});
