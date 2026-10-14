import { memo, useEffect, useState } from "react";

type Props = {
  role: "user" | "assistant";
  content: string;
  index?: number;
};

function parseThinking(text: string): { thinking: string; content: string } {
  const match = text.match(/\[thinking\]([\s\S]*?)\[\/thinking\]/i);
  if (match) {
    return {
      thinking: match[1].trim(),
      content: text.replace(/\[thinking\][\s\S]*?\[\/thinking\]/i, "").trim(),
    };
  }
  return { thinking: "", content: text };
}

function highlightCode(code: string): string {
  return code
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, '<span class="tok-comment">$1</span>')
    .replace(/(&quot;.*?&quot;|".*?"|'.*?')/g, '<span class="tok-string">$1</span>')
    .replace(/\b(function|const|let|var|if|else|for|while|return|import|export|class|async|await|new|this|typeof|try|catch|finally|throw|extends|super|yield|static)\b/g, '<span class="tok-keyword">$1</span>')
    .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-number">$1</span>')
    .replace(/\b([a-zA-Z_$][\w$]*)\s*\(/g, '<span class="tok-function">$1</span>(');
}

function formatContent(text: string): string {
  return text
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, _lang, code) => {
      return `<div class="code-line"><span class="code-marker">$</span><pre>${highlightCode(code.trim())}</pre></div>`;
    })
    .replace(/`([^`]+)`/g, '<code class="tok-inline">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="tok-strong">$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/^\- (.+)$/gm, '<div class="tok-list">→ $1</div>')
    .replace(/\n/g, "<br/>");
}

export const Message = memo(function Message({ role, content, index = 0 }: Props) {
  const isUser = role === "user";
  const parsed = parseThinking(content);
  const [displayed, setDisplayed] = useState(isUser ? parsed.content : "");
  const [typing, setTyping] = useState(!isUser);
  const [showThinking, setShowThinking] = useState(false);

  useEffect(() => {
    if (isUser) {
      setDisplayed(parsed.content);
      setTyping(false);
      return;
    }
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
      } else {
        setDisplayed(parsed.content.slice(0, i));
      }
    }, speed);
    return () => clearInterval(interval);
  }, [parsed.content, isUser]);

  const formatted = formatContent(typing ? displayed : parsed.content);

  const accent = isUser ? "#fbbf24" : "var(--theme-primary)";
  const accentFade = isUser ? "rgba(251,191,36,0.25)" : "var(--theme-glow)";
  const time = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div
      className="grid gap-4 py-4 group transition-colors"
      style={{
        gridTemplateColumns: "70px 1fr",
        borderBottom: `1px dashed ${accentFade}`,
      }}
    >
      {/* MARGEM ESQUERDA — número + timestamp + direção */}
      <div className="text-right select-none">
        <div className="font-mono text-[10px] tabular-nums" style={{ color: `${accent}cc` }}>
          #{String(index + 1).padStart(3, "0")}
        </div>
        <div className="font-mono text-[8px] tabular-nums text-slate-600 mt-0.5">
          {time}
        </div>
        <div className="font-mono text-[11px] mt-1.5" style={{ color: accent }}>
          {isUser ? "◄" : "►"}
        </div>
        <div className="font-mono text-[7px] text-slate-700 mt-0.5 tracking-widest">
          {isUser ? "SENT" : "RECV"}
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="min-w-0">
        {/* Header da linha */}
        <div className="flex items-center gap-3 mb-2">
          <div
            className="font-mono text-[10px] tracking-[0.3em]"
            style={{ color: accent }}
          >
            {isUser ? "OPERADOR" : "J.A.R.V.I.S."}
          </div>
          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${accentFade}, transparent)` }} />
          <div className="font-mono text-[8px] tracking-widest text-slate-700">
            {parsed.thinking ? "THINKING" : "DIRECT"}
          </div>
        </div>

        {/* Thinking colapsável */}
        {parsed.thinking && !typing && (
          <div className="mb-3">
            <button
              onClick={() => setShowThinking((v) => !v)}
              className="font-mono text-[9px] tracking-[0.2em] transition-all hover:opacity-100 opacity-60 flex items-center gap-2"
              style={{ color: "#a78bfa" }}
            >
              <span>{showThinking ? "▼" : "►"}</span>
              <span>RACIOCÍNIO · {parsed.thinking.split(" ").length} palavras</span>
            </button>
            {showThinking && (
              <div
                className="mt-2 pl-4 border-l-2 font-mono text-[12px] leading-relaxed whitespace-pre-wrap"
                style={{ borderColor: "#a78bfa66", color: "#c4b5fd" }}
              >
                {parsed.thinking}
              </div>
            )}
          </div>
        )}

        {/* Corpo */}
        <div
          className={`chat-content text-slate-200 leading-relaxed text-[14px] ${typing ? "typewriter-cursor" : ""}`}
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      </div>

      <style>{`
        .chat-content .tok-inline {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 0 4px;
          font-family: "Courier New", monospace;
          font-size: 12px;
          color: #67e8f9;
        }
        .chat-content .tok-strong { color: #fff; font-weight: 600; }
        .chat-content .tok-list { padding-left: 4px; margin: 2px 0; color: #cbd5e1; }
        .chat-content .code-line {
          display: flex;
          gap: 8px;
          margin: 10px 0;
          padding: 10px 12px;
          background: #000;
          border-left: 2px solid var(--theme-primary);
          font-family: "Courier New", monospace;
          font-size: 12px;
          overflow-x: auto;
        }
        .chat-content .code-marker {
          color: var(--theme-primary);
          opacity: 0.5;
          user-select: none;
        }
        .chat-content .code-line pre {
          margin: 0;
          white-space: pre;
          color: #cbd5e1;
        }
        .chat-content .tok-comment { color: #64748b; font-style: italic; }
        .chat-content .tok-string { color: #86efac; }
        .chat-content .tok-keyword { color: #c084fc; font-weight: 600; }
        .chat-content .tok-number { color: #fbbf24; }
        .chat-content .tok-function { color: #60a5fa; }
      `}</style>
    </div>
  );
});
