import { getSettings } from './settings';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function callAI(messages: ChatMessage[], extraSystem?: string): Promise<string> {
  const { apiKey, baseUrl, model } = getSettings();

  if (!apiKey) {
    throw new Error('Chave de API não configurada. Clique no ícone ⚙️ e adicione sua chave.');
  }

  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

  const allMessages: ChatMessage[] = extraSystem
    ? [{ role: 'system', content: extraSystem }, ...messages]
    : messages;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: allMessages,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText);
    throw new Error(`Erro da IA (${response.status}): ${err}`);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('A IA retornou uma resposta vazia.');
  return content;
}

export const JURIDICO_SYSTEM = `Você é um assistente jurídico especializado no direito brasileiro.
Seja preciso, objetivo e use linguagem técnica adequada.
Quando não tiver certeza, diga claramente que não tem a informação e recomende consultar um advogado.
Não invente dados, jurisprudências, leis ou números de processos.`;

export const CAMPO_LIVRE_SYSTEM = `Você é um assistente inteligente e prestativo.
Responda sempre em português brasileiro, de forma clara e direta.`;
