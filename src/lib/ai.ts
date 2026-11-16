import type { AiSettings, AirQuality, ChatMessage, Lifestyle, LocationInfo } from '../types';
import { aqiCategory } from './air';
import { buildRecommendations, impactSummary } from './recommendations';

export function defaultAiSettings(): AiSettings {
  return {
    provider: 'openai-compatible',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o-mini',
  };
}

export function buildContext(
  location: LocationInfo | null,
  air: AirQuality | null,
  lifestyle: Lifestyle,
): string {
  const cat = aqiCategory(air?.usAqi);
  const recs = buildRecommendations(air, lifestyle);
  const impacts = impactSummary(air, lifestyle);
  return [
    `Localização: ${location ? `${location.name} (${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)})` : 'não informada'}`,
    `Qualidade do ar: AQI=${air?.usAqi ?? 'n/d'}, categoria=${cat.label}, PM2.5=${air?.pm25 ?? 'n/d'} µg/m³, PM10=${air?.pm10 ?? 'n/d'} µg/m³, fonte=${air?.source ?? 'n/d'}, hora=${air?.time ?? 'n/d'}`,
    `Perfil: agregado=${lifestyle.household}, crianças=${lifestyle.hasChildren}, idosos=${lifestyle.hasElderly}, respiratório=${lifestyle.hasRespiratory}, aquecimento=${lifestyle.heating}, cocção=${lifestyle.cooking}, transporte=${lifestyle.transport}, rotina externa=${lifestyle.outdoorRoutine}, pets=${lifestyle.pets}, notas=${lifestyle.notes || '—'}`,
    `Impactos: ${impacts.join(' | ')}`,
    `Recomendações-chave: ${recs.map((r) => `${r.title}: ${r.actions.slice(0, 2).join('; ')} [Impacto: ${r.impact}]`).join(' || ')}`,
  ].join('\n');
}

export async function generateAssistantReply(params: {
  messages: ChatMessage[];
  settings: AiSettings;
  location: LocationInfo | null;
  air: AirQuality | null;
  lifestyle: Lifestyle;
}): Promise<string> {
  const { messages, settings, location, air, lifestyle } = params;
  const context = buildContext(location, air, lifestyle);

  if (settings.provider === 'openai-compatible' && settings.apiKey.trim()) {
    try {
      const system = `Você é o RespiraAI, um assistente GenAI especializado em ajudar famílias e comunidades a navegar por fumaça intensa no inverno e poluição do ar urbana.
Responda em português, de forma clara, prática e empática.
Use o contexto fornecido (localização, dados de ar, perfil e recomendações) para personalizar.
Sempre que sugerir uma ação, explique o impacto direto dessa escolha (saúde, exposição, emissões, custo ou comunidade).
Se faltarem dados (ex.: localização), peça objetivamente o que falta e ainda ofereça orientações úteis.
Não invente medições exatas; baseie-se nos dados disponíveis e indique incertezas.
Inclua alertas de saúde quando AQI/PM2.5 estiverem elevados e incentive procurar ajuda médica em sintomas graves.`;

      const payload = {
        model: settings.model || 'gpt-4o-mini',
        temperature: 0.4,
        messages: [
          { role: 'system', content: system },
          { role: 'system', content: `Contexto atual:\n${context}` },
          ...messages.filter((m) => m.role !== 'system').map((m) => ({ role: m.role, content: m.content })),
        ],
      };

      const base = settings.baseUrl.replace(/\/$/, '');
      const res = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.apiKey.trim()}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Erro da API (${res.status}): ${text.slice(0, 200)}`);
      }
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content === 'string' && content.trim()) return content.trim();
      throw new Error('Resposta vazia do provedor de IA.');
    } catch (err: any) {
      return localExpertReply(messages, location, air, lifestyle, `Não consegui acessar o provedor GenAI configurado (${err?.message || 'erro desconhecido'}). Ativei o modo especialista local com base nos seus dados:\n\n`);
    }
  }

  return localExpertReply(messages, location, air, lifestyle, '');
}

function localExpertReply(
  messages: ChatMessage[],
  location: LocationInfo | null,
  air: AirQuality | null,
  lifestyle: Lifestyle,
  prefix: string,
): string {
  const last = [...messages].reverse().find((m) => m.role === 'user')?.content.toLowerCase() || '';
  const cat = aqiCategory(air?.usAqi);
  const recs = buildRecommendations(air, lifestyle);
  const impacts = impactSummary(air, lifestyle);

  const focus = pickFocus(last);
  const chosen = recs.filter((r) => focus.includes(r.category)).slice(0, 3);
  const use = chosen.length ? chosen : recs.slice(0, 3);

  const lines: string[] = [];
  if (prefix) lines.push(prefix.trim());
  lines.push(`**Situação atual${location ? ` — ${location.name}` : ''}**`);
  lines.push(`- Qualidade do ar: **${cat.label}**${air?.usAqi != null ? ` (AQI ${Math.round(air.usAqi)})` : ''}${air?.pm25 != null ? `, PM2.5 ${air.pm25.toFixed(1)} µg/m³` : ''}. ${cat.advice}`);
  lines.push('');
  lines.push('**Orientações personalizadas**');
  for (const r of use) {
    lines.push(`\n**${r.title}**`);
    for (const a of r.actions.slice(0, 4)) lines.push(`- ${a}`);
    lines.push(`- _Impacto direto:_ ${r.impact}`);
  }
  lines.push('\n**Impacto das suas escolhas (resumo)**');
  for (const i of impacts) lines.push(`- ${i}`);

  if (/crian|idos|asma|respir|beb|gravidez/i.test(last) || lifestyle.hasChildren || lifestyle.hasElderly || lifestyle.hasRespiratory) {
    lines.push('\n**Nota de cuidado:** se houver falta de ar, dor no peito, chiado intenso ou piora rápida, procure atendimento médico/urgência. Em picos de fumaça, minimizar exposição é a medida com maior benefício imediato.');
  }
  if (!location) {
    lines.push('\n_Dica:_ informe sua cidade/localização no painel para eu adaptar horários, risco local e recomendações com dados de ar em tempo quase real.');
  }
  lines.push('\n_Posso detalhar um plano para hoje, para o inverno, para reduzir emissões em casa ou para proteger sua família/comunidade — diga sua prioridade._');
  return lines.join('\n');
}

function pickFocus(text: string): string[] {
  const f: string[] = [];
  if (/casa|intern|janela|filtro|purificador|quarto|veda/i.test(text)) f.push('casa');
  if (/rotina|hoje|amanh|exerc|escola|trabalho|sair|horário/i.test(text)) f.push('rotina');
  if (/emiss|sustent|energia|carro|ônibus|transporte|aquec|lenha|cozin/i.test(text)) f.push('sustentavel');
  if (/comunidade|vizin|bairro|escola|coletiv/i.test(text)) f.push('comunidade');
  if (/saúde|crian|idos|asma|respir|máscara|sintoma/i.test(text)) f.push('saude');
  return f.length ? f : ['rotina', 'casa', 'sustentavel'];
}