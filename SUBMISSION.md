# RespiraAI — Materiais para Submissão (IA / Hackathon)

## 1) Como rodar localmente (para demonstração)
```bash
cd respira-ai
npm install
npm run dev
# abrir http://localhost:5173
```
Build de produção:
```bash
npm run build
npm run preview
```

> O servidor de desenvolvimento foi iniciado durante a preparação e está acessível em **http://localhost:5173** (enquanto o processo `npm run dev` estiver ativo).

## 2) Repositório Público do GitHub (requisito: < 10 MB, acesso público)
1. Crie um repositório público no GitHub (ex.: `respira-ai`).
2. No diretório do projeto:
```bash
git remote add origin https://github.com/<seu-usuario>/respira-ai.git
git branch -M main
git push -u origin main
```
- `node_modules` e `dist` não são versionados (`.gitignore`), mantendo o repositório bem abaixo de 10 MB.
- Cole o link público (ex.: `https://github.com/<seu-usuario>/respira-ai`) no campo **Link do Repositório Público do GitHub**.

## 3) Link Implantado no Projeto (deploy)
Sugestão rápida (Vite/SPA, sem backend obrigatório):
- **Vercel**: importar o repositório, framework "Vite", comando de build `npm run build`, diretório de saída `dist`.
- **Netlify**: build `npm run build`, publish `dist` (redirect SPA: `/* /index.html 200`).
- **GitHub Pages**: usar `vite build` e publicar `dist` (ajustar `base` no `vite.config.ts` se necessário).

Cole a URL pública gerada no campo **Link Implantado no Projeto**.

## 4) Descreva as mudanças/atualizações feitas na versão implantada
**Sugestão de texto (ajuste conforme seu deploy):**
> Na versão implantada, disponibilizei o RespiraAI como aplicação web pública (build de produção Vite) para acesso direto pelo navegador, sem necessidade de instalação. A implantação inclui: consulta de localização e qualidade do ar em tempo quase real (geocoding e Air Quality da Open-Meteo), personalização por perfil/estilo de vida, geração de rotinas diárias de baixa emissão, orientações para qualidade do ar interno, alternativas sustentáveis e explicação do impacto direto de cada escolha. O assistente conversacional opera em modo GenAI configurável (API compatível com OpenAI, com chave/modelo informados pelo usuário na interface) e possui fallback especialista local baseado no contexto e nos dados de poluição quando não há provedor externo configurado. Foram aplicados ajustes de responsividade, persistência local de preferências e mensagens de orientação/segurança para episódios de fumaça e poluição elevada.

## 5) Serviços de IA Gen utilizados na submissão, e onde foram utilizados
**Sugestão de texto (honesta e alinhada à implementação):**
> - **Modelos de linguagem generativos (LLM) via API compatível com OpenAI (configurável pelo usuário)** — ex.: GPT-4o/GPT-4o-mini ou outro modelo em endpoint compatível (`/chat/completions`): utilizados no **chat do assistente RespiraAI** (`src/lib/ai.ts`, função `generateAssistantReply`) para gerar respostas personalizadas em linguagem natural, combinando o contexto de localização, AQI/PM2.5, perfil familiar e recomendações; o prompt de sistema orienta a explicar o impacto direto das escolhas (saúde, exposição, emissões e comunidade).
> - **Modo especialista local (fallback, sem chamada a LLM externo)**: quando não há chave/provedor configurado ou a chamada falha, o app utiliza um motor contextual determinístico (`src/lib/ai.ts`/`src/lib/recommendations.ts`) que sintetiza orientações personalizadas e impactos com base nos dados reais de qualidade do ar e no perfil — garantindo funcionamento contínuo.
> - **Dados ambientais (apoio à personalização)**: Open-Meteo Geocoding e Air Quality APIs (`src/lib/air.ts`) fornecem dados em tempo quase real usados como contexto para as respostas e recomendações.

> *Importante:* cite exatamente o(s) modelo(s)/provedor(es) que você configurar no deploy/demonstração (ex.: "OpenAI GPT-4o-mini via API" ou "Azure OpenAI", etc.). Se usar apenas o modo local no vídeo, descreva isso com transparência.

## 6) Vídeo de demonstração (não listado no YouTube ou link no Drive com acesso)
Roteiro sugerido (2–4 min):
1. Abrir a aplicação implantada/local e mostrar o objetivo (fumaça no inverno + poluição urbana).
2. Selecionar localização e atualizar AQI/PM2.5.
3. Preencher perfil (crianças/idosos/condição respiratória, aquecimento, transporte etc.).
4. Mostrar recomendações: rotinas de baixa emissão, ar interno e alternativas sustentáveis, destacando o **impacto direto** de cada escolha.
5. Usar o chat GenAI: pedir "plano para hoje" e uma pergunta específica (ex.: proteção em fumaça intensa), evidenciando respostas personalizadas e impactos.
6. (Opcional) Mostrar configuração do provedor GenAI / mencionar fallback local.

## 7) LinkedIn Post (incluir https://)
**Sugestão de texto:**
> Enfrentar a fumaça no inverno e a poluição urbana exige informação clara e ações práticas. Por isso desenvolvi o **RespiraAI**, um assistente movido a GenAI que ajuda famílias e comunidades a: (1) acompanhar a qualidade do ar local, (2) adotar rotinas diárias de baixa emissão, (3) melhorar o ar interno em episódios de fumaça e (4) encontrar alternativas sustentáveis adaptadas ao seu estilo de vida — sempre explicando o impacto direto de cada escolha na saúde, na exposição e nas emissões.
>
> 🔗 Demo: [COLE_O_LINK_IMPLANTADO]
> 💻 Código: [COLE_O_LINK_DO_GITHUB]
> #GenAI #AirQuality #Sustentabilidade #SaudePublica #ClimateResilience #IA

(Substitua os links, publique e cole a URL do post no formulário.)

## Checklist rápido de conformidade
- [ ] Repositório GitHub **público** e **< 10 MB**
- [ ] Link implantado funcional
- [ ] Vídeo **não listado** (YouTube) ou Drive com acesso liberado
- [ ] Campos de descrição/serviços GenAI preenchidos com clareza e honestidade
- [ ] Post no LinkedIn com URL `https://...`
