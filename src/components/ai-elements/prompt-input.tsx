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
        className={`px-3 rounded border transition-all ${listening ? "bg-red-500 border-red-400 animate-pulse" : "bg-slate-800 border-cyan-400/30 hover:border-cyan-300"}`}
      >
        🎙
      </button>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Fale ou digite um comando…"
        disabled={disabled}
        className="flex-1 bg-slate-900/80 border border-cyan-400/30 rounded px-3 py-2 outline-none focus:border-cyan-300 text-slate-100 placeholder:text-slate-500"
      />
      <button
        onClick={submit}
        disabled={disabled}
        className="px-5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-semibold rounded font-orbitron text-xs tracking-widest"
      >
        ENVIAR
      </button>
    </div>
  );
}
