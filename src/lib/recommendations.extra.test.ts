import { describe, expect, it } from 'vitest';
import { buildRecommendations } from './recommendations';
import type { AirQuality, Lifestyle } from '../types';

const base: Lifestyle = {
  household: '1-2 people',
  hasChildren: false,
  hasElderly: false,
  hasRespiratory: false,
  heating: 'electric / heat pump',
  cooking: 'gas',
  transport: 'walk / bike',
  outdoorRoutine: 'low',
  pets: false,
  notes: '',
};

describe('buildRecommendations - additional scenarios', () => {
  it('includes winter-risk guidance when using wood/fireplace in PT', () => {
    const recs = buildRecommendations(null, { ...base, heating: 'lenha / lareira', cooking: 'lenha / carvão' }, 'pt');
    const sust = recs.find((r) => r.category === 'sustentavel');
    expect(sust).toBeTruthy();
    expect(sust!.actions.join(' ').length).toBeGreaterThan(10);
    expect(sust!.impact.length).toBeGreaterThan(10);
  });

  it('provides health category for elderly sensitive profile in PT', () => {
    const air: AirQuality = { usAqi: 160, pm25: 60, source: 't' };
    const recs = buildRecommendations(air, { ...base, hasElderly: true }, 'pt');
    expect(recs.some((r) => r.category === 'saude')).toBe(true);
  });

  it('includes community actions in both languages', () => {
    const en = buildRecommendations(null, base, 'en');
    const pt = buildRecommendations(null, base, 'pt');
    expect(en.some((r) => r.category === 'comunidade')).toBe(true);
    expect(pt.some((r) => r.category === 'comunidade')).toBe(true);
  });

  it('every recommendation has actions and impact', () => {
    for (const lang of ['en', 'pt'] as const) {
      const recs = buildRecommendations({ usAqi: 210, pm25: 120, source: 't' }, { ...base, hasChildren: true }, lang);
      for (const r of recs) {
        expect(r.title.length).toBeGreaterThan(3);
        expect(Array.isArray(r.actions)).toBe(true);
        expect(r.actions.length).toBeGreaterThan(0);
        expect(r.impact.length).toBeGreaterThan(10);
      }
    }
  });
});
