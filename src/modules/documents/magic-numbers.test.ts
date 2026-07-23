import { describe, expect, it } from 'vitest';
import { detectType } from './magic-numbers';

function withHeader(bytes: number[], length = 32): Buffer {
  const buf = Buffer.alloc(length);
  Buffer.from(bytes).copy(buf);
  return buf;
}

describe('detectType', () => {
  it('detects JPEG', () => {
    expect(detectType(withHeader([0xff, 0xd8, 0xff, 0xe0]))).toBe('jpeg');
  });

  it('detects PNG', () => {
    expect(
      detectType(withHeader([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    ).toBe('png');
  });

  it('detects PDF', () => {
    expect(detectType(Buffer.from('%PDF-1.7\n'))).toBe('pdf');
  });

  it('detects HEIC from the ftyp brand', () => {
    const buf = Buffer.alloc(16);
    buf.write('ftyp', 4, 'ascii');
    buf.write('heic', 8, 'ascii');
    expect(detectType(buf)).toBe('heic');
  });

  it('detects WEBP', () => {
    const buf = Buffer.alloc(16);
    buf.write('RIFF', 0, 'ascii');
    buf.write('WEBP', 8, 'ascii');
    expect(detectType(buf)).toBe('webp');
  });

  it('returns unknown for unrecognised or spoofed content', () => {
    expect(detectType(Buffer.from('MZ executable header'))).toBe('unknown');
    expect(detectType(Buffer.alloc(2))).toBe('unknown');
  });
});
