import { motion } from "framer-motion";

type State = "idle" | "thinking" | "speaking";

export function ArcReactor({ state }: { state: State }) {
  const pulse = state === "thinking" ? 1.15 : state === "speaking" ? 1.08 : 1.0;
  const rotate = state === "thinking" ? 8 : 2;
  const ringColor = state === "speaking" ? "#fbbf24" : "#22d3ee";

  return (
    <div className="relative w-72 h-72 mx-auto">
      {/* Glow externo enorme */}
      <motion.div
        className="absolute -inset-8 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${ringColor}30 0%, transparent 70%)` }}
        animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, pulse * 1.05, 1] }}
        transition={{ duration: state === "idle" ? 3 : 1.2, repeat: Infinity }}
      />

      {/* Anel 1 — externo sólido */}
      <motion.div
        className="absolute inset-0 rounded-full border-2"
        style={{ borderColor: `${ringColor}88` }}
        animate={{ scale: [1, pulse, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: state === "idle" ? 3 : 1.2, repeat: Infinity }}
      />

      {/* Anel 2 — tracejado girando horário */}
      <motion.div
        className="absolute inset-3 rounded-full border-2 border-dashed"
        style={{ borderColor: `${ringColor}aa` }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20 / rotate, repeat: Infinity, ease: "linear" }}
      />

      {/* Anel 3 — segmentado girando anti-horário */}
      <motion.div
        className="absolute inset-7 rounded-full border-2"
        style={{
          borderColor: "transparent",
          borderTopColor: ringColor,
          borderRightColor: `${ringColor}44`,
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 12 / rotate, repeat: Infinity, ease: "linear" }}
      />

      {/* Anel 4 — tracejado médio */}
      <motion.div
        className="absolute inset-11 rounded-full border border-dashed"
        style={{ borderColor: `#fbbf2488` }}
        animate={{ rotate: 360 }}
        transition={{ duration: 30 / rotate, repeat: Infinity, ease: "linear" }}
      />

      {/* Anel 5 — arco interno */}
      <motion.div
        className="absolute inset-14 rounded-full border-2"
        style={{
          borderColor: "transparent",
          borderBottomColor: ringColor,
          borderLeftColor: `${ringColor}66`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8 / rotate, repeat: Infinity, ease: "linear" }}
      />

      {/* Glow interno */}
      <motion.div
        className="absolute inset-16 rounded-full blur-xl"
        style={{
          background: `radial-gradient(circle, ${ringColor}66 0%, transparent 70%)`,
        }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: state === "speaking" ? 0.5 : 1.8, repeat: Infinity }}
      />

      {/* Núcleo com texto */}
      <div className="absolute inset-20 rounded-full bg-slate-950 border-2 flex items-center justify-center"
        style={{ borderColor: `${ringColor}66` }}>
        <div className="text-center">
          <div className="font-orbitron text-[10px] tracking-widest" style={{ color: ringColor }}>
            {state === "idle" ? "STANDBY" : state === "thinking" ? "PROCESSING" : "SPEAKING"}
          </div>
          <div className="text-[7px] text-slate-500 mt-1 tracking-widest">
            v2.0
          </div>
        </div>
      </div>

      {/* Partículas orbitando (8 no total) */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{
            duration: 6 + i * 1.5,
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.3,
          }}
        >
          <div
            className="absolute w-1 h-1 rounded-full"
            style={{
              top: i % 2 === 0 ? "0%" : "100%",
              left: "50%",
              transform: "translateX(-50%)",
              background: i % 3 === 0 ? "#fbbf24" : ringColor,
              boxShadow: `0 0 6px ${i % 3 === 0 ? "#fbbf24" : ringColor}`,
            }}
          />
        </motion.div>
      ))}

      {/* Cantos HUD ao redor */}
      {[
        { top: "-20px", left: "-20px", borderRight: 0, borderBottom: 0 },
        { top: "-20px", right: "-20px", borderLeft: 0, borderBottom: 0 },
        { bottom: "-20px", left: "-20px", borderRight: 0, borderTop: 0 },
        { bottom: "-20px", right: "-20px", borderLeft: 0, borderTop: 0 },
      ].map((pos, i) => (
        <div
          key={i}
          className="absolute w-4 h-4"
          style={{
            ...pos,
            border: `2px solid ${ringColor}`,
            borderRightWidth: pos.borderRight !== undefined ? 0 : 2,
            borderBottomWidth: pos.borderBottom !== undefined ? 0 : 2,
            borderLeftWidth: pos.borderLeft !== undefined ? 0 : 2,
            borderTopWidth: pos.borderTop !== undefined ? 0 : 2,
          } as any}
        />
      ))}
    </div>
  );
}