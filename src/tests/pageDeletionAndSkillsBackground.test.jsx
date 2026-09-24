import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CVProvider, useCV } from '../context/CVContext';
import ActionMenu from '../components/Editor/ActionMenu';
import A4PageGuides from '../components/Editor/A4PageGuides';
import { deletePageFromDOMAndState } from '../utils/pageDeletionEngine';
import baseStyles from '../index.css?raw';
import printStyles from '../styles/print.css?raw';
import { generateCleanPrintHTML } from '../utils/staticHtmlPdfEngine';

describe('Skills Bullet Points Background Parity & Delete Page Feature', () => {
  describe('Skills Bullet Points Background Root Fix', () => {
    it('S1: ensures .resume--ats-mode .skills__name does NOT have background: #f8fafc', () => {
      // In src/index.css, .skills__name must NOT have background #f8fafc
      expect(baseStyles).not.toMatch(/\.resume--ats-mode\s+\.skills__name[^{]*\{[^}]*background:\s*#f8fafc/);
    });

    it('S2: ensures .skills__name has background transparent in print.css', () => {
      expect(printStyles).toMatch(/\.skills__name[\s\S]*?background:\s*transparent\s*!important/);
    });

    it('S3: generated clean print HTML for ATS mode has no #f8fafc background on skills__name', () => {
      const atsData = {
        layout: { isAtsMode: true, type: '1-column' },
        sections: [
          {
            id: 'skills_1',
            type: 'skills',
            title: 'Habilidades',
            items: [
              { id: 'sk_1', title: 'React', description: 'Advanced' }
            ]
          }
        ]
      };
      const html = generateCleanPrintHTML(atsData);
      expect(html).toContain('skills__name');
      // Must not match any style rule assigning #f8fafc to skills__name
      expect(html).not.toMatch(/\.skills__name[^{]*\{[^}]*background:\s*#f8fafc/);
    });
  });

  describe('Eliminar Página Feature (Destroy from DOM & State, Reorder the rest)', () => {
    let containerEl;

    beforeEach(() => {
      containerEl = document.createElement('div');
      containerEl.id = 'area-cv';
      containerEl.setAttribute('data-total-pages', '2');
      document.body.appendChild(containerEl);
    });

    afterEach(() => {
      if (containerEl && containerEl.parentNode) {
        containerEl.parentNode.removeChild(containerEl);
      }
    });

    it('P1: deletePageFromDOMAndState destroys target page elements from DOM and state', () => {
      // Create DOM elements for Page 1 and Page 2
      // Page 1: 0 - 1123px
      const sec1 = document.createElement('section');
      sec1.id = 'sec_1';
      sec1.setAttribute('data-section-id', 'sec_1');
      sec1.getBoundingClientRect = () => ({ top: 100, bottom: 400, height: 300, width: 794 });
      containerEl.appendChild(sec1);

      // Page 2: starts around 1143px (1123 + 20)
      const sec2 = document.createElement('section');
      sec2.id = 'sec_2';
      sec2.setAttribute('data-section-id', 'sec_2');
      sec2.getBoundingClientRect = () => ({ top: 1200, bottom: 1500, height: 300, width: 794 });
      containerEl.appendChild(sec2);

      containerEl.getBoundingClientRect = () => ({ top: 0, bottom: 2300, height: 2300, width: 794 });

      const cvData = {
        sections: [
          { id: 'sec_1', type: 'experience', title: 'Experiencia 1', items: [{ id: 'i1' }] },
          { id: 'sec_2', type: 'experience', title: 'Experiencia 2', items: [{ id: 'i2' }] },
        ]
      };

      let updatedState = null;
      const applyStateWithHistory = (fn) => {
        updatedState = typeof fn === 'function' ? fn(cvData) : fn;
      };

      const showToast = vi.fn();
      const result = deletePageFromDOMAndState({
        areaCv: containerEl,
        cvData,
        applyStateWithHistory,
        pageNumber: 2,
        showToast
      });

      expect(result.success).toBe(true);
      expect(result.deletedPage).toBe(2);

      // sec2 must be removed from the DOM!
      expect(containerEl.querySelector('#sec_2')).toBeNull();
      // sec1 must remain in the DOM
      expect(containerEl.querySelector('#sec_1')).not.toBeNull();

      // State must have sec2 removed and only sec1 remaining
      expect(updatedState.sections.length).toBe(1);
      expect(updatedState.sections[0].id).toBe('sec_1');
      expect(showToast).toHaveBeenCalled();
    });

    it('P2: prevents deleting the only page when totalPages is 1', () => {
      containerEl.setAttribute('data-total-pages', '1');
      const cvData = {
        sections: [{ id: 'sec_1', type: 'experience' }]
      };
      const showToast = vi.fn();
      const applyStateWithHistory = vi.fn();

      const result = deletePageFromDOMAndState({
        areaCv: containerEl,
        cvData,
        applyStateWithHistory,
        showToast
      });

      expect(result.success).toBe(false);
      expect(applyStateWithHistory).not.toHaveBeenCalled();
      expect(showToast).toHaveBeenCalledWith(
        expect.stringContaining('1 página'),
        'warning',
        expect.any(Number)
      );
    });

    it('P3: ActionMenu renders exterior delete page button', () => {
      render(
        <CVProvider>
          <ActionMenu />
        </CVProvider>
      );

      const deleteBtn = screen.getByTestId('btn-delete-page');
      expect(deleteBtn).toBeInTheDocument();
      expect(deleteBtn.getAttribute('aria-label')).toBe('Eliminar página');
    });

    it('P4: A4PageGuides renders delete button on page fold badge and triggers onDeletePage', () => {
      const onDeletePage = vi.fn();
      render(
        <A4PageGuides
          totalPages={2}
          pagePadding={24}
          onDeletePage={onDeletePage}
        />
      );

      const foldDeleteBtn = screen.getByTestId('btn-delete-page-2');
      expect(foldDeleteBtn).toBeInTheDocument();
      fireEvent.click(foldDeleteBtn);
      expect(onDeletePage).toHaveBeenCalledWith(2);
    });
  });
});
