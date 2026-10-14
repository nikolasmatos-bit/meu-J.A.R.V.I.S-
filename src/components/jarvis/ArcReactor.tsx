import { motion } from "framer-motion";

type State = "idle" | "thinking" | "speaking";

export function ArcReactor({ state }: { state: State }) {
  const isActive = state !== "idle";
  const ringColor = state === "speaking" ? "#fbbf24" : "#22d3ee";
  const pulseSpeed = state === "idle" ? 3 : state === "thinking" ? 0.8 : 1.2;

  return (
    <div className="relative w-96 h-96 mx-auto">
      {/* Aura gigante */}
      <motion.div
        className="absolute -inset-24 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${ringColor}40, transparent 60%)` }}
        animate={{ opacity: [0.2, 0.6, 0.2], scale: [1, 1.15, 1] }}
        transition={{ duration: pulseSpeed, repeat: Infinity }}
      />

      {/* Ondas de energia */}
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={`wave-${i}`}
          className="absolute inset-0 rounded-full border"
          style={{ borderColor: `${ringColor}50` }}
          animate={{ scale: [1, 3], opacity: [0.5, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 0.75, ease: "easeOut" }}
        />
      ))}

      {/* SVG com anéis elaborados */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 384 384">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={ringColor} />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor={ringColor} />
          </linearGradient>
        </defs>

        {/* Anel externo com traços longos */}
        <motion.circle
          cx="192" cy="192" r="180"
          fill="none"
          stroke={ringColor}
          strokeWidth="2"
          strokeDasharray="80 20 15 20"
          opacity="0.6"
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "192px 192px" }}
        />

        {/* Anel tracejado fino */}
        <motion.circle
          cx="192" cy="192" r="165"
          fill="none"
          stroke={ringColor}
          strokeWidth="1"
          strokeDasharray="2 8"
          opacity="0.4"
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "192px 192px" }}
        />

        {/* 60 marcadores radiais */}
        {Array.from({ length: 60 }).map((_, i) => {
          const angle = (i * 360) / 60;
          const rad = (angle * Math.PI) / 180;
          const inner = i % 5 === 0 ? 145 : 152;
          const outer = 158;
          const x1 = 192 + Math.cos(rad) * inner;
          const y1 = 192 + Math.sin(rad) * inner;
          const x2 = 192 + Math.cos(rad) * outer;
          const y2 = 192 + Math.sin(rad) * outer;
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={ringColor}
              strokeWidth={i % 5 === 0 ? 2 : 1}
              opacity={i % 5 === 0 ? 0.9 : 0.3}
            />
          );
        })}

        {/* Anel interno com marcador de progresso */}
        <motion.circle
          cx="192" cy="192" r="135"
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="3"
          strokeDasharray="200 300"
          strokeLinecap="round"
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "192px 192px" }}
        />
      </svg>

      {/* Anel girando horário */}
      <motion.div
        className="absolute inset-8 rounded-full border-2"
        style={{
          borderColor: "transparent",
          borderTopColor: ringColor,
          borderRightColor: `${ringColor}30`,
          filter: `drop-shadow(0 0 8px ${ringColor})`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />

      {/* Anel girando anti-horário */}
      <motion.div
        className="absolute inset-16 rounded-full border-2"
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
        className="absolute inset-28 rounded-full border-2 flex items-center justify-center bg-slate-950"
        style={{ borderColor: `${ringColor}aa` }}
        animate={{
          boxShadow: [
            `0 0 30px ${ringColor}66`,
            `0 0 60px ${ringColor}cc`,
            `0 0 30px ${ringColor}66`,
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
          <div className="text-[9px] text-slate-500 mt-1 font-mono tracking-widest">
            v2.0.4
          </div>
        </div>
      </motion.div>

      {/* 16 partículas orbitando */}
      {Array.from({ length: 16 }).map((_, i) => {
        const radius = 130 + (i % 5) * 15;
        const duration = 5 + (i % 6) * 1.5;
        const size = i % 4 === 0 ? "w-2 h-2" : "w-1 h-1";
        const color = i % 3 === 0 ? "#fbbf24" : ringColor;
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              top: "50%",
              left: "50%",
              marginTop: -3,
              marginLeft: -3,
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
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ duration, repeat: Infinity, ease: "linear" }}
          >
            <div
              className={`${size} rounded-full`}
              style={{ background: color, boxShadow: `0 0 10px ${color}` }}
            />
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