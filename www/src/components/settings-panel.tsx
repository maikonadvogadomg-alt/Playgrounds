import { useState, useEffect } from "react";
import { Settings, Key, Eye, EyeOff, Save, Check, ExternalLink } from "lucide-react";
import { getSettings, saveSettings, AISettings } from "@/lib/settings";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

const PROVIDERS = [
  { name: "OpenAI", url: "https://api.openai.com/v1", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"], keyUrl: "https://platform.openai.com/api-keys" },
  { name: "Groq (gratuito)", url: "https://api.groq.com/openai/v1", models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"], keyUrl: "https://console.groq.com/keys" },
  { name: "OpenRouter", url: "https://openrouter.ai/api/v1", models: ["openai/gpt-4o", "anthropic/claude-3-5-sonnet", "google/gemini-flash-1.5"], keyUrl: "https://openrouter.ai/keys" },
  { name: "Personalizado", url: "", models: [], keyUrl: "" },
];

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState<AISettings>({ apiKey: "", baseUrl: "https://api.openai.com/v1", model: "gpt-4o" });
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(0);

  useEffect(() => {
    if (open) {
      const s = getSettings();
      setSettings(s);
      const pi = PROVIDERS.findIndex(p => p.url === s.baseUrl);
      setSelectedProvider(pi >= 0 ? pi : PROVIDERS.length - 1);
    }
  }, [open]);

  function handleProviderChange(idx: number) {
    setSelectedProvider(idx);
    const p = PROVIDERS[idx];
    setSettings(prev => ({
      ...prev,
      baseUrl: p.url || prev.baseUrl,
      model: p.models[0] || prev.model,
    }));
  }

  function handleSave() {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Configurações de IA</h2>
            <p className="text-xs text-muted-foreground">Configure sua chave de API para usar a IA</p>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Provider selection */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Provedor de IA</label>
            <div className="grid grid-cols-2 gap-2">
              {PROVIDERS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleProviderChange(i)}
                  className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                    selectedProvider === i
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Get key link */}
          {PROVIDERS[selectedProvider]?.keyUrl && (
            <a
              href={PROVIDERS[selectedProvider].keyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Pegar minha chave gratuita em {PROVIDERS[selectedProvider].name}
            </a>
          )}

          {/* API Key */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" /> Chave de API
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={settings.apiKey}
                onChange={e => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="sk-... ou gsk_... ou sua chave"
                className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Sua chave fica salva só no seu celular, nunca é enviada para outro lugar.</p>
          </div>

          {/* Model */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Modelo</label>
            {PROVIDERS[selectedProvider]?.models.length ? (
              <select
                value={settings.model}
                onChange={e => setSettings(prev => ({ ...prev, model: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {PROVIDERS[selectedProvider].models.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={settings.model}
                onChange={e => setSettings(prev => ({ ...prev, model: e.target.value }))}
                placeholder="nome-do-modelo"
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-foreground text-sm focus:outline-none"
              />
            )}
          </div>

          {/* Base URL (custom) */}
          {selectedProvider === PROVIDERS.length - 1 && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">URL da API</label>
              <input
                type="text"
                value={settings.baseUrl}
                onChange={e => setSettings(prev => ({ ...prev, baseUrl: e.target.value }))}
                placeholder="https://api.exemplo.com/v1"
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-foreground text-sm focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground text-sm hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!settings.apiKey}
            className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saved ? <><Check className="w-4 h-4" /> Salvo!</> : <><Save className="w-4 h-4" /> Salvar</>}
          </button>
        </div>
      </div>
    </div>
  );
}
