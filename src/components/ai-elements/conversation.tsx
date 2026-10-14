import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Message } from "./message";

type Msg = { id: string; role: "user" | "assistant"; content: string };

export function Conversation({ messages }: { messages: Msg[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-6">
        {/* Painel de boas-vindas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative max-w-2xl w-full"
        >
          {/* Cantos HUD */}
          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-cyan-400 shadow-[0_0_10px_#22d3ee]" />
          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-cyan-400 shadow-[0_0_10px_#22d3ee]" />
          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-cyan-400 shadow-[0_0_10px_#22d3ee]" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-cyan-400 shadow-[0_0_10px_#22d3ee]" />

          <div className="px-10 py-8 text-center backdrop-blur-sm bg-slate-950/40 rounded-lg">
            {/* Título */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="font-orbitron text-2xl md:text-3xl tracking-[0.3em] text-cyan-300 mb-3"
              style={{
                textShadow: "0 0 20px #22d3ee, 0 0 40px #22d3ee",
              }}
            >
              SISTEMA PRONTO
            </motion.div>

            {/* Divisor animado */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.7, duration: 1 }}
              className="h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto mb-4"
              style={{ maxWidth: "300px" }}
            />

            {/* Subtítulo */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-sm text-slate-400 tracking-wider"
            >
              Aguardando comando, senhor.
            </motion.div>

            {/* Instruções */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="mt-6 flex flex-wrap gap-2 justify-center"
            >
              {[
                "Digite um comando",
                "Clique no 🎙 para falar",
                "Ou peça ajuda a J.A.R.V.I.S.",
              ].map((txt, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05, borderColor: "#22d3ee" }}
                  className="px-3 py-1.5 rounded-md border border-cyan-500/30 bg-cyan-500/5 text-[10px] tracking-widest text-cyan-300/80 font-mono uppercase"
                >
                  {txt}
                </motion.div>
              ))}
            </motion.div>

            {/* Indicador de status embaixo */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
              className="mt-6 flex items-center justify-center gap-2 text-[10px] font-mono tracking-widest text-slate-600"
            >
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]"
              />
              <span>CANAL ABERTO · ENCRIPTAÇÃO ATIVA · LINK ESTÁVEL</span>
            </motion.div>
          </div>
        </motion.div>
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