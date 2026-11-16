import type { AirQuality, Lifestyle, Recommendation } from '../types';
import { aqiCategory } from './air';

export function buildRecommendations(air: AirQuality | null, lifestyle: Lifestyle): Recommendation[] {
  const cat = aqiCategory(air?.usAqi);
  const severe = (air?.usAqi ?? 0) >= 150 || (air?.pm25 ?? 0) >= 55;
  const smoky = (air?.pm25 ?? 0) >= 35 || (air?.smokeIndicator ?? 0) >= 120;
  const winterRisk = /lenha|carv|lareira|aquecedor a combust|fogão/i.test(`${lifestyle.heating} ${lifestyle.cooking}`);

  const recs: Recommendation[] = [];

  recs.push({
    category: 'rotina',
    title: 'Rotina diária de baixa exposição e baixa emissão',
    actions: [
      severe
        ? 'Planeie tarefas externas nos horários de menor poluição (consulte o painel) e reduza duração/ intensidade; prefira escadas internas ou exercícios leves em casa.'
        : 'Priorize caminhadas e deslocamentos ativos em horários de ar mais limpo e vias afastadas do tráfego intenso.',
      lifestyle.transport.includes('carro')
        ? 'Combine recados em uma única viagem, pratique direção suave e mantenha pneus calibrados para reduzir emissões e consumo.'
        : 'Mantenha o uso de transporte coletivo, caminhada ou bicicleta quando o ar estiver adequado; em picos de poluição, escolha rotas protegidas.',
      lifestyle.outdoorRoutine.includes('exercicio')
        ? 'Troque treinos intensos ao ar livre por opções internas (alongamento, força, yoga) em dias de AQI elevado.'
        : 'Se precisar estar ao ar livre, faça pausas em ambientes fechados e evite vias com tráfego pesado.',
      'Verifique a qualidade do ar antes de abrir janelas e antes de atividades de crianças, idosos ou pessoas sensíveis.',
    ],
    impact:
      'Impacto direto: reduzir atividade intensa em picos pode diminuir a dose inalada de partículas finas (PM2.5) no mesmo dia; menos viagens de carro e direção eficiente cortam emissões locais de NOx/PM e gases de efeito estufa, melhorando o ar do entorno e reduzindo custos de combustível.',
  });

  recs.push({
    category: 'casa',
    title: 'Qualidade do ar interno (proteção contra fumaça e poluição urbana)',
    actions: [
      smoky || severe
        ? 'Mantenha portas e janelas fechadas durante picos; vede frestas com toalhas/fitas temporárias e crie um “quarto limpo” com menor entrada de ar externo.'
        : 'Ventile a casa nos períodos de melhor qualidade do ar para renovar oxigênio e reduzir poluentes internos.',
      'Use exaustor na cozinha e, se possível, cozinhe em fogo mais baixo; evite frituras e queima desnecessária para reduzir partículas e gases internos.',
      'Evite fumar, queimar incenso/velas e usar produtos com aerossóis fortes em ambientes fechados.',
      'Se tiver purificador ou filtro (HEPA), use na velocidade adequada no cômodo mais ocupado; se não tiver, um ventilador com filtro bem vedado pode ajudar como medida temporária.',
      'Limpe poeira com pano úmido e aspire com filtro adequado para não ressuspender partículas.',
    ],
    impact:
      `Impacto direto: vedação e filtragem reduzem a infiltração de partículas externas; controlar fontes internas evita somar poluição à do exterior. Em cenários de ${cat.label.toLowerCase()}, isso pode aliviar sintomas respiratórios, irritação ocular e fadiga, especialmente para ${lifestyle.hasChildren || lifestyle.hasElderly || lifestyle.hasRespiratory ? 'crianças, idosos ou pessoas sensíveis no seu perfil' : 'toda a família'}.`,
  });

  recs.push({
    category: 'sustentavel',
    title: 'Alternativas sustentáveis adaptadas ao seu contexto',
    actions: [
      winterRisk
        ? 'Se usa lenha/carvão/lareira, busque manutenção do equipamento, queima mais eficiente e, quando viável, transição gradual para opções mais limpas; nunca use combustão para “ventilar” ambientes.'
        : 'Prefira aquecimento e cocção eficientes (tampa nas panelas, manutenção de equipamentos) para reduzir consumo e emissões.',
      lifestyle.cooking.includes('gas') || lifestyle.cooking.includes('lenha')
        ? 'Cozinhe com ventilação/exaustão ativa e considere refeições de menor tempo de chama em dias críticos.'
        : 'Aproveite equipamentos elétricos eficientes e planeamento de refeições para reduzir picos de uso e emissões indiretas.',
      'Reduza desperdício de energia: desligue aparelhos em standby, use iluminação eficiente e ajuste aquecimento apenas nos ambientes ocupados.',
      'Apoie e pratique mobilidade compartilhada, teletrabalho/estudo remoto em dias de alerta quando possível, e escolha fornecedores/serviços com práticas de menor emissão.',
    ],
    impact:
      'Impacto direto: cada redução de queima e de consumo energético diminui emissões de partículas e CO₂; melhorias locais (menos fumaça doméstica e menos tráfego) somam-se na vizinhança, reduzindo episódios de pico e protegendo a saúde coletiva.',
  });

  recs.push({
    category: 'comunidade',
    title: 'Ações familiares e comunitárias',
    actions: [
      'Combine sinais de alerta na família (mensagem/grupo) para dias de fumaça intensa: fechar janelas, ajustar rotinas e checar vizinhos vulneráveis.',
      'Partilhe informação confiável sobre qualidade do ar e incentive práticas de baixa emissão em escolas, condomínios e locais de trabalho.',
      'Organize cronogramas comunitários para reduzir queimadas de resíduos e poeira em obras (umidificação, cobertura de material).',
      'Em episódios severos, identifique locais de abrigo com melhor filtragem de ar na comunidade e planeie deslocamentos essenciais.',
    ],
    impact:
      'Impacto direto: coordenação reduz exposições evitáveis e emissões simultâneas; ações coletivas (menos queima, melhor gestão de poeira) têm efeito mensurável na qualidade do ar do bairro ao longo do tempo.',
  });

  if (lifestyle.hasChildren || lifestyle.hasElderly || lifestyle.hasRespiratory) {
    recs.push({
      category: 'saude',
      title: 'Cuidados para pessoas sensíveis',
      actions: [
        'Tenha plano de medicação/inaladores conforme orientação médica e evite atrasar cuidados em caso de piora de sintomas.',
        'Prefira máscaras bem ajustadas (ex.: PFF2/N95) em exposição inevitável durante picos de fumaça/poluição.',
        'Reduza esforço físico de crianças e idosos em dias ruins/muito ruins e mantenha hidratação e ambientes limpos.',
        'Procure atendimento se houver falta de ar, dor no peito, tontura ou piora importante de sintomas respiratórios.',
      ],
      impact:
        'Impacto direto: reduzir a dose de exposição e usar proteção adequada diminui risco de crises respiratórias e cardiovasculares em grupos vulneráveis; resposta rápida a sintomas evita agravamentos.',
    });
  }

  return recs;
}

export function impactSummary(air: AirQuality | null, lifestyle: Lifestyle): string[] {
  const lines: string[] = [];
  const pm25 = air?.pm25;
  if (pm25 != null) {
    lines.push(`PM2.5 atual estimado: ${pm25.toFixed(1)} µg/m³. Partículas finas penetram profundamente nos pulmões; reduzir exposição em picos traz benefício imediato.`);
  }
  if (air?.usAqi != null) {
    const c = aqiCategory(air.usAqi);
    lines.push(`Índice AQI (EUA): ${Math.round(air.usAqi)} — ${c.label}. ${c.advice}`);
  }
  if (/carro|moto/i.test(lifestyle.transport)) {
    lines.push('Transporte motorizado: consolidar viagens e evitar marcha lenta pode reduzir emissões locais por trajeto e melhorar o ar na sua rua/quarteirão.');
  }
  if (/lenha|carv|lareira/i.test(`${lifestyle.heating} ${lifestyle.cooking}`)) {
    lines.push('Queima residencial: é fonte relevante de partículas no inverno; otimizar ou reduzir uso tem impacto direto na fumaça intra e extradomiciliar.');
  }
  if (lines.length === 0) lines.push('Informe sua localização e perfil para estimar impactos diretos das suas escolhas.');
  return lines;
}