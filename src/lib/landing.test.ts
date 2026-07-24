import { describe, expect, it } from 'vitest';
import { landingArea, landingPath } from './landing';

describe('landingArea', () => {
  it('sends a driver-only user to the driver PWA', () => {
    expect(landingArea(['driver'])).toBe('driver');
  });

  it('sends office/admin roles to the admin console', () => {
    expect(landingArea(['tenant_admin'])).toBe('admin');
    expect(landingArea(['dispatcher'])).toBe('admin');
    expect(landingArea(['office_user'])).toBe('admin');
  });

  it('prefers the admin console for a driver who also holds an office role', () => {
    expect(landingArea(['driver', 'dispatcher'])).toBe('admin');
  });

  it('defaults an empty role set to the admin console', () => {
    expect(landingArea([])).toBe('admin');
  });
});

describe('landingPath', () => {
  it('maps areas to their default route', () => {
    expect(landingPath(['driver'])).toBe('/driver');
    expect(landingPath(['tenant_admin'])).toBe('/dashboard');
  });
});
