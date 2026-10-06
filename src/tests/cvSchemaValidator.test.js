import { describe, it, expect } from 'vitest';
import {
  validateCVSnapshot,
  sanitizeAndValidateCVSnapshot,
  ALLOWED_LAYOUT_TYPES,
  ALLOWED_COLUMNS,
  NUMERIC_BOUNDS
} from '../utils/cvSchemaValidator.js';
import { defaultSchema } from '../utils/schema.js';

describe('Declarative CVSchemaValidator Suite', () => {
  describe('Constants & Bounds', () => {
    it('defines expected layout types and columns', () => {
      expect(ALLOWED_LAYOUT_TYPES).toEqual(['1-column', '2-column']);
      expect(ALLOWED_COLUMNS).toEqual(['left', 'right']);
      expect(NUMERIC_BOUNDS.pagePadding.default).toBe(24);
      expect(NUMERIC_BOUNDS.sectionGap.default).toBe(12);
      expect(NUMERIC_BOUNDS.itemGap.default).toBe(6);
    });
  });

  describe('validateCVSnapshot (Pure Diagnostic Inspection)', () => {
    it('detects invalid root primitives and arrays', () => {
      expect(validateCVSnapshot(null).isValid).toBe(false);
      expect(validateCVSnapshot(undefined).isValid).toBe(false);
      expect(validateCVSnapshot('string').isValid).toBe(false);
      expect(validateCVSnapshot(123).isValid).toBe(false);
      expect(validateCVSnapshot([]).isValid).toBe(false);

      const res = validateCVSnapshot(null);
      expect(res.errors[0].code).toBe('INVALID_ROOT');
    });

    it('validates a pristine defaultSchema snapshot successfully', () => {
      const res = validateCVSnapshot(defaultSchema);
      expect(res.isValid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });

    it('detects invalid layout type and invalid numeric fields', () => {
      const invalid = {
        profile: { name: 'Test' },
        layout: { type: '3-column', pagePadding: 'not-a-number' },
        sections: []
      };

      const res = validateCVSnapshot(invalid);
      expect(res.isValid).toBe(false);
      expect(res.errors.some(e => e.path === '$.layout.type')).toBe(true);
      expect(res.errors.some(e => e.path === '$.layout.pagePadding')).toBe(true);
    });

    it('detects invalid section columns and duplicate section IDs', () => {
      const duplicateSecs = {
        profile: { name: 'Test' },
        layout: { type: '2-column' },
        sections: [
          { id: 'sec1', type: 'skills', column: 'middle', items: [] },
          { id: 'sec1', type: 'experience', column: 'left', items: [] }
        ]
      };

      const res = validateCVSnapshot(duplicateSecs);
      expect(res.isValid).toBe(false);
      expect(res.errors.some(e => e.code === 'INVALID_SECTION_COLUMN')).toBe(true);
      expect(res.errors.some(e => e.code === 'DUPLICATE_SECTION_ID')).toBe(true);
    });

    it('warns when profile_header is absent', () => {
      const noHeader = {
        profile: { name: 'Test' },
        layout: { type: '2-column' },
        sections: [
          { id: 'skills', type: 'skills', column: 'left', items: [] }
        ]
      };

      const res = validateCVSnapshot(noHeader);
      expect(res.isValid).toBe(true);
      expect(res.warnings.some(w => w.message.includes('profile_header'))).toBe(true);
    });
  });

  describe('sanitizeAndValidateCVSnapshot (Robust Recovery & Normalization)', () => {
    it('recovers from null or corrupt snapshot without crash', () => {
      const sanitized = sanitizeAndValidateCVSnapshot(null);
      expect(sanitized).toBeDefined();
      expect(sanitized.layout).toBeDefined();
      expect(sanitized.layout.type).toBe('2-column');
      expect(sanitized.sections).toBeDefined();
      expect(sanitized.sections.length).toBeGreaterThan(0);
    });

    it('automatically injects profile_header if omitted', () => {
      const omitted = {
        profile: { name: 'Ada Lovelace' },
        layout: { type: '1-column', isAtsMode: true },
        sections: [
          { id: 'custom_sec', type: 'custom', column: 'left', title: 'Notas', items: [] }
        ]
      };

      const sanitized = sanitizeAndValidateCVSnapshot(omitted);
      expect(sanitized.sections.some(s => s.id === 'profile_header' || s.type === 'profile_header')).toBe(true);
      expect(sanitized.profile.name).toBe('Ada Lovelace');
    });

    it('normalizes invalid columns to left or right', () => {
      const invalidCol = {
        layout: { type: '2-column' },
        sections: [
          { id: 'sec_unknown', column: 'center', type: 'list', items: [] }
        ]
      };

      const sanitized = sanitizeAndValidateCVSnapshot(invalidCol);
      const sec = sanitized.sections.find(s => s.id === 'sec_unknown');
      expect(['left', 'right']).toContain(sec.column);
    });

    it('assigns unique IDs to section items missing IDs or having duplicates', () => {
      const missingIds = {
        layout: { type: '2-column' },
        sections: [
          {
            id: 'sec_items',
            column: 'left',
            type: 'list',
            items: [
              { name: 'Item 1' },
              { id: 'dup_id', name: 'Item 2' },
              { id: 'dup_id', name: 'Item 3' }
            ]
          }
        ]
      };

      const sanitized = sanitizeAndValidateCVSnapshot(missingIds);
      const items = sanitized.sections.find(s => s.id === 'sec_items').items;
      expect(items).toHaveLength(3);
      expect(items[0].id).toBeDefined();
      expect(items[1].id).toBe('dup_id');
      expect(items[2].id).not.toBe('dup_id');
      expect(new Set(items.map(it => it.id)).size).toBe(3);
    });
  });
});
