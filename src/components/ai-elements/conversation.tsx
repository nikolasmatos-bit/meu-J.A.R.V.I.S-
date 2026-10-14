import { useEffect, useRef } from "react";
import { Message } from "./message";

type Msg = { id: string; role: "user" | "assistant"; content: string };

export function Conversation({ messages }: { messages: Msg[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="text-center text-slate-500 py-16">
        <p className="font-orbitron tracking-[0.4em] text-cyan-400/80" style={{ textShadow: "0 0 10px #22d3ee" }}>
          SISTEMA PRONTO
        </p>
        <p className="text-sm mt-3 text-slate-400">
          Aguardando comando, senhor.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-6">
      {messages.map((m) => (
        <Message key={m.id} role={m.role} content={m.content} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}