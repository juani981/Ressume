import { describe, it, expect, vi } from 'vitest';
import {
  sanitizeFileName,
  getDynamicPdfTitle,
  generateCleanPrintHTML,
  executeCleanPrint
} from '../utils/staticHtmlPdfEngine';
import { defaultSchema } from '../utils/schema';

describe('PDF Export Filename Parametrization & Document Title Engine', () => {
  describe('Pillar 1: sanitizeFileName Utility', () => {
    it('removes and replaces filesystem illegal characters with underscores', () => {
      expect(sanitizeFileName('CV/Senior:2026*?<>|"test')).toBe('CV_Senior_2026_test');
    });

    it('collapses multiple whitespace into a single space and trims edges', () => {
      expect(sanitizeFileName('   CV    Juan    Pérez   ')).toBe('CV Juan Pérez');
    });

    it('removes leading and trailing periods', () => {
      expect(sanitizeFileName('...CV Juan Pérez...')).toBe('CV Juan Pérez');
    });

    it('handles falsy or non-string inputs safely', () => {
      expect(sanitizeFileName(null)).toBe('');
      expect(sanitizeFileName(undefined)).toBe('');
      expect(sanitizeFileName(12345)).toBe('');
      expect(sanitizeFileName('')).toBe('');
    });
  });

  describe('Pillar 2: getDynamicPdfTitle Resolution Logic', () => {
    it('uses saved version name when cvData.versionName is present', () => {
      const cvData = {
        versionName: 'CV Desarrollador Full-Stack 2026',
        profile: {
          name: 'Carlos Ruiz',
          subtitle: 'Tech Lead'
        }
      };

      expect(getDynamicPdfTitle(cvData)).toBe('CV Desarrollador Full-Stack 2026');
    });

    it('uses activeVersionName if versionName is omitted', () => {
      const cvData = {
        activeVersionName: 'Version Ingles Senior',
        profile: {
          name: 'Ana Gómez',
          subtitle: 'Software Architect'
        }
      };

      expect(getDynamicPdfTitle(cvData)).toBe('Version Ingles Senior');
    });

    it('sanitizes illegal characters in saved version names', () => {
      const cvData = {
        versionName: 'CV: Dev/Full-Stack *2026*?',
        profile: {
          name: 'Carlos Ruiz',
          subtitle: 'Tech Lead'
        }
      };

      expect(getDynamicPdfTitle(cvData)).toBe('CV_ Dev_Full-Stack _2026_');
    });

    it('defaults to CV_${profileName}_${profileSubtitle} when no saved version exists', () => {
      const cvData = {
        profile: {
          name: 'Juan Pérez',
          subtitle: 'Senior Frontend Developer'
        }
      };

      expect(getDynamicPdfTitle(cvData)).toBe('CV_Juan Pérez_Senior Frontend Developer');
    });

    it('falls back to CV_${profileName} when profileSubtitle is missing', () => {
      const cvData = {
        profile: {
          name: 'Juan Pérez',
          subtitle: ''
        }
      };

      expect(getDynamicPdfTitle(cvData)).toBe('CV_Juan Pérez');
    });

    it('falls back to CV_${profileSubtitle} when profileName is missing', () => {
      const cvData = {
        profile: {
          name: '',
          subtitle: 'Full-Stack Developer'
        }
      };

      expect(getDynamicPdfTitle(cvData)).toBe('CV_Full-Stack Developer');
    });

    it('resolves profile name and subtitle from profile_header section if profile object is empty', () => {
      const cvData = {
        sections: [
          {
            id: 'profile_header',
            items: [
              {
                name: 'Mariana López',
                subtitle: 'DevOps Engineer'
              }
            ]
          }
        ]
      };

      expect(getDynamicPdfTitle(cvData)).toBe('CV_Mariana López_DevOps Engineer');
    });

    it('strips rich text / HTML tags from profile name and subtitle before composing default filename', () => {
      const cvData = {
        profile: {
          name: '<b>Juan <i>Pérez</i></b>',
          subtitle: '<span>Senior &amp; Architect</span>'
        }
      };

      expect(getDynamicPdfTitle(cvData)).toBe('CV_Juan Pérez_Senior & Architect');
    });

    it('handles defaultSchema cleanly and sanitizes slashes in placeholder subtitle', () => {
      const title = getDynamicPdfTitle(defaultSchema);
      expect(title).toContain('CV_TU NOMBRE Y APELLIDO_');
      expect(title).not.toContain('/'); // slashes should be sanitized
    });

    it('returns "CV" fallback for completely blank/empty cvData', () => {
      expect(getDynamicPdfTitle(null)).toBe('CV');
      expect(getDynamicPdfTitle({})).toBe('CV');
      expect(getDynamicPdfTitle({ profile: { name: '', subtitle: '' } })).toBe('CV');
    });
  });

  describe('Pillar 3: Clean Print HTML and Execution Lifecycle Integration', () => {
    it('sets <title> tag in generateCleanPrintHTML matching getDynamicPdfTitle', () => {
      // 1. Default unsaved format
      const defaultData = {
        profile: {
          name: 'Laura Rossi',
          subtitle: 'Data Scientist'
        }
      };
      const html1 = generateCleanPrintHTML(defaultData);
      expect(html1).toContain('<title>CV_Laura Rossi_Data Scientist</title>');

      // 2. Saved version format
      const savedData = {
        ...defaultData,
        versionName: 'Mi CV Internacional 2026'
      };
      const html2 = generateCleanPrintHTML(savedData);
      expect(html2).toContain('<title>Mi CV Internacional 2026</title>');
    });

    it('sets iframe doc.title in executeCleanPrint to match getDynamicPdfTitle', async () => {
      let assignedDocTitle = '';

      vi.spyOn(document.body, 'appendChild').mockImplementation(function (child) {
        if (child.tagName === 'IFRAME') {
          Object.defineProperty(child, 'contentWindow', {
            configurable: true,
            value: {
              document: {
                open: vi.fn(),
                write: vi.fn(),
                close: vi.fn(),
                readyState: 'complete',
                body: { scrollHeight: 800, style: {} },
                set title(val) {
                  assignedDocTitle = val;
                },
                get title() {
                  return assignedDocTitle;
                }
              },
              focus: vi.fn(),
              print: vi.fn(),
              close: vi.fn()
            }
          });
        }
        return HTMLBodyElement.prototype.appendChild.call(this, child);
      });

      const cvData = {
        versionName: 'Version Exportable v3',
        profile: {
          name: 'Marcos Díaz',
          subtitle: 'Cloud Engineer'
        }
      };

      await executeCleanPrint(cvData);
      expect(assignedDocTitle).toBe('Version Exportable v3');
    });
  });
});
