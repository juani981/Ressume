# Plan: 1:1 Vector/Text PDF Print & Export Engine

## Overview
Implement a bulletproof, zero-artifact, 1:1 vector/text PDF print and export engine for the Ressume CV editor strictly capturing `#area-cv` with 100% selectable text, exact layout, custom typography/spacings, zero interactive editor artifacts, zero-split super-container pagination, and robust execution pipeline with complete test suite.

## Phases
1. **Survey & Requirements Enumeration**:
   - Spawn 3 parallel Explorers to analyze:
     - Explorer 1: Current export and print implementations (`ActionMenu`, `executeCleanPrint`, `generateCleanPrintHTML`, print buttons, export listeners, html2pdf/jspdf/printJS usage if any).
     - Explorer 2: DOM tree of `#area-cv`, interactive elements/selectors (`.section-drag-handle`, `.item-drag-handle`, `.round-btn-del`, `.section-del-btn`, `.item-del-btn`, `.bullet-del-btn`, `.round-btn-add`, `.add-bullet-btn`, `.section-add-container`, `.column-add-section`, `.section-tips-toggle-btn`, `.suggestion-tooltip`, `.column-resizer`, `.l-navbar`, inputs/textareas) and styles/CSS variables (`--page-padding`, `--section-gap`, `--item-gap`, `--font-scale`, `--line-height`, fonts, colors).
     - Explorer 3: Test runner, existing tests, build system (`npm run build`, `npm test`), and testing infrastructure.
2. **Decomposition & Architecture Design (PROJECT.md)**:
   - Synthesize explorer findings into `PROJECT.md`.
   - Formulate milestones with clear boundaries and interface contracts.
3. **Implementation & Iteration Cycles**:
   - Milestone 1: Static HTML Print Engine & CSS Pagination (`generateCleanPrintHTML`, CSS print rules, zero-split rules `break-inside: avoid !important; page-break-inside: avoid !important;`, selectable vector output).
   - Milestone 2: Complete Interactive Artifact Stripping & Semantic Typography (DOM/HTML purification, replacing editable inputs with semantic text, ensuring 0 interactive controls).
   - Milestone 3: Client-side Pipeline & ActionMenu Triggers (`executeCleanPrint`, isolated clean iframe printing, direct print/download flow without layout shifts or missing fonts).
   - Milestone 4: Automated Verification & Test Suite (unit & integration tests for `generateCleanPrintHTML` and `executeCleanPrint`, CSS variable bindings, zero interactive class selectors, build verification).
4. **Verification, Review, Adversarial Challenge & Forensic Audit**:
   - Reviewers (2 independent reviews).
   - Challengers (2 stress test verification).
   - Forensic Auditor (integrity check).
5. **Final Aggregation & Human Reporting**.
