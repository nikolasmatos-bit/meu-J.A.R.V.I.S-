import { memo } from "react";

type Props = { role: "user" | "assistant"; content: string };

export const Message = memo(function Message({ role, content }: Props) {
  const isUser = role === "user";
  return (
    <div className={`max-w-3xl mx-auto p-4 rounded-lg border ${isUser ? "bg-cyan-500/10 border-cyan-400/30 ml-auto" : "bg-slate-800/50 border-purple-400/20"}`}>
      <div className="text-[10px] uppercase tracking-widest text-cyan-300 mb-2">
        {isUser ? "▸ Você" : "◆ J.A.R.V.I.S."}
      </div>
      <div className="whitespace-pre-wrap leading-relaxed text-slate-100">{content}</div>
    </div>
  );
});
