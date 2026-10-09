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
  const [alwaysOn, setAlwaysOn] = useState(false);
  const [facts, setFacts] = useState<string[]>([]);
  const recognitionRef = useRef<any>(null);
  const alwaysOnRef = useRef(false);
  const stateRef = useRef(state);
  const messagesRef = useRef(messages);

  // Mantém refs atualizados
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Carrega histórico
  useEffect(() => {
    supabase
      .from("messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .then(({ data }) => data && setMessages(data as Msg[]));
  }, [threadId]);

  // Carrega fatos do usuário (memória)
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("user_facts")
      .select("fact")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setFacts(data.map((f: any) => f.fact));
      });
  }, [user?.id]);

  // Salva fato novo (chamada de fora)
  const saveFact = async (fact: string) => {
    if (!user?.id) return;
    const { error } = await supabase
      .from("user_facts")
      .insert({ user_id: user.id, fact });
    if (!error) setFacts((f) => [...f, fact]);
  };

  // ==== VOZ CONTÍNUA ====
  const startAlwaysOn = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return alert("Reconhecimento de fala não suportado.");

    const rec = new SR();
    rec.lang = "pt-BR";
    rec.continuous = true;
    rec.interimResults = false;

    rec.onresult = (e: any) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim();
      // Só responde se mencionar "jarvis"
      if (/jarvis/i.test(transcript)) {
        const clean = transcript.replace(/jarvis/gi, "").trim();
        if (clean) send(clean, true);
      }
    };

    rec.onend = () => {
      if (alwaysOnRef.current) {
        try { rec.start(); } catch {}
      }
    };

    rec.start();
    recognitionRef.current = rec;
    alwaysOnRef.current = true;
    setAlwaysOn(true);
    SFX.click();
  };

  const stopAlwaysOn = () => {
    alwaysOnRef.current = false;
    recognitionRef.current?.stop();
    setAlwaysOn(false);
  };

  // STT manual (botão)
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

  const send = async (text: string, fromVoice = false) => {
    if (!text.trim() || stateRef.current === "thinking") return;
    SFX.reactorEngage();
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text };
    const next = [...messagesRef.current, userMsg];
    setMessages(next);
    setState("thinking");

    try {
      const settings = loadSettings();
      const { content } = await chatFn({
        messages: next.map((m) => ({ role: m.role, content: m.content })),
        settings,
        facts,
      });

      const botMsg: Msg = { id: crypto.randomUUID(), role: "assistant", content };
      setMessages((m) => [...m, botMsg]);
      SFX.responseDone();
      speak(content);

      // Extrai fatos novos (memória)
      const factMatch = text.match(/(?:meu nome é|eu sou|eu gosto de|eu moro em|trabalho com|minha profissão é|minha idade é|tenho \d+ anos)\s+([^.!?]+)/i);
      if (factMatch) {
        await saveFact(text.trim());
      }

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="p-4 border-b border-cyan-400/20 flex justify-between items-center">
        <button
          onClick={() => {
            stopAlwaysOn();
            navigate({ to: "/" });
          }}
          className="font-orbitron text-cyan-300 tracking-widest hover:text-cyan-100"
        >
          ← J.A.R.V.I.S.
        </button>
        <div className="flex gap-3 items-center">
          <button
            onClick={alwaysOn ? stopAlwaysOn : startAlwaysOn}
            className={`text-xs px-3 py-1 rounded border transition-all ${
              alwaysOn
                ? "bg-red-500/20 border-red-400 text-red-300 animate-pulse"
                : "bg-slate-800 border-cyan-400/30 text-cyan-300 hover:border-cyan-300"
            }`}
            title="Voz contínua (diga 'JARVIS' para ativar)"
          >
            {alwaysOn ? "🔴 SEMPRE OUVINDO" : "🎙 SEMPRE OUVIR"}
          </button>
          <span className="text-xs text-slate-500">{user.email}</span>
        </div>
      </header>

      <div className="py-6">
        <ArcReactor state={state} />
      </div>

      {alwaysOn && (
        <div className="text-center text-xs text-cyan-400/70 tracking-widest -mt-4 mb-2 animate-pulse">
          ▸ DIZ "JARVIS" PARA ATIVAR
        </div>
      )}

      <main className="flex-1 overflow-y-auto pb-4">
        <Conversation messages={messages} />
      </main>

      <footer className="p-4 border-t border-cyan-400/20">
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