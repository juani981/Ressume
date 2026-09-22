---
name: pdf-e2e-verification
description: >-
  Runbook para verificar la paridad física, conteo exacto de páginas y ausencia
  de elementos huérfanos en los PDFs generados en Ressume utilizando Chromium
  Headless, Cypress CDP, pdf-lib y pdfjs-dist.
---

# Verificación E2E de Impresión y Generación de PDF

Este procedimiento detalla cómo validar cambios que afecten el motor de impresión o la exportación Typst sin depender falsamente de pruebas de JSDOM/Vitest.

## 1. Ejecutar la Suite de Pruebas E2E de Impresión

```bash
# Validar ciclo de vida, geometría y ausencia de páginas en blanco en Chromium real
npx cypress run --spec "cypress/e2e/01-print-lifecycle.cy.js,cypress/e2e/02-print-geometry-and-pagination.cy.js,cypress/e2e/04-cdp-pdf-generation.cy.js,cypress/e2e/06-multipage-pagebreak.cy.js" --browser chrome
```

## 2. Validar el Motor Typst Determinista

```bash
# Validar compilación WASM de PDF sin intervención del navegador
npx cypress run --spec "cypress/e2e/11-typst-pdf-deterministic.cy.js" --browser chrome
```

## 3. Protocolo de Inspección Binaria (CDP + pdf-lib + pdfjs-dist)
Cuando se verifique un caso extremo o regresión:
1. **Conteo Estructural (`pdf-lib`)**: Cargar el buffer generado (`PDFDocument.load(pdfBuffer)`) y verificar que `pdfDoc.getPageCount()` coincida exactamente con las páginas esperadas (ej. 2).
2. **Inspección Semántica de Huérfanas (`pdfjs-dist`)**: Extraer el texto de la última página y verificar que las coordenadas $Y$ (`item.transform[5]`) del encabezado de sección y su primer ítem mantengan una proximidad vertical válida ($\Delta Y < 150\text{ pt}$), demostrando que no se fracturaron en páginas separadas.
3. **Páginas con 0 Comandos**: Ninguna página del PDF puede emitirse con 0 comandos de texto.

## 4. Validación Empírica Final
Ninguna prueba automatizada sustituye la validación visual en el navegador real del usuario (Zen Browser / Chromium).
