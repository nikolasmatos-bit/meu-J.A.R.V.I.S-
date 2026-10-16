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

const PERSONAS_LIST: { id: Persona; label: string; code: string }[] = [
  { id: "jarvis", label: "J.A.R.V.I.S.", code: "JVS-04" },
  { id: "friday", label: "F.R.I.D.A.Y.", code: "FRD-05" },
  { id: "ultron", label: "ULTRON", code: "ULT-06" },
  { id: "sextafeira", label: "SEXTA-FEIRA", code: "SXT-07" },
];

const FACT_PATTERNS = [
  /(?:meu nome é|me chamo|pode me chamar de)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/,
  /(?:eu moro em|vivo em|sou de)\s+([^.!?]{2,60})/i,
  /(?:trabalho com|minha profissão é)\s+([^.!?]{2,60})/i,
  /(?:eu gosto de|adoro|amo|prefiro)\s+([^.!?]{2,60})/i,
  /(?:lembre-se que|memorize|anote que)\s+([^.!?]{2,80})/i,
];

function extractFacts(text: string): string[] {
  const facts: string[] = [];
  for (const p of FACT_PATTERNS) {
    const m = text.match(p);
    if (m) {
      const f = (m[1] ?? m[0]).trim();
      if (f.length < 100 && !facts.includes(f)) facts.push(f);
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
  const [mode, setMode] = useState<ReasoningMode>("fast");
  const [personaOpen, setPersonaOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [time, setTime] = useState(new Date());
  const recognitionRef = useRef<any>(null);
  const wakeRecRef = useRef<any>(null);
  const wakeModeRef = useRef(false);
  const savingFactsRef = useRef(false);

  const theme = THEMES[persona];
  const currentMode = MODES[mode];
  const currentPersona = PERSONAS_LIST.find((p) => p.id === persona)!;

  useEffect(() => {
    const p = loadPersona();
    setPersona(p);
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
    }, 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
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
    if (!booted) return;
    const logs = [
      "processor :: response cycle OK",
      "memory :: neural link stable",
      "voice :: TTS engine ready",
      "network :: uplink 99.2%",
      "core :: thermal nominal",
    ];
    let i = 0;
    const t = setInterval(() => {
      setTerminalLines((prev) => [
        ...prev.slice(-3),
        `[${new Date().toLocaleTimeString("pt-BR")}] ${logs[i % logs.length]}`,
      ]);
      i++;
    }, 4000);
    return () => clearInterval(t);
  }, [booted]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMemoryOpen(false);
        setPersonaOpen(false);
        setModeOpen(false);
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
          if (!error && data) navigate({ to: "/chat/$threadId", params: { threadId: data.id } });
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
      wakeModeRef.current = false;
      wakeRecRef.current?.stop();
      setWakeMode(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return alert("Reconhecimento de voz não suportado.");
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
        const clean = t.replace(/jarvis|friday|ultron|sexta/gi, "").replace(/^[,.\s]+/, "").trim();
        if (clean) send(clean);
      }
    };
    rec.onend = () => {
      if (wakeModeRef.current) {
        try {
          rec.start();
        } catch {}
      }
    };
    rec.start();
    wakeRecRef.current = rec;
    wakeModeRef.current = true;
    setWakeMode(true);
  };

  const toggleListening = () => {
    SFX.buttonPress();
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return alert("Reconhecimento de voz não suportado.");
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
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = "pt-BR";
    utter.rate = 1.05;
    utter.volume = s.volume;
    utter.pitch = theme.voicePitch;
    const voices = window.speechSynthesis.getVoices();
    const pt = voices.find((v) => v.lang.startsWith("pt")) ?? voices[0];
    if (pt) utter.voice = pt;
    utter.onstart = () => setState("speaking");
    utter.onend = () => setState("idle");
    window.speechSynthesis.speak(utter);
  };

  const saveLearnedFacts = async (text: string) => {
    if (!user?.id || savingFactsRef.current) return;
    savingFactsRef.current = true;
    try {
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
    } finally {
      savingFactsRef.current = false;
    }
  };

  const send = async (text: string) => {
    if (!text.trim()) return;
    try { SFX.messageSend(); } catch {}
    try { SFX.sendWhoosh(); } catch {}

    setCommandHistory((h) => [...h, text].slice(-50));
    setHistoryIndex(-1);

    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setState("thinking");
    setStreamingText("");

    const safetyTimeout = setTimeout(() => {
      setStreamingText("");
      setState("idle");
      try { SFX.error(); } catch {}
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: "⚠️ Tempo esgotado. Tente novamente." },
      ]);
    }, 45000);

    saveLearnedFacts(text);

    try {
      const settings = {
        ...loadSettings(),
        persona,
        mode,
        temperature: MODES[mode].temperature,
      };
      await chatStreamFn(
        {
          messages: next.map((m) => ({ role: m.role, content: m.content })),
          settings,
          facts: facts.map((f) => f.fact),
        },
        (chunk) => setStreamingText((prev) => prev + chunk),
        async (fullText) => {
          clearTimeout(safetyTimeout);
          setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: fullText }]);
          setStreamingText("");
          try { SFX.messageReceive(); } catch {}
          try { SFX.responseDone(); } catch {}
          speak(fullText);
          await supabase
            .from("threads")
            .update({
              updated_at: new Date().toISOString(),
              ...(messages.length === 0 ? { title: text.slice(0, 40) } : {}),
            })
            .eq("id", threadId);
        },
        (err) => {
          clearTimeout(safetyTimeout);
          try { SFX.error(); } catch {}
          setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: `Erro: ${err}` }]);
          setStreamingText("");
          setState("idle");
        }
      );
    } catch (err: any) {
      clearTimeout(safetyTimeout);
      try { SFX.error(); } catch {}
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: `Erro: ${err.message}` }]);
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

  const switchPersona = (p: Persona) => {
    setPersona(p);
    applyTheme(p);
    setPersonaOpen(false);
    SFX.personaSwitch();
  };

  const switchMode = (m: ReasoningMode) => {
    setMode(m);
    saveMode(m);
    setModeOpen(false);
    SFX.modeSwitch();
  };

  return (
    <div className="min-h-screen text-slate-100 relative overflow-hidden bg-[#05070d] flex flex-col">
      <MouseTrail />

      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(${theme.primary}0d 1px, transparent 1px),
            linear-gradient(90deg, ${theme.primary}0d 1px, transparent 1px),
            linear-gradient(${theme.primary}1a 1px, transparent 1px),
            linear-gradient(90deg, ${theme.primary}1a 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px, 20px 20px, 100px 100px, 100px 100px",
        }}
      />

      <div
        className="fixed top-1/2 -translate-y-1/2 font-orbitron select-none pointer-events-none z-0 hidden lg:block"
        style={{
          right: "-2rem",
          fontSize: "180px",
          lineHeight: 1,
          color: `${theme.primary}06`,
          writingMode: "vertical-rl",
          transform: "translateY(-50%) rotate(180deg)",
          letterSpacing: "0.1em",
        }}
      >
        {currentPersona.code}
      </div>

      <div
        className="fixed left-0 top-0 bottom-0 w-8 border-r z-20 hidden md:flex flex-col items-center justify-between py-4 shrink-0"
        style={{ borderColor: `${theme.primary}22`, background: "rgba(5,7,13,0.7)" }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4 border"
          style={{ borderColor: theme.primary, borderTopColor: "transparent" }}
        />
        <div
          className="font-mono text-[9px] tracking-[0.4em] rotate-180"
          style={{ color: `${theme.primary}66`, writingMode: "vertical-rl" }}
        >
          CHAT · SESSION-{threadId.slice(0, 4).toUpperCase()}
        </div>
        <div
          className="font-mono text-[9px] tracking-[0.3em]"
          style={{ color: `${theme.primary}66`, writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          STARK
        </div>
      </div>

      <div
        className="fixed right-0 top-0 bottom-0 w-8 border-l z-20 hidden md:flex flex-col items-center justify-between py-4 shrink-0"
        style={{ borderColor: `${theme.primary}22`, background: "rgba(5,7,13,0.7)" }}
      >
        <div
          className="font-mono text-[9px] tracking-[0.3em]"
          style={{ color: `${theme.primary}66`, writingMode: "vertical-rl" }}
        >
          MSGS {String(messages.length).padStart(3, "0")}
        </div>
        <div className="w-px h-12" style={{ background: `${theme.primary}44` }} />
        <div
          className="font-mono text-[9px] tracking-[0.3em]"
          style={{ color: `${theme.primary}66`, writingMode: "vertical-rl" }}
        >
          SEC-7G
        </div>
      </div>

      <AnimatePresence>
        {!booted && (
          <motion.div
            key="boot"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-[#05070d] flex items-center justify-center"
          >
            <div className="font-mono text-sm text-center" style={{ color: theme.primary }}>
              <div className="text-[10px] tracking-[0.5em] mb-2" style={{ color: `${theme.primary}66` }}>
                STARK MAINFRAME
              </div>
              <div className="font-orbitron text-2xl tracking-[0.3em]">{currentPersona.label}</div>
              <div className="mt-4 w-64 h-px mx-auto overflow-hidden" style={{ background: `${theme.primary}22` }}>
                <motion.div
                  className="h-full"
                  style={{ background: theme.primary, boxShadow: `0 0 8px ${theme.primary}` }}
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex-1 flex flex-col pl-0 md:pl-8 pr-0 md:pr-8 min-h-0">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : -20 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center justify-between px-6 py-3 border-b font-mono text-[10px] tracking-[0.25em] gap-3 flex-wrap shrink-0"
          style={{ borderColor: `${theme.primary}22` }}
        >
          <div className="flex items-center gap-3">
            <button
              onMouseEnter={() => SFX.hover()}
              onClick={() => {
                SFX.buttonPress();
                if (ambientOn) SFX.stopAmbient();
                wakeModeRef.current = false;
                wakeRecRef.current?.stop();
                navigate({ to: "/" });
              }}
              className="flex items-center gap-2 transition-all"
              style={{ color: theme.primary }}
            >
              <span>◄</span>
              <span className="tracking-[0.3em]">VOLTAR</span>
            </button>
            <span className="text-slate-600 hidden md:inline">|</span>
            <span className="tabular-nums hidden md:inline" style={{ color: `${theme.primary}88` }}>
              {time.toLocaleTimeString("pt-BR")}
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <button
                onMouseEnter={() => SFX.hover()}
                onClick={() => {
                  SFX.menuOpen();
                  setPersonaOpen((v) => !v);
                  setModeOpen(false);
                }}
                className="flex items-center gap-2 px-2 py-1 transition-all"
                style={{ color: theme.primary, borderBottom: `1px solid ${theme.primary}66` }}
              >
                <span className="w-1 h-1" style={{ background: theme.primary }} />
                <span>{currentPersona.label}</span>
                <span style={{ color: `${theme.primary}66` }}>[{currentPersona.code}]</span>
              </button>
              <AnimatePresence>
                {personaOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute top-full right-0 mt-1 z-[100] border min-w-[200px]"
                    style={{ background: "#05070d", borderColor: `${theme.primary}44` }}
                  >
                    {PERSONAS_LIST.map((p) => {
                      const pt = THEMES[p.id];
                      const active = persona === p.id;
                      return (
                        <button
                          key={p.id}
                          onMouseEnter={() => SFX.hover()}
                          onClick={() => switchPersona(p.id)}
                          className="w-full text-left px-3 py-2 text-[10px] font-mono tracking-widest transition-all flex items-center gap-2"
                          style={{
                            color: active ? pt.primary : `${theme.primary}99`,
                            background: active ? `${pt.primary}11` : "transparent",
                            borderLeft: active ? `2px solid ${pt.primary}` : "2px solid transparent",
                          }}
                        >
                          <span>{active ? "●" : "○"}</span>
                          <span className="flex-1">{p.label}</span>
                          <span style={{ color: `${pt.primary}66` }}>{p.code}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button
                onMouseEnter={() => SFX.hover()}
                onClick={() => {
                  SFX.menuOpen();
                  setModeOpen((v) => !v);
                  setPersonaOpen(false);
                }}
                className="flex items-center gap-2 px-2 py-1 transition-all"
                style={{ color: currentMode.color, borderBottom: `1px solid ${currentMode.color}66` }}
              >
                <span className="w-1 h-1" style={{ background: currentMode.color }} />
                <span>
                  {currentMode.emoji} {currentMode.name}
                </span>
              </button>
              <AnimatePresence>
                {modeOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute top-full right-0 mt-1 z-[100] border min-w-[220px]"
                    style={{ background: "#05070d", borderColor: `${theme.primary}44` }}
                  >
                    {Object.values(MODES).map((m) => {
                      const active = mode === m.id;
                      return (
                        <button
                          key={m.id}
                          onMouseEnter={() => SFX.hover()}
                          onClick={() => switchMode(m.id)}
                          className="w-full text-left px-3 py-2 text-[10px] font-mono tracking-widest transition-all flex items-center gap-2"
                          style={{
                            color: active ? m.color : `${theme.primary}99`,
                            background: active ? `${m.color}11` : "transparent",
                            borderLeft: active ? `2px solid ${m.color}` : "2px solid transparent",
                          }}
                        >
                          <span>{m.emoji}</span>
                          <span className="flex-1">{m.name}</span>
                          <span style={{ color: `${m.color}66` }} className="text-[8px]">
                            {m.desc}
                          </span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onMouseEnter={() => SFX.hover()}
              onClick={toggleAmbient}
              className="px-2 py-1 border transition-all"
              style={{
                borderColor: ambientOn ? theme.primary : `${theme.primary}33`,
                color: ambientOn ? theme.primary : `${theme.primary}88`,
                background: ambientOn ? `${theme.primary}11` : "transparent",
              }}
              title="Som ambiente"
            >
              {ambientOn ? "◉" : "○"}
            </button>
            <button
              onMouseEnter={() => SFX.hover()}
              onClick={toggleWakeMode}
              className={`px-2 py-1 border transition-all ${wakeMode ? "animate-pulse" : ""}`}
              style={{
                borderColor: wakeMode ? "#ef4444" : `${theme.primary}33`,
                color: wakeMode ? "#ef4444" : `${theme.primary}88`,
                background: wakeMode ? "#ef444411" : "transparent",
              }}
              title="Wake word"
            >
              ◈
            </button>
            <button
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
              className="px-2 py-1 border transition-all"
              style={{ borderColor: `${theme.primary}33`, color: `${theme.primary}88` }}
              title="Tela cheia"
            >
              ⛶
            </button>
            <button
              onMouseEnter={() => SFX.hover()}
              onClick={() => {
                SFX.menuOpen();
                setMemoryOpen(true);
              }}
              className="px-2 py-1 border transition-all flex items-center gap-1.5"
              style={{ borderColor: `${theme.primary}33`, color: `${theme.primary}88` }}
              title="Memória"
            >
              ◐ {facts.length}
            </button>
          </div>
        </motion.header>

        <div className="flex-1 grid grid-cols-12 gap-0 min-h-0">
          <div
            className="col-span-12 lg:col-span-2 border-r flex flex-col min-h-0 hidden lg:flex"
            style={{ borderColor: `${theme.primary}22` }}
          >
            <div
              className="px-3 py-2 border-b font-mono text-[9px] tracking-[0.3em]"
              style={{ borderColor: `${theme.primary}22`, color: `${theme.primary}66` }}
            >
              // SESSÃO
            </div>
            <div className="px-3 py-3 space-y-3 font-mono text-[10px] flex-1 overflow-y-auto">
              <div>
                <div className="tracking-widest mb-1" style={{ color: `${theme.primary}66` }}>
                  STATUS
                </div>
                <div className="flex items-center gap-2" style={{ color: theme.primary }}>
                  <span className="w-1.5 h-1.5 animate-pulse" style={{ background: theme.primary }} />
                  {state === "idle" ? "AGUARDANDO" : state === "thinking" ? `PENSANDO ${elapsed.toFixed(1)}s` : "FALANDO"}
                </div>
              </div>
              <div>
                <div className="tracking-widest mb-1" style={{ color: `${theme.primary}66` }}>
                  MODO
                </div>
                <div style={{ color: currentMode.color }}>
                  {currentMode.emoji} {currentMode.name}
                </div>
              </div>
              <div>
                <div className="tracking-widest mb-1" style={{ color: `${theme.primary}66` }}>
                  THREAD
                </div>
                <div className="truncate" style={{ color: `${theme.primary}cc` }}>
                  {threadId.slice(0, 8)}
                </div>
              </div>
              <div>
                <div className="tracking-widest mb-1" style={{ color: `${theme.primary}66` }}>
                  MSGS
                </div>
                <div className="tabular-nums" style={{ color: `${theme.primary}cc` }}>
                  {String(messages.length).padStart(3, "0")}
                </div>
              </div>
              <div className="pt-3 border-t" style={{ borderColor: `${theme.primary}22` }}>
                <div className="tracking-widest mb-2" style={{ color: `${theme.primary}66` }}>
                  ATALHOS
                </div>
                <div className="space-y-1" style={{ color: `${theme.primary}66` }}>
                  <div className="flex justify-between">
                    <span>↑</span>
                    <span>histórico</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ctrl+K</span>
                    <span>nova</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ctrl+M</span>
                    <span>modo</span>
                  </div>
                  <div className="flex justify-between">
                    <span>F11</span>
                    <span>tela cheia</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-8 flex flex-col min-h-0 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: booted ? 1 : 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="py-6 shrink-0 relative"
            >
              <ArcReactor state={state} color={theme.primary} />
            </motion.div>

            <div
              className="px-6 py-1.5 border-y font-mono text-[9px] tracking-[0.3em] flex items-center justify-between shrink-0"
              style={{
                borderColor: `${theme.primary}22`,
                color: `${theme.primary}66`,
                background: "rgba(5,7,13,0.5)",
              }}
            >
              <span>// 02 · REGISTRO DE CONVERSA</span>
              <span className="tabular-nums">{messages.length} ENTRIES</span>
            </div>

            <main className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
              <Conversation
                messages={messages}
                streamingText={streamingText}
                personaName={currentPersona.label}
              />
            </main>
          </div>

          <div
            className="col-span-12 lg:col-span-2 border-l flex flex-col min-h-0 hidden lg:flex"
            style={{ borderColor: `${theme.primary}22` }}
          >
            <div
              className="px-3 py-2 border-b font-mono text-[9px] tracking-[0.3em]"
              style={{ borderColor: `${theme.primary}22`, color: `${theme.primary}66` }}
            >
              // TELEMETRIA
            </div>
            <div className="px-3 py-3 space-y-3 font-mono text-[10px] flex-1 overflow-y-auto">
              <div>
                <div className="tracking-widest mb-2" style={{ color: `${theme.primary}66` }}>
                  SISTEMA
                </div>
                {[
                  { l: "CPU", v: 43, c: theme.primary },
                  { l: "MEM", v: 67, c: theme.accent },
                  { l: "NET", v: 82, c: theme.primary },
                ].map((m) => (
                  <div key={m.l} className="flex items-center gap-2 mb-1.5">
                    <span className="w-7 text-[9px]" style={{ color: `${theme.primary}88` }}>
                      {m.l}
                    </span>
                    <div className="flex-1 h-px" style={{ background: `${theme.primary}22` }}>
                      <motion.div
                        className="h-full"
                        style={{ background: m.c, boxShadow: `0 0 4px ${m.c}` }}
                        animate={{ width: `${m.v}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                    <span className="text-[9px] tabular-nums w-6 text-right" style={{ color: m.c }}>
                      {m.v}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t" style={{ borderColor: `${theme.primary}22` }}>
                <div className="tracking-widest mb-2" style={{ color: `${theme.primary}66` }}>
                  LOG
                </div>
                <div className="space-y-1 text-[9px] leading-relaxed">
                  {terminalLines.slice(-4).map((line, i) => (
                    <div
                      key={i}
                      className="truncate"
                      style={{
                        color:
                          i === terminalLines.slice(-4).length - 1
                            ? theme.primary
                            : `${theme.primary}55`,
                      }}
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t" style={{ borderColor: `${theme.primary}22` }}>
                <div className="tracking-widest mb-2" style={{ color: `${theme.primary}66` }}>
                  MEMÓRIA
                </div>
                <div className="text-[9px]" style={{ color: `${theme.primary}cc` }}>
                  {facts.length} fatos
                </div>
                <button
                  onMouseEnter={() => SFX.hover()}
                  onClick={() => setMemoryOpen(true)}
                  className="mt-1.5 w-full py-1 font-mono text-[9px] tracking-widest border transition-all"
                  style={{ borderColor: `${theme.primary}33`, color: `${theme.primary}99` }}
                >
                  ABRIR
                </button>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {learnedIndicator && (
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className="fixed top-24 right-12 z-[80] max-w-xs border"
              style={{
                background: "#05070d",
                borderColor: `${theme.primary}66`,
                boxShadow: `0 0 30px ${theme.glow}`,
              }}
            >
              <div
                className="px-3 py-1.5 border-b font-mono text-[9px] tracking-widest flex items-center gap-2"
                style={{ borderColor: `${theme.primary}33`, color: theme.primary }}
              >
                <motion.span
                  className="w-1.5 h-1.5"
                  style={{ background: theme.primary }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                MEMÓRIA ATUALIZADA
              </div>
              <div className="px-3 py-2 font-mono text-[10px] text-slate-300 leading-snug">
                {learnedIndicator}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {wakeDetected && (
            <motion.div
              key="wake"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="fixed top-1/4 left-1/2 -translate-x-1/2 z-[90] pointer-events-none"
            >
              <div
                className="font-orbitron text-xl tracking-[0.5em] px-6 py-3 border"
                style={{
                  color: theme.primary,
                  borderColor: theme.primary,
                  background: "rgba(5,7,13,0.9)",
                  textShadow: `0 0 20px ${theme.primary}`,
                  boxShadow: `0 0 40px ${theme.glow}`,
                }}
              >
                ◉ {currentPersona.label}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.footer
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="border-t px-6 py-3 shrink-0"
          style={{ borderColor: `${theme.primary}22`, background: "rgba(5,7,13,0.6)" }}
        >
          <div className="max-w-4xl mx-auto">
            <PromptInput
              onSend={send}
              listening={listening}
              onToggleMic={toggleListening}
              disabled={state === "thinking"}
              onHistory={navigateHistory}
              primaryColor={theme.primary}
            />
          </div>
        </motion.footer>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: booted ? 1 : 0 }}
          transition={{ delay: 0.8 }}
          className="border-t px-6 py-1.5 flex items-center justify-between font-mono text-[9px] tracking-[0.25em] shrink-0"
          style={{
            borderColor: `${theme.primary}22`,
            color: `${theme.primary}55`,
            background: "rgba(5,7,13,0.8)",
          }}
        >
          <div className="flex items-center gap-3">
            <span className="w-1 h-1 animate-pulse" style={{ background: theme.primary }} />
            <span>PROCESSANDO ATIVO</span>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <span>◈ {currentPersona.code}</span>
            <span>
              ◈ {currentMode.emoji} {currentMode.name}
            </span>
          </div>
          <span>SEC-7G · v2.0.4</span>
        </motion.div>
      </div>

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
    </div>
  );
}