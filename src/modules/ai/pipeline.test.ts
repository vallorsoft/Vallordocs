import { describe, expect, it } from 'vitest';
import { RESTORATION_STEPS, nextStep } from './pipeline';

describe('restoration pipeline', () => {
  it('follows the PRD order starting with perspective and ending with a4 fit', () => {
    expect(RESTORATION_STEPS[0]).toBe('perspective_correction');
    expect(RESTORATION_STEPS[RESTORATION_STEPS.length - 1]).toBe('a4_fit');
  });

  it('has no duplicate steps', () => {
    expect(new Set(RESTORATION_STEPS).size).toBe(RESTORATION_STEPS.length);
  });

  it('walks steps in order via nextStep', () => {
    expect(nextStep('perspective_correction')).toBe('edge_detection');
    expect(nextStep('a4_fit')).toBeNull();
  });
});
