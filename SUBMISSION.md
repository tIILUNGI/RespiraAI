# RespiraAI — Materiais para Submissão (IA)

## Links
- **Aplicação implantada (demo):** https://respira-ai-pi.vercel.app/
- **Repositório público GitHub:** https://github.com/tIILUNGI/RespiraAI
- **Repositório (git):** https://github.com/tIILUNGI/RespiraAI.git

## Como rodar localmente
```bash
npm install
npm run dev
# abrir a URL indicada pelo Vite (ex.: http://localhost:5173 ou porta configurada)
```
Build de produção:
```bash
npm run build
npm run preview
```

## Repositório Público do GitHub
- Repositório público e abaixo de 10 MB (`node_modules` e `dist` ignorados via `.gitignore`).
- Link para o formulário: **https://github.com/tIILUNGI/RespiraAI**

## Link Implantado no Projeto
- Deploy no Vercel (Vite/SPA, build `npm run build`, saída `dist`).
- Link para o formulário: **https://respira-ai-pi.vercel.app/**

## Descreva as mudanças/atualizações feitas na versão implantada
> Na versão implantada, disponibilizei o **RespiraAI** como aplicação web pública (build de produção Vite na Vercel) para acesso direto pelo navegador. A solução inclui uma **landing page bilíngue (EN/PT)** que apresenta o sistema e, no app, consulta de **localização e qualidade do ar em tempo quase real** (geocoding e Air Quality da Open-Meteo), **personalização por perfil/estilo de vida**, geração de **rotinas diárias de baixa emissão**, orientações para **qualidade do ar interno**, **alternativas sustentáveis** e explicação do **impacto direto** de cada escolha. O assistente conversacional opera em **modo GenAI configurável** (API compatível com OpenAI, com chave/modelo informados pelo usuário na interface) e possui **fallback especialista local** baseado no contexto e nos dados de poluição quando não há provedor externo configurado ou a conexão falha, com mensagens amigáveis e consistentes no idioma selecionado. Foram aplicados redesign de interface (layout tipo copiloto de IA, painel de contexto, chat e dashboard), suporte **inglês (principal) e português (secundário)**, responsividade, persistência local de preferências e mensagens de orientação/segurança para episódios de fumaça e poluição elevada.

## Mencione os serviços de IA Gen utilizados na submissão, e onde você os utilizou
> - **Modelos de linguagem generativos (LLM) via API compatível com OpenAI (configurável pelo usuário)** — ex.: GPT-4o/GPT-4o-mini ou outro modelo em endpoint compatível (`/chat/completions`): utilizados no **chat do assistente RespiraAI** (`src/lib/ai.ts`, função `generateAssistantReply`) para gerar respostas personalizadas em linguagem natural com base no contexto de localização, AQI/PM2.5, perfil familiar e recomendações; o prompt orienta a responder no idioma selecionado (EN/PT) e a explicar o **impacto direto** das escolhas (saúde, exposição, emissões, custo e comunidade).
> - **Modo especialista local (fallback, sem chamada a LLM externo)**: quando não há chave/provedor configurado ou a chamada falha, o app utiliza um motor contextual determinístico (`src/lib/ai.ts` e `src/lib/recommendations.ts`) que sintetiza orientações e impactos com base nos dados reais de qualidade do ar e no perfil, garantindo funcionamento contínuo.
> - **Dados ambientais (apoio ao contexto da IA)**: Open-Meteo Geocoding e Air Quality APIs (`src/lib/air.ts`) fornecem dados em tempo quase real usados para personalização das respostas e recomendações.
>
> *Observação:* cite com precisão o(s) modelo(s)/provedor(es) utilizados na sua demonstração/vídeo (ex.: “OpenAI GPT-4o-mini via API”). Se demonstrar sem chave externa, descreva o uso do modo especialista local com transparência.

## Vídeo de demonstração (não listado no YouTube ou Drive com acesso)
Roteiro sugerido (2–4 min):
1. Abrir https://respira-ai-pi.vercel.app/ e mostrar a landing page (EN/PT) e o objetivo (fumaça no inverno + poluição urbana).
2. Entrar no assistente, selecionar localização e atualizar AQI/PM2.5.
3. Preencher perfil (crianças/idosos/condição respiratória, aquecimento, transporte etc.).
4. Mostrar recomendações: rotinas de baixa emissão, ar interno e alternativas sustentáveis, destacando o **impacto direto** de cada escolha.
5. Usar o chat: pedir “plano para hoje” e uma pergunta específica, evidenciando respostas personalizadas e impactos (e, se aplicável, configuração do provedor GenAI ou fallback local).

## LinkedIn Post (incluir https://)
**Sugestão de texto:**
> Enfrentar a fumaça no inverno e a poluição urbana exige informação clara e ações práticas. Desenvolvi o **RespiraAI**, um assistente movido a GenAI que ajuda famílias e comunidades a: (1) acompanhar a qualidade do ar local, (2) adotar rotinas diárias de baixa emissão, (3) melhorar o ar interno em episódios de fumaça e (4) encontrar alternativas sustentáveis adaptadas ao estilo de vida — sempre explicando o impacto direto de cada escolha na saúde, na exposição e nas emissões.
>
> 🔗 Demo: https://respira-ai-pi.vercel.app/
> 💻 Código: https://github.com/tIILUNGI/RespiraAI
> #GenAI #AirQuality #Sustentabilidade #SaudePublica #ClimateResilience #IA

(Publique e cole a URL do post, ex.: `https://www.linkedin.com/posts/...`, no formulário.)

## Checklist rápido
- [x] Repositório GitHub público e < 10 MB
- [x] Link implantado funcional
- [ ] Vídeo não listado (YouTube) ou Drive com acesso liberado
- [ ] Campos de descrição/serviços GenAI preenchidos (ajustar modelo/provedor usado na demo)
- [ ] Post no LinkedIn com URL `https://...`