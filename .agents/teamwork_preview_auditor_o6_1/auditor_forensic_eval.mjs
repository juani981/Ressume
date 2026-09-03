import { JSDOM } from 'jsdom';
import { 
  generateCleanPrintHTML, 
  executeCleanPrint, 
  calculatePrintScale, 
  escapeHTML 
} from '../../src/utils/staticHtmlPdfEngine.js';

const BLACKLIST_SELECTORS = [
  '.section-drag-handle',
  '.item-drag-handle',
  '.drag-handle',
  '.round-btn-del',
  '.section-del-btn',
  '.item-del-btn',
  '.bullet-del-btn',
  '.round-btn-add',
  '.add-bullet-btn',
  '.section-add-container',
  '.column-add-section',
  '.add-section-btn',
  '.bullet-add-row',
  '.section-tips-toggle-btn',
  '.suggestion-tooltip',
  '.obsidian-callout',
  '.column-resizer',
  '.l-navbar'
];

let failed = 0;
let passed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  } else {
    console.log(`✅ PASS: ${message}`);
    passed++;
  }
}

console.log('=== FORENSIC EMPIRICAL EVALUATION START ===');

// Check 1: Empty and Null cvData Handling
const emptyHtml = generateCleanPrintHTML({});
assert(typeof emptyHtml === 'string' && emptyHtml.includes('<!DOCTYPE html>'), 'Handles empty object safely');
const nullHtml = generateCleanPrintHTML(null);
assert(typeof nullHtml === 'string' && nullHtml.includes('<!DOCTYPE html>'), 'Handles null safely');

// Check 2: XSS Injection & HTML Escaping
const xssCV = {
  profile: {
    name: '<script>alert("hacked")</script>',
    subtitle: '<img src=x onerror=alert(1)>'
  },
  sections: [
    {
      id: 'sec_<script>',
      type: 'about',
      title: '<script>console.log(1)</script>',
      items: [{ description: '<svg onload=alert(2)>' }]
    }
  ]
};
const xssOutput = generateCleanPrintHTML(xssCV);
assert(!xssOutput.includes('<script>alert("hacked")</script>'), 'XSS script tags are strictly neutralized');
assert(!xssOutput.includes('<img src=x onerror=alert(1)>'), 'XSS img tags are strictly neutralized');
assert(xssOutput.includes('&lt;script&gt;alert(&quot;hacked&quot;)&lt;/script&gt;'), 'XSS correctly escaped to HTML entities');

// Check 3: 18-Selector Blacklist on Full Fixture
const fullCVData = {
  profile: {
    name: 'JUAN IGNACIO CARRIZO',
    subtitle: 'Senior Full-Stack Engineer',
    location: 'Tucumán, Argentina',
    email: 'juanicarrizo97@gmail.com'
  },
  layout: {
    type: '2-column',
    fontFamily: 'Roboto',
    fontScale: 1.1,
    pagePadding: 28,
    sectionGap: 24,
    itemGap: 10,
    leftBg: '#1e293b',
    rightBg: '#ffffff'
  },
  sections: [
    { id: 'profile_header', type: 'profile_header', column: 'left', items: [{ name: 'JUAN', subtitle: 'Dev' }] },
    { id: 'about', type: 'about', column: 'left', title: 'Perfil', items: [{ description: 'Desc' }] },
    { id: 'skills', type: 'skills', column: 'left', title: 'Skills', items: [{ title: 'JS', description: 'React' }] },
    { id: 'education', type: 'education', column: 'left', title: 'Edu', items: [{ title: 'Eng', subtitle: 'UNT', date: '2020' }] },
    { id: 'languages', type: 'languages', column: 'left', title: 'Idiomas', items: [{ title: 'Inglés', subtitle: 'C2' }] },
    { id: 'experience', type: 'list', column: 'right', title: 'Exp', items: [{ title: 'Dev', subtitle: 'Corp', bullets: ['A', 'B'] }] },
    { id: 'projects', type: 'projects', column: 'right', title: 'Proyectos', items: [{ title: 'App', link: 'github.com', bullets: ['C'] }] },
    { id: 'certificates', type: 'certificates', column: 'right', title: 'Cert', items: [{ title: 'AWS', credentialId: '123' }] },
    { id: 'awards', type: 'awards', column: 'right', title: 'Premios', items: [{ title: '1st', subtitle: 'Org' }] },
    { id: 'publications', type: 'publications', column: 'right', title: 'Pub', items: [{ title: 'Paper', link: 'doi.org' }] },
    { id: 'volunteering', type: 'volunteering', column: 'right', title: 'Vol', items: [{ title: 'Mentor', bullets: ['D'] }] },
    { id: 'references', type: 'references', column: 'left', title: 'Ref', items: [{ title: 'Boss', email: 'b@b.com' }] },
    { id: 'simple_list', type: 'simple_list', column: 'right', title: 'Other', items: [{ text: 'Course' }] }
  ]
};

const fullHtml = generateCleanPrintHTML(fullCVData);
const dom = new JSDOM(fullHtml);
const doc = dom.window.document;

// Verify 18 selectors
for (const selector of BLACKLIST_SELECTORS) {
  const nodes = doc.querySelectorAll(selector);
  assert(nodes.length === 0, `Selector ${selector} must return 0 nodes (found: ${nodes.length})`);
}

// Check 4: Absence of Canvas and Disguised Raster Images
assert(doc.querySelectorAll('canvas').length === 0, 'No canvas elements in output');
assert(doc.querySelectorAll('img[src*="base64"]').length === 0, 'No base64 raster screenshots in output');

// Check 5: Pure Selectable DOM Text Stream
const text = doc.body.textContent;
assert(text.includes('JUAN IGNACIO CARRIZO'), 'Candidate name selectable in text');
assert(text.includes('Senior Full-Stack Engineer'), 'Subtitle selectable in text');
assert(text.includes('AWS'), 'Certificate selectable in text');
assert(text.includes('React'), 'Skill selectable in text');

// Check 6: Form Elements (inputs, buttons, textareas) Absent
assert(doc.querySelectorAll('input').length === 0, '0 input elements');
assert(doc.querySelectorAll('textarea').length === 0, '0 textarea elements');
assert(doc.querySelectorAll('button').length === 0, '0 button elements');

// Check 7: Super-Container Break Avoidance & Orphan Prevention
const style = doc.querySelector('style').textContent;
assert(style.includes('break-inside: avoid !important;'), 'Contains break-inside: avoid !important');
assert(style.includes('page-break-inside: avoid !important;'), 'Contains page-break-inside: avoid !important');
assert(style.includes('break-after: avoid !important;'), 'Contains break-after: avoid !important on headings');
assert(style.includes('page-break-after: avoid !important;'), 'Contains page-break-after: avoid !important on headings');

// Check 8: calculatePrintScale Mathematics
assert(calculatePrintScale(1000) === 1.0, 'Scale 1.0 for <= 2246px');
assert(calculatePrintScale(2246) === 1.0, 'Scale 1.0 for exactly 2246px');
assert(calculatePrintScale(2500) === 0.898, 'Scale 0.898 for 2500px');
assert(calculatePrintScale(3000) === 0.75, 'Scale clamped to 0.75 for 3000px');
assert(calculatePrintScale(50000) === 0.75, 'Scale clamped to 0.75 floor for extreme height');

// Check 9: Counter-Proof / Test Sensitivity (Mutation Detection)
// If we simulate an injected invalid selector into a corrupted output, JSDOM must detect it:
const corruptedHtml = fullHtml.replace('class="section-title"', 'class="section-title section-drag-handle"');
const corruptedDom = new JSDOM(corruptedHtml);
const detectedCorruptedNodes = corruptedDom.window.document.querySelectorAll('.section-drag-handle');
assert(detectedCorruptedNodes.length > 0, 'Sensitivity check: Blacklist assertion genuinely catches illegal interactive tokens');

console.log(`=== FORENSIC AUDIT EVALUATION FINISHED: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
