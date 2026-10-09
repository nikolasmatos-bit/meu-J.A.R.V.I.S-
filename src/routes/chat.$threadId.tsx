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

type Msg = { id: string; role: "user" | "assistant"; content: string };

export function ChatPage() {
  const { threadId } = useParams({ from: "/chat/$threadId" });
  const { user } = useJarvis();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [state, setState] = useState<"idle" | "thinking" | "speaking">("idle");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

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
    <div className="min-h-screen text-slate-100 flex flex-col relative boot-in">
      <div className="scanline" />

      {/* Top bar HUD */}
      <header className="relative z-10 p-4 border-b border-red-500/20 backdrop-blur-sm bg-slate-950/40">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button
            onClick={() => navigate({ to: "/" })}
            className="font-orbitron text-red-400 tracking-widest hover:text-amber-300 transition flex items-center gap-2"
          >
            <span className="text-amber-400">◄</span>
            J.A.R.V.I.S.
          </button>

          <div className="flex items-center gap-4 text-[10px] tracking-widest text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>
            <span className="hidden md:inline">OPERADOR: {user.email}</span>
            <span className="hidden md:inline">THREAD: {threadId.slice(0, 8)}</span>
          </div>
        </div>
      </header>

      {/* Reactor */}
      <div className="py-8 relative z-10">
        <ArcReactor state={state} />
      </div>

      {/* Mensagens */}
      <main className="flex-1 overflow-y-auto pb-4 relative z-10">
        <Conversation messages={messages} />
      </main>

      {/* Input */}
      <footer className="p-4 border-t border-red-500/20 backdrop-blur-sm bg-slate-950/40 relative z-10">
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