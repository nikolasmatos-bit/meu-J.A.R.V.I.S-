import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type State = "idle" | "thinking" | "speaking";

// ============================================
// HUD SUPERIOR — Telemetria em tempo real
// ============================================
export function TopHud({ color, state }: { color: string; state: State }) {
  const [time, setTime] = useState(new Date());
  const [cpu, setCpu] = useState(23);
  const [mem, setMem] = useState(45);
  const [net, setNet] = useState(82);
  const [temp, setTemp] = useState(38);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    const m = setInterval(() => {
      setCpu((v) => Math.max(15, Math.min(95, v + (Math.random() - 0.5) * 6)));
      setMem((v) => Math.max(20, Math.min(90, v + (Math.random() - 0.5) * 4)));
      setNet((v) => Math.max(40, Math.min(100, v + (Math.random() - 0.5) * 5)));
      setTemp((v) => Math.max(30, Math.min(65, v + (Math.random() - 0.5) * 2)));
    }, 1200);
    return () => { clearInterval(t); clearInterval(m); };
  }, []);

  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="fixed top-0 left-0 right-0 z-30 pointer-events-none"
    >
      <div className="flex justify-between items-stretch px-4 pt-4 gap-4">
        {/* BLOCO ESQUERDO */}
        <div className="flex items-center gap-3 px-4 py-2 border backdrop-blur-xl rounded-lg"
          style={{ borderColor: `${color}44`, background: "rgba(2, 6, 23, 0.7)" }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 rounded-full border-2 border-t-transparent"
            style={{ borderColor: color }}
          />
          <div className="text-[10px] font-mono tracking-widest" style={{ color }}>
            {time.toLocaleTimeString("pt-BR")}
          </div>
          <div className="w-px h-4" style={{ background: `${color}44` }} />
          <div className="text-[10px] font-mono tracking-widest text-slate-500">
            {time.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
        </div>

        {/* BLOCO CENTRAL — MÉTRICAS */}
        <div className="flex items-center gap-4 px-5 py-2 border backdrop-blur-xl rounded-lg"
          style={{ borderColor: `${color}44`, background: "rgba(2, 6, 23, 0.7)" }}>
          <MiniMetric label="CPU" value={cpu} color={color} />
          <MiniMetric label="MEM" value={mem} color={color} />
          <MiniMetric label="NET" value={net} color={color} />
          <MiniMetric label="TMP" value={temp} color="#f59e0b" />
        </div>

        {/* BLOCO DIREITO — STATUS */}
        <div className="flex items-center gap-3 px-4 py-2 border backdrop-blur-xl rounded-lg"
          style={{ borderColor: `${color}44`, background: "rgba(2, 6, 23, 0.7)" }}>
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-emerald-400"
            style={{ boxShadow: "0 0 10px #10b981" }}
          />
          <div className="text-[10px] font-mono tracking-widest text-emerald-300">
            {state === "idle" ? "STANDBY" : state === "thinking" ? "PROCESSING" : "SPEAKING"}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MiniMetric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 min-w-[70px]">
      <div className="text-[8px] font-mono tracking-widest" style={{ color }}>{label}</div>
      <div className="flex-1 h-1.5 bg-slate-900 rounded-sm overflow-hidden">
        <motion.div
          className="h-full"
          style={{ background: color, boxShadow: `0 0 6px ${color}` }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>
      <div className="text-[9px] font-mono tabular-nums w-7 text-right" style={{ color }}>
        {value.toFixed(0)}
      </div>
    </div>
  );
}

// ============================================
// HUD INFERIOR — Telemetria de sessão
// ============================================
export function BottomHud({ color, messageCount, tokens }: { color: string; messageCount: number; tokens: number }) {
  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none px-4 pb-3"
    >
      <div className="flex justify-between items-end gap-4">
        <div className="flex items-center gap-3 px-4 py-2 border backdrop-blur-xl rounded-lg"
          style={{ borderColor: `${color}33`, background: "rgba(2, 6, 23, 0.7)" }}>
          <div className="text-[9px] font-mono tracking-widest text-slate-500">
            SESSION: <span style={{ color }}>{Math.random().toString(36).slice(2, 10).toUpperCase()}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 px-4 py-2 border backdrop-blur-xl rounded-lg"
          style={{ borderColor: `${color}33`, background: "rgba(2, 6, 23, 0.7)" }}>
          <StatChip label="MSGS" value={messageCount} color={color} />
          <StatChip label="TOKENS" value={`~${tokens}`} color={color} />
          <StatChip label="PING" value={`${Math.floor(20 + Math.random() * 40)}ms`} color="#10b981" />
        </div>
      </div>
    </motion.div>
  );
}

function StatChip({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-[8px] font-mono tracking-widest text-slate-500">{label}</div>
      <div className="text-[10px] font-mono tabular-nums" style={{ color }}>{value}</div>
    </div>
  );
}

// ============================================
// MINIMAPA DE CONVERSA — indicador de scroll
// ============================================
export function ConversationMiniMap({ messageCount, color }: { messageCount: number; color: string }) {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const total = target.scrollHeight - target.clientHeight;
      const progress = total > 0 ? target.scrollTop / total : 0;
      setScrollProgress(progress);
    };

    const main = document.querySelector("main");
    if (main) {
      main.addEventListener("scroll", handleScroll, true);
      return () => main.removeEventListener("scroll", handleScroll, true);
    }
  }, []);

  if (messageCount === 0) return null;

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="fixed left-2 top-1/2 -translate-y-1/2 z-20 hidden lg:flex flex-col items-center gap-2 pointer-events-none"
    >
      <div className="text-[8px] font-mono tracking-widest vertical-text" style={{ color: `${color}66`, writingMode: "vertical-rl" }}>
        SCROLL
      </div>
      <div className="relative w-1 h-48 rounded-full overflow-hidden" style={{ background: `${color}22` }}>
        <motion.div
          className="absolute top-0 left-0 w-full rounded-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
          animate={{
            height: `${Math.max(8, messageCount * 3)}%`,
            top: `${Math.min(92, scrollProgress * 100)}%`,
          }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <div className="text-[8px] font-mono tabular-nums" style={{ color }}>
        {Math.round(scrollProgress * 100)}%
      </div>
    </motion.div>
  );
}