import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ColorPickerSwatch from '../components/Editor/ColorPickerSwatch';
import SectionBulletStylePopover from '../components/Editor/SectionBulletStylePopover';
import BaseSection from '../components/CV/BaseSection';
import AddSectionModal from '../components/Editor/AddSectionModal';
import App from '../App';
import { CVProvider, useCV } from '../context/CVContext';
import { 
  getBulletClasses, 
  DEFAULT_BULLET_STYLE, 
  supportsBulletCustomization 
} from '../utils/bulletStyles';
import { generateCleanPrintHTML } from '../utils/staticHtmlPdfEngine';
import { setupDisableNativeTooltips } from '../utils/disableNativeTooltips';

describe('Goal Verification: Visual Polish & State Mirroring Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ==========================================================
  // 1. DYNAMIC BULLET CONTRAST & ADAPTATION (Item 1)
  // ==========================================================
  describe('1. Dynamic Bullet Contrast & Adaptation', () => {
    it('adapts text color variables dynamically based on background luminance', () => {
      // Light background: YIQ >= 128 -> dark text colors
      const lightCv = {
        layout: { type: '2-column', leftBg: '#ffffff', rightBg: '#fafafa' },
        sections: [
          {
            id: 'exp_sec',
            type: 'list',
            column: 'left',
            title: 'EXPERIENCIA',
            items: [
              {
                id: 'exp_1',
                title: 'Senior Engineer',
                bullets: ['Logro importante en backend']
              }
            ]
          }
        ]
      };

      const lightHtml = generateCleanPrintHTML(lightCv);
      expect(lightHtml).toContain('--text-color: #403a3a');
      expect(lightHtml).toContain('--title-color: #0b0a0a');

      // Dark background: YIQ < 128 -> light text colors
      const darkCv = {
        layout: { type: '2-column', leftBg: '#0f172a', rightBg: '#ffffff' },
        sections: [
          {
            id: 'exp_sec',
            type: 'list',
            column: 'left',
            title: 'EXPERIENCIA',
            items: [
              {
                id: 'exp_1',
                title: 'Senior Engineer',
                bullets: ['Logro importante en backend']
              }
            ]
          }
        ]
      };

      const darkHtml = generateCleanPrintHTML(darkCv);
      expect(darkHtml).toContain('--text-color: #f0efef');
      expect(darkHtml).toContain('--title-color: #fcfcfc');
    });

    it('ensures static print HTML applies text-color to bullet lists and spans', () => {
      const sampleCv = {
        layout: { type: '1-column' },
        sections: [
          {
            id: 'skills_sec',
            type: 'skills',
            title: 'HABILIDADES',
            items: [{ id: 's1', title: 'Languages', description: 'Go, Rust, Python' }]
          }
        ]
      };

      const html = generateCleanPrintHTML(sampleCv);
      expect(html).toContain('.experience__bullets,');
      expect(html).toContain('color: var(--text-color) !important;');
    });

    it('ensures BaseItem and BaseSection establish color: var(--text-color) for free-text inheritance', () => {
      render(
        <CVProvider>
          <BaseSection
            section={{
              id: 'sec_about',
              type: 'about',
              title: 'SOBRE MÍ',
              items: [{ id: 'about_1', description: 'Desarrollador Full Stack orientado a performance.' }]
            }}
          />
        </CVProvider>
      );

      const sectionElem = document.getElementById('sec_about');
      expect(sectionElem).toBeInTheDocument();
      expect(sectionElem.style.color).toBe('var(--text-color)');

      const itemElem = sectionElem.querySelector('.profile__description');
      expect(itemElem).toBeInTheDocument();
      expect(itemElem.style.color).toBe('var(--text-color)');

      const inlineEdit = itemElem.querySelector('.inline-edit-display');
      expect(inlineEdit).toBeInTheDocument();
      expect(inlineEdit.style.color).toBe('inherit');
    });

    it('ensures static print HTML includes free-text containers in the dynamic contrast block', () => {
      const sampleCv = {
        layout: { type: '2-column', leftBg: '#0f172a' },
        sections: [
          {
            id: 'sec_about',
            type: 'about',
            column: 'left',
            title: 'SOBRE MÍ',
            items: [{ id: 'about_1', description: 'Texto libre de perfil.' }]
          }
        ]
      };

      const html = generateCleanPrintHTML(sampleCv);
      expect(html).toContain('.profile__description,');
      expect(html).toContain('.experience__description');
      expect(html).toContain('color: var(--text-color);');
    });
  });

  // ==========================================================
  // 2. COLOR PICKER SWATCH & SYNCHRONIZED HEX (Item 2)
  // ==========================================================
  describe('2. ColorPickerSwatch with Circular Picker & Synced HEX Input', () => {
    it('renders circular swatch button and synchronized HEX text field', () => {
      const onChange = vi.fn();
      render(
        <ColorPickerSwatch
          label="Fondo Columna Lateral"
          value="#fafafa"
          onChange={onChange}
        />
      );

      expect(screen.getByText('Fondo Columna Lateral')).toBeInTheDocument();
      const hexInput = screen.getByLabelText('Fondo Columna Lateral');
      expect(hexInput).toHaveValue('#fafafa');
    });

    it('updates in real time when user types a valid hex code', () => {
      const onChange = vi.fn();
      render(
        <ColorPickerSwatch
          label="Fondo Columna Lateral"
          value="#ffffff"
          onChange={onChange}
        />
      );

      const hexInput = screen.getByLabelText('Fondo Columna Lateral');
      fireEvent.change(hexInput, { target: { value: '#10b981' } });

      expect(onChange).toHaveBeenCalledWith('#10b981');
    });

    it('automatically prefixes # if user omitted it', () => {
      const onChange = vi.fn();
      render(
        <ColorPickerSwatch
          label="Color Test"
          value="#ffffff"
          onChange={onChange}
        />
      );

      const hexInput = screen.getByLabelText('Color Test');
      fireEvent.change(hexInput, { target: { value: '3874ff' } });

      expect(onChange).toHaveBeenCalledWith('#3874ff');
    });

    it('reverts to last valid value on blur if input is invalid hex', () => {
      const onChange = vi.fn();
      render(
        <ColorPickerSwatch
          label="Color Test"
          value="#ffffff"
          onChange={onChange}
        />
      );

      const hexInput = screen.getByLabelText('Color Test');
      fireEvent.change(hexInput, { target: { value: 'invalid-color' } });
      fireEvent.blur(hexInput);

      expect(hexInput).toHaveValue('#ffffff');
    });

    it('selects preset color when clicking preset pill', () => {
      const onChange = vi.fn();
      render(
        <ColorPickerSwatch
          label="Color Presets"
          value="#ffffff"
          onChange={onChange}
          presets={['#0f172a', '#fafafa']}
        />
      );

      const presetBtn = screen.getByTitle('#0f172a');
      fireEvent.click(presetBtn);

      expect(onChange).toHaveBeenCalledWith('#0f172a');
    });
  });

  // ==========================================================
  // 3. CONTINUOUS LEFT COLUMN BACKGROUND STRETCH (Item 3)
  // ==========================================================
  describe('3. Left Column Continuous Background Stretch', () => {
    it('applies dual-column linear gradient and 100% height stretch on #area-cv', () => {
      render(
        <CVProvider>
          <App />
        </CVProvider>
      );

      const areaCv = document.getElementById('area-cv');
      expect(areaCv).toBeInTheDocument();
      // Verifies linear-gradient is present on master container or page box background
      const pageBox = document.querySelector('.a4-page-box') || areaCv;
      expect(pageBox.style.background).toContain('linear-gradient');

      const colLeft = document.getElementById('column-left');
      expect(colLeft.style.minHeight).toBe('100%');
      expect(colLeft.style.height).toBe('100%');
      expect(colLeft.style.alignSelf).toBe('stretch');
    });

    it('embeds continuous linear-gradient and stretch in static clean print HTML', () => {
      const sampleCv = {
        layout: { type: '2-column', leftBg: '#e2e8f0', rightBg: '#ffffff', leftColumnWidth: 35 },
        sections: [
          { id: 'sec1', type: 'list', column: 'left', title: 'SEC 1', items: [{ id: 'i1', title: 'T1' }] }
        ]
      };

      const html = generateCleanPrintHTML(sampleCv);
      expect(html).toContain('linear-gradient(to right, #e2e8f0 0%, #e2e8f0 35%, #ffffff 35%, #ffffff 100%)');
      expect(html).toContain('align-self: stretch');
    });
  });

  // ==========================================================
  // 4. BULLET & TIMELINE CUSTOMIZATION (Item 4)
  // ==========================================================
  describe('4. Bullet & Timeline Customization per Container', () => {
    it('computes correct CSS classes for bulletStyle combinations', () => {
      expect(getBulletClasses({ size: 'normal', variant: 'bold', showLine: true }))
        .toBe('bullet-size-normal bullet-variant-bold');

      expect(getBulletClasses({ size: 'large', variant: 'gray', showLine: false }))
        .toBe('bullet-size-large bullet-variant-gray bullet-line-none');

      expect(getBulletClasses({ size: 'normal', variant: 'circle', showLine: true }))
        .toBe('bullet-size-normal bullet-variant-circle');
    });

    it('detects which section types support bullet customization', () => {
      expect(supportsBulletCustomization('projects')).toBe(true);
      expect(supportsBulletCustomization('list')).toBe(true);
      expect(supportsBulletCustomization('experience')).toBe(true);
      expect(supportsBulletCustomization('education')).toBe(true);
      expect(supportsBulletCustomization('skills')).toBe(false);
      expect(supportsBulletCustomization('simple_list')).toBe(false);
      expect(supportsBulletCustomization('profile_header')).toBe(false);
    });

    it('renders bullet style popover and updates section style', () => {
      const onUpdateStyle = vi.fn();
      const onClose = vi.fn();

      render(
        <SectionBulletStylePopover
          isOpen={true}
          onClose={onClose}
          bulletStyle={{ size: 'normal', variant: 'bold', showLine: true }}
          onUpdateStyle={onUpdateStyle}
        />
      );

      expect(screen.getByTestId('bullet-style-popover')).toBeInTheDocument();

      // Change size to large
      fireEvent.click(screen.getByTestId('bullet-size-large'));
      expect(onUpdateStyle).toHaveBeenCalledWith({ size: 'large' });

      // Change variant to circle (anillo)
      fireEvent.click(screen.getByTestId('bullet-variant-circle'));
      expect(onUpdateStyle).toHaveBeenCalledWith({ variant: 'circle' });

      // Hide line
      fireEvent.click(screen.getByTestId('bullet-line-hide'));
      expect(onUpdateStyle).toHaveBeenCalledWith({ showLine: false });
    });

    it('allows choosing bullet style in AddSectionModal and initializes container with it', () => {
      let capturedState = null;
      const StateObserver = () => {
        const { cvData } = useCV();
        capturedState = cvData;
        return null;
      };

      render(
        <CVProvider>
          <StateObserver />
          <AddSectionModal isOpen={true} onClose={() => {}} targetColumn="right" />
        </CVProvider>
      );

      // Select projects section
      const projectsCard = screen.getByTestId('add-section-card-projects');
      fireEvent.click(projectsCard);

      const addedProjectSec = capturedState.sections.find(s => s.type === 'projects');
      expect(addedProjectSec).toBeDefined();
      expect(addedProjectSec.bulletStyle).toBeDefined();
      expect(addedProjectSec.bulletStyle.size).toBe('normal');
      expect(addedProjectSec.bulletStyle.variant).toBe('bold');
    });

    it('renders floating action buttons in the coherent order: TOOLTIPS - 3 PUNTITOS - ELIMINAR', () => {
      const mockSection = {
        id: 'experience',
        type: 'experience',
        title: 'EXPERIENCIA LABORAL',
        items: [],
        bulletStyle: { size: 'normal', variant: 'bold', showLine: true }
      };

      render(
        <CVProvider>
          <BaseSection section={mockSection} />
        </CVProvider>
      );

      // Verify the dedicated action buttons container exists
      const actionContainer = screen.getByTestId('section-actions-experience');
      expect(actionContainer).toBeInTheDocument();
      expect(actionContainer).toHaveClass('section-action-buttons');

      // Verify children buttons and their order: TOOLTIPS - 3 PUNTITOS - ELIMINAR
      const buttons = actionContainer.querySelectorAll('button');
      expect(buttons.length).toBe(3);
      expect(buttons[0]).toHaveClass('section-tips-toggle-btn');
      expect(buttons[1]).toHaveClass('section-bullet-style-btn');
      expect(buttons[2]).toHaveClass('section-del-btn');

      // Click the 3-dots button to open the popover
      fireEvent.click(buttons[1]);
      expect(screen.getByTestId('bullet-style-popover')).toBeInTheDocument();
      expect(actionContainer).toHaveClass('has-active-popover');
    });

    it('allows deleting simple bullet points within composite sections like Experience', () => {
      let capturedContext = null;
      const Inspector = () => {
        const ctx = useCV();
        capturedContext = ctx;
        return null;
      };

      const customCv = {
        sections: [
          {
            id: 'exp_sec',
            type: 'list',
            column: 'right',
            title: 'EXPERIENCIA',
            items: [
              {
                id: 'job_1',
                title: 'Software Developer',
                bullets: ['Viñeta 1 para borrar', 'Viñeta 2 persistente']
              }
            ]
          }
        ]
      };
      localStorage.setItem('cvData', JSON.stringify(customCv));

      render(
        <CVProvider>
          <Inspector />
          <App />
        </CVProvider>
      );

      // Verify bullet rows rendered
      const deleteButtons = screen.getAllByTitle('Eliminar esta viñeta');
      expect(deleteButtons.length).toBe(2);

      // Click delete on the first bullet
      fireEvent.click(deleteButtons[0]);

      // Check context state
      const updatedJob = capturedContext.cvData.sections
        .find(s => s.id === 'exp_sec').items
        .find(i => i.id === 'job_1');
      expect(updatedJob.bullets).toEqual(['Viñeta 2 persistente']);
    });
  });

  // ==========================================================
  // 5. TEXT CONTENT & JSON MIRRORING INVARIANT (Item 5)
  // ==========================================================
  describe('5. Exhaustive Text Content & JSON Mirroring Invariant', () => {
    it('mirrors visual updates directly into cvData state and localStorage with zero hardcoded overrides', () => {
      let capturedContext = null;
      const Inspector = () => {
        const ctx = useCV();
        capturedContext = ctx;
        return (
          <div data-testid="test-inspector">
            <span data-testid="section-count">{ctx.cvData.sections.length}</span>
          </div>
        );
      };

      render(
        <CVProvider>
          <Inspector />
          <App />
        </CVProvider>
      );

      // 1. Update Section Title
      act(() => {
        capturedContext.updateSectionTitle('experience', 'TRAYECTORIA PROFESIONAL');
      });

      expect(capturedContext.cvData.sections.find(s => s.id === 'experience').title)
        .toBe('TRAYECTORIA PROFESIONAL');

      // 2. Update Section Bullet Style
      act(() => {
        capturedContext.updateSectionBulletStyle('experience', {
          size: 'large',
          variant: 'circle',
          showLine: false
        });
      });

      const updatedExp = capturedContext.cvData.sections.find(s => s.id === 'experience');
      expect(updatedExp.bulletStyle.size).toBe('large');
      expect(updatedExp.bulletStyle.variant).toBe('circle');
      expect(updatedExp.bulletStyle.showLine).toBe(false);

      // 3. Verify LocalStorage Mirroring
      const savedInStorage = JSON.parse(localStorage.getItem('cvData'));
      const storedExp = savedInStorage.sections.find(s => s.id === 'experience');
      expect(storedExp.title).toBe('TRAYECTORIA PROFESIONAL');
      expect(storedExp.bulletStyle.size).toBe('large');
      expect(storedExp.bulletStyle.variant).toBe('circle');

      // 4. Verify Static Print Engine accurately mirrors user-edited state
      const html = generateCleanPrintHTML(savedInStorage);
      expect(html).toContain('TRAYECTORIA PROFESIONAL');
      expect(html).toContain('bullet-size-large');
      expect(html).toContain('bullet-variant-circle');
      expect(html).toContain('bullet-line-none');
    });
  });

  // ==========================================================
  // 6. NATIVE BROWSER TOOLTIP SUPPRESSION (Single Global Rule)
  // ==========================================================
  describe('6. Global Native Browser Tooltip Suppression', () => {
    it('suppresses native browser tooltips on hover and restores on mouseout', () => {
      setupDisableNativeTooltips();

      const btn = document.createElement('button');
      btn.setAttribute('title', 'Eliminar elemento');
      document.body.appendChild(btn);

      expect(btn.getAttribute('title')).toBe('Eliminar elemento');

      // Mouse enters: native title is suppressed to prevent browser OS tooltip
      btn.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true }));

      expect(btn.getAttribute('title')).toBeNull();
      expect(btn.getAttribute('data-native-title')).toBe('Eliminar elemento');
      expect(btn.getAttribute('aria-label')).toBe('Eliminar elemento');

      // Mouse leaves: native title restored
      btn.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, cancelable: true, relatedTarget: document.body }));

      expect(btn.getAttribute('title')).toBe('Eliminar elemento');
      expect(btn.getAttribute('data-native-title')).toBeNull();

      btn.remove();
    });
  });
});
