# RespiraAI — Assistente GenAI para fumaça no inverno e poluição urbana

Aplicação web em React + TypeScript + Vite que ajuda famílias e comunidades a navegar por episódios de **fumaça intensa no inverno** e **poluição do ar urbana**.

## Funcionalidades

- **Assistente GenAI conversacional**: chat com contexto de localização, qualidade do ar e perfil do usuário.
  - Modo **provedor compatível com OpenAI** (configurável na UI: Base URL, modelo e chave de API armazenada localmente no navegador).
  - **Modo especialista local (fallback)**: gera respostas personalizadas com base em dados e regras quando não há API configurada/disponível.
- **Dados de qualidade do ar em tempo quase real**: busca por cidade (geocoding Open-Meteo) ou geolocalização do navegador e consulta à [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) (PM2.5, PM10, AQI EUA, etc.).
- **Perfil adaptado**: agregado familiar, crianças/idosos/condições sensíveis, aquecimento, cocção, transporte e rotina externa.
- **Rotinas diárias de baixa emissão**: sugestões ajustadas ao nível de poluição e ao estilo de vida.
- **Qualidade do ar interno**: vedação, ventilação estratégica, filtragem e redução de fontes internas para cenários de fumaça.
- **Alternativas sustentáveis**: aquecimento/cozinha eficientes, mobilidade e energia com menor emissão.
- **Impacto direto explicado**: cada recomendação inclui o efeito esperado na exposição à poluição, saúde, emissões e comunidade.

## Como executar

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
npm run preview
```

## Configuração GenAI

No painel "Configuração do motor GenAI" informe:
- **Base URL** (ex.: `https://api.openai.com/v1` ou endpoint compatível)
- **Modelo** (ex.: `gpt-4o-mini`)
- **Chave de API**

> Observação: chamadas diretas do navegador a alguns provedores podem ser bloqueadas por CORS. Para produção, recomenda-se usar um proxy/backend que injete a chave com segurança.

## Aviso

Informações educativas; não substituem orientação médica, alertas oficiais ou planos clínicos individuais. Em sintomas graves (falta de ar, dor no peito, piora rápida), procure atendimento de urgência.