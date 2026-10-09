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
      <div className="text-center text-slate-500 py-12">
        <p className="font-orbitron tracking-widest text-cyan-400/60">SISTEMA PRONTO</p>
        <p className="text-sm mt-2">Aguardando comando, senhor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-6">
      {messages.map((m) => <Message key={m.id} role={m.role} content={m.content} />)}
      <div ref={bottomRef} />
    </div>
  );
}
