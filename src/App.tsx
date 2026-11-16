import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { aqiCategory, fetchAirQuality, geocodeLocation } from './lib/air';
import { buildContext, defaultAiSettings, generateAssistantReply } from './lib/ai';
import { buildRecommendations, impactSummary } from './lib/recommendations';
import type { AiSettings, AirQuality, ChatMessage, Lifestyle, LocationInfo } from './types';

const defaultLifestyle: Lifestyle = {
  household: '3-4 pessoas',
  hasChildren: false,
  hasElderly: false,
  hasRespiratory: false,
  heating: 'elétrico / ar-condicionado',
  cooking: 'gás',
  transport: 'misto (carro e transporte público)',
  outdoorRoutine: 'moderada (caminhadas/recados)',
  pets: false,
  notes: '',
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationInfo[]>([]);
  const [location, setLocation] = useState<LocationInfo | null>(() => loadJson('respira.location', null));
  const [air, setAir] = useState<AirQuality | null>(null);
  const [airLoading, setAirLoading] = useState(false);
  const [airError, setAirError] = useState('');
  const [lifestyle, setLifestyle] = useState<Lifestyle>(() => loadJson('respira.lifestyle', defaultLifestyle));
  const [aiSettings, setAiSettings] = useState<AiSettings>(() => loadJson('respira.ai', defaultAiSettings()));
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: uid(),
      role: 'assistant',
      content:
        'Olá! Sou o **RespiraAI**, seu assistente para enfrentar fumaça no inverno e poluição urbana. Informe sua localização e perfil, e eu monto rotinas de baixa emissão, dicas para o ar interno e alternativas sustentáveis explicando o impacto direto de cada escolha. Como posso ajudar hoje?',
      meta: 'Assistente',
    },
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => { localStorage.setItem('respira.lifestyle', JSON.stringify(lifestyle)); }, [lifestyle]);
  useEffect(() => { localStorage.setItem('respira.ai', JSON.stringify(aiSettings)); }, [aiSettings]);
  useEffect(() => { localStorage.setItem('respira.location', JSON.stringify(location)); }, [location]);

  useEffect(() => {
    if (location) void loadAir(location);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.latitude, location?.longitude]);

  async function loadAir(loc: LocationInfo) {
    setAirLoading(true); setAirError('');
    try {
      const data = await fetchAirQuality(loc.latitude, loc.longitude);
      setAir(data);
    } catch (e: any) {
      setAirError(e?.message || 'Erro ao carregar dados de ar.');
    } finally {
      setAirLoading(false);
    }
  }

  async function search() {
    if (!query.trim()) return;
    try {
      const r = await geocodeLocation(query.trim());
      setResults(r);
    } catch (e: any) {
      setAirError(e?.message || 'Erro na busca.');
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) { setAirError('Geolocalização não suportada neste navegador.'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          name: 'Minha localização',
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setResults([]);
      },
      () => setAirError('Não foi possível obter sua localização. Busque manualmente pela cidade.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const cat = useMemo(() => aqiCategory(air?.usAqi), [air?.usAqi]);
  const recs = useMemo(() => buildRecommendations(air, lifestyle), [air, lifestyle]);
  const impacts = useMemo(() => impactSummary(air, lifestyle), [air, lifestyle]);

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || chatLoading) return;
    const userMsg: ChatMessage = { id: uid(), role: 'user', content };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setChatLoading(true);
    try {
      const reply = await generateAssistantReply({ messages: next, settings: aiSettings, location, air, lifestyle });
      setMessages((m) => [...m, { id: uid(), role: 'assistant', content: reply, meta: aiSettings.apiKey ? `${aiSettings.model}` : 'Modo especialista local' }]);
    } finally {
      setChatLoading(false);
    }
  }

  function quickPrompt(p: string) { void sendMessage(p); }

  const planPrompt = `Monte um plano prático para hoje para minha família considerando a qualidade do ar atual, com rotinas de baixa emissão, cuidados com ar interno e alternativas sustentáveis, explicando o impacto direto de cada escolha.`;

  return (
    <div className="app">
      <header className="hero-header">
        <div className="hero-copy">
          <h1>RespiraAI</h1>
          <p>
            Assistente movido a GenAI para ajudar famílias e comunidades a navegar por <strong>fumaça intensa no inverno</strong> e <strong>poluição do ar urbana</strong>.
            Sugere rotinas diárias de baixa emissão, cuidados com a qualidade do ar interno e alternativas sustentáveis adaptadas à sua localização e estilo de vida — sempre explicando o impacto direto das suas escolhas.
          </p>
          <div className="badge-row">
            <span className="badge">GenAI conversacional</span>
            <span className="badge">Dados de ar em tempo quase real</span>
            <span className="badge">Planos personalizados</span>
            <span className="badge">Foco em saúde e comunidade</span>
          </div>
        </div>
        <div className="hero-status">
          <div className="muted">Qualidade do ar {location ? `— ${location.name}` : ''}</div>
          <div className="aqi-big" style={{ color: cat.color }}>{air?.usAqi != null ? Math.round(air.usAqi) : '—'}</div>
          <div className="aqi-label" style={{ color: cat.color }}>{cat.label}</div>
          <div className="muted" style={{ marginTop: 6 }}>{cat.advice}</div>
          <div className="kpi-grid">
            <div className="kpi"><div className="v">{air?.pm25 != null ? air.pm25.toFixed(1) : '—'}</div><div className="l">PM2.5 (µg/m³)</div></div>
            <div className="kpi"><div className="v">{air?.pm10 != null ? air.pm10.toFixed(1) : '—'}</div><div className="l">PM10 (µg/m³)</div></div>
            <div className="kpi"><div className="v">{air?.time ? air.time.replace('T', ' ').slice(11, 16) : '—'}</div><div className="l">Atualização</div></div>
          </div>
          <div className="small" style={{ marginTop: 10 }}>Fonte: {air?.source || 'Open-Meteo Air Quality API (ao informar localização)'}</div>
        </div>
      </header>

      {airError && <div className="alert" style={{ marginBottom: 16 }}>{airError}</div>}

      <div className="grid">
        <div className="stack">
          <section className="card">
            <h2>Localização e contexto</h2>
            <p className="lead">Informe sua cidade ou use a geolocalização para adaptar alertas e recomendações.</p>
            <div className="row" style={{ marginBottom: 10 }}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex.: São Paulo, Porto Alegre, Santiago, Ciudad de México..."
                onKeyDown={(e) => e.key === 'Enter' && void search()}
                style={{ flex: 1, padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(4,14,24,0.6)', color: 'var(--text)' }}
              />
              <button className="btn" onClick={() => void search()}>Buscar</button>
              <button className="btn secondary" onClick={useMyLocation}>Usar minha localização</button>
            </div>
            {results.length > 0 && (
              <div className="chips" style={{ marginBottom: 10 }}>
                {results.map((r, i) => (
                  <button key={i} className="chip" onClick={() => { setLocation(r); setResults([]); }}>
                    {r.name}
                  </button>
                ))}
              </div>
            )}
            <div className="row">
              <button className="btn ghost" onClick={() => location && void loadAir(location)} disabled={!location || airLoading}>
                {airLoading ? 'Atualizando...' : 'Atualizar qualidade do ar'}
              </button>
              {location && <span className="small">Selecionado: {location.name} ({location.latitude.toFixed(2)}, {location.longitude.toFixed(2)})</span>}
            </div>
          </section>

          <section className="card">
            <h2>Perfil da família e estilo de vida</h2>
            <p className="lead">Personalize rotinas e alternativas conforme sua realidade.</p>
            <div className="form-grid">
              <div className="field">
                <label>Agregado familiar</label>
                <select value={lifestyle.household} onChange={(e) => setLifestyle({ ...lifestyle, household: e.target.value })}>
                  <option>1-2 pessoas</option><option>3-4 pessoas</option><option>5+ pessoas</option><option>Comunidade / coletivo</option>
                </select>
              </div>
              <div className="field">
                <label>Aquecimento no inverno</label>
                <select value={lifestyle.heating} onChange={(e) => setLifestyle({ ...lifestyle, heating: e.target.value })}>
                  <option>elétrico / ar-condicionado</option><option>gás</option><option>lenha / lareira</option><option>carvão</option><option>aquecedor a combustível</option><option>não sei / misto</option>
                </select>
              </div>
              <div className="field">
                <label>Cocção principal</label>
                <select value={lifestyle.cooking} onChange={(e) => setLifestyle({ ...lifestyle, cooking: e.target.value })}>
                  <option>gás</option><option>elétrico / indução</option><option>lenha / carvão</option><option>misto</option>
                </select>
              </div>
              <div className="field">
                <label>Transporte mais usado</label>
                <select value={lifestyle.transport} onChange={(e) => setLifestyle({ ...lifestyle, transport: e.target.value })}>
                  <option>misto (carro e transporte público)</option><option>carro/moto</option><option>transporte público</option><option>a pé / bicicleta</option><option>trabalho remoto / pouco deslocamento</option>
                </select>
              </div>
              <div className="field">
                <label>Rotina ao ar livre</label>
                <select value={lifestyle.outdoorRoutine} onChange={(e) => setLifestyle({ ...lifestyle, outdoorRoutine: e.target.value })}>
                  <option>baixa</option><option>moderada (caminhadas/recados)</option><option>alta (trabalho externo/esporte)</option>
                </select>
              </div>
              <div className="field">
                <label>Notas (alergias, horários, limitações)</label>
                <input value={lifestyle.notes} onChange={(e) => setLifestyle({ ...lifestyle, notes: e.target.value })} placeholder="Ex.: asma leve, trabalha à noite..." />
              </div>
            </div>
            <div className="chips" style={{ marginTop: 12 }}>
              <button className={`chip ${lifestyle.hasChildren ? 'active' : ''}`} onClick={() => setLifestyle({ ...lifestyle, hasChildren: !lifestyle.hasChildren })}>Crianças em casa</button>
              <button className={`chip ${lifestyle.hasElderly ? 'active' : ''}`} onClick={() => setLifestyle({ ...lifestyle, hasElderly: !lifestyle.hasElderly })}>Idosos</button>
              <button className={`chip ${lifestyle.hasRespiratory ? 'active' : ''}`} onClick={() => setLifestyle({ ...lifestyle, hasRespiratory: !lifestyle.hasRespiratory })}>Condição respiratória/cardíaca</button>
              <button className={`chip ${lifestyle.pets ? 'active' : ''}`} onClick={() => setLifestyle({ ...lifestyle, pets: !lifestyle.pets })}>Animais de estimação</button>
            </div>
          </section>

          <section className="card">
            <h2>Recomendações adaptadas e impacto direto</h2>
            <p className="lead">Geradas a partir da qualidade do ar e do seu perfil, com explicação do efeito de cada escolha.</p>
            {recs.map((r, idx) => (
              <div key={idx} style={{ marginBottom: 14 }}>
                <h3>{r.title}</h3>
                <ul className="list">
                  {r.actions.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
                <div className="impact"><strong>Impacto direto:</strong> {r.impact}</div>
              </div>
            ))}
            <hr className="sep" />
            <h3>Resumo de impacto das suas escolhas</h3>
            <ul className="list">
              {impacts.map((im, i) => <li key={i}>{im}</li>)}
            </ul>
          </section>
        </div>

        <div className="stack">
          <section className="card chat">
            <h2>Assistente GenAI (conversa)</h2>
            <p className="lead">Pergunte sobre planos do dia, proteção em episódios de fumaça, rotinas de baixa emissão e ações comunitárias.</p>
            <div className="chat-log">
              {messages.map((m) => (
                <div key={m.id} className={`msg ${m.role}`}>
                  <div className="meta">{m.role === 'user' ? 'Você' : m.meta || 'RespiraAI'}</div>
                  <div>{m.content}</div>
                </div>
              ))}
              {chatLoading && <div className="msg assistant"><div className="meta">RespiraAI</div>Gerando resposta personalizada...</div>}
            </div>
            <div className="chips" style={{ marginTop: 10 }}>
              <button className="chip" onClick={() => quickPrompt(planPrompt)}>Plano para hoje</button>
              <button className="chip" onClick={() => quickPrompt('Como proteger o ar dentro de casa durante fumaça intensa no inverno? Explique o impacto de cada medida.')}>Ar interno no inverno</button>
              <button className="chip" onClick={() => quickPrompt('Quais rotinas de baixa emissão posso adotar esta semana considerando meu perfil? Explique o impacto direto.')}>Rotinas de baixa emissão</button>
              <button className="chip" onClick={() => quickPrompt('Sugira ações comunitárias para reduzir a poluição e proteger pessoas vulneráveis.')}>Ações comunitárias</button>
            </div>
            <div className="chat-input">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Descreva sua situação ou faça uma pergunta..."
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }}
              />
              <button className="btn" onClick={() => void sendMessage()} disabled={chatLoading || !input.trim()}>Enviar</button>
            </div>
          </section>

          <section className="card">
            <h2>Configuração do motor GenAI</h2>
            <p className="lead">Conecte um provedor compatível com OpenAI para respostas 100% geradas por LLM. Sem chave, o app usa um modo especialista local baseado no contexto e nos seus dados.</p>
            <div className="form-grid">
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>Modo</label>
                <select value={aiSettings.provider} onChange={(e) => setAiSettings({ ...aiSettings, provider: e.target.value as AiSettings['provider'] })}>
                  <option value="openai-compatible">Provedor GenAI (API compatível com OpenAI)</option>
                  <option value="local">Modo especialista local (sem API externa)</option>
                </select>
              </div>
              <div className="field">
                <label>Base URL</label>
                <input value={aiSettings.baseUrl} onChange={(e) => setAiSettings({ ...aiSettings, baseUrl: e.target.value })} placeholder="https://api.openai.com/v1" />
              </div>
              <div className="field">
                <label>Modelo</label>
                <input value={aiSettings.model} onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })} placeholder="gpt-4o-mini" />
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>Chave de API (armazenada localmente no navegador)</label>
                <input type="password" value={aiSettings.apiKey} onChange={(e) => setAiSettings({ ...aiSettings, apiKey: e.target.value })} placeholder="sk-..." />
              </div>
            </div>
            <div className="small" style={{ marginTop: 10 }}>
              Dica: para usar modelos locais/remotos, aponte para um endpoint compatível (ex.: proxy próprio, OpenRouter, Azure OpenAI compatível, Ollama com gateway compatível). A chave nunca é enviada a este app além da chamada direta ao endpoint configurado.
            </div>
            <hr className="sep" />
            <details>
              <summary>Ver contexto enviado ao assistente</summary>
              <pre className="small" style={{ whiteSpace: 'pre-wrap', marginTop: 10 }}>{buildContext(location, air, lifestyle)}</pre>
            </details>
          </section>

          <section className="card">
            <h2>Como este assistente ajuda</h2>
            <ul className="list">
              <li><strong>Fumaça no inverno e poluição urbana:</strong> interpreta AQI/PM2.5 e adapta orientações ao nível de risco.</li>
              <li><strong>Baixa emissão:</strong> propõe rotinas de transporte, energia e aquecimento/cozinha com menor impacto.</li>
              <li><strong>Ar interno:</strong> recomenda vedação, ventilação estratégica, filtragem e redução de fontes internas.</li>
              <li><strong>Impacto direto:</strong> cada recomendação explica efeito na exposição, saúde, emissões e comunidade.</li>
            </ul>
            <div className="alert" style={{ marginTop: 12 }}>
              Aviso: informações educativas, não substituem orientação médica, alertas oficiais da defesa civil/agências ambientais ou planos clínicos individuais.
            </div>
          </section>
        </div>
      </div>

      <div className="footer-note">RespiraAI — protótipo GenAI para resiliência familiar e comunitária frente à poluição do ar. Dados de qualidade do ar fornecidos por Open-Meteo quando disponíveis.</div>
    </div>
  );
}