import { useState, useEffect, useRef } from "react";

const G = "#0f4c35";
const G2 = "#1a6b4a";
const DARK_BG = "#0d1117";
const DARK_CARD = "#161b22";
const DARK_BORDER = "#30363d";
const DARK_TEXT = "#e6edf3";
const DARK_SUB = "#8b949e";

const ACOES = [
  { id: "corrigir",    emoji: "✅", label: "Corrigir" },
  { id: "redacao",     emoji: "⚖️", label: "Redação" },
  { id: "lacunas",     emoji: "🔍", label: "Lacunas" },
  { id: "resumir",     emoji: "📋", label: "Resumir" },
  { id: "revisar",     emoji: "🔎", label: "Revisar" },
  { id: "refinar",     emoji: "✨", label: "Refinar" },
  { id: "simplificar", emoji: "💡", label: "Simples" },
  { id: "minuta",      emoji: "📝", label: "Minuta" },
  { id: "analisar",    emoji: "📊", label: "Analisar" },
];

const MODELOS = [
  { label: "Llama 3.3 70B (Groq)",       value: "llama-3.3-70b-versatile",              url: "https://api.groq.com/openai/v1" },
  { label: "Llama 3.1 8B (Groq)",        value: "llama-3.1-8b-instant",                 url: "https://api.groq.com/openai/v1" },
  { label: "Gemini 1.5 Flash",           value: "gemini-1.5-flash",                     url: "" },
  { label: "Gemini 2.0 Flash",           value: "gemini-2.0-flash-exp",                 url: "" },
  { label: "GPT-4o Mini",                value: "gpt-4o-mini",                          url: "https://api.openai.com/v1" },
  { label: "GPT-4o",                     value: "gpt-4o",                               url: "https://api.openai.com/v1" },
  { label: "DeepSeek Chat (OpenRouter)", value: "deepseek/deepseek-chat",               url: "https://openrouter.ai/api/v1" },
  { label: "Sonar (Perplexity)",         value: "llama-3.1-sonar-small-128k-online",   url: "https://api.perplexity.ai" },
];

const TABS = [
  { id: "home",      emoji: "⚖️", label: "Assistente" },
  { id: "chat",      emoji: "💬", label: "Chat IA"    },
  { id: "historico", emoji: "📂", label: "Histórico"  },
  { id: "config",    emoji: "⚙️", label: "Config."    },
];

const PROMPTS: Record<string, string> = {
  corrigir:    "Corrija apenas erros de português, gramática e pontuação do texto a seguir. NÃO altere o conteúdo jurídico:",
  redacao:     "Reestruture e melhore a redação jurídica do texto. NÃO invente fatos. Retorne o texto completo reescrito:",
  lacunas:     "Analise e aponte o que está faltando, informações incompletas, contradições e lacunas jurídicas:",
  resumir:     "Faça um resumo completo e estruturado por tópicos do seguinte documento jurídico:",
  revisar:     "Revise identificando erros de direito, argumentos frágeis, jurisprudência aplicável e pontos a reforçar:",
  refinar:     "Reescreva de forma mais clara, objetiva e tecnicamente precisa, mantendo todos os argumentos:",
  simplificar: "Reescreva em linguagem simples e acessível para leigos, explicando os termos técnicos:",
  minuta:      "Redija uma peça jurídica completa e detalhada nos padrões da OAB brasileira com base em:",
  analisar:    "Analise juridicamente o seguinte texto, identificando os pontos principais, riscos e recomendações:",
};

function getSetting(key: string, def = "") {
  try { return localStorage.getItem("ajnative_" + key) ?? def; } catch { return def; }
}
function setSetting(key: string, val: string) {
  try { localStorage.setItem("ajnative_" + key, val); } catch {}
}
function isDark() {
  try { return localStorage.getItem("ajnative_dark") === "1"; } catch { return true; }
}
function getHistory(): any[] {
  try { return JSON.parse(localStorage.getItem("ajnative_history") || "[]"); } catch { return []; }
}
function saveHistory(items: any[]) {
  try { localStorage.setItem("ajnative_history", JSON.stringify(items.slice(0, 200))); } catch {}
}
function detectProv(k: string) {
  if (k.startsWith("gsk_"))   return { label: "Groq",        url: "https://api.groq.com/openai/v1",       model: "llama-3.3-70b-versatile",             gemini: false };
  if (k.startsWith("AIza"))   return { label: "Google Gemini", url: "",                                   model: "gemini-1.5-flash",                     gemini: true  };
  if (k.startsWith("sk-or-")) return { label: "OpenRouter",  url: "https://openrouter.ai/api/v1",          model: "deepseek/deepseek-chat",               gemini: false };
  if (k.startsWith("pplx-"))  return { label: "Perplexity",  url: "https://api.perplexity.ai",             model: "llama-3.1-sonar-small-128k-online",    gemini: false };
  if (k.startsWith("sk-"))    return { label: "OpenAI",       url: "https://api.openai.com/v1",            model: "gpt-4o-mini",                          gemini: false };
  return null;
}

async function callIA(apiKey: string, apiUrl: string, apiModel: string, messages: {role:string;content:string}[]) {
  const isGemini = apiModel.startsWith("gemini") && !apiUrl;
  if (isGemini) {
    const contents = messages.filter(m => m.role !== "system").map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    const sysMsg = messages.find(m => m.role === "system");
    const body: any = { contents, generationConfig: { maxOutputTokens: 8192 } };
    if (sysMsg) body.systemInstruction = { parts: [{ text: sysMsg.content }] };
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${apiKey}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    );
    const d = await r.json();
    if (!r.ok) throw new Error(d?.error?.message || `Erro ${r.status}`);
    return d.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } else {
    const baseUrl = apiUrl || "https://api.groq.com/openai/v1";
    const r = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: apiModel, messages, max_tokens: 8192 }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d?.error?.message || `Erro ${r.status}`);
    return d.choices?.[0]?.message?.content || "";
  }
}

async function saveToNeon(neonUrl: string, item: any) {
  if (!neonUrl || neonUrl.length < 20) return;
  try {
    const u = new URL(neonUrl.replace(/^postgres:\/\//, "postgresql://"));
    const auth = "Basic " + btoa(`${u.username}:${u.password}`);
    await fetch(`https://${u.hostname}/sql`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": auth, "Neon-Connection-String": neonUrl },
      body: JSON.stringify({
        query: `INSERT INTO aj_historico (id,action,input_prev,result,model,created_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
        params: [String(item.id), item.action, item.inputPreview?.slice(0,500)||"", item.result?.slice(0,5000)||"", item.model, item.createdAt],
      }),
    });
  } catch {}
}

function T({ dark, children, style }: { dark: boolean; children: React.ReactNode; style?: React.CSSProperties }) {
  return <span style={{ color: dark ? DARK_TEXT : "#111827", ...style }}>{children}</span>;
}
function Sub({ dark, children, style }: { dark: boolean; children: React.ReactNode; style?: React.CSSProperties }) {
  return <span style={{ color: dark ? DARK_SUB : "#6b7280", ...style }}>{children}</span>;
}
function Card({ dark, children, style }: { dark: boolean; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: dark ? DARK_CARD : "white", borderRadius: 12, padding: 14,
      border: `1px solid ${dark ? DARK_BORDER : "#e5e7eb"}`, marginBottom: 12, ...style }}>
      {children}
    </div>
  );
}
function Hdr({ dark, children }: { dark: boolean; children: React.ReactNode }) {
  return (
    <div style={{ background: G, padding: "12px 16px" }}>
      <div style={{ color: "white", fontWeight: 800, fontSize: 16 }}>{children}</div>
    </div>
  );
}
function Inp({ dark, value, onChange, placeholder, type = "text", style }: any) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${dark ? DARK_BORDER : "#d1d5db"}`,
        borderRadius: 10, fontSize: 13, color: dark ? DARK_TEXT : "#111827",
        background: dark ? "#0d1117" : "#f9fafb", boxSizing: "border-box", ...style }} />
  );
}
function Btn({ onClick, disabled, children, style }: any) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: "10px 16px", background: G, color: "white", border: "none",
        borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.7 : 1, width: "100%", ...style }}>
      {children}
    </button>
  );
}

function HomeTab({ dark }: { dark: boolean }) {
  const [texto, setTexto] = useState("");
  const [acao, setAcao] = useState("resumir");
  const [resultado, setResultado] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [campoLivre, setCampoLivre] = useState(false);
  const [instrucao, setInstrucao] = useState("");
  const [nomeArq, setNomeArq] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function importarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setNomeArq(file.name);
    if (file.name.endsWith(".txt")) {
      const txt = await file.text();
      setTexto(txt);
    } else if (file.name.endsWith(".pdf") || file.name.endsWith(".docx") || file.name.endsWith(".doc")) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const r = await fetch("/api/upload-document", { method: "POST", body: fd });
        if (r.ok) {
          const d = await r.json();
          setTexto(d.text || "");
        } else {
          alert("Não foi possível extrair o texto. Cole manualmente.");
        }
      } catch {
        alert("Erro ao processar arquivo. Cole o texto manualmente.");
      }
    } else {
      alert("Formatos aceitos: .txt, .pdf, .docx");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function processar() {
    const t = texto.trim();
    if (!t) { alert("Cole um texto ou importe um arquivo primeiro."); return; }
    const apiKey = getSetting("apiKey");
    if (!apiKey) { alert("Configure sua chave de API na aba ⚙️ Config."); return; }
    const apiUrl   = getSetting("apiUrl",   "https://api.groq.com/openai/v1");
    const apiModel = getSetting("apiModel", "llama-3.3-70b-versatile");
    setLoading(true); setErro(""); setResultado("");
    try {
      const prompt = (campoLivre ? instrucao.trim() || "Analise o texto:" : PROMPTS[acao] || PROMPTS.analisar) + "\n\n" + t;
      const msgs = [
        { role: "system", content: "Você é um assistente jurídico especializado no direito brasileiro. Responda sempre em português do Brasil com linguagem formal e técnica." },
        { role: "user",   content: prompt },
      ];
      const respText = await callIA(apiKey, apiUrl, apiModel, msgs);
      setResultado(respText);
      const hist = getHistory();
      const acaoLabel = campoLivre ? "Campo Livre" : (ACOES.find(a => a.id === acao)?.label ?? acao);
      const item = { id: Date.now(), action: acaoLabel, inputPreview: t.slice(0, 300), result: respText, model: apiModel, createdAt: new Date().toISOString() };
      hist.unshift(item);
      saveHistory(hist);
      const neonUrl = getSetting("neonUrl");
      if (neonUrl) saveToNeon(neonUrl, item);
    } catch (e: any) {
      setErro(e.message);
    }
    setLoading(false);
  }

  const bg = dark ? DARK_BG : "#f8faf9";
  const cardBg = dark ? DARK_CARD : "white";
  const border = dark ? DARK_BORDER : "#e5e7eb";

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: bg }}>
      <Hdr dark={dark}>⚖️ Assistente Jurídico</Hdr>
      <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>

        {/* Modo */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {[{id:"acoes",label:"⚖️ Ações"},{id:"livre",label:"🔧 Campo Livre"}].map(m => (
            <button key={m.id} onClick={() => setCampoLivre(m.id === "livre")}
              style={{ padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${(m.id==="livre") === campoLivre ? G : border}`,
                background: (m.id==="livre") === campoLivre ? G : cardBg,
                color: (m.id==="livre") === campoLivre ? "white" : dark ? DARK_SUB : "#6b7280",
                fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
              {m.label}
            </button>
          ))}
        </div>

        {!campoLivre ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
            {ACOES.map(a => (
              <button key={a.id} onClick={() => setAcao(a.id)}
                style={{ padding: "8px 4px", borderRadius: 10, border: `1.5px solid ${acao === a.id ? G : border}`,
                  background: acao === a.id ? G : cardBg, cursor: "pointer", textAlign: "center" }}>
                <div style={{ fontSize: 15 }}>{a.emoji}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: acao === a.id ? "white" : dark ? DARK_SUB : "#6b7280", marginTop: 2 }}>{a.label}</div>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ marginBottom: 12 }}>
            <textarea value={instrucao} onChange={e => setInstrucao(e.target.value)}
              placeholder="Ex: Extraia todos os prazos processuais..."
              style={{ width: "100%", minHeight: 72, border: `1.5px solid ${G}`, borderRadius: 10,
                padding: 10, fontSize: 12, fontFamily: "inherit", resize: "none",
                background: cardBg, boxSizing: "border-box", color: dark ? DARK_TEXT : "#111827" }} />
          </div>
        )}

        {/* Importar arquivo */}
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button onClick={() => fileRef.current?.click()}
            style={{ flex: 1, padding: "9px 12px", border: `1.5px dashed ${dark ? "#30363d" : "#d1d5db"}`,
              borderRadius: 10, background: cardBg, color: dark ? DARK_SUB : "#6b7280",
              fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            📎 Importar arquivo {nomeArq ? `(${nomeArq.slice(0,20)})` : "(.txt .pdf .docx)"}
          </button>
          {texto && (
            <button onClick={() => { setTexto(""); setNomeArq(""); }}
              style={{ padding: "9px 10px", border: `1px solid ${border}`, borderRadius: 10,
                background: cardBg, color: "#dc2626", fontSize: 12, cursor: "pointer" }}>✕</button>
          )}
        </div>
        <input ref={fileRef} type="file" accept=".txt,.pdf,.docx,.doc" onChange={importarArquivo} style={{ display: "none" }} />

        <textarea value={texto} onChange={e => setTexto(e.target.value)}
          placeholder="Cole aqui o texto jurídico — processo, petição, contrato, sentença..."
          style={{ width: "100%", minHeight: 100, border: `1.5px solid ${border}`, borderRadius: 10,
            padding: 10, fontSize: 12, fontFamily: "inherit", resize: "none",
            background: cardBg, boxSizing: "border-box", color: dark ? DARK_TEXT : "#111827" }} />
        <div style={{ textAlign: "right", fontSize: 10, color: dark ? DARK_SUB : "#9ca3af", marginBottom: 10 }}>{texto.length} caracteres</div>

        <Btn onClick={processar} disabled={loading} style={{ marginBottom: 12 }}>
          {loading ? "⟳ Processando com IA..." : "⚡ Processar com IA"}
        </Btn>

        {!!erro && (
          <div style={{ background: dark ? "#2d1515" : "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: "#dc2626" }}>❌ {erro}</div>
          </div>
        )}

        {!!resultado && (
          <div style={{ background: cardBg, borderRadius: 12, border: `1.5px solid ${dark ? "#1a4731" : "#d1fae5"}`, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontWeight: 700, color: G, fontSize: 13 }}>✅ Resultado</div>
              <button onClick={() => navigator.clipboard?.writeText(resultado)}
                style={{ padding: "4px 10px", background: "#e8f5e9", border: "none", borderRadius: 8, fontSize: 11, color: G, fontWeight: 600, cursor: "pointer" }}>
                📋 Copiar
              </button>
            </div>
            <div style={{ fontSize: 12, color: dark ? DARK_TEXT : "#111827", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{resultado}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatTab({ dark }: { dark: boolean }) {
  const [msgs, setMsgs] = useState<{role:string;text:string}[]>([
    { role: "bot", text: "Olá! Sou seu assistente jurídico. Pode me perguntar sobre processos, prazos, legislação, redação de peças e muito mais." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  async function enviar() {
    const txt = input.trim();
    if (!txt || loading) return;
    const apiKey = getSetting("apiKey");
    if (!apiKey) { alert("Configure sua chave na aba ⚙️ Config."); return; }
    const apiUrl   = getSetting("apiUrl",   "https://api.groq.com/openai/v1");
    const apiModel = getSetting("apiModel", "llama-3.3-70b-versatile");
    const novas = [...msgs, { role: "user", text: txt }];
    setMsgs(novas); setInput(""); setLoading(true);
    try {
      const messages = [
        { role: "system", content: "Você é um assistente jurídico especializado no direito brasileiro. Responda em português do Brasil com linguagem formal e técnica." },
        ...novas.filter(m => m.role !== "bot" || novas.indexOf(m) > 0).map(m => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.text,
        })),
      ];
      const respText = await callIA(apiKey, apiUrl, apiModel, messages);
      setMsgs([...novas, { role: "bot", text: respText }]);
    } catch (e: any) {
      setMsgs([...novas, { role: "bot", text: "❌ Erro: " + e.message }]);
    }
    setLoading(false);
  }

  const bg = dark ? DARK_BG : "#f8faf9";

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: bg }}>
      <Hdr dark={dark}>💬 Chat Jurídico com IA</Hdr>
      <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "84%", padding: "10px 13px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              fontSize: 13, lineHeight: 1.55,
              background: m.role === "user" ? G : dark ? DARK_CARD : "white",
              color: m.role === "user" ? "white" : dark ? DARK_TEXT : "#111827",
              border: m.role === "bot" ? `1px solid ${dark ? DARK_BORDER : "#e5e7eb"}` : "none",
              whiteSpace: "pre-wrap",
            }}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex" }}>
            <div style={{ background: dark ? DARK_CARD : "white", border: `1px solid ${dark ? DARK_BORDER : "#e5e7eb"}`,
              borderRadius: "18px 18px 18px 4px", padding: "10px 14px", fontSize: 13, color: dark ? DARK_SUB : "#6b7280" }}>
              ⟳ Digitando...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: 10, borderTop: `1px solid ${dark ? DARK_BORDER : "#e5e7eb"}`, display: "flex", gap: 8, background: dark ? DARK_CARD : "white", flexShrink: 0 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), enviar())}
          placeholder="Sua pergunta jurídica..."
          style={{ flex: 1, padding: "10px 14px", borderRadius: 22, border: `1.5px solid ${dark ? DARK_BORDER : "#e5e7eb"}`,
            fontSize: 13, outline: "none", color: dark ? DARK_TEXT : "#111827",
            background: dark ? DARK_BG : "#f9fafb" }} />
        <button onClick={enviar} disabled={loading}
          style={{ width: 42, height: 42, borderRadius: "50%", background: loading ? "#6b9e8a" : G,
            border: "none", color: "white", fontSize: 18, cursor: "pointer", flexShrink: 0 }}>▶</button>
      </div>
    </div>
  );
}

function HistoricoTab({ dark }: { dark: boolean }) {
  const [items, setItems] = useState<any[]>([]);
  const [aberto, setAberto] = useState<any>(null);

  useEffect(() => { setItems(getHistory()); }, []);

  function fmtData(iso: string) {
    try { return new Date(iso).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", year:"2-digit", hour:"2-digit", minute:"2-digit" }); }
    catch { return iso; }
  }

  const bg = dark ? DARK_BG : "#f8faf9";

  if (aberto) return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: bg }}>
      <div style={{ background: G, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{aberto.action}</div>
        <button onClick={() => setAberto(null)}
          style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, color: "white", padding: "4px 10px", cursor: "pointer", fontWeight: 700 }}>
          ✕ Voltar
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
        <div style={{ fontSize: 11, color: dark ? DARK_SUB : "#9ca3af", marginBottom: 10 }}>{fmtData(aberto.createdAt)} · {aberto.model}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: G, marginBottom: 4 }}>ENTRADA</div>
        <div style={{ background: dark ? DARK_CARD : "#f3f4f6", border: `1px solid ${dark ? DARK_BORDER : "#e5e7eb"}`, borderRadius: 8, padding: 10, fontSize: 12, color: dark ? DARK_TEXT : "#374151", marginBottom: 12, lineHeight: 1.6 }}>{aberto.inputPreview}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: G, marginBottom: 4 }}>RESULTADO</div>
        <div style={{ fontSize: 13, color: dark ? DARK_TEXT : "#111827", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{aberto.result}</div>
      </div>
      <div style={{ padding: "10px 14px", display: "flex", gap: 8, flexShrink: 0 }}>
        <button onClick={() => navigator.clipboard?.writeText(aberto.result)}
          style={{ flex: 1, padding: 12, background: G, border: "none", borderRadius: 12, color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          📋 Copiar resultado
        </button>
        <button onClick={() => { const h = getHistory().filter((x:any) => x.id !== aberto.id); saveHistory(h); setItems(h); setAberto(null); }}
          style={{ padding: "12px 14px", background: dark ? "#2d1515" : "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, color: "#dc2626", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          🗑
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: bg }}>
      <div style={{ background: G, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: "white", fontWeight: 800, fontSize: 16 }}>📂 Histórico ({items.length})</div>
        {items.length > 0 && (
          <button onClick={() => { saveHistory([]); setItems([]); }}
            style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, color: "white", padding: "4px 10px", cursor: "pointer", fontSize: 11 }}>
            🗑 Limpar
          </button>
        )}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
        {items.length === 0 ? (
          <div style={{ textAlign: "center", color: dark ? DARK_SUB : "#9ca3af", marginTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Nenhum registro ainda.</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>Use o Assistente para gerar resultados.</div>
          </div>
        ) : items.map((it: any) => (
          <div key={it.id} onClick={() => setAberto(it)}
            style={{ background: dark ? DARK_CARD : "white", borderRadius: 12, padding: 13, marginBottom: 8,
              border: `1px solid ${dark ? DARK_BORDER : "#e5e7eb"}`, cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ background: "#d1fae5", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "#065f46", fontWeight: 700 }}>{it.action}</div>
              <div style={{ fontSize: 10, color: dark ? DARK_SUB : "#9ca3af" }}>{fmtData(it.createdAt)}</div>
            </div>
            <div style={{ fontSize: 12, color: dark ? DARK_TEXT : "#374151", lineHeight: 1.5 }}>{it.inputPreview?.slice(0, 100)}...</div>
            <div style={{ fontSize: 10, color: dark ? DARK_SUB : "#9ca3af", marginTop: 4 }}>{it.model}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfigTab({ dark, onToggleDark }: { dark: boolean; onToggleDark: () => void }) {
  const [apiKey,   setApiKey]  = useState(() => getSetting("apiKey"));
  const [apiUrl,   setApiUrl]  = useState(() => getSetting("apiUrl",  "https://api.groq.com/openai/v1"));
  const [apiModel, setApiModel]= useState(() => getSetting("apiModel","llama-3.3-70b-versatile"));
  const [neonUrl,  setNeonUrl] = useState(() => getSetting("neonUrl"));
  const [mostrarKey, setMostrarKey] = useState(false);
  const [testando,   setTestando]   = useState(false);
  const [testandoN,  setTestandoN]  = useState(false);
  const [statusIA,   setStatusIA]   = useState<"ok"|"erro"|null>(null);
  const [statusNeon, setStatusNeon] = useState<"ok"|"erro"|null>(null);
  const [neonRows,   setNeonRows]   = useState<any[]|null>(null);
  const [loadNeon,   setLoadNeon]   = useState(false);
  const [secao, setSecao] = useState<"ia"|"neon"|"token">("ia");
  const [jwtCpf,    setJwtCpf]    = useState("");
  const [jwtNome,   setJwtNome]   = useState("");
  const [jwtTrib,   setJwtTrib]   = useState("TJMG");
  const [jwtPem,    setJwtPem]    = useState("");
  const [jwtResult, setJwtResult] = useState("");

  const prov = detectProv(apiKey);
  const bg = dark ? DARK_BG : "#f8faf9";
  const cardBg = dark ? DARK_CARD : "white";
  const border = dark ? DARK_BORDER : "#e5e7eb";

  function aoDigitarChave(k: string) {
    setApiKey(k); setStatusIA(null);
    const p = detectProv(k);
    if (p) { setApiUrl(p.url); setApiModel(p.model); }
  }

  function salvar() {
    setSetting("apiKey",   apiKey.trim());
    setSetting("apiUrl",   apiUrl.trim());
    setSetting("apiModel", apiModel.trim());
    setSetting("neonUrl",  neonUrl.trim());
    alert("✅ Configurações salvas no dispositivo!");
  }

  async function testarIA() {
    if (!apiKey.trim()) { alert("Cole a chave primeiro."); return; }
    setTestando(true); setStatusIA(null);
    try {
      const isGemini = apiKey.startsWith("AIza");
      if (isGemini) {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        setStatusIA(r.ok ? "ok" : "erro");
        if (!r.ok) alert("❌ Chave Google inválida.");
        else alert("✅ Chave Google Gemini válida!");
      } else {
        const url = (apiUrl || "https://api.groq.com/openai/v1") + "/models";
        const r = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
        setStatusIA(r.ok ? "ok" : "erro");
        if (!r.ok) { const d = await r.json().catch(()=>({})); alert("❌ Chave inválida: " + (d?.error?.message || r.status)); }
        else alert("✅ Chave válida! IA conectada diretamente.");
      }
    } catch (e: any) { setStatusIA("erro"); alert("Erro de conexão: " + e.message); }
    setTestando(false);
  }

  async function testarNeon() {
    if (!neonUrl.trim()) { alert("Informe a URL do Neon."); return; }
    setTestandoN(true); setStatusNeon(null);
    try {
      const u = new URL(neonUrl.replace(/^postgres:\/\//, "postgresql://"));
      const auth = "Basic " + btoa(`${u.username}:${u.password}`);
      const r = await fetch(`https://${u.hostname}/sql`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": auth, "Neon-Connection-String": neonUrl },
        body: JSON.stringify({ query: `CREATE TABLE IF NOT EXISTS aj_historico (id TEXT PRIMARY KEY, action TEXT NOT NULL, input_prev TEXT, result TEXT, model TEXT, created_at TEXT NOT NULL)` }),
      });
      setStatusNeon(r.ok ? "ok" : "erro");
      if (r.ok) alert("✅ Neon conectado! Tabela criada. Histórico será salvo automaticamente.");
      else alert("❌ Erro Neon " + r.status);
    } catch (e: any) { setStatusNeon("erro"); alert("Erro Neon: " + e.message); }
    setTestandoN(false);
  }

  async function verNeon() {
    if (!neonUrl.trim()) { alert("Configure e teste o Neon primeiro."); return; }
    setLoadNeon(true); setNeonRows(null);
    try {
      const u = new URL(neonUrl.replace(/^postgres:\/\//, "postgresql://"));
      const auth = "Basic " + btoa(`${u.username}:${u.password}`);
      const r = await fetch(`https://${u.hostname}/sql`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": auth, "Neon-Connection-String": neonUrl },
        body: JSON.stringify({ query: "SELECT id,action,input_prev,model,created_at FROM aj_historico ORDER BY created_at DESC LIMIT 20" }),
      });
      const d = await r.json(); setNeonRows(d?.rows || []);
    } catch (e: any) { alert("Erro: " + e.message); setNeonRows([]); }
    setLoadNeon(false);
  }

  function gerarJwt() {
    if (!jwtCpf || !jwtPem) { alert("Preencha CPF e chave PEM."); return; }
    try {
      const now = Math.floor(Date.now() / 1000);
      const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" })).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
      const payload = btoa(JSON.stringify({
        sub: jwtCpf.replace(/\D/g,""),
        name: jwtNome,
        iss: "sso.cloud.pje.jus.br/auth/realms/pje",
        aud: "pje-api",
        iat: now,
        exp: now + 3600,
        jti: crypto.randomUUID?.() || Date.now().toString(),
        preferred_username: jwtCpf.replace(/\D/g,""),
        "custom:tribunal": jwtTrib,
      })).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
      setJwtResult(`⚠️ Assinar JWT requer crypto no servidor.\n\nUse o endpoint /token da aplicação principal com sua chave PEM.\n\nPayload gerado:\n${atob(payload.replace(/-/g,"+").replace(/_/g,"/"))}`);
    } catch (e: any) { setJwtResult("Erro: " + e.message); }
  }

  const fmtData = (iso: string) => { try { return new Date(iso).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"}); } catch { return iso; } };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: bg }}>
      <div style={{ background: G, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: "white", fontWeight: 800, fontSize: 16 }}>⚙️ Configurações</div>
        <button onClick={onToggleDark}
          style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 20, color: "white",
            padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          {dark ? "☀️ Claro" : "🌙 Escuro"}
        </button>
      </div>

      {/* Status */}
      <div style={{ padding: "10px 14px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            { ok: apiKey.length > 10 ? (statusIA === "ok" ? true : statusIA === "erro" ? false : null) : false, label: apiKey.length > 10 ? (prov?.label || "IA configurada") : "IA: não configurada" },
            { ok: neonUrl.length > 20 ? (statusNeon === "ok" ? true : statusNeon === "erro" ? false : null) : null, label: neonUrl.length > 20 ? "Neon OK" : "Neon: opcional" },
          ].map((b, i) => (
            <div key={i} style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
              background: b.ok === true ? "#d1fae5" : b.ok === false ? "#fef2f2" : dark ? DARK_CARD : "#f3f4f6",
              color: b.ok === true ? "#065f46" : b.ok === false ? "#dc2626" : dark ? DARK_SUB : "#9ca3af" }}>
              {b.ok === true ? "✅" : b.ok === false ? "❌" : "○"} {b.label}
            </div>
          ))}
        </div>
      </div>

      {/* Sub-abas */}
      <div style={{ display: "flex", borderBottom: `1px solid ${border}`, margin: "10px 0 0", flexShrink: 0 }}>
        {[{id:"ia",label:"🔑 IA"},{id:"neon",label:"🗄️ Neon"},{id:"token",label:"🪙 Token JWT"}].map(s => (
          <button key={s.id} onClick={() => setSecao(s.id as any)}
            style={{ flex: 1, padding: "8px 4px", border: "none", background: "transparent",
              borderBottom: secao === s.id ? `2.5px solid ${G}` : "2.5px solid transparent",
              color: secao === s.id ? G : dark ? DARK_SUB : "#6b7280",
              fontWeight: secao === s.id ? 700 : 400, fontSize: 11, cursor: "pointer" }}>
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>

        {/* ===== ABA IA ===== */}
        {secao === "ia" && (
          <>
            <Card dark={dark}>
              <div style={{ fontWeight: 700, color: G, fontSize: 13, marginBottom: 8 }}>🔑 Chave de API</div>
              <div style={{ fontSize: 11, color: dark ? DARK_SUB : "#6b7280", marginBottom: 10 }}>
                Groq, Gemini, OpenAI, OpenRouter, Perplexity. Detectado automaticamente.
              </div>
              {prov && <div style={{ background: "#d1fae5", borderRadius: 8, padding: "3px 10px", marginBottom: 8, display: "inline-block", fontSize: 11, color: "#065f46", fontWeight: 700 }}>✅ {prov.label}</div>}
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <input type={mostrarKey ? "text" : "password"} value={apiKey} onChange={e => aoDigitarChave(e.target.value)}
                  placeholder="Cole sua chave aqui..."
                  style={{ flex: 1, padding: "9px 12px", border: `1.5px solid ${dark ? DARK_BORDER : "#d1d5db"}`,
                    borderRadius: 10, fontSize: 13, color: dark ? DARK_TEXT : "#111827",
                    background: dark ? DARK_BG : "#f9fafb" }} />
                <button onClick={() => setMostrarKey(v=>!v)}
                  style={{ padding: "0 10px", border: `1px solid ${border}`, borderRadius: 10,
                    background: cardBg, fontSize: 16, cursor: "pointer" }}>
                  {mostrarKey ? "🙈" : "👁"}
                </button>
              </div>
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: dark ? DARK_TEXT : "#374151", marginBottom: 4 }}>URL da API</div>
                <input value={apiUrl} onChange={e => { setApiUrl(e.target.value); setStatusIA(null); }}
                  style={{ width: "100%", padding: "8px 12px", border: `1.5px solid ${dark ? DARK_BORDER : "#d1d5db"}`,
                    borderRadius: 10, fontSize: 11, color: dark ? DARK_TEXT : "#111827",
                    background: dark ? DARK_BG : "#f9fafb", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: dark ? DARK_TEXT : "#374151", marginBottom: 4 }}>Modelo</div>
                <input value={apiModel} onChange={e => { setApiModel(e.target.value); setStatusIA(null); }}
                  style={{ width: "100%", padding: "8px 12px", border: `1.5px solid ${dark ? DARK_BORDER : "#d1d5db"}`,
                    borderRadius: 10, fontSize: 11, color: dark ? DARK_TEXT : "#111827",
                    background: dark ? DARK_BG : "#f9fafb", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                {MODELOS.map(m => (
                  <button key={m.value} onClick={() => { setApiModel(m.value); if (m.url !== undefined) setApiUrl(m.url); setStatusIA(null); }}
                    style={{ padding: "4px 8px", borderRadius: 8, border: `1px solid ${apiModel === m.value ? G : border}`,
                      background: apiModel === m.value ? "#d1fae5" : cardBg,
                      color: apiModel === m.value ? "#065f46" : dark ? DARK_SUB : "#374151",
                      fontSize: 10, fontWeight: apiModel === m.value ? 700 : 400, cursor: "pointer" }}>
                    {m.label}
                  </button>
                ))}
              </div>
              <button onClick={testarIA} disabled={testando}
                style={{ width: "100%", padding: 10, border: `1.5px solid ${G}`, borderRadius: 10,
                  background: cardBg, color: G, fontWeight: 700, fontSize: 13, cursor: "pointer",
                  opacity: testando ? 0.7 : 1 }}>
                {testando ? "⟳ Testando..." : "🔌 Testar conexão com a IA"}
              </button>
              <div style={{ background: dark ? "#1a2e1a" : "#fefce8", borderRadius: 8, padding: 10, marginTop: 10, fontSize: 11, color: dark ? "#86e68a" : "#374151", lineHeight: 1.6 }}>
                🆓 <strong>Groq grátis:</strong> console.groq.com → API Keys → Create key (gsk_...)
              </div>
            </Card>
            <Btn onClick={salvar}>💾 Salvar todas as configurações</Btn>
            <div style={{ fontSize: 10, color: dark ? DARK_SUB : "#9ca3af", textAlign: "center", marginTop: 8, lineHeight: 1.7 }}>
              🔒 Chaves salvas APENAS neste dispositivo.{"\n"}
              Nunca enviadas para servidores intermediários.
            </div>
          </>
        )}

        {/* ===== ABA NEON ===== */}
        {secao === "neon" && (
          <>
            <Card dark={dark}>
              <div style={{ fontWeight: 700, color: G, fontSize: 13, marginBottom: 4 }}>🗄️ Banco Neon (opcional)</div>
              <div style={{ fontSize: 11, color: dark ? DARK_SUB : "#6b7280", marginBottom: 10 }}>
                Histórico salvo na nuvem. Sem isso fica só no dispositivo. Grátis em neon.tech.
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <input type={mostrarKey ? "text" : "password"} value={neonUrl}
                  onChange={e => { setNeonUrl(e.target.value); setStatusNeon(null); }}
                  placeholder="postgresql://user:senha@host.neon.tech/banco"
                  style={{ flex: 1, padding: "9px 12px", border: `1.5px solid ${dark ? DARK_BORDER : "#d1d5db"}`,
                    borderRadius: 10, fontSize: 11, color: dark ? DARK_TEXT : "#111827",
                    background: dark ? DARK_BG : "#f9fafb" }} />
                <button onClick={() => setMostrarKey(v=>!v)}
                  style={{ padding: "0 10px", border: `1px solid ${border}`, borderRadius: 10, background: cardBg, fontSize: 16, cursor: "pointer" }}>
                  {mostrarKey ? "🙈" : "👁"}
                </button>
              </div>
              <div style={{ fontSize: 10, color: dark ? DARK_SUB : "#9ca3af", marginBottom: 10 }}>
                neon.tech → seu projeto → Connection String (postgresql://...)
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <button onClick={testarNeon} disabled={testandoN}
                  style={{ flex: 1, padding: 10, border: `1.5px solid ${G}`, borderRadius: 10,
                    background: cardBg, color: G, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                  {testandoN ? "⟳..." : "🔌 Testar + criar tabela"}
                </button>
                {neonUrl.length > 20 && (
                  <button onClick={verNeon} disabled={loadNeon}
                    style={{ flex: 1, padding: 10, border: "1.5px solid #6366f1", borderRadius: 10,
                      background: cardBg, color: "#6366f1", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                    {loadNeon ? "⟳..." : "📋 Ver registros"}
                  </button>
                )}
              </div>
              {neonRows !== null && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: dark ? DARK_TEXT : "#374151", marginBottom: 6 }}>{neonRows.length} registro(s):</div>
                  {neonRows.length === 0
                    ? <div style={{ fontSize: 12, color: dark ? DARK_SUB : "#9ca3af" }}>Nenhum registro ainda.</div>
                    : neonRows.map((r: any, i: number) => (
                      <div key={i} style={{ background: dark ? DARK_BG : "#f9fafb", borderRadius: 8, padding: 8, marginBottom: 6, border: `1px solid ${border}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#065f46" }}>{r.action}</span>
                          <span style={{ fontSize: 10, color: dark ? DARK_SUB : "#9ca3af" }}>{fmtData(r.created_at)}</span>
                        </div>
                        <div style={{ fontSize: 11, color: dark ? DARK_TEXT : "#374151", marginTop: 2 }}>{r.input_prev?.slice(0,80)}...</div>
                      </div>
                    ))
                  }
                </div>
              )}
            </Card>
            <Btn onClick={salvar}>💾 Salvar configuração Neon</Btn>
          </>
        )}

        {/* ===== ABA TOKEN JWT ===== */}
        {secao === "token" && (
          <>
            <Card dark={dark}>
              <div style={{ fontWeight: 700, color: G, fontSize: 13, marginBottom: 4 }}>🪙 Gerador de Token JWT</div>
              <div style={{ fontSize: 11, color: dark ? DARK_SUB : "#6b7280", marginBottom: 12 }}>
                Para autenticação PDPJ/PJUD nos sistemas do CNJ.
              </div>
              {[
                { label: "CPF", value: jwtCpf, set: setJwtCpf, ph: "000.000.000-00" },
                { label: "Nome completo", value: jwtNome, set: setJwtNome, ph: "Nome do advogado" },
                { label: "Tribunal", value: jwtTrib, set: setJwtTrib, ph: "TJMG" },
              ].map(f => (
                <div key={f.label} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: dark ? DARK_TEXT : "#374151", marginBottom: 4 }}>{f.label}</div>
                  <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                    style={{ width: "100%", padding: "8px 12px", border: `1.5px solid ${dark ? DARK_BORDER : "#d1d5db"}`,
                      borderRadius: 10, fontSize: 12, color: dark ? DARK_TEXT : "#111827",
                      background: dark ? DARK_BG : "#f9fafb", boxSizing: "border-box" }} />
                </div>
              ))}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: dark ? DARK_TEXT : "#374151", marginBottom: 4 }}>Chave PEM (privada)</div>
                <textarea value={jwtPem} onChange={e => setJwtPem(e.target.value)}
                  placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;..."
                  style={{ width: "100%", minHeight: 80, border: `1.5px solid ${dark ? DARK_BORDER : "#d1d5db"}`,
                    borderRadius: 10, padding: 10, fontSize: 11, fontFamily: "monospace", resize: "none",
                    background: dark ? DARK_BG : "#f9fafb", boxSizing: "border-box", color: dark ? DARK_TEXT : "#111827" }} />
              </div>
              <Btn onClick={gerarJwt}>🔐 Gerar payload JWT</Btn>
              <div style={{ marginTop: 8, fontSize: 11, color: dark ? DARK_SUB : "#6b7280", lineHeight: 1.6 }}>
                ⚠️ A assinatura RS256 requer servidor. Use a rota <strong>/token</strong> do app para gerar o token completo.
              </div>
              {!!jwtResult && (
                <div style={{ marginTop: 10, background: dark ? DARK_BG : "#f9fafb", borderRadius: 8, padding: 10,
                  border: `1px solid ${border}`, fontSize: 11, color: dark ? DARK_TEXT : "#374151",
                  fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                  {jwtResult}
                  <button onClick={() => navigator.clipboard?.writeText(jwtResult)}
                    style={{ display: "block", marginTop: 8, padding: "4px 10px", background: G, border: "none",
                      borderRadius: 8, color: "white", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                    📋 Copiar
                  </button>
                </div>
              )}
            </Card>
            <div style={{ background: dark ? "#1a2e1a" : "#f0fdf4", borderRadius: 10, padding: 12, fontSize: 11,
              color: dark ? "#86e68a" : "#374151", lineHeight: 1.7, border: `1px solid ${dark ? "#1a4731" : "#d1fae5"}` }}>
              <strong>Como usar:</strong><br />
              1. Vá para a aba Token do app principal<br />
              2. Preencha CPF, tribunal e cole sua chave PEM<br />
              3. Copie o Bearer Token gerado<br />
              4. Use no Swagger ou cabeçalho Authorization
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PhoneFrame({ children, dark }: { children: React.ReactNode; dark: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", background: dark ? "#090d13" : "#1a1a2e", padding: 20,
    }}>
      <div style={{
        width: 393, background: "#000", borderRadius: 50,
        padding: "12px 8px", boxShadow: "0 40px 100px rgba(0,0,0,0.9)",
        border: "2px solid #2a2a2a",
      }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <div style={{ width: 126, height: 34, background: "#000", borderRadius: 20,
            border: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#1a1a1a" }} />
            <div style={{ width: 72, height: 10, borderRadius: 10, background: "#111" }} />
          </div>
        </div>
        <div style={{ borderRadius: 38, overflow: "hidden", height: 724, background: dark ? DARK_BG : "#f8faf9" }}>
          {children}
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
          <div style={{ width: 128, height: 4, background: "#333", borderRadius: 4 }} />
        </div>
      </div>
    </div>
  );
}

export default function AppMobilePreview() {
  const [tab, setTab] = useState("home");
  const [dark, setDark] = useState(() => isDark());

  function toggleDark() {
    const next = !dark;
    setDark(next);
    setSetting("dark", next ? "1" : "0");
  }

  const tabBg = dark ? DARK_CARD : "white";
  const tabBorder = dark ? DARK_BORDER : "#e5e7eb";

  return (
    <PhoneFrame dark={dark}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflow: "hidden" }}>
          {tab === "home"      && <HomeTab dark={dark} />}
          {tab === "chat"      && <ChatTab dark={dark} />}
          {tab === "historico" && <HistoricoTab dark={dark} />}
          {tab === "config"    && <ConfigTab dark={dark} onToggleDark={toggleDark} />}
        </div>
        <div style={{ display: "flex", borderTop: `1px solid ${tabBorder}`, background: tabBg, flexShrink: 0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, padding: "10px 4px", border: "none", background: "transparent",
                cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <span style={{ fontSize: 20, opacity: tab === t.id ? 1 : 0.35 }}>{t.emoji}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: tab === t.id ? G : dark ? DARK_SUB : "#9ca3af" }}>{t.label}</span>
              {tab === t.id && <div style={{ width: 22, height: 2.5, borderRadius: 2, background: G }} />}
            </button>
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}
