import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  A4_PRINT_HEIGHT_MM,
  EDITOR_PAGE_HEIGHT_MM,
  EDITOR_HEIGHT_REDUCTION_MM,
  A4_PRINT_PAGE_HEIGHT_PX,
  EDITOR_PAGE_HEIGHT_PX,
} from '../utils/pageGeometry';
import { createSanitizedPrintClone } from '../utils/staticHtmlPdfEngine';
import printStyles from '../styles/print.css?raw';

describe('Anti-Cascade Page Breaks and WYSIWYG Print Safety Budget', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  it('1. Editor page height is configured with a 25mm safety buffer against standard A4 print', () => {
    expect(EDITOR_HEIGHT_REDUCTION_MM).toBe(25);
    expect(EDITOR_PAGE_HEIGHT_MM).toBe(272);
    expect(A4_PRINT_HEIGHT_MM).toBe(297);

    // Buffer in pixels at 96 DPI: 1123px - 1028px = 95px
    const bufferPx = A4_PRINT_PAGE_HEIGHT_PX - EDITOR_PAGE_HEIGHT_PX;
    expect(bufferPx).toBeGreaterThanOrEqual(90);
  });

  it('2. print.css strictly forbids [data-editor-break-forced="true"] from triggering break-before: page', () => {
    // Must NOT match data-editor-break-forced with break-before: page
    expect(printStyles).not.toMatch(
      /\[data-editor-break-forced="true"\][^}]*?break-before:\s*page\s*!important/
    );

    // MUST match data-editor-break-forced with break-before: auto
    expect(printStyles).toMatch(
      /\[data-editor-break-forced="true"\][\s\S]*?break-before:\s*auto\s*!important/
    );
  });

  it('3. createSanitizedPrintClone strips forced breaks on editor break elements to prevent cascading empty pages', () => {
    const areaCv = document.createElement('div');
    areaCv.id = 'area-cv';
    const leftCol = document.createElement('div');
    leftCol.className = 'resume__left';
    areaCv.appendChild(leftCol);

    const rightCol = document.createElement('div');
    rightCol.className = 'resume__right';

    // Page 1 Item A
    const itemA = document.createElement('div');
    itemA.className = 'cv-block';
    itemA.id = 'item-a';
    rightCol.appendChild(itemA);

    // Page 1 Item B (spills slightly to Page 2 in print engine)
    const itemB = document.createElement('div');
    itemB.className = 'cv-block';
    itemB.id = 'item-b';
    rightCol.appendChild(itemB);

    // Item C (which editor had pushed to fold 1 with data-editor-break-forced)
    const itemC = document.createElement('div');
    itemC.className = 'cv-block';
    itemC.id = 'item-c';
    itemC.setAttribute('data-editor-break-forced', 'true');
    itemC.setAttribute('data-editor-break-fold', '1');
    itemC.style.marginTop = '60px';
    rightCol.appendChild(itemC);

    // Item D (following item on Page 2)
    const itemD = document.createElement('div');
    itemD.className = 'cv-block';
    itemD.id = 'item-d';
    rightCol.appendChild(itemD);

    areaCv.appendChild(rightCol);
    container.appendChild(areaCv);

    const clone = createSanitizedPrintClone(areaCv);
    expect(clone).not.toBeNull();

    const clonedC = clone.querySelector('#item-c');
    expect(clonedC).not.toBeNull();

    // CRITICAL: Item C MUST have breakBefore: auto and no forced break classes
    // so if Item B spills to Page 2, Item C continues organically on Page 2
    // instead of forcing a jump to Page 3 leaving Page 2 empty!
    expect(clonedC.style.breakBefore).toBe('auto');
    expect(clonedC.style.pageBreakBefore).toBe('auto');
    expect(clonedC.style.marginTop).toBe('');
    expect(clonedC.classList.contains('force-page-break-before')).toBe(false);
    expect(clonedC.classList.contains('break-page-before')).toBe(false);
    expect(clonedC.hasAttribute('data-editor-break-forced')).toBe(false);
    expect(clonedC.hasAttribute('data-page-break-forced')).toBe(false);
  });

  it('4. Atomic items preserve break-inside: avoid for clean boundaries without cascades', () => {
    expect(printStyles).toMatch(
      /\.cv-block[\s\S]*?break-inside:\s*avoid\s*!important/
    );
    expect(printStyles).toMatch(
      /\.experience__content[\s\S]*?break-inside:\s*avoid\s*!important/
    );
    expect(printStyles).toMatch(
      /\.education__content[\s\S]*?break-inside:\s*avoid\s*!important/
    );
  });
});
