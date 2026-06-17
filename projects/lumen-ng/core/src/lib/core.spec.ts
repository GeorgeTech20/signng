import { SIGNNG_VERSION } from './core';

describe('@signng/core', () => {
  it('exposes a version string', () => {
    expect(typeof SIGNNG_VERSION).toBe('string');
    expect(SIGNNG_VERSION.length).toBeGreaterThan(0);
  });
});
