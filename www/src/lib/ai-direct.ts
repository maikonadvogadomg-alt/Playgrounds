import { localDb } from "./local-db";

const PROVIDERS: Record<string, { url: string; model: string }> = {
  "gsk_":    { url: "https://api.groq.com/openai/v1",                          model: "llama-3.3-70b-versatile" },
  "sk-or-":  { url: "https://openrouter.ai/api/v1",                            model: "openai/gpt-4o-mini" },
  "pplx-":   { url: "https://api.perplexity.ai",                               model: "sonar-pro" },
  "sk-ant-": { url: "https://api.anthropic.com/v1",                            model: "claude-3-5-sonnet-20241022" },
  "AIza":    { url: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-2.0-flash" },
  "xai-":    { url: "https://api.x.ai/v1",                                     model: "grok-2-latest" },
  "sk-":     { url: "https://api.openai.com/v1",                               model: "gpt-4o-mini" },
};

export function detectProvider(key: string): { url: string; model: string } | null {
  const k = key.trim();
  for (const [prefix, cfg] of Object.entries(PROVIDERS)) {
    if (k.startsWith(prefix)) return cfg;
  }
  return null;
}

export function getActiveKey(): { key: string; url: string; model: string } | null {
  const cfg = localDb.aiConfig.get();
  for (const field of ["groq_api_key", "openai_api_key", "custom4_api_key", "perplexity_api_key", "gemini_api_key"]) {
    const k = (cfg[field] || "").trim();
    if (!k) continue;
    if (field === "custom4_api_key") {
      return { key: k, url: (cfg.custom4_api_url || "https://api.groq.com/openai/v1").trim(), model: (cfg.custom4_api_model || "llama-3.3-70b-versatile").trim() };
    }
    const prov = detectProvider(k);
    if (prov) return { key: k, url: prov.url, model: prov.model };
  }
  return null;
}

export async function directChat(
  messages: Array<{ role: string; content: string }>,
  opts?: { key?: string; url?: string; model?: string; maxTokens?: number; temperature?: number }
): Promise<string> {
  let key = (opts?.key || "").trim();
  let url = (opts?.url || "").trim();
  let model = (opts?.model || "").trim();

  if (!key) {
    const active = getActiveKey();
    if (!active) throw new Error("Nenhuma chave de IA configurada. Vá em Configurações e cole sua chave Groq (gratuita).");
    key = active.key; url = active.url; model = active.model;
  } else if (!url) {
    const prov = detectProvider(key);
    url = prov?.url || "https://api.groq.com/openai/v1";
    model = model || prov?.model || "llama-3.3-70b-versatile";
  }

  const baseUrl = url.replace(/\/chat\/completions\/?$/, "").replace(/\/$/, "");
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, max_tokens: opts?.maxTokens || 4096, temperature: opts?.temperature ?? 0.7 }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    if (res.status === 401) throw new Error("Chave de API inválida ou expirada. Gere uma nova chave.");
    throw new Error(`Erro da IA (${res.status}): ${txt.slice(0, 150)}`);
  }
  const data = await res.json() as any;
  return data.choices?.[0]?.message?.content || "";
}

export async function directStream(
  messages: Array<{ role: string; content: string }>,
  onChunk: (text: string) => void,
  opts?: { key?: string; url?: string; model?: string; signal?: AbortSignal; systemPrompt?: string }
): Promise<void> {
  let key = (opts?.key || "").trim();
  let url = (opts?.url || "").trim();
  let model = (opts?.model || "").trim();

  if (!key) {
    const active = getActiveKey();
    if (!active) throw new Error("Nenhuma chave de IA configurada. Vá em Configurações e cole sua chave Groq (gratuita).");
    key = active.key; url = active.url; model = active.model;
  } else if (!url) {
    const prov = detectProvider(key);
    url = prov?.url || "https://api.groq.com/openai/v1";
    model = model || prov?.model || "llama-3.3-70b-versatile";
  }

  const baseUrl = url.replace(/\/chat\/completions\/?$/, "").replace(/\/$/, "");
  const isGroq = baseUrl.includes("groq.com");
  const maxTokens = isGroq ? 32000 : 65536;

  const finalMessages: Array<{ role: string; content: string }> = opts?.systemPrompt
    ? [{ role: "system", content: opts.systemPrompt }, ...messages]
    : messages;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages: finalMessages, stream: true, max_tokens: maxTokens, temperature: 0.3 }),
    signal: opts?.signal,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    if (res.status === 401) throw new Error("Chave de API inválida. Verifique nas Configurações.");
    throw new Error(`Erro da IA (${res.status}): ${txt.slice(0, 150)}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("Sem resposta do servidor de IA");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") return;
      try {
        const parsed = JSON.parse(jsonStr) as any;
        const delta = parsed.choices?.[0]?.delta?.content || parsed.text || parsed.content || "";
        if (delta) onChunk(delta);
      } catch { /* ignore parse errors */ }
    }
  }
}
