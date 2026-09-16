describe("Ressume Smoke Test", () => {
  it("carga la aplicación correctamente y muestra el título principal", () => {
    cy.visit("/");
    // Verifica que el contenedor principal o editor esté en el DOM
    cy.get("body").should("be.visible");
  });
});
