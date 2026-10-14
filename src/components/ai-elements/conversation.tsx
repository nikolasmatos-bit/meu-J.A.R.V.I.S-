import { useEffect, useRef } from "react";
import { Message } from "./message";

type Msg = { id: string; role: "user" | "assistant"; content: string };

export function Conversation({
  messages,
  streamingText,
}: {
  messages: Msg[];
  streamingText?: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  if (messages.length === 0 && !streamingText) {
    return (
      <div className="py-16 text-center">
        <div className="font-mono text-[10px] tracking-[0.4em] text-slate-600 mb-3">
          // REGISTRO VAZIO
        </div>
        <div className="font-mono text-[11px] text-slate-700">
          aguardando primeira diretiva...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {messages.map((m, i) => (
        <Message key={m.id} role={m.role} content={m.content} index={i} />
      ))}

      {streamingText && (
        <div
          className="grid gap-4 py-4"
          style={{ gridTemplateColumns: "70px 1fr", borderBottom: `1px dashed var(--theme-glow)` }}
        >
          <div className="text-right select-none">
            <div className="font-mono text-[10px]" style={{ color: "var(--theme-primary)" }}>
              #{String(messages.length + 1).padStart(3, "0")}
            </div>
            <div className="font-mono text-[8px] text-slate-600 mt-0.5">AGORA</div>
            <div className="font-mono text-[11px] mt-1.5 animate-pulse" style={{ color: "var(--theme-primary)" }}>
              ►
            </div>
            <div className="font-mono text-[7px] text-slate-700 mt-0.5 tracking-widest">
              STREAM
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "var(--theme-primary)" }}>
                J.A.R.V.I.S.
              </div>
              <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, var(--theme-glow), transparent)" }} />
              <div className="font-mono text-[8px] tracking-widest animate-pulse" style={{ color: "var(--theme-primary)" }}>
                PROCESSANDO
              </div>
            </div>
            <div className="text-slate-200 leading-relaxed text-[14px] whitespace-pre-wrap typewriter-cursor">
              {streamingText}
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
