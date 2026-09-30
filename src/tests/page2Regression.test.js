import { describe, it, expect } from 'vitest';
import { distributeSectionsToPages, estimateItemHeight, estimateHeaderHeight } from '../utils/pageDistributor';

describe('Page 2+ Content Break Rules & Distribution', () => {
  it('Evaluates Acceptance Criteria on Page 2 exactly as on Page 1', () => {
    // Page capacity ~1075 (1123 - 48).
    // Let Section 1 fill 800px on Page 1.
    // Section 2 has 2 items: item 1 (150px), item 2 (200px).
    // Item 1 fits on Page 1 (800 + 36 + 150 = 986 <= 1075).
    // Item 2 spills to Page 2.
    // So on Page 2: Experience continuation has item 2 (200px).
    // Current used on Page 2 = 200px.
    // Remaining on Page 2 = 1075 - 200 = 875px.
    //
    // Now Section 3 (Education) comes in:
    // Suppose Education has 4 items, each 200px. Header is 36px, gap is 20px.
    // Total Education height = 20 + 36 + 800 = 856px.
    // Since 200 + 856 = 1056 <= 1075:
    // By Criterion 1, Section 3 MUST stay on Page 2!
    const cv = {
      layout: { type: '1-column', isAtsMode: true, pagePadding: 24, sectionGap: 20 },
      sections: [
        {
          id: 'sec1',
          type: 'list',
          title: 'Section 1',
          items: [{ id: 'i1', height: 764 }], // 764 + 36 = 800
        },
        {
          id: 'sec2',
          type: 'experience',
          title: 'Experience',
          items: [
            { id: 'exp1', height: 150 }, // fits on page 1 (800 + 20 + 36 + 150 = 1006 <= 1075)
            { id: 'exp2', height: 200 }, // spills to page 2
          ],
        },
        {
          id: 'sec3',
          type: 'education',
          title: 'Education',
          items: [
            { id: 'edu1', height: 150 },
            { id: 'edu2', height: 150 },
          ],
        },
      ],
    };

    const pages = distributeSectionsToPages(cv, { isEditor: true, uniqueContinuationIds: true });
    console.log('Test 1 Pages count:', pages.length);
    pages.forEach((p, i) => {
      console.log(`Page ${i + 1} sections:`, p.singleSections.map(s => `${s.id} (items: ${s.items.length})`));
    });

    expect(pages.length).toBe(2);
    expect(pages[0].singleSections.map(s => s.id)).toEqual(['sec1', 'sec2']);
    expect(pages[1].singleSections.map(s => s.id)).toEqual(['sec2__cont_2', 'sec3']);
  });

  it('Criterion 2 on Page 2: If only header fits on Page 2 but not first item, Section 3 MUST jump to Page 3', () => {
    // On Page 2: Sec 2 continuation takes 950px.
    // Remaining space on Page 2 = 1075 - 950 = 125px.
    // Section 3: gap 20px + header 36px + item 1 150px = 206px > 125px.
    // Education CANNOT fit on Page 2! It must cleanly jump to Page 3!
    const cv = {
      layout: { type: '1-column', isAtsMode: true, pagePadding: 24, sectionGap: 20 },
      sections: [
        {
          id: 'sec1',
          type: 'list',
          title: 'Section 1',
          items: [{ id: 'i1', height: 764 }],
        },
        {
          id: 'sec2',
          type: 'experience',
          title: 'Experience',
          items: [
            { id: 'exp1', height: 150 }, // fits on page 1
            { id: 'exp2', height: 950 }, // spills to page 2, uses 950px
          ],
        },
        {
          id: 'sec3',
          type: 'education',
          title: 'Education',
          items: [
            { id: 'edu1', height: 150 },
            { id: 'edu2', height: 150 },
          ],
        },
      ],
    };

    const pages = distributeSectionsToPages(cv, { isEditor: true, uniqueContinuationIds: true });
    console.log('Test 2 Pages count:', pages.length);
    pages.forEach((p, i) => {
      console.log(`Page ${i + 1} sections:`, p.singleSections.map(s => `${s.id} (items: ${s.items.length})`));
    });

    expect(pages.length).toBe(3);
    expect(pages[1].singleSections.map(s => s.id)).toEqual(['sec2__cont_2']);
    expect(pages[2].singleSections.map(s => s.id)).toEqual(['sec3']);
  });

  it('Criterion 3 on Page 2: If header and first item of Section 3 fit on Page 2, but second item does not, Section 3 splits across Page 2 and Page 3', () => {
    // On Page 2: Sec 2 continuation takes 700px.
    // Remaining space on Page 2 = 1075 - 700 = 375px.
    // Section 3: gap 20px + header 36px + item 1 (150px) = 206px <= 375px -> FITS!
    // Item 2 (250px): 206 + 250 = 456px > 375px -> DOES NOT FIT!
    // Section 3 MUST split: header + item 1 on Page 2, item 2 on Page 3!
    const cv = {
      layout: { type: '1-column', isAtsMode: true, pagePadding: 24, sectionGap: 20 },
      sections: [
        {
          id: 'sec1',
          type: 'list',
          title: 'Section 1',
          items: [{ id: 'i1', height: 764 }],
        },
        {
          id: 'sec2',
          type: 'experience',
          title: 'Experience',
          items: [
            { id: 'exp1', height: 150 },
            { id: 'exp2', height: 700 },
          ],
        },
        {
          id: 'sec3',
          type: 'education',
          title: 'Education',
          items: [
            { id: 'edu1', height: 150 },
            { id: 'edu2', height: 250 },
          ],
        },
      ],
    };

    const pages = distributeSectionsToPages(cv, { isEditor: true, uniqueContinuationIds: true });
    console.log('Test 3 Pages count:', pages.length);
    pages.forEach((p, i) => {
      console.log(`Page ${i + 1} sections:`, p.singleSections.map(s => `${s.id} (items: ${s.items.length})`));
    });

    expect(pages.length).toBe(3);
    expect(pages[1].singleSections.map(s => s.id)).toEqual(['sec2__cont_2', 'sec3']);
    expect(pages[1].singleSections[1].items.map(it => it.id)).toEqual(['edu1']);
    expect(pages[2].singleSections.map(s => s.id)).toEqual(['sec3__cont_3']);
    expect(pages[2].singleSections[0].items.map(it => it.id)).toEqual(['edu2']);
  });
});
