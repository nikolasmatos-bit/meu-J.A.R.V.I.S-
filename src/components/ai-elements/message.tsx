import { memo, useEffect, useState } from "react";
import { motion } from "framer-motion";

type Props = { role: "user" | "assistant"; content: string };

// Extrai o thinking (raciocínio) e separa do conteúdo
function parseThinking(text: string): { thinking: string; content: string } {
  const match = text.match(/\[thinking\]([\s\S]*?)\[\/thinking\]/i);
  if (match) {
    const thinking = match[1].trim();
    const content = text.replace(/\[thinking\][\s\S]*?\[\/thinking\]/i, "").trim();
    return { thinking, content };
  }
  return { thinking: "", content: text };
}

// Syntax highlight básico
function highlightCode(code: string): string {
  return code
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>')
    .replace(/(&quot;.*?&quot;|".*?"|'.*?')/g, '<span class="string">$1</span>')
    .replace(/\b(function|const|let|var|if|else|for|while|return|import|export|class|async|await|new|this)\b/g, '<span class="keyword">$1</span>')
    .replace(/\b(\d+)\b/g, '<span class="number">$1</span>');
}

function formatContent(text: string): string {
  return text
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, _lang, code) => {
      return `<pre class="code-block">${highlightCode(code.trim())}</pre>`;
    })
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold">$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(/\n/g, "<br/>");
}

export const Message = memo(function Message({ role, content }: Props) {
  const isUser = role === "user";
  const parsed = parseThinking(content);
  const [displayed, setDisplayed] = useState(isUser ? parsed.content : "");
  const [typing, setTyping] = useState(!isUser);
  const [showThinking, setShowThinking] = useState(false);

  useEffect(() => {
    if (isUser) { setDisplayed(parsed.content); setTyping(false); return; }
    setDisplayed("");
    setTyping(true);
    let i = 0;
    const speed = Math.max(6, 25 - parsed.content.length / 30);
    const interval = setInterval(() => {
      i += 4;
      if (i >= parsed.content.length) {
        setDisplayed(parsed.content);
        setTyping(false);
        clearInterval(interval);
      } else setDisplayed(parsed.content.slice(0, i));
    }, speed);
    return () => clearInterval(interval);
  }, [parsed.content, isUser]);

  const formatted = formatContent(typing ? displayed : parsed.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative max-w-3xl mx-auto p-5 rounded-xl backdrop-blur-lg overflow-hidden ${
        isUser
          ? "bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-400/40 ml-auto"
          : "bg-gradient-to-br from-slate-900/80 to-slate-950/60 border"
      }`}
      style={{
        borderColor: isUser ? undefined : "var(--theme-primary)",
        boxShadow: isUser
          ? "0 0 40px rgba(251, 191, 36, 0.15)"
          : `0 0 40px var(--theme-glow)`,
      }}
    >
      {/* Cantos HUD */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2" style={{ borderColor: isUser ? "#fbbf24" : "var(--theme-primary)" }} />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2" style={{ borderColor: isUser ? "#fbbf24" : "var(--theme-primary)" }} />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2" style={{ borderColor: isUser ? "#fbbf24" : "var(--theme-primary)" }} />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2" style={{ borderColor: isUser ? "#fbbf24" : "var(--theme-primary)" }} />

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}
          className={`w-8 h-8 rounded-lg flex items-center justify-center relative ${isUser ? "bg-amber-500/20 border border-amber-400/50" : ""}`}
          style={!isUser ? { background: "var(--theme-bg)", border: "1px solid var(--theme-primary)" } : {}}
        >
          {isUser ? <span className="text-amber-300 text-xs font-bold">U</span>
            : <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--theme-primary)" }} />}
        </motion.div>
        <div className="flex-1">
          <div className={`text-[10px] uppercase tracking-[0.3em] font-bold font-orbitron ${isUser ? "text-amber-300" : ""}`}
            style={!isUser ? { color: "var(--theme-primary)" } : {}}>
            {isUser ? "OPERADOR" : "J.A.R.V.I.S."}
          </div>
          <div className="text-[9px] font-mono text-slate-600 tracking-widest mt-0.5">
            {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
              className="w-1 h-1 rounded-full" style={{ background: isUser ? "#fbbf24" : "var(--theme-primary)" }} />
          ))}
        </div>
      </div>

      {/* Thinking (colapsável) */}
      {parsed.thinking && !typing && (
        <div className="mb-4">
          <button
            onClick={() => setShowThinking((v) => !v)}
            className="text-[10px] font-mono tracking-widest px-3 py-1.5 rounded border transition-all hover:bg-slate-800/50 flex items-center gap-2"
            style={{ borderColor: "rgba(139, 92, 246, 0.4)", color: "#a78bfa" }}
          >
            <span>{showThinking ? "▼" : "▶"}</span>
            <span>RACIOCÍNIO {showThinking ? "OCULTO" : `(${parsed.thinking.split(" ").length} palavras)`}</span>
          </button>
          {showThinking && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="thinking-block mt-2"
            >
              {parsed.thinking}
            </motion.div>
          )}
        </div>
      )}

      {/* Conteúdo */}
      <div
        className={`text-slate-100 leading-relaxed text-[15px] relative ${typing ? "typewriter-cursor" : ""}`}
        dangerouslySetInnerHTML={{ __html: formatted }}
      />

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/50 flex justify-between text-[9px] font-mono tracking-widest">
        <span className="text-slate-600">{isUser ? "MSG.SENT" : "MSG.RECEIVED"}</span>
        <span className="text-slate-600">{parsed.content.length} chars</span>
      </div>
    </motion.div>
  );
});