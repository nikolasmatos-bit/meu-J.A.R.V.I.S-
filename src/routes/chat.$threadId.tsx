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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="p-4 border-b border-cyan-400/20 flex justify-between items-center">
        <button onClick={() => navigate({ to: "/" })} className="font-orbitron text-cyan-300 tracking-widest hover:text-cyan-100">← J.A.R.V.I.S.</button>
        <span className="text-xs text-slate-500">{user.email}</span>
      </header>
      <div className="py-6"><ArcReactor state={state} /></div>
      <main className="flex-1 overflow-y-auto pb-4"><Conversation messages={messages} /></main>
      <footer className="p-4 border-t border-cyan-400/20">
        <PromptInput onSend={send} listening={listening} onToggleMic={toggleListening} disabled={state === "thinking"} />
      </footer>
    </div>
  );
}
