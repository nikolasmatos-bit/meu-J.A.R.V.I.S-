import { motion } from "framer-motion";

type State = "idle" | "thinking" | "speaking";

export function ArcReactor({ state }: { state: State }) {
  const isActive = state !== "idle";
  const isSpeaking = state === "speaking";
  const isThinking = state === "thinking";

  // Cores douradas/âmbar
  const coreColor = isSpeaking ? "#fcd34d" : isThinking ? "#fbbf24" : "#f59e0b";
  const accentColor = "#ea580c";
  const brightColor = "#fde68a";
  const darkColor = "#7c2d12";

  const spinSpeed = isSpeaking ? 4 : isThinking ? 6 : 15;
  const pulseSpeed = isSpeaking ? 0.6 : isThinking ? 1 : 2.5;

  return (
    <div className="relative w-96 h-96 mx-auto" style={{ perspective: 1000 }}>
      {/* === AURA EXTERNA MASSIVA === */}
      <motion.div
        className="absolute -inset-32 rounded-full"
        style={{
          background: `radial-gradient(circle, ${accentColor}40 0%, ${coreColor}20 40%, transparent 70%)`,
          filter: "blur(40px)",
        }}
        animate={{
          opacity: isActive ? [0.4, 0.9, 0.4] : [0.2, 0.5, 0.2],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: pulseSpeed, repeat: Infinity }}
      />

      {/* === ONDAS DE ENERGIA EXPANDINDO === */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={`wave-${i}`}
          className="absolute inset-0 rounded-full"
          style={{
            border: `1.5px solid ${coreColor}`,
            boxShadow: `0 0 20px ${coreColor}60, inset 0 0 20px ${coreColor}30`,
          }}
          animate={{
            scale: [0.6, 2.2],
            opacity: [0.7, 0],
          }}
          transition={{
            duration: isSpeaking ? 2 : 3.5,
            repeat: Infinity,
            delay: i * 0.6,
            ease: "easeOut",
          }}
        />
      ))}

      {/* === CAMADA 1: 60 PARTÍCULAS ORBITANDO LONGE === */}
      {Array.from({ length: 60 }).map((_, i) => {
        const angle = (i * 360) / 60;
        const radius = 155 + (i % 4) * 8;
        const duration = 12 + (i % 6) * 2;
        const size = i % 7 === 0 ? "w-2 h-2" : i % 3 === 0 ? "w-1.5 h-1.5" : "w-1 h-1";
        const color = i % 5 === 0 ? brightColor : i % 3 === 0 ? coreColor : accentColor;
        const reverse = i % 2 === 0;
        return (
          <motion.div
            key={`far-${i}`}
            className="absolute top-1/2 left-1/2"
            style={{ marginTop: -2, marginLeft: -2 }}
            animate={{
              rotate: reverse ? -360 : 360,
            }}
            transition={{ duration, repeat: Infinity, ease: "linear" }}
          >
            <div
              className={`${size} rounded-full`}
              style={{
                transform: `translateX(${radius}px)`,
                background: color,
                boxShadow: `0 0 8px ${color}, 0 0 16px ${color}80`,
              }}
            />
          </motion.div>
        );
      })}

      {/* === CAMADA 2: 30 PARTÍCULAS PRÓXIMAS === */}
      {Array.from({ length: 30 }).map((_, i) => {
        const angle = (i * 360) / 30;
        const radius = 105 + (i % 3) * 12;
        const duration = 6 + (i % 5) * 1.2;
        const size = i % 4 === 0 ? "w-2 h-2" : "w-1 h-1";
        const color = i % 3 === 0 ? brightColor : coreColor;
        const reverse = i % 3 === 0;
        return (
          <motion.div
            key={`near-${i}`}
            className="absolute top-1/2 left-1/2"
            style={{ marginTop: -2, marginLeft: -2 }}
            animate={{ rotate: reverse ? -360 : 360 }}
            transition={{ duration, repeat: Infinity, ease: "linear" }}
          >
            <div
              className={`${size} rounded-full`}
              style={{
                transform: `translateX(${radius}px)`,
                background: color,
                boxShadow: `0 0 10px ${color}`,
              }}
            />
          </motion.div>
        );
      })}

      {/* === SVG COM ANÉIS E ARCS === */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 384 384">
        <defs>
          <radialGradient id="coreGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={brightColor} stopOpacity="1" />
            <stop offset="40%" stopColor={coreColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ringGradGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={brightColor} />
            <stop offset="50%" stopColor={coreColor} />
            <stop offset="100%" stopColor={accentColor} />
          </linearGradient>
        </defs>

        {/* Anel externo girando */}
        <motion.circle
          cx="192" cy="192" r="175"
          fill="none"
          stroke="url(#ringGradGold)"
          strokeWidth="1.5"
          strokeDasharray="15 8 40 8"
          opacity="0.7"
          animate={{ rotate: 360 }}
          transition={{ duration: spinSpeed * 4, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "192px 192px" }}
        />

        {/* Anel tracejado fino */}
        <motion.circle
          cx="192" cy="192" r="158"
          fill="none"
          stroke={coreColor}
          strokeWidth="1"
          strokeDasharray="2 10"
          opacity="0.5"
          animate={{ rotate: -360 }}
          transition={{ duration: spinSpeed * 3, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "192px 192px" }}
        />

        {/* Marcadores radiais (48) */}
        {Array.from({ length: 48 }).map((_, i) => {
          const angle = (i * 360) / 48;
          const rad = (angle * Math.PI) / 180;
          const inner = i % 6 === 0 ? 138 : 148;
          const outer = 155;
          const x1 = 192 + Math.cos(rad) * inner;
          const y1 = 192 + Math.sin(rad) * inner;
          const x2 = 192 + Math.cos(rad) * outer;
          const y2 = 192 + Math.sin(rad) * outer;
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={coreColor}
              strokeWidth={i % 6 === 0 ? 2 : 1}
              opacity={i % 6 === 0 ? 0.9 : 0.35}
            />
          );
        })}

        {/* Arcs curtos brilhantes girando */}
        <motion.circle
          cx="192" cy="192" r="128"
          fill="none"
          stroke={brightColor}
          strokeWidth="3"
          strokeDasharray="25 220"
          strokeLinecap="round"
          animate={{ rotate: 360 }}
          transition={{ duration: spinSpeed * 2, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "192px 192px", filter: `drop-shadow(0 0 6px ${brightColor})` }}
        />

        <motion.circle
          cx="192" cy="192" r="115"
          fill="none"
          stroke={accentColor}
          strokeWidth="2"
          strokeDasharray="40 200"
          strokeLinecap="round"
          animate={{ rotate: -360 }}
          transition={{ duration: spinSpeed * 1.5, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "192px 192px", filter: `drop-shadow(0 0 4px ${accentColor})` }}
        />

        <motion.circle
          cx="192" cy="192" r="100"
          fill="none"
          stroke={coreColor}
          strokeWidth="1.5"
          strokeDasharray="8 20"
          opacity="0.7"
          animate={{ rotate: 360 }}
          transition={{ duration: spinSpeed * 1.2, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "192px 192px" }}
        />
      </svg>

      {/* === NÚCLEO CENTRAL === */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 130,
          height: 130,
          background: `radial-gradient(circle, ${brightColor} 0%, ${coreColor} 30%, ${accentColor} 60%, transparent 85%)`,
          filter: "blur(2px)",
        }}
        animate={{
          scale: isSpeaking ? [1, 1.15, 1] : isThinking ? [1, 1.08, 1] : [1, 1.04, 1],
          opacity: [0.9, 1, 0.9],
        }}
        transition={{ duration: pulseSpeed, repeat: Infinity }}
      />

      {/* === NÚCLEO INTERNO (ponto de luz) === */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 60,
          height: 60,
          background: brightColor,
          boxShadow: `0 0 60px ${brightColor}, 0 0 100px ${coreColor}, 0 0 150px ${accentColor}`,
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{ duration: pulseSpeed, repeat: Infinity }}
      />

      {/* === STATUS TEXT === */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-24 text-center pointer-events-none">
        <motion.div
          className="font-orbitron text-sm tracking-[0.4em]"
          style={{
            color: brightColor,
            textShadow: `0 0 10px ${coreColor}, 0 0 20px ${accentColor}`,
          }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {state === "idle" ? "STANDBY" : state === "thinking" ? "PROCESSING" : "SPEAKING"}
        </motion.div>
        <div className="text-[9px] text-amber-200/50 mt-1 font-mono tracking-widest">
          v2.0.4
        </div>
      </div>

      {/* === FEIXES DE ENERGIA RADIAIS (quando ativo) === */}
      {isActive && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 384 384">
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 360) / 8 + Math.random() * 20;
            const rad = (angle * Math.PI) / 180;
            const x2 = 192 + Math.cos(rad) * 200;
            const y2 = 192 + Math.sin(rad) * 200;
            return (
              <motion.line
                key={`beam-${i}`}
                x1="192" y1="192"
                x2={x2} y2={y2}
                stroke={coreColor}
                strokeWidth="1"
                strokeLinecap="round"
                animate={{ opacity: [0, 0.6, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.25,
                }}
                style={{ filter: `drop-shadow(0 0 4px ${coreColor})` }}
              />
            );
          })}
        </svg>
      )}

      {/* === MARCADOR DE ESTADO EXTRA === */}
      {isSpeaking && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            border: `3px solid ${brightColor}`,
            boxShadow: `0 0 40px ${brightColor}, inset 0 0 40px ${brightColor}40`,
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        />
      )}
    </div>
  );
}