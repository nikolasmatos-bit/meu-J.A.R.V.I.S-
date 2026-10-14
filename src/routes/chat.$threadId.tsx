import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useJarvis } from "../components/jarvis/Bootstrap";
import { ArcReactor } from "../components/jarvis/ArcReactor";
import { MouseTrail } from "../components/jarvis/MouseTrail";
import { MemoryPanel } from "../components/jarvis/MemoryPanel";
import { Conversation } from "../components/ai-elements/conversation";
import { PromptInput } from "../components/ai-elements/prompt-input";
import { SFX } from "../lib/sfx";
import { loadSettings } from "../lib/settings";
import { chatStreamFn } from "../lib/chat.server";
import {
  THEMES,
  MODES,
  applyTheme,
  loadPersona,
  loadMode,
  saveMode,
  type Persona,
  type ReasoningMode,
} from "../lib/theme";

type Msg = { id: string; role: "user" | "assistant"; content: string };
type Fact = { id: string; fact: string; created_at: string };

const PERSONAS_LIST: { id: Persona; label: string; desc: string }[] = [
  { id: "jarvis", label: "J.A.R.V.I.S.", desc: "Elegante, formal, britânico" },
  { id: "friday", label: "F.R.I.D.A.Y.", desc: "Jovem, empática, calorosa" },
  { id: "ultron", label: "ULTRON", desc: "Frio, filosófico, sombrio" },
  { id: "sextafeira", label: "SEXTA-FEIRA", desc: "Brasileira, informal, direta" },
];

const FACT_PATTERNS = [
  /(?:meu nome é|me chamo|pode me chamar de)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/,
  /(?:eu moro em|vivo em|sou de)\s+([^.!?]{2,60})/i,
  /(?:trabalho com|minha profissão é)\s+([^.!?]{3,60})/i,
  /(?:eu gosto de|adoro|amo|prefiro)\s+([^.!?]{2,60})/i,
  /(?:lembre-se que|memorize|anote que)\s+([^.!?]{3,80})/i,
];

function extractFacts(text: string): string[] {
  const facts: string[] = [];
  for (const p of FACT_PATTERNS) {
    const m = text.match(p);
    if (m) {
      const f = text.length < 120 ? text.trim() : m[0].trim();
      if (!facts.includes(f)) facts.push(f);
    }
  }
  return facts.slice(0, 2);
}

export function ChatPage() {
  const { threadId } = useParams({ from: "/chat/$threadId" });
  const { user } = useJarvis();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [state, setState] = useState<"idle" | "thinking" | "speaking">("idle");
  const [streamingText, setStreamingText] = useState("");
  const [listening, setListening] = useState(false);
  const [booted, setBooted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [facts, setFacts] = useState<Fact[]>([]);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [learnedIndicator, setLearnedIndicator] = useState<string | null>(null);
  const [ambientOn, setAmbientOn] = useState(false);
  const [wakeMode, setWakeMode] = useState(false);
  const [wakeDetected, setWakeDetected] = useState(false);
  const [persona, setPersona] = useState<Persona>("jarvis");
  const [mode, setMode] = useState<ReasoningMode>("deep");
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const recognitionRef = useRef<any>(null);
  const wakeRecRef = useRef<any>(null);

  const theme = THEMES[persona];
  const currentMode = MODES[mode];

  useEffect(() => {
    const p = loadPersona();
    setPersona(p);
    applyTheme(p);
    const m = loadMode();
    setMode(m);
  }, []);

  useEffect(() => {
    applyTheme(persona);
  }, [persona]);

  useEffect(() => {
    const t = setTimeout(() => {
      setBooted(true);
      SFX.bootComplete();
    }, 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (state !== "thinking") {
      setElapsed(0);
      return;
    }
    const t = setInterval(() => setElapsed((e) => e + 0.1), 100);
    return () => clearInterval(t);
  }, [state]);

  useEffect(() => {
    if (state !== "thinking") return;
    const t = setInterval(() => SFX.thinkBeep(), 900);
    return () => clearInterval(t);
  }, [state]);

  useEffect(() => {
    if (!ambientOn) return;
    SFX.setAmbientMood(state);
  }, [state, ambientOn]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMemoryOpen(false);
        setPersonaMenuOpen(false);
        setModeMenuOpen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        SFX.buttonPress();
        (async () => {
          const { data, error } = await supabase
            .from("threads")
            .insert({ user_id: user.id, title: "Nova conversa" })
            .select()
            .single();
          if (!error && data)
            navigate({ to: "/chat/$threadId", params: { threadId: data.id } });
        })();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "m") {
        e.preventDefault();
        const order: ReasoningMode[] = ["fast", "deep", "creative", "expert", "debate", "roleplay"];
        const idx = order.indexOf(mode);
        const next = order[(idx + 1) % order.length];
        setMode(next);
        saveMode(next);
        SFX.modeSwitch();
      }
      if (e.key === "F11") {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
          setFullscreen(true);
        } else {
          document.exitFullscreen();
          setFullscreen(false);
        }
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [navigate, user.id, mode]);

  useEffect(() => {
    supabase
      .from("messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .then(({ data }) => data && setMessages(data as Msg[]));
  }, [threadId]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("user_facts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setFacts(data as Fact[]);
      });
  }, [user?.id]);

  const toggleAmbient = () => {
    SFX.buttonPress();
    if (ambientOn) {
      SFX.stopAmbient();
      setAmbientOn(false);
    } else {
      SFX.startAmbient();
      SFX.setAmbientMood(state);
      setAmbientOn(true);
    }
  };

  const toggleWakeMode = () => {
    SFX.buttonPress();
    if (wakeMode) {
      wakeRecRef.current?.stop();
      setWakeMode(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return alert("Reconhecimento de fala não suportado.");
    const rec = new SR();
    rec.lang = "pt-BR";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const t = e.results[e.results.length - 1][0].transcript.trim();
      if (/jarvis|friday|ultron|sexta/i.test(t)) {
        setWakeDetected(true);
        SFX.wakeDetected();
        setTimeout(() => setWakeDetected(false), 1500);
        const clean = t
          .replace(/jarvis|friday|ultron|sexta/gi, "")
          .replace(/^[,.\s]+/, "")
          .trim();
        if (clean) send(clean);
      }
    };
    rec.onend = () => {
      if (wakeMode) {
        try {
          rec.start();
        } catch {}
      }
    };
    rec.start();
    wakeRecRef.current = rec;
    setWakeMode(true);
  };

  const toggleListening = () => {
    SFX.buttonPress();
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return alert("Reconhecimento de fala não suportado.");
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = "pt-BR";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: any) => send(e.results[e.results.length - 1][0].transcript);
    rec.onend = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  };

  const speak = (text: string) => {
    const clean = text.replace(/\[thinking\][\s\S]*?\[\/thinking\]/gi, "").trim();
    const s = loadSettings();
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = "pt-BR";
    utter.rate = 1.05;
    utter.volume = s.volume;
    utter.pitch = theme.voicePitch;
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find((v) => v.lang.startsWith("pt")) ?? voices[0];
    if (ptVoice) utter.voice = ptVoice;
    utter.onstart = () => setState("speaking");
    utter.onend = () => setState("idle");
    window.speechSynthesis.speak(utter);
  };

  const saveLearnedFacts = async (text: string) => {
    if (!user?.id) return;
    const newFacts = extractFacts(text);
    if (newFacts.length === 0) return;
    for (const f of newFacts) {
      if (facts.some((ex) => ex.fact.toLowerCase() === f.toLowerCase())) continue;
      const { data, error } = await supabase
        .from("user_facts")
        .insert({ user_id: user.id, fact: f })
        .select()
        .single();
      if (!error && data) {
        setFacts((p) => [...p, data as Fact]);
        setLearnedIndicator(f);
        SFX.memorySave();
        setTimeout(() => setLearnedIndicator(null), 3500);
      }
    }
  };

  const send = async (text: string) => {
    console.log("[JARVIS] send() chamado com:", text);

    if (!text.trim()) return;

    try { SFX.messageSend(); } catch (e) { console.warn("sfx messageSend falhou", e); }
    try { SFX.sendWhoosh(); } catch (e) { console.warn("sfx sendWhoosh falhou", e); }

    setCommandHistory((h) => [...h, text].slice(-50));
    setHistoryIndex(-1);

    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setState("thinking");
    setStreamingText("");

    console.log("[JARVIS] mensagem adicionada, iniciando stream...");

    saveLearnedFacts(text);

    try {
      const settings = { ...loadSettings(), persona, mode };

      await chatStreamFn(
        {
          messages: next.map((m) => ({ role: m.role, content: m.content })),
          settings,
          facts: facts.map((f) => f.fact),
        },
        (chunk) => {
          setStreamingText((prev) => prev + chunk);
        },
        async (fullText) => {
          console.log("[JARVIS] resposta completa recebida");
          setMessages((m) => [
            ...m,
            { id: crypto.randomUUID(), role: "assistant", content: fullText },
          ]);
          setStreamingText("");
          try { SFX.messageReceive(); } catch {}
          try { SFX.responseDone(); } catch {}
          speak(fullText);
          const title = text.slice(0, 40);
          await supabase
            .from("threads")
            .update({ title, updated_at: new Date().toISOString() })
            .eq("id", threadId)
            .eq("title", "Nova conversa");
        },
        (err) => {
          console.error("[JARVIS] erro no stream:", err);
          try { SFX.error(); } catch {}
          setMessages((m) => [
            ...m,
            { id: crypto.randomUUID(), role: "assistant", content: `Erro: ${err}` },
          ]);
          setStreamingText("");
          setState("idle");
        }
      );
    } catch (err: any) {
      console.error("[JARVIS] catch final:", err);
      try { SFX.error(); } catch {}
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: `Erro: ${err.message}` },
      ]);
      setStreamingText("");
      setState("idle");
    }
  };

  const navigateHistory = (dir: "up" | "down") => {
    if (commandHistory.length === 0) return "";
    let newIdx = historyIndex + (dir === "up" ? 1 : -1);
    if (newIdx < -1) newIdx = -1;
    if (newIdx >= commandHistory.length) newIdx = commandHistory.length - 1;
    setHistoryIndex(newIdx);
    if (newIdx === -1) return "";
    return commandHistory[commandHistory.length - 1 - newIdx];
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col relative overflow-hidden">
      <div className="scanline" />
      <MouseTrail />

      <MemoryPanel
        open={memoryOpen}
        onClose={() => {
          SFX.menuClose();
          setMemoryOpen(false);
        }}
        facts={facts}
        onFactsChange={setFacts}
        userId={user?.id ?? ""}
      />

      <AnimatePresence>
        {learnedIndicator && (
          <motion.div
            key="learned"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-32 right-6 z-[80] max-w-xs"
          >
            <div
              className="p-3 rounded-lg border backdrop-blur-xl"
              style={{
                borderColor: `${theme.primary}88`,
                background: theme.bg,
                boxShadow: `0 0 30px ${theme.glow}`,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-3 h-3 rounded-full border-2 border-t-transparent"
                  style={{ borderColor: theme.primary }}
                />
                <div className="text-[9px] font-mono tracking-widest" style={{ color: theme.primary }}>
                  ▸ MEMÓRIA ATUALIZADA
                </div>
              </div>
              <div className="text-xs text-slate-100 leading-snug">{learnedIndicator}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {wakeDetected && (
          <motion.div
            key="wake"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 2 }}
            className="fixed top-1/4 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
          >
            <div
              className="font-orbitron text-2xl tracking-[0.5em]"
              style={{
                color: theme.primary,
                textShadow: `0 0 20px ${theme.primary}, 0 0 40px ${theme.glow}`,
              }}
            >
              ◉ {theme.name}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {booted && (
        <>
          <div
            className="fixed top-3 left-3 w-8 h-8 border-t-2 border-l-2 z-40 pointer-events-none"
            style={{ borderColor: `${theme.primary}99` }}
          />
          <div
            className="fixed top-3 right-3 w-8 h-8 border-t-2 border-r-2 z-40 pointer-events-none"
            style={{ borderColor: `${theme.primary}99` }}
          />
          <div
            className="fixed bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 z-40 pointer-events-none"
            style={{ borderColor: `${theme.primary}99` }}
          />
          <div
            className="fixed bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 z-40 pointer-events-none"
            style={{ borderColor: `${theme.primary}99` }}
          />
        </>
      )}

      <motion.div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-colors duration-700"
        style={{
          width: "80vmin",
          height: "80vmin",
          background: `radial-gradient(circle, ${theme.bg} 0%, transparent 60%)`,
          filter: "blur(50px)",
          zIndex: 0,
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <AnimatePresence>
        {!booted && (
          <motion.div
            key="boot"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center"
          >
            <div className="text-center">
              <div
                className="font-orbitron text-3xl tracking-[0.5em] animate-pulse"
                style={{ color: theme.primary, textShadow: `0 0 30px ${theme.primary}` }}
              >
                {theme.name}
              </div>
              <div className="text-[10px] text-slate-400 tracking-[0.4em] mt-2 font-mono">
                CARREGANDO {currentMode.name}...
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {booted && (
        <div className="absolute top-32 left-6 space-y-3 z-20 hidden lg:block">
          <StatusBar label="CPU" color={theme.primary} />
          <StatusBar label="MEM" color={theme.accent} />
          <StatusBar label="NET" color={theme.primary} />
        </div>
      )}

      {booted && (
        <div className="absolute top-32 right-6 z-20 hidden lg:block">
          <Radar color={theme.primary} />
        </div>
      )}

      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative z-20 p-4 border-b backdrop-blur-xl bg-slate-950/40 transition-colors duration-700"
        style={{ borderColor: `${theme.primary}33` }}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4 flex-wrap">
          <motion.button
            whileHover={{ x: -4 }}
            onMouseEnter={() => SFX.hover()}
            onClick={() => {
              SFX.buttonPress();
              if (ambientOn) SFX.stopAmbient();
              wakeRecRef.current?.stop();
              navigate({ to: "/" });
            }}
            className="flex items-center gap-3 font-orbitron tracking-widest transition"
            style={{ color: theme.primary, textShadow: `0 0 10px ${theme.primary}` }}
          >
            <span className="text-lg">◄</span>
            <span>VOLTAR</span>
          </motion.button>

          <div className="flex items-center gap-2 flex-wrap">
            {/* PERSONA */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={() => SFX.hover()}
                onClick={() => {
                  const next = !personaMenuOpen;
                  setPersonaMenuOpen(next);
                  setModeMenuOpen(false);
                  if (next) SFX.menuOpen();
                  else SFX.menuClose();
                }}
                className="px-3 py-1.5 rounded border text-[10px] tracking-widest font-mono transition flex items-center gap-2"
                style={{
                  borderColor: `${theme.primary}88`,
                  color: theme.primary,
                  background: theme.bg,
                  boxShadow: `0 0 15px ${theme.glow}`,
                }}
              >
                {theme.emoji} {theme.name}
                <motion.span animate={{ rotate: personaMenuOpen ? 180 : 0 }} className="text-[8px]">
                  ▼
                </motion.span>
              </motion.button>
              <AnimatePresence>
                {personaMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-2 right-0 z-[100] bg-slate-950/95 border border-cyan-500/30 rounded-lg p-2 min-w-[240px] backdrop-blur-xl shadow-2xl"
                  >
                    <div className="text-[9px] tracking-widest text-slate-500 font-mono px-3 py-1 mb-1">
                      ▸ PERSONA
                    </div>
                    {PERSONAS_LIST.map((p) => {
                      const pT = THEMES[p.id];
                      const active = persona === p.id;
                      return (
                        <button
                          key={p.id}
                          onMouseEnter={() => SFX.hover()}
                          onClick={() => {
                            setPersona(p.id);
                            SFX.personaSwitch();
                            setPersonaMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded transition flex items-start gap-3 mb-1 ${
                            active ? "bg-slate-800/80" : "hover:bg-slate-800/60"
                          }`}
                          style={{
                            borderLeft: active ? `3px solid ${pT.primary}` : "3px solid transparent",
                          }}
                        >
                          <span className="text-lg" style={{ color: pT.primary }}>
                            {pT.emoji}
                          </span>
                          <div className="flex-1">
                            <div className="text-xs font-bold tracking-widest" style={{ color: pT.primary }}>
                              {p.label}
                            </div>
                            <div className="text-[9px] text-slate-500 mt-0.5">{p.desc}</div>
                          </div>
                          {active && (
                            <span className="text-[10px]" style={{ color: pT.primary }}>
                              ●
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* MODO */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={() => SFX.hover()}
                onClick={() => {
                  const next = !modeMenuOpen;
                  setModeMenuOpen(next);
                  setPersonaMenuOpen(false);
                  if (next) SFX.menuOpen();
                  else SFX.menuClose();
                }}
                className="px-3 py-1.5 rounded border text-[10px] tracking-widest font-mono transition flex items-center gap-2"
                style={{
                  borderColor: `${currentMode.color}88`,
                  color: currentMode.color,
                  background: `${currentMode.color}11`,
                }}
              >
                {currentMode.emoji} {currentMode.name}
                <motion.span animate={{ rotate: modeMenuOpen ? 180 : 0 }} className="text-[8px]">
                  ▼
                </motion.span>
              </motion.button>
              <AnimatePresence>
                {modeMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-2 right-0 z-[100] bg-slate-950/95 border border-cyan-500/30 rounded-lg p-2 min-w-[240px] backdrop-blur-xl shadow-2xl"
                  >
                    <div className="text-[9px] tracking-widest text-slate-500 font-mono px-3 py-1 mb-1">
                      ▸ MODO DE RACIOCÍNIO
                    </div>
                    {Object.values(MODES).map((m) => {
                      const active = mode === m.id;
                      return (
                        <button
                          key={m.id}
                          onMouseEnter={() => SFX.hover()}
                          onClick={() => {
                            setMode(m.id);
                            saveMode(m.id);
                            SFX.modeSwitch();
                            setModeMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded transition flex items-start gap-3 mb-1 ${
                            active ? "bg-slate-800/80" : "hover:bg-slate-800/60"
                          }`}
                          style={{
                            borderLeft: active ? `3px solid ${m.color}` : "3px solid transparent",
                          }}
                        >
                          <span className="text-lg" style={{ color: m.color }}>
                            {m.emoji}
                          </span>
                          <div className="flex-1">
                            <div className="text-xs font-bold tracking-widest" style={{ color: m.color }}>
                              {m.name}
                            </div>
                            <div className="text-[9px] text-slate-500 mt-0.5">{m.desc}</div>
                          </div>
                          {active && (
                            <span className="text-[10px]" style={{ color: m.color }}>
                              ●
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={() => SFX.hover()}
              onClick={toggleAmbient}
              className="px-3 py-1.5 rounded border text-[10px] tracking-widest font-mono transition"
              style={{
                borderColor: ambientOn ? theme.primary : `${theme.primary}55`,
                color: theme.primary,
                background: ambientOn ? theme.bg : "transparent",
              }}
            >
              {ambientOn ? "🔊" : "🔇"}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={() => SFX.hover()}
              onClick={toggleWakeMode}
              className={`px-3 py-1.5 rounded border text-[10px] tracking-widest font-mono transition flex items-center gap-1.5 ${
                wakeMode ? "animate-pulse" : ""
              }`}
              style={{
                borderColor: wakeMode ? "#ef4444" : `${theme.primary}55`,
                color: wakeMode ? "#ef4444" : theme.primary,
                background: wakeMode ? "rgba(239,68,68,0.1)" : "transparent",
              }}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${wakeMode ? "bg-red-400" : "bg-slate-600"}`} />
              {wakeMode ? "WAKE" : "OFF"}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={() => SFX.hover()}
              onClick={() => {
                SFX.buttonPress();
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen();
                  setFullscreen(true);
                } else {
                  document.exitFullscreen();
                  setFullscreen(false);
                }
              }}
              className="px-3 py-1.5 rounded border text-[10px] tracking-widest font-mono transition"
              style={{ borderColor: `${theme.primary}55`, color: theme.primary }}
            >
              {fullscreen ? "⛶ EXIT" : "⛶ FULL"}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={() => SFX.hover()}
              onClick={() => {
                SFX.menuOpen();
                setMemoryOpen(true);
              }}
              className="px-3 py-1.5 rounded border text-[10px] tracking-widest font-mono transition flex items-center gap-2"
              style={{ borderColor: `${theme.primary}88`, color: theme.primary, background: theme.bg }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: theme.primary, boxShadow: `0 0 8px ${theme.primary}` }}
              />
              {facts.length}
            </motion.button>
          </div>
        </div>
      </motion.header>

      {wakeMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center py-2"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border"
            style={{ background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)" }}
          >
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_10px_#ef4444]"
            />
            <span className="font-orbitron text-[10px] tracking-[0.4em] text-red-300">
              DIGA "{theme.name.replace(/\./g, "")}" PARA ATIVAR
            </span>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="py-6 relative z-10"
      >
        <ArcReactor state={state} color={theme.primary} />
      </motion.div>

      <AnimatePresence mode="wait">
        {state === "thinking" && !streamingText && (
          <motion.div
            key="thinking"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center relative z-10 -mt-4 mb-2"
          >
            <div
              className="inline-flex items-center gap-3 px-5 py-2 rounded-full border backdrop-blur-sm"
              style={{ background: theme.bg, borderColor: `${theme.primary}55` }}
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: theme.primary, boxShadow: `0 0 8px ${theme.primary}` }}
                  />
                ))}
              </div>
              <span
                className="font-orbitron text-[10px] tracking-[0.3em]"
                style={{ color: theme.primary }}
              >
                {currentMode.emoji} {currentMode.name} · {elapsed.toFixed(1)}s
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto pb-20 relative z-10">
        <Conversation messages={messages} streamingText={streamingText} />
      </main>

      <motion.footer
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="relative z-20 p-4 border-t backdrop-blur-xl bg-slate-950/40 transition-colors duration-700"
        style={{ borderColor: `${theme.primary}33` }}
      >
        <AnimatePresence>
          {state === "speaking" && (
            <motion.div
              key="wave"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 40 }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-center gap-1 mb-2 overflow-hidden"
            >
              {Array.from({ length: 32 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 rounded-full"
                  style={{ background: theme.primary, boxShadow: `0 0 6px ${theme.primary}` }}
                  animate={{
                    height: [
                      `${20 + Math.random() * 30}%`,
                      `${50 + Math.random() * 50}%`,
                      `${30 + Math.random() * 40}%`,
                      `${60 + Math.random() * 40}%`,
                    ],
                  }}
                  transition={{
                    duration: 0.4 + Math.random() * 0.3,
                    repeat: Infinity,
                    delay: i * 0.02,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <PromptInput
          onSend={send}
          listening={listening}
          onToggleMic={toggleListening}
          disabled={state === "thinking"}
          onHistory={navigateHistory}
          primaryColor={theme.primary}
        />
      </motion.footer>
    </div>
  );
}

function StatusBar({ label, color }: { label: string; color: string }) {
  const [value, setValue] = useState(20 + Math.random() * 60);
  useEffect(() => {
    const i = setInterval(
      () => setValue((v) => Math.max(15, Math.min(95, v + (Math.random() - 0.5) * 8))),
      1500
    );
    return () => clearInterval(i);
  }, []);
  return (
    <div className="w-32">
      <div className="flex justify-between text-[9px] font-mono tracking-widest" style={{ color }}>
        <span>{label}</span>
        <span>{value.toFixed(0)}%</span>
      </div>
      <div className="h-1 bg-slate-900 rounded-sm mt-0.5 overflow-hidden">
        <motion.div
          className="h-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
    </div>
  );
}

function Radar({ color }: { color: string }) {
  return (
    <div className="w-28 h-28 relative">
      {[0, 3, 6, 9, 12].map((i) => (
        <div
          key={i}
          className="absolute rounded-full border"
          style={{ inset: `${i}px`, borderColor: `${color}40` }}
        />
      ))}
      <div
        className="absolute top-1/2 left-1/2 w-1 h-1 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      <div className="radar-sweep absolute inset-0">
        <div
          className="absolute top-1/2 left-1/2 w-14 h-px origin-left"
          style={{
            background: `linear-gradient(90deg, ${color}, transparent)`,
            transform: "translateY(-50%)",
          }}
        />
      </div>
    </div>
  );
}