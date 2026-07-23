/**
 * Minimal, dependency-free User-Agent parser (PRD 5. fejezet – Audit adatok:
 * Browser/OS/Device).
 *
 * This exists purely to enrich audit and login-history records; it is not a
 * fingerprinting tool and does not aim for exhaustive coverage. It recognises
 * the common browsers, operating systems and form factors and degrades
 * gracefully to `'unknown'` for empty or garbage input, never throwing.
 */

/** Coarse form-factor classification. */
export type Device = 'mobile' | 'tablet' | 'desktop' | 'unknown';

/** Parsed, human-readable summary of a User-Agent string. */
export interface ParsedUserAgent {
  browser: string;
  os: string;
  device: Device;
}

const UNKNOWN: ParsedUserAgent = {
  browser: 'unknown',
  os: 'unknown',
  device: 'unknown',
};

function detectBrowser(ua: string): string {
  // Order matters: Edge and Chrome-based browsers embed "Chrome"/"Safari" in
  // their UA, so the more specific tokens are tested first.
  if (/\bEdg(?:e|A|iOS)?\//.test(ua)) return 'Edge';
  if (/\bOPR\/|\bOpera\b/.test(ua)) return 'Opera';
  if (/\bFirefox\/|\bFxiOS\//.test(ua)) return 'Firefox';
  if (/\bChrome\/|\bCriOS\//.test(ua)) return 'Chrome';
  // Safari must come last: only genuine Safari has "Safari" without the tokens
  // filtered out above.
  if (/\bSafari\//.test(ua)) return 'Safari';
  return 'unknown';
}

function detectOs(ua: string): string {
  if (/\bWindows\b/.test(ua)) return 'Windows';
  // iOS before macOS: iPhone/iPad UAs also mention "Mac OS X".
  if (/\biPhone\b|\biPad\b|\biPod\b/.test(ua)) return 'iOS';
  if (/\bAndroid\b/.test(ua)) return 'Android';
  if (/\bMac OS X\b|\bMacintosh\b/.test(ua)) return 'macOS';
  if (/\bLinux\b/.test(ua)) return 'Linux';
  return 'unknown';
}

function detectDevice(ua: string): Device {
  // iPad and explicit "Tablet" hints, plus Android without the "Mobile" token,
  // indicate a tablet.
  if (/\biPad\b|\bTablet\b/.test(ua)) return 'tablet';
  if (/\bAndroid\b/.test(ua)) {
    return /\bMobile\b/.test(ua) ? 'mobile' : 'tablet';
  }
  if (/\biPhone\b|\biPod\b|\bMobile\b/.test(ua)) return 'mobile';
  if (/\bWindows\b|\bMacintosh\b|\bMac OS X\b|\bLinux\b|\bX11\b/.test(ua)) {
    return 'desktop';
  }
  return 'unknown';
}

/**
 * Parses a raw User-Agent header into a coarse browser/OS/device summary.
 * Never throws; empty or unrecognised input yields all-`'unknown'` fields.
 */
export function parseUserAgent(ua: string | null | undefined): ParsedUserAgent {
  if (typeof ua !== 'string') return { ...UNKNOWN };
  const trimmed = ua.trim();
  if (trimmed.length === 0) return { ...UNKNOWN };

  return {
    browser: detectBrowser(trimmed),
    os: detectOs(trimmed),
    device: detectDevice(trimmed),
  };
}
