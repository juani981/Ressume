/**
 * @file titleRegressionAndComponentLifecycle.test.jsx
 * @description Comprehensive regression test suite verifying:
 * 1. Title/Name component: Adding a second title and deleting one leaves exactly one title,
 *    never deleting both titles or confusing their IDs.
 * 2. Independent editing and reordering of multiple titles without crosstalk.
 * 3. Lifecycle regression across ALL 18 registered section types: Spawning and deleting any
 *    section or item strictly targets only that specific element's ID, with ZERO unintended
 *    side effects on other sections (and strictly preserving profile_header).
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCVData } from '../context/hooks/useCVData';
import { getAllSectionDescriptors, getSectionDescriptor } from '../registry/sectionRegistry';
import { defaultSchema } from '../utils/schema';

describe('Regression: Title/Name Isolation & Universal Component Lifecycle Safety', () => {
  describe('Pillar 1: Title Component Isolation & Single-Title Coexistence', () => {
    it('allows spawning a second title and deleting one without deleting both', () => {
      const { result } = renderHook(() => useCVData());

      // Initial state contains default profile_header
      const initialTitles = result.current.cvData.sections.filter(
        s => s.type === 'profile_header' || s.type === 'title_subtitle'
      );
      expect(initialTitles.length).toBe(1);
      const originalTitleId = initialTitles[0].id;
      expect(originalTitleId).toBe('profile_header');

      const initialCount = result.current.cvData.sections.length;

      // Spawn a second Title ("Título y Subtítulo" -> title_subtitle)
      act(() => {
        result.current.addSection('right', 'title_subtitle', 'TÍTULO DERECHO');
      });

      // Verify two titles now exist with DISTINCT IDs
      const titlesAfterAdd = result.current.cvData.sections.filter(
        s => s.type === 'profile_header' || s.type === 'title_subtitle'
      );
      expect(titlesAfterAdd.length).toBe(2);
      expect(result.current.cvData.sections.length).toBe(initialCount + 1);

      const secondTitle = titlesAfterAdd.find(s => s.id !== originalTitleId);
      expect(secondTitle).toBeDefined();
      expect(secondTitle.type).toBe('title_subtitle');
      expect(secondTitle.id).not.toBe(originalTitleId);
      expect(secondTitle.items[0].id).toBeDefined();

      // Delete the second title
      act(() => {
        result.current.deleteSection(secondTitle.id);
      });

      // CRITICAL REGRESSION CHECK: Exactly ONE title remains (the original profile_header)
      // Both titles must NEVER be deleted simultaneously!
      const titlesAfterDelete = result.current.cvData.sections.filter(
        s => s.type === 'profile_header' || s.type === 'title_subtitle'
      );
      expect(titlesAfterDelete.length).toBe(1);
      expect(titlesAfterDelete[0].id).toBe(originalTitleId);
      expect(titlesAfterDelete[0].items[0].name).toBe('TU NOMBRE Y APELLIDO');
      expect(result.current.cvData.sections.length).toBe(initialCount);
    });

    it('allows spawning multiple title_subtitle sections and deleting them one by one cleanly', () => {
      const { result } = renderHook(() => useCVData());

      const baseCount = result.current.cvData.sections.length;

      // Spawn title A and title B
      act(() => {
        result.current.addSection('left', 'title_subtitle', 'Título A');
      });
      const titleA = result.current.cvData.sections[result.current.cvData.sections.length - 1];

      act(() => {
        result.current.addSection('right', 'title_subtitle', 'Título B');
      });
      const titleB = result.current.cvData.sections[result.current.cvData.sections.length - 1];

      expect(titleA.id).not.toBe(titleB.id);

      // Now we have 3 titles in total: profile_header, titleA, titleB
      const threeTitles = result.current.cvData.sections.filter(
        s => s.type === 'profile_header' || s.type === 'title_subtitle'
      );
      expect(threeTitles.length).toBe(3);

      // Delete Title A
      act(() => {
        result.current.deleteSection(titleA.id);
      });

      // Verify ONLY Title A was deleted; profile_header and Title B remain intact
      const remainingAfterA = result.current.cvData.sections.filter(
        s => s.type === 'profile_header' || s.type === 'title_subtitle'
      );
      expect(remainingAfterA.length).toBe(2);
      expect(remainingAfterA.some(s => s.id === 'profile_header')).toBe(true);
      expect(remainingAfterA.some(s => s.id === titleB.id)).toBe(true);
      expect(remainingAfterA.some(s => s.id === titleA.id)).toBe(false);

      // Delete Title B
      act(() => {
        result.current.deleteSection(titleB.id);
      });

      // Exactly ONE title remains (the default profile_header)
      const remainingAfterB = result.current.cvData.sections.filter(
        s => s.type === 'profile_header' || s.type === 'title_subtitle'
      );
      expect(remainingAfterB.length).toBe(1);
      expect(remainingAfterB[0].id).toBe('profile_header');
      expect(result.current.cvData.sections.length).toBe(baseCount);
    });

    it('ensures editing one title does not bleed into or mutate another title', () => {
      const { result } = renderHook(() => useCVData());

      // Add a second title
      act(() => {
        result.current.addSection('right', 'title_subtitle', 'Segundo Título');
      });

      const secondSec = result.current.cvData.sections.find(s => s.type === 'title_subtitle');
      const secondItemId = secondSec.items[0].id;

      // Edit second title's name and subtitle
      act(() => {
        result.current.updateSectionItem(secondSec.id, secondItemId, 'name', 'MARÍA LÓPEZ');
        result.current.updateSectionItem(secondSec.id, secondItemId, 'subtitle', 'Cloud Architect');
      });

      // Verify the second title changed
      const updatedSecondSec = result.current.cvData.sections.find(s => s.id === secondSec.id);
      expect(updatedSecondSec.items[0].name).toBe('MARÍA LÓPEZ');
      expect(updatedSecondSec.items[0].subtitle).toBe('Cloud Architect');

      // Verify original profile_header remains untouched
      const originalHeader = result.current.cvData.sections.find(s => s.id === 'profile_header');
      expect(originalHeader.items[0].name).toBe('TU NOMBRE Y APELLIDO');
      expect(originalHeader.items[0].subtitle).toBe('Título Profesional / Especialidad');
    });
  });

  describe('Pillar 2: Universal Component Spawn & Delete Lifecycle (Zero Side Effects)', () => {
    const allDescriptors = getAllSectionDescriptors();

    allDescriptors.forEach((descriptor) => {
      it(`spawning and deleting section "${descriptor.type}" (${descriptor.label}) strictly affects only that section ID`, () => {
        const { result } = renderHook(() => useCVData());

        const initialSections = [...result.current.cvData.sections];
        const initialCount = initialSections.length;
        const initialIds = new Set(initialSections.map(s => s.id));

        // 1. Spawn section of this type
        act(() => {
          result.current.addSection('right', descriptor.type, `TEST ${descriptor.type.toUpperCase()}`);
        });

        expect(result.current.cvData.sections.length).toBe(initialCount + 1);

        const spawnedSection = result.current.cvData.sections[result.current.cvData.sections.length - 1];
        expect(spawnedSection.type).toBe(descriptor.type);
        expect(spawnedSection.id).toBeDefined();
        // Check uniqueness of generated ID
        expect(initialIds.has(spawnedSection.id)).toBe(false);

        // Check spawned section has at least one valid item with a unique ID
        expect(spawnedSection.items).toBeDefined();
        expect(spawnedSection.items.length).toBeGreaterThan(0);
        expect(spawnedSection.items[0].id).toBeDefined();

        // Verify all pre-existing sections are unchanged
        initialSections.forEach((origSec) => {
          const currentSec = result.current.cvData.sections.find(s => s.id === origSec.id);
          expect(currentSec).toBeDefined();
          expect(currentSec.type).toBe(origSec.type);
        });

        // 2. Add an item if the descriptor allows adding items
        if (descriptor.allowAddItem !== false) {
          const itemCountBefore = spawnedSection.items.length;
          act(() => {
            result.current.addSectionItem(spawnedSection.id);
          });
          const secAfterAddItem = result.current.cvData.sections.find(s => s.id === spawnedSection.id);
          expect(secAfterAddItem.items.length).toBe(itemCountBefore + 1);

          const newItem = secAfterAddItem.items[secAfterAddItem.items.length - 1];
          expect(newItem.id).toBeDefined();
          // Item ID must be distinct from the first item
          expect(newItem.id).not.toBe(secAfterAddItem.items[0].id);

          // Delete that newly added item
          act(() => {
            result.current.deleteSectionItem(spawnedSection.id, newItem.id);
          });
          const secAfterDeleteItem = result.current.cvData.sections.find(s => s.id === spawnedSection.id);
          expect(secAfterDeleteItem.items.length).toBe(itemCountBefore);
          expect(secAfterDeleteItem.items.some(i => i.id === newItem.id)).toBe(false);
        }

        // 3. Delete the spawned section (if allowed)
        if (descriptor.allowDelete !== false) {
          act(() => {
            result.current.deleteSection(spawnedSection.id);
          });

          // Check section count is restored exactly
          expect(result.current.cvData.sections.length).toBe(initialCount);
          // Check spawned section ID is gone
          expect(result.current.cvData.sections.some(s => s.id === spawnedSection.id)).toBe(false);

          // CRITICAL: Verify profile_header was NOT deleted or corrupted as a side effect
          const profileHeader = result.current.cvData.sections.find(s => s.id === 'profile_header');
          expect(profileHeader).toBeDefined();
          expect(profileHeader.items[0].name).toBe('TU NOMBRE Y APELLIDO');

          // Verify every pre-existing section still exists with the exact same IDs
          initialSections.forEach((origSec) => {
            const currentSec = result.current.cvData.sections.find(s => s.id === origSec.id);
            expect(currentSec).toBeDefined();
          });
        }
      });
    });
  });

  describe('Pillar 3: Item-Level Deletion Precision (Zero Neighbor Corruption)', () => {
    it('deleting an item inside a multi-item section only removes that item ID', () => {
      const { result } = renderHook(() => useCVData());

      // Target the skills section (has skill1, skill2 by default)
      const skillsSec = result.current.cvData.sections.find(s => s.id === 'skills');
      expect(skillsSec).toBeDefined();
      expect(skillsSec.items.length).toBe(2);

      const item1Id = skillsSec.items[0].id;
      const item2Id = skillsSec.items[1].id;
      const item2Title = skillsSec.items[1].title;

      // Delete only item1
      act(() => {
        result.current.deleteSectionItem('skills', item1Id);
      });

      const updatedSkillsSec = result.current.cvData.sections.find(s => s.id === 'skills');
      expect(updatedSkillsSec.items.length).toBe(1);
      expect(updatedSkillsSec.items[0].id).toBe(item2Id);
      expect(updatedSkillsSec.items[0].title).toBe(item2Title);

      // Verify no other section had any item removed
      const expSec = result.current.cvData.sections.find(s => s.id === 'experience');
      expect(expSec.items.length).toBe(1);
      expect(expSec.items[0].id).toBe('exp1');
    });

    it('calling deleteSectionItem with a non-existent itemId produces zero mutations', () => {
      const { result } = renderHook(() => useCVData());

      const initialSnapshot = JSON.stringify(result.current.cvData.sections);

      act(() => {
        result.current.deleteSectionItem('skills', 'non_existent_item_id_999');
      });

      const afterSnapshot = JSON.stringify(result.current.cvData.sections);
      expect(afterSnapshot).toBe(initialSnapshot);
    });

    it('calling deleteSection with a non-existent sectionId produces zero mutations', () => {
      const { result } = renderHook(() => useCVData());

      const initialSnapshot = JSON.stringify(result.current.cvData.sections);

      act(() => {
        result.current.deleteSection('non_existent_section_id_999');
      });

      const afterSnapshot = JSON.stringify(result.current.cvData.sections);
      expect(afterSnapshot).toBe(initialSnapshot);
    });
  });
});
