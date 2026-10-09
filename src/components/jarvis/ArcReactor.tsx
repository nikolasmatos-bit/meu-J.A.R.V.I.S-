import { motion } from "framer-motion";

type State = "idle" | "thinking" | "speaking";

export function ArcReactor({ state }: { state: State }) {
  const pulse = state === "thinking" ? 1.15 : state === "speaking" ? 1.08 : 1.0;
  const rotate = state === "thinking" ? 8 : 2;

  return (
    <div className="relative w-64 h-64 mx-auto">
      {/* Glow externo */}
      <motion.div
        className="absolute -inset-4 rounded-full bg-cyan-500/10 blur-2xl"
        animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, pulse, 1] }}
        transition={{ duration: state === "idle" ? 3 : 1.2, repeat: Infinity }}
      />

      {/* Anel externo */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-cyan-400/60"
        animate={{ scale: [1, pulse, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: state === "idle" ? 3 : 1.2, repeat: Infinity }}
      />

      {/* Anel tracejado girando */}
      <motion.div
        className="absolute inset-4 rounded-full border-2 border-dashed border-purple-400/70"
        animate={{ rotate: 360 }}
        transition={{ duration: 20 / rotate, repeat: Infinity, ease: "linear" }}
      />

      {/* Anel interno com arcos */}
      <motion.div
        className="absolute inset-8 rounded-full border border-cyan-300/40"
        animate={{ rotate: -360 }}
        transition={{ duration: 30 / rotate, repeat: Infinity, ease: "linear" }}
        style={{
          borderTopColor: "transparent",
          borderRightColor: "#22d3ee",
        }}
      />

      {/* Glow interno */}
      <motion.div
        className="absolute inset-12 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-600/30 blur-md"
        animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: state === "speaking" ? 0.6 : 2, repeat: Infinity }}
      />

      {/* Núcleo */}
      <div className="absolute inset-16 rounded-full bg-slate-950 border border-cyan-300/40 flex items-center justify-center">
        <span className="font-orbitron text-cyan-200 text-[10px] tracking-widest text-center px-2">
          {state === "idle"
            ? "STANDBY"
            : state === "thinking"
            ? "PROCESSANDO"
            : "RESPONDENDO"}
        </span>
      </div>

      {/* Partículas orbitando */}
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.5,
          }}
        >
          <div
            className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"
            style={{
              top: "0%",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}