import { useRef, useState } from "react";

type Props = {
  onSend: (text: string) => void;
  listening: boolean;
  onToggleMic: () => void;
  disabled?: boolean;
  onHistory?: (dir: "up" | "down") => string;
  primaryColor?: string;
};

export function PromptInput({
  onSend,
  listening,
  onToggleMic,
  disabled,
  onHistory,
  primaryColor = "#22d3ee",
}: Props) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
    inputRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { submit(); return; }
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
    <div className="font-mono">
      <div className="flex items-center gap-3 mb-1.5">
        <span className="text-[9px] tracking-[0.3em]" style={{ color: `${primaryColor}88` }}>
          INPUT
        </span>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${primaryColor}33, transparent)` }} />
        <span className="text-[9px] tracking-widest text-slate-700">
          {value.length.toString().padStart(3, "0")} CHARS
        </span>
      </div>

      <div
        className="flex items-stretch border transition-all duration-200"
        style={{
          borderColor: focused ? primaryColor : `${primaryColor}44`,
          background: "#05070d",
          boxShadow: focused ? `0 0 20px ${primaryColor}33` : "none",
        }}
      >
        <div
          className="flex items-center px-3 border-r select-none text-[11px] tracking-widest shrink-0"
          style={{ borderColor: `${primaryColor}33`, color: primaryColor }}
        >
          <span className="opacity-60">CMD</span>
          <span className="mx-1.5 opacity-40">›</span>
        </div>

        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="digite sua diretiva_"
          disabled={disabled}
          className="flex-1 bg-transparent px-3 py-3 outline-none text-slate-100 placeholder:text-slate-700 text-[13px] tracking-wide disabled:opacity-40"
          autoComplete="off"
        />

        <button
          onClick={onToggleMic}
          className="px-3 border-l text-[11px] tracking-widest transition-all shrink-0"
          style={{
            borderColor: `${primaryColor}33`,
            color: listening ? "#05070d" : `${primaryColor}88`,
            background: listening ? primaryColor : "transparent",
          }}
          title="Microfone"
        >
          {listening ? "● ON" : "◉ MIC"}
        </button>

        <button
          onClick={submit}
          disabled={disabled || !value.trim()}
          className="px-5 text-[10px] tracking-[0.3em] font-bold transition-all shrink-0 disabled:opacity-30"
          style={{
            background: value.trim() && !disabled ? primaryColor : "transparent",
            color: value.trim() && !disabled ? "#05070d" : primaryColor,
            borderLeft: `1px solid ${primaryColor}33`,
          }}
        >
          EXEC ▸
        </button>
      </div>

      <div className="flex justify-between text-[8px] tracking-widest text-slate-700 mt-1.5">
        <span>ENTER · enviar</span>
        <span>↑ · histórico</span>
        <span>ESC · fechar menus</span>
      </div>
    </div>
  );
}