import { describe, expect, it } from 'vitest';
import { aqiCategory } from './air';
import { buildRecommendations, impactSummary } from './recommendations';
import type { Lifestyle } from '../types';

describe('integration: air -> recommendations/impact', () => {
  const lifestyle: Lifestyle = {
    household: '5+ people',
    hasChildren: true,
    hasElderly: true,
    hasRespiratory: false,
    heating: 'wood / fireplace',
    cooking: 'gas',
    transport: 'car/motorbike',
    outdoorRoutine: 'high (outdoor work/sport)',
    pets: true,
    notes: '',
  };

  it('produces coherent guidance for hazardous smoke conditions', () => {
    const air = { usAqi: 320, pm25: 150, pm10: 180, smokeIndicator: 300, source: 'test', time: 'now' };
    const cat = aqiCategory(air.usAqi, 'en');
    expect(cat.label).toBe('Hazardous');

    const recs = buildRecommendations(air, lifestyle, 'en');
    const impacts = impactSummary(air, lifestyle, 'en');

    expect(recs.some((r) => r.category === 'saude')).toBe(true);
    expect(recs.some((r) => /clean room|seal|closed/i.test(r.actions.join(' ')))).toBe(true);
    expect(impacts.some((l) => /Hazardous/.test(l))).toBe(true);
    expect(impacts.some((l) => /burning|smoke/i.test(l))).toBe(true);
  });
});
