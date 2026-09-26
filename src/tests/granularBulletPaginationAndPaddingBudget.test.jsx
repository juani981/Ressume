/**
 * granularBulletPaginationAndPaddingBudget.test.jsx
 *
 * Comprehensive tests for:
 * 1. Granular bullet-level partitioning across pages (Answer 2)
 * 2. Exact mathematical page budget ahead-of-time (1123px - 2 * pagePadding) without phantom padding
 * 3. Clean continuation item rendering without duplicated headers or action handles (Answer 3)
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { distributeSectionsToPages, estimateItemBaseHeight, estimateSingleBulletHeight } from '../utils/pageDistributor';
import { ExperienceItemPrintView } from '../components/CV/items/ExperienceItem';
import { ProjectsItemPrintView } from '../components/CV/items/ProjectsItem';
import { VolunteeringItemPrintView } from '../components/CV/items/VolunteeringItem';
import { PrintBaseItem } from '../components/CV/BaseItem';

describe('Ahead-of-Time Capacity & Granular Bullet Partitioning', () => {
  it('correctly calculates page capacity strictly as 1123 - 2 * pagePadding', () => {
    // When padding is 24: useful capacity = 1123 - 48 = 1075px
    // Section 1 occupies 850px.
    // Section 2 requires 200px (20 gap + 36 header + 144 items).
    // Total needed: 850 + 200 = 1050px <= 1075px.
    // Both sections MUST fit on Page 1 without jumping!
    const cv = {
      layout: { type: '1-column', isAtsMode: true, pagePadding: 24, sectionGap: 20 },
      sections: [
        {
          id: 'sec1',
          type: 'list',
          title: 'Section One',
          items: [{ id: 'i1', height: 814 }], // 814 + 36 header = 850px
        },
        {
          id: 'sec2',
          type: 'experience',
          title: 'Section Two',
          items: [
            {
              id: 'exp1',
              title: 'Role',
              subtitle: 'Company',
              date: '2024',
              height: 144,
            },
          ],
        },
      ],
    };

    const pages = distributeSectionsToPages(cv, { isEditor: true });
    expect(pages.length).toBe(1);
    expect(pages[0].singleSections.map(s => s.id)).toEqual(['sec1', 'sec2']);
  });

  it('keeps section on Page 1 when margin is > 0 and content fits mathematically', () => {
    // Regression check for user scenario:
    // With margin 10px: usefulCapacity = 1123 - 20 = 1103px.
    // Content is 1000px. Must be 1 page, not prematurely jumped to page 2.
    const cv = {
      layout: { type: '1-column', isAtsMode: true, pagePadding: 10, sectionGap: 20 },
      sections: [
        {
          id: 'sec1',
          type: 'experience',
          title: 'Experience',
          items: [
            { id: 'exp1', height: 400 },
            { id: 'exp2', height: 400 },
          ],
        },
        {
          id: 'sec2',
          type: 'education',
          title: 'Education',
          items: [
            { id: 'edu1', height: 100 },
          ],
        },
      ],
    };

    const pages = distributeSectionsToPages(cv, { isEditor: true });
    expect(pages.length).toBe(1);
    expect(pages[0].singleSections.map(s => s.id)).toEqual(['sec1', 'sec2']);
  });

  it('splits multi-bullet item across pages when first bullets fit (Answer 2)', () => {
    // Page capacity: 1000px.
    // Section 1 occupies 800px (header + items).
    // Available: 1000 - 800 = 200px.
    // Section 2: gap = 20px, header = 36px. Left for items = 144px.
    // Exp item has: base height = 40px, plus 4 bullets (each ~24px).
    // Base (40px) + Bullet 0 (24px) + Bullet 1 (24px) = 88px <= 144px -> Fits!
    // Bullet 2 (24px) + Bullet 3 (24px) -> Total would be 184px > 144px.
    // The distributor must split the item: bullets 0 & 1 on Page 1, bullets 2 & 3 on Page 2!
    const cv = {
      layout: { type: '1-column', isAtsMode: true, pagePadding: 0, sectionGap: 20 },
      sections: [
        {
          id: 'top_sec',
          type: 'list',
          title: 'Top Section',
          items: [{ id: 'top_item', height: 840 }], // 840 + 36 = 876px
        },
        {
          id: 'exp_sec',
          type: 'experience',
          title: 'Work Experience',
          items: [
            {
              id: 'job1',
              title: 'Senior Developer',
              subtitle: 'Enterprise Co',
              date: '2023 – Present',
              bullets: [
                'First major accomplishment and responsibility',
                'Second significant engineering impact milestone',
                'Third task continued on next page',
                'Fourth achievement continued on next page',
              ],
            },
          ],
        },
      ],
    };

    const pages = distributeSectionsToPages(cv, { pageCapacity: 1000 });
    expect(pages.length).toBe(2);

    const p1Exp = pages[0].singleSections.find(s => s.id === 'exp_sec');
    const p2Exp = pages[1].singleSections.find(s => s.id.startsWith('exp_sec'));

    expect(p1Exp).toBeDefined();
    expect(p2Exp).toBeDefined();

    // Page 1 has job1 with first subset of bullets
    expect(p1Exp.items.length).toBe(1);
    const p1Job = p1Exp.items[0];
    expect(p1Job.isPartialItem).toBe(true);
    expect(p1Job.bullets.length).toBeGreaterThan(0);
    expect(p1Job.bullets.length).toBeLessThan(4);

    // Page 2 has continuation job with remaining bullets
    expect(p2Exp.items.length).toBe(1);
    const p2Job = p2Exp.items[0];
    expect(p2Job.isContinuationItem).toBe(true);
    expect(p2Job.originalItemId).toBe('job1');
    expect(p2Job.bullets.length).toBe(4 - p1Job.bullets.length);
    expect(p2Job.title).toBe(''); // Seamless continuation without repeating title
  });
});

describe('Continuation Item Visual Rendering (Answer 3)', () => {
  it('renders ExperienceItem continuation without repeating title, company or rounder', () => {
    const item = {
      id: 'exp1__cont_2',
      originalItemId: 'exp1',
      isContinuationItem: true,
      title: '',
      subtitle: '',
      date: '',
      bullets: ['Continuation bullet 3', 'Continuation bullet 4'],
    };

    const { container } = render(<ExperienceItemPrintView item={item} sectionId="exp" isLast={false} />);

    // Rounder should NOT be rendered on continuation item
    expect(container.querySelector('.experience__rounder')).toBeNull();

    // Timeline line SHOULD still be rendered to continue timeline flow
    expect(container.querySelector('.experience__line')).not.toBeNull();

    // Title and company should NOT be rendered
    expect(container.querySelector('.experience__title')).toBeNull();
    expect(container.querySelector('.experience__company')).toBeNull();

    // Bullets MUST be rendered
    expect(screen.getByText('Continuation bullet 3')).toBeDefined();
    expect(screen.getByText('Continuation bullet 4')).toBeDefined();
  });

  it('renders ProjectsItem continuation cleanly without repeating project title or date', () => {
    const item = {
      id: 'proj1__cont_2',
      originalItemId: 'proj1',
      isContinuationItem: true,
      title: '',
      subtitle: '',
      date: '',
      bullets: ['Feature A completed', 'Feature B delivered'],
    };

    const { container } = render(<ProjectsItemPrintView item={item} sectionId="projects" isLast={false} />);

    expect(container.querySelector('.experience__rounder')).toBeNull();
    expect(container.querySelector('.experience__title')).toBeNull();
    expect(screen.getByText('Feature A completed')).toBeDefined();
    expect(screen.getByText('Feature B delivered')).toBeDefined();
  });

  it('renders VolunteeringItem continuation cleanly', () => {
    const item = {
      id: 'vol1__cont_2',
      originalItemId: 'vol1',
      isContinuationItem: true,
      title: '',
      subtitle: '',
      date: '',
      bullets: ['Community outreach', 'Workshop coordination'],
    };

    const { container } = render(<VolunteeringItemPrintView item={item} sectionId="volunteering" isLast={false} />);

    expect(container.querySelector('.experience__rounder')).toBeNull();
    expect(container.querySelector('.experience__title')).toBeNull();
    expect(screen.getByText('Community outreach')).toBeDefined();
    expect(screen.getByText('Workshop coordination')).toBeDefined();
  });
});
