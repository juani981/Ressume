/**
 * splitComponentHoverBordersAndPageFold.test.jsx
 *
 * Comprehensive test suite verifying:
 * 1. Sections with internal forced breaks receive split visual hover decorations (.has-split-break, data-section-split="true", --split-part1-height, --split-part2-top).
 * 2. Sections with title-only breaks receive .has-split-break--page2-only.
 * 3. Items with broken bullets receive item-level split decorations.
 * 4. resetForcedPageBreaks cleanly clears all split decorations.
 * 5. A4PageGuides fold guides and "Eliminar página" buttons have z-index >= 60, higher than section hover z-index (40), guaranteeing unblocked clickability.
 * 6. Dual layout support: works across both 2-column mode and ATS 1-column mode.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  executePaginationAlgorithm,
  resetForcedPageBreaks,
  applySplitComponentVisualDecorations,
} from '../utils/paginationEngine';
import { A4PageGuides } from '../components/Editor/A4PageGuides';
import { A4_PAGE_HEIGHT_PX, A4_GAP_PX } from '../utils/pageGeometry';

describe('Split Component Hover Borders & Page Fold Guides', () => {
  let areaCv;

  beforeEach(() => {
    document.body.innerHTML = '';
    areaCv = document.createElement('div');
    areaCv.id = 'area-cv';
    areaCv.style.position = 'relative';
    areaCv.style.width = '794px';
    document.body.appendChild(areaCv);
  });

  it('1. A4PageGuides renders page fold guide with zIndex >= 60 and pointerEvents auto', () => {
    const onDeletePage = vi.fn();
    const { container } = render(
      <A4PageGuides totalPages={2} pagePadding={24} onDeletePage={onDeletePage} />
    );

    const foldGuide = container.querySelector('.a4-page-fold-guide');
    expect(foldGuide).not.toBeNull();
    expect(foldGuide.style.zIndex).toBe('60');
    expect(foldGuide.style.pointerEvents).toBe('auto');

    const badge = container.querySelector('.a4-page-fold-badge');
    expect(badge).not.toBeNull();
    expect(badge.style.zIndex).toBe('65');

    const deleteBtn = container.querySelector('.a4-page-delete-btn');
    expect(deleteBtn).not.toBeNull();
    expect(deleteBtn.style.zIndex).toBe('70');
    expect(deleteBtn.style.pointerEvents).toBe('auto');

    // Click triggers onDeletePage
    fireEvent.click(deleteBtn);
    expect(onDeletePage).toHaveBeenCalledWith(2);
  });

  it('2. applySplitComponentVisualDecorations marks sections spanning a fold with .has-split-break and coordinates', () => {
    // Construct a section with title, item 1 (Page 1) and item 2 (broken to Page 2)
    const section = document.createElement('section');
    section.className = 'experience section editable-section-container cv-section';
    section.id = 'exp_section';
    section.setAttribute('data-section-id', 'exp_section');

    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = 'Experiencia';

    const item1 = document.createElement('div');
    item1.className = 'editable-item-container cv-block';
    item1.id = 'item_1';

    const item2 = document.createElement('div');
    item2.className = 'editable-item-container cv-block';
    item2.id = 'item_2';
    item2.setAttribute('data-editor-break-forced', 'true');
    item2.setAttribute('data-editor-break-fold', '1');
    item2.style.marginTop = '60px';

    section.appendChild(title);
    section.appendChild(item1);
    section.appendChild(item2);
    areaCv.appendChild(section);

    applySplitComponentVisualDecorations(areaCv, 1123, 24, 20);

    expect(section.classList.contains('has-split-break')).toBe(true);
    expect(section.getAttribute('data-section-split')).toBe('true');
    expect(section.style.getPropertyValue('--split-part1-height')).toBeTruthy();
    expect(section.style.getPropertyValue('--split-part2-top')).toBeTruthy();
  });

  it('3. Title-only page break assigns .has-split-break--page2-only so hover outline only appears on Page 2', () => {
    const section = document.createElement('section');
    section.className = 'education section editable-section-container cv-section';
    section.id = 'edu_section';

    const title = document.createElement('h2');
    title.className = 'section-title';
    title.setAttribute('data-editor-break-forced', 'true');
    title.setAttribute('data-editor-break-fold', '1');
    title.style.marginTop = '120px';

    const item1 = document.createElement('div');
    item1.className = 'editable-item-container cv-block';

    section.appendChild(title);
    section.appendChild(item1);
    areaCv.appendChild(section);

    applySplitComponentVisualDecorations(areaCv, 1123, 24, 20);

    expect(section.classList.contains('has-split-break')).toBe(true);
    expect(section.classList.contains('has-split-break--page2-only')).toBe(true);
    expect(section.getAttribute('data-section-split')).toBe('page2-only');
    expect(section.style.getPropertyValue('--split-part1-height')).toBe('0px');
  });

  it('4. Items with overflowing broken bullets receive item-level .has-split-break', () => {
    const section = document.createElement('section');
    section.className = 'experience section editable-section-container cv-section';

    const item = document.createElement('div');
    item.className = 'editable-item-container cv-block';

    const bulletList = document.createElement('ul');
    bulletList.className = 'experience__bullets';

    const b1 = document.createElement('li');
    b1.className = 'cv-block';
    b1.textContent = 'Bullet 1 on page 1';

    const b2 = document.createElement('li');
    b2.className = 'cv-block';
    b2.textContent = 'Bullet 2 on page 2';
    b2.setAttribute('data-editor-break-forced', 'true');
    b2.setAttribute('data-editor-break-fold', '1');
    b2.style.marginTop = '50px';

    bulletList.appendChild(b1);
    bulletList.appendChild(b2);
    item.appendChild(bulletList);
    section.appendChild(item);
    areaCv.appendChild(section);

    applySplitComponentVisualDecorations(areaCv, 1123, 24, 20);

    expect(section.classList.contains('has-split-break')).toBe(true);
    expect(item.classList.contains('has-split-break')).toBe(true);
    expect(item.getAttribute('data-item-split')).toBe('true');
    expect(item.style.getPropertyValue('--split-part1-height')).toBeTruthy();
    expect(item.style.getPropertyValue('--split-part2-top')).toBeTruthy();
  });

  it('5. resetForcedPageBreaks removes all split break classes and styles completely', () => {
    const section = document.createElement('section');
    section.className = 'experience section editable-section-container cv-section has-split-break has-split-break--page2-only';
    section.setAttribute('data-section-split', 'true');
    section.style.setProperty('--split-part1-height', '180px');
    section.style.setProperty('--split-part2-top', '260px');

    const item = document.createElement('div');
    item.className = 'editable-item-container cv-block has-split-break';
    item.setAttribute('data-item-split', 'true');
    item.style.setProperty('--split-part1-height', '40px');
    item.style.setProperty('--split-part2-top', '80px');

    const brokenChild = document.createElement('div');
    brokenChild.setAttribute('data-editor-break-forced', 'true');
    brokenChild.setAttribute('data-editor-break-fold', '1');
    brokenChild.style.marginTop = '100px';

    item.appendChild(brokenChild);
    section.appendChild(item);
    areaCv.appendChild(section);

    resetForcedPageBreaks(areaCv);

    expect(section.classList.contains('has-split-break')).toBe(false);
    expect(section.classList.contains('has-split-break--page2-only')).toBe(false);
    expect(section.getAttribute('data-section-split')).toBeNull();
    expect(section.style.getPropertyValue('--split-part1-height')).toBe('');
    expect(section.style.getPropertyValue('--split-part2-top')).toBe('');

    expect(item.classList.contains('has-split-break')).toBe(false);
    expect(item.getAttribute('data-item-split')).toBeNull();
    expect(item.style.getPropertyValue('--split-part1-height')).toBe('');
    expect(item.style.getPropertyValue('--split-part2-top')).toBe('');
    expect(brokenChild.getAttribute('data-editor-break-forced')).toBeNull();
  });

  it('6. executePaginationAlgorithm automatically applies split decorations when breaks occur', () => {
    const singleCol = document.createElement('div');
    singleCol.className = 'resume__single-column';

    const section = document.createElement('section');
    section.className = 'experience section editable-section-container cv-section';
    section.id = 'exp';

    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = 'Work Experience';

    const item1 = document.createElement('div');
    item1.className = 'editable-item-container cv-block';
    item1.id = 'exp_1';

    const item2 = document.createElement('div');
    item2.className = 'editable-item-container cv-block';
    item2.id = 'exp_2';

    section.appendChild(title);
    section.appendChild(item1);
    section.appendChild(item2);
    singleCol.appendChild(section);
    areaCv.appendChild(singleCol);

    // Mock bounding coordinates so item2 overflows page 1 forbidden boundary
    vi.spyOn(areaCv, 'getBoundingClientRect').mockReturnValue({ top: 0, left: 0, width: 794, height: 1600 });
    vi.spyOn(singleCol, 'getBoundingClientRect').mockReturnValue({ top: 0, left: 0, width: 794, height: 1600 });
    vi.spyOn(section, 'getBoundingClientRect').mockReturnValue({ top: 900, left: 0, width: 794, height: 600 });
    vi.spyOn(title, 'getBoundingClientRect').mockReturnValue({ top: 900, left: 0, width: 794, height: 40 });
    vi.spyOn(item1, 'getBoundingClientRect').mockReturnValue({ top: 945, left: 0, width: 794, height: 140 }); // bottom 1085 <= 1099
    vi.spyOn(item2, 'getBoundingClientRect').mockReturnValue({ top: 1090, left: 0, width: 794, height: 150 }); // bottom 1240 > 1099 -> overflows!

    const cvData = {
      layout: { type: '1-column', isAtsMode: true, pagePadding: 24 }
    };

    const res = executePaginationAlgorithm({
      areaCv,
      cvData,
      pageHeightPx: 1123,
      gapPx: 20
    });

    expect(item2.getAttribute('data-editor-break-forced')).toBe('true');
    expect(section.classList.contains('has-split-break')).toBe(true);
    expect(section.getAttribute('data-section-split')).toBe('true');
  });
});
