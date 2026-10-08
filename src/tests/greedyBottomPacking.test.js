import { describe, it, expect } from 'vitest';
import { distributeSectionsToPages, estimateItemHeight, estimateHeaderHeight, getItemNetHeight } from '../utils/pageDistributor.js';

describe('Greedy bottom margin packing verification', () => {
  it('greedy packing keeps terminal element on Page 1 when adding another element that overflows', () => {
    // Suppose Page 1 has available capacity for 8 items flush, but not 9 items.
    const items = [
      { id: 's1', title: 'Skill 1', height: 30 },
      { id: 's2', title: 'Skill 2', height: 30 },
      { id: 's3', title: 'Skill 3', height: 30 },
      { id: 's4', title: 'Skill 4', height: 30 },
      { id: 's5', title: 'Skill 5', height: 30 },
      { id: 's6', title: 'Skill 6', height: 30 },
      { id: 's7', title: 'Skill 7', height: 30 },
      { id: 's8', title: 'Skill 8', height: 30 },
    ];

    // With itemGap = 6, 8 items take 7 * 30 + 24 (net of 8th) = 210 + 24 = 234px.
    // If pageCapacity + terminalTolerance = 235px:
    // 8 items fit (234 <= 235).
    // Now add 9th item (s9):
    // 9 items take 8 * 30 + 24 = 264px > 235px.
    // With greedy packing:
    // Page 1 MUST retain 8 items!
    // Page 2 MUST receive only 1 item (s9).
    // It must NEVER push 2 items to Page 2!
    const cv8 = {
      layout: { isAtsMode: true },
      sections: [{ id: 'skills', type: 'skills', title: '', items }],
    };

    const cv9 = {
      layout: { isAtsMode: true },
      sections: [
        {
          id: 'skills',
          type: 'skills',
          title: '',
          items: [...items, { id: 's9', title: 'Skill 9', height: 30 }],
        },
      ],
    };

    const pages8 = distributeSectionsToPages(cv8, {
      isEditor: true,
      pageCapacity: 227, // 227 + 7 = 234 effective
      itemGapPx: 6,
      sectionGapPx: 0,
    });

    const pages9 = distributeSectionsToPages(cv9, {
      isEditor: true,
      pageCapacity: 227,
      itemGapPx: 6,
      sectionGapPx: 0,
    });

    expect(pages8).toHaveLength(1);
    expect(pages8[0].singleSections[0].items).toHaveLength(8);

    expect(pages9).toHaveLength(2);
    // Page 1 MUST retain all 8 items greedily!
    expect(pages9[0].singleSections[0].items).toHaveLength(8);
    // Page 2 gets only the 1 overflowing item!
    expect(pages9[1].singleSections[0].items).toHaveLength(1);
    expect(pages9[1].singleSections[0].items[0].id).toBe('s9');
  });

  it('occupies all available space without overflowing physical page dimensions', () => {
    // Check that terminal element consumes up to availableOnPage + terminalTolerance
    const cv = {
      layout: { isAtsMode: true },
      sections: [
        {
          id: 'sec1',
          type: 'skills',
          title: '',
          items: [
            { id: 'it1', height: 50 },
            { id: 'it2', height: 50 },
          ],
        },
      ],
    };

    // Item 1 gross 50, Item 2 net 44 (itemGap 6). Total = 50 + 44 = 94px.
    // Standard pageCapacity = 90px, terminalTolerance = 11px. Effective = 101px.
    // Since 94 <= 101, both items fit on Page 1!
    const pages = distributeSectionsToPages(cv, {
      isEditor: true,
      pageCapacity: 90,
      itemGapPx: 6,
      sectionGapPx: 0,
      pagePaddingPx: 24,
      pageBottomClearancePx: 14,
    });

    expect(pages).toHaveLength(1);
    expect(pages[0].singleSections[0].items).toHaveLength(2);
  });
});
