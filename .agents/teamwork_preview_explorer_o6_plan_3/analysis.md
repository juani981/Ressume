# Automated Verification Suite Design: `src/tests/cleanPrintEngineVerification.test.jsx`

**Author**: `teamwork_preview_explorer` (Plan 3: Automated Verification Suite Design)  
**Date**: 2026-09-03  
**Target Test Suite**: `src/tests/cleanPrintEngineVerification.test.jsx`  
**Target Target Implementation**: `src/utils/staticHtmlPdfEngine.js` & `src/index.css`  
**Working Directory**: `/home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o6_plan_3`  

---

## Executive Summary

This document specifies the architecture, mock data fixtures, assertion strategies, and full implementation blueprint for the new comprehensive automated verification suite: `src/tests/cleanPrintEngineVerification.test.jsx`.

The test suite rigorously verifies that the Ressume clean print and PDF export engine produces a 100% vector, selectable-text document adhering to strict zero-split pagination rules, dynamic CSS variables, and complete isolation from interactive editor controls across all 13 supported CV section types.

---

## 1. Problem Boundary & Scope Definition

### 1.1 Objective
To construct an automated regression and compliance verification test suite that validates the five core architectural pillars mandated by the 2026-09-03 authoritative request:
1. **100% Vector & Selectable Text (0% Canvas Rasterization)**: Elimination of raster screenshots (`html2canvas`), preservation of semantic DOM hierarchy (`h1`–`h3`, `p`, `li`, `span`), and vector font icons (`bx`).
2. **Complete Interactive Artifact Stripping**: Absolute zero leakage of 18 specific editor selectors plus form controls across all 13 section types.
3. **Strict Zero-Split Super-Container Pagination**: `break-inside: avoid !important` on `.cv-section` and `.cv-block`, alongside orphan header protection (`break-after: avoid !important`) on headings.
4. **Dynamic Typography & CSS Variables Binding**: Accurate binding of layout metrics (`pagePadding`, `sectionGap`, `itemGap`, `fontScale`, `lineHeight`, `fontFamily`) into `:root`, and validation of 1-column (840px block) vs. 2-column (1024px grid) geometries.
5. **`executeCleanPrint` Lifecycle & Iframe Validation**: Isolated A4 iframe generation (`794px` x `1123px`), font readiness synchronization, auto-scale evaluation (`calculatePrintScale`), and DOM cleanup.

### 1.2 Test Environment & Execution Context
- **Test Runner**: Vitest v1.3.1
- **DOM Environment**: JSDOM v24.0.0
- **Configuration**: `vite.config.js` (`globals: true`, `environment: 'jsdom'`, `setupFiles: './src/tests/setup.js'`, `css: false`).
- **DOM Parsing Mechanism**: `new DOMParser().parseFromString(html, 'text/html')` for inspecting output from `generateCleanPrintHTML(cvData, lang)`.

---

## 2. Requirement Mapping & Assertion Design

### Pillar 1: 100% Vector & Selectable Text (0% Canvas Rasterization)

#### Observations in Codebase:
- In `src/utils/staticHtmlPdfEngine.js`, `generateCleanPrintHTML` outputs semantic HTML5 elements (`<div class="resume">`, `<section>`, `<h1>`, `<h2>`, `<h3>`, `<p>`, `<ul>`, `<li>`, `<span>`, `<a>`).
- BoxIcons are rendered as `<i class='bx bx-...'></i>`.

#### Test Specifications:
1. **Zero Canvas Elements**:
   - `const canvases = doc.querySelectorAll('canvas');`
   - `expect(canvases.length).toBe(0);`
2. **Zero Base64 Raster Images**:
   - `const base64Imgs = doc.querySelectorAll('img[src^="data:image"], img[src*="base64"]');`
   - `expect(base64Imgs.length).toBe(0);`
   - Assert raw HTML string contains no data URI images: `expect(html).not.toMatch(/data:image\/(?:png|jpeg|webp|gif);base64/i);`
3. **Semantic Typography Hierarchy**:
   - Header title: `doc.querySelector('h1.home__title')` exists and matches `cvData.profile.name`.
   - Header subtitle: `doc.querySelector('h2.home__subtitle')` exists and matches `cvData.profile.subtitle`.
   - Section titles: `doc.querySelectorAll('h2.section-title')` exist for all non-profile sections.
   - Item titles: `doc.querySelectorAll('h3.experience__title, h3.education__title')` exist.
   - Text descriptions: `doc.querySelectorAll('p.experience__description, p.profile__description')` exist.
   - Bullet items: `doc.querySelectorAll('li.cv-block, .simple-list-item')` exist.
   - Skills items: `doc.querySelectorAll('li.skills__name')` exist with semantic `<span>` and `<b>` tags.
4. **Vector Font Icon Integrity**:
   - Query `doc.querySelectorAll('i')`.
   - Assert every icon has class starting with or containing `bx` (e.g. `bx-map`, `bx-envelope`, `bx-phone`, `bxl-linkedin-square`, `bxl-github`, `bx-badge-check`, `bx-trophy`, `bx-book-open`, `bx-user-check`, `bx-link-external`).
   - Assert zero icons are raster image elements (`<img>` or `<canvas>`).
   - Assert `<link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">` is included in `<head>`.
5. **100% Selectable Text Extraction**:
   - Extract `doc.body.textContent`.
   - Assert all critical data strings (candidate name, job title, company, bullet points, skill names, degree name, cert IDs) appear unescaped and intact in the extracted text stream.

---

### Pillar 2: Complete Interactive Artifact Stripping (18-Selector Blacklist across 13 Sections)

#### Blacklist Catalog (18 Selectors + Form Controls):
1. `.section-drag-handle`
2. `.item-drag-handle`
3. `.drag-handle`
4. `.round-btn-del`
5. `.section-del-btn`
6. `.item-del-btn`
7. `.bullet-del-btn`
8. `.round-btn-add`
9. `.add-bullet-btn`
10. `.section-add-container`
11. `.column-add-section`
12. `.add-section-btn`
13. `.bullet-add-row`
14. `.section-tips-toggle-btn`
15. `.suggestion-tooltip`
16. `.obsidian-callout`
17. `.column-resizer`
18. `.l-navbar`
19. `input`
20. `textarea`
21. `button`
22. `[contenteditable="true"]`
23. `.inline-input`

#### Complete 13 Section Types Catalog:
To guarantee exhaustive coverage across the entire system, the test must construct a comprehensive CV dataset containing all 13 registered section types:
1. `profile_header` (Cabecera de Perfil)
2. `about` (Perfil Profesional / Resumen)
3. `list` (Experiencia Laboral)
4. `projects` (Proyectos Destacados)
5. `education` (Educación y Formación)
6. `skills` (Habilidades Técnicas)
7. `certificates` (Certificaciones y Credenciales)
8. `languages` (Idiomas con Nivel)
9. `awards` (Premios y Distinciones)
10. `publications` (Publicaciones y Artículos)
11. `volunteering` (Voluntariado y Liderazgo)
12. `references` (Referencias Profesionales)
13. `simple_list` (Lista Simple / Cursos)

#### Test Specifications:
1. Generate clean HTML for the 13-section CV dataset via `generateCleanPrintHTML(all13SectionsCVData)`.
2. Parse into DOM via `new DOMParser().parseFromString(html, 'text/html')`.
3. Individually assert `doc.querySelectorAll(selector).length === 0` for each of the 18 blacklist selectors.
4. Combined blacklist query assertion: `doc.querySelectorAll(BLACKLIST.join(', ')).length === 0`.
5. Form element assertion: `doc.querySelectorAll('input, textarea, button, select').length === 0`.
6. Editable state assertion: `doc.querySelectorAll('[contenteditable="true"], .inline-input').length === 0`.
7. Defense-in-depth HTML text match assertions:
   - `expect(html).not.toContain('drag-handle');`
   - `expect(html).not.toContain('round-btn');`
   - `expect(html).not.toContain('suggestion-tooltip');`
   - `expect(html).not.toContain('obsidian-callout');`
   - `expect(html).not.toContain('column-resizer');`
   - `expect(html).not.toContain('l-navbar');`

---

### Pillar 3: Strict Zero-Split Super-Container Pagination

#### Observations in Codebase:
- `src/utils/staticHtmlPdfEngine.js` lines 580–588:
  ```css
  .cv-section,
  .cv-block,
  .section,
  .experience__content,
  .education__content,
  .skills__name {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  ```
- Orphan header protection: To be implemented in Milestone 1 (Plan 1):
  ```css
  .section-title, h1, h2, h3 {
    break-after: avoid !important;
    page-break-after: avoid !important;
  }
  ```

#### Test Specifications:
1. **Super-Container CSS Avoidance Rules**:
   - Extract text content of `<style>` in parsed `doc.head`.
   - Assert style text contains `break-inside: avoid !important;` and `page-break-inside: avoid !important;`.
   - Verify rules target `.cv-section`, `.cv-block`, `.experience__content`, `.education__content`, and `.skills__name`.
2. **Orphan Header Protection**:
   - Assert style text contains `break-after: avoid !important;` and `page-break-after: avoid !important;` targeted at headings (`.section-title`, `h1`, `h2`, `h3`).
3. **DOM Super-Container Tagging**:
   - Query all `<section>` elements: assert every `<section>` has class `cv-section`.
   - Query all item elements: assert every item container has class `cv-block`.
   - Assert bullets and sub-items maintain `cv-block` tagging.
4. **Print Media CSS Rules**:
   - Assert style text contains `@media print`.
   - Assert `@page { size: A4; margin: 0; }`.
   - Assert `print-color-adjust: exact !important;` and `-webkit-print-color-adjust: exact !important;`.

---

### Pillar 4: Dynamic Typography & CSS Variables Binding

#### Observations in Codebase:
- In `staticHtmlPdfEngine.js` lines 340–357 and 400–430:
  Dynamic layout properties passed into `cvData.layout` are evaluated and injected directly into `:root { ... }`.
- Supported font families map:
  - `Poppins` -> `'Poppins', sans-serif`
  - `Inter` -> `'Inter', sans-serif`
  - `Roboto` -> `'Roboto', sans-serif`
  - `Merriweather` -> `'Merriweather', serif`
  - `JetBrains Mono` -> `'JetBrains Mono', monospace`

#### Test Specifications:
1. **`:root` Dynamic Variables Injection**:
   - Pass custom layout properties:
     ```javascript
     layout: {
       pagePadding: 32,
       sectionGap: 24,
       itemGap: 12,
       fontScale: 1.12,
       titleScale: 1.22,
       bodyScale: 0.92,
       listScale: 1.08,
       lineHeight: 1.62,
       fontFamily: 'Inter'
     }
     ```
   - Parse `<style>` tag.
   - Assert `:root` declares:
     - `--page-padding: 32px;`
     - `--section-gap: 24px;`
     - `--item-gap: 12px;`
     - `--font-scale: 1.12;`
     - `--title-scale: 1.22;`
     - `--body-scale: 0.92;`
     - `--list-scale: 1.08;`
     - `--line-height: 1.62;`
     - `--body-font: 'Inter', sans-serif;`
2. **Universal Curated Font Family Mapping**:
   - Loop over all 5 curated fonts and verify exact CSS font declaration in `:root`.
3. **1-Column ATS Container Geometry**:
   - Set `layout.type = '1-column'`.
   - Assert `#area-cv` has class `resume__single-column`.
   - Assert inline style of `#area-cv` defines `max-width: 840px;` and `margin: 0 auto;`.
   - Assert neither `.resume__left` nor `.resume__right` exists; sections flow linearly.
4. **2-Column Grid Geometry & Proportions**:
   - Set `layout.type = '2-column'`.
   - Assert `#area-cv` defines `display: grid;`.
   - With `leftColumnWidth = 35`, assert `grid-template-columns: 35% 65%;`.
   - With `leftColumnWidth = null`, assert default `grid-template-columns: 1fr 2fr;`.
   - Assert `.resume__left` and `.resume__right` exist and contain their respective filtered sections.
5. **YIQ Contrast Dynamic Color Engine**:
   - For dark column background (`#1e293b`), assert calculated inline styles assign light text colors (`--title-color: #fcfcfc`, `--text-color: #f0efef`).
   - For light column background (`#ffffff`), assert calculated inline styles assign dark text colors (`--title-color: #0b0a0a`, `--text-color: #403a3a`).

---

### Pillar 5: `executeCleanPrint` Lifecycle & Iframe Validation

#### Observations in Codebase:
- `executeCleanPrint(cvData, lang)` creates an `iframe`, styles it, appends it to `document.body`, writes `generateCleanPrintHTML`, calculates scale via `calculatePrintScale`, applies zoom if height exceeds 2246px, invokes print, and cleans up via `setTimeout(..., 1000)`.

#### Test Specifications:
1. **Isolated Iframe Creation & Desktop A4 Geometry**:
   - Spy on `document.body.appendChild`.
   - Call `executeCleanPrint(cvData)`.
   - Intercept the created `iframe`.
   - Assert `iframe.tagName === 'IFRAME'`.
   - Assert `iframe.style.width === '794px'`.
   - Assert `iframe.style.height === '1123px'`.
   - Assert `iframe.style.position === 'fixed'`.
   - Assert `iframe.getAttribute('title') === 'Ressume Print Preview'`.
2. **Clean HTML Document Injection**:
   - Verify `doc.open()`, `doc.write()`, and `doc.close()` are invoked on the iframe's document.
   - Verify the written HTML starts with `<!DOCTYPE html>` and contains `#area-cv`.
3. **`calculatePrintScale` Mathematical Bounds & Zoom Application**:
   - Rendered height <= 2246px -> scale is 1.0 (test heights: 1000px, 1800px, 2246px).
   - Rendered height = 2600px -> scale = `2246 / 2600` = `0.864`.
   - Rendered height = 3000px -> scale clamped to floor `0.75`.
   - Rendered height = 10000px -> scale clamped to floor `0.75`.
   - When height > 2246px, verify `doc.body.style.zoom` is assigned the calculated scale factor.
4. **Print Invocation & Fallback**:
   - Verify `iframe.contentWindow.print()` is executed.
   - If iframe printing encounters an error, verify fallback to `window.print()`.
5. **Iframe DOM Cleanup Lifecycle**:
   - Use `vi.useFakeTimers()`.
   - Advance timers past 1000ms (`vi.advanceTimersByTime(1200)`).
   - Assert the iframe is cleanly unmounted and removed from `document.body` (`document.querySelector('iframe') === null`).

---

## 3. Test Fixture: Comprehensive 13-Section CV Dataset

To ensure realistic and repeatable testing, the test suite includes a modular data factory `buildCompleteCVData(layoutOverrides)` containing every single one of the 13 supported section types with populated fields:

```javascript
export const buildCompleteCVData = (layoutOverrides = {}) => ({
  profile: {
    name: 'JUAN IGNACIO CARRIZO',
    subtitle: 'Senior Full-Stack Engineer & Systems Architect',
    location: 'San Miguel de Tucumán, Argentina',
    email: 'juanicarrizo97@gmail.com',
    phone: '+54 9 381 6706133',
    linkedin: 'linkedin.com/in/juan-ignacio-carrizo-juani981',
    github: 'github.com/juani981'
  },
  layout: {
    type: '2-column',
    fontFamily: 'Poppins',
    fontScale: 1.0,
    titleScale: 1.0,
    bodyScale: 1.0,
    listScale: 1.0,
    lineHeight: 1.45,
    pagePadding: 24,
    sectionGap: 20,
    itemGap: 8,
    leftBg: '#fafafa',
    rightBg: '#ffffff',
    leftColumnWidth: null,
    ...layoutOverrides
  },
  sections: [
    // 1. Profile Header
    {
      id: 'profile_header',
      type: 'profile_header',
      column: 'left',
      title: '',
      items: [{
        id: 'prof_1',
        name: 'JUAN IGNACIO CARRIZO',
        subtitle: 'Senior Full-Stack Engineer',
        location: 'San Miguel de Tucumán, Argentina',
        email: 'juanicarrizo97@gmail.com',
        phone: '+54 9 381 6706133',
        linkedin: 'linkedin.com/in/juan-ignacio-carrizo-juani981',
        github: 'github.com/juani981'
      }]
    },
    // 2. About
    {
      id: 'about',
      type: 'about',
      column: 'left',
      title: 'Perfil Profesional',
      items: [{
        id: 'about_1',
        description: 'Ingeniero de software con sólida experiencia en modernización de sistemas legacy y arquitecturas distribuidas.'
      }]
    },
    // 3. Experience (list)
    {
      id: 'experience',
      type: 'list',
      column: 'right',
      title: 'EXPERIENCIA LABORAL',
      items: [{
        id: 'exp_1',
        title: 'Desarrollador Web Full-Stack',
        subtitle: 'Dirección General de Catastro',
        date: '2023 – Actualidad',
        description: 'Liderazgo técnico en modernización de arquitecturas de bases de datos.',
        bullets: [
          'Refactorización integral de microservicios PHP y backend C#.',
          'Optimización de planes de ejecución en PostgreSQL y Oracle.'
        ]
      }]
    },
    // 4. Projects
    {
      id: 'projects',
      type: 'projects',
      column: 'right',
      title: 'PROYECTOS DESTACADOS',
      items: [{
        id: 'proj_1',
        title: 'Ressume PDF Vector Engine',
        subtitle: 'React · TypeScript · CSS Grid',
        date: '2025',
        link: 'github.com/juani981/Ressume',
        linkText: 'Demo / Repositorio',
        description: 'Motor de exportación de CVs con 100% de texto seleccionable y cero artefactos.',
        bullets: ['Renderizado estático A4 sin pérdida de calidad']
      }]
    },
    // 5. Education
    {
      id: 'education',
      type: 'education',
      column: 'left',
      title: 'EDUCACIÓN',
      items: [{
        id: 'edu_1',
        title: 'Ingeniería en Informática',
        subtitle: 'Universidad Nacional de Tucumán',
        date: '2020 – 2025'
      }]
    },
    // 6. Skills
    {
      id: 'skills',
      type: 'skills',
      column: 'left',
      title: 'HABILIDADES TÉCNICAS',
      items: [{
        id: 'skill_1',
        title: 'Backend & Cloud',
        description: 'PostgreSQL, Docker, CI/CD, Node.js, PHP, C#'
      }]
    },
    // 7. Certificates
    {
      id: 'certificates',
      type: 'certificates',
      column: 'right',
      title: 'CERTIFICACIONES',
      items: [{
        id: 'cert_1',
        title: 'AWS Certified Solutions Architect',
        subtitle: 'Amazon Web Services',
        date: '2025',
        credentialId: 'AWS-PSA-98214',
        link: 'aws.amazon.com/verify',
        linkText: 'Verificar Credencial'
      }]
    },
    // 8. Languages
    {
      id: 'languages',
      type: 'languages',
      column: 'left',
      title: 'IDIOMAS',
      items: [{
        id: 'lang_1',
        title: 'Inglés',
        subtitle: 'C2 Avanzado / Profesional',
        description: 'Certificación EF SET 75/100'
      }]
    },
    // 9. Awards
    {
      id: 'awards',
      type: 'awards',
      column: 'right',
      title: 'PREMIOS Y DISTINCIONES',
      items: [{
        id: 'award_1',
        title: '1er Puesto — Hackathon de IA',
        subtitle: 'MinCyT & IEEE',
        date: '2024',
        description: 'Premio por desarrollo de sistema de diagnóstico predictivo.'
      }]
    },
    // 10. Publications
    {
      id: 'publications',
      type: 'publications',
      column: 'right',
      title: 'PUBLICACIONES',
      items: [{
        id: 'pub_1',
        title: 'Optimización de Microservicios con Event-Driven Design',
        subtitle: 'IEEE Latin America Transactions',
        date: '2024',
        link: 'doi.org/10.1109/sample-paper',
        linkText: 'Leer Paper',
        description: 'Análisis de rendimiento en backends de alta concurrencia.'
      }]
    },
    // 11. Volunteering
    {
      id: 'volunteering',
      type: 'volunteering',
      column: 'right',
      title: 'VOLUNTARIADO Y LIDERAZGO',
      items: [{
        id: 'vol_1',
        title: 'Mentor Comunitario',
        subtitle: 'Open Source Argentina',
        date: '2023 – Presente',
        description: 'Capacitación en programación para estudiantes.',
        bullets: ['Talleres de Git y desarrollo web moderno']
      }]
    },
    // 12. References
    {
      id: 'references',
      type: 'references',
      column: 'left',
      title: 'REFERENCIAS',
      items: [{
        id: 'ref_1',
        title: 'Ing. Martín González',
        subtitle: 'Líder de Arquitectura en Globant',
        email: 'martin.gonzalez@ejemplo.com',
        phone: '+54 9 381 555-1234',
        relationship: 'Ex-Líder Técnico Directo'
      }]
    },
    // 13. Simple List
    {
      id: 'simple_list',
      type: 'simple_list',
      column: 'right',
      title: 'CURSOS ADICIONALES',
      items: [{
        id: 'sl_1',
        text: 'Diplomatura en Ingeniería de Datos de Alto Rendimiento — UNT (2024)'
      }]
    }
  ]
});
```

---

## 4. Test Suite Implementation Breakdown

The test suite will contain 25 dedicated test cases distributed across the 5 pillars:

- **Pillar 1: 100% Vector & Selectable Text (5 Tests)**:
  - `T1.1`: Absolutely zero `<canvas>` elements across 1-column and 2-column configurations.
  - `T1.2`: Absolutely zero Base64 screenshot images or raster image elements.
  - `T1.3`: Semantic text node verification for all CV sections (`h1`, `h2`, `h3`, `p`, `li`, `span`).
  - `T1.4`: Vector font icon rendering (`<i class="bx ..."></i>`) with correct CSS classes.
  - `T1.5`: 100% Selectable plain text stream extraction without information loss.

- **Pillar 2: Complete Interactive Artifact Stripping (5 Tests)**:
  - `T2.1`: Exhaustive 18-selector blacklist verification returning 0 nodes for every individual selector.
  - `T2.2`: Combined blacklist query returning 0 nodes.
  - `T2.3`: Complete elimination of form controls (`input`, `textarea`, `button`).
  - `T2.4`: Elimination of editable states (`[contenteditable="true"]`, `.inline-input`).
  - `T2.5`: Defense-in-depth raw HTML string inspection confirming zero interactive tokens.

- **Pillar 3: Strict Zero-Split Super-Container Pagination (5 Tests)**:
  - `T3.1`: Style block contains `break-inside: avoid !important` and `page-break-inside: avoid !important`.
  - `T3.2`: Target super-containers (.cv-section, .cv-block, .experience__content, .education__content, .skills__name) have page break avoidance.
  - `T3.3`: Orphan header protection on headings (`break-after: avoid !important` and `page-break-after: avoid !important`).
  - `T3.4`: Super-container class tagging across all rendered `<section>` and item blocks.
  - `T3.5`: `@media print` rules enforce A4 size, zero margins, and exact color reproduction.

- **Pillar 4: Dynamic Typography & CSS Variables Binding (5 Tests)**:
  - `T4.1`: Dynamic spacing & typography layout values accurately declared in `:root`.
  - `T4.2`: Curated font family resolution across all 5 supported fonts (Poppins, Inter, Roboto, Merriweather, JetBrains Mono).
  - `T4.3`: 1-Column ATS container geometry (840px block, centered, `.resume__single-column`).
  - `T4.4`: 2-Column Grid container geometry (CSS Grid, proportional split, left/right columns).
  - `T4.5`: Dynamic text color contrast calculation (YIQ luminance adaptation).

- **Pillar 5: `executeCleanPrint` Lifecycle & Iframe Validation (5 Tests)**:
  - `T5.1`: Iframe creation with desktop A4 dimensions (`width: 794px`, `height: 1123px`, `position: fixed`).
  - `T5.2`: Clean HTML content written to iframe document (`doc.open`, `doc.write`, `doc.close`).
  - `T5.3`: `calculatePrintScale` mathematical evaluation and boundary clamping (floor 0.75).
  - `T5.4`: Auto-scale zoom application on iframe document body when `scrollHeight > 2246px`.
  - `T5.5`: Iframe DOM cleanup lifecycle via timer-driven unmounting.

---
The full production-ready code implementing this specification is provided in `handoff.md`.
