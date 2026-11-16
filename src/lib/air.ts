import type { AirQuality, LocationInfo } from '../types';

export async function geocodeLocation(query: string): Promise<LocationInfo[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=pt&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Falha ao buscar localização');
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

export async function fetchAirQuality(lat: number, lon: number): Promise<AirQuality> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'pm10,pm2_5,us_aqi,european_aqi,uv_index,dust',
    timezone: 'auto',
  });
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Falha ao obter qualidade do ar');
  const data = await res.json();
  const c = data.current || {};
  const pm25 = num(c.pm2_5);
  const pm10 = num(c.pm10);
  const usAqi = num(c.us_aqi);
  const europeanAqi = num(c.european_aqi);
  const dust = num(c.dust);
  // Heuristic smoke indicator: elevated fine particles relative to coarse/dust context
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

export function aqiCategory(usAqi?: number): { label: string; color: string; advice: string } {
  if (usAqi == null) return { label: 'Indisponível', color: '#9db7c9', advice: 'Sem dados suficientes no momento.' };
  if (usAqi <= 50) return { label: 'Boa', color: '#58d68d', advice: 'Ar em boas condições para a maioria das pessoas.' };
  if (usAqi <= 100) return { label: 'Moderada', color: '#f7d774', advice: 'Pessoas sensíveis devem reduzir esforço prolongado ao ar livre.' };
  if (usAqi <= 150) return { label: 'Ruim para grupos sensíveis', color: '#f7b267', advice: 'Crianças, idosos e pessoas com asma devem limitar exposição externa.' };
  if (usAqi <= 200) return { label: 'Ruim', color: '#ff8c42', advice: 'Evite atividades intensas ao ar livre; prefira ambientes internos protegidos.' };
  if (usAqi <= 300) return { label: 'Muito ruim', color: '#ff6b6b', advice: 'Fique em local fechado com ar filtrado quando possível; use máscara bem ajustada se precisar sair.' };
  return { label: 'Perigosa', color: '#b5179e', advice: 'Condições de emergência: minimize toda exposição, proteja grupos vulneráveis e siga alertas locais.' };
}