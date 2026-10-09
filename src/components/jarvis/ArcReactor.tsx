import { motion } from "framer-motion";

type State = "idle" | "thinking" | "speaking";

export function ArcReactor({ state }: { state: State }) {
  const isActive = state !== "idle";
  const ringColor = state === "speaking" ? "#fbbf24" : state === "thinking" ? "#22d3ee" : "#ef4444";
  const pulseSpeed = state === "idle" ? 3 : state === "thinking" ? 0.8 : 1.2;

  return (
    <div className="relative w-80 h-80 mx-auto">
      {/* Glow externo massivo */}
      <motion.div
        className="absolute -inset-16 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${ringColor}40 0%, transparent 60%)` }}
        animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.1, 1] }}
        transition={{ duration: pulseSpeed, repeat: Infinity }}
      />

      {/* Ondas de energia */}
      {isActive && [0, 1, 2].map((i) => (
        <motion.div
          key={`wave-${i}`}
          className="absolute inset-0 rounded-full border"
          style={{ borderColor: `${ringColor}60` }}
          animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.8 }}
        />
      ))}

      {/* SVG com anéis elaborados */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 320">
        {/* Anel externo com gaps */}
        <motion.circle
          cx="160" cy="160" r="150"
          fill="none"
          stroke={ringColor}
          strokeWidth="2"
          strokeDasharray="40 10 15 10"
          opacity="0.7"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "160px 160px" }}
        />

        {/* Segundo anel tracejado */}
        <motion.circle
          cx="160" cy="160" r="135"
          fill="none"
          stroke={ringColor}
          strokeWidth="1"
          strokeDasharray="2 6"
          opacity="0.5"
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "160px 160px" }}
        />

        {/* Arcos de segmentos (maradores) */}
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 360) / 24;
          const rad = (angle * Math.PI) / 180;
          const x1 = 160 + Math.cos(rad) * 118;
          const y1 = 160 + Math.sin(rad) * 118;
          const x2 = 160 + Math.cos(rad) * 126;
          const y2 = 160 + Math.sin(rad) * 126;
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={ringColor}
              strokeWidth={i % 6 === 0 ? 2 : 1}
              opacity={i % 6 === 0 ? 0.9 : 0.3}
            />
          );
        })}
      </svg>

      {/* Anel girando horário */}
      <motion.div
        className="absolute inset-4 rounded-full border-2"
        style={{
          borderColor: "transparent",
          borderTopColor: ringColor,
          borderRightColor: `${ringColor}40`,
          filter: `drop-shadow(0 0 6px ${ringColor})`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />

      {/* Anel girando anti-horário */}
      <motion.div
        className="absolute inset-8 rounded-full border-2"
        style={{
          borderColor: "transparent",
          borderBottomColor: "#fbbf24",
          borderLeftColor: "rgba(251, 191, 36, 0.3)",
          filter: "drop-shadow(0 0 6px #fbbf24)",
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
      />

      {/* Núcleo */}
      <motion.div
        className="absolute inset-20 rounded-full border-2 flex items-center justify-center bg-slate-950"
        style={{ borderColor: `${ringColor}88` }}
        animate={{
          boxShadow: [
            `0 0 20px ${ringColor}44`,
            `0 0 40px ${ringColor}88`,
            `0 0 20px ${ringColor}44`,
          ],
        }}
        transition={{ duration: pulseSpeed, repeat: Infinity }}
      >
        <div className="text-center">
          <div className="font-orbitron text-[11px] tracking-widest" style={{ color: ringColor }}>
            {state === "idle" ? "STANDBY" : state === "thinking" ? "PROCESSING" : "SPEAKING"}
          </div>
          <div className="text-[8px] text-slate-500 mt-1 font-mono">
            SYS v2.0.4
          </div>
        </div>
      </motion.div>

      {/* Partículas orbitando — 12 no total */}
      {Array.from({ length: 12 }).map((_, i) => {
        const radius = 100 + (i % 4) * 12;
        const duration = 5 + (i % 5) * 1.5;
        const size = i % 3 === 0 ? "w-1.5 h-1.5" : "w-1 h-1";
        const color = i % 3 === 0 ? "#fbbf24" : ringColor;
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              top: "50%",
              left: "50%",
              marginTop: -2,
              marginLeft: -2,
            }}
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
            <div
              className={`${size} rounded-full`}
              style={{ background: color, boxShadow: `0 0 8px ${color}` }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}