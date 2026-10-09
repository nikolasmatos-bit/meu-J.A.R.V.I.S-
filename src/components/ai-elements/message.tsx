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
      className={`message-in max-w-3xl mx-auto p-5 rounded-lg border backdrop-blur-sm ${
        isUser
          ? "bg-amber-500/5 border-amber-400/30 ml-auto"
          : "bg-slate-900/60 border-red-500/30"
      }`}
      style={{
        boxShadow: isUser
          ? "0 0 20px rgba(251, 191, 36, 0.1)"
          : "0 0 20px rgba(239, 68, 68, 0.15)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isUser ? "bg-amber-400" : "bg-red-500"
          }`}
          style={{
            boxShadow: `0 0 8px ${isUser ? "#fbbf24" : "#ef4444"}`,
          }}
        />
        <div
          className={`text-[10px] uppercase tracking-widest font-semibold ${
            isUser ? "text-amber-300" : "text-red-300"
          }`}
        >
          {isUser ? "OPERADOR" : "J.A.R.V.I.S."}
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
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