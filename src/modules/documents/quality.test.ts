import { describe, expect, it } from 'vitest';
import { evaluateQuality, type QualityMetrics } from './quality';

const good: QualityMetrics = {
  widthPx: 2000,
  heightPx: 2600,
  sharpness: 0.8,
  brightness: 0.55,
};

describe('evaluateQuality', () => {
  it('accepts a good photo', () => {
    expect(evaluateQuality(good)).toEqual({ acceptable: true, issues: [] });
  });

  it('rejects a low-resolution photo', () => {
    const result = evaluateQuality({ ...good, widthPx: 400, heightPx: 400 });
    expect(result.acceptable).toBe(false);
    expect(result.issues).toContain('low_resolution');
  });

  it('rejects a blurry photo', () => {
    expect(evaluateQuality({ ...good, sharpness: 0.1 }).issues).toContain(
      'blurry',
    );
  });

  it('rejects a too-dark and a too-bright photo', () => {
    expect(evaluateQuality({ ...good, brightness: 0.05 }).issues).toContain(
      'too_dark',
    );
    expect(evaluateQuality({ ...good, brightness: 0.98 }).issues).toContain(
      'too_bright',
    );
  });

  it('merges device detector flags and de-duplicates', () => {
    const result = evaluateQuality({
      ...good,
      sharpness: 0.1,
      detectedFlags: ['finger_in_frame', 'blurry'],
    });
    expect(result.issues).toContain('finger_in_frame');
    expect(result.issues.filter((i) => i === 'blurry')).toHaveLength(1);
  });
});
