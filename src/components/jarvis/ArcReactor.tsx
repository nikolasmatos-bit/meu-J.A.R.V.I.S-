import { motion } from "framer-motion";

type State = "idle" | "thinking" | "speaking";

export function ArcReactor({ state }: { state: State }) {
  const isActive = state !== "idle";
  const ringColor = state === "speaking" ? "#fbbf24" : "#22d3ee";
  const pulseSpeed = state === "idle" ? 3 : state === "thinking" ? 0.8 : 1.2;

  return (
    <div className="relative w-72 h-72 mx-auto">
      {/* Glow externo massivo */}
      <motion.div
        className="absolute -inset-16 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${ringColor}50, transparent 60%)` }}
        animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.1, 1] }}
        transition={{ duration: pulseSpeed, repeat: Infinity }}
      />

      {/* Ondas de energia expandindo */}
      {isActive && [0, 1, 2].map((i) => (
        <motion.div
          key={`wave-${i}`}
          className="absolute inset-0 rounded-full border"
          style={{ borderColor: `${ringColor}70` }}
          animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.8 }}
        />
      ))}

      {/* SVG com anéis elaborados */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 288 288">
        {/* Anel externo com traços */}
        <motion.circle
          cx="144" cy="144" r="135"
          fill="none"
          stroke={ringColor}
          strokeWidth="2"
          strokeDasharray="40 10 15 10"
          opacity="0.7"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "144px 144px" }}
        />

        {/* Segundo anel tracejado fino */}
        <motion.circle
          cx="144" cy="144" r="120"
          fill="none"
          stroke={ringColor}
          strokeWidth="1"
          strokeDasharray="2 6"
          opacity="0.5"
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "144px 144px" }}
        />

        {/* Marcadores radiais */}
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 360) / 24;
          const rad = (angle * Math.PI) / 180;
          const x1 = 144 + Math.cos(rad) * 105;
          const y1 = 144 + Math.sin(rad) * 105;
          const x2 = 144 + Math.cos(rad) * 113;
          const y2 = 144 + Math.sin(rad) * 113;
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
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
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
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* Núcleo */}
      <motion.div
        className="absolute inset-16 rounded-full border-2 flex items-center justify-center bg-slate-950"
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
            v2.0
          </div>
        </div>
      </motion.div>

      {/* 12 partículas orbitando */}
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