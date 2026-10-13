import { describe, expect, it } from '@jest/globals';

import { DESCRIPTION_MAX, NAME_MAX, validateProfile } from '../profile';

describe('validateProfile', () => {
  it('accepts a normal name and description, trimmed', () => {
    expect(validateProfile({ name: '  Dani ', description: ' la de las llaves ' })).toEqual({
      name: 'Dani',
      description: 'la de las llaves',
      valid: true,
    });
  });

  it('stores an empty description as null', () => {
    expect(validateProfile({ name: 'Dani', description: '   ' })).toEqual({
      name: 'Dani',
      description: null,
      valid: true,
    });
  });

  it('rejects an empty or blank name', () => {
    expect(validateProfile({ name: '', description: '' }).valid).toBe(false);
    expect(validateProfile({ name: '   ', description: '' }).valid).toBe(false);
  });

  it('accepts the exact limits and rejects one over', () => {
    const name = (n: number) => 'a'.repeat(n);
    expect(validateProfile({ name: name(NAME_MAX), description: name(DESCRIPTION_MAX) }).valid).toBe(true);
    expect(validateProfile({ name: name(NAME_MAX + 1), description: '' }).valid).toBe(false);
    expect(validateProfile({ name: 'Dani', description: name(DESCRIPTION_MAX + 1) }).valid).toBe(false);
  });

  it('measures the limits after trimming', () => {
    const padded = ' '.repeat(10) + 'a'.repeat(NAME_MAX) + ' '.repeat(10);
    expect(validateProfile({ name: padded, description: '' }).valid).toBe(true);
  });
});
