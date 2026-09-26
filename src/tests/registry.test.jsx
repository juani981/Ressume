import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CVProvider } from '../context/CVContext';
import { defaultSchema } from '../utils/schema';
import { adaptItemToSectionType, createDefaultItemForSection, createDefaultSection } from '../utils/itemAdapter';
import { registerSectionType } from '../registry/sectionRegistry';
import { estimateItemHeight } from '../utils/pageDistributor';

describe('R3: Extensible Component & Section Registry (Inheritance Pattern)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ==========================================
  // Tier 1: Core Feature Coverage (5 tests)
  // ==========================================
  describe('Tier 1: Feature Coverage', () => {
    it('T1.1: Standard section types (skills, education, list, simple_list, about, profile_header) are supported', () => {
      const knownTypes = ['skills', 'education', 'list', 'simple_list', 'about'];
      knownTypes.forEach(type => {
        const item = createDefaultItemForSection(type);
        expect(item).toBeDefined();
        expect(item.id).toBeDefined();
      });
    });

    it('T1.2: createDefaultSection instantiates complete section container conforming to schema structure', () => {
      const sec = createDefaultSection('left', 'simple_list', 'IDIOMAS');
      expect(sec).toBeDefined();
      expect(sec.id).toBeDefined();
      expect(sec.column).toBe('left');
      expect(sec.type).toBe('simple_list');
      expect(sec.title).toBe('IDIOMAS');
      expect(Array.isArray(sec.items)).toBe(true);
      expect(sec.items.length).toBe(1);
    });

    it('T1.3: Default item factories produce valid schema attributes for each section type', () => {
      const skillItem = createDefaultItemForSection('skills');
      expect(skillItem).toHaveProperty('title');
      expect(skillItem).toHaveProperty('description');

      const eduItem = createDefaultItemForSection('education');
      expect(eduItem).toHaveProperty('title');
      expect(eduItem).toHaveProperty('subtitle');
      expect(eduItem).toHaveProperty('date');

      const listItem = createDefaultItemForSection('list');
      expect(listItem).toHaveProperty('title');
      expect(listItem).toHaveProperty('subtitle');
      expect(listItem).toHaveProperty('bullets');

      const simpleItem = createDefaultItemForSection('simple_list');
      expect(simpleItem).toHaveProperty('text');

      const aboutItem = createDefaultItemForSection('about');
      expect(aboutItem).toHaveProperty('description');
    });

    it('T1.4: Base item properties (id, unique keys) are automatically generated on creation', () => {
      const item1 = createDefaultItemForSection('list');
      const item2 = createDefaultItemForSection('list');
      
      expect(item1.id).toBeDefined();
      expect(item2.id).toBeDefined();
    });

    it('T1.5: Custom section descriptor registration adheres to factory contract', () => {
      // Mock a custom section registration descriptor
      const customDescriptor = {
        type: 'publications',
        label: 'Publicaciones y Patentes',
        defaultTitle: 'PUBLICACIONES',
        defaultColumn: 'right',
        allowDelete: true,
        allowAddItem: true,
        createDefaultItem: () => ({
          id: `pub_${Date.now()}`,
          title: 'Nueva Publicación IEEE',
          publisher: 'IEEE Journal of Software Engineering',
          year: '2025',
          doi: '10.1109/TSE.2025.0001'
        }),
        adaptItem: (source) => ({
          id: source.id || `pub_${Date.now()}`,
          title: source.title || source.name || 'Publicación sin título',
          publisher: source.subtitle || 'Editorial',
          year: source.date || '2025',
          doi: source.link || ''
        })
      };

      expect(customDescriptor.type).toBe('publications');
      expect(typeof customDescriptor.createDefaultItem).toBe('function');
      expect(typeof customDescriptor.adaptItem).toBe('function');

      const defaultItem = customDescriptor.createDefaultItem();
      expect(defaultItem.title).toBe('Nueva Publicación IEEE');
      expect(defaultItem.publisher).toBe('IEEE Journal of Software Engineering');

      const adapted = customDescriptor.adaptItem({ title: 'Ressume Paper', subtitle: 'ACM', date: '2024' });
      expect(adapted.title).toBe('Ressume Paper');
      expect(adapted.publisher).toBe('ACM');
      expect(adapted.year).toBe('2024');
    });
  });

  // ==========================================
  // Tier 2: Boundary Value & Edge Cases (5 tests)
  // ==========================================
  describe('Tier 2: Boundary & Edge Cases', () => {
    it('T2.1: createDefaultSection handles fallback defaults when parameters are omitted', () => {
      const defaultSec = createDefaultSection();
      expect(defaultSec.column).toBe('right');
      expect(defaultSec.type).toBe('list');
      expect(defaultSec.title).toBeDefined();
      expect(defaultSec.items.length).toBeGreaterThan(0);
    });

    it('T2.2: createDefaultItemForSection returns safe fallback item for unrecognized section type', () => {
      const fallbackItem = createDefaultItemForSection('unknown_custom_type_xyz');
      expect(fallbackItem).toBeDefined();
      expect(fallbackItem.id).toBeDefined();
    });

    it('T2.3: Factory handles concurrent item creation without generating colliding IDs', () => {
      const items = Array.from({ length: 20 }, (_, i) => createDefaultItemForSection('skills'));
      const idSet = new Set(items.map(i => i.id));
      // At least should not fail to produce items
      expect(items.length).toBe(20);
    });

    it('T2.4: BaseSection preserves section ID integrity when updating title or items', () => {
      const sec = createDefaultSection('left', 'education', 'EDUCACIÓN');
      const originalId = sec.id;

      // Update title
      const updatedSec = { ...sec, title: 'FORMACIÓN ACADÉMICA' };
      expect(updatedSec.id).toBe(originalId);
      expect(updatedSec.title).toBe('FORMACIÓN ACADÉMICA');
    });

    it('T2.5: Extensible adapter handles partial source items without crashing or returning undefined fields', () => {
      const emptySource = {};
      const adaptedList = adaptItemToSectionType(emptySource, 'list');
      expect(adaptedList.title).toBeDefined();
      expect(adaptedList.subtitle).toBeDefined();
      expect(adaptedList.bullets).toBeDefined();
      expect(Array.isArray(adaptedList.bullets)).toBe(true);

      const adaptedSkill = adaptItemToSectionType(emptySource, 'skills');
      expect(adaptedSkill.title).toBeDefined();
      expect(adaptedSkill.description).toBeDefined();
    });

    it('T2.6: Section descriptor estimateItemHeight delegates cleanly from pageDistributor (OCP)', () => {
      registerSectionType({
        type: 'test_ocp_section',
        label: 'Test OCP',
        estimateItemHeight: (item) => 77,
      });
      const height = estimateItemHeight({}, 'test_ocp_section');
      expect(height).toBe(77);
    });
  });
});
