import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { supabase } from "../lib/supabase";
import { useJarvis } from "../components/jarvis/Bootstrap";
import { ArcReactor } from "../components/jarvis/ArcReactor";
import { Conversation } from "../components/ai-elements/conversation";
import { PromptInput } from "../components/ai-elements/prompt-input";
import { SFX } from "../lib/sfx";
import { loadSettings } from "../lib/settings";
import { chatFn } from "../lib/chat.server";
import { motion } from "framer-motion";

type Msg = { id: string; role: "user" | "assistant"; content: string };

export function ChatPage() {
  const { threadId } = useParams({ from: "/chat/$threadId" });
  const { user } = useJarvis();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [state, setState] = useState<"idle" | "thinking" | "speaking">("idle");
  const [listening, setListening] = useState(false);
  const [booted, setBooted] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    supabase.from("messages").select("*").eq("thread_id", threadId).order("created_at", { ascending: true }).then(({ data }) => data && setMessages(data as Msg[]));
  }, [threadId]);

  const toggleListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return alert("Reconhecimento de fala não suportado.");
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
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
      await supabase.from("threads").update({ title, updated_at: new Date().toISOString() }).eq("id", threadId).eq("title", "Nova conversa");
    } catch (err: any) {
      SFX.error();
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: `Erro: ${err.message}` }]);
      setState("idle");
    }
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col relative overflow-hidden crt">

      {/* Scanline */}
      <div className="scanline" />

      {/* Boot overlay */}
      {!booted && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center">
          <div className="text-center fade-in-up">
            <div className="font-orbitron text-red-500 text-3xl tracking-[0.5em] animate-pulse glow-text">
              J.A.R.V.I.S.
            </div>
            <div className="text-[10px] text-amber-400/60 tracking-[0.4em] mt-2">
              INICIALIZANDO SISTEMAS
            </div>
            <div className="mt-6 w-80 h-1 bg-slate-900 overflow-hidden mx-auto rounded">
              <div
                className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-red-500"
                style={{ animation: "bootBar 1.2s ease-out forwards" }}
              />
            </div>
            <div className="text-[9px] text-slate-600 tracking-widest mt-3 font-mono">
              CARREGANDO MÓDULOS NEURAIS...
            </div>
          </div>
        </div>
      )}

      {/* HUD overlay — canto esquerdo */}
      {booted && (
        <>
          {/* Barras de status esquerda */}
          <div className="absolute top-24 left-4 space-y-2 z-20 hidden md:block">
            <StatusBar label="CPU" color="#ef4444" />
            <StatusBar label="MEM" color="#fbbf24" />
            <StatusBar label="NET" color="#22d3ee" />
          </div>

          {/* Radar direita */}
          <div className="absolute top-24 right-4 z-20 hidden md:block">
            <Radar />
          </div>

          {/* Códigos piscando inferior esquerdo */}
          <div className="absolute bottom-28 left-4 text-[9px] font-mono text-red-400/40 space-y-0.5 z-20 hidden md:block code-pulse">
            <div>▸ AUTH_OK</div>
            <div>▸ ENC_AES256</div>
            <div>▸ LINK:STABLE</div>
            <div>▸ PWR:98.4%</div>
          </div>

          {/* Coordenadas inferior direito */}
          <div className="absolute bottom-28 right-4 text-[9px] font-mono text-amber-400/40 text-right z-20 hidden md:block">
            <div>LAT -23.5505</div>
            <div>LNG -46.6333</div>
            <div>SYS v2.0.4</div>
          </div>
        </>
      )}

      {/* Top bar */}
      <header className="relative z-10 p-4 border-b border-red-500/20 backdrop-blur-sm bg-slate-950/60">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button
            onClick={() => navigate({ to: "/" })}
            className="font-orbitron text-red-400 tracking-widest hover:text-amber-300 transition flex items-center gap-2 glow-text"
          >
            <span className="text-amber-400">◄</span>
            J.A.R.V.I.S.
          </button>

          <div className="flex items-center gap-4 text-[10px] tracking-widest text-slate-500 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>
            <span className="hidden md:inline">OPERADOR: {user.email}</span>
            <span className="hidden lg:inline">SYS: v2.0.4</span>
          </div>
        </div>
      </header>

      {/* Reactor */}
      <div className="py-10 relative z-10">
        <ArcReactor state={state} />
      </div>

      {/* Mensagens */}
      <main className="flex-1 overflow-y-auto pb-4 relative z-10">
        <Conversation messages={messages} />
      </main>

      {/* Input */}
      <footer className="p-4 border-t border-red-500/20 backdrop-blur-sm bg-slate-950/60 relative z-10">
        <PromptInput
          onSend={send}
          listening={listening}
          onToggleMic={toggleListening}
          disabled={state === "thinking"}
        />
      </footer>
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
    <div className="w-24 h-24 relative">
      <div className="absolute inset-0 rounded-full border border-red-500/40" />
      <div className="absolute inset-3 rounded-full border border-red-500/25" />
      <div className="absolute inset-6 rounded-full border border-red-500/15" />
      <div className="absolute inset-9 rounded-full border border-red-500/10" />
      <div className="absolute top-1/2 left-1/2 w-1 h-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
      <div className="radar-sweep absolute inset-0">
        <div
          className="absolute top-1/2 left-1/2 w-12 h-px origin-left"
          style={{
            background: "linear-gradient(90deg, #ef4444, transparent)",
            transform: "translateY(-50%)",
          }}
        />
      </div>
    </div>
  );
}