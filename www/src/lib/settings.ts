const KEYS = {
  apiKey: 'sk_juridico_api_key',
  baseUrl: 'sk_juridico_base_url',
  model: 'sk_juridico_model',
};

export interface AISettings {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export function getSettings(): AISettings {
  return {
    apiKey: localStorage.getItem(KEYS.apiKey) || '',
    baseUrl: localStorage.getItem(KEYS.baseUrl) || 'https://api.openai.com/v1',
    model: localStorage.getItem(KEYS.model) || 'gpt-4o',
  };
}

export function saveSettings(s: Partial<AISettings>) {
  if (s.apiKey !== undefined) localStorage.setItem(KEYS.apiKey, s.apiKey);
  if (s.baseUrl !== undefined) localStorage.setItem(KEYS.baseUrl, s.baseUrl);
  if (s.model !== undefined) localStorage.setItem(KEYS.model, s.model);
}

export function hasApiKey(): boolean {
  return !!localStorage.getItem(KEYS.apiKey);
}
