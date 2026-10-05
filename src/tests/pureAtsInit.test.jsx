/**
 * pureAtsInit.test.jsx
 *
 * Verifies ATS-08: Pure ATS Golden Template initialization, default schema contract,
 * storage fallback integrity, and strict adherence to AGENTS.md Invariant 19 spacing constants.
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { getAtsGoldenSchemaTemplate } from '../utils/atsSchemaTemplate';
import { loadInitialCVData, ensureProfileHeader } from '../context/hooks/useCVData';
import { defaultSchema } from '../utils/schema';
import { CVProvider, useCV } from '../context/CVContext';

describe('ATS-08: Pure ATS Initialization & Default Schema Contract', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('1. Golden ATS Schema Template Contract', () => {
    it('initializes with single-column ATS layout mode', () => {
      const template = getAtsGoldenSchemaTemplate('es');

      expect(template.layout).toBeDefined();
      expect(template.layout.type).toBe('1-column');
      expect(template.layout.isAtsMode).toBe(true);
    });

    it('enforces Invariant 19 canonical spacing and typography tokens', () => {
      const template = getAtsGoldenSchemaTemplate('es');
      const { layout } = template;

      // Invariant 19: pagePadding: 24, sectionGap: 12, itemGap: 6, lineHeight: 1.30
      expect(layout.pagePadding).toBe(24);
      expect(layout.sectionGap).toBe(12);
      expect(layout.itemGap).toBe(6);
      expect(layout.lineHeight).toBe(1.3);
    });

    it('includes complete ATS profile header with professional contacts', () => {
      const template = getAtsGoldenSchemaTemplate('es');
      const profile = template.profile;

      expect(profile).toBeDefined();
      expect(profile.name).toBeTruthy();
      expect(profile.subtitle).toBeTruthy();

      const headerSection = template.sections.find((s) => s.type === 'profile_header');
      expect(headerSection).toBeDefined();
      expect(headerSection.items[0].subtitle).toBeTruthy();
      expect(Array.isArray(headerSection.items[0].contacts)).toBe(true);
      expect(headerSection.items[0].contacts.length).toBeGreaterThanOrEqual(4);

      // Verify contact types
      const contactTypes = headerSection.items[0].contacts.map((c) => c.type);
      expect(contactTypes).toContain('email');
      expect(contactTypes).toContain('phone');
      expect(contactTypes).toContain('location');
    });

    it('includes essential ATS sections in single-column sequence', () => {
      const template = getAtsGoldenSchemaTemplate('es');
      const sections = template.sections;

      expect(Array.isArray(sections)).toBe(true);
      expect(sections.length).toBeGreaterThanOrEqual(3);

      const sectionIds = sections.map((s) => s.id);
      expect(sectionIds).toContain('experience');
      expect(sectionIds).toContain('skills');
      expect(sectionIds).toContain('education');
    });
  });

  describe('2. loadInitialCVData Storage Fallback & Test Isolation', () => {
    it('loads custom CV data from localStorage when present in test environment', () => {
      const customCV = {
        profile: { name: 'MARIA GARCIA', role: 'Staff Engineer' },
        sections: [{ id: 'sec_custom', type: 'experience', title: 'Experiencia', items: [] }],
        layout: { type: '1-column', isAtsMode: true, sectionGap: 14 }
      };

      localStorage.setItem('cvData', JSON.stringify(customCV));

      const loaded = loadInitialCVData();
      expect(loaded.profile.name).toBe('MARIA GARCIA');
      expect(loaded.layout.sectionGap).toBe(14);
      // ensureProfileHeader and ensureContactSection guarantee header and contact exist
      expect(loaded.sections.some((s) => s.id === 'sec_custom')).toBe(true);
    });

    it('falls back to defaultSchema in test environment when localStorage is empty', () => {
      localStorage.removeItem('cvData');

      const loaded = loadInitialCVData();
      expect(loaded).toBeDefined();
      expect(loaded.profile).toBeDefined();
      expect(loaded.layout).toBeDefined();
    });

    it('ensureProfileHeader injects missing profile_header section if omitted', () => {
      const dataWithoutProfileHeader = {
        profile: { name: 'CARLOS LOPEZ', role: 'DevOps Architect' },
        sections: [{ id: 'sec_exp', type: 'experience', title: 'Experiencia', items: [] }],
        layout: { type: '1-column', isAtsMode: true }
      };

      const ensured = ensureProfileHeader(dataWithoutProfileHeader);
      expect(ensured.sections.some((s) => s.id === 'profile_header')).toBe(true);
    });
  });

  describe('3. CVProvider Context Initialization', () => {
    it('initializes useCV with valid active profile and layout', () => {
      const Probe = () => {
        const { cvData } = useCV();
        return (
          <div data-testid="cv-probe">
            <span data-testid="probe-name">{cvData?.profile?.name}</span>
            <span data-testid="probe-layout">{cvData?.layout?.type}</span>
          </div>
        );
      };

      render(
        <CVProvider>
          <Probe />
        </CVProvider>
      );

      expect(screen.getByTestId('cv-probe')).toBeInTheDocument();
      expect(screen.getByTestId('probe-name')).not.toBeEmptyDOMElement();
    });
  });
});
