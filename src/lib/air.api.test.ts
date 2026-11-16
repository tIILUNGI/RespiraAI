import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAirQuality, geocodeLocation } from './air';

describe('geocodeLocation', () => {
  afterEach(() => vi.restoreAllMocks());

  it('maps API results to LocationInfo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ name: 'Lisbon', admin1: 'Lisbon', country: 'Portugal', latitude: 38.72, longitude: -9.14, timezone: 'Europe/Lisbon' }] }),
    }));
    const res = await geocodeLocation('Lisbon', 'en');
    expect(res).toHaveLength(1);
    expect(res[0].name).toContain('Lisbon');
    expect(res[0].latitude).toBe(38.72);
    expect(res[0].longitude).toBe(-9.14);
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    await expect(geocodeLocation('X', 'en')).rejects.toThrow();
  });
});

describe('fetchAirQuality', () => {
  afterEach(() => vi.restoreAllMocks());

  it('parses current air quality fields', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ current: { pm2_5: 12.3, pm10: 20.1, us_aqi: 55, european_aqi: 18, uv_index: 3, dust: 1.2, time: '2026-01-01T10:00' } }),
    }));
    const aq = await fetchAirQuality(10, 20, 'en');
    expect(aq.pm25).toBe(12.3);
    expect(aq.pm10).toBe(20.1);
    expect(aq.usAqi).toBe(55);
    expect(aq.source).toContain('Open-Meteo');
    expect(typeof aq.smokeIndicator).toBe('number');
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    await expect(fetchAirQuality(0, 0, 'en')).rejects.toThrow();
  });
});
