import { describe, expect, it } from 'vitest';
import { strings } from './i18n';

describe('i18n completeness', () => {
  it('en and pt expose the same translation keys', () => {
    const enKeys = Object.keys(strings.en).sort();
    const ptKeys = Object.keys(strings.pt).sort();
    expect(ptKeys).toEqual(enKeys);
  });

  it('all translations are non-empty strings', () => {
    for (const lang of ['en', 'pt'] as const) {
      for (const [k, v] of Object.entries(strings[lang])) {
        expect(typeof v, `${lang}.${k}`).toBe('string');
        expect((v as string).trim().length, `${lang}.${k}`).toBeGreaterThan(0);
      }
    }
  });
});
