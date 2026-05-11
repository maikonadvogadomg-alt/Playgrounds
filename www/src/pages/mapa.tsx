import { useState, useEffect } from "react";

type SystemStatus = {
  dbMode: string;
  hasDbUrl: boolean;
  hasGeminiKey: boolean;
  hasOpenAiKey: boolean;
  hasGroqKey: boolean;
  hasPerplexityKey: boolean;
  hasCustom4Key: boolean;
  hasDemoKey: boolean;
  hasAppPassword: boolean;
};

type DbTablesResult = {
  ok: boolean;
  tables: string[];
  error?: string;
};

const EXPECTED_TABLES = [
  "snippets","custom_actions","ementas","ai_history","ai_usage",
  "prompt_templates","doc_templates","processos","settings","pareceres","tramitacoes"
];

function Dot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", borderRadius:8,
      background: ok ? "#f0fdf4" : "#fef9e7", border:`1px solid ${ok ? "#86efac" : "#fde68a"}` }}>
      <span style={{ width:10, height:10, borderRadius:"50%", background: ok ? "#16a34a" : "#f59e0b", flexShrink:0 }} />
      <span style={{ fontSize:13, color: ok ? "#15803d" : "#92400e", fontWeight:600 }}>{label}</span>
      <span style={{ fontSize:11, color: ok ? "#16a34a" : "#b45309", marginLeft:"auto" }}>{ok ? "✓ OK" : "⚠ Não"}</span>
    </div>
  );
}

export default function Mapa() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [dbTables, setDbTables] = useState<DbTablesResult | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [lastCheck, setLastCheck] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  async function checkStatus() {
    setLoadingStatus(true);
    try {
      const r = await fetch("/api/settings/system-status");
      if (r.ok) setStatus(await r.json());
    } catch {}
    setLoadingStatus(false);
    setLastCheck(new Date().toLocaleTimeString("pt-BR"));
  }

  async function checkTables() {
    setLoadingTables(true);
    try {
      const r = await fetch("/api/settings/db-tables");
      if (r.ok) setDbTables(await r.json());
      else setDbTables({ ok: false, tables: [], error: "Sem banco conectado" });
    } catch (e: any) {
      setDbTables({ ok: false, tables: [], error: e.message });
    }
    setLoadingTables(false);
  }

  useEffect(() => { checkStatus(); }, []);

  const pages = [
    { route: "/", name: "Assistente Jurídico", color: "#16a34a", desc: "IA jurídica principal — 6 ações + chat + voz + histórico + templates" },
    { route: "/jurisprudencia", name: "Jurisprudência", color: "#0891b2", desc: "Busca ementas por tribunal e salva na biblioteca" },
    { route: "/comparador", name: "Comparador Jurídico", color: "#7c3aed", desc: "Compara dois documentos com IA" },
    { route: "/auditoria", name: "Auditoria Financeira", color: "#b45309", desc: "Calculadora: TJMG + BCB + memorial de cálculo Word/PDF" },
    { route: "/consulta", name: "Consulta Processual", color: "#0f766e", desc: "Busca processo por CNJ em qualquer tribunal (DataJud)" },
    { route: "/painel", name: "Painel de Processos", color: "#0369a1", desc: "Dashboard para monitorar processos salvos no banco" },
    { route: "/corporativo", name: "Consulta Corporativo", color: "#4338ca", desc: "Advogados por CPF/OAB e magistrados por tribunal (CNJ)" },
    { route: "/pdpj", name: "Consulta PDPJ", color: "#be185d", desc: "API PDPJ autenticada — citações, intimações, representados" },
    { route: "/comunicacoes", name: "Comunicações CNJ", color: "#0f766e", desc: "ComunicaAPI: busca citações/intimações + download certidão PDF" },
    { route: "/tramitacao", name: "Tramitação / Webhook", color: "#92400e", desc: "Recebe webhooks de movimentação processual" },
    { route: "/filtrador", name: "Filtrador Jurídico", color: "#1d4ed8", desc: "Extrai partes relevantes de documentos extensos com IA" },
    { route: "/previdenciario", name: "Previdenciário", color: "#15803d", desc: "Assistente especializado INSS — análise e recursos" },
    { route: "/robo-djen", name: "Robô DJEN", color: "#7c3aed", desc: "Interface para Domicílio Judicial Eletrônico (CNJ)" },
    { route: "/codigo", name: "Assistente de Código", color: "#0e7490", desc: "IA para código — usa APENAS sua chave, sem créditos Replit" },
    { route: "/playground", name: "HTML Playground", color: "#b45309", desc: "Editor HTML/CSS/JS/React/Python com preview ao vivo" },
    { route: "/token", name: "Gerador JWT", color: "#6d28d9", desc: "Gera tokens JWT RS256 para PDPJ/PJUD" },
    { route: "/configuracoes", name: "Configurações", color: "#374151", desc: "Chaves de IA, banco Neon, senha, status do sistema" },
  ];

  const apiGroups = [
    { label: "IA", color: "#7c3aed", apis: ["POST /api/ai/process","POST /api/ai/refine","POST /api/demo-key-test","POST /api/settings/test-ai-key"] },
    { label: "Arquivos", color: "#0891b2", apis: ["POST /api/import/url (PDF/Word/áudio/vídeo)","POST /api/export/word","POST /api/export/word-with-template","POST /api/tts","POST /api/voice-chat"] },
    { label: "Banco / Config", color: "#0369a1", apis: ["GET|PUT /api/settings/ai-config","GET /api/settings/system-status","GET /api/settings/db-tables","POST /api/settings/database-reconnect","PUT /api/settings/app-password"] },
    { label: "Jurídico", color: "#16a34a", apis: ["GET|POST|DELETE /api/ementas","GET|POST|DELETE /api/ai-history","GET|POST|DELETE /api/custom-actions","GET|POST|DELETE /api/prompt-templates","GET|POST|DELETE /api/doc-templates","GET|POST|DELETE /api/processos"] },
    { label: "Tribunais", color: "#b45309", apis: ["POST /api/datajud/consulta","POST /api/datajud/consulta-oab","GET /api/datajud/tribunais","POST /api/jurisprudencia/buscar","GET /api/tjmg/fatores","GET /api/corporativo/*"] },
    { label: "PDPJ / CNJ", color: "#be185d", apis: ["POST /api/pdpj/test-connection","POST /api/pdpj/comunicacoes","POST /api/pdpj/representados","POST /api/cnj/comunicacoes","GET /api/cnj/comunicacoes/certidao/:hash","POST /api/jwt/generate"] },
    { label: "Playground / Misc", color: "#0f766e", apis: ["GET|POST|DELETE /api/snippets","POST /api/share/parecer","GET /parecer/:id","POST /api/webhooks/tramitacao","GET|POST /api/settings/:key"] },
  ];

  const dbExpected = [
    { name: "snippets", desc: "Código do Playground" },
    { name: "custom_actions", desc: "Ações personalizadas" },
    { name: "ementas", desc: "Jurisprudência salva" },
    { name: "ai_history", desc: "Histórico de IA" },
    { name: "ai_usage", desc: "Controle de créditos" },
    { name: "prompt_templates", desc: "Templates de prompt" },
    { name: "doc_templates", desc: "Templates de documento" },
    { name: "processos", desc: "Processos monitorados" },
    { name: "settings", desc: "Configurações gerais" },
    { name: "pareceres", desc: "Pareceres compartilhados" },
    { name: "tramitacoes", desc: "Webhooks de tramitação" },
  ];

  const aiFlow = [
    { n: "1", t: "Usuário envia texto/arquivo", d: "Frontend → POST /api/ai/process com chave + modelo + prompt" },
    { n: "2", t: "Verifica chave", d: "Chave própria → usa ela. Sem chave → demo key → Replit. Tudo falhou → erro." },
    { n: "3", t: "Auto-detecta provedor", d: "AIzaSy... = Gemini. gsk_ = Groq. sk- = OpenAI. URL custom = qualquer API compatível." },
    { n: "4", t: "Streaming", d: "Resposta chega palavra por palavra via SSE. Frontend exibe em tempo real." },
    { n: "5", t: "Salva histórico", d: "POST /api/ai-history → banco PostgreSQL ou memória temporária." },
    { n: "6", t: "Refinamento", d: "POST /api/ai/refine envia todo o histórico para a IA ter contexto completo." },
  ];

  const isMemory = status?.dbMode === "memory" || !status?.hasDbUrl;

  return (
    <div style={{ fontFamily:"system-ui,sans-serif", background:"#f1f5f9", minHeight:"100vh", padding:"20px 12px" }}>
      <div style={{ maxWidth:960, margin:"0 auto" }}>

        {/* ── HEADER ── */}
        <div style={{ background:"#15803d", color:"white", borderRadius:12, padding:"20px 24px", marginBottom:24 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
            <div>
              <h1 style={{ margin:0, fontSize:24, fontWeight:800 }}>🗺️ Mapa + Diagnóstico ao Vivo</h1>
              <p style={{ margin:"6px 0 0", opacity:0.85, fontSize:13 }}>
                Assistente Jurídico · Maikon Caldeira · {lastCheck ? `Verificado às ${lastCheck}` : "Carregando..."}
              </p>
            </div>
            <button onClick={checkStatus} disabled={loadingStatus}
              style={{ background:"rgba(255,255,255,0.2)", border:"none", color:"white", borderRadius:8,
                padding:"8px 16px", cursor:"pointer", fontSize:13, fontWeight:600 }}>
              {loadingStatus ? "⟳ Verificando..." : "⟳ Atualizar Status"}
            </button>
          </div>
          <div style={{ display:"flex", gap:10, marginTop:14, flexWrap:"wrap" }}>
            {[
              `📄 ${pages.length} páginas`,
              "🔌 60+ endpoints API",
              `🗄️ ${dbExpected.length} tabelas no banco`,
              "🤖 4 provedores de IA",
            ].map(t => (
              <span key={t} style={{ background:"rgba(255,255,255,0.2)", borderRadius:8, padding:"4px 12px", fontSize:12 }}>{t}</span>
            ))}
          </div>
        </div>

        {/* ── DIAGNÓSTICO AO VIVO ── */}
        <div style={{ background:"white", borderRadius:12, border:"2px solid #e2e8f0", padding:20, marginBottom:24 }}>
          <h2 style={{ margin:"0 0 16px", fontSize:17, color:"#1e293b" }}>🔍 Diagnóstico ao Vivo</h2>

          {!status ? (
            <p style={{ color:"#94a3b8", textAlign:"center", padding:20 }}>Carregando status...</p>
          ) : (
            <div>
              {/* Alerta banco */}
              {isMemory && (
                <div style={{ background:"#fef3c7", border:"1px solid #fbbf24", borderRadius:8,
                  padding:"10px 14px", marginBottom:16, fontSize:13, color:"#92400e" }}>
                  ⚠️ <strong>Banco em memória</strong> — dados somem ao reiniciar. Configure o Neon em{" "}
                  <a href="/configuracoes" style={{ color:"#b45309", fontWeight:600 }}>/configuracoes</a>
                </div>
              )}

              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:8, marginBottom:16 }}>
                <Dot ok={!isMemory} label="Banco PostgreSQL" />
                <Dot ok={status.hasGeminiKey} label="Gemini (Google)" />
                <Dot ok={status.hasGroqKey} label="Groq (Llama)" />
                <Dot ok={status.hasOpenAiKey} label="OpenAI (GPT)" />
                <Dot ok={status.hasPerplexityKey} label="Perplexity" />
                <Dot ok={status.hasCustom4Key} label="4ª Chave Custom" />
                <Dot ok={status.hasDemoKey} label="Chave Demo" />
                <Dot ok={status.hasAppPassword} label="Senha do App" />
              </div>

              {/* Botão verificar tabelas */}
              <button onClick={checkTables} disabled={loadingTables || isMemory}
                style={{ background: isMemory ? "#e2e8f0" : "#0369a1", color: isMemory ? "#94a3b8" : "white",
                  border:"none", borderRadius:8, padding:"9px 18px", cursor: isMemory ? "not-allowed" : "pointer",
                  fontSize:13, fontWeight:600, marginBottom: dbTables ? 12 : 0 }}>
                {loadingTables ? "⟳ Verificando tabelas..." : isMemory ? "⚠ Sem banco — configure Neon primeiro" : "🗄️ Verificar Tabelas do Banco"}
              </button>

              {dbTables && (
                <div style={{ marginTop:12 }}>
                  {!dbTables.ok ? (
                    <div style={{ background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:8,
                      padding:"10px 14px", fontSize:13, color:"#dc2626" }}>
                      ✗ Erro ao consultar tabelas: {dbTables.error}
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize:13, color:"#64748b", marginBottom:8 }}>
                        {dbTables.tables.length} tabelas encontradas no banco:
                      </p>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:6 }}>
                        {dbExpected.map(t => {
                          const exists = dbTables.tables.includes(t.name);
                          return (
                            <div key={t.name} style={{ display:"flex", alignItems:"center", gap:8,
                              padding:"6px 10px", borderRadius:8, background: exists ? "#f0fdf4" : "#fef2f2",
                              border:`1px solid ${exists ? "#86efac" : "#fca5a5"}` }}>
                              <span style={{ fontSize:13 }}>{exists ? "✓" : "✗"}</span>
                              <div>
                                <div style={{ fontFamily:"monospace", fontSize:12, fontWeight:700,
                                  color: exists ? "#15803d" : "#dc2626" }}>{t.name}</div>
                                <div style={{ fontSize:11, color:"#64748b" }}>{t.desc}</div>
                              </div>
                            </div>
                          );
                        })}
                        {dbTables.tables.filter(t => !EXPECTED_TABLES.includes(t)).map(t => (
                          <div key={t} style={{ display:"flex", alignItems:"center", gap:8,
                            padding:"6px 10px", borderRadius:8, background:"#f8fafc", border:"1px solid #e2e8f0" }}>
                            <span style={{ fontSize:13 }}>📋</span>
                            <div style={{ fontFamily:"monospace", fontSize:12, color:"#64748b" }}>{t} (extra)</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── ÍNDICE ── */}
        <div style={{ background:"white", borderRadius:12, border:"1px solid #e2e8f0", padding:20, marginBottom:24 }}>
          <h2 style={{ margin:"0 0 14px", fontSize:17, color:"#1e293b" }}>📋 Índice — Todas as Páginas</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:8 }}>
            {pages.map(p => (
              <a key={p.route} href={p.route}
                style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px",
                  borderRadius:8, background:"#f8fafc", border:"1px solid #e2e8f0", textDecoration:"none" }}>
                <span style={{ width:10, height:10, borderRadius:"50%", background:p.color, flexShrink:0 }} />
                <div>
                  <div style={{ fontWeight:600, fontSize:12, color:"#1e293b" }}>{p.name}</div>
                  <div style={{ fontSize:11, color:"#64748b", fontFamily:"monospace" }}>{p.route}</div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* ── PÁGINAS DETALHADAS ── */}
        <h2 style={{ fontSize:18, color:"#1e293b", marginBottom:14 }}>📄 Páginas — O que cada uma faz</h2>
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:28 }}>
          {pages.map(p => (
            <div key={p.route} style={{ background:"white", borderRadius:10,
              borderLeft:`4px solid ${p.color}`, padding:"12px 16px", display:"flex", alignItems:"flex-start", gap:12 }}>
              <a href={p.route} style={{ fontFamily:"monospace", fontSize:12, color:p.color, fontWeight:700,
                background:`${p.color}15`, padding:"2px 8px", borderRadius:6, textDecoration:"none", whiteSpace:"nowrap" }}>
                {p.route}
              </a>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>{p.name}</div>
                <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── APIS ── */}
        <h2 style={{ fontSize:18, color:"#1e293b", marginBottom:14 }}>🔌 Endpoints de API</h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:12, marginBottom:28 }}>
          {apiGroups.map(g => (
            <div key={g.label} style={{ background:"white", borderRadius:10, border:"1px solid #e2e8f0", overflow:"hidden" }}>
              <div style={{ background:g.color, color:"white", padding:"8px 14px", fontWeight:700, fontSize:13 }}>{g.label}</div>
              <div style={{ padding:"10px 14px" }}>
                {g.apis.map(a => (
                  <div key={a} style={{ fontFamily:"monospace", fontSize:11, color:"#374151",
                    padding:"3px 0", borderBottom:"1px solid #f1f5f9" }}>{a}</div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── BANCO ── */}
        <h2 style={{ fontSize:18, color:"#1e293b", marginBottom:14 }}>🗄️ Tabelas do Banco</h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:10, marginBottom:28 }}>
          {dbExpected.map(t => (
            <div key={t.name} style={{ background:"white", borderRadius:10, border:"1px solid #e2e8f0", padding:"12px 14px" }}>
              <div style={{ fontFamily:"monospace", fontWeight:700, fontSize:13, color:"#0f172a" }}>{t.name}</div>
              <div style={{ fontSize:12, color:"#64748b", marginTop:3 }}>{t.desc}</div>
            </div>
          ))}
        </div>

        {/* ── FLUXO IA ── */}
        <h2 style={{ fontSize:18, color:"#1e293b", marginBottom:14 }}>🤖 Fluxo da IA (passo a passo)</h2>
        <div style={{ background:"white", borderRadius:12, border:"1px solid #e2e8f0", padding:20, marginBottom:28 }}>
          {aiFlow.map((s, i) => (
            <div key={s.n} style={{ display:"flex", gap:14, marginBottom: i < aiFlow.length-1 ? 14 : 0, alignItems:"flex-start" }}>
              <div style={{ width:30, height:30, borderRadius:"50%", background:"#16a34a", color:"white",
                display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, flexShrink:0 }}>{s.n}</div>
              <div>
                <div style={{ fontWeight:700, fontSize:13, color:"#1e293b" }}>{s.t}</div>
                <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── PERSISTÊNCIA ── */}
        <h2 style={{ fontSize:18, color:"#1e293b", marginBottom:14 }}>💾 O que fica salvo onde</h2>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:28 }}>
          {[
            { title:"🗄️ Banco (PostgreSQL / Neon)", color:"#16a34a", items:["Histórico de IA","Ementas / jurisprudência","Processos monitorados","Snippets do Playground","Templates de documento","Templates de prompt","Ações personalizadas da IA","Configurações do sistema","Pareceres compartilhados","Tramitações recebidas"] },
            { title:"📱 Navegador (localStorage)", color:"#0891b2", items:["Preferências de formatação","Histórico do Assistente de Código","Rascunho do texto (auto-save)","Tema claro / escuro","Auto-save do Playground"] },
          ].map(col => (
            <div key={col.title} style={{ background:"white", borderRadius:10, border:`2px solid ${col.color}25`, padding:16 }}>
              <div style={{ fontWeight:700, color:col.color, marginBottom:10, fontSize:13 }}>{col.title}</div>
              {col.items.map(it => (
                <div key={it} style={{ fontSize:12, color:"#374151", padding:"4px 0", borderBottom:"1px solid #f8fafc" }}>✅ {it}</div>
              ))}
            </div>
          ))}
        </div>

        {/* ── CONFIGURAÇÕES ── */}
        <div style={{ background:"white", borderRadius:12, border:"2px solid #6d28d920", padding:20, marginBottom:24 }}>
          <h2 style={{ margin:"0 0 14px", fontSize:17, color:"#1e293b" }}>⚙️ O que a página de Configurações faz</h2>
          {[
            { campo:"Campo de chave Gemini (AIzaSy...)", acao:"Salva em local-config.json → servidor usa nas chamadas IA" },
            { campo:"Campo de chave Groq (gsk_...)", acao:"Salva em local-config.json → servidor usa nas chamadas IA" },
            { campo:"Campo de chave OpenAI (sk-...)", acao:"Salva em local-config.json → servidor usa nas chamadas IA" },
            { campo:"Campo 4ª Chave + URL + Modelo", acao:"Permite usar qualquer API compatível (OpenRouter, Mistral, etc.)" },
            { campo:"Botão 🧪 (tubo de ensaio) ao lado de cada chave", acao:"Chama /api/settings/test-ai-key → testa a chave na hora → mostra ✓ ou ✗" },
            { campo:"Botão 'Salvar Todas as Chaves'", acao:"PUT /api/settings/ai-config → salva TODAS as chaves de uma vez" },
            { campo:"Campo URL Neon (postgresql://...)", acao:"Conecta ao banco, cria as tabelas automaticamente via Drizzle" },
            { campo:"Botão 'Conectar e Criar Tabelas'", acao:"POST /api/settings/database-reconnect → reconecta e roda migrations" },
            { campo:"Campo senha do app + botão salvar", acao:"PUT /api/settings/app-password → protege o acesso ao app" },
            { campo:"⟳ Atualizar (ícone topo direito)", acao:"GET /api/settings/system-status → mostra quais chaves estão configuradas" },
          ].map((r, i) => (
            <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10,
              padding:"8px 0", borderBottom: i < 9 ? "1px solid #f1f5f9" : "none" }}>
              <div style={{ fontSize:12, fontWeight:600, color:"#374151" }}>{r.campo}</div>
              <div style={{ fontSize:12, color:"#64748b" }}>→ {r.acao}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign:"center", color:"#94a3b8", fontSize:12, paddingBottom:32 }}>
          Assistente Jurídico · Maikon Caldeira · mapa gerado automaticamente
        </div>
      </div>
    </div>
  );
}
