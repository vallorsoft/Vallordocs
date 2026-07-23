/**
 * Magic-number (file signature) detection (PRD 5. fejezet – Fájlbiztonság).
 *
 * File type is determined from the actual bytes, never from the client-supplied
 * name or MIME type. This defeats spoofed extensions and mismatched content
 * types on upload.
 */

export type DetectedType = 'jpeg' | 'png' | 'heic' | 'webp' | 'pdf' | 'unknown';

export const DETECTED_TYPE_MIME: Record<
  Exclude<DetectedType, 'unknown'>,
  string
> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

function startsWith(buffer: Buffer, bytes: number[], offset = 0): boolean {
  if (buffer.length < offset + bytes.length) return false;
  return bytes.every((byte, index) => buffer[offset + index] === byte);
}

function asciiAt(buffer: Buffer, offset: number, text: string): boolean {
  if (buffer.length < offset + text.length) return false;
  return buffer.toString('ascii', offset, offset + text.length) === text;
}

/**
 * Detects the real type of a buffer from its signature. Returns `'unknown'`
 * when no supported signature matches.
 */
export function detectType(buffer: Buffer): DetectedType {
  // JPEG: FF D8 FF
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return 'jpeg';

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'png';
  }

  // PDF: %PDF
  if (asciiAt(buffer, 0, '%PDF')) return 'pdf';

  // ISO-BMFF container: "ftyp" box at offset 4, then a brand.
  if (asciiAt(buffer, 4, 'ftyp')) {
    const brand = buffer.toString('ascii', 8, 12);
    const heicBrands = ['heic', 'heix', 'hevc', 'heim', 'heis', 'mif1', 'msf1'];
    if (heicBrands.includes(brand)) return 'heic';
  }

  // WEBP: "RIFF" .... "WEBP"
  if (asciiAt(buffer, 0, 'RIFF') && asciiAt(buffer, 8, 'WEBP')) return 'webp';

  return 'unknown';
}
