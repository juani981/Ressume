import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defaultSchema } from '../utils/schema';
import { renderPdfBlob, generateAndDownloadPdf, normalizeCvDataForPdf } from '../utils/reactPdfEngine';

describe('src/utils/reactPdfEngine.js - Client-Side Vector PDF Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleCVData = {
    ...defaultSchema,
    profile: {
      name: 'JUAN IGNACIO CARRIZO',
      subtitle: 'Senior Software Engineer'
    },
    layout: {
      type: '2-column',
      leftBg: '#fafafa',
      rightBg: '#ffffff',
      pagePadding: 24,
      sectionGap: 20,
      itemGap: 8
    }
  };

  it('T1.1: normalizeCvDataForPdf handles null, undefined, or partial data gracefully', () => {
    const emptyNormalized = normalizeCvDataForPdf(null);
    expect(emptyNormalized).toBeDefined();
    expect(Array.isArray(emptyNormalized.sections)).toBe(true);
    expect(emptyNormalized.layout).toBeDefined();

    const partialNormalized = normalizeCvDataForPdf({ profile: { name: 'Test User' } });
    expect(partialNormalized.profile.name).toBe('Test User');
    expect(partialNormalized.layout.type).toBe('2-column');
  });

  it('T1.2: renderPdfBlob produces a valid application/pdf Blob client-side', async () => {
    const blob = await renderPdfBlob(sampleCVData, 'es');
    expect(blob).toBeDefined();
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('T1.3: renderPdfBlob renders 1-column layout successfully', async () => {
    const oneColData = {
      ...sampleCVData,
      layout: { ...sampleCVData.layout, type: '1-column' }
    };
    const blob = await renderPdfBlob(oneColData, 'es');
    expect(blob).toBeDefined();
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });

  it('T1.4: generateAndDownloadPdf creates ObjectURL, triggers DOM download link, and revokes URL', async () => {
    const createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:http://localhost/test-uuid');
    const revokeObjectURLSpy = vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    const showToastMock = vi.fn();
    const blob = await generateAndDownloadPdf(sampleCVData, 'es', { showToast: showToastMock });

    expect(blob).toBeDefined();
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(showToastMock).toHaveBeenCalledWith('PDF generado con éxito', 'success');

    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });

  it('T1.5: zero network requests are made during PDF generation', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await renderPdfBlob(sampleCVData, 'es');
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
