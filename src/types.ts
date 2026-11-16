export type Lifestyle = {
  household: string;
  hasChildren: boolean;
  hasElderly: boolean;
  hasRespiratory: boolean;
  heating: string;
  cooking: string;
  transport: string;
  outdoorRoutine: string;
  pets: boolean;
  notes: string;
};

export type LocationInfo = {
  name: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  country?: string;
  admin1?: string;
};

export type AirQuality = {
  pm25?: number;
  pm10?: number;
  usAqi?: number;
  europeanAqi?: number;
  uvIndex?: number;
  dust?: number;
  smokeIndicator?: number; // derived
  source: string;
  time?: string;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  meta?: string;
};

export type AiSettings = {
  provider: 'openai-compatible' | 'local';
  baseUrl: string;
  apiKey: string;
  model: string;
};

export type Recommendation = {
  title: string;
  actions: string[];
  impact: string;
  category: 'rotina' | 'casa' | 'sustentavel' | 'comunidade' | 'saude';
};