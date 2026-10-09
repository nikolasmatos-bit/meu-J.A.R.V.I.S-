import { useState } from "react";

type Props = {
  onSend: (text: string) => void;
  listening: boolean;
  onToggleMic: () => void;
  disabled?: boolean;
};

export function PromptInput({ onSend, listening, onToggleMic, disabled }: Props) {
  const [value, setValue] = useState("");
  const [focus, setFocus] = useState(false);

  const submit = () => {
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
  };

  return (
    <div className="flex gap-2 max-w-3xl mx-auto w-full items-stretch">
      {/* Botão microfone */}
      <button
        onClick={onToggleMic}
        className={`px-4 rounded-lg border-2 transition-all ${
          listening
            ? "bg-red-500 border-red-400 animate-pulse text-white"
            : "bg-slate-950/80 border-red-500/40 hover:border-amber-400/70 text-red-400"
        }`}
        style={{
          boxShadow: listening
            ? "0 0 20px rgba(239, 68, 68, 0.6)"
            : "0 0 8px rgba(239, 68, 68, 0.2)",
        }}
        title="Microfone"
      >
        🎙
      </button>

      {/* Input */}
      <div className="flex-1 relative group">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholder="Digite um comando, senhor…"
          disabled={disabled}
          className="w-full bg-slate-950/80 border-2 rounded-lg px-4 py-3 outline-none text-slate-100 placeholder:text-slate-600 tracking-wide transition-all disabled:opacity-40 font-mono text-sm"
          style={{
            borderColor: focus ? "#fbbf24" : "rgba(239, 68, 68, 0.4)",
            boxShadow: focus
              ? "0 0 24px rgba(251, 191, 36, 0.4), inset 0 0 12px rgba(251, 191, 36, 0.05)"
              : "0 0 12px rgba(239, 68, 68, 0.15)",
          }}
        />
        {/* Contador */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 font-mono tracking-widest pointer-events-none">
          {value.length.toString().padStart(4, "0")}
        </div>
        {/* Canto HUD superior */}
        <div
          className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 pointer-events-none transition-colors"
          style={{ borderColor: focus ? "#fbbf24" : "rgba(239, 68, 68, 0.6)" }}
        />
        <div
          className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 pointer-events-none transition-colors"
          style={{ borderColor: focus ? "#fbbf24" : "rgba(239, 68, 68, 0.6)" }}
        />
      </div>

      {/* Botão enviar */}
      <button
        onClick={submit}
        disabled={disabled}
        className="px-6 rounded-lg font-bold font-orbitron text-xs tracking-[0.2em] transition-all disabled:opacity-40 text-slate-950 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #ef4444 0%, #fbbf24 100%)",
          boxShadow: "0 0 20px rgba(239, 68, 68, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.1)",
        }}
      >
        ENVIAR
      </button>
    </div>
  );
}