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
import { chatFn } from "../lib/chat.server";

type Msg = { id: string; role: "user" | "assistant"; content: string };
type Fact = { id: string; fact: string; created_at: string };

const FACT_PATTERNS = [
  /(?:meu nome é|me chamo|pode me chamar de|sou o|sou a)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/,
  /(?:eu moro em|vivo em|sou de|moro na cidade de)\s+([^.!?]{2,60})/i,
  /(?:trabalho com|trabalho como|minha profissão é|minha área é|sou)\s+([^.!?]{3,60})/i,
  /(?:estudo|faço|curso|me formei em)\s+([^.!?]{3,60})/i,
  /(?:eu gosto de|adoro|amo|curto|prefiro)\s+([^.!?]{2,60})/i,
  /(?:eu odeio|detesto|não gosto de)\s+([^.!?]{2,60})/i,
  /(?:tenho|minha idade é)\s+(\d{1,2}\s*anos)/i,
  /(?:meu aniversário é|nasci em|nasci no dia)\s+([^.!?]{3,40})/i,
  /(?:minha cor favorita é|meu filme favorito é|meu livro favorito é|minha comida favorita é|minha música favorita é)\s+([^.!?]{2,60})/i,
  /(?:lembre-se que|memorize|anote que|guarde que|não esqueça que)\s+([^.!?]{3,80})/i,
  /(?:eu tenho um|eu tenho uma|tenho um|tenho uma)\s+(cachorro|gato|filho|filha|esposa|marido|namorada|namorado)/i,
];

function extractFacts(text: string): string[] {
  const facts: string[] = [];
  for (const pattern of FACT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const fact = text.length < 120 ? text.trim() : match[0].trim();
      if (!facts.includes(fact)) facts.push(fact);
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
  const [listening, setListening] = useState(false);
  const [booted, setBooted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [facts, setFacts] = useState<Fact[]>([]);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [learnedIndicator, setLearnedIndicator] = useState<string | null>(null);
  const [ambientOn, setAmbientOn] = useState(false);
  const [wakeMode, setWakeMode] = useState(false);
  const [wakeDetected, setWakeDetected] = useState(false);
  const recognitionRef = useRef<any>(null);
  const wakeRecRef = useRef<any>(null);
  const ambientOnRef = useRef(false);
  const stateRef = useRef(state);

  useEffect(() => {
    ambientOnRef.current = ambientOn;
  }, [ambientOn]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 800);
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

  // Beep periódico quando pensa
  useEffect(() => {
    if (state !== "thinking") return;
    const t = setInterval(() => SFX.thinkBeep(), 900);
    return () => clearInterval(t);
  }, [state]);

  // Humor do ambiente
  useEffect(() => {
    if (!ambientOn) return;
    SFX.setAmbientMood(state);
  }, [state, ambientOn]);

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

  // ============================================
  // AMBIENT (som ambiente do reator)
  // ============================================
  const toggleAmbient = () => {
    if (ambientOn) {
      SFX.stopAmbient();
      setAmbientOn(false);
    } else {
      SFX.startAmbient();
      SFX.setAmbientMood(state);
      setAmbientOn(true);
    }
  };

  // ============================================
  // WAKE WORD
  // ============================================
  const toggleWakeMode = () => {
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
      const transcript = e.results[e.results.length - 1][0].transcript.trim();
      if (/jarvis/i.test(transcript)) {
        setWakeDetected(true);
        SFX.wakeDetected();
        setTimeout(() => setWakeDetected(false), 1500);
        const clean = transcript.replace(/jarvis/gi, "").replace(/^[,.\s]+/, "").trim();
        if (clean) send(clean);
      }
    };

    rec.onend = () => {
      if (wakeMode) {
        try { rec.start(); } catch {}
      }
    };

    rec.start();
    wakeRecRef.current = rec;
    setWakeMode(true);
    SFX.click();
  };

  const toggleListening = () => {
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
    SFX.click();
  };

  const speak = (text: string) => {
    const s = loadSettings();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "pt-BR";
    utter.rate = 1.05;
    utter.volume = s.volume;
    utter.onstart = () => setState("speaking");
    utter.onend = () => setState("idle");
    window.speechSynthesis.speak(utter);
  };

  const saveLearnedFacts = async (text: string) => {
    if (!user?.id) return;
    const newFacts = extractFacts(text);
    if (newFacts.length === 0) return;

    for (const f of newFacts) {
      if (facts.some((existing) => existing.fact.toLowerCase() === f.toLowerCase())) continue;

      const { data, error } = await supabase
        .from("user_facts")
        .insert({ user_id: user.id, fact: f })
        .select()
        .single();

      if (!error && data) {
        setFacts((prev) => [...prev, data as Fact]);
        setLearnedIndicator(f);
        setTimeout(() => setLearnedIndicator(null), 3500);
      }
    }
  };

  const send = async (text: string) => {
    if (!text.trim()) return;
    SFX.sendWhoosh();
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setState("thinking");

    saveLearnedFacts(text);

    try {
      const settings = loadSettings();
      const { content } = await chatFn({
        messages: next.map((m) => ({ role: m.role, content: m.content })),
        settings,
        facts: facts.map((f) => f.fact),
      });
      const botMsg: Msg = { id: crypto.randomUUID(), role: "assistant", content };
      setMessages((m) => [...m, botMsg]);
      SFX.responseDone();
      speak(content);
      const title = text.slice(0, 40);
      await supabase
        .from("threads")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", threadId)
        .eq("title", "Nova conversa");
    } catch (err: any) {
      SFX.error();
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: `Erro: ${err.message}` },
      ]);
      setState("idle");
    }
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col relative overflow-hidden">
      <div className="scanline" />
      <MouseTrail />

      <MemoryPanel
        open={memoryOpen}
        onClose={() => setMemoryOpen(false)}
        facts={facts}
        onFactsChange={setFacts}
        userId={user?.id ?? ""}
      />

      <AnimatePresence>
        {learnedIndicator && (
          <motion.div
            key="learned"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-24 right-6 z-[80] max-w-xs"
          >
            <div className="p-3 rounded-lg border border-amber-400/50 bg-amber-500/10 backdrop-blur-xl shadow-[0_0_30px_rgba(251,191,36,0.3)]">
              <div className="flex items-center gap-2 mb-1">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-3 h-3 rounded-full border-2 border-amber-400 border-t-transparent"
                />
                <div className="text-[9px] font-mono tracking-widest text-amber-300">
                  ▸ MEMÓRIA ATUALIZADA
                </div>
              </div>
              <div className="text-xs text-amber-100/90 leading-snug">{learnedIndicator}</div>
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
              className="font-orbitron text-2xl tracking-[0.5em] text-amber-300"
              style={{ textShadow: "0 0 20px #fbbf24, 0 0 40px #f59e0b" }}
            >
              ◉ JARVIS
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {booted && (
        <>
          <div className="fixed top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-cyan-400/60 z-30 pointer-events-none" />
          <div className="fixed top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-cyan-400/60 z-30 pointer-events-none" />
          <div className="fixed bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-cyan-400/60 z-30 pointer-events-none" />
          <div className="fixed bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-cyan-400/60 z-30 pointer-events-none" />
        </>
      )}

      <motion.div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          width: "80vmin",
          height: "80vmin",
          background: "radial-gradient(circle, rgba(34, 211, 238, 0.08) 0%, transparent 60%)",
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
                className="font-orbitron text-cyan-400 text-3xl tracking-[0.5em] animate-pulse"
                style={{ textShadow: "0 0 30px #22d3ee" }}
              >
                J.A.R.V.I.S.
              </div>
              <div className="text-[10px] text-cyan-400/60 tracking-[0.4em] mt-2 font-mono">
                CARREGANDO MEMÓRIA...
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {booted && (
        <>
          <div className="absolute top-28 left-6 space-y-3 z-20 hidden lg:block">
            <StatusBar label="CPU" color="#22d3ee" />
            <StatusBar label="MEM" color="#0ea5e9" />
            <StatusBar label="NET" color="#67e8f9" />
          </div>
          <div className="absolute top-28 right-6 z-20 hidden lg:block">
            <Radar />
          </div>
        </>
      )}

      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative z-10 p-4 border-b border-cyan-500/20 backdrop-blur-xl bg-slate-950/40"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4 flex-wrap">
          <motion.button
            whileHover={{ x: -4 }}
            onClick={() => {
              if (ambientOn) SFX.stopAmbient();
              wakeRecRef.current?.stop();
              navigate({ to: "/" });
            }}
            className="flex items-center gap-3 font-orbitron text-cyan-400 tracking-widest hover:text-cyan-200 transition"
            style={{ textShadow: "0 0 10px #22d3ee" }}
          >
            <span className="text-cyan-300 text-lg">◄</span>
            <span>VOLTAR</span>
          </motion.button>

          <div className="flex items-center gap-2 flex-wrap">
            {/* AMBIENT */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleAmbient}
              className={`px-3 py-1.5 rounded border text-[10px] tracking-widest font-mono transition ${
                ambientOn
                  ? "border-amber-400 text-amber-300 bg-amber-500/10"
                  : "border-cyan-500/30 text-cyan-400 hover:border-cyan-400"
              }`}
            >
              {ambientOn ? "🔊 AMBIENT" : "🔇 AMBIENT"}
            </motion.button>

            {/* WAKE */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleWakeMode}
              className={`px-3 py-1.5 rounded border text-[10px] tracking-widest font-mono transition flex items-center gap-1.5 ${
                wakeMode
                  ? "border-red-400 text-red-300 bg-red-500/10 animate-pulse"
                  : "border-cyan-500/30 text-cyan-400 hover:border-cyan-400"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${wakeMode ? "bg-red-400" : "bg-slate-600"}`} />
              {wakeMode ? "WAKE ON" : "WAKE OFF"}
            </motion.button>

            {/* MEMÓRIA */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setMemoryOpen(true);
                SFX.click();
              }}
              className="px-3 py-1.5 rounded border border-amber-500/30 text-amber-300 hover:border-amber-400 hover:bg-amber-500/10 transition text-[10px] tracking-widest font-mono flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
              MEMÓRIA ({facts.length})
            </motion.button>

            <div className="flex items-center gap-3 text-[10px] tracking-widest text-slate-500 font-mono px-3">
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                <span className="text-emerald-300">ONLINE</span>
              </motion.span>
              <span className="hidden xl:inline">OPERADOR: {user.email}</span>
            </div>
          </div>
        </div>
      </motion.header>

      {wakeMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center py-2"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30">
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_10px_#ef4444]"
            />
            <span className="font-orbitron text-[10px] tracking-[0.4em] text-red-300">
              DIGA "JARVIS" PARA ATIVAR
            </span>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="py-8 relative z-10"
      >
        <ArcReactor state={state} />
      </motion.div>

      <AnimatePresence mode="wait">
        {state === "thinking" && (
          <motion.div
            key="thinking"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center relative z-10 -mt-6 mb-2"
          >
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"
                  />
                ))}
              </div>
              <span className="font-orbitron text-[10px] tracking-[0.3em] text-cyan-300">
                PROCESSANDO {elapsed.toFixed(1)}s
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto pb-4 relative z-10">
        <Conversation messages={messages} />
      </main>

      <motion.footer
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="p-4 border-t border-cyan-500/20 backdrop-blur-xl bg-slate-950/40 relative z-10"
      >
        <PromptInput
          onSend={send}
          listening={listening}
          onToggleMic={toggleListening}
          disabled={state === "thinking"}
        />
      </motion.footer>
    </div>
  );
}

function StatusBar({ label, color }: { label: string; color: string }) {
  const [value, setValue] = useState(20 + Math.random() * 60);
  useEffect(() => {
    const i = setInterval(() => {
      setValue((v) => Math.max(15, Math.min(95, v + (Math.random() - 0.5) * 8)));
    }, 1500);
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

function Radar() {
  return (
    <div className="w-28 h-28 relative">
      <div className="absolute inset-0 rounded-full border border-cyan-500/40" />
      <div className="absolute inset-3 rounded-full border border-cyan-500/25" />
      <div className="absolute inset-6 rounded-full border border-cyan-500/15" />
      <div className="absolute inset-9 rounded-full border border-cyan-500/10" />
      <div className="absolute top-1/2 left-1/2 w-1 h-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
      <div className="radar-sweep absolute inset-0">
        <div
          className="absolute top-1/2 left-1/2 w-14 h-px origin-left"
          style={{
            background: "linear-gradient(90deg, #22d3ee, transparent)",
            transform: "translateY(-50%)",
          }}
        />
      </div>
    </div>
  );
}