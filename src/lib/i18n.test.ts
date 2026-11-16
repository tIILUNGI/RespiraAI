import { describe, expect, it } from 'vitest';
import { strings, t } from './i18n';

describe('i18n', () => {
  it('returns English strings by default keys', () => {
    expect(t('en', 'appName')).toBe('RespiraAI');
    expect(t('en', 'landingCta')).toBe('Open the assistant');
    expect(t('en', 'navChat')).toBe('Assistant');
  });

  it('returns Portuguese strings', () => {
    expect(t('pt', 'appName')).toBe('RespiraAI');
    expect(t('pt', 'landingCta').length).toBeGreaterThan(0);
    expect(t('pt', 'navChat').length).toBeGreaterThan(0);
  });

  it('has matching key coverage for core UI between en and pt', () => {
    const coreKeys = [
      'appName','tagline','airQuality','location','profile','recommendations','impact',
      'search','send','disclaimer','directImpact','landingTitle','landingCta','welcome'
    ] as const;
    for (const k of coreKeys) {
      expect(typeof strings.en[k]).toBe('string');
      expect(typeof strings.pt[k]).toBe('string');
      expect(strings.en[k].length).toBeGreaterThan(0);
      expect(strings.pt[k].length).toBeGreaterThan(0);
    }
  });
});
