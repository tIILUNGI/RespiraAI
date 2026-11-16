import type { AirQuality, LocationInfo } from '../types';

export async function geocodeLocation(query: string, lang: 'en' | 'pt' = 'en'): Promise<LocationInfo[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=${lang}&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(lang === 'pt' ? 'Falha ao buscar localização' : 'Failed to search location');
  const data = await res.json();
  const results = (data.results || []) as any[];
  return results.map((r) => ({
    name: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone,
    country: r.country,
    admin1: r.admin1,
  }));
}

export async function fetchAirQuality(lat: number, lon: number, lang: 'en' | 'pt' = 'en'): Promise<AirQuality> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'pm10,pm2_5,us_aqi,european_aqi,uv_index,dust',
    timezone: 'auto',
  });
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(lang === 'pt' ? 'Falha ao obter qualidade do ar' : 'Failed to fetch air quality data');
  const data = await res.json();
  const c = data.current || {};
  const pm25 = num(c.pm2_5);
  const pm10 = num(c.pm10);
  const usAqi = num(c.us_aqi);
  const europeanAqi = num(c.european_aqi);
  const dust = num(c.dust);
  let smokeIndicator: number | undefined;
  if (pm25 != null) {
    smokeIndicator = Math.min(500, Math.round(pm25 * (pm10 && pm10 > 0 ? Math.max(1, pm25 / Math.max(pm10 * 0.6, 1)) : 4)));
  }
  return {
    pm25,
    pm10,
    usAqi,
    europeanAqi,
    uvIndex: num(c.uv_index),
    dust,
    smokeIndicator,
    source: 'Open-Meteo Air Quality API',
    time: c.time,
  };
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

export function aqiCategory(usAqi?: number, lang: 'en' | 'pt' = 'en'): { label: string; color: string; advice: string } {
  if (usAqi == null) return {
    label: lang === 'pt' ? 'Indisponível' : 'Unavailable',
    color: '#9db7c9',
    advice: lang === 'pt' ? 'Sem dados suficientes no momento.' : 'Not enough data right now.',
  };
  if (usAqi <= 50) return { label: lang === 'pt' ? 'Boa' : 'Good', color: '#58d68d', advice: lang === 'pt' ? 'Ar em boas condições para a maioria das pessoas.' : 'Air quality is satisfactory for most people.' };
  if (usAqi <= 100) return { label: lang === 'pt' ? 'Moderada' : 'Moderate', color: '#f7d774', advice: lang === 'pt' ? 'Pessoas sensíveis devem reduzir esforço prolongado ao ar livre.' : 'Sensitive individuals should reduce prolonged outdoor exertion.' };
  if (usAqi <= 150) return { label: lang === 'pt' ? 'Ruim para grupos sensíveis' : 'Unhealthy for sensitive groups', color: '#f7b267', advice: lang === 'pt' ? 'Crianças, idosos e pessoas com asma devem limitar exposição externa.' : 'Children, older adults, and people with asthma should limit outdoor exposure.' };
  if (usAqi <= 200) return { label: lang === 'pt' ? 'Ruim' : 'Unhealthy', color: '#ff8c42', advice: lang === 'pt' ? 'Evite atividades intensas ao ar livre; prefira ambientes internos protegidos.' : 'Avoid intense outdoor activity; prefer protected indoor spaces.' };
  if (usAqi <= 300) return { label: lang === 'pt' ? 'Muito ruim' : 'Very unhealthy', color: '#ff6b6b', advice: lang === 'pt' ? 'Fique em local fechado com ar filtrado quando possível; use máscara bem ajustada se precisar sair.' : 'Stay indoors with filtered air when possible; wear a well-fitted mask if you must go out.' };
  return { label: lang === 'pt' ? 'Perigosa' : 'Hazardous', color: '#b5179e', advice: lang === 'pt' ? 'Condições de emergência: minimize toda exposição, proteja grupos vulneráveis e siga alertas locais.' : 'Emergency conditions: minimize all exposure, protect vulnerable people, and follow local alerts.' };
}
