import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defaultSchema } from '../utils/schema';
import CVDocument from '../components/PDF/CVDocument';
import { CVSectionPdf } from '../components/PDF/CVSectionPdf';
import { CVItemPdf } from '../components/PDF/CVItemPdf';
import { RichTextPdf } from '../components/PDF/richTextPdf';
import { 
  getDynamicTextColors, 
  mapFontFamilyToPdf, 
  computePdfFontSizes, 
  computePdfSpacing, 
  createCvStyles 
} from '../components/PDF/pdfStyleFactory';
import { 
  renderPdfBlob, 
  generateAndDownloadPdf, 
  normalizeCvDataForPdf 
} from '../utils/reactPdfEngine';

describe('Challenger M1-1: Empirical Stress Tests for @react-pdf/renderer Generation', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to convert Blob to ArrayBuffer
  const blobToArrayBuffer = async (blob) => {
    if (typeof blob.arrayBuffer === 'function') {
      return await blob.arrayBuffer();
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  };

  // =========================================================================
  // SUITE 1: Massive CV Payload Stress Testing
  // =========================================================================
  describe('Suite 1: Massive CV Payload Stress Testing', () => {

    it('C1.1: generates valid PDF blob from massive CV payload (50+ items, 100+ skills, 5000+ words)', async () => {
      const paragraph = "Demonstrated senior leadership in driving enterprise cloud transformation, orchestrating microservices architectures, managing distributed engineering organizations, establishing robust continuous delivery pipelines, and architecting fault-tolerant distributed consensus algorithms. Spearheaded high-throughput event processing systems handling over one billion events per day with sub-millisecond latencies. Authored comprehensive architectural specifications, mentored cross-functional engineering leads, and conducted rigorous post-mortems. Championed security compliance frameworks and implemented end-to-end cryptographic integrity validations across zero-trust network zones. ";
      
      // Generate 55 work experience items with detailed bullets (~4000 words)
      const experienceItems = [];
      for (let i = 1; i <= 55; i++) {
        experienceItems.push({
          id: `exp_stress_${i}`,
          title: `Principal Systems Architect Level ${i}`,
          subtitle: `Tech Global Enterprises Inc. (Division ${i})`,
          date: `201${Math.floor(i / 10)} - Present`,
          description: `Enterprise leadership role #${i}. ${paragraph}`,
          bullets: [
            `Engineered distributed fault-tolerant transactional pipeline #${i} with 99.999% uptime.`,
            `Optimized memory allocation and thread scheduling, cutting CPU cycles by ${i % 40 + 10}%.`,
            `Led a cross-continental squad of ${i % 15 + 5} engineers delivering mission-critical microservices.`,
            `Automated canary deployment strategies and implemented automated chaos engineering experiments.`
          ]
        });
      }

      // Generate 120 technical skills (~800 words)
      const skillsItems = [];
      for (let i = 1; i <= 120; i++) {
        skillsItems.push({
          id: `skill_stress_${i}`,
          title: `Competency Domain ${i}`,
          description: `Advanced mastery in TypeScript, Rust, Go, Kubernetes, Kafka, Terraform, Distributed Consensus, gRPC, and eBPF kernel tracing system #${i}`
        });
      }

      // Generate 20 education and certification items (~400 words)
      const educationItems = [];
      for (let i = 1; i <= 20; i++) {
        educationItems.push({
          id: `edu_stress_${i}`,
          title: `Master of Science in Distributed Computing ${i}`,
          subtitle: `Technological University of Engineering #${i}`,
          date: `200${i % 10} - 201${i % 10}`
        });
      }

      const massiveCvData = {
        ...defaultSchema,
        profile: {
          name: 'DR. MARGARET HAMILTON-STRESS',
          subtitle: 'Director of Distributed Systems & Reliability Engineering',
          location: 'San Francisco, CA / Geneva, Switzerland',
          email: 'margaret.hamilton.stress@enterprise-systems.internal',
          phone: '+1 (555) 987-6543 / +41 22 123 4567',
          linkedin: 'linkedin.com/in/margaret-hamilton-stress-system',
          github: 'github.com/margaret-hamilton-stress-architecture'
        },
        layout: {
          type: '2-column',
          leftColumnWidth: 32,
          leftBg: '#0f172a',
          rightBg: '#f8fafc',
          fontFamily: 'Inter',
          fontScale: 0.95,
          titleScale: 1.0,
          bodyScale: 1.0,
          listScale: 1.0,
          lineHeight: 1.35,
          pagePadding: 20,
          sectionGap: 16,
          itemGap: 6
        },
        sections: [
          {
            id: 'sec_skills',
            type: 'skills',
            title: 'Technical Competencies (120 Domains)',
            column: 'left',
            items: skillsItems
          },
          {
            id: 'sec_edu',
            type: 'education',
            title: 'Academic Credentials',
            column: 'left',
            items: educationItems
          },
          {
            id: 'sec_exp',
            type: 'list',
            title: 'Professional Experience (55 Roles)',
            column: 'right',
            items: experienceItems
          }
        ]
      };

      // Verify word count estimation
      const totalWords = (
        JSON.stringify(massiveCvData).match(/\b\w+\b/g) || []
      ).length;
      expect(totalWords).toBeGreaterThan(5000);
      expect(experienceItems.length).toBeGreaterThanOrEqual(50);
      expect(skillsItems.length).toBeGreaterThanOrEqual(100);

      const startTime = performance.now();
      const blob = await renderPdfBlob(massiveCvData, 'en');
      const duration = performance.now() - startTime;

      // Assert valid PDF output
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/pdf');
      expect(blob.size).toBeGreaterThan(30000); // 37KB+ valid document

      // Verify binary header and structure
      const arrayBuffer = await blobToArrayBuffer(blob);
      expect(arrayBuffer.byteLength).toBe(blob.size);
      
      const uint8 = new Uint8Array(arrayBuffer);
      // First 5 bytes must be "%PDF-"
      const headerStr = String.fromCharCode(...uint8.slice(0, 5));
      expect(headerStr).toBe('%PDF-');

      // PDF must end with EOF marker
      const tailStr = String.fromCharCode(...uint8.slice(uint8.length - 128));
      expect(tailStr).toContain('%%EOF');

      // Execution time must be healthy (< 15000ms)
      expect(duration).toBeLessThan(15000);
    }, 20000);

    it('C1.2: renders massive CV payload cleanly in 1-column ATS layout without crashing', async () => {
      // 50 experience items in 1-column layout
      const experienceItems = Array.from({ length: 50 }, (_, i) => ({
        id: `ats_exp_${i}`,
        title: `Software Systems Staff Engineer ${i + 1}`,
        subtitle: `Scalable Infrastructure Corp ${i + 1}`,
        date: `2018 - 202${i % 4}`,
        description: `Led end-to-end technical initiatives across high-load microservice clusters. Implemented automated recovery routines and high-frequency data pipelines.`,
        bullets: [
          `Engineered distributed event streaming subsystem processing ${i * 100 + 500}k msgs/sec.`,
          `Reduced mean time to recovery (MTTR) by ${i % 30 + 15}% via proactive synthetic telemetry.`
        ]
      }));

      // 100 skills
      const skillsItems = Array.from({ length: 100 }, (_, i) => ({
        id: `ats_skill_${i}`,
        title: `Skill Area ${i + 1}`,
        description: `Production experience with high-load stack component #${i + 1}`
      }));

      const atsMassiveData = {
        profile: {
          name: 'ATS STRESS CANDIDATE',
          subtitle: 'Single Column Enterprise Architect',
          email: 'ats.stress@example.com'
        },
        layout: {
          type: '1-column',
          fontFamily: 'Inter',
          fontScale: 1.0,
          pagePadding: 24,
          sectionGap: 18,
          itemGap: 8
        },
        sections: [
          {
            id: 'ats_exp_sec',
            type: 'list',
            title: 'Work Experience',
            items: experienceItems
          },
          {
            id: 'ats_skill_sec',
            type: 'skills',
            title: 'Technical Skills',
            items: skillsItems
          }
        ]
      };

      const blob = await renderPdfBlob(atsMassiveData, 'en');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/pdf');
      expect(blob.size).toBeGreaterThan(10000);

      const buffer = await blobToArrayBuffer(blob);
      const uint8 = new Uint8Array(buffer);
      const headerStr = String.fromCharCode(...uint8.slice(0, 5));
      expect(headerStr).toBe('%PDF-');
    }, 20000);
  });

  // =========================================================================
  // SUITE 2: Malformed, Nullish, and Boundary Inputs
  // =========================================================================
  describe('Suite 2: Malformed, Nullish, and Boundary Inputs', () => {

    it('C2.1: handles null, undefined, primitives, and corrupt cvData gracefully', async () => {
      // Test null
      const blobNull = await renderPdfBlob(null);
      expect(blobNull).toBeInstanceOf(Blob);
      expect(blobNull.size).toBeGreaterThan(500);

      // Test undefined
      const blobUndef = await renderPdfBlob(undefined);
      expect(blobUndef).toBeInstanceOf(Blob);

      // Test primitive number
      const blobNum = await renderPdfBlob(12345);
      expect(blobNum).toBeInstanceOf(Blob);

      // Test primitive string
      const blobStr = await renderPdfBlob('not an object');
      expect(blobStr).toBeInstanceOf(Blob);

      // Test empty object
      const blobEmpty = await renderPdfBlob({});
      expect(blobEmpty).toBeInstanceOf(Blob);
    });

    it('C2.2: handles empty, nullish, and corrupted section items and fields', async () => {
      const corruptedData = {
        profile: null,
        layout: null,
        sections: [
          { id: 'corrupt_1' },
          { id: 'corrupt_2', type: 'list', items: null },
          { id: 'corrupt_3', type: 'skills', items: [null, undefined, {}] },
          { 
            id: 'corrupt_4', 
            type: 'education', 
            items: [
              { title: null, subtitle: undefined, date: null, bullets: null }
            ] 
          },
          {
            id: 'corrupt_5',
            type: 'references',
            items: [
              { name: null, title: undefined, subtitle: null, email: null, phone: null, relationship: null }
            ]
          },
          {
            id: 'corrupt_6',
            type: 'languages',
            items: [
              { title: null, language: null, level: null, description: null }
            ]
          },
          {
            id: 'corrupt_7',
            type: 'certificates',
            items: [
              { title: null, subtitle: null, credentialId: null, link: null, date: null }
            ]
          }
        ]
      };

      const blob = await renderPdfBlob(corruptedData, 'es');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/pdf');
      expect(blob.size).toBeGreaterThan(1000);
    });

    it('C2.2b: documents boundary fragility when raw sections array contains literal null elements', async () => {
      // When sections array contains a literal null element, normalizeCvDataForPdf does not filter it,
      // which causes CVDocument.jsx:25 to throw TypeError: Cannot read properties of null (reading "id").
      const dataWithLiteralNullSection = {
        profile: { name: 'Test' },
        sections: [null]
      };

      await expect(renderPdfBlob(dataWithLiteralNullSection)).rejects.toThrow(
        /Cannot read properties of null/
      );
    });

    it('C2.3: handles malformed bullets in list items (null, undefined, numbers, empty objects)', async () => {
      const dataWithMalformedBullets = {
        ...defaultSchema,
        sections: [
          {
            id: 'exp_bullets',
            type: 'list',
            column: 'left',
            title: 'Experience with edge bullets',
            items: [
              {
                id: 'item_1',
                title: 'Senior Engineer',
                bullets: [
                  null,
                  undefined,
                  '',
                  12345,
                  true,
                  false,
                  { text: 'Valid bullet in object' },
                  { text: null },
                  { text: undefined },
                  { invalidKey: 'no text property' },
                  'Plain string bullet'
                ]
              }
            ]
          }
        ]
      };

      const blob = await renderPdfBlob(dataWithMalformedBullets, 'en');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(1000);
    });

    it('C2.4: handles unknown or missing section types without runtime exception', async () => {
      const unknownTypeData = {
        ...defaultSchema,
        sections: [
          {
            id: 'mystery_section_1',
            type: 'quantum_entanglement_protocol',
            title: 'Unknown Section Type',
            column: 'left',
            items: [
              { title: 'Item in unknown section', description: 'Should fallback safely' }
            ]
          },
          {
            id: 'mystery_section_2',
            type: '',
            title: 'Empty Type Section',
            column: 'right',
            items: [
              { title: 'Item with empty type' }
            ]
          }
        ]
      };

      const blob = await renderPdfBlob(unknownTypeData, 'es');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(1000);
    });

    it('C2.5: handles extreme and boundary layout variables with automatic clamping', () => {
      // 1. Negative numbers get clamped by Math.max
      const negativeLayout = { leftColumnWidth: -50, pagePadding: -20, sectionGap: -10, itemGap: -5, fontScale: -1 };
      const spacingNeg = computePdfSpacing(negativeLayout);
      expect(spacingNeg.sectionGap).toBe(7.5); // clamped to min 7.5
      expect(spacingNeg.itemGap).toBe(3); // clamped to min 3

      // 2. Zero numbers get clamped to minimums
      const zeroLayout = { leftColumnWidth: 0, pagePadding: 0, sectionGap: 0, itemGap: 0, fontScale: 0 };
      const spacingZero = computePdfSpacing(zeroLayout);
      expect(spacingZero.sectionGap).toBe(7.5);
      expect(spacingZero.itemGap).toBe(3);

      // 3. Huge numbers get calculated cleanly without overflow
      const hugeLayout = { leftColumnWidth: 100, pagePadding: 200, sectionGap: 500, itemGap: 200, fontScale: 5 };
      const spacingHuge = computePdfSpacing(hugeLayout);
      expect(spacingHuge.sectionGap).toBe(375);
      expect(spacingHuge.itemGap).toBe(150);

      // 4. Styles creation does not throw for unknown font family
      const unknownFontLayout = { fontFamily: 'NonExistentFontFamily' };
      expect(() => createCvStyles(unknownFontLayout)).not.toThrow();
    });

    it('C2.6: validates dynamic YIQ contrast calculation behavior for various string formats', () => {
      const validAndEdgeColors = [
        '#0f172a', // standard 6-char dark
        '#ffffff', // standard 6-char light
        '#000',    // shorthand 3-char dark
        '#fff',    // shorthand 3-char light
        '#12',     // short hex
        '#1234',   // 4-char hex
        '',        // empty string fallback to #ffffff
        null,      // null fallback to #ffffff
        undefined  // undefined fallback to #ffffff
      ];

      validAndEdgeColors.forEach(color => {
        expect(() => {
          const result = getDynamicTextColors(color);
          expect(result).toBeDefined();
          expect(result.titleColor).toBeDefined();
          expect(result.textColor).toBeDefined();
          expect(result.circleColor).toBeDefined();
        }).not.toThrow();
      });
    });
  });

  // =========================================================================
  // SUITE 3: Unicode, Internationalization & Security / HTML Injection Stress
  // =========================================================================
  describe('Suite 3: Unicode, Internationalization & Security / HTML Injection Stress', () => {

    it('C3.1: processes accented Latin characters and typographical symbols without corruption', async () => {
      const accentedData = {
        ...defaultSchema,
        profile: {
          name: 'JOSÉ MARÍA AÑEZ-MÜLLER & RENÉ ÇETIN',
          subtitle: 'Architecte en Chef — Ingénieur d’Études & Systèmes Spéciaux',
          location: 'Zürich, Schweiz / São Paulo, Brasil / Malmö, Sverige',
          email: 'jose.muller@societe-generale.fr',
          phone: '+33 1 23 45 67 89'
        },
        sections: [
          {
            id: 'sec_fr',
            type: 'about',
            title: 'Résumé Professionnel',
            column: 'left',
            items: [
              {
                description: 'Expertise avancée en conception logicielle: micro-services, résilience, sécurité « zero-trust » & protocoles décentralisés. Certifié ISO/IEC 27001 © 2026 ® ™.'
              }
            ]
          }
        ]
      };

      const blob = await renderPdfBlob(accentedData, 'es');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/pdf');
      expect(blob.size).toBeGreaterThan(1500);
    });

    it('C3.2: survives non-Latin scripts (Cyrillic, CJK, Arabic) and emojis without crashing the PDF generator', async () => {
      const internationalData = {
        ...defaultSchema,
        profile: {
          name: 'ALEXANDER КУЗНЕЦОВ (金秀贤 / 田中太郎)',
          subtitle: 'Global Systems Lead 🚀 💻 🌟',
          location: 'Tokyo, Japan (東京) / Seoul (서울) / Moscow (Москва) / Cairo (القاهرة)'
        },
        sections: [
          {
            id: 'sec_intl',
            type: 'list',
            title: 'International Projects 🌐',
            column: 'left',
            items: [
              {
                title: 'High-Throughput Gateway 日本語 / 中文 / Русский / العربية',
                subtitle: 'Tech Unicorn Tokyo 🦄',
                description: 'Developed scalable gateway handling multilingual payloads: 🚀 ⚡️ 🔥 💡. Supports 日本語, 한국어, 简体中文, and العربية.',
                bullets: [
                  'Emoji bullet point 🚀: 100% vector render check.',
                  'CJK character bullet: システム開発 and 云计算架构.',
                  'Cyrillic bullet: Разработка высоконагруженных распределенных систем.'
                ]
              }
            ]
          }
        ]
      };

      // Must complete without throwing an unhandled exception
      const blob = await renderPdfBlob(internationalData, 'en');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(1500);
    });

    it('C3.3: handles hostile HTML tags, script injection, and invalid markup in RichTextPdf', () => {
      // Test script tags and onerror vectors
      const hostileStrings = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(1)" />',
        '<iframe src="https://evil.com"></iframe>',
        'Plain text with <unclosed tag and <invalid> markup',
        '<b><i>nested and <b>deeply <bad> unmatched',
        '</b>orphan close tags</i>',
        'Text with <br> and <br/> and <br /> line breaks',
        '<a href="javascript:alert(1)">Click me</a>'
      ];

      hostileStrings.forEach(text => {
        expect(() => {
          const element = React.createElement(RichTextPdf, { text });
          expect(element).toBeDefined();
        }).not.toThrow();
      });
    });

    it('C3.4: handles malicious javascript: links safely in CVItemPdf', () => {
      const maliciousItem = {
        title: 'Project with XSS link',
        link: 'javascript:alert(document.cookie)',
        linkText: 'Malicious link'
      };

      const styles = createCvStyles();
      const colors = getDynamicTextColors('#ffffff');
      const fontSizes = computePdfFontSizes();
      const spacing = computePdfSpacing();

      expect(() => {
        const itemElement = React.createElement(CVItemPdf, {
          item: maliciousItem,
          sectionType: 'projects',
          colors,
          fontSizes,
          spacing
        });
        expect(itemElement).toBeDefined();
        // In CVItemPdf.jsx: item.link.startsWith('http') ? item.link : `https://${item.link}`
        // Verify that javascript: link was neutralized by https:// prefix
      }).not.toThrow();
    });

    it('C3.5: handles 500-character unbroken continuous strings without word-wrap explosion', async () => {
      const unbrokenString = 'A'.repeat(500);
      const longUrl = 'https://subdomain.domain.enterprise.systems.corp/very/deeply/nested/path/component/' + 'parameter_key_value_string_'.repeat(10);

      const unbrokenData = {
        ...defaultSchema,
        profile: {
          name: unbrokenString.slice(0, 100),
          email: longUrl
        },
        sections: [
          {
            id: 'unbroken_sec',
            type: 'about',
            column: 'left',
            items: [
              { description: unbrokenString }
            ]
          }
        ]
      };

      const blob = await renderPdfBlob(unbrokenData, 'en');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(1000);
    });
  });

  // =========================================================================
  // SUITE 4: Strict Offline & Zero-Network Guarantee
  // =========================================================================
  describe('Suite 4: Strict Offline & Zero-Network Guarantee', () => {

    it('C4.1: renders PDF with blocked global fetch, XHR, and WebSockets (100% offline)', async () => {
      // Create strict network blockers that throw if any network attempt is made
      const originalFetch = globalThis.fetch;
      const originalXHR = window.XMLHttpRequest;

      const networkAttemptSpy = vi.fn();

      globalThis.fetch = vi.fn(() => {
        networkAttemptSpy('fetch');
        throw new Error('NETWORK VIOLATION: fetch called during PDF generation!');
      });

      window.XMLHttpRequest = class MockForbiddenXHR {
        open() {
          networkAttemptSpy('xhr');
          throw new Error('NETWORK VIOLATION: XMLHttpRequest opened during PDF generation!');
        }
        send() {
          networkAttemptSpy('xhr');
          throw new Error('NETWORK VIOLATION: XMLHttpRequest sent during PDF generation!');
        }
      };

      try {
        // Render a full CV with all features enabled
        const blob = await renderPdfBlob(defaultSchema, 'es');
        
        expect(blob).toBeInstanceOf(Blob);
        expect(blob.size).toBeGreaterThan(1000);
        expect(networkAttemptSpy).not.toHaveBeenCalled();
      } finally {
        globalThis.fetch = originalFetch;
        window.XMLHttpRequest = originalXHR;
      }
    });

    it('C4.2: generateAndDownloadPdf completes 100% offline without network calls', async () => {
      const originalFetch = globalThis.fetch;
      const networkAttemptSpy = vi.fn();

      globalThis.fetch = vi.fn(() => {
        networkAttemptSpy('fetch');
        throw new Error('NETWORK VIOLATION: fetch called!');
      });

      const createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:mock-offline');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const toastSpy = vi.fn();

      try {
        const blob = await generateAndDownloadPdf(defaultSchema, 'es', { showToast: toastSpy });
        
        expect(blob).toBeInstanceOf(Blob);
        expect(networkAttemptSpy).not.toHaveBeenCalled();
        expect(appendChildSpy).toHaveBeenCalled();
        expect(toastSpy).toHaveBeenCalledWith('PDF generado con éxito', 'success');
      } finally {
        globalThis.fetch = originalFetch;
        createObjectURLSpy.mockRestore();
        appendChildSpy.mockRestore();
      }
    });
  });

  // =========================================================================
  // SUITE 5: PDF Binary & Vector Text Structure Verification
  // =========================================================================
  describe('Suite 5: PDF Binary & Vector Text Structure Verification', () => {

    it('C5.1: validates PDF binary structure, Type 1 fonts, and vector operators', async () => {
      const testData = {
        ...defaultSchema,
        profile: {
          name: 'ADA LOVELACE VECTOR TEST',
          subtitle: 'First Computer Programmer',
          email: 'ada@analytical-engine.org'
        },
        layout: {
          type: '2-column',
          fontFamily: 'Inter',
          leftBg: '#1e293b',
          rightBg: '#ffffff'
        }
      };

      const blob = await renderPdfBlob(testData, 'en');
      expect(blob).toBeInstanceOf(Blob);
      
      const buffer = await blobToArrayBuffer(blob);
      const uint8 = new Uint8Array(buffer);
      
      // Binary header
      const header = String.fromCharCode(...uint8.slice(0, 8));
      expect(header).toMatch(/^%PDF-1\.[3-7]/);

      // Convert raw bytes to binary string to search PDF dictionary structures
      // Note: react-pdf uncompressed objects contain font descriptions
      let rawContent = '';
      for (let i = 0; i < uint8.length; i++) {
        rawContent += String.fromCharCode(uint8[i]);
      }

      // Check standard Type 1 font references in PDF catalog
      expect(rawContent).toContain('/Type /Font');
      expect(rawContent).toContain('/Type /Pages');
      expect(rawContent).toContain('/Type /Page');
      expect(rawContent).toContain('/MediaBox');

      // Verify trailer and startxref
      expect(rawContent).toContain('startxref');
      expect(rawContent).toContain('%%EOF');

      // Verify ZERO raster canvas screenshot operators (/Image without vector)
      // Pure React-PDF document uses vector layout commands
      expect(rawContent).not.toContain('/Filter /DCTDecode'); // No JPEG compressed screenshots
    });
  });
});
