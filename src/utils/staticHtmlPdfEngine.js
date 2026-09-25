/**
 * staticHtmlPdfEngine.js
 * 
 * Architectural facade for dedicated static HTML PDF generation and printing.
 * Decomposed into specialized SRP services in src/services/print/:
 * - pdfTitleService.js (Title generation & filename sanitization)
 * - cleanHtmlGenerator.js (Static HTML generation, clone sanitization, layout tokens)
 * - printExecutionDriver.js (Iframe lifecycle management & window.print execution)
 * 
 * Retains 100% backward compatibility for all consumers and test suites.
 */

export * from '../services/print/index';
