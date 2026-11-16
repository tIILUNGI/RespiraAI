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
  lang: 'en' | 'pt' = 'en',
): string {
  const cat = aqiCategory(air?.usAqi, lang);
  const recs = buildRecommendations(air, lifestyle, lang);
  const impacts = impactSummary(air, lifestyle, lang);
  if (lang === 'pt') {
    return [
      `Localização: ${location ? `${location.name} (${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)})` : 'não informada'}`,
      `Qualidade do ar: AQI=${air?.usAqi ?? 'n/d'}, categoria=${cat.label}, PM2.5=${air?.pm25 ?? 'n/d'} µg/m³, PM10=${air?.pm10 ?? 'n/d'} µg/m³, fonte=${air?.source ?? 'n/d'}, hora=${air?.time ?? 'n/d'}`,
      `Perfil: agregado=${lifestyle.household}, crianças=${lifestyle.hasChildren}, idosos=${lifestyle.hasElderly}, condição respiratória=${lifestyle.hasRespiratory}, aquecimento=${lifestyle.heating}, cocção=${lifestyle.cooking}, transporte=${lifestyle.transport}, rotina externa=${lifestyle.outdoorRoutine}, pets=${lifestyle.pets}, notas=${lifestyle.notes || '—'}`,
      `Impactos: ${impacts.join(' | ')}`,
      `Recomendações-chave: ${recs.map((r) => `${r.title}: ${r.actions.slice(0, 2).join('; ')} [Impacto: ${r.impact}]`).join(' || ')}`,
    ].join('\n');
  }
  return [
    `Location: ${location ? `${location.name} (${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)})` : 'not provided'}`,
    `Air quality: AQI=${air?.usAqi ?? 'n/a'}, category=${cat.label}, PM2.5=${air?.pm25 ?? 'n/a'} µg/m³, PM10=${air?.pm10 ?? 'n/a'} µg/m³, source=${air?.source ?? 'n/a'}, time=${air?.time ?? 'n/a'}`,
    `Profile: household=${lifestyle.household}, children=${lifestyle.hasChildren}, elderly=${lifestyle.hasElderly}, respiratory/heart condition=${lifestyle.hasRespiratory}, heating=${lifestyle.heating}, cooking=${lifestyle.cooking}, transport=${lifestyle.transport}, outdoor routine=${lifestyle.outdoorRoutine}, pets=${lifestyle.pets}, notes=${lifestyle.notes || '—'}`,
    `Impacts: ${impacts.join(' | ')}`,
    `Key recommendations: ${recs.map((r) => `${r.title}: ${r.actions.slice(0, 2).join('; ')} [Impact: ${r.impact}]`).join(' || ')}`,
  ].join('\n');
}

export async function generateAssistantReply(params: {
  messages: ChatMessage[];
  settings: AiSettings;
  location: LocationInfo | null;
  air: AirQuality | null;
  lifestyle: Lifestyle;
  lang: 'en' | 'pt';
}): Promise<string> {
  const { messages, settings, location, air, lifestyle, lang } = params;
  const context = buildContext(location, air, lifestyle, lang);

  if (settings.provider === 'openai-compatible' && settings.apiKey.trim()) {
    try {
      const system = lang === 'pt'
        ? `Você é o RespiraAI, um assistente GenAI especializado em ajudar famílias e comunidades a navegar por fumaça intensa no inverno e poluição do ar urbana.
Responda em português, de forma clara, prática e empática.
Use o contexto fornecido (localização, dados de ar, perfil e recomendações) para personalizar.
Sempre que sugerir uma ação, explique o impacto direto dessa escolha (saúde, exposição, emissões, custo ou comunidade).
Se faltarem dados, peça objetivamente o que falta e ainda ofereça orientações úteis.
Não invente medições exatas; baseie-se nos dados disponíveis e indique incertezas.
Inclua alertas de saúde quando AQI/PM2.5 estiverem elevados e incentive procurar ajuda médica em sintomas graves.`
        : `You are RespiraAI, a GenAI assistant helping families and communities navigate intense winter smoke and urban air pollution.
Respond in English, clearly, practically, and empathetically.
Use the provided context (location, air data, profile, recommendations) to personalize guidance.
Whenever you suggest an action, explain its direct impact (health, exposure, emissions, cost, or community).
If data is missing, ask for what is needed while still giving useful guidance.
Do not invent exact measurements; rely on available data and state uncertainty.
Include health cautions when AQI/PM2.5 is elevated and encourage medical care for severe symptoms.`;

      const payload = {
        model: settings.model || 'gpt-4o-mini',
        temperature: 0.4,
        messages: [
          { role: 'system', content: system },
          { role: 'system', content: `${lang === 'pt' ? 'Contexto atual' : 'Current context'}:\n${context}` },
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
        throw new Error(`provider_unavailable_${res.status}`);
      }
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content === 'string' && content.trim()) return content.trim();
      throw new Error(lang === 'pt' ? 'Resposta vazia do provedor de IA.' : 'Empty response from AI provider.');
    } catch {
      const prefix = lang === 'pt'
        ? `**Modo de orientação inteligente ativado**\nNão consegui conectar ao serviço de IA no momento, mas tudo bem — vou te ajudar com orientações personalizadas com base na qualidade do ar e no seu perfil. (Se quiser usar um provedor GenAI, confira a chave e as configurações em "Config. IA".)\n\n`
        : `**Smart guidance mode is on**\nI couldn't connect to the AI service right now, but no worries — I'll help with personalized guidance based on your air quality and profile. (If you'd like full GenAI replies, you can check your key and settings in "AI Settings".)\n\n`;
      return localExpertReply(messages, location, air, lifestyle, lang, prefix);
    }
  }

  return localExpertReply(messages, location, air, lifestyle, lang, '');
}

function localExpertReply(
  messages: ChatMessage[],
  location: LocationInfo | null,
  air: AirQuality | null,
  lifestyle: Lifestyle,
  lang: 'en' | 'pt',
  prefix: string,
): string {
  const last = [...messages].reverse().find((m) => m.role === 'user')?.content.toLowerCase() || '';
  const cat = aqiCategory(air?.usAqi, lang);
  const recs = buildRecommendations(air, lifestyle, lang);
  const impacts = impactSummary(air, lifestyle, lang);
  const focus = pickFocus(last);
  const chosen = recs.filter((r) => focus.includes(r.category)).slice(0, 3);
  const use = chosen.length ? chosen : recs.slice(0, 3);
  const lines: string[] = [];
  if (prefix) lines.push(prefix.trim());

  if (lang === 'pt') {
    lines.push(`**Situação atual${location ? ` — ${location.name}` : ''}**`);
    lines.push(`- Qualidade do ar: **${cat.label}**${air?.usAqi != null ? ` (AQI ${Math.round(air.usAqi)})` : ''}${air?.pm25 != null ? `, PM2.5 ${air.pm25.toFixed(1)} µg/m³` : ''}. ${cat.advice}`);
    lines.push('', '**Orientações personalizadas**');
    for (const r of use) {
      lines.push(`\n**${r.title}**`);
      for (const a of r.actions.slice(0, 4)) lines.push(`- ${a}`);
      lines.push(`- _Impacto direto:_ ${r.impact}`);
    }
    lines.push('\n**Impacto das suas escolhas (resumo)**');
    for (const i of impacts) lines.push(`- ${i}`);
    if (/crian|idos|asma|respir|beb|gravidez|child|elder|asthma/i.test(last) || lifestyle.hasChildren || lifestyle.hasElderly || lifestyle.hasRespiratory) {
      lines.push('\n**Nota de cuidado:** se houver falta de ar, dor no peito, chiado intenso ou piora rápida, procure atendimento médico/urgência. Minimizar exposição em picos traz o maior benefício imediato.');
    }
    if (!location) lines.push('\n_Dica:_ informe sua localização para eu adaptar o risco local com dados de ar em tempo quase real.');
    lines.push('\n_Posso detalhar um plano para hoje, para o inverno, para reduzir emissões em casa ou para proteger sua família/comunidade — diga sua prioridade._');
    return lines.join('\n');
  }

  lines.push(`**Current situation${location ? ` — ${location.name}` : ''}**`);
  lines.push(`- Air quality: **${cat.label}**${air?.usAqi != null ? ` (AQI ${Math.round(air.usAqi)})` : ''}${air?.pm25 != null ? `, PM2.5 ${air.pm25.toFixed(1)} µg/m³` : ''}. ${cat.advice}`);
  lines.push('', '**Personalized guidance**');
  for (const r of use) {
    lines.push(`\n**${r.title}**`);
    for (const a of r.actions.slice(0, 4)) lines.push(`- ${a}`);
    lines.push(`- _Direct impact:_ ${r.impact}`);
  }
  lines.push('\n**Impact of your choices (summary)**');
  for (const i of impacts) lines.push(`- ${i}`);
  if (/crian|idos|asma|respir|beb|gravidez|child|elder|asthma|pregnan/i.test(last) || lifestyle.hasChildren || lifestyle.hasElderly || lifestyle.hasRespiratory) {
    lines.push('\n**Care note:** seek urgent medical care for shortness of breath, chest pain, severe wheezing, or rapid worsening. Reducing exposure during peaks brings the greatest immediate benefit.');
  }
  if (!location) lines.push('\n_Tip:_ add your location so I can tailor local risk using near real-time air data.');
  lines.push('\n_I can detail a plan for today, for winter, to cut home emissions, or to protect your family/community — tell me your priority._');
  return lines.join('\n');
}

function pickFocus(text: string): string[] {
  const f: string[] = [];
  if (/casa|intern|janela|filtro|purificador|quarto|veda|home|indoor|window|filter|purifier|room|seal/i.test(text)) f.push('casa');
  if (/rotina|hoje|amanh|exerc|escola|trabalho|sair|horário|routine|today|tomorrow|exercise|school|work|outside|schedule/i.test(text)) f.push('rotina');
  if (/emiss|sustent|energia|carro|ônibus|transporte|aquec|lenha|cozin|emission|sustain|energy|car|bus|transport|heating|wood|cook/i.test(text)) f.push('sustentavel');
  if (/comunidade|vizin|bairro|escola|coletiv|community|neighbor|neighbour/i.test(text)) f.push('comunidade');
  if (/saúde|crian|idos|asma|respir|máscara|sintoma|health|child|elder|asthma|mask|symptom/i.test(text)) f.push('saude');
  return f.length ? f : ['rotina', 'casa', 'sustentavel'];
}
