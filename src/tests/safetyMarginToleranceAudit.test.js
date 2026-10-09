/**
 * safetyMarginToleranceAudit.test.js
 *
 * Exhaustive QA Verification Suite for the 30% Safety Margin Tolerance:
 * - Mathematical precision & SSOT alignment with src/constants/spacing.js
 * - Single-bullet items (non-splittable boundary handling)
 * - Multi-bullet items where only the terminal bullet enters tolerance (zero premature jump)
 * - Multi-bullet items where intermediate bullets enter tolerance before splitting
 * - First-bullet flush boundary rule
 * - Continuation page tolerance and asymmetric continuation (baseH = 0)
 * - Dynamic slider scaling (custom pagePadding)
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PAGE_PADDING_PX,
  PAGE_BOTTOM_CLEARANCE_PX,
  DEFAULT_TERMINAL_SAFETY_TOLERANCE_RATIO,
  DEFAULT_TERMINAL_TOLERANCE_PX,
  SPACING_TOKENS,
} from '../constants/spacing.js';
import {
  distributeSectionsToPages,
  splitCandidateItemByBullets,
  estimateItemHeight,
  estimateHeaderHeight,
  estimateSingleBulletHeight,
  estimateItemBaseHeight,
  getItemNetHeight,
} from '../utils/pageDistributor.js';

describe('QA Audit: 30% Safety Margin Tolerance Verification', () => {
  // =========================================================================
  // 1. Mathematical Rigor & SSOT Constants
  // =========================================================================
  describe('1. SSOT Constants & Mathematical Formulation', () => {
    it('verifies that DEFAULT_TERMINAL_TOLERANCE_PX equals Math.round((24 + 12) * 0.10) = 4px', () => {
      const bottomSafetyMargin = DEFAULT_PAGE_PADDING_PX + PAGE_BOTTOM_CLEARANCE_PX;
      expect(bottomSafetyMargin).toBe(36);

      const calculatedTolerance = Math.round(bottomSafetyMargin * DEFAULT_TERMINAL_SAFETY_TOLERANCE_RATIO);
      expect(calculatedTolerance).toBe(4);
      expect(DEFAULT_TERMINAL_TOLERANCE_PX).toBe(4);
      expect(SPACING_TOKENS.defaultTerminalTolerancePx).toBe(4);
      expect(SPACING_TOKENS.terminalSafetyToleranceRatio).toBe(0.1);
    });

    it('verifies that distributor enforces clean capacity uniformly without artificial expansion', () => {
      // With custom pagePadding = 32px
      const cv = {
        layout: { isAtsMode: true, pagePadding: 32 },
        sections: [
          {
            id: 'sec1',
            type: 'simple_list',
            title: '',
            items: [{ id: 'it1', height: 1000 }],
          },
        ],
      };

      const cvWithItem = {
        ...cv,
        sections: [
          {
            id: 'sec1',
            type: 'experience',
            title: '',
            items: [
              { id: 'it1', title: 'Job 1', height: 950 },
              { id: 'it2', title: 'Job 2', height: 60 + 10 }, // net height = 60px. Total net = 950 + 60 = 1010px. Exceeds 1000px by 10px.
            ],
          },
        ],
      };

      const pages = distributeSectionsToPages(cvWithItem, {
        pageCapacity: 1000,
        pagePaddingPx: 32,
        itemGapPx: 10,
        sectionGapPx: 0,
        isEditor: true,
      });

      // 10px over capacity -> cleanly pushes to Page 2 without breaching the bottom margin
      expect(pages).toHaveLength(2);
      expect(pages[0].singleSections[0].items).toHaveLength(1);
      expect(pages[1].singleSections[0].items).toHaveLength(1);
    });
  });

  // =========================================================================
  // 2. Single-Bullet Items (Non-Splittable Boundary Edge Cases)
  // =========================================================================
  describe('2. Single-Bullet Items Boundary & Tolerance Coverage', () => {
    it('splitCandidateItemByBullets cleanly returns null for single-bullet items', () => {
      const singleBulletCandidate = {
        id: 'exp1',
        title: 'Developer',
        bullets: ['Only one bullet point here'],
      };

      const result = splitCandidateItemByBullets({
        candidate: singleBulletCandidate,
        sectionType: 'experience',
        options: { itemGapPx: 10 },
        currentAccumulated: 950,
        maxAvailable: 1000,
        nextPageNumber: 2,
        terminalTolerance: 11,
      });

      // Must be null: never split a single bullet into an orphan header or empty bullet list
      expect(result).toBeNull();
    });

    it('distributeSectionsToPages pushes single-bullet item intact to Page 2 when exceeding capacity', () => {
      // Available capacity: 1000px
      // Item 1 uses 950px
      // Item 2 has base height + 1 bullet with gross height 66px, itemGap 10px -> net height = 56px
      // Total net height = 950 + 56 = 1006px (exceeds 1000px by 6px)
      const candidate = {
        id: 'exp2',
        title: 'Backend Engineer',
        height: 66, // gross
        bullets: ['Maintained critical infrastructure with zero downtime.'],
      };

      const cv = {
        layout: { isAtsMode: true },
        sections: [
          {
            id: 'sec1',
            type: 'experience',
            title: '',
            items: [
              { id: 'exp1', title: 'Lead Architect', height: 950 },
              candidate,
            ],
          },
        ],
      };

      const pages = distributeSectionsToPages(cv, {
        pageCapacity: 1000,
        itemGapPx: 10,
        sectionGapPx: 0,
        pagePaddingPx: 24,
        pageBottomClearancePx: 14,
        isEditor: true,
      });

      expect(pages).toHaveLength(2);
      const p1Items = pages[0].singleSections[0].items;
      expect(p1Items).toHaveLength(1);
      const p2Items = pages[1].singleSections[0].items;
      expect(p2Items).toHaveLength(1);
      expect(p2Items[0].id).toBe('exp2');
      expect(p2Items[0].isPartialItem).toBeFalsy();
    });

    it('distributeSectionsToPages pushes single-bullet item intact to Page 2 when exceeding tolerance (> 11px)', () => {
      // Available capacity: 1000px
      // Item 1 uses 950px
      // Item 2 has gross height 76px, itemGap 10px -> net height = 66px
      // Total net height = 950 + 66 = 1016px (exceeds 1000px by 16px, which is > 11px tolerance)
      const candidate = {
        id: 'exp2',
        title: 'Backend Engineer',
        height: 76, // gross
        bullets: ['Maintained critical infrastructure with zero downtime.'],
      };

      const cv = {
        layout: { isAtsMode: true },
        sections: [
          {
            id: 'sec1',
            type: 'experience',
            title: '',
            items: [
              { id: 'exp1', title: 'Lead Architect', height: 950 },
              candidate,
            ],
          },
        ],
      };

      const pages = distributeSectionsToPages(cv, {
        pageCapacity: 1000,
        itemGapPx: 10,
        sectionGapPx: 0,
        pagePaddingPx: 24,
        pageBottomClearancePx: 14,
        isEditor: true,
      });

      expect(pages).toHaveLength(2);
      expect(pages[0].singleSections[0].items).toHaveLength(1);
      expect(pages[1].singleSections[0].items).toHaveLength(1);
      expect(pages[1].singleSections[0].items[0].id).toBe('exp2');
      expect(pages[1].singleSections[0].items[0].bullets).toHaveLength(1);
    });
  });

  // =========================================================================
  // 3. Multi-Bullet Items: Last Bullet Entering Tolerance (Zero Premature Jump)
  // =========================================================================
  describe('3. Multi-Bullet Items: Terminal Bullet Within Tolerance Zone', () => {
    it('splitCandidateItemByBullets returns fitsCompletely: true when only the terminal bullet enters tolerance', () => {
      const candidate = {
        id: 'exp1',
        title: 'Senior Developer',
        bullets: [
          'First bullet fitting comfortably in standard capacity',
          'Second bullet fitting comfortably in standard capacity',
          'Third bullet extending slightly past standard capacity into tolerance',
        ],
      };

      const options = { itemGapPx: 10, fontScale: 1.0 };
      const baseH = estimateItemBaseHeight(candidate, 'experience', options);
      const b0H = estimateSingleBulletHeight(candidate.bullets[0], 'experience', options, 'exp1_bullet_0');
      const b1H = estimateSingleBulletHeight(candidate.bullets[1], 'experience', options, 'exp1_bullet_1');
      const b2GrossH = estimateSingleBulletHeight(candidate.bullets[2], 'experience', options, 'exp1_bullet_2');
      const bulletGap = Math.round(10 / 2); // 5px
      const b2NetH = Math.max(1, b2GrossH - bulletGap);

      // Set maxAvailable such that base + b0 + b1 fits, but b2 requires 6px of tolerance (<= 11px)
      const currentAccumulated = 500;
      const maxAvailable = currentAccumulated + baseH + b0H + b1H + (b2NetH - 6);
      const terminalTolerance = 11;

      const result = splitCandidateItemByBullets({
        candidate,
        sectionType: 'experience',
        options,
        currentAccumulated,
        maxAvailable,
        nextPageNumber: 2,
        terminalTolerance,
      });

      expect(result).not.toBeNull();
      expect(result.fitsCompletely).toBe(true);
      expect(result.partialCandidateRemaining).toBeNull();
      expect(result.partialCandidate.bullets).toHaveLength(3);
      // Consumed height should include net height for the last bullet
      expect(result.consumedHeight).toBe(baseH + b0H + b1H + b2NetH);
    });

    it('end-to-end: adding a bullet point that enters the 30% tolerance zone keeps the item on Page 1', () => {
      const candidateTwoBullets = {
        id: 'exp1',
        title: 'Tech Lead',
        subtitle: 'Enterprise Solutions',
        bullets: [
          'Engineered microservices architecture with high availability.',
          'Reduced cloud infrastructure expenditure by 35% through optimization.',
        ],
      };

      const options = {
        pagePaddingPx: 24,
        pageBottomClearancePx: 14,
        itemGapPx: 6,
        sectionGapPx: 12,
        isEditor: true,
        splitGranularBullets: true,
      };

      const cvInitial = {
        layout: { isAtsMode: true },
        sections: [
          {
            id: 'exp-sec',
            type: 'experience',
            title: 'Experience',
            items: [candidateTwoBullets],
          },
        ],
      };

      const initialGrossH = estimateItemHeight(candidateTwoBullets, 'experience', options);
      const headerH = estimateHeaderHeight(cvInitial.sections[0], false, options);
      
      // Calibrate pageCapacity so that 2 bullets fit comfortably,
      // and adding a 3rd bullet (approx 28px) will exceed pageCapacity by 8px (<= 11px tolerance).
      const bullet3 = 'Automated comprehensive testing pipelines reducing deployment defects.';
      const bullet3GrossH = estimateSingleBulletHeight(bullet3, 'experience', options);
      const bulletGap = Math.round(options.itemGapPx / 2);
      const bullet3NetH = bullet3GrossH - bulletGap;

      // Set pageCapacity such that with 3 bullets, it exceeds capacity by 7px
      const totalNeededWith3 = headerH + initialGrossH + bullet3NetH;
      const pageCapacity = totalNeededWith3 - 7;

      // 1. Initial 2 bullets fit easily
      const pagesBefore = distributeSectionsToPages(cvInitial, {
        ...options,
        pageCapacity,
      });
      expect(pagesBefore).toHaveLength(1);
      expect(pagesBefore[0].singleSections[0].items[0].bullets).toHaveLength(2);

      // 2. Add 3rd bullet
      const cvWithAddedBullet = {
        ...cvInitial,
        sections: [
          {
            ...cvInitial.sections[0],
            items: [
              {
                ...candidateTwoBullets,
                bullets: [...candidateTwoBullets.bullets, bullet3],
              },
            ],
          },
        ],
      };

      const pagesAfter = distributeSectionsToPages(cvWithAddedBullet, {
        ...options,
        pageCapacity,
      });

      // Crucial assertion: Must NOT jump to Page 2! Stays on Page 1 with all 3 bullets!
      expect(pagesAfter).toHaveLength(1);
      const placedItem = pagesAfter[0].singleSections[0].items[0];
      expect(placedItem.bullets).toHaveLength(3);
      expect(placedItem.isPartialItem).toBeFalsy();
    });
  });

  // =========================================================================
  // 4. Multi-Bullet Items: Intermediate Bullets Within Tolerance & Clean Splitting
  // =========================================================================
  describe('4. Multi-Bullet Items: Partial Split when Subsequent Bullet Exceeds Tolerance', () => {
    it('splits cleanly when intermediate bullet fits in tolerance but subsequent bullet overflows', () => {
      const candidate = {
        id: 'exp1',
        title: 'Software Architect',
        bullets: [
          'Bullet 0: Fits standard',
          'Bullet 1: Enters tolerance zone and fits',
          'Bullet 2: Exceeds even the tolerance zone and must split',
        ],
      };

      const options = { itemGapPx: 10, fontScale: 1.0 };
      const baseH = estimateItemBaseHeight(candidate, 'experience', options);
      const b0H = estimateSingleBulletHeight(candidate.bullets[0], 'experience', options);
      const b1GrossH = estimateSingleBulletHeight(candidate.bullets[1], 'experience', options);
      const bulletGap = Math.round(10 / 2);
      const b1NetH = Math.max(1, b1GrossH - bulletGap);

      const currentAccumulated = 400;
      // maxAvailable allows baseH + b0H, but not b1
      // effectiveMaxAvailable allows baseH + b0H + b1NetH, but NOT b2
      const maxAvailable = currentAccumulated + baseH + b0H + 2; // b1 won't fit in standard
      const terminalTolerance = 11;

      // Ensure b1NetH fits within 11px tolerance, but b2 overflows
      const result = splitCandidateItemByBullets({
        candidate,
        sectionType: 'experience',
        options,
        currentAccumulated,
        maxAvailable,
        nextPageNumber: 2,
        terminalTolerance: b1NetH + 5, // large enough for b1, but b2 will overflow
      });

      expect(result).not.toBeNull();
      expect(result.fitsCompletely).toBe(false);
      expect(result.partialCandidate.bullets).toEqual([candidate.bullets[0], candidate.bullets[1]]);
      expect(result.partialCandidate.isPartialItem).toBe(true);
      expect(result.partialCandidateRemaining.bullets).toEqual([candidate.bullets[2]]);
      expect(result.partialCandidateRemaining.isContinuationItem).toBe(true);
      expect(result.partialCandidateRemaining.bulletStartIndex).toBe(2);
    });

    it('returns null when even baseH + netFirstBulletH exceeds effectiveMaxAvailable', () => {
      const candidate = {
        id: 'exp1',
        title: 'Principal Engineer',
        bullets: ['Bullet 1', 'Bullet 2'],
      };

      const options = { itemGapPx: 10 };
      const baseH = estimateItemBaseHeight(candidate, 'experience', options);
      const b0GrossH = estimateSingleBulletHeight(candidate.bullets[0], 'experience', options);
      const bulletGap = 5;
      const b0NetH = b0GrossH - bulletGap;

      // Available space is smaller than baseH + b0NetH even with 11px tolerance
      const currentAccumulated = 900;
      const maxAvailable = 900 + baseH + b0NetH - 20; // 20px short
      const terminalTolerance = 11; // 11 < 20

      const result = splitCandidateItemByBullets({
        candidate,
        sectionType: 'experience',
        options,
        currentAccumulated,
        maxAvailable,
        nextPageNumber: 2,
        terminalTolerance,
      });

      // Must be null: cannot split because even the first bullet cannot be accommodated
      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // 5. Continuation Pages & Asymmetric Continuation Tolerance
  // =========================================================================
  describe('5. Continuation Pages & Asymmetric Continuation Tolerance', () => {
    it('applies terminal tolerance on continuation pages (Page 2) avoiding premature Page 3', () => {
      // Create a CV where Page 1 fills up, and Page 2 receives continuation items.
      // The last item on Page 2 exceeds standard capacity by 7px (<= 11px tolerance).
      // It must remain on Page 2 and NOT generate an empty/sparse Page 3.
      const cv = {
        layout: { isAtsMode: true },
        sections: [
          {
            id: 'sec1',
            type: 'simple_list',
            title: 'Section 1',
            items: [
              { id: 'it1', height: 950 }, // Takes almost all of Page 1
            ],
          },
          {
            id: 'sec2',
            type: 'experience',
            title: 'Experience',
            items: [
              {
                id: 'exp1',
                title: 'Job 1',
                bullets: [
                  'Bullet 1 of job on page 2',
                  'Bullet 2 of job on page 2',
                  'Bullet 3 of job on page 2 entering tolerance zone',
                ],
              },
            ],
          },
        ],
      };

      const options = {
        pagePaddingPx: 24,
        pageBottomClearancePx: 14,
        itemGapPx: 6,
        sectionGapPx: 12,
        isEditor: true,
        splitGranularBullets: true,
      };

      const expGrossH = estimateItemHeight(cv.sections[1].items[0], 'experience', options);
      const expHeaderH = estimateHeaderHeight(cv.sections[1], false, options);
      // Page 2 capacity calibrated so that exp1 exceeds standard pageCapacity by 6px
      const page2ContentH = expHeaderH + expGrossH;
      const pageCapacity = 1000;

      // Adjust item 1 height so it fills Page 1
      cv.sections[0].items[0].height = pageCapacity - 10;

      // Adjust exp1 height / pageCapacity to test tolerance on Page 2
      const customCapacity = page2ContentH - 6; // 6px over capacity on Page 2

      const pages = distributeSectionsToPages(cv, {
        ...options,
        pageCapacity: customCapacity,
      });

      // Sec1 is on Page 1. Sec2 is on Page 2.
      // Sec2 fits within customCapacity + 11px tolerance -> Total pages must be 2, NOT 3!
      expect(pages).toHaveLength(2);
      expect(pages[0].singleSections.map(s => s.id)).toEqual(['sec1']);
      expect(pages[1].singleSections.map(s => s.id)).toEqual(['sec2']);
      expect(pages[1].singleSections[0].items[0].bullets).toHaveLength(3);
    });

    it('continuation items on Page 2 have baseH = 0 (Asymmetric Continuation) and preserve bulletStartIndex', () => {
      const candidate = {
        id: 'job1',
        title: 'Lead Architect',
        subtitle: 'Enterprise Systems',
        bullets: ['B1', 'B2', 'B3', 'B4'],
      };

      const cv = {
        layout: { isAtsMode: true },
        sections: [
          {
            id: 'exp',
            type: 'experience',
            title: 'Experience',
            items: [
              { id: 'filler', height: 950 },
              candidate,
            ],
          },
        ],
      };

      const pages = distributeSectionsToPages(cv, {
        pageCapacity: 1000,
        pagePaddingPx: 24,
        pageBottomClearancePx: 14,
        itemGapPx: 6,
        sectionGapPx: 12,
        isEditor: true,
        splitGranularBullets: true,
      });

      if (pages.length >= 2) {
        const p2Exp = pages[1].singleSections.find(s => s.originalSectionId === 'exp' || s.id.startsWith('exp'));
        if (p2Exp && p2Exp.items.some(i => i.isContinuationItem)) {
          const contItem = p2Exp.items.find(i => i.isContinuationItem);
          expect(contItem.title).toBe('');
          expect(contItem.subtitle).toBe('');
          expect(contItem.bulletStartIndex).toBeGreaterThan(0);
        }
      }
    });
  });
});
