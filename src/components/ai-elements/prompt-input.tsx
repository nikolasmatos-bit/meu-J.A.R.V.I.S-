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
    <div className="flex gap-2 max-w-3xl mx-auto w-full">
      {/* Microfone */}
      <button
        onClick={onToggleMic}
        className={`px-4 rounded-lg border-2 transition-all ${
          listening
            ? "bg-cyan-500 border-cyan-400 animate-pulse text-slate-950"
            : "bg-slate-950/80 border-cyan-500/40 hover:border-cyan-400 text-cyan-400"
        }`}
        style={{
          boxShadow: listening
            ? "0 0 20px rgba(34, 211, 238, 0.6)"
            : "0 0 8px rgba(34, 211, 238, 0.2)",
        }}
        title="Microfone"
      >
        🎙
      </button>

      {/* Input */}
      <div className="flex-1 relative">
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
            borderColor: focus ? "#22d3ee" : "rgba(34, 211, 238, 0.4)",
            boxShadow: focus
              ? "0 0 24px rgba(34, 211, 238, 0.4), inset 0 0 12px rgba(34, 211, 238, 0.05)"
              : "0 0 12px rgba(34, 211, 238, 0.15)",
          }}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 font-mono tracking-widest pointer-events-none">
          {value.length.toString().padStart(4, "0")}
        </div>
      </div>

      {/* Enviar */}
      <button
        onClick={submit}
        disabled={disabled}
        className="px-6 rounded-lg font-bold font-orbitron text-xs tracking-[0.2em] transition-all disabled:opacity-40 text-slate-950"
        style={{
          background: "linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)",
          boxShadow: "0 0 20px rgba(34, 211, 238, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.1)",
        }}
      >
        ENVIAR
      </button>
    </div>
  );
}