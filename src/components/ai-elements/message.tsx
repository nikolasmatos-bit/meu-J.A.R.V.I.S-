import { memo, useEffect, useState } from "react";

type Props = { role: "user" | "assistant"; content: string };

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

    // Efeito typewriter só pro JARVIS
    setDisplayed("");
    setTyping(true);
    let i = 0;
    const speed = Math.max(8, 30 - content.length / 20);

    const interval = setInterval(() => {
      i += 3;
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

  return (
    <div
      className={`message-in max-w-3xl mx-auto p-4 rounded-lg border transition-all ${
        isUser
          ? "bg-cyan-500/10 border-cyan-400/30 ml-auto"
          : "bg-slate-800/50 border-purple-400/20"
      }`}
    >
      <div className="text-[10px] uppercase tracking-widest text-cyan-300 mb-2">
        {isUser ? "▸ Você" : "◆ J.A.R.V.I.S."}
      </div>
      <div
        className={`whitespace-pre-wrap leading-relaxed text-slate-100 ${
          typing ? "typewriter-cursor" : ""
        }`}
      >
        {displayed}
      </div>
    </div>
  );
});