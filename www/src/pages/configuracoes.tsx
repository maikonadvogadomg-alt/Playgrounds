import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Save, Database, Cpu, Key, CheckCircle, XCircle, Loader2, ArrowLeft, Shield, RefreshCw, Smartphone, Info, FlaskConical, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "wouter";

function detectProvider(key: string): { label: string; color: string } | null {
  if (!key || key.length < 8) return null;
  if (key.startsWith("AIza")) return { label: "✓ Gemini", color: "text-blue-600" };
  if (key.startsWith("gsk_")) return { label: "✓ Groq", color: "text-orange-600" };
  if (key.startsWith("sk-or-") || key.startsWith("sk-or_")) return { label: "✓ OpenRouter", color: "text-pink-600" };
  if (key.startsWith("sk-") && key.length > 40) return { label: "✓ OpenAI", color: "text-green-600" };
  if (key.startsWith("pplx-")) return { label: "✓ Perplexity", color: "text-purple-600" };
  if (key.startsWith("together_")) return { label: "✓ Together AI", color: "text-teal-600" };
  if (key.startsWith("hf_")) return { label: "✓ HuggingFace", color: "text-yellow-600" };
  if (key.startsWith("xai-")) return { label: "✓ xAI/Grok", color: "text-gray-700" };
  if (key.startsWith("ant-") || key.startsWith("sk-ant-")) return { label: "✓ Anthropic", color: "text-amber-600" };
  if (key.length >= 32) return { label: "✓ Chave detectada", color: "text-muted-foreground" };
  return null;
}

function MaskedInput({ value, onChange, placeholder, id, testId, showDetect }: {
  value: string; onChange: (v: string) => void; placeholder?: string; id?: string; testId?: string; showDetect?: boolean;
}) {
  const [show, setShow] = useState(false);
  const detected = showDetect ? detectProvider(value) : null;
  return (
    <div className="space-y-0.5">
      <div className="relative">
        <Input id={id} data-testid={testId} type={show ? "text" : "password"} value={value}
          onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="pr-10 font-mono text-sm" autoComplete="off" />
        <button type="button" onClick={() => setShow(s => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {detected && <p className={`text-xs font-medium ${detected.color}`}>{detected.label}</p>}
    </div>
  );
}

function StatusDot({ ok }: { ok: boolean }) {
  return ok
    ? <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium"><CheckCircle className="h-3.5 w-3.5" />Configurada</span>
    : <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><XCircle className="h-3.5 w-3.5" />Não configurada</span>;
}

function TestMsg({ r }: { r: { ok: boolean; msg: string } }) {
  return (
    <p className={`text-xs px-2 py-1 rounded ${r.ok ? "bg-green-50 dark:bg-green-950 text-green-700" : "bg-red-50 dark:bg-red-950 text-red-600"}`}>
      {r.ok ? "✓ " : "✗ "}{r.msg}
    </p>
  );
}

function ProviderKeyRow({ num, name, color, link, linkLabel, hint, children }: {
  num: string; name: string; color: string; link?: string; linkLabel?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className={`text-xs font-semibold flex items-center gap-1 ${color}`}>
          <Key className="h-3 w-3" />
          {num}. {name}
        </Label>
        {link && <a href={link} target="_blank" rel="noreferrer" className="text-xs text-blue-500 underline">{linkLabel}</a>}
      </div>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function AutoDetectPaste({ onDetected }: { onDetected: (field: string, val: string) => void }) {
  const [val, setVal] = useState("");
  const [msg, setMsg] = useState<{ text: string; field: string } | null>(null);

  function handleChange(v: string) {
    setVal(v);
    if (!v.trim()) { setMsg(null); return; }
    let field = "";
    let name = "";
    if (v.startsWith("AIza")) { field = "gemini_api_key"; name = "Gemini"; }
    else if (v.startsWith("gsk_")) { field = "groq_api_key"; name = "Groq"; }
    else if (v.startsWith("sk-or-") || v.startsWith("sk-or_")) { field = "custom4_api_key"; name = "OpenRouter → campo 4"; }
    else if (v.startsWith("sk-") && v.length > 40) { field = "openai_api_key"; name = "OpenAI"; }
    else if (v.startsWith("pplx-")) { field = "perplexity_api_key"; name = "Perplexity"; }
    else if (v.startsWith("together_")) { field = "custom4_api_key"; name = "Together AI → campo 4"; }
    else if (v.startsWith("xai-")) { field = "custom4_api_key"; name = "xAI/Grok → campo 4"; }
    else if (v.startsWith("sk-ant-") || v.startsWith("ant-")) { field = "custom4_api_key"; name = "Anthropic → campo 4"; }
    else if (v.length >= 20) { field = "custom4_api_key"; name = "Chave detectada → campo 4 (Personalizado)"; }

    if (field) {
      onDetected(field, v.trim());
      setMsg({ text: `✓ ${name} — preenchido automaticamente!`, field });
    } else {
      setMsg(null);
    }
  }

  return (
    <div className="p-3 bg-muted/60 rounded-lg border border-dashed space-y-2">
      <Label className="text-xs font-semibold">Cole qualquer chave aqui — detecta o provedor automaticamente</Label>
      <MaskedInput value={val} onChange={handleChange} placeholder="Cole sua chave aqui..." testId="input-auto-detect" />
      {msg && (
        <p className="text-xs font-medium text-green-700 dark:text-green-400">{msg.text}</p>
      )}
    </div>
  );
}

type SystemStatus = {
  dbMode: "postgres" | "memory";
  hasDbUrl: boolean;
  hasGeminiKey: boolean;
  hasOpenAiKey: boolean;
  hasGroqKey: boolean;
  hasPerplexityKey: boolean;
  hasCustom4Key: boolean;
  hasDemoKey: boolean;
  hasAppPassword: boolean;
  hasSessionSecret: boolean;
};

type AiConfig = {
  gemini_api_key: string;
  openai_api_key: string;
  groq_api_key: string;
  perplexity_api_key: string;
  custom4_api_key: string;
  custom4_api_url: string;
  custom4_api_model: string;
  demo_api_key: string;
  demo_api_url: string;
  demo_api_model: string;
  database_url: string;
};

const EMPTY: AiConfig = {
  gemini_api_key: "", openai_api_key: "", groq_api_key: "", perplexity_api_key: "",
  custom4_api_key: "", custom4_api_url: "", custom4_api_model: "",
  demo_api_key: "", demo_api_url: "", demo_api_model: "", database_url: "",
};

export default function Configuracoes() {
  const { toast } = useToast();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [config, setConfig] = useState<AiConfig>(EMPTY);
  const [neonUrl, setNeonUrl] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingAi, setSavingAi] = useState(false);
  const [connectingDb, setConnectingDb] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; msg: string }>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => { loadAll(); }, []);

  function loadAll() {
    setLoading(true);
    try {
      const saved = JSON.parse(localStorage.getItem("ai_config") || "{}");
      setConfig(prev => ({ ...prev, ...saved }));
      const hasKey = !!(saved.groq_api_key || saved.openai_api_key || saved.gemini_api_key || saved.custom4_api_key);
      setStatus({
        dbMode: "memory", hasDbUrl: false,
        hasGeminiKey: !!saved.gemini_api_key, hasOpenAiKey: !!saved.openai_api_key,
        hasGroqKey: !!saved.groq_api_key, hasPerplexityKey: !!saved.perplexity_api_key,
        hasCustom4Key: !!saved.custom4_api_key, hasDemoKey: false,
        hasAppPassword: false, hasSessionSecret: false,
      } as any);
    } catch {}
    setLoading(false);
  }

  function set(k: keyof AiConfig, v: string) {
    setConfig(prev => ({ ...prev, [k]: v }));
  }

  async function testAiKey(field: string, key: string, _provider: string) {
    if (!key.trim()) return;
    setTestingKey(field);
    setTestResult(prev => ({ ...prev, [field]: { ok: false, msg: "" } }));
    try {
      const { directChat, detectProvider } = await import("@/lib/ai-direct");
      const prov = detectProvider(key.trim());
      const url = prov?.url || "https://api.groq.com/openai/v1";
      const model = prov?.model || "llama-3.3-70b-versatile";
      const reply = await directChat([{ role: "user", content: "Responda apenas: OK" }], { key: key.trim(), url, model, maxTokens: 10 });
      setTestResult(prev => ({ ...prev, [field]: { ok: true, msg: `✓ Funcionando — ${reply.substring(0, 30)}` } }));
    } catch (e: any) {
      setTestResult(prev => ({ ...prev, [field]: { ok: false, msg: e.message } }));
    }
    setTestingKey(null);
  }

  function saveAiKeys() {
    setSavingAi(true);
    localStorage.setItem("ai_config", JSON.stringify(config));
    toast({ title: "✓ Chaves salvas!", description: "Salvo no dispositivo. Sem servidor necessário." });
    loadAll();
    setSavingAi(false);
  }

  function connectDatabase() {
    toast({ title: "Modo offline", description: "Neste modo, os dados ficam salvos no dispositivo. Banco de dados externo não é necessário." });
  }

  function saveAppPassword() {
    toast({ title: "Modo offline", description: "Sem servidor, a senha não é necessária." });
    setAppPassword("");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isMemory = status?.dbMode === "memory";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-3 py-4 pb-8">

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Configurações</h1>
            <p className="text-xs text-muted-foreground">Chaves de IA e banco de dados</p>
          </div>
          <Button variant="ghost" size="icon" onClick={loadAll} data-testid="button-refresh-status">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Status resumido */}
        <div className={`rounded-lg border p-3 mb-4 ${isMemory ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30" : "border-green-300 bg-green-50 dark:bg-green-950/30"}`}>
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4" />
            <span className="text-sm font-semibold">Status</span>
            {isMemory
              ? <Badge className="bg-yellow-200 text-yellow-800 text-xs">Sem banco — dados temporários</Badge>
              : <Badge className="bg-green-100 text-green-700 text-xs">PostgreSQL ativo</Badge>}
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="flex items-center gap-1"><span className="text-muted-foreground">Banco:</span><StatusDot ok={!isMemory} /></div>
            <div className="flex items-center gap-1"><span className="text-muted-foreground">Gemini:</span><StatusDot ok={!!status?.hasGeminiKey} /></div>
            <div className="flex items-center gap-1"><span className="text-muted-foreground">OpenAI:</span><StatusDot ok={!!status?.hasOpenAiKey} /></div>
            <div className="flex items-center gap-1"><span className="text-muted-foreground">Groq:</span><StatusDot ok={!!status?.hasGroqKey} /></div>
            <div className="flex items-center gap-1"><span className="text-muted-foreground">Perplexity:</span><StatusDot ok={!!status?.hasPerplexityKey} /></div>
            <div className="flex items-center gap-1"><span className="text-muted-foreground">4ª Chave:</span><StatusDot ok={!!status?.hasCustom4Key} /></div>
          </div>
        </div>

        {/* ── CHAVES DE IA ── */}
        <Card className="mb-4">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu className="h-4 w-4 text-purple-500" />
              Chaves de IA
            </CardTitle>
            <CardDescription className="text-xs">Configure uma ou mais. Cole a chave e salve.</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">

            {/* Cola qualquer chave — auto-detecta */}
            <AutoDetectPaste onDetected={(field, val) => set(field as keyof AiConfig, val)} />

            <Separator />

            {/* 1 — Gemini */}
            <ProviderKeyRow
              num="1" name="Google Gemini" color="text-blue-500"
              link="https://aistudio.google.com/app/apikey" linkLabel="Obter grátis →"
              hint="Começa com AIzaSy... — gratuito até certo limite."
            >
              <div className="flex gap-2">
                <div className="flex-1">
                  <MaskedInput showDetect value={config.gemini_api_key} onChange={v => set("gemini_api_key", v)}
                    placeholder="AIzaSy..." testId="input-gemini-key" />
                </div>
                <Button size="sm" variant="outline" onClick={() => testAiKey("gemini", config.gemini_api_key, "gemini")}
                  disabled={testingKey === "gemini" || !config.gemini_api_key} data-testid="button-test-gemini">
                  {testingKey === "gemini" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
                </Button>
              </div>
              {testResult.gemini && <TestMsg r={testResult.gemini} />}
            </ProviderKeyRow>

            <Separator />

            {/* 2 — Groq */}
            <ProviderKeyRow
              num="2" name="Groq (Llama — ultra rápido)" color="text-orange-500"
              link="https://console.groq.com/keys" linkLabel="Obter grátis →"
              hint="Começa com gsk_ — respostas muito rápidas."
            >
              <div className="flex gap-2">
                <div className="flex-1">
                  <MaskedInput showDetect value={config.groq_api_key} onChange={v => set("groq_api_key", v)}
                    placeholder="gsk_..." testId="input-groq-key" />
                </div>
                <Button size="sm" variant="outline" onClick={() => testAiKey("groq", config.groq_api_key, "groq")}
                  disabled={testingKey === "groq" || !config.groq_api_key} data-testid="button-test-groq">
                  {testingKey === "groq" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
                </Button>
              </div>
              {testResult.groq && <TestMsg r={testResult.groq} />}
            </ProviderKeyRow>

            <Separator />

            {/* 3 — OpenAI */}
            <ProviderKeyRow
              num="3" name="OpenAI (GPT-4o)" color="text-green-600"
              link="https://platform.openai.com/api-keys" linkLabel="Obter →"
              hint="Começa com sk-"
            >
              <div className="flex gap-2">
                <div className="flex-1">
                  <MaskedInput showDetect value={config.openai_api_key} onChange={v => set("openai_api_key", v)}
                    placeholder="sk-..." testId="input-openai-key" />
                </div>
                <Button size="sm" variant="outline" onClick={() => testAiKey("openai", config.openai_api_key, "openai")}
                  disabled={testingKey === "openai" || !config.openai_api_key} data-testid="button-test-openai">
                  {testingKey === "openai" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
                </Button>
              </div>
              {testResult.openai && <TestMsg r={testResult.openai} />}
            </ProviderKeyRow>

            <Separator />

            {/* 4 — Personalizada */}
            <ProviderKeyRow
              num="4" name="Provedor Personalizado" color="text-pink-500"
              hint="OpenRouter, DeepSeek, Together AI, Mistral, xAI... qualquer API compatível com OpenAI."
            >
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <MaskedInput showDetect value={config.custom4_api_key} onChange={v => set("custom4_api_key", v)}
                      placeholder="Chave API (qualquer formato)" testId="input-custom4-key" />
                  </div>
                  <Button size="sm" variant="outline" onClick={() => testAiKey("custom4", config.custom4_api_key, "custom")}
                    disabled={testingKey === "custom4" || !config.custom4_api_key} data-testid="button-test-custom4">
                    {testingKey === "custom4" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
                  </Button>
                </div>
                <Input className="font-mono text-xs" value={config.custom4_api_url}
                  onChange={e => set("custom4_api_url", e.target.value)}
                  placeholder="URL da API: https://openrouter.ai/api/v1" data-testid="input-custom4-url" />
                <Input className="font-mono text-xs" value={config.custom4_api_model}
                  onChange={e => set("custom4_api_model", e.target.value)}
                  placeholder="Modelo: gpt-4o-mini / meta-llama/llama-3-70b" data-testid="input-custom4-model" />
              </div>
              {testResult.custom4 && <TestMsg r={testResult.custom4} />}
            </ProviderKeyRow>

            {/* Avançado: Perplexity + Demo */}
            <button type="button" onClick={() => setShowAdvanced(s => !s)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-full py-1">
              {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {showAdvanced ? "Ocultar" : "Mostrar"} avançado (Perplexity / chave demo)
            </button>

            {showAdvanced && (
              <div className="space-y-3 pt-1 border-t">
                <ProviderKeyRow num="5" name="Perplexity" color="text-purple-500"
                  link="https://www.perplexity.ai/settings/api" linkLabel="Obter →" hint="Começa com pplx-">
                  <MaskedInput showDetect value={config.perplexity_api_key} onChange={v => set("perplexity_api_key", v)}
                    placeholder="pplx-..." testId="input-perplexity-key" />
                </ProviderKeyRow>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Chave Demo (compartilhada para todos os usuários)</Label>
                  <MaskedInput showDetect value={config.demo_api_key} onChange={v => set("demo_api_key", v)}
                    placeholder="Qualquer chave..." testId="input-demo-key" />
                  <Input className="font-mono text-xs" value={config.demo_api_url}
                    onChange={e => set("demo_api_url", e.target.value)}
                    placeholder="URL: https://api.openai.com/v1" data-testid="input-demo-url" />
                  <Input className="font-mono text-xs" value={config.demo_api_model}
                    onChange={e => set("demo_api_model", e.target.value)}
                    placeholder="Modelo: gpt-4o-mini" data-testid="input-demo-model" />
                </div>
              </div>
            )}

            <Button data-testid="button-save-ai" onClick={saveAiKeys} disabled={savingAi} className="w-full mt-2">
              {savingAi
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>
                : <><Save className="h-4 w-4 mr-2" />Salvar Todas as Chaves</>}
            </Button>
          </CardContent>
        </Card>

        {/* ── BANCO DE DADOS NEON ── */}
        <Card className="mb-4">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4 text-blue-500" />
              Banco de Dados Neon
            </CardTitle>
            <CardDescription className="text-xs">
              Crie grátis em <a href="https://neon.tech" target="_blank" rel="noreferrer" className="text-blue-500 underline">neon.tech</a> → Criar projeto → Connection string → Copiar e colar aqui
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {config.database_url && (
              <p className="text-xs font-mono bg-muted px-3 py-2 rounded text-muted-foreground break-all">
                Conectado: {config.database_url}
              </p>
            )}
            <div className="space-y-1">
              <Label className="text-xs">Cole a URL do Neon aqui</Label>
              <Input data-testid="input-neon-url" type="password" value={neonUrl}
                onChange={e => setNeonUrl(e.target.value)}
                placeholder="postgresql://usuario:senha@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
                className="font-mono text-xs" autoComplete="off" />
            </div>
            <Button data-testid="button-connect-db" onClick={connectDatabase}
              disabled={connectingDb || !neonUrl.trim()} className="w-full">
              {connectingDb
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Conectando e criando tabelas...</>
                : <><Database className="h-4 w-4 mr-2" />Conectar e Criar Tabelas</>}
            </Button>
          </CardContent>
        </Card>

        {/* ── SENHA DO APP ── */}
        <Card className="mb-4">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-orange-500" />
              Senha de Acesso
            </CardTitle>
            <CardDescription className="text-xs">Senha para entrar no app.</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <MaskedInput value={appPassword} onChange={setAppPassword}
                  placeholder="Nova senha..." testId="input-app-password" />
              </div>
              <Button onClick={saveAppPassword} disabled={savingPwd || !appPassword.trim()} data-testid="button-save-password">
                {savingPwd ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── INSTALAR NO CELULAR ── */}
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="h-4 w-4 text-blue-500" />
              Instalar no Celular / APK
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3 text-xs text-muted-foreground">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg">
              <p className="font-semibold text-foreground mb-1">Endereço do app:</p>
              <code className="break-all bg-muted px-2 py-1 rounded block select-all">
                {typeof window !== "undefined" ? window.location.origin : "https://seu-app.replit.app"}
              </code>
              <p className="mt-2 text-foreground">Copie esse endereço e use no WebView do Android Studio para gerar o APK.</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-semibold text-foreground mb-1">Como gerar o APK (para a Iara):</p>
              <ol className="space-y-1 list-decimal list-inside">
                <li>Abrir Android Studio → New Project → Empty Views Activity</li>
                <li>Abrir <code>activity_main.xml</code> → adicionar um WebView</li>
                <li>No código, apontar o WebView para o endereço acima</li>
                <li>Build → Build Bundle/APK → Build APK</li>
                <li>Instalar o APK no celular</li>
              </ol>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
