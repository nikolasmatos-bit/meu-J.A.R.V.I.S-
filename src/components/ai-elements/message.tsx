import { memo, useEffect, useState } from "react";
import { motion } from "framer-motion";

type Props = { role: "user" | "assistant"; content: string };

function formatContent(text: string): string {
  return text
    .replace(/```([\s\S]*?)```/g, '<pre class="code-block">$1</pre>')
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-amber-300">$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em class="text-cyan-300">$2</em>')
    .replace(/\n/g, "<br/>");
}

export const Message = memo(function Message({ role, content }: Props) {
  const isUser = role === "user";
  const [displayed, setDisplayed] = useState(isUser ? content : "");
  const [typing, setTyping] = useState(!isUser);

  useEffect(() => {
    if (isUser) {
      setDisplayed(content);
      setTyping(false);
      return;
    }

    setDisplayed("");
    setTyping(true);
    let i = 0;
    const speed = Math.max(6, 25 - content.length / 30);

    const interval = setInterval(() => {
      i += 4;
      if (i >= content.length) {
        setDisplayed(content);
        setTyping(false);
        clearInterval(interval);
      } else {
        setDisplayed(content.slice(0, i));
      }
    }, speed);

    return () => clearInterval(interval);
  }, [content, isUser]);

  const formatted = formatContent(typing ? displayed : content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`relative max-w-3xl mx-auto p-5 rounded-xl backdrop-blur-lg overflow-hidden ${
        isUser
          ? "bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-400/40 ml-auto"
          : "bg-gradient-to-br from-slate-900/80 to-slate-950/60 border border-cyan-400/40"
      }`}
      style={{
        boxShadow: isUser
          ? "0 0 40px rgba(251, 191, 36, 0.15), inset 0 0 30px rgba(251, 191, 36, 0.03)"
          : "0 0 40px rgba(34, 211, 238, 0.2), inset 0 0 30px rgba(34, 211, 238, 0.03)",
      }}
    >
      {/* Cantos HUD duplos */}
      <div
        className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2"
        style={{ borderColor: isUser ? "#fbbf24" : "#22d3ee" }}
      />
      <div
        className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2"
        style={{ borderColor: isUser ? "#fbbf24" : "#22d3ee" }}
      />
      <div
        className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2"
        style={{ borderColor: isUser ? "#fbbf24" : "#22d3ee" }}
      />
      <div
        className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2"
        style={{ borderColor: isUser ? "#fbbf24" : "#22d3ee" }}
      />

      {/* Linha lateral luminosa */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5"
        style={{
          background: isUser
            ? "linear-gradient(180deg, transparent, #fbbf24, transparent)"
            : "linear-gradient(180deg, transparent, #22d3ee, transparent)",
          boxShadow: `0 0 10px ${isUser ? "#fbbf24" : "#22d3ee"}`,
        }}
      />

      {/* Header com avatar */}
      <div className="flex items-center gap-3 mb-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className={`w-8 h-8 rounded-lg flex items-center justify-center relative ${
            isUser ? "bg-amber-500/20 border border-amber-400/50" : "bg-cyan-500/20 border border-cyan-400/50"
          }`}
          style={{
            boxShadow: `0 0 15px ${isUser ? "#fbbf2480" : "#22d3ee80"}`,
          }}
        >
          {isUser ? (
            <span className="text-amber-300 text-xs font-bold">U</span>
          ) : (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent"
            />
          )}
        </motion.div>

        <div className="flex-1">
          <div
            className={`text-[10px] uppercase tracking-[0.3em] font-bold font-orbitron ${
              isUser ? "text-amber-300" : "text-cyan-300"
            }`}
            style={{ textShadow: `0 0 10px ${isUser ? "#fbbf2480" : "#22d3ee80"}` }}
          >
            {isUser ? "OPERADOR" : "J.A.R.V.I.S."}
          </div>
          <div className="text-[9px] font-mono text-slate-600 tracking-widest mt-0.5">
            {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
            className="w-1 h-1 rounded-full"
            style={{ background: isUser ? "#fbbf24" : "#22d3ee" }}
          />
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
            className="w-1 h-1 rounded-full"
            style={{ background: isUser ? "#fbbf24" : "#22d3ee" }}
          />
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
            className="w-1 h-1 rounded-full"
            style={{ background: isUser ? "#fbbf24" : "#22d3ee" }}
          />
        </div>
      </div>

      {/* Conteúdo */}
      <div
        className={`text-slate-100 leading-relaxed text-[15px] relative ${
          typing ? "typewriter-cursor" : ""
        }`}
        dangerouslySetInnerHTML={{ __html: formatted }}
      />

      {/* Footer com metadados */}
      <div className="mt-4 pt-3 border-t border-slate-800/50 flex justify-between text-[9px] font-mono tracking-widest">
        <span className="text-slate-600">
          {isUser ? "MSG.SENT" : "MSG.RECEIVED"}
        </span>
        <span className="text-slate-600">
          {content.length} chars
        </span>
      </div>

      <style>{`
        .code-block {
          display: block;
          background: rgba(0, 0, 0, 0.7);
          border-left: 3px solid #22d3ee;
          padding: 12px 16px;
          margin: 12px 0;
          border-radius: 6px;
          font-family: "Courier New", monospace;
          font-size: 13px;
          color: #a7f3d0;
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-word;
          box-shadow: 0 0 20px rgba(34, 211, 238, 0.1);
        }
        .inline-code {
          background: rgba(34, 211, 238, 0.15);
          border: 1px solid rgba(34, 211, 238, 0.3);
          padding: 1px 6px;
          border-radius: 3px;
          font-family: "Courier New", monospace;
          font-size: 13px;
          color: #67e8f9;
        }
      `}</style>
    </motion.div>
  );
});