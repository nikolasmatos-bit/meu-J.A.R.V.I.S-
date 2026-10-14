import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Message } from "./message";

type Msg = { id: string; role: "user" | "assistant"; content: string };

export function Conversation({ messages, streamingText }: { messages: Msg[]; streamingText?: string }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  if (messages.length === 0 && !streamingText) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
          className="relative max-w-2xl w-full">
          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2" style={{ borderColor: "var(--theme-primary)" }} />
          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2" style={{ borderColor: "var(--theme-primary)" }} />
          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2" style={{ borderColor: "var(--theme-primary)" }} />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2" style={{ borderColor: "var(--theme-primary)" }} />

          <div className="px-10 py-8 text-center backdrop-blur-sm bg-slate-950/40 rounded-lg">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
              className="font-orbitron text-2xl md:text-3xl tracking-[0.3em] mb-3"
              style={{ color: "var(--theme-primary)", textShadow: "0 0 20px var(--theme-primary)" }}>
              SISTEMA PRONTO
            </motion.div>
            <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ delay: 0.7, duration: 1 }}
              className="h-px mx-auto mb-4" style={{ maxWidth: "300px", background: "linear-gradient(90deg, transparent, var(--theme-primary), transparent)" }} />
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
              className="text-sm text-slate-400 tracking-wider">
              Aguardando comando, senhor.
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
              className="mt-6 flex flex-wrap gap-2 justify-center">
              {["Digite um comando", "Clique no 🎙", "Use ↑ para histórico", "Troque a persona ◆"].map((txt, i) => (
                <motion.div key={i} whileHover={{ scale: 1.05 }}
                  className="px-3 py-1.5 rounded-md border text-[10px] tracking-widest font-mono uppercase"
                  style={{ borderColor: "var(--theme-primary)", background: "var(--theme-bg)", color: "var(--theme-primary)", opacity: 0.8 }}>
                  {txt}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-6">
      {messages.map((m) => <Message key={m.id} role={m.role} content={m.content} />)}

      {streamingText && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto p-5 rounded-xl border backdrop-blur-lg"
          style={{ background: "var(--theme-bg)", borderColor: "var(--theme-primary)", boxShadow: "0 0 30px var(--theme-glow)" }}>
          <div className="flex items-center gap-3 mb-3">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-3 h-3 rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--theme-primary)" }} />
            <div className="text-[10px] uppercase tracking-[0.3em] font-bold font-orbitron" style={{ color: "var(--theme-primary)" }}>
              J.A.R.V.I.S. · DIGITANDO
            </div>
          </div>
          <div className="text-slate-100 leading-relaxed whitespace-pre-wrap typewriter-cursor">
            {streamingText}
          </div>
        </motion.div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}