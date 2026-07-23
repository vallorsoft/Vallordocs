// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDoc, mockPage } = vi.hoisted(() => {
  const mockPage = { drawImage: vi.fn() };
  const mockDoc = {
    setProducer: vi.fn(),
    setTitle: vi.fn(),
    addPage: vi.fn().mockReturnValue(mockPage),
    embedJpg: vi.fn().mockResolvedValue({ width: 200, height: 300 }),
    embedPng: vi.fn().mockResolvedValue({ width: 200, height: 300 }),
    save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
  };
  return { mockDoc, mockPage };
});

vi.mock('pdf-lib', () => ({
  PDFDocument: { create: vi.fn().mockResolvedValue(mockDoc) },
}));

import { generateA4Pdf, A4_WIDTH_PT, A4_HEIGHT_PT } from './pdf';

beforeEach(() => {
  vi.clearAllMocks();
  mockDoc.addPage.mockReturnValue(mockPage);
  mockDoc.embedJpg.mockResolvedValue({ width: 200, height: 300 });
  mockDoc.embedPng.mockResolvedValue({ width: 200, height: 300 });
  mockDoc.save.mockResolvedValue(new Uint8Array([1, 2, 3, 4]));
});

describe('generateA4Pdf', () => {
  it('throws when called with no pages', async () => {
    await expect(generateA4Pdf([])).rejects.toThrow();
  });

  it('returns a Uint8Array for a single JPEG page', async () => {
    const result = await generateA4Pdf([
      { image: Buffer.from('jpeg'), type: 'jpeg' },
    ]);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(mockDoc.embedJpg).toHaveBeenCalledOnce();
    expect(mockDoc.addPage).toHaveBeenCalledOnce();
  });

  it('returns a Uint8Array for a single PNG page', async () => {
    await generateA4Pdf([{ image: Buffer.from('png'), type: 'png' }]);
    expect(mockDoc.embedPng).toHaveBeenCalledOnce();
  });

  it('adds one page per image for a multi-page input', async () => {
    await generateA4Pdf([
      { image: Buffer.from('a'), type: 'jpeg' },
      { image: Buffer.from('b'), type: 'jpeg' },
    ]);
    expect(mockDoc.addPage).toHaveBeenCalledTimes(2);
    expect(mockDoc.embedJpg).toHaveBeenCalledTimes(2);
  });

  it('sets the title when the option is provided', async () => {
    await generateA4Pdf([{ image: Buffer.from('x'), type: 'jpeg' }], {
      title: 'Test Document',
    });
    expect(mockDoc.setTitle).toHaveBeenCalledWith('Test Document');
  });

  it('exports correct A4 dimensions', () => {
    expect(A4_WIDTH_PT).toBeCloseTo(595.28, 1);
    expect(A4_HEIGHT_PT).toBeCloseTo(841.89, 1);
  });
});
