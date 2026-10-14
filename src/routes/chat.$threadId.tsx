import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useJarvis } from "../components/jarvis/Bootstrap";
import { ArcReactor } from "../components/jarvis/ArcReactor";
import { MouseTrail } from "../components/jarvis/MouseTrail";
import { Conversation } from "../components/ai-elements/conversation";
import { PromptInput } from "../components/ai-elements/prompt-input";
import { SFX } from "../lib/sfx";
import { loadSettings } from "../lib/settings";
import { chatFn } from "../lib/chat.server";

type Msg = { id: string; role: "user" | "assistant"; content: string };

export function ChatPage() {
  const { threadId } = useParams({ from: "/chat/$threadId" });
  const { user } = useJarvis();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [state, setState] = useState<"idle" | "thinking" | "speaking">("idle");
  const [listening, setListening] = useState(false);
  const [booted, setBooted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 800);
    return () => clearTimeout(t);
  }, []);

  // Cronômetro quando está pensando
  useEffect(() => {
    if (state !== "thinking") {
      setElapsed(0);
      return;
    }
    const t = setInterval(() => setElapsed((e) => e + 0.1), 100);
    return () => clearInterval(t);
  }, [state]);

  useEffect(() => {
    supabase
      .from("messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .then(({ data }) => data && setMessages(data as Msg[]));
  }, [threadId]);

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
    rec.continuous = true;
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

  const send = async (text: string) => {
    if (!text.trim()) return;
    SFX.reactorEngage();
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setState("thinking");

    try {
      const settings = loadSettings();
      const { content } = await chatFn({
        messages: next.map((m) => ({ role: m.role, content: m.content })),
        settings,
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

      {/* Aura central pulsante */}
      <motion.div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          width: "80vmin",
          height: "80vmin",
          background:
            "radial-gradient(circle, rgba(34, 211, 238, 0.08) 0%, transparent 60%)",
          filter: "blur(50px)",
          zIndex: 0,
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Boot */}
      <AnimatePresence>
        {!booted && (
          <motion.div
            key="boot"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div
                className="font-orbitron text-cyan-400 text-3xl tracking-[0.5em] animate-pulse"
                style={{ textShadow: "0 0 30px #22d3ee" }}
              >
                J.A.R.V.I.S.
              </div>
              <div className="text-[10px] text-cyan-400/60 tracking-[0.4em] mt-2 font-mono">
                ESTABELECENDO CONEXÃO NEURAL
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD LATERAL */}
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

          <div className="absolute bottom-36 left-6 text-[9px] font-mono text-cyan-400/40 space-y-0.5 z-20 hidden lg:block code-pulse">
            <div>▸ AUTH_OK</div>
            <div>▸ ENC_AES256</div>
            <div>▸ LINK:STABLE</div>
            <div>▸ PWR:98.4%</div>
          </div>

          <div className="absolute bottom-36 right-6 text-[9px] font-mono text-cyan-400/40 text-right z-20 hidden lg:block">
            <div>LAT -23.5505</div>
            <div>LNG -46.6333</div>
            <div>SYS v2.0.4</div>
          </div>
        </>
      )}

      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative z-10 p-4 border-b border-cyan-500/20 backdrop-blur-xl bg-slate-950/40"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.button
            whileHover={{ x: -4 }}
            onClick={() => navigate({ to: "/" })}
            className="flex items-center gap-3 font-orbitron text-cyan-400 tracking-widest hover:text-cyan-200 transition"
            style={{ textShadow: "0 0 10px #22d3ee" }}
          >
            <span className="text-cyan-300 text-lg">◄</span>
            <span>VOLTAR</span>
          </motion.button>

          <div className="flex items-center gap-4 text-[10px] tracking-widest text-slate-500 font-mono">
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
              <span className="text-emerald-300">ONLINE</span>
            </motion.span>
            <span className="hidden md:inline">OPERADOR: {user.email}</span>
            <span className="hidden lg:inline px-2 py-0.5 rounded border border-cyan-500/30 text-cyan-400">
              SYS v2.0.4
            </span>
          </div>
        </div>
      </motion.header>

      {/* Reactor menor */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="py-6 relative z-10"
      >
        <div className="scale-75 origin-center">
          <ArcReactor state={state} />
        </div>
      </motion.div>

      {/* Indicador de status */}
      <AnimatePresence mode="wait">
        {state === "thinking" && (
          <motion.div
            key="thinking"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center relative z-10 -mt-4 mb-2"
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30">
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

      {/* Mensagens */}
      <main className="flex-1 overflow-y-auto pb-4 relative z-10">
        <Conversation messages={messages} />
      </main>

      {/* Input */}
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
    <div className="w-28">
      <div
        className="flex justify-between text-[9px] font-mono tracking-widest"
        style={{ color }}
      >
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
    <div className="w-24 h-24 relative">
      <div className="absolute inset-0 rounded-full border border-cyan-500/40" />
      <div className="absolute inset-3 rounded-full border border-cyan-500/25" />
      <div className="absolute inset-6 rounded-full border border-cyan-500/15" />
      <div className="absolute inset-9 rounded-full border border-cyan-500/10" />
      <div className="absolute top-1/2 left-1/2 w-1 h-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
      <div className="radar-sweep absolute inset-0">
        <div
          className="absolute top-1/2 left-1/2 w-12 h-px origin-left"
          style={{
            background: "linear-gradient(90deg, #22d3ee, transparent)",
            transform: "translateY(-50%)",
          }}
        />
      </div>
    </div>
  );
}