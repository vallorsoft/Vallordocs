import { describe, expect, it } from 'vitest';
import {
  ALLOWED_ADJUSTMENTS,
  FORBIDDEN_MODIFICATIONS,
  buildRestorationSystemPrompt,
} from './guardrails';

describe('restoration guardrails', () => {
  it('keeps allowed and forbidden lists disjoint', () => {
    const allowed = new Set<string>(ALLOWED_ADJUSTMENTS);
    for (const forbidden of FORBIDDEN_MODIFICATIONS) {
      expect(allowed.has(forbidden)).toBe(false);
    }
  });

  it('forbids fabricating or correcting content', () => {
    expect(FORBIDDEN_MODIFICATIONS).toContain('inventing_characters');
    expect(FORBIDDEN_MODIFICATIONS).toContain('correcting_numbers');
    expect(FORBIDDEN_MODIFICATIONS).toContain('changing_dates');
  });
});

describe('buildRestorationSystemPrompt', () => {
  const prompt = buildRestorationSystemPrompt();

  it('instructs the model never to change content', () => {
    expect(prompt).toMatch(/MUST NOT change any content/);
    expect(prompt).toMatch(/faithful copy of the original/);
  });

  it('lists every forbidden modification explicitly', () => {
    for (const forbidden of FORBIDDEN_MODIFICATIONS) {
      expect(prompt).toContain(forbidden);
    }
  });
});
