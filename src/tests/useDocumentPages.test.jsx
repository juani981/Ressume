import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDocumentPages } from '../hooks/useDocumentPages';
import { defaultSchema } from '../utils/schema';

describe('useDocumentPages Hook', () => {
  it('1. returns 1 PageModel for default CV schema with correct structure in editor', () => {
    const { result } = renderHook(() => useDocumentPages({ cvData: defaultSchema }));
    expect(result.current.totalPages).toBe(1);
    expect(result.current.pages).toHaveLength(1);
    const page1 = result.current.pages[0];
    expect(page1.pageNumber).toBe(1);
    expect(page1.totalPages).toBe(1);
    expect(page1.leftSections.length).toBeGreaterThan(0);
    expect(page1.rightSections.length).toBeGreaterThan(0);
  });

  it('2. omits repeated continuation headers on split sections per user decision', () => {
    // Create large schema with many experience items to force page break
    const manyExperienceItems = Array.from({ length: 10 }).map((_, i) => ({
      id: `exp-${i}`,
      title: `Senior Software Engineer ${i}`,
      company: `Tech Corp ${i}`,
      date: '2020 - Present',
      description: 'Led fullstack development across distributed cloud microservices architecture with high concurrency.',
      bullets: [
        `Architected resilient backend pipeline ${i}`,
        `Optimized SQL and NoSQL databases improving query times by 40%`,
        `Mentored 5 junior engineers and conducted peer reviews`,
      ],
    }));

    const bigSchema = {
      ...defaultSchema,
      sections: defaultSchema.sections.map((sec) =>
        sec.id === 'experience'
          ? { ...sec, items: manyExperienceItems }
          : sec
      ),
    };

    const { result } = renderHook(() => useDocumentPages({ cvData: bigSchema }));
    expect(result.current.totalPages).toBeGreaterThan(1);

    // Look for continuation section of experience on page 2
    const page2 = result.current.pages[1];
    const continuedExp = page2.rightSections.find((s) => s.isContinuation || s.originalSectionId === 'experience');
    expect(continuedExp).toBeTruthy();
    // Header title must be empty string per user requirement
    expect(continuedExp.title).toBe('');
  });

  it('3. reacts dynamically when fontScale or lineHeight increases, generating Page 2', () => {
    const normalSchema = {
      ...defaultSchema,
      layout: {
        ...defaultSchema.layout,
        fontScale: 1.0,
        lineHeight: 1.45,
      },
    };

    const { result: r1 } = renderHook(() => useDocumentPages({ cvData: normalSchema }));
    const initialPages = r1.current.totalPages;

    // Now test with scaled-up typography (e.g. fontScale: 2.2, lineHeight: 2.0)
    const scaledSchema = {
      ...defaultSchema,
      layout: {
        ...defaultSchema.layout,
        fontScale: 2.2,
        lineHeight: 2.0,
      },
    };

    const { result: r2 } = renderHook(() => useDocumentPages({ cvData: scaledSchema }));
    expect(r2.current.totalPages).toBeGreaterThan(initialPages);
  });

  it('4. reacts dynamically when pagePadding increases, reducing page capacity', () => {
    // With normal padding (24px)
    const normalPaddingSchema = {
      ...defaultSchema,
      layout: {
        ...defaultSchema.layout,
        pagePadding: 24,
      },
    };

    // With huge padding (320px) to drastically reduce capacity
    const largePaddingSchema = {
      ...defaultSchema,
      layout: {
        ...defaultSchema.layout,
        pagePadding: 320,
      },
    };

    const { result: rNormal } = renderHook(() => useDocumentPages({ cvData: normalPaddingSchema }));
    const { result: rLarge } = renderHook(() => useDocumentPages({ cvData: largePaddingSchema }));

    expect(rLarge.current.totalPages).toBeGreaterThan(rNormal.current.totalPages);
  });

  it('5. correctly places sections in singleSections for ATS / 1-column mode', () => {
    const atsSchema = {
      ...defaultSchema,
      layout: {
        ...defaultSchema.layout,
        isAtsMode: true,
      },
    };

    const { result } = renderHook(() => useDocumentPages({ cvData: atsSchema }));
    const page1 = result.current.pages[0];
    expect(page1.leftSections).toHaveLength(0);
    expect(page1.rightSections).toHaveLength(0);
    expect(page1.singleSections.length).toBeGreaterThan(0);
  });
});
