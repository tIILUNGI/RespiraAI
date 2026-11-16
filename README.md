# RespiraAI — Clean Air GenAI Copilot

**Live demo:** https://respira-ai-pi.vercel.app/  
**Repository:** https://github.com/tIILUNGI/RespiraAI

RespiraAI is a bilingual (English primary, Portuguese secondary) GenAI-powered web app that helps families and communities navigate **intense winter smoke** and **urban air pollution**.

## What it does
- **Landing page** presenting the system and how it works (EN/PT).
- **Location-aware, near real-time air quality:** city search/geolocation + [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) (US AQI, PM2.5, PM10, etc.).
- **Personalized by household & lifestyle:** household composition, sensitivities, heating, cooking, transport, and outdoor routine.
- **Low-emission daily routines** adapted to current conditions and profile.
- **Indoor air quality guidance** for smoke/pollution episodes (sealing, ventilation timing, filtration, source control).
- **Sustainable alternatives** tailored to context.
- **Direct impact explained:** every recommendation clarifies effects on exposure/health, emissions, cost, and community.
- **GenAI assistant (chat):**
  - Configurable **OpenAI-compatible provider** (Base URL, model, API key stored locally in browser) via `src/lib/ai.ts`.
  - **Local expert fallback mode** (no external API) that generates personalized, context-grounded guidance when no provider is configured or the connection fails.

## Run locally
```bash
npm install
npm run dev
```

Production build:
```bash
npm run build
npm run preview
```

## GenAI configuration
In **AI Settings / Config. IA** provide:
- **Base URL** (e.g. `https://api.openai.com/v1` or a compatible endpoint)
- **Model** (e.g. `gpt-4o-mini`)
- **API key**

> Note: direct browser calls to some providers may be blocked by CORS. For production use, a secure proxy/backend is recommended. The app includes a friendly local fallback mode for continuous operation.

## Disclaimer
Educational guidance only; not a substitute for medical advice, official alerts, or clinical plans. Seek urgent care for severe symptoms (shortness of breath, chest pain, rapid worsening).