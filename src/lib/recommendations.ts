import type { AirQuality, Lifestyle, Recommendation } from '../types';
import { aqiCategory } from './air';

export function buildRecommendations(air: AirQuality | null, lifestyle: Lifestyle, lang: 'en' | 'pt' = 'en'): Recommendation[] {
  const cat = aqiCategory(air?.usAqi, lang);
  const severe = (air?.usAqi ?? 0) >= 150 || (air?.pm25 ?? 0) >= 55;
  const smoky = (air?.pm25 ?? 0) >= 35 || (air?.smokeIndicator ?? 0) >= 120;
  const winterRisk = /lenha|carv|lareira|wood|fireplace|coal|combust/i.test(`${lifestyle.heating} ${lifestyle.cooking}`);
  const sensitive = lifestyle.hasChildren || lifestyle.hasElderly || lifestyle.hasRespiratory;

  if (lang === 'pt') {
    const recs: Recommendation[] = [];
    recs.push({
      category: 'rotina',
      title: 'Rotina diária de baixa exposição e baixa emissão',
      actions: [
        severe
          ? 'Planeie tarefas externas nos horários de menor poluição e reduza duração/intensidade; prefira exercícios leves em ambientes internos.'
          : 'Priorize caminhadas e deslocamentos ativos em horários de ar mais limpo e rotas afastadas do tráfego intenso.',
        /carro|moto|car|motor/i.test(lifestyle.transport)
          ? 'Combine recados em uma única viagem, pratique direção suave e mantenha pneus calibrados para reduzir emissões e consumo.'
          : 'Mantenha transporte coletivo, caminhada ou bicicleta quando o ar estiver adequado; em picos, escolha rotas mais protegidas.',
        /alta|exerc|high|sport|work|outdoor/i.test(lifestyle.outdoorRoutine)
          ? 'Troque treinos intensos ao ar livre por opções internas em dias de AQI elevado.'
          : 'Se precisar sair, faça pausas em ambientes fechados e evite vias com tráfego pesado.',
        'Verifique a qualidade do ar antes de abrir janelas e antes de atividades de crianças, idosos ou pessoas sensíveis.',
      ],
      impact: 'Impacto direto: reduzir esforço ao ar livre em picos diminui a dose inalada de PM2.5 no mesmo dia; menos viagens e direção eficiente cortam emissões locais (NOx/PM) e CO2, melhorando o ar do entorno e reduzindo custos.',
    });
    recs.push({
      category: 'casa',
      title: 'Qualidade do ar interno (fumaça e poluição urbana)',
      actions: [
        smoky || severe
          ? 'Feche portas e janelas durante picos; vede frestas e crie um "quarto limpo" com menor entrada de ar externo.'
          : 'Ventile nos períodos de melhor qualidade do ar para renovar o ambiente sem trazer poluição.',
        'Use exaustor na cozinha, evite frituras e queima desnecessária; reduza fontes internas de partículas e gases.',
        'Evite fumar, queimar incenso/velas e usar aerossóis fortes em ambientes fechados.',
        'Se tiver purificador HEPA, use no cômodo mais ocupado; mantenha filtros limpos e portas fechadas para maior eficiência.',
        'Limpe poeira com pano úmido e aspire com filtro adequado para não ressuspender partículas.',
      ],
      impact: `Impacto direto: vedação e filtragem reduzem a infiltração de partículas externas; controlar fontes internas evita somar poluição. Em condição ${cat.label.toLowerCase()}, isso pode aliviar sintomas e proteger ${sensitive ? 'crianças, idosos ou pessoas sensíveis' : 'toda a família'}.`,
    });
    recs.push({
      category: 'sustentavel',
      title: 'Alternativas sustentáveis adaptadas ao seu contexto',
      actions: [
        winterRisk
          ? 'Se usa lenha/carvão/lareira, faça manutenção, busque queima mais eficiente e, quando viável, transição gradual para opções mais limpas.'
          : 'Prefira aquecimento e cocção eficientes e ajuste o uso apenas aos ambientes ocupados.',
        'Reduza desperdício de energia: desligue standby, use iluminação eficiente e cozinhe com tampa para menor consumo.',
        'Prefira mobilidade compartilhada, deslocamentos combinados e teletrabalho/estudo remoto em dias de alerta quando possível.',
        'Evite queima de resíduos e apoie práticas comunitárias de menor emissão.',
      ],
      impact: 'Impacto direto: cada redução de queima e consumo energético diminui partículas e CO2; ganhos locais (menos fumaça doméstica e tráfego) somam-se na vizinhança e reduzem picos de poluição.',
    });
    recs.push({
      category: 'comunidade',
      title: 'Ações familiares e comunitárias',
      actions: [
        'Combine sinais de alerta na família e verifique vizinhos vulneráveis em episódios de fumaça intensa.',
        'Partilhe dados confiáveis de qualidade do ar e incentive práticas de baixa emissão em escolas e condomínios.',
        'Apoie medidas para reduzir poeira em obras e queimadas de resíduos no bairro.',
        'Identifique locais com melhor filtragem de ar para proteção coletiva em dias severos.',
      ],
      impact: 'Impacto direto: coordenação reduz exposições evitáveis e emissões simultâneas; ações coletivas melhoram a qualidade do ar local ao longo do tempo.',
    });
    if (sensitive) {
      recs.push({
        category: 'saude',
        title: 'Cuidados para pessoas sensíveis',
        actions: [
          'Siga plano médico/medicação e evite atrasar cuidados em caso de piora de sintomas.',
          'Em exposição inevitável em picos, use máscara bem ajustada (ex.: PFF2/N95) quando indicado.',
          'Reduza esforço físico de crianças e idosos em dias ruins e mantenha hidratação.',
          'Procure atendimento se houver falta de ar, dor no peito, tontura ou piora rápida.',
        ],
        impact: 'Impacto direto: reduzir dose de exposição e usar proteção adequada diminui risco de crises respiratórias/cardiovasculares; resposta rápida evita agravamentos.',
      });
    }
    return recs;
  }

  const recs: Recommendation[] = [];
  recs.push({
    category: 'rotina',
    title: 'Daily low-exposure, low-emission routine',
    actions: [
      severe
        ? 'Schedule outdoor tasks at cleaner-air times, shorten duration/intensity, and choose light indoor activity when AQI is high.'
        : 'Prioritize walks and active travel during cleaner hours and on routes away from heavy traffic.',
      /carro|moto|car|motor/i.test(lifestyle.transport)
        ? 'Combine errands into one trip, drive smoothly, and keep tires properly inflated to cut fuel use and emissions.'
        : 'Use public transit, walking, or cycling when air is acceptable; on high-pollution days pick more sheltered routes.',
      /alta|exerc|high|sport|work|outdoor/i.test(lifestyle.outdoorRoutine)
        ? 'Swap intense outdoor workouts for indoor options on high-AQI days.'
        : 'If you must be outside, take breaks indoors and avoid busy roads.',
      'Check air quality before opening windows and before activities for children, older adults, or sensitive people.',
    ],
    impact: 'Direct impact: reducing exertion during peaks lowers the same-day dose of inhaled PM2.5; fewer car trips and efficient driving cut local NOx/PM and CO2, improving neighborhood air and saving fuel.',
  });
  recs.push({
    category: 'casa',
    title: 'Indoor air quality (smoke & urban pollution)',
    actions: [
      smoky || severe
        ? 'Keep windows/doors closed during peaks, seal gaps, and set up a "clean room" with minimal outdoor air infiltration.'
        : 'Ventilate during cleaner periods to refresh indoor air without pulling in pollution.',
      'Use kitchen exhaust, avoid unnecessary burning/frying, and reduce indoor particle and gas sources.',
      'Avoid smoking, incense/candles, and strong aerosols indoors.',
      'Run a HEPA purifier in the most-used room if available; keep filters maintained and doors closed for better performance.',
      'Clean dust with a damp cloth and vacuum with a suitable filter to avoid resuspending particles.',
    ],
    impact: `Direct impact: sealing and filtration reduce infiltration of outdoor particles; controlling indoor sources prevents added pollution. In ${cat.label.toLowerCase()} conditions this can ease symptoms and better protect ${sensitive ? 'children, older adults, or sensitive people' : 'your household'}.`,
  });
  recs.push({
    category: 'sustentavel',
    title: 'Sustainable alternatives for your context',
    actions: [
      winterRisk
        ? 'If using wood/coal/fireplaces, maintain equipment, aim for cleaner combustion, and transition gradually to cleaner options when feasible.'
        : 'Use efficient heating/cooking and limit energy use to occupied spaces.',
      'Cut energy waste: reduce standby power, use efficient lighting, and cook with lids to lower consumption.',
      'Prefer shared mobility, trip bundling, and remote work/study on alert days when possible.',
      'Avoid burning waste and support community low-emission practices.',
    ],
    impact: 'Direct impact: every reduction in burning and energy use lowers particle and CO2 emissions; local gains (less domestic smoke and traffic) add up across the neighborhood and reduce pollution peaks.',
  });
  recs.push({
    category: 'comunidade',
    title: 'Family and community actions',
    actions: [
      'Set family alert signals and check on vulnerable neighbors during intense smoke episodes.',
      'Share reliable air-quality information and encourage low-emission practices in schools and buildings.',
      'Support measures to reduce construction dust and waste burning locally.',
      'Identify places with better air filtration for collective protection on severe days.',
    ],
    impact: 'Direct impact: coordination reduces avoidable exposures and simultaneous emissions; collective action improves local air quality over time.',
  });
  if (sensitive) {
    recs.push({
      category: 'saude',
      title: 'Care for sensitive people',
      actions: [
        'Follow medical plans/medications and do not delay care if symptoms worsen.',
        'Use a well-fitted mask (e.g., N95/P2) during unavoidable exposure at peaks when appropriate.',
        'Limit physical exertion for children and older adults on poor-air days and maintain hydration.',
        'Seek medical care for shortness of breath, chest pain, dizziness, or rapid worsening of symptoms.',
      ],
      impact: 'Direct impact: lowering exposure dose and using proper protection reduces risk of respiratory/cardiovascular flare-ups; rapid response prevents complications.',
    });
  }
  return recs;
}

export function impactSummary(air: AirQuality | null, lifestyle: Lifestyle, lang: 'en' | 'pt' = 'en'): string[] {
  const lines: string[] = [];
  const pm25 = air?.pm25;
  if (lang === 'pt') {
    if (pm25 != null) lines.push(`PM2.5 atual estimado: ${pm25.toFixed(1)} µg/m³. Partículas finas penetram nos pulmões; reduzir exposição em picos traz benefício imediato.`);
    if (air?.usAqi != null) { const c = aqiCategory(air.usAqi, 'pt'); lines.push(`AQI (EUA): ${Math.round(air.usAqi)} — ${c.label}. ${c.advice}`); }
    if (/carro|moto|car|motor/i.test(lifestyle.transport)) lines.push('Transporte motorizado: combinar viagens e evitar marcha lenta reduz emissões locais por trajeto e melhora o ar na vizinhança.');
    if (/lenha|carv|lareira|wood|fireplace|coal/i.test(`${lifestyle.heating} ${lifestyle.cooking}`)) lines.push('Queima residencial: fonte relevante de partículas no inverno; otimizar ou reduzir uso tem impacto direto na fumaça local.');
    if (!lines.length) lines.push('Informe sua localização e perfil para estimar impactos diretos das suas escolhas.');
    return lines;
  }
  if (pm25 != null) lines.push(`Estimated current PM2.5: ${pm25.toFixed(1)} µg/m³. Fine particles penetrate deep into the lungs; reducing peak exposure brings immediate benefit.`);
  if (air?.usAqi != null) { const c = aqiCategory(air.usAqi, 'en'); lines.push(`US AQI: ${Math.round(air.usAqi)} — ${c.label}. ${c.advice}`); }
  if (/carro|moto|car|motor/i.test(lifestyle.transport)) lines.push('Motorized transport: combining trips and avoiding idling cuts local emissions per journey and improves neighborhood air.');
  if (/lenha|carv|lareira|wood|fireplace|coal/i.test(`${lifestyle.heating} ${lifestyle.cooking}`)) lines.push('Residential burning: a key source of winter particles; optimizing or reducing use has a direct impact on local smoke.');
  if (!lines.length) lines.push('Add your location and profile to estimate the direct impact of your choices.');
  return lines;
}