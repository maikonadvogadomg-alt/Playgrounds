import { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic, MicOff, Volume2, VolumeX, Settings, Trash2,
  ArrowLeft, StopCircle, Loader2, Send, ChevronDown
} from "lucide-react";
import { Link } from "wouter";
import { callAI, CAMPO_LIVRE_SYSTEM } from "@/lib/ai-service";
import { hasApiKey } from "@/lib/settings";
import { SettingsPanel } from "@/components/settings-panel";

interface Message {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default function CampoLivre() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [voicePanelOpen, setVoicePanelOpen] = useState(false);

  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [ttsEnabled, setTtsEnabled] = useState(true);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(1.0);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, transcript]);

  useEffect(() => {
    function loadVoices() {
      const v = window.speechSynthesis.getVoices();
      const pt = v.filter(x => x.lang.startsWith("pt") || x.name.toLowerCase().includes("portuguese"));
      const all = pt.length > 0 ? pt : v;
      setVoices(all);
      if (!selectedVoice && all.length > 0) {
        const best = all.find(x =>
          x.name.toLowerCase().includes("neural") ||
          x.name.toLowerCase().includes("wavenet") ||
          x.name.includes("Google") ||
          x.name.includes("Microsoft")
        );
        setSelectedVoice((best || all[0]).name);
      }
    }
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const speak = useCallback((text: string) => {
    if (!ttsEnabled) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) u.voice = voice;
    u.lang = voice?.lang || "pt-BR";
    u.rate = rate;
    u.pitch = pitch;
    u.volume = volume;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }, [ttsEnabled, voices, selectedVoice, rate, pitch, volume]);

  const doSend = useCallback(async (text: string) => {
    const clean = text.trim();
    if (!clean || loading) return;
    if (!hasApiKey()) { setSettingsOpen(true); return; }

    const userMsg: Message = { role: "user", content: clean, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTranscript("");
    setLoading(true);
    stopSpeaking();

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const reply = await callAI(history as any, CAMPO_LIVRE_SYSTEM);
      setMessages(prev => [...prev, { role: "assistant", content: reply, ts: Date.now() }]);
      speak(reply);
    } catch (err: any) {
      const msg = `❌ Erro: ${err.message || "Sem resposta."}`;
      setMessages(prev => [...prev, { role: "assistant", content: msg, ts: Date.now() }]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [loading, messages, speak]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      doSend(input);
    }
  };

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Use o Chrome ou o APK para reconhecimento de voz."); return; }
    stopSpeaking();
    const rec = new SR();
    rec.lang = "pt-BR";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "", final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      setTranscript(final || interim);
      if (final) { rec.stop(); doSend(final); }
    };
    rec.onerror = () => { setListening(false); setTranscript(""); };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
  }, [doSend]);

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false); };

  const micColor = listening
    ? "bg-red-500 shadow-lg shadow-red-500/40 animate-pulse"
    : speaking
    ? "bg-emerald-500 shadow-lg shadow-emerald-500/40"
    : "bg-primary hover:opacity-90";

  return (
    <>
      <div className="bg-background fixed inset-0 flex flex-col overflow-hidden z-50">

        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card flex-shrink-0">
          <Link href="/juridico">
            <button className="p-2 rounded-lg hover:bg-accent transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-foreground">Iara</h1>
            <p className="text-xs text-muted-foreground truncate">
              {listening ? "🔴 Ouvindo..." : speaking ? "🟢 Falando..." : "Voz ou texto — como preferir"}
            </p>
          </div>
          <button onClick={() => setTtsEnabled(e => !e)} className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
            {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button onClick={() => setVoicePanelOpen(v => !v)} className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
            <Settings className="w-4 h-4" />
          </button>
          <button onClick={() => { setMessages([]); stopSpeaking(); }} className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Voice settings */}
        {voicePanelOpen && (
          <div className="bg-card border-b border-border px-4 py-3 flex-shrink-0 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Voz neural</label>
              <div className="relative">
                <select
                  value={selectedVoice}
                  onChange={e => setSelectedVoice(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-border bg-input px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {voices.map(v => (
                    <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                  ))}
                  {voices.length === 0 && <option value="">Carregando vozes...</option>}
                </select>
                <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Velocidade {rate.toFixed(1)}×</label>
                <input type="range" min="0.5" max="2" step="0.1" value={rate} onChange={e => setRate(+e.target.value)} className="w-full accent-primary" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Tom {pitch.toFixed(1)}</label>
                <input type="range" min="0.5" max="2" step="0.1" value={pitch} onChange={e => setPitch(+e.target.value)} className="w-full accent-primary" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Volume {Math.round(volume * 100)}%</label>
                <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => setVolume(+e.target.value)} className="w-full accent-primary" />
              </div>
            </div>
            <button onClick={() => speak("Olá, sou a Iara. Estou pronta para te ajudar.")}
              className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent transition-colors">
              🔊 Testar voz
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ WebkitOverflowScrolling: "touch" } as any}>
          {messages.length === 0 && !transcript && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-4 pb-8">
              <div className="text-6xl">🎙️</div>
              <p className="font-semibold text-lg text-foreground">Iara está pronta</p>
              <p className="text-sm max-w-xs">Fale pelo microfone ou digite abaixo. Ela responde em voz alta.</p>
              {!hasApiKey() && (
                <button onClick={() => setSettingsOpen(true)}
                  className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90">
                  Configurar chave de API →
                </button>
              )}
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <button onClick={() => speak(msg.content)}
                  className="mr-2 mt-1 flex-shrink-0 p-1.5 rounded-full hover:bg-accent transition-colors text-muted-foreground">
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              )}
              <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm border border-border"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {transcript && (
            <div className="flex justify-end">
              <div className="max-w-[82%] rounded-2xl px-4 py-3 text-sm bg-primary/30 text-foreground border border-primary/50 italic">
                {transcript}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Iara está pensando...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Bottom bar: mic + text input + send */}
        <div className="flex-shrink-0 border-t border-border bg-card px-3 py-3 space-y-2"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}>

          {speaking && (
            <div className="flex items-center justify-center gap-2 text-emerald-500 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Iara está falando —
              <button onClick={stopSpeaking} className="flex items-center gap-1 underline underline-offset-2">
                <StopCircle className="w-3 h-3" /> parar
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            {/* Mic button */}
            <button
              onClick={listening ? stopListening : startListening}
              disabled={loading}
              className={`w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 text-white ${micColor}`}
            >
              {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Text input */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Digite aqui ou use o microfone..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-border bg-input px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[44px] max-h-32"
              style={{ height: "auto" }}
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = Math.min(t.scrollHeight, 128) + "px";
              }}
            />

            {/* Send button */}
            <button
              onClick={() => doSend(input)}
              disabled={!input.trim() || loading}
              className="w-11 h-11 bg-primary text-primary-foreground rounded-xl flex-shrink-0 flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 active:scale-95"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
