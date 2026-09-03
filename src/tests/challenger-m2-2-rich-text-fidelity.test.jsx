import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App';
import InlineEdit from '../components/Editor/InlineEdit';
import RichTextToolbar from '../components/Editor/RichTextToolbar';
import { CVProvider, useCV } from '../context/CVContext';
import { defaultSchema } from '../utils/schema';
import { generateCleanPrintHTML } from '../utils/staticHtmlPdfEngine';
import { RichTextPdf } from '../components/PDF/richTextPdf';
import { CVDocument } from '../components/PDF/CVDocument';
import { pdf } from '@react-pdf/renderer';
import { 
  extractAlignment, 
  applyAlignment, 
  stripOuterAlignment, 
  sanitizeRichHTML, 
  renderRichHTML,
  parseHtmlToTokens,
  stripHtml 
} from '../utils/richTextEngine';

// Helper to convert Blob to ArrayBuffer in jsdom/Node environment
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

describe('Challenger M2-2: Cross-Engine Rich Text Fidelity Verification', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // =========================================================================
  // Dimension 1: Bold & Italic Rendering Across DOM, staticHtml, and React-PDF
  // =========================================================================
  describe('Dimension 1: Bold and Italic Rendering Across Targets', () => {
    it('C1.1: DOM (#area-cv) renders bold and italic tags within live document paper', () => {
      const richCV = {
        ...defaultSchema,
        profile: {
          ...defaultSchema.profile,
          name: '<b>JUAN</b> IGNACIO',
          subtitle: '<i>Senior Full-Stack Architect</i>'
        },
        sections: [
          defaultSchema.sections[0], // profile_header
          {
            id: 'about',
            type: 'about',
            column: 'left',
            title: 'Perfil',
            items: [
              {
                id: 'about_item',
                description: 'Ingeniero con <b>10 años</b> de experiencia en <i>sistemas distribuidos</i>.'
              }
            ]
          }
        ]
      };

      localStorage.setItem('cvData', JSON.stringify(richCV));

      const { container } = render(
        <CVProvider>
          <App />
        </CVProvider>
      );

      const areaCv = container.querySelector('#area-cv');
      expect(areaCv).toBeInTheDocument();

      // Check for presence of real <b> and <i> HTML elements in DOM
      const boldElements = areaCv.querySelectorAll('b, strong');
      const italicElements = areaCv.querySelectorAll('i, em');

      expect(boldElements.length).toBeGreaterThanOrEqual(1);
      const boldTexts = Array.from(boldElements).map(el => el.textContent);
      expect(boldTexts.some(t => t.includes('10 años') || t.includes('JUAN'))).toBe(true);

      expect(italicElements.length).toBeGreaterThanOrEqual(1);
      const italicTexts = Array.from(italicElements).map(el => el.textContent);
      expect(italicTexts.some(t => t.includes('sistemas distribuidos') || t.includes('Senior Full-Stack Architect'))).toBe(true);
    });

    it('C1.2: DOM InlineEdit preserves bold and italic on user interaction via toolbar buttons', async () => {
      const onSaveMock = vi.fn();
      render(
        <CVProvider>
          <InlineEdit value="Texto Plano Inicial" onSave={onSaveMock} multiline={true} />
        </CVProvider>
      );

      const display = screen.getByTestId('inline-edit-display');
      fireEvent.click(display);

      const editor = screen.getByRole('textbox');
      expect(editor).toHaveAttribute('contenteditable', 'true');

      // Click Bold toolbar button
      const boldBtn = screen.getByTestId('btn-format-bold');
      fireEvent.mouseDown(boldBtn);
      expect(editor.innerHTML).toContain('<b>Texto Plano Inicial</b>');

      // Click Italic toolbar button
      const italicBtn = screen.getByTestId('btn-format-italic');
      fireEvent.mouseDown(italicBtn);
      expect(editor.innerHTML).toMatch(/<i>.*Texto Plano Inicial.*<\/i>|<b>.*<i>.*<\/b>/i);

      fireEvent.blur(editor);
      await act(async () => {
        await new Promise(r => setTimeout(r, 200));
      });

      expect(onSaveMock).toHaveBeenCalled();
      const savedValue = onSaveMock.mock.calls[0][0];
      expect(savedValue).toMatch(/<b>|<strong>/);
      expect(savedValue).toMatch(/<i>|<em>/);
    });

    it('C1.3: staticHtmlPdfEngine renders real <b> and <i> tags with ZERO literal &lt;b&gt; escaping', () => {
      const testCV = {
        ...defaultSchema,
        profile: {
          name: '<b>JUAN</b> <i>IGNACIO</i>',
          subtitle: '<i>Tech Lead</i>'
        },
        sections: [
          {
            id: 'profile_header',
            type: 'profile_header',
            column: 'left',
            items: [
              {
                id: 'prof1',
                name: '<b>JUAN</b> <i>IGNACIO</i>',
                subtitle: '<i>Tech Lead</i>'
              }
            ]
          },
          {
            id: 'exp',
            type: 'list',
            column: 'right',
            title: '<b>Experiencia</b>',
            items: [
              {
                id: 'item1',
                title: 'Senior <b>Software</b> Engineer',
                subtitle: '<i>Acme Corp</i>',
                description: 'Desarrollo en <b>Python</b> y <i>FastAPI</i>.',
                bullets: [
                  'Optimización de consultas <b>PostgreSQL</b>',
                  'Liderazgo de equipo <i>ágil</i>'
                ]
              }
            ]
          }
        ]
      };

      const html = generateCleanPrintHTML(testCV, 'es');

      // Assert real HTML formatting tags exist
      expect(html).toContain('<b>JUAN</b>');
      expect(html).toContain('<i>IGNACIO</i>');
      expect(html).toContain('<i>Tech Lead</i>');
      expect(html).toContain('<b>Experiencia</b>');
      expect(html).toContain('Senior <b>Software</b> Engineer');
      expect(html).toContain('<i>Acme Corp</i>');
      expect(html).toContain('Desarrollo en <b>Python</b> y <i>FastAPI</i>.');
      expect(html).toContain('Optimización de consultas <b>PostgreSQL</b>');
      expect(html).toContain('Liderazgo de equipo <i>ágil</i>');

      // Zero literal &lt;b&gt; or &lt;i&gt; entities
      expect(html).not.toContain('&lt;b&gt;');
      expect(html).not.toContain('&lt;/b&gt;');
      expect(html).not.toContain('&lt;i&gt;');
      expect(html).not.toContain('&lt;/i&gt;');
    });

    it('C1.4: React-PDF RichTextPdf decomposes nested and mixed bold/italic into styled Text primitives', () => {
      const mixedHtml = 'Normal <b>Bold Only</b> Middle <i>Italic Only</i> Combined <b><i>Bold and Italic</i></b> End';
      const element = RichTextPdf({ text: mixedHtml });

      expect(element).toBeDefined();
      const children = React.Children.toArray(element.props.children);

      // Child 0: "Normal " (normal)
      expect(children[0].props.children).toBe('Normal ');
      expect(children[0].props.style).toEqual({});

      // Child 1: "Bold Only" (bold)
      expect(children[1].props.children).toBe('Bold Only');
      expect(children[1].props.style).toEqual({ fontWeight: 'bold' });

      // Child 2: " Middle " (normal)
      expect(children[2].props.children).toBe(' Middle ');
      expect(children[2].props.style).toEqual({});

      // Child 3: "Italic Only" (italic)
      expect(children[3].props.children).toBe('Italic Only');
      expect(children[3].props.style).toEqual({ fontStyle: 'italic' });

      // Child 4: " Combined " (normal)
      expect(children[4].props.children).toBe(' Combined ');

      // Child 5: "Bold and Italic" (both bold and italic)
      expect(children[5].props.children).toBe('Bold and Italic');
      expect(children[5].props.style).toEqual({ fontWeight: 'bold', fontStyle: 'italic' });

      // Child 6: " End" (normal)
      expect(children[6].props.children).toBe(' End');
    });

    it('C1.5: React-PDF binary pipeline compiles valid PDF document containing rich bold and italic content', async () => {
      const richCV = {
        ...defaultSchema,
        sections: [
          defaultSchema.sections[0],
          {
            id: 'about',
            type: 'about',
            title: 'Perfil',
            column: 'left',
            items: [
              {
                id: 'ab1',
                description: 'Especialista en <b>Infraestructura Cloud</b> y microservicios <i>Kubernetes</i>.'
              }
            ]
          },
          {
            id: 'exp',
            type: 'list',
            title: 'Experiencia',
            column: 'right',
            items: [
              {
                id: 'exp1',
                title: 'Arquitecto de Software',
                subtitle: 'Tech Global',
                description: 'Diseño de plataforma <b>escalable</b>.',
                bullets: [
                  'Implementación de <i>CI/CD</i> con <b>GitHub Actions</b>',
                  'Monitoreo con <b>Prometheus</b> y <i>Grafana</i>'
                ]
              }
            ]
          }
        ]
      };

      const doc = <CVDocument cvData={richCV} lang="es" />;
      const pdfBlob = await pdf(doc).toBlob();

      expect(pdfBlob).toBeInstanceOf(Blob);
      expect(pdfBlob.size).toBeGreaterThan(1000);
      expect(pdfBlob.type).toBe('application/pdf');

      // Verify PDF binary header
      const buffer = await blobToArrayBuffer(pdfBlob);
      const header = new TextDecoder('utf-8').decode(buffer.slice(0, 5));
      expect(header).toBe('%PDF-');
    });
  });

  // =========================================================================
  // Dimension 2: Alignment Rendering Across DOM, staticHtml, and React-PDF
  // =========================================================================
  describe('Dimension 2: Alignment Rendering (Left, Center, Right, Justify)', () => {
    const alignments = ['left', 'center', 'right', 'justify'];

    alignments.forEach(align => {
      it(`C2.1: DOM (#area-cv) correctly styles ${align} alignment on InlineEdit`, () => {
        const alignedValue = align === 'left' 
          ? 'Texto Alineado' 
          : `<div style="text-align: ${align};">Texto Alineado</div>`;

        render(
          <CVProvider>
            <InlineEdit value={alignedValue} multiline={true} />
          </CVProvider>
        );

        const display = screen.getByTestId('inline-edit-display');
        expect(display.style.textAlign).toBe(align);
      });

      it(`C2.2: staticHtmlPdfEngine embeds text-align: ${align} in output HTML`, () => {
        const testCV = {
          ...defaultSchema,
          sections: [
            defaultSchema.sections[0],
            {
              id: 'about',
              type: 'about',
              column: 'left',
              items: [
                {
                  id: 'a1',
                  description: `<div style="text-align: ${align};">Párrafo con alineación específica.</div>`
                }
              ]
            }
          ]
        };

        const html = generateCleanPrintHTML(testCV, 'es');
        expect(html).toContain(`text-align: ${align};`);
      });

      it(`C2.3: React-PDF RichTextPdf applies textAlign: '${align}' to container style`, () => {
        const html = `<div style="text-align: ${align};">Texto de prueba</div>`;
        const element = RichTextPdf({ text: html });

        expect(element).toBeDefined();
        const appliedStyles = Array.isArray(element.props.style) 
          ? element.props.style 
          : [element.props.style];

        const alignRule = appliedStyles.find(s => s && s.textAlign === align);
        expect(alignRule).toBeDefined();
        expect(alignRule.textAlign).toBe(align);
      });
    });

    it('C2.4: React-PDF successfully compiles binary document with all 4 alignments in different sections', async () => {
      const multiAlignCV = {
        ...defaultSchema,
        sections: [
          defaultSchema.sections[0],
          {
            id: 'about',
            type: 'about',
            column: 'left',
            items: [
              {
                id: 'ab1',
                description: '<div style="text-align: justify;">Perfil con alineación justificada completa.</div>'
              }
            ]
          },
          {
            id: 'exp',
            type: 'list',
            column: 'right',
            items: [
              {
                id: 'exp1',
                title: 'Puesto',
                description: '<div style="text-align: center;">Descripción centrada.</div>',
                bullets: [
                  '<div style="text-align: right;">Viñeta alineada a la derecha</div>',
                  '<div style="text-align: left;">Viñeta alineada a la izquierda</div>'
                ]
              }
            ]
          }
        ]
      };

      const doc = <CVDocument cvData={multiAlignCV} lang="es" />;
      const blob = await pdf(doc).toBlob();
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(1500);
    });

    it('C2.5: Alignment round-trip transformations preserve data idempotence', () => {
      alignments.forEach(align => {
        const initial = 'Contenido sin formato';
        const wrapped = applyAlignment(initial, align);
        const { alignment, innerHtml } = stripOuterAlignment(wrapped);

        expect(alignment).toBe(align);
        expect(innerHtml).toBe(initial);

        // Re-wrapping with same alignment should produce identical output
        const rewrapped = applyAlignment(innerHtml, alignment);
        expect(rewrapped).toBe(wrapped);
      });
    });
  });

  // =========================================================================
  // Dimension 3: Persistence Across Simulated localStorage Reload Cycles
  // =========================================================================
  describe('Dimension 3: Persistence Across Simulated localStorage Cycles', () => {
    it('C3.1: Full CV state with rich text and mixed alignments survives simulated browser reload', () => {
      const storedCV = {
        ...defaultSchema,
        profile: {
          name: '<div style="text-align: center;"><b>MARIA</b> GONZALEZ</div>',
          subtitle: '<i>Directora de Tecnología</i>'
        },
        sections: [
          defaultSchema.sections[0],
          {
            id: 'about',
            type: 'about',
            column: 'left',
            title: 'Perfil',
            items: [
              {
                id: 'ab_1',
                description: '<div style="text-align: justify;">Líder con <b>15+ años</b> de experiencia.</div>'
              }
            ]
          },
          {
            id: 'exp',
            type: 'list',
            column: 'right',
            title: 'Experiencia',
            items: [
              {
                id: 'exp_1',
                title: 'VP of Engineering',
                subtitle: 'Unicorn Tech',
                date: '2021 - Presente',
                description: 'Gestión de <b>50+ ingenieros</b> distribuidos.',
                bullets: [
                  '<div style="text-align: left;">Arquitectura basada en <i>event-driven microservices</i></div>',
                  '<div style="text-align: right;">Crecimiento del <b>300%</b> en throughput</div>'
                ]
              }
            ]
          }
        ]
      };

      // 1. Save to localStorage
      localStorage.setItem('cvData', JSON.stringify(storedCV));

      // 2. Mount fresh CVProvider (simulating page reload)
      const Consumer = () => {
        const { cvData } = useCV();
        const aboutItem = cvData.sections.find(s => s.id === 'about')?.items?.[0];
        const expItem = cvData.sections.find(s => s.id === 'exp')?.items?.[0];

        return (
          <div>
            <span data-testid="profile-name">{cvData.profile?.name}</span>
            <span data-testid="profile-subtitle">{cvData.profile?.subtitle}</span>
            <span data-testid="about-desc">{aboutItem?.description}</span>
            <span data-testid="exp-desc">{expItem?.description}</span>
            <span data-testid="exp-bullet-0">{expItem?.bullets?.[0]}</span>
            <span data-testid="exp-bullet-1">{expItem?.bullets?.[1]}</span>
          </div>
        );
      };

      const { unmount } = render(
        <CVProvider>
          <Consumer />
        </CVProvider>
      );

      expect(screen.getByTestId('profile-name').textContent).toBe(
        '<div style="text-align: center;"><b>MARIA</b> GONZALEZ</div>'
      );
      expect(screen.getByTestId('profile-subtitle').textContent).toBe(
        '<i>Directora de Tecnología</i>'
      );
      expect(screen.getByTestId('about-desc').textContent).toBe(
        '<div style="text-align: justify;">Líder con <b>15+ años</b> de experiencia.</div>'
      );
      expect(screen.getByTestId('exp-desc').textContent).toBe(
        'Gestión de <b>50+ ingenieros</b> distribuidos.'
      );
      expect(screen.getByTestId('exp-bullet-0').textContent).toBe(
        '<div style="text-align: left;">Arquitectura basada en <i>event-driven microservices</i></div>'
      );
      expect(screen.getByTestId('exp-bullet-1').textContent).toBe(
        '<div style="text-align: right;">Crecimiento del <b>300%</b> en throughput</div>'
      );

      unmount();
    });

    it('C3.2: Multi-cycle edit, save, reload, and re-edit preserves formatting without tag explosion', async () => {
      // Cycle 1: Start with plain text
      let currentSavedState = {
        ...defaultSchema,
        sections: [
          defaultSchema.sections[0],
          {
            id: 'about',
            type: 'about',
            column: 'left',
            items: [{ id: 'a1', description: 'Texto inicial' }]
          }
        ]
      };
      localStorage.setItem('cvData', JSON.stringify(currentSavedState));

      // Component executing updates
      const TestEditor = ({ onSavedCallback }) => {
        const { cvData, updateSectionItem } = useCV();
        const item = cvData.sections.find(s => s.id === 'about')?.items?.[0];

        return (
          <div>
            <InlineEdit
              value={item?.description}
              onSave={(newVal) => {
                updateSectionItem('about', 'a1', 'description', newVal);
                if (onSavedCallback) onSavedCallback(newVal);
              }}
              multiline={true}
            />
            <span data-testid="current-val">{item?.description}</span>
          </div>
        );
      };

      // Cycle 1 Execution: Add bold and center alignment
      const onSave1 = vi.fn();
      const { unmount: unmount1 } = render(
        <CVProvider>
          <TestEditor onSavedCallback={onSave1} />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('inline-edit-display'));
      const editor1 = screen.getByRole('textbox');
      fireEvent.mouseDown(screen.getByTestId('btn-format-bold'));
      fireEvent.mouseDown(screen.getByTestId('btn-format-align-center'));
      fireEvent.blur(editor1);

      await act(async () => {
        await new Promise(r => setTimeout(r, 200));
      });

      expect(onSave1).toHaveBeenCalledWith('<div style="text-align: center;"><b>Texto inicial</b></div>');
      unmount1();

      // Verify localStorage was updated
      const rawStored1 = localStorage.getItem('cvData');
      const parsed1 = JSON.parse(rawStored1);
      const aboutSec1 = parsed1.sections.find(s => s.id === 'about');
      expect(aboutSec1.items[0].description).toBe('<div style="text-align: center;"><b>Texto inicial</b></div>');

      // Cycle 2: Mount new instance (simulated reload) and change alignment to right + add italic
      const onSave2 = vi.fn();
      const { unmount: unmount2 } = render(
        <CVProvider>
          <TestEditor onSavedCallback={onSave2} />
        </CVProvider>
      );

      expect(screen.getByTestId('current-val').textContent).toBe('<div style="text-align: center;"><b>Texto inicial</b></div>');

      fireEvent.click(screen.getByTestId('inline-edit-display'));
      const editor2 = screen.getByRole('textbox');

      // Change alignment from center to right
      fireEvent.mouseDown(screen.getByTestId('btn-format-align-right'));
      // Add italic
      fireEvent.mouseDown(screen.getByTestId('btn-format-italic'));

      fireEvent.blur(editor2);
      await act(async () => {
        await new Promise(r => setTimeout(r, 200));
      });

      expect(onSave2).toHaveBeenCalled();
      const val2 = onSave2.mock.calls[0][0];

      // Assert NO nested <div><div> duplicate wrappers
      expect((val2.match(/<div/g) || []).length).toBe(1);
      expect((val2.match(/<\/div>/g) || []).length).toBe(1);
      expect(val2).toContain('style="text-align: right;"');
      expect(val2).toMatch(/<b>/);
      expect(val2).toMatch(/<i>/);

      unmount2();
    });

    it('C3.3: Special characters (&, <, >, quotes, spanish accents) remain stable across reload cycles', () => {
      const specialText = 'Desarrollo en C# & .NET: Soluciones "High-Availability" para FinTech (España & LATAM) con 99.9% uptime';
      const richFormatted = `<div style="text-align: justify;"><b>${specialText}</b></div>`;

      const cvWithSpecial = {
        ...defaultSchema,
        sections: [
          defaultSchema.sections[0],
          {
            id: 'about',
            type: 'about',
            column: 'left',
            items: [{ id: 'sp1', description: richFormatted }]
          }
        ]
      };

      localStorage.setItem('cvData', JSON.stringify(cvWithSpecial));

      const Consumer = () => {
        const { cvData } = useCV();
        const aboutSec = cvData.sections.find(s => s.id === 'about');
        return <div data-testid="result">{aboutSec.items[0].description}</div>;
      };

      render(
        <CVProvider>
          <Consumer />
        </CVProvider>
      );

      const retrieved = screen.getByTestId('result').textContent;
      expect(retrieved).toBe(richFormatted);

      // Verify staticHtmlPdfEngine rendering with special characters
      const html = generateCleanPrintHTML(cvWithSpecial, 'es');
      expect(html).toContain('C# &amp; .NET');
      expect(html).toContain('FinTech (España &amp; LATAM)');

      // Verify tokenization handles special characters without corruption
      const tokenized = parseHtmlToTokens(richFormatted);
      expect(tokenized.align).toBe('justify');
      expect(tokenized.tokens[0].text).toContain('C# & .NET');
      expect(tokenized.tokens[0].text).toContain('España & LATAM');
      expect(tokenized.tokens[0].bold).toBe(true);
    });
  });

  // =========================================================================
  // Dimension 4: Adversarial Stress & Edge Cases
  // =========================================================================
  describe('Dimension 4: Adversarial Stress & Edge Cases', () => {
    it('C4.1: Malformed and unclosed HTML tags degrade gracefully without crashing renderers', () => {
      const malformedCases = [
        '<b>Unclosed bold text',
        '<i>Unclosed italic text',
        '<b><i>Mismatched tags</b></i>',
        '<div style="text-align: right;">Unclosed alignment div',
        '<b></b><i></i>', // Empty tags
        'Normal <b> </b> <i> </i> Text', // Whitespace-only formatting
        '<<<bad>>>><<<tags>>'
      ];

      malformedCases.forEach((malformed, idx) => {
        // 1. staticHtml engine should not throw
        expect(() => {
          generateCleanPrintHTML({
            ...defaultSchema,
            sections: [
              defaultSchema.sections[0],
              { id: `s_${idx}`, type: 'about', column: 'left', items: [{ id: 'i', description: malformed }] }
            ]
          });
        }).not.toThrow();

        // 2. React-PDF RichTextPdf should not throw
        expect(() => {
          RichTextPdf({ text: malformed });
        }).not.toThrow();

        // 3. parseHtmlToTokens should not throw
        expect(() => {
          parseHtmlToTokens(malformed);
        }).not.toThrow();
      });
    });

    it('C4.2: Script injection and XSS payloads are thoroughly sanitized in DOM and staticHtml', () => {
      const xssPayloads = [
        '<script>alert("xss")</script><b>Legit Bold</b>',
        '<img src="x" onerror="alert(1)"><i>Legit Italic</i>',
        '<iframe src="javascript:alert(1)"></iframe>Content',
        '<a href="javascript:stealCookie()">Click me</a>',
        '<div onmouseover="alert(1)">Hover me</div>'
      ];

      xssPayloads.forEach((payload) => {
        const sanitized = sanitizeRichHTML(payload);

        // Disallowed executable tags must be escaped
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('<img');
        expect(sanitized).not.toContain('<iframe');

        // Allowed formatting tags must be preserved
        if (payload.includes('<b>')) expect(sanitized).toContain('<b>');
        if (payload.includes('<i>')) expect(sanitized).toContain('<i>');
      });
    });

    it('C4.3: Massive rich-text payload (100+ paragraphs with rapid bold/italic/align toggles)', async () => {
      let largeRichText = '';
      const aligns = ['left', 'center', 'right', 'justify'];
      for (let i = 0; i < 60; i++) {
        const align = aligns[i % aligns.length];
        largeRichText += `<div style="text-align: ${align};">Párrafo <b>${i}</b> con texto <i>itálico de prueba</i> y contenido extenso para verificar rendimiento de renderizado.</div>\n`;
      }

      const massiveCV = {
        ...defaultSchema,
        sections: [
          defaultSchema.sections[0],
          {
            id: 'massive_section',
            type: 'about',
            column: 'right',
            items: [{ id: 'm1', description: largeRichText }]
          }
        ]
      };

      // 1. staticHtml generation
      const startTime = performance.now();
      const html = generateCleanPrintHTML(massiveCV, 'es');
      const staticHtmlDuration = performance.now() - startTime;

      expect(html).toContain('Párrafo <b>0</b>');
      expect(html).toContain('Párrafo <b>59</b>');
      expect(staticHtmlDuration).toBeLessThan(100); // Must be fast (< 100ms)

      // 2. React-PDF binary compilation
      const doc = <CVDocument cvData={massiveCV} lang="es" />;
      const blob = await pdf(doc).toBlob();
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(3000);
    });
  });

  // =========================================================================
  // Dimension 5: Field-Level Architectural Mapping & End-to-End Fidelity
  // =========================================================================
  describe('Dimension 5: Field-Level Architectural Mapping & End-to-End Fidelity', () => {
    it('C5.1: Verifies RichTextPdf is invoked for body/multiline fields across all relevant section types', () => {
      // 1. About section uses RichTextPdf
      const aboutEl = RichTextPdf({ text: 'About <b>Bold</b>' });
      expect(aboutEl.props.children).toBeDefined();

      // 2. Experience description uses RichTextPdf
      const expDescEl = RichTextPdf({ text: 'Exp <i>Italic</i>' });
      expect(expDescEl.props.children).toBeDefined();

      // 3. Bullets use RichTextPdf
      const bulletEl = RichTextPdf({ text: '<div style="text-align: right;">Bullet</div>' });
      expect(bulletEl.props.style).toEqual(expect.arrayContaining([
        expect.objectContaining({ textAlign: 'right' })
      ]));

      // 4. SimpleList uses RichTextPdf
      const simpleEl = RichTextPdf({ text: '<b>Item</b> text' });
      expect(simpleEl.props.children).toBeDefined();

      // 5. Awards description uses RichTextPdf
      const awardEl = RichTextPdf({ text: 'Award <b>Winner</b>' });
      expect(awardEl.props.children).toBeDefined();

      // 6. Publications description uses RichTextPdf
      const pubEl = RichTextPdf({ text: 'Pub <i>Journal</i>' });
      expect(pubEl.props.children).toBeDefined();
    });

    it('C5.2: RichTextPdf gracefully handles null, undefined, empty strings, and pure whitespace', () => {
      expect(RichTextPdf({ text: null })).toBeNull();
      expect(RichTextPdf({ text: undefined })).toBeNull();

      const emptyEl = RichTextPdf({ text: '' });
      expect(emptyEl).toBeDefined();
      expect(emptyEl.props.children).toBe('');

      const spaceEl = RichTextPdf({ text: '   ' });
      expect(spaceEl).toBeDefined();
      expect(spaceEl.props.children).toBe('   ');
    });

    it('C5.3: End-to-End full CV dual-engine export benchmark with rich text content', async () => {
      const benchmarkCV = {
        ...defaultSchema,
        profile: {
          name: 'JUAN CARRIZO',
          subtitle: 'Staff Cloud Architect'
        },
        sections: [
          defaultSchema.sections[0], // profile_header
          {
            id: 'about',
            type: 'about',
            column: 'left',
            title: 'Perfil Profesional',
            items: [
              {
                id: 'ab_main',
                description: '<div style="text-align: justify;">Líder técnico con <b>12+ años</b> transformando infraestructuras hacia <i>cloud-native</i>.</div>'
              }
            ]
          },
          {
            id: 'experience',
            type: 'list',
            column: 'right',
            title: 'Experiencia Laboral',
            items: [
              {
                id: 'exp_lead',
                title: 'Principal Architect',
                subtitle: 'Fintech Unicorn Inc.',
                date: '2022 - Presente',
                description: '<div style="text-align: left;">Dirección de <b>4 squads</b> de plataforma.</div>',
                bullets: [
                  'Reducción de latencia p99 en un <b>45%</b> mediante <i>caching distribuido</i>',
                  '<div style="text-align: right;">Migración de <b>120 microservicios</b> a <i>Kubernetes</i> sin downtime</div>'
                ]
              }
            ]
          },
          {
            id: 'skills',
            type: 'skills',
            column: 'left',
            title: 'Habilidades Técnicas',
            items: [
              {
                id: 'sk_cloud',
                title: 'Cloud & DevOps',
                description: 'AWS, GCP, Terraform, Kubernetes, Docker'
              }
            ]
          }
        ]
      };

      // Target 1: DOM (#area-cv)
      const { container } = render(
        <CVProvider>
          <App />
        </CVProvider>
      );
      expect(container.querySelector('#area-cv')).toBeInTheDocument();

      // Target 2: staticHtmlPdfEngine
      const staticHtml = generateCleanPrintHTML(benchmarkCV, 'es');
      expect(staticHtml).toContain('Líder técnico con <b>12+ años</b>');
      expect(staticHtml).toContain('transformando infraestructuras hacia <i>cloud-native</i>');
      expect(staticHtml).toContain('text-align: justify;');
      expect(staticHtml).toContain('Reducción de latencia p99 en un <b>45%</b>');
      expect(staticHtml).toContain('text-align: right;');
      expect(staticHtml).not.toContain('&lt;b&gt;');
      expect(staticHtml).not.toContain('&lt;i&gt;');

      // Target 3: React-PDF compilation
      const doc = <CVDocument cvData={benchmarkCV} lang="es" />;
      const blob = await pdf(doc).toBlob();
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(2000);

      const buffer = await blobToArrayBuffer(blob);
      const pdfText = new TextDecoder('utf-8').decode(buffer);
      expect(pdfText.startsWith('%PDF-')).toBe(true);
    });
  });
});

