import { describe, it, expect } from 'vitest';
import cvData from '../../../../.gemini/antigravity-cli/brain/1e1fe292-e669-4961-a690-dc0a46ec5280/scratch/juan_cv.json';

describe('Simulate recalculatePagination on Juan CV', () => {
  it('simulates pagination pass by pass', () => {
    const pageHeightPx = 1123;
    const gapPx = 20;
    const pagePadding = 24;

    // Exact measured heights in CSS px (from Cairo PDF points * 96/72):
    const rawItems = [
      { id: 'prof1', type: 'item', height: 139, sectionId: 'profile_header', isTitle: false },
      { id: 'about_title', type: 'title', height: 28, sectionId: 'about_section', isTitle: true },
      { id: 'about1', type: 'item', height: 96, sectionId: 'about_section', isTitle: false },
      { id: 'exp_title', type: 'title', height: 28, sectionId: 'experience', isTitle: true },
      { id: 'exp1', type: 'item', height: 162, sectionId: 'experience', isTitle: false },
      { id: 'exp2', type: 'item', height: 87, sectionId: 'experience', isTitle: false },
      { id: 'skills_title', type: 'title', height: 28, sectionId: 'skills', isTitle: true },
      { id: 'sk_all', type: 'item', height: 76, sectionId: 'skills', isTitle: false },
      { id: 'projects_title', type: 'title', height: 28, sectionId: 'projects', isTitle: true },
      { id: 'proj1', type: 'item', height: 236, sectionId: 'projects', isTitle: false },
      { id: 'proj2', type: 'item', height: 236, sectionId: 'projects', isTitle: false },
      { id: 'proj3', type: 'item', height: 290, sectionId: 'projects', isTitle: false },
      { id: 'edu_title', type: 'title', height: 28, sectionId: 'education', isTitle: true },
      { id: 'edu_all', type: 'item', height: 180, sectionId: 'education', isTitle: false },
      { id: 'cert_title', type: 'title', height: 28, sectionId: 'certificates', isTitle: true },
      { id: 'cert_all', type: 'item', height: 76, sectionId: 'certificates', isTitle: false },
      { id: 'lang_title', type: 'title', height: 28, sectionId: 'languages', isTitle: true },
      { id: 'lang1', type: 'item', height: 23, sectionId: 'languages', isTitle: false }
    ];

    // Simulate current algorithm:
    let items = rawItems.map(it => ({ ...it, marginTop: 0, forcedBreak: false, fold: null }));

    function computePositions() {
      let curY = pagePadding;
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        curY += it.marginTop;
        it.top = curY;
        it.bottom = curY + it.height;
        curY = it.bottom;
      }
      return curY;
    }

    let passes = 0;
    let hasChanges = true;

    while (hasChanges && passes < 6) {
      passes++;
      hasChanges = false;
      const totalH = computePositions();
      const estimatedPages = Math.max(1, Math.ceil((totalH + gapPx) / (pageHeightPx + gapPx)));

      console.log(`PASS ${passes}: totalH=${totalH}, estimatedPages=${estimatedPages}`);

      for (let pageNum = 1; pageNum <= estimatedPages; pageNum++) {
        const foldTop = pageNum * pageHeightPx + (pageNum - 1) * gapPx;
        const foldBottom = foldTop + gapPx;
        const contentAreaBottom = foldTop - pagePadding;
        const nextContentAreaTop = foldBottom + pagePadding;

        for (const item of items) {
          if (item.forcedBreak) continue;

          const { top, bottom, height } = item;
          if (height <= 0) continue;
          if (top >= foldBottom) continue;

          const isOrphanTitle =
            item.isTitle &&
            top < contentAreaBottom &&
            bottom > contentAreaBottom - 60;

          if (!isOrphanTitle && bottom <= contentAreaBottom - 4) {
            continue;
          }

          item.forcedBreak = true;
          item.fold = pageNum;
          const pushDistance = Math.max(0, nextContentAreaTop - top);
          item.marginTop = pushDistance;
          console.log(`  Fold ${pageNum}: Breaking item ${item.id} (${item.isTitle ? 'TITLE' : 'ITEM'}), top=${top}, bottom=${bottom}, contentAreaBottom=${contentAreaBottom}, pushDistance=${pushDistance}`);
          hasChanges = true;
          break;
        }
      }
    }

    computePositions();
    console.log('FINAL RESULTS:');
    items.forEach(it => {
      if (it.forcedBreak || it.marginTop > 0) {
        console.log(`  ${it.id}: forcedBreak=${it.forcedBreak}, fold=${it.fold}, marginTop=${it.marginTop}, top=${it.top}, bottom=${it.bottom}`);
      }
    });

    // If we want projects_title to break when its child proj1 cannot fit:
    console.log('Test completed.');
  });

  it('inspects live editor rendering of Juan CV with real layout mock', async () => {
    const React = await import('react');
    const { render, act } = await import('@testing-library/react');
    const { CVProvider } = await import('../context/CVContext');
    const App = (await import('../App')).default;

    localStorage.setItem('cvData', JSON.stringify(cvData));

    // Element height map (in CSS px):
    const heightMap = {
      'prof1': 139,
      'about_section': 28, // title
      'about1': 96,
      'experience': 28, // title
      'exp1': 162,
      'exp2': 87,
      'skills': 28, // title
      'sk1': 16,
      'sk2': 16,
      'sk3': 16,
      'sk4': 16,
      'sk5': 16,
      'projects': 28, // title
      'proj1': 236,
      'proj2': 236,
      'proj3': 290,
      'education': 28, // title
      'edu1': 60,
      'edu2': 60,
      'edu3': 60,
      'certificates': 28, // title
      'cert1': 25,
      'cert2': 25,
      'cert3': 25,
      'languages': 28, // title
      'lang1': 23
    };

    const { container } = render(
      React.createElement(CVProvider, null, React.createElement(App))
    );

    const areaCv = container.querySelector('#area-cv');

    // Mock getBoundingClientRect on all breakable components
    let currentY = 24; // pagePadding
    const selector = ".section-title, .cv-block, .experience__content, .education__content, .skills__name, .profile__description, .home__data, .simple-list-item, li.cv-block, .contact__item, .editable-item-container";
    const rawList = Array.from(areaCv.querySelectorAll(selector));
    const items = rawList.filter((item, idx, arr) => {
      if (item.classList.contains("section-title")) return true;
      const hasParentInList = arr.some(
        (other) =>
          other !== item &&
          other.contains(item) &&
          !other.classList.contains("section-title"),
      );
      return !hasParentInList;
    });

    console.log('Filtered breakable items count:', items.length);

    items.forEach((item) => {
      const id = item.getAttribute('data-item-id') || item.getAttribute('data-section-title') || item.id || '';
      const h = heightMap[id] || (item.classList.contains('section-title') ? 28 : 50);
      const top = currentY;
      const bottom = top + h;
      currentY = bottom + 8; // item-gap or margin

      item.getBoundingClientRect = vi.fn(() => ({
        top,
        bottom,
        height: h,
        left: 0,
        right: 794,
        width: 794
      }));
    });

    areaCv.getBoundingClientRect = vi.fn(() => ({
      top: 0,
      bottom: currentY,
      height: currentY,
      left: 0,
      right: 794,
      width: 794
    }));
    Object.defineProperty(areaCv, 'scrollHeight', { value: currentY, configurable: true });

    // Re-trigger recalculation
    window.dispatchEvent(new Event('resize'));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    const brokenNodes = areaCv?.querySelectorAll('[data-editor-break-forced="true"]');
    expect(brokenNodes?.length).toBe(1);
    expect(brokenNodes?.[0].getAttribute('data-item-id')).toBe('proj2');
  });

  it('verifies anti-orphan lookahead: section title breaks to next page when its first child cannot fit on current page', async () => {
    const React = await import('react');
    const { render, act } = await import('@testing-library/react');
    const { CVProvider } = await import('../context/CVContext');
    const App = (await import('../App')).default;

    localStorage.setItem('cvData', JSON.stringify(cvData));

    // Element height map where proj1 ends PAST contentAreaBottom (e.g. 1110px > 1095px)
    const heightMap = {
      'prof1': 140,
      'about_section': 28,
      'about1': 110,
      'experience': 28,
      'exp1': 200,
      'exp2': 100,
      'skills': 28,
      'sk1': 22,
      'sk2': 22,
      'sk3': 22,
      'sk4': 22,
      'sk5': 22,
      'projects': 28, // title ends at ~840px
      'proj1': 280,   // bottom ends at 840 + 280 = 1120px > 1095px!
      'proj2': 200,
      'proj3': 200,
      'education': 28,
      'edu1': 60,
      'edu2': 60,
      'edu3': 60,
      'certificates': 28,
      'cert1': 25,
      'cert2': 25,
      'cert3': 25,
      'languages': 28,
      'lang1': 23
    };

    const { container } = render(
      React.createElement(CVProvider, null, React.createElement(App))
    );

    const areaCv = container.querySelector('#area-cv');
    let currentY = 24;
    const selector = ".section-title, .cv-block, .experience__content, .education__content, .skills__name, .profile__description, .home__data, .simple-list-item, li.cv-block, .contact__item, .editable-item-container";
    const rawList = Array.from(areaCv.querySelectorAll(selector));
    const items = rawList.filter((item, idx, arr) => {
      if (item.classList.contains("section-title")) return true;
      const hasParentInList = arr.some(
        (other) =>
          other !== item &&
          other.contains(item) &&
          !other.classList.contains("section-title"),
      );
      return !hasParentInList;
    });

    items.forEach((item) => {
      const id = item.getAttribute('data-item-id') || item.getAttribute('data-section-title') || item.id || '';
      const h = heightMap[id] || (item.classList.contains('section-title') ? 28 : 50);
      const top = currentY;
      const bottom = top + h;
      currentY = bottom + 8;

      item.getBoundingClientRect = vi.fn(() => ({
        top,
        bottom,
        height: h,
        left: 0,
        right: 794,
        width: 794
      }));
    });

    areaCv.getBoundingClientRect = vi.fn(() => ({
      top: 0,
      bottom: currentY,
      height: currentY,
      left: 0,
      right: 794,
      width: 794
    }));
    Object.defineProperty(areaCv, 'scrollHeight', { value: currentY, configurable: true });

    window.dispatchEvent(new Event('resize'));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    const brokenNodes = areaCv?.querySelectorAll('[data-editor-break-forced="true"]');
    // Because proj1 could not fit on page 1, projects title itself MUST have broken to page 2!
    // It should NEVER leave projects title stranded on page 1 alone!
    const brokenSectionTitle = areaCv?.querySelector('[data-section-title="projects"][data-editor-break-forced="true"]');
    expect(brokenSectionTitle).not.toBeNull();
    expect(brokenSectionTitle?.getAttribute('data-editor-break-fold')).toBe('1');
  });

  it('verifies generateCleanPrintHTML preserves variables and contains zero bullet margin bloat', async () => {
    const { generateCleanPrintHTML } = await import('../utils/staticHtmlPdfEngine');
    const html = generateCleanPrintHTML(cvData, 'es', {
      width: 794,
      height: 2246,
      pageHeightPx: 1123,
      brokenElements: [{ itemId: 'proj2', isTitle: false, fold: '1', pageNum: 1 }],
      totalPages: 2
    });

    // Essential CSS variables preserved in :root
    expect(html).toContain('--mb-1: .5rem;');
    expect(html).toContain('--mb-2: 1rem;');
    expect(html).toContain('--mb-3: 1.5rem;');
    expect(html).toContain('--first-color: #3874ff;');
    expect(html).toContain('--font-semi-bold: 600;');

    // Bullet margins do not add artificial 0.25rem bloat
    expect(html).not.toMatch(/ul\.experience__bullets[^}]*margin-bottom:\s*0\.25rem\s*!important/);
    expect(html).not.toMatch(/ul\.simple-list-ul[^}]*margin-bottom:\s*0\.25rem\s*!important/);

    // Snapshot breaks applied properly
    expect(html).toContain('[data-item-id="proj2"]');
    expect(html).toContain('break-before: page !important');
  });
});
