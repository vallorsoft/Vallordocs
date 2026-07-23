import { describe, expect, it } from 'vitest';
import { parseUserAgent } from './user-agent';

describe('parseUserAgent', () => {
  it('parses desktop Chrome on Windows', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    expect(parseUserAgent(ua)).toEqual({
      browser: 'Chrome',
      os: 'Windows',
      device: 'desktop',
    });
  });

  it('parses desktop Safari on macOS', () => {
    const ua =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15';
    expect(parseUserAgent(ua)).toEqual({
      browser: 'Safari',
      os: 'macOS',
      device: 'desktop',
    });
  });

  it('parses Firefox on Linux', () => {
    const ua =
      'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0';
    expect(parseUserAgent(ua)).toEqual({
      browser: 'Firefox',
      os: 'Linux',
      device: 'desktop',
    });
  });

  it('parses Edge on Windows', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';
    const result = parseUserAgent(ua);
    expect(result.browser).toBe('Edge');
    expect(result.os).toBe('Windows');
  });

  it('parses mobile Safari on iPhone', () => {
    const ua =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1';
    expect(parseUserAgent(ua)).toEqual({
      browser: 'Safari',
      os: 'iOS',
      device: 'mobile',
    });
  });

  it('parses mobile Chrome on Android', () => {
    const ua =
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
    expect(parseUserAgent(ua)).toEqual({
      browser: 'Chrome',
      os: 'Android',
      device: 'mobile',
    });
  });

  it('classifies an iPad as a tablet', () => {
    const ua =
      'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/604.1';
    const result = parseUserAgent(ua);
    expect(result.os).toBe('iOS');
    expect(result.device).toBe('tablet');
  });

  it('classifies an Android tablet (no Mobile token) as a tablet', () => {
    const ua =
      'Mozilla/5.0 (Linux; Android 13; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    expect(parseUserAgent(ua).device).toBe('tablet');
  });

  it('returns all-unknown for empty input', () => {
    expect(parseUserAgent('')).toEqual({
      browser: 'unknown',
      os: 'unknown',
      device: 'unknown',
    });
  });

  it('returns all-unknown for null and undefined', () => {
    expect(parseUserAgent(null)).toEqual({
      browser: 'unknown',
      os: 'unknown',
      device: 'unknown',
    });
    expect(parseUserAgent(undefined)).toEqual({
      browser: 'unknown',
      os: 'unknown',
      device: 'unknown',
    });
  });

  it('returns all-unknown for garbage input', () => {
    expect(parseUserAgent('!!!$$$###')).toEqual({
      browser: 'unknown',
      os: 'unknown',
      device: 'unknown',
    });
  });
});
