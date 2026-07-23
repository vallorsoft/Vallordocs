import { describe, expect, it } from 'vitest';
import { validateUpload } from './file-security';

const JPEG_HEADER = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const PNG_HEADER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

function jpeg(size = 1024): Buffer {
  const buf = Buffer.alloc(size);
  JPEG_HEADER.copy(buf);
  return buf;
}

describe('validateUpload', () => {
  it('accepts a well-formed JPEG upload', () => {
    const result = validateUpload({
      filename: 'cmr.jpg',
      declaredMimeType: 'image/jpeg',
      bytes: jpeg(),
    });
    expect(result).toEqual({ valid: true, issues: [], detectedType: 'jpeg' });
  });

  it('accepts a well-formed PNG upload', () => {
    const buf = Buffer.alloc(512);
    PNG_HEADER.copy(buf);
    const result = validateUpload({
      filename: 'pod.png',
      declaredMimeType: 'image/png',
      bytes: buf,
    });
    expect(result.valid).toBe(true);
    expect(result.detectedType).toBe('png');
  });

  it('rejects an empty file', () => {
    const result = validateUpload({
      filename: 'x.jpg',
      declaredMimeType: 'image/jpeg',
      bytes: Buffer.alloc(0),
    });
    expect(result.issues).toContain('empty');
    expect(result.valid).toBe(false);
  });

  it('rejects files above the size limit', () => {
    const result = validateUpload(
      { filename: 'x.jpg', declaredMimeType: 'image/jpeg', bytes: jpeg(2048) },
      { maxBytes: 1024 },
    );
    expect(result.issues).toContain('too_large');
  });

  it('flags a double extension (spoofed executable)', () => {
    const result = validateUpload({
      filename: 'invoice.jpg.exe',
      declaredMimeType: 'image/jpeg',
      bytes: jpeg(),
    });
    expect(result.issues).toContain('double_extension');
    expect(result.issues).toContain('disallowed_extension');
    expect(result.valid).toBe(false);
  });

  it('rejects a disallowed content type (PDF as upload)', () => {
    const result = validateUpload({
      filename: 'doc.pdf',
      declaredMimeType: 'application/pdf',
      bytes: Buffer.from('%PDF-1.7 content here'),
    });
    expect(result.issues).toContain('disallowed_content');
  });

  it('detects a mismatch between extension and real content', () => {
    // Bytes are JPEG but the file claims to be a PNG.
    const result = validateUpload({
      filename: 'photo.png',
      declaredMimeType: 'image/png',
      bytes: jpeg(),
    });
    expect(result.issues).toContain('extension_content_mismatch');
  });

  it('detects a declared MIME that does not match the real bytes', () => {
    const result = validateUpload({
      filename: 'photo.jpg',
      declaredMimeType: 'image/png',
      bytes: jpeg(),
    });
    expect(result.issues).toContain('mime_mismatch');
  });

  it('flags unknown content and a missing extension', () => {
    const result = validateUpload({
      filename: 'noext',
      declaredMimeType: 'application/octet-stream',
      bytes: Buffer.from('random bytes not an image'),
    });
    expect(result.issues).toContain('missing_extension');
    expect(result.issues).toContain('unknown_content');
  });
});
