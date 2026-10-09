import { memo, useEffect, useState } from "react";

type Props = { role: "user" | "assistant"; content: string };

function formatContent(text: string): string {
  return text
    // blocos de código
    .replace(/```([\s\S]*?)```/g, '<pre class="code-block">$1</pre>')
    // código inline
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    // negrito
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-amber-300">$1</strong>')
    // itálico
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em class="text-cyan-300">$2</em>')
    // quebras de linha
    .replace(/\n/g, '<br/>');
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
    <div
      className={`message-in max-w-3xl mx-auto p-5 rounded-lg backdrop-blur-md relative ${
        isUser
          ? "bg-amber-500/5 border border-amber-400/40 ml-auto"
          : "bg-slate-950/70 border border-red-500/40"
      }`}
      style={{
        boxShadow: isUser
          ? "0 0 30px rgba(251, 191, 36, 0.15), inset 0 0 30px rgba(251, 191, 36, 0.03)"
          : "0 0 30px rgba(239, 68, 68, 0.2), inset 0 0 30px rgba(239, 68, 68, 0.03)",
      }}
    >
      {/* Cantos HUD */}
      <div
        className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2"
        style={{ borderColor: isUser ? "#fbbf24" : "#ef4444" }}
      />
      <div
        className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2"
        style={{ borderColor: isUser ? "#fbbf24" : "#ef4444" }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-2 h-2 rounded-full ${isUser ? "bg-amber-400" : "bg-red-500"}`}
          style={{
            boxShadow: `0 0 12px ${isUser ? "#fbbf24" : "#ef4444"}`,
            animation: isUser ? "none" : "codePulse 2s infinite",
          }}
        />
        <div
          className={`text-[10px] uppercase tracking-[0.3em] font-bold font-orbitron ${
            isUser ? "text-amber-300" : "text-red-300"
          }`}
        >
          {isUser ? "▸ OPERADOR" : "◆ J.A.R.V.I.S."}
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-slate-700 via-red-500/30 to-transparent" />
        <div className="text-[9px] font-mono text-slate-600">
          {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {/* Conteúdo */}
      <div
        className={`text-slate-100 leading-relaxed text-[15px] ${
          typing ? "typewriter-cursor" : ""
        }`}
        dangerouslySetInnerHTML={{ __html: formatted }}
      />

      <style>{`
        .code-block {
          display: block;
          background: rgba(0, 0, 0, 0.6);
          border-left: 3px solid #fbbf24;
          padding: 12px 16px;
          margin: 12px 0;
          border-radius: 4px;
          font-family: "Courier New", monospace;
          font-size: 13px;
          color: #a7f3d0;
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .inline-code {
          background: rgba(251, 191, 36, 0.15);
          border: 1px solid rgba(251, 191, 36, 0.3);
          padding: 1px 6px;
          border-radius: 3px;
          font-family: "Courier New", monospace;
          font-size: 13px;
          color: #fcd34d;
        }
      `}</style>
    </div>
  );
});