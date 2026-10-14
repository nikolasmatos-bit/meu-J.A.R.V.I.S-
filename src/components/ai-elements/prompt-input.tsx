import { useRef, useState } from "react";

type Props = {
  onSend: (text: string) => void;
  listening: boolean;
  onToggleMic: () => void;
  disabled?: boolean;
  onHistory?: (dir: "up" | "down") => string;
  primaryColor?: string;
};

export function PromptInput({ onSend, listening, onToggleMic, disabled, onHistory, primaryColor = "#22d3ee" }: Props) {
  const [value, setValue] = useState("");
  const [focus, setFocus] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { submit(); return; }
    if (e.key === "ArrowUp" && onHistory && !value) {
      e.preventDefault();
      const prev = onHistory("up");
      if (prev) setValue(prev);
    }
    if (e.key === "ArrowDown" && onHistory) {
      e.preventDefault();
      const next = onHistory("down");
      setValue(next || "");
    }
  };

  return (
    <div className="flex gap-2 max-w-3xl mx-auto w-full">
      <button
        onClick={onToggleMic}
        className={`px-4 rounded-lg border-2 transition-all ${listening ? "animate-pulse text-slate-950" : "bg-slate-950/80"}`}
        style={{
          background: listening ? primaryColor : undefined,
          borderColor: listening ? primaryColor : `${primaryColor}66`,
          color: listening ? "#020617" : primaryColor,
          boxShadow: listening ? `0 0 20px ${primaryColor}99` : `0 0 8px ${primaryColor}33`,
        }}
        title="Microfone"
      >
        🎙
      </button>

      <div className="flex-1 relative">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholder="Digite um comando, senhor…"
          disabled={disabled}
          className="w-full bg-slate-950/80 border-2 rounded-lg px-4 py-3 outline-none text-slate-100 placeholder:text-slate-600 tracking-wide transition-all disabled:opacity-40 font-mono text-sm"
          style={{
            borderColor: focus ? primaryColor : `${primaryColor}66`,
            boxShadow: focus
              ? `0 0 24px ${primaryColor}66, inset 0 0 12px ${primaryColor}0d`
              : `0 0 12px ${primaryColor}26`,
          }}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 font-mono tracking-widest pointer-events-none">
          {value.length.toString().padStart(4, "0")}
        </div>
      </div>

      <button
        onClick={submit}
        disabled={disabled}
        className="px-6 rounded-lg font-bold font-orbitron text-xs tracking-[0.2em] transition-all disabled:opacity-40 text-slate-950"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)`,
          boxShadow: `0 0 20px ${primaryColor}88`,
        }}
      >
        ENVIAR
      </button>
    </div>
  );
}