import { useState } from "react";

type Props = {
  onSend: (text: string) => void;
  listening: boolean;
  onToggleMic: () => void;
  disabled?: boolean;
};

export function PromptInput({ onSend, listening, onToggleMic, disabled }: Props) {
  const [value, setValue] = useState("");

  const submit = () => {
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
  };

  return (
    <div className="flex gap-2 max-w-3xl mx-auto w-full">
      <button
        onClick={onToggleMic}
        className={`px-4 rounded border transition-all ${
          listening
            ? "bg-red-500 border-red-400 animate-pulse text-white"
            : "bg-slate-900/60 border-red-500/30 hover:border-amber-400/60 text-red-300"
        }`}
        title="Microfone"
      >
        🎙
      </button>

      <div className="flex-1 relative">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Digite um comando, senhor…"
          disabled={disabled}
          className="w-full bg-slate-900/60 border border-red-500/30 rounded px-4 py-2.5 outline-none focus:border-amber-400/60 text-slate-100 placeholder:text-slate-500 tracking-wide transition-all disabled:opacity-40"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 font-orbitron tracking-widest hidden md:block">
          {value.length} chars
        </div>
      </div>

      <button
        onClick={submit}
        disabled={disabled}
        className="px-6 bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-400 hover:to-amber-400 disabled:opacity-40 text-slate-950 font-bold rounded font-orbitron text-xs tracking-widest transition-all"
        style={{ boxShadow: "0 0 15px rgba(239, 68, 68, 0.3)" }}
      >
        ENVIAR
      </button>
    </div>
  );
}