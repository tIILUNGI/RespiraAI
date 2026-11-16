import { describe, expect, it } from 'vitest';
import { aqiCategory } from './air';

describe('aqiCategory', () => {
  it('returns unavailable for missing AQI', () => {
    const en = aqiCategory(undefined, 'en');
    expect(en.label).toBe('Unavailable');
    expect(en.color).toBeTruthy();
    expect(en.advice.length).toBeGreaterThan(0);

    const pt = aqiCategory(undefined, 'pt');
    expect(pt.label.length).toBeGreaterThan(0);
    expect(pt.advice.length).toBeGreaterThan(0);
  });

  it('classifies AQI thresholds correctly (EN)', () => {
    expect(aqiCategory(0, 'en').label).toBe('Good');
    expect(aqiCategory(50, 'en').label).toBe('Good');
    expect(aqiCategory(51, 'en').label).toBe('Moderate');
    expect(aqiCategory(100, 'en').label).toBe('Moderate');
    expect(aqiCategory(101, 'en').label).toBe('Unhealthy for sensitive groups');
    expect(aqiCategory(150, 'en').label).toBe('Unhealthy for sensitive groups');
    expect(aqiCategory(151, 'en').label).toBe('Unhealthy');
    expect(aqiCategory(200, 'en').label).toBe('Unhealthy');
    expect(aqiCategory(201, 'en').label).toBe('Very unhealthy');
    expect(aqiCategory(300, 'en').label).toBe('Very unhealthy');
    expect(aqiCategory(301, 'en').label).toBe('Hazardous');
    expect(aqiCategory(500, 'en').label).toBe('Hazardous');
  });

  it('returns distinct colors and advice per category', () => {
    const labels = [20, 80, 120, 180, 250, 350].map((v) => aqiCategory(v, 'en'));
    const colors = new Set(labels.map((x) => x.color));
    expect(colors.size).toBe(labels.length);
    for (const x of labels) expect(x.advice.length).toBeGreaterThan(10);
  });
});
