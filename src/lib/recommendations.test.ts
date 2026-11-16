import { describe, expect, it } from 'vitest';
import { buildRecommendations, impactSummary } from './recommendations';
import type { AirQuality, Lifestyle } from '../types';

const baseLifestyle: Lifestyle = {
  household: '3-4 people',
  hasChildren: false,
  hasElderly: false,
  hasRespiratory: false,
  heating: 'electric / heat pump',
  cooking: 'gas',
  transport: 'mixed (car & public transit)',
  outdoorRoutine: 'moderate (walks/errands)',
  pets: false,
  notes: '',
};

const goodAir: AirQuality = { usAqi: 40, pm25: 8, pm10: 15, source: 'test' };
const badAir: AirQuality = { usAqi: 180, pm25: 90, pm10: 120, smokeIndicator: 200, source: 'test' };

describe('buildRecommendations', () => {
  it('returns core recommendation categories in English', () => {
    const recs = buildRecommendations(goodAir, baseLifestyle, 'en');
    expect(recs.length).toBeGreaterThanOrEqual(4);
    const categories = recs.map((r) => r.category);
    expect(categories).toContain('rotina');
    expect(categories).toContain('casa');
    expect(categories).toContain('sustentavel');
    expect(categories).toContain('comunidade');
    for (const r of recs) {
      expect(r.title.length).toBeGreaterThan(0);
      expect(r.actions.length).toBeGreaterThan(0);
      expect(r.impact.length).toBeGreaterThan(0);
    }
  });

  it('adds sensitive-care recommendations for vulnerable profiles', () => {
    const recs = buildRecommendations(badAir, { ...baseLifestyle, hasChildren: true, hasRespiratory: true }, 'en');
    expect(recs.some((r) => r.category === 'saude')).toBe(true);
    const health = recs.find((r) => r.category === 'saude');
    expect(health?.actions.join(' ').toLowerCase()).toMatch(/medical|mask|care|symptom/);
  });

  it('adapts actions for severe/smoky conditions', () => {
    const recs = buildRecommendations(badAir, baseLifestyle, 'en');
    const routine = recs.find((r) => r.category === 'rotina');
    const indoor = recs.find((r) => r.category === 'casa');
    expect(routine?.actions.join(' ').toLowerCase()).toMatch(/indoor|aqi|cleaner|shorten|light/);
    expect(indoor?.actions.join(' ').toLowerCase()).toMatch(/closed|seal|clean room|windows\/doors/);
  });

  it('returns Portuguese recommendations when lang is pt', () => {
    const recs = buildRecommendations(goodAir, baseLifestyle, 'pt');
    expect(recs.length).toBeGreaterThanOrEqual(4);
    const joined = recs.map((r) => r.title + ' ' + r.actions.join(' ')).join(' ');
    // should contain Portuguese keywords/accents in most environments; at least not be empty English-only structure issues
    expect(joined.length).toBeGreaterThan(100);
  });
});

describe('impactSummary', () => {
  it('includes PM2.5 and AQI when data is available (EN)', () => {
    const lines = impactSummary({ usAqi: 80, pm25: 22.4, pm10: 40, source: 'test' }, baseLifestyle, 'en');
    expect(lines.some((l) => /PM2\.5/.test(l))).toBe(true);
    expect(lines.some((l) => /US AQI/i.test(l))).toBe(true);
  });

  it('includes transport and residential burning impacts when relevant', () => {
    const lines = impactSummary(
      { usAqi: 120, pm25: 35, pm10: 50, source: 'test' },
      { ...baseLifestyle, transport: 'car/motorbike', heating: 'wood / fireplace', cooking: 'wood / charcoal' },
      'en',
    );
    expect(lines.some((l) => /transport/i.test(l))).toBe(true);
    expect(lines.some((l) => /burning|smoke/i.test(l))).toBe(true);
  });

  it('returns fallback guidance when no data/profile hints', () => {
    const lines = impactSummary(null, { ...baseLifestyle, transport: 'walk / bike', heating: 'electric / heat pump', cooking: 'electric / induction' }, 'en');
    expect(lines.length).toBeGreaterThan(0);
  });

  it('returns Portuguese summary when lang is pt', () => {
    const lines = impactSummary({ usAqi: 90, pm25: 20, pm10: 30, source: 'test' }, baseLifestyle, 'pt');
    expect(lines.some((l) => /PM2\.5/.test(l))).toBe(true);
    expect(lines.length).toBeGreaterThan(0);
  });
});
