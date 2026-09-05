import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { generateCleanPrintHTML } from '../utils/staticHtmlPdfEngine';
import { PrintBaseItem } from '../components/CV/BaseItem';
import { CVProvider } from '../context/CVContext';
import BaseItem from '../components/CV/BaseItem';

describe('Education Rounder Alignment & Single Source of Truth (?raw)', () => {
  const sampleCVData = {
    profile: { name: 'Juan Ignacio Carrizo' },
    layout: { type: '2-column' },
    sections: [
      {
        id: 'education',
        type: 'education',
        title: 'Educación',
        items: [
          {
            id: 'edu_1',
            title: 'Ingeniería en Sistemas',
            subtitle: 'Universidad Tecnológica Nacional',
            date: '2016 - 2022'
          }
        ]
      }
    ]
  };

  it('E1.1: generateCleanPrintHTML embeds single source of truth baseStyles with display: flex on education__content', () => {
    const html = generateCleanPrintHTML(sampleCVData);
    
    // Check that base styles are included
    expect(html).toContain('id="cv-base-styles"');
    expect(html).toContain('id="cv-print-styles"');
    
    // Check that education__content has display: flex in base styles
    expect(html).toMatch(/\.education__content[\s\S]*?display:\s*flex/);
  });

  it('E1.2: PrintBaseItem renders education__content container with display: flex style', () => {
    const item = {
      id: 'edu_1',
      title: 'Ingeniería en Sistemas',
      subtitle: 'Universidad Tecnológica Nacional',
      date: '2016 - 2022'
    };

    const { container } = render(
      <PrintBaseItem item={item} sectionId="education" sectionType="education" isLast={false} />
    );

    const educationContent = container.querySelector('.education__content');
    expect(educationContent).not.toBeNull();
    expect(educationContent.style.display).toBe('flex');

    const time = educationContent.querySelector('.education__time');
    const data = educationContent.querySelector('.education__data');
    expect(time).not.toBeNull();
    expect(data).not.toBeNull();
    
    // Rounder is inside time (left side of flex container)
    const rounder = time.querySelector('.education__rounder');
    expect(rounder).not.toBeNull();

    // Title is inside data (right side of flex container)
    const title = data.querySelector('.education__title');
    expect(title).not.toBeNull();
  });

  it('E1.3: generateCleanPrintHTML includes both education__time and education__data within education__content', () => {
    const html = generateCleanPrintHTML(sampleCVData);
    expect(html).toContain('class="education__content cv-block"');
    expect(html).toContain('class="education__time"');
    expect(html).toContain('class="education__rounder"');
    expect(html).toContain('class="education__data bd-grid"');
  });
});
