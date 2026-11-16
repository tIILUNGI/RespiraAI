import { describe, expect, it } from 'vitest';
import { buildContext, defaultAiSettings, generateAssistantReply } from './ai';
import type { AiSettings, AirQuality, ChatMessage, Lifestyle, LocationInfo } from '../types';

const lifestyle: Lifestyle = {
  household: '3-4 people',
  hasChildren: true,
  hasElderly: false,
  hasRespiratory: false,
  heating: 'electric / heat pump',
  cooking: 'gas',
  transport: 'car/motorbike',
  outdoorRoutine: 'moderate (walks/errands)',
  pets: false,
  notes: 'mild allergy',
};

const location: LocationInfo = { name: 'Test City', latitude: -23.5, longitude: -46.6 };
const air: AirQuality = { usAqi: 85, pm25: 18.2, pm10: 30, source: 'Open-Meteo', time: '2026-01-01T10:00' };

describe('defaultAiSettings', () => {
  it('returns sensible defaults', () => {
    const s = defaultAiSettings();
    expect(s.provider).toBe('openai-compatible');
    expect(s.baseUrl).toContain('openai');
    expect(s.model.length).toBeGreaterThan(0);
    expect(s.apiKey).toBe('');
  });
});

describe('buildContext', () => {
  it('includes location, air, profile and impacts (EN)', () => {
    const ctx = buildContext(location, air, lifestyle, 'en');
    expect(ctx).toContain('Test City');
    expect(ctx).toMatch(/Air quality|AQI/);
    expect(ctx).toContain('PM2.5');
    expect(ctx).toContain('Profile');
    expect(ctx).toContain('Impact');
  });

  it('handles missing location and air', () => {
    const ctx = buildContext(null, null, lifestyle, 'en');
    expect(ctx).toMatch(/not provided|n\/a/i);
    expect(ctx.length).toBeGreaterThan(20);
  });

  it('builds Portuguese context when lang is pt', () => {
    const ctx = buildContext(location, air, lifestyle, 'pt');
    expect(ctx).toContain('Test City');
    expect(ctx).toContain('PM2.5');
    expect(ctx.length).toBeGreaterThan(20);
  });
});

describe('generateAssistantReply (local expert mode)', () => {
  const localSettings: AiSettings = { provider: 'local', baseUrl: '', apiKey: '', model: '' };
  const messages: ChatMessage[] = [{ id: '1', role: 'user', content: 'Give me a plan for today' }];

  it('returns personalized English guidance without external API', async () => {
    const reply = await generateAssistantReply({ messages, settings: localSettings, location, air, lifestyle, lang: 'en' });
    expect(reply).toContain('Current situation');
    expect(reply).toMatch(/Personalized guidance|Impact of your choices/);
    expect(reply).toContain('Direct impact');
  });

  it('returns Portuguese guidance when lang is pt', async () => {
    const reply = await generateAssistantReply({ messages, settings: localSettings, location, air, lifestyle, lang: 'pt' });
    expect(reply.length).toBeGreaterThan(50);
    expect(reply).toMatch(/Situa|Impacto/);
  });

  it('falls back to local mode when provider is configured but no API key', async () => {
    const settings: AiSettings = { provider: 'openai-compatible', baseUrl: 'https://api.openai.com/v1', apiKey: '', model: 'gpt-4o-mini' };
    const reply = await generateAssistantReply({ messages, settings, location, air, lifestyle, lang: 'en' });
    expect(reply).toContain('Current situation');
  });
});
