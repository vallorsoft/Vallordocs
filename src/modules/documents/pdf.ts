import { PDFDocument, type PDFImage } from 'pdf-lib';
import { ValidationError } from '@/shared/errors';

/**
 * A4 PDF generation (PRD 3. fejezet – PDF generálás, Többoldalas dokumentum).
 *
 * The final PDF is A4 with sensible margins. Each restored image becomes one
 * page, preserving aspect ratio and centring within the printable area. Ordered
 * multi-page input produces a single multi-page PDF.
 */

/** A4 in PostScript points (72 pt = 1 inch): 210 × 297 mm. */
export const A4_WIDTH_PT = 595.28;
export const A4_HEIGHT_PT = 841.89;
/** Target raster density for the source images (PRD: 300 DPI). */
export const TARGET_DPI = 300;

const DEFAULT_MARGIN_PT = 24;

export type PdfImageType = 'jpeg' | 'png';

export interface PdfPageImage {
  image: Buffer;
  type: PdfImageType;
}

export interface GeneratePdfOptions {
  marginPt?: number;
  title?: string;
}

/**
 * Generates an A4 PDF from one or more page images. Throws when there are no
 * pages or an unsupported image type is supplied (only JPEG/PNG can be
 * embedded; restored outputs are always one of these).
 */
export async function generateA4Pdf(
  pages: PdfPageImage[],
  options: GeneratePdfOptions = {},
): Promise<Uint8Array> {
  if (pages.length === 0) {
    throw new ValidationError({
      messageKey: 'errors.validation',
      context: { reason: 'PDF requires at least one page' },
    });
  }

  const margin = options.marginPt ?? DEFAULT_MARGIN_PT;
  const doc = await PDFDocument.create();
  doc.setProducer('Vallordocs');
  if (options.title) doc.setTitle(options.title);

  for (const page of pages) {
    const embedded = await embed(doc, page);
    const pdfPage = doc.addPage([A4_WIDTH_PT, A4_HEIGHT_PT]);

    const maxWidth = A4_WIDTH_PT - margin * 2;
    const maxHeight = A4_HEIGHT_PT - margin * 2;
    const scale = Math.min(
      maxWidth / embedded.width,
      maxHeight / embedded.height,
      1,
    );
    const drawWidth = embedded.width * scale;
    const drawHeight = embedded.height * scale;

    pdfPage.drawImage(embedded, {
      x: (A4_WIDTH_PT - drawWidth) / 2,
      y: (A4_HEIGHT_PT - drawHeight) / 2,
      width: drawWidth,
      height: drawHeight,
    });
  }

  return doc.save();
}

async function embed(doc: PDFDocument, page: PdfPageImage): Promise<PDFImage> {
  switch (page.type) {
    case 'jpeg':
      return doc.embedJpg(page.image);
    case 'png':
      return doc.embedPng(page.image);
    default: {
      const exhaustive: never = page.type;
      throw new ValidationError({
        messageKey: 'errors.validation',
        context: { unsupportedImageType: String(exhaustive) },
      });
    }
  }
}
