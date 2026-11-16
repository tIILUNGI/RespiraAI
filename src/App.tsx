import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { aqiCategory, fetchAirQuality, geocodeLocation } from './lib/air';
import { buildContext, defaultAiSettings, generateAssistantReply } from './lib/ai';
import { t, type Lang } from './lib/i18n';
import { buildRecommendations, impactSummary } from './lib/recommendations';
import type { AiSettings, AirQuality, ChatMessage, Lifestyle, LocationInfo } from './types';

const defaultLifestyle: Lifestyle = {
  household: '3-4 people',
  hasChildren: false,
  hasElderly: false,
  hasRespiratory: false,
  heating: 'electric / heat pump',
  cooking: 'gas',
  transport: 'mixed (car & public transit)',
  outdoorRoutine: 'moderate (walks/errands)',
  pets: false,
  notes: '',
};

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
function loadJson<T>(key: string, fallback: T): T { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) as T : fallback; } catch { return fallback; } }

function renderInline(text: string) {
  const parts: any[] = [];
  const re = /(\*\*[^*]+\*\*|_[^_]+_)/g;
  let last = 0; let m: RegExpExecArray | null; let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith('**')) parts.push(<strong key={k++}>{token.slice(2, -2)}</strong>);
    else parts.push(<em key={k++}>{token.slice(1, -1)}</em>);
    last = m.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : text;
}

function renderRich(content: string) {
  const blocks = content.replace(/\r\n/g, '\n').split(/\n\n+/);
  return blocks.map((block, bi) => {
    const lines = block.split('\n').filter(l => l.trim() !== '');
    const isList = lines.length > 0 && lines.every(l => /^\s*[-*]\s+/.test(l));
    if (isList) {
      return <ul key={bi}>{lines.map((l, li) => <li key={li}>{renderInline(l.replace(/^\s*[-*]\s+/, ''))}</li>)}</ul>;
    }
    // handle mixed paragraphs with single-line breaks
    return <p key={bi}>{lines.map((l, li) => <span key={li}>{li > 0 && <br />}{renderInline(l)}</span>)}</p>;
  });
}

export default function App() {
  const [lang, setLang] = useState<Lang>(() => loadJson('respira.lang', 'en'));
  const [entered, setEntered] = useState<boolean>(() => loadJson('respira.entered', false));
  const [tab, setTab] = useState<'recs' | 'impact' | 'settings'>('recs');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationInfo[]>([]);
  const [location, setLocation] = useState<LocationInfo | null>(() => loadJson('respira.location', null));
  const [air, setAir] = useState<AirQuality | null>(null);
  const [airLoading, setAirLoading] = useState(false);
  const [airError, setAirError] = useState('');
  const [lifestyle, setLifestyle] = useState<Lifestyle>(() => loadJson('respira.lifestyle', defaultLifestyle));
  const [aiSettings, setAiSettings] = useState<AiSettings>(() => loadJson('respira.ai', defaultAiSettings()));
  const [messages, setMessages] = useState<ChatMessage[]>(() => [{ id: uid(), role: 'assistant', content: t(loadJson('respira.lang', 'en'), 'welcome'), meta: 'RespiraAI' }]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => { localStorage.setItem('respira.lang', JSON.stringify(lang)); document.documentElement.lang = lang; }, [lang]);
  useEffect(() => { localStorage.setItem('respira.entered', JSON.stringify(entered)); }, [entered]);
  useEffect(() => { localStorage.setItem('respira.lifestyle', JSON.stringify(lifestyle)); }, [lifestyle]);
  useEffect(() => { localStorage.setItem('respira.ai', JSON.stringify(aiSettings)); }, [aiSettings]);
  useEffect(() => { localStorage.setItem('respira.location', JSON.stringify(location)); }, [location]);

  // refresh welcome when language changes and conversation is fresh
  useEffect(() => {
    setMessages((m) => {
      if (m.length === 1 && m[0].role === 'assistant') return [{ ...m[0], content: t(lang, 'welcome') }];
      return m;
    });
  }, [lang]);

  useEffect(() => { if (location) void loadAir(location, lang); /* eslint-disable-next-line */ }, [location?.latitude, location?.longitude]);

  async function loadAir(loc: LocationInfo, l: Lang = lang) {
    setAirLoading(true); setAirError('');
    try { setAir(await fetchAirQuality(loc.latitude, loc.longitude, l)); }
    catch (e: any) { setAirError(e?.message || (l === 'pt' ? 'Erro ao carregar dados de ar.' : 'Failed to load air data.')); }
    finally { setAirLoading(false); }
  }
  async function search() {
    if (!query.trim()) return;
    try { setResults(await geocodeLocation(query.trim(), lang)); }
    catch (e: any) { setAirError(e?.message || 'Error'); }
  }
  function useMyLocation() {
    if (!navigator.geolocation) { setAirError(lang === 'pt' ? 'Geolocalização não suportada.' : 'Geolocation not supported.'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ name: lang === 'pt' ? 'Minha localização' : 'My location', latitude: pos.coords.latitude, longitude: pos.coords.longitude }); setResults([]); },
      () => setAirError(lang === 'pt' ? 'Não foi possível obter sua localização.' : 'Could not get your location.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const cat = useMemo(() => aqiCategory(air?.usAqi, lang), [air?.usAqi, lang]);
  const recs = useMemo(() => buildRecommendations(air, lifestyle, lang), [air, lifestyle, lang]);
  const impacts = useMemo(() => impactSummary(air, lifestyle, lang), [air, lifestyle, lang]);

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || chatLoading) return;
    const userMsg: ChatMessage = { id: uid(), role: 'user', content };
    const next = [...messages, userMsg];
    setMessages(next); setInput(''); setChatLoading(true);
    try {
      const reply = await generateAssistantReply({ messages: next, settings: aiSettings, location, air, lifestyle, lang });
      setMessages((m) => [...m, { id: uid(), role: 'assistant', content: reply, meta: aiSettings.apiKey ? aiSettings.model : (lang === 'pt' ? 'Modo especialista local' : 'Local expert mode') }]);
    } finally { setChatLoading(false); }
  }

  const L = (k: Parameters<typeof t>[1]) => t(lang, k);

  if (!entered) {
    const features = [
      { title: L('feat1Title'), desc: L('feat1Desc'), icon: '◉' },
      { title: L('feat2Title'), desc: L('feat2Desc'), icon: '↻' },
      { title: L('feat3Title'), desc: L('feat3Desc'), icon: '⌂' },
      { title: L('feat4Title'), desc: L('feat4Desc'), icon: '✦' },
    ];
    const steps = [L('step1'), L('step2'), L('step3')];
    return (
      <div className="landing">
        <a href="#landing-main" className="skip-link">Skip to content</a>
        <div className="landing-bg" aria-hidden="true" />
        <header className="landing-nav">
          <div className="brand">
            <div className="logo" />
            <div className="brand-text"><h1>{L('appName')}</h1><p>{L('tagline')}</p></div>
          </div>
          <div className="pill-row">
            <div className="lang-toggle" aria-label={L('lang')}>
              <button className={lang==='en'?'active':''} onClick={()=>setLang('en')}>EN</button>
              <button className={lang==='pt'?'active':''} onClick={()=>setLang('pt')}>PT</button>
            </div>
          </div>
        </header>
        <main id="landing-main" className="landing-main">
          <section className="landing-hero">
            <div className="landing-badge">{L('landingBadge')}</div>
            <h1 className="landing-title">{L('landingTitle')}</h1>
            <p className="landing-subtitle">{L('landingSubtitle')}</p>
            <div className="landing-actions">
              <button className="btn btn-lg" onClick={() => setEntered(true)}>{L('landingCta')}</button>
              <a className="btn secondary btn-lg" href="#how">{L('landingSecondary')}</a>
            </div>
          </section>
          <section className="landing-features">
            {features.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon" aria-hidden="true">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </section>
          <section id="how" className="landing-how">
            <h2>{L('landingHow')}</h2>
            <div className="steps">
              {steps.map((s, i) => (
                <div key={i} className="step-card">
                  <div className="step-num" aria-hidden="true">{i + 1}</div>
                  <p><span className="sr-only">{lang === 'pt' ? `Passo ${i + 1}: ` : `Step ${i + 1}: `}</span>{s}</p>
                </div>
              ))}
            </div>
            <div className="landing-note">{L('landingNote')}</div>
            <div style={{ marginTop: 18 }}>
              <button className="btn btn-lg" onClick={() => setEntered(true)}>{L('landingCta')}</button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const quick = [
    { label: L('quickToday'), prompt: L('planIntro') },
    { label: L('quickIndoor'), prompt: L('indoorPrompt') },
    { label: L('quickLow'), prompt: L('lowPrompt') },
    { label: L('quickCommunity'), prompt: L('communityPrompt') },
  ];

  const householdOpts = lang === 'pt' ? ['1-2 pessoas', '3-4 pessoas', '5+ pessoas', 'Comunidade / coletivo'] : ['1-2 people', '3-4 people', '5+ people', 'Community / group'];
  const heatingOpts = lang === 'pt' ? ['elétrico / bomba de calor', 'gás', 'lenha / lareira', 'carvão', 'aquecedor a combustível', 'não sei / misto'] : ['electric / heat pump', 'gas', 'wood / fireplace', 'coal', 'fuel heater', 'unknown / mixed'];
  const cookingOpts = lang === 'pt' ? ['gás', 'elétrico / indução', 'lenha / carvão', 'misto'] : ['gas', 'electric / induction', 'wood / charcoal', 'mixed'];
  const transportOpts = lang === 'pt' ? ['misto (carro e transporte público)', 'carro/moto', 'transporte público', 'a pé / bicicleta', 'remoto / pouco deslocamento'] : ['mixed (car & public transit)', 'car/motorbike', 'public transit', 'walk / bike', 'remote / minimal travel'];
  const outdoorOpts = lang === 'pt' ? ['baixa', 'moderada (caminhadas/recados)', 'alta (trabalho externo/esporte)'] : ['low', 'moderate (walks/errands)', 'high (outdoor work/sport)'];

  return (
    <div className="shell">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <aside className="sidebar" aria-label={lang === 'pt' ? 'Contexto e configurações' : 'Context and settings'}>
        <div className="brand">
          <div className="logo" />
          <div className="brand-text">
            <h1>{L('appName')}</h1>
            <p>{L('tagline')}</p>
          </div>
        </div>

        <div className="side-card">
          <h3>{L('airQuality')}</h3>
          <div className="aqi-hero">
            <div className="aqi-ring" style={{ borderColor: cat.color + '55' }}>
              <div className="aqi-num" style={{ color: cat.color }}>{air?.usAqi != null ? Math.round(air.usAqi) : '—'}</div>
            </div>
            <div className="aqi-meta">
              <div className="label" style={{ color: cat.color }}>{cat.label}</div>
              <div className="advice">{cat.advice}</div>
            </div>
          </div>
          <div className="kpi-grid">
            <div className="kpi"><div className="v">{air?.pm25 != null ? air.pm25.toFixed(1) : '—'}</div><div className="l">PM2.5 µg/m³</div></div>
            <div className="kpi"><div className="v">{air?.pm10 != null ? air.pm10.toFixed(1) : '—'}</div><div className="l">PM10 µg/m³</div></div>
            <div className="kpi"><div className="v">{air?.time ? air.time.replace('T',' ').slice(11,16) : '—'}</div><div className="l">{L('updated')}</div></div>
          </div>
          <p className="small" style={{ margin: '8px 0 0' }}>{L('source')}: {air?.source || 'Open-Meteo'}</p>
        </div>

        <div className="side-card">
          <h3>{L('location')}</h3>
          <div className="row" style={{ marginBottom: 8 }}>
            <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={L('searchCity')} onKeyDown={(e) => e.key === 'Enter' && void search()} />
          </div>
          <div className="row" style={{ marginBottom: 8 }}>
            <button className="btn small" onClick={() => void search()}>{L('search')}</button>
            <button className="btn small secondary" onClick={useMyLocation}>{L('useMyLocation')}</button>
          </div>
          {results.length > 0 && (
            <div className="chips" style={{ marginBottom: 8 }}>
              {results.map((r, i) => <button key={i} className="chip" onClick={() => { setLocation(r); setResults([]); }}>{r.name}</button>)}
            </div>
          )}
          <div className="row">
            <button className="btn small secondary" onClick={() => location && void loadAir(location)} disabled={!location || airLoading}>{airLoading ? '...' : L('refresh')}</button>
          </div>
          {location && <p className="small" style={{ margin: '8px 0 0' }}>{L('selected')}: {location.name}</p>}
          {airError && <div className="alert" style={{ marginTop: 8 }}>{airError}</div>}
        </div>

        <div className="side-card">
          <h3>{L('profile')}</h3>
          <div className="field"><label>{L('household')}</label><select value={lifestyle.household} onChange={(e)=>setLifestyle({...lifestyle, household:e.target.value})}>{householdOpts.map(o=> <option key={o}>{o}</option>)}</select></div>
          <div className="field"><label>{L('heating')}</label><select value={lifestyle.heating} onChange={(e)=>setLifestyle({...lifestyle, heating:e.target.value})}>{heatingOpts.map(o=> <option key={o}>{o}</option>)}</select></div>
          <div className="field"><label>{L('cooking')}</label><select value={lifestyle.cooking} onChange={(e)=>setLifestyle({...lifestyle, cooking:e.target.value})}>{cookingOpts.map(o=> <option key={o}>{o}</option>)}</select></div>
          <div className="field"><label>{L('transport')}</label><select value={lifestyle.transport} onChange={(e)=>setLifestyle({...lifestyle, transport:e.target.value})}>{transportOpts.map(o=> <option key={o}>{o}</option>)}</select></div>
          <div className="field"><label>{L('outdoor')}</label><select value={lifestyle.outdoorRoutine} onChange={(e)=>setLifestyle({...lifestyle, outdoorRoutine:e.target.value})}>{outdoorOpts.map(o=> <option key={o}>{o}</option>)}</select></div>
          <div className="chips" style={{ margin: '4px 0 8px' }}>
            <button className={`chip ${lifestyle.hasChildren?'active':''}`} onClick={()=>setLifestyle({...lifestyle, hasChildren:!lifestyle.hasChildren})}>{L('children')}</button>
            <button className={`chip ${lifestyle.hasElderly?'active':''}`} onClick={()=>setLifestyle({...lifestyle, hasElderly:!lifestyle.hasElderly})}>{L('elderly')}</button>
            <button className={`chip ${lifestyle.hasRespiratory?'active':''}`} onClick={()=>setLifestyle({...lifestyle, hasRespiratory:!lifestyle.hasRespiratory})}>{L('respiratory')}</button>
            <button className={`chip ${lifestyle.pets?'active':''}`} onClick={()=>setLifestyle({...lifestyle, pets:!lifestyle.pets})}>{L('pets')}</button>
          </div>
          <div className="field" style={{ marginBottom: 0 }}><label>{L('notes')}</label><input value={lifestyle.notes} onChange={(e)=>setLifestyle({...lifestyle, notes:e.target.value})} placeholder={lang==='pt'?'Ex.: asma leve, trabalha à noite...':'e.g. mild asthma, night shifts...'} /></div>
        </div>
      </aside>

      <main id="main-content" className="main">
        <header className="topbar">
          <div className="topbar-left">
            <div className="status-dot" style={{ background: cat.color, boxShadow: `0 0 0 4px ${cat.color}22, 0 0 12px ${cat.color}66` }} />
            <div className="title">{L('appName')} <span>· {location ? location.name : L('tagline')}</span></div>
          </div>
          <div className="pill-row">
            <button className="btn small secondary" onClick={() => setEntered(false)}>{lang === 'pt' ? 'Início' : 'Home'}</button>
            <div className="lang-toggle" aria-label={L('lang')}>
              <button className={lang==='en'?'active':''} onClick={()=>setLang('en')}>EN</button>
              <button className={lang==='pt'?'active':''} onClick={()=>setLang('pt')}>PT</button>
            </div>
          </div>
        </header>

        <div className="content">
          <section className="panel chat-panel">
            <div className="panel-header">
              <div>
                <h2>{L('navChat')}</h2>
                <p>{L('heroDesc')}</p>
              </div>
            </div>
            <div className="chat-log" role="log" aria-live="polite" aria-relevant="additions" aria-label={lang === 'pt' ? 'Conversa com o assistente' : 'Assistant conversation'}>
              {messages.map((m) => (
                <div key={m.id} className={`msg ${m.role}`}>
                  <div className="avatar">{m.role === 'user' ? (lang==='pt' ? 'VC' : 'You') : 'AI'}</div>
                  <div className="bubble">
                    <div className="meta">{m.role === 'user' ? (lang==='pt'?'Você':'You') : (m.meta || 'RespiraAI')}</div>
                    <div className="rich">{renderRich(m.content)}</div>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="msg assistant"><div className="avatar">AI</div><div className="bubble"><div className="meta">RespiraAI</div><div className="rich">{L('generating')}</div></div></div>
              )}
            </div>
            <div className="composer">
              <div className="quick-row" role="group" aria-label={lang === 'pt' ? 'Ações rápidas' : 'Quick actions'}>
                {quick.map(q => <button key={q.label} type="button" className="quick-chip" onClick={() => void sendMessage(q.prompt)}>{q.label}</button>)}
              </div>
              <div className="composer-row">
                <label htmlFor="chat-input" className="sr-only">{L('chatPlaceholder')}</label>
                <textarea id="chat-input" value={input} onChange={(e)=>setInput(e.target.value)} placeholder={L('chatPlaceholder')} onKeyDown={(e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); void sendMessage(); } }} />
                <button type="button" className="btn" onClick={() => void sendMessage()} disabled={chatLoading || !input.trim()}>{L('send')}</button>
              </div>
            </div>
          </section>

          <section className="panel" style={{ minHeight: 0 }}>
            <div className="panel-header">
              <div><h2>{L('navDashboard')}</h2><p>{lang==='pt' ? 'Recomendações, impacto e configuração' : 'Recommendations, impact, and configuration'}</p></div>
            </div>
            <div className="tabs" role="tablist" aria-label={L('navDashboard')}>
              <button type="button" role="tab" id="tab-recs" aria-controls="panel-recs" aria-selected={tab==='recs'} className={`tab ${tab==='recs'?'active':''}`} onClick={()=>setTab('recs')}>{L('recommendations')}</button>
              <button type="button" role="tab" id="tab-impact" aria-controls="panel-impact" aria-selected={tab==='impact'} className={`tab ${tab==='impact'?'active':''}`} onClick={()=>setTab('impact')}>{L('impact')}</button>
              <button type="button" role="tab" id="tab-settings" aria-controls="panel-settings" aria-selected={tab==='settings'} className={`tab ${tab==='settings'?'active':''}`} onClick={()=>setTab('settings')}>{L('navSettings')}</button>
            </div>
            <div className="panel-body scroll-col" style={{ height: 'calc(100vh - 230px)' }}>
              {tab === 'recs' && (
                <div id="panel-recs" role="tabpanel" aria-labelledby="tab-recs">
                  {recs.map((r, idx) => (
                    <div key={idx} className="rec">
                      <h4>{r.title}</h4>
                      <ul>{r.actions.map((a,i)=><li key={i}>{a}</li>)}</ul>
                      <div className="impact-box"><strong>{L('directImpact')}:</strong> {r.impact}</div>
                    </div>
                  ))}
                </div>
              )}
              {tab === 'impact' && (
                <div id="panel-impact" role="tabpanel" aria-labelledby="tab-impact">
                  <h4 style={{ margin: '0 0 8px' }}>{L('impactSummary')}</h4>
                  <ul className="list">{impacts.map((im,i)=><li key={i}>{im}</li>)}</ul>
                  <div className="divider" />
                  <h4 style={{ margin: '0 0 8px' }}>{L('howHelps')}</h4>
                  <ul className="list">
                    <li>{lang==='pt' ? 'Fumaça no inverno e poluição urbana: interpreta AQI/PM2.5 e adapta orientações ao risco.' : 'Winter smoke & urban pollution: interprets AQI/PM2.5 and adapts guidance to risk.'}</li>
                    <li>{lang==='pt' ? 'Baixa emissão: rotinas de transporte, energia e aquecimento/cozinha com menor impacto.' : 'Low emissions: transport, energy, and heating/cooking routines with lower impact.'}</li>
                    <li>{lang==='pt' ? 'Ar interno: vedação, ventilação estratégica, filtragem e redução de fontes internas.' : 'Indoor air: sealing, strategic ventilation, filtration, and reducing indoor sources.'}</li>
                    <li>{lang==='pt' ? 'Impacto direto: cada recomendação explica efeito na exposição, saúde, emissões e comunidade.' : 'Direct impact: every recommendation explains effects on exposure, health, emissions, and community.'}</li>
                  </ul>
                  <div className="alert" style={{ marginTop: 12 }}>{L('disclaimer')}</div>
                </div>
              )}
              {tab === 'settings' && (
                <div id="panel-settings" role="tabpanel" aria-labelledby="tab-settings">
                  <p className="sub" style={{ marginTop: 0 }}>{L('aiConfigDesc')}</p>
                  <div className="field"><label htmlFor="ai-provider">{L('provider')}</label>
                    <select id="ai-provider" value={aiSettings.provider} onChange={(e)=>setAiSettings({...aiSettings, provider:e.target.value as AiSettings['provider']})}>
                      <option value="openai-compatible">{L('providerApi')}</option>
                      <option value="local">{L('providerLocal')}</option>
                    </select>
                  </div>
                  <div className="grid2">
                    <div className="field"><label htmlFor="ai-baseurl">{L('baseUrl')}</label><input id="ai-baseurl" value={aiSettings.baseUrl} onChange={(e)=>setAiSettings({...aiSettings, baseUrl:e.target.value})} placeholder="https://api.openai.com/v1" /></div>
                    <div className="field"><label htmlFor="ai-model">{L('model')}</label><input id="ai-model" value={aiSettings.model} onChange={(e)=>setAiSettings({...aiSettings, model:e.target.value})} placeholder="gpt-4o-mini" /></div>
                  </div>
                  <div className="field"><label htmlFor="ai-key">{L('apiKey')}</label><input id="ai-key" type="password" value={aiSettings.apiKey} onChange={(e)=>setAiSettings({...aiSettings, apiKey:e.target.value})} placeholder="sk-..." autoComplete="off" /></div>
                  <div className="divider" />
                  <h4 style={{ margin: '0 0 8px' }}>{L('context')}</h4>
                  <pre className="ctx" aria-label={L('context')}>{buildContext(location, air, lifestyle, lang)}</pre>
                  <div className="alert" style={{ marginTop: 12 }}>{L('disclaimer')}</div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}