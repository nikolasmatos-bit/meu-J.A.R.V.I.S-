import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type State = "idle" | "thinking" | "speaking";

export function ArcReactor({ state, color }: { state: State; color?: string }) {
  const [themeColor, setThemeColor] = useState(color ?? "#22d3ee");

  useEffect(() => {
    if (color) {
      setThemeColor(color);
      return;
    }
    const update = () => {
      const c = getComputedStyle(document.documentElement)
        .getPropertyValue("--theme-primary")
        .trim();
      if (c) setThemeColor(c);
    };
    update();
    // Observer pra mudanças de tema
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, [color]);

  const isActive = state !== "idle";
  const isSpeaking = state === "speaking";
  const ringColor = isSpeaking ? "#fbbf24" : themeColor;
  const pulseSpeed = state === "idle" ? 3 : state === "thinking" ? 0.8 : 1.2;

  // Converte hex pra rgba com alpha
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div className="relative w-80 h-80 mx-auto" style={{ perspective: 1000 }}>
      {/* Aura */}
      <motion.div
        className="absolute -inset-20 rounded-full"
        style={{
          background: `radial-gradient(circle, ${hexToRgba(ringColor, 0.35)} 0%, transparent 70%)`,
          filter: "blur(40px)",
        }}
        animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.15, 1] }}
        transition={{ duration: pulseSpeed, repeat: Infinity }}
      />

      {/* Ondas */}
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full"
          style={{ border: `1px solid ${hexToRgba(ringColor, 0.5)}` }}
          animate={{ scale: [0.5, 2.2], opacity: [0.6, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 0.75, ease: "easeOut" }}
        />
      ))}

      {/* SVG anéis */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 320">
        <motion.circle
          cx="160" cy="160" r="150"
          fill="none"
          stroke={ringColor}
          strokeWidth="2"
          strokeDasharray="80 20 15 20"
          opacity="0.6"
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "160px 160px" }}
        />
        <motion.circle
          cx="160" cy="160" r="138"
          fill="none"
          stroke={ringColor}
          strokeWidth="1"
          strokeDasharray="2 8"
          opacity="0.4"
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "160px 160px" }}
        />
        {Array.from({ length: 48 }).map((_, i) => {
          const angle = (i * 360) / 48;
          const rad = (angle * Math.PI) / 180;
          const inner = i % 6 === 0 ? 122 : 128;
          const outer = 133;
          const x1 = 160 + Math.cos(rad) * inner;
          const y1 = 160 + Math.sin(rad) * inner;
          const x2 = 160 + Math.cos(rad) * outer;
          const y2 = 160 + Math.sin(rad) * outer;
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={ringColor}
              strokeWidth={i % 6 === 0 ? 2 : 1}
              opacity={i % 6 === 0 ? 0.9 : 0.3}
            />
          );
        })}
      </svg>

      {/* Anel girando */}
      <motion.div
        className="absolute inset-6 rounded-full border-2"
        style={{
          borderColor: "transparent",
          borderTopColor: ringColor,
          borderRightColor: hexToRgba(ringColor, 0.3),
          filter: `drop-shadow(0 0 8px ${ringColor})`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-12 rounded-full border-2"
        style={{
          borderColor: "transparent",
          borderBottomColor: "#fbbf24",
          borderLeftColor: "rgba(251, 191, 36, 0.3)",
          filter: "drop-shadow(0 0 8px #fbbf24)",
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />

      {/* Núcleo */}
      <motion.div
        className="absolute inset-24 rounded-full border-2 flex items-center justify-center bg-slate-950"
        style={{ borderColor: hexToRgba(ringColor, 0.7) }}
        animate={{
          boxShadow: [
            `0 0 25px ${hexToRgba(ringColor, 0.4)}`,
            `0 0 50px ${hexToRgba(ringColor, 0.8)}`,
            `0 0 25px ${hexToRgba(ringColor, 0.4)}`,
          ],
        }}
        transition={{ duration: pulseSpeed, repeat: Infinity }}
      >
        <div className="text-center">
          <div
            className="font-orbitron text-sm tracking-widest"
            style={{ color: ringColor, textShadow: `0 0 10px ${ringColor}` }}
          >
            {state === "idle" ? "STANDBY" : state === "thinking" ? "PROCESSING" : "SPEAKING"}
          </div>
          <div className="text-[9px] text-slate-500 mt-1 font-mono tracking-widest">v2.0.4</div>
        </div>
      </motion.div>

      {/* Partículas */}
      {Array.from({ length: 12 }).map((_, i) => {
        const radius = 110 + (i % 4) * 15;
        const duration = 5 + (i % 5) * 1.5;
        const size = i % 3 === 0 ? "w-1.5 h-1.5" : "w-1 h-1";
        const color = i % 3 === 0 ? "#fbbf24" : ringColor;
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{ top: "50%", left: "50%", marginTop: -2, marginLeft: -2 }}
            animate={{
              x: [
                Math.cos(0) * radius,
                Math.cos((Math.PI * 2) / 3) * radius,
                Math.cos((Math.PI * 4) / 3) * radius,
                Math.cos(0) * radius,
              ],
              y: [
                Math.sin(0) * radius,
                Math.sin((Math.PI * 2) / 3) * radius,
                Math.sin((Math.PI * 4) / 3) * radius,
                Math.sin(0) * radius,
              ],
            }}
            transition={{ duration, repeat: Infinity, ease: "linear" }}
          >
            <div className={`${size} rounded-full`} style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
          </motion.div>
        );
      })}

      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ border: `2px solid ${ringColor}` }}
          animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </div>
  );
}