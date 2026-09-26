import { describe, it, expect } from 'vitest';
import { generateThumbnail } from '../utils/thumbnailGenerator.js';

describe('thumbnailGenerator Unit Test Suite', () => {
  it('generates a valid SVG Data URL for standard 2-column CV data', async () => {
    const cvData = {
      layout: {
        type: '2-column',
        leftBg: '#1e293b',
        rightBg: '#ffffff'
      },
      profile: { name: 'Linus Torvalds' },
      sections: [
        {
          id: 'profile_header',
          type: 'profile_header',
          items: [{ name: 'Linus Torvalds', subtitle: 'Kernel Architect' }]
        },
        {
          id: 'skills',
          column: 'left',
          type: 'skills',
          title: 'HABILIDADES',
          items: [{ title: 'C, Git, Linux' }]
        },
        {
          id: 'experience',
          column: 'right',
          type: 'list',
          title: 'EXPERIENCIA',
          items: [{ title: 'Linux Foundation Fellow' }]
        }
      ]
    };

    const url = await generateThumbnail(cvData);
    expect(url).toBeTypeOf('string');
    expect(url.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);

    const decodedSvg = decodeURIComponent(url.replace('data:image/svg+xml;charset=utf-8,', ''));
    expect(decodedSvg).toContain('Linus Torvalds');
    expect(decodedSvg).toContain('Kernel Architect');
    expect(decodedSvg).toContain('#1e293b');
    expect(decodedSvg).toContain('#ffffff');
    expect(decodedSvg).toContain('HABILIDADES');
    expect(decodedSvg).toContain('EXPERIENCIA');
    expect(decodedSvg).not.toContain('ATS 1-COL');
  });

  it('generates ATS 1-column layout representation with ATS badge when isAtsMode is true', async () => {
    const atsCv = {
      layout: {
        type: '1-column',
        isAtsMode: true,
        rightBg: '#fafafa'
      },
      profile: { name: 'Margaret Hamilton' },
      sections: [
        {
          id: 'profile_header',
          type: 'profile_header',
          items: [{ name: 'Margaret Hamilton', subtitle: 'Director of Software Engineering' }]
        },
        {
          id: 'experience',
          column: 'left',
          type: 'list',
          title: 'APOLLO PROGRAM',
          items: [{ title: 'MIT Instrumentation Lab' }]
        }
      ]
    };

    const url = await generateThumbnail(atsCv);
    const decodedSvg = decodeURIComponent(url.replace('data:image/svg+xml;charset=utf-8,', ''));
    expect(decodedSvg).toContain('ATS 1-COL');
    expect(decodedSvg).toContain('MARGARET HAMILTON');
    expect(decodedSvg).toContain('APOLLO PROGRAM');
    expect(decodedSvg).toContain('#fafafa');
  });

  it('strictly escapes XML/SVG special characters to prevent malformed SVG or XSS', async () => {
    const maliciousCv = {
      layout: { type: '2-column' },
      profile: { name: '<script>alert("xss")</script> & Co.' },
      sections: [
        {
          id: 'profile_header',
          type: 'profile_header',
          items: [{ name: '<script>alert("xss")</script> & Co.', subtitle: "Lead & 'Expert'" }]
        },
        {
          id: 'sec1',
          column: 'left',
          type: 'skills',
          title: '<Dangerous> & "Vulnerable"',
          items: []
        }
      ]
    };

    const url = await generateThumbnail(maliciousCv);
    const decodedSvg = decodeURIComponent(url.replace('data:image/svg+xml;charset=utf-8,', ''));
    expect(decodedSvg).not.toContain('<script>');
    expect(decodedSvg).toContain('&lt;script&gt;');
    expect(decodedSvg).toContain('&amp;');
    expect(decodedSvg).toContain('&quot;');
    expect(decodedSvg).toContain('&apos;');
  });

  it('recovers safely from null, undefined, or corrupt objects without crashing', async () => {
    const fromNull = await generateThumbnail(null);
    expect(fromNull.startsWith('data:image/svg+xml')).toBe(true);

    const fromUndefined = await generateThumbnail(undefined);
    expect(fromUndefined.startsWith('data:image/svg+xml')).toBe(true);

    const fromCorrupt = await generateThumbnail({ layout: 'corrupted', sections: 42 });
    expect(fromCorrupt.startsWith('data:image/svg+xml')).toBe(true);
  });

  it('guarantees compact data URL output well within 20KB budget', async () => {
    const heavyCv = {
      layout: { type: '2-column' },
      profile: { name: 'Heavy CV Candidate' },
      sections: Array.from({ length: 20 }, (_, i) => ({
        id: `sec_${i}`,
        column: i % 2 === 0 ? 'left' : 'right',
        type: 'list',
        title: `SECCIÓN MUY LARGA ${i}`,
        items: Array.from({ length: 10 }, (_, j) => ({
          title: `Item de prueba largo con texto detallado ${j}`
        }))
      }))
    };

    const url = await generateThumbnail(heavyCv);
    // 20KB = 20,480 characters
    expect(url.length).toBeLessThan(20480);
  });
});
