import { useEffect, useState } from "react";
import { useJarvis } from "./Bootstrap";

export function SystemWidgets() {
  const { user } = useJarvis();
  const [time, setTime] = useState(new Date());
  const [cpu, setCpu] = useState(12);
  const [mem, setMem] = useState(43);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    const m = setInterval(() => {
      setCpu((c) => Math.max(5, Math.min(95, c + (Math.random() - 0.5) * 8)));
      setMem((m) => Math.max(20, Math.min(90, m + (Math.random() - 0.5) * 3)));
    }, 2000);
    return () => { clearInterval(t); clearInterval(m); };
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto px-6">
      <Widget label="HORA LOCAL" value={time.toLocaleTimeString("pt-BR")} />
      <Widget label="OPERADOR" value={user?.email?.split("@")[0] ?? "—"} />
      <Widget label="NÚCLEO" value={`${cpu.toFixed(0)}%`} bar={cpu} />
      <Widget label="MEMÓRIA" value={`${mem.toFixed(0)}%`} bar={mem} />
    </div>
  );
}

function Widget({ label, value, bar }: { label: string; value: string; bar?: number }) {
  return (
    <div className="relative hud-corner border border-cyan-400/20 bg-slate-900/40 p-3">
      <div className="text-[10px] tracking-widest text-cyan-400/70">{label}</div>
      <div className="font-orbitron text-cyan-100 text-sm mt-1 truncate">{value}</div>
      {bar !== undefined && (
        <div className="mt-2 h-1 bg-slate-800 rounded overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all" style={{ width: `${bar}%` }} />
        </div>
      )}
    </div>
  );
}
