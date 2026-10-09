import { motion } from "framer-motion";

type State = "idle" | "thinking" | "speaking";

export function ArcReactor({ state }: { state: State }) {
  const pulse = state === "thinking" ? 1.15 : state === "speaking" ? 1.08 : 1.0;
  const rotate = state === "thinking" ? 8 : 2;

  return (
    <div className="relative w-56 h-56 mx-auto">
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-cyan-400/60"
        animate={{ scale: [1, pulse, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: state === "idle" ? 3 : 1.2, repeat: Infinity }}
      />
      <motion.div
        className="absolute inset-4 rounded-full border-2 border-dashed border-purple-400/70"
        animate={{ rotate: 360 }}
        transition={{ duration: 20 / rotate, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-600/30 blur-md"
        animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: state === "speaking" ? 0.6 : 2, repeat: Infinity }}
      />
      <div className="absolute inset-16 rounded-full bg-slate-950 border border-cyan-300/40 flex items-center justify-center">
        <span className="font-orbitron text-cyan-200 text-[10px] tracking-widest text-center px-2">
          {state === "idle" ? "STANDBY" : state === "thinking" ? "PROCESSANDO" : "RESPONDENDO"}
        </span>
      </div>
    </div>
  );
}
