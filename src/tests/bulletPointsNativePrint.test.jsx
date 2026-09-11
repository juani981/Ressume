import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { generateCleanPrintHTML } from '../utils/staticHtmlPdfEngine';
import { defaultSchema } from '../utils/schema';
import { ExperienceItemPrintView } from '../components/CV/items/ExperienceItem';
import { ProjectsItemPrintView } from '../components/CV/items/ProjectsItem';
import { VolunteeringItemPrintView } from '../components/CV/items/VolunteeringItem';
import SimpleListItem from '../components/CV/items/SimpleListItem';

describe('Native Styled Bullet Points in PDF & Print Output', () => {
  it('B1.1: generateCleanPrintHTML renders experience bullets as native <li> with list-style-type: disc', () => {
    const html = generateCleanPrintHTML(defaultSchema);

    // Assert ul has experience__bullets class and disc list style
    expect(html).toContain('class="experience__bullets"');
    expect(html).toContain('list-style-type:disc');

    // Assert zero fake circle spans or flex container artifacts inside the body markup
    const bodyHtml = html.split('<body')[1] || '';
    expect(bodyHtml).not.toContain('bullet-item-row');
    expect(bodyHtml).not.toContain('simple-list-circle');
    expect(bodyHtml).not.toContain('editable-item-container');
  });

  it('B1.2: ExperienceItemPrintView renders native <li> elements with display: list-item and no line breaks', () => {
    const item = {
      id: 'test_exp',
      title: 'Senior Engineer',
      subtitle: 'Tech Corp',
      bullets: [
        'Implemented high-throughput data processing pipeline.',
        'Mentored junior developers and conducted code reviews.'
      ]
    };

    const { container } = render(
      <ExperienceItemPrintView item={item} sectionId="exp_sec" />
    );

    const ul = container.querySelector('ul.experience__bullets');
    expect(ul).toBeInTheDocument();

    const lis = container.querySelectorAll('ul.experience__bullets li');
    expect(lis.length).toBe(2);

    lis.forEach((li) => {
      expect(li.style.display).toBe('list-item');
      expect(li.style.listStyleType).toBe('disc');
      expect(li.querySelector('.simple-list-circle')).toBeNull();
      expect(li.querySelector('.bullet-item-row')).toBeNull();
      // Text must be in an inline element
      const inlineDisplay = li.querySelector('.inline-edit-display');
      expect(inlineDisplay).toBeInTheDocument();
      expect(inlineDisplay.style.display).toBe('inline');
    });
  });

  it('B1.3: ProjectsItemPrintView renders native <li> elements with list-style-type: disc', () => {
    const item = {
      id: 'test_proj',
      title: 'Full Stack App',
      bullets: [
        'Built with React and Node.js.',
        'Integrated automated testing with 95% coverage.'
      ]
    };

    const { container } = render(
      <ProjectsItemPrintView item={item} sectionId="proj_sec" />
    );

    const lis = container.querySelectorAll('ul.experience__bullets li');
    expect(lis.length).toBe(2);
    lis.forEach((li) => {
      expect(li.style.display).toBe('list-item');
      expect(li.style.listStyleType).toBe('disc');
      expect(li.querySelector('.simple-list-circle')).toBeNull();
    });
  });

  it('B1.4: VolunteeringItemPrintView renders native <li> elements with list-style-type: disc', () => {
    const item = {
      id: 'test_vol',
      title: 'Volunteer Lead',
      bullets: [
        'Organized community tech workshops.'
      ]
    };

    const { container } = render(
      <VolunteeringItemPrintView item={item} sectionId="vol_sec" />
    );

    const lis = container.querySelectorAll('ul.experience__bullets li');
    expect(lis.length).toBe(1);
    expect(lis[0].style.display).toBe('list-item');
    expect(lis[0].style.listStyleType).toBe('disc');
    expect(lis[0].querySelector('.simple-list-circle')).toBeNull();
  });

  it('B1.5: SimpleListItem renders pure inline text in print mode and circle dot in editor mode', () => {
    const testItem = { id: 'item1', text: 'AWS Certified Solutions Architect' };

    // Print mode
    const { container: printContainer } = render(
      <SimpleListItem item={testItem} sectionId="cert_sec" isPrint={true} />
    );
    expect(printContainer.querySelector('.simple-list-circle')).toBeNull();
    expect(printContainer.textContent).toContain('AWS Certified Solutions Architect');

    // Edit mode
    const { container: editContainer } = render(
      <SimpleListItem item={testItem} sectionId="cert_sec" isPrint={false} />
    );
    expect(editContainer.querySelector('.simple-list-circle')).toBeInTheDocument();
  });
});
