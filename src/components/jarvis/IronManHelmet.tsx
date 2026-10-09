import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

type State = "idle" | "thinking" | "speaking";

export function IronManHelmet({ state }: { state: State }) {
  const [open, setOpen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 100, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 20 });
  const eyeTranslateX = useTransform(springX, [-1, 1], [-4, 4]);
  const eyeTranslateY = useTransform(springY, [-1, 1], [-2, 2]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nx = Math.max(-1, Math.min(1, (e.clientX - cx) / 300));
      const ny = Math.max(-1, Math.min(1, (e.clientY - cy) / 300));
      mouseX.set(nx);
      mouseY.set(ny);
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, [mouseX, mouseY]);

  // Cor dos olhos conforme estado
  const eyeColor =
    state === "thinking" ? "#fbbf24" : state === "speaking" ? "#22d3ee" : "#22d3ee";
  const eyeGlow = state === "thinking" ? "#f59e0b" : "#22d3ee";
  const pulseSpeed = state === "idle" ? 3 : state === "thinking" ? 0.8 : 1.2;

  return (
    <div
      ref={containerRef}
      className="relative w-64 h-64 mx-auto cursor-pointer select-none"
      onClick={() => setOpen((o) => !o)}
      title={open ? "Fechar capacete" : "Abrir capacete"}
    >
      {/* Glow atrás */}
      <motion.div
        className="absolute inset-0 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${eyeGlow}30, transparent 70%)` }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: pulseSpeed, repeat: Infinity }}
      />

      <svg
        viewBox="0 0 200 240"
        className="absolute inset-0 w-full h-full drop-shadow-2xl"
      >
        <defs>
          <linearGradient id="helmetGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="50%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </linearGradient>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <filter id="eyeGlowFilter">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Parte de trás do capacete */}
        <path
          d="M 40 100 Q 40 30 100 30 Q 160 30 160 100 L 160 180 Q 160 200 140 200 L 60 200 Q 40 200 40 180 Z"
          fill="url(#helmetGrad)"
          stroke="#7f1d1d"
          strokeWidth="2"
        />

        {/* Faixa dourada central */}
        <path
          d="M 100 30 L 100 130 L 90 130 L 90 30 Z"
          fill="url(#goldGrad)"
          opacity="0.9"
        />

        {/* Detalhes laterais (parafusos) */}
        <circle cx="55" cy="90" r="3" fill="#7f1d1d" />
        <circle cx="55" cy="120" r="3" fill="#7f1d1d" />
        <circle cx="145" cy="90" r="3" fill="#7f1d1d" />
        <circle cx="145" cy="120" r="3" fill="#7f1d1d" />

        {/* Máscara facial (parte frontal que abre) */}
        <motion.g
          animate={{
            rotateX: open ? 0 : 75,
            y: open ? 0 : -20,
          }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: "100px 60px", transformStyle: "preserve-3d" }}
        >
          {/* Face plate */}
          <path
            d="M 55 80 Q 55 45 100 45 Q 145 45 145 80 L 145 160 Q 145 180 100 180 Q 55 180 55 160 Z"
            fill="url(#helmetGrad)"
            stroke="#7f1d1d"
            strokeWidth="2"
          />

          {/* Testa dourada */}
          <path
            d="M 75 60 Q 100 50 125 60 L 120 75 L 80 75 Z"
            fill="url(#goldGrad)"
          />

          {/* Olho esquerdo */}
          <motion.g
            style={{ x: eyeTranslateX, y: eyeTranslateY }}
          >
            <motion.ellipse
              cx="80"
              cy="100"
              rx="12"
              ry="8"
              fill={eyeColor}
              filter="url(#eyeGlowFilter)"
              animate={{
                opacity: state === "thinking" ? [0.4, 1, 0.4] : [0.8, 1, 0.8],
                scale: state === "speaking" ? [1, 1.1, 1] : 1,
              }}
              transition={{ duration: pulseSpeed, repeat: Infinity }}
            />
          </motion.g>

          {/* Olho direito */}
          <motion.g
            style={{ x: eyeTranslateX, y: eyeTranslateY }}
          >
            <motion.ellipse
              cx="120"
              cy="100"
              rx="12"
              ry="8"
              fill={eyeColor}
              filter="url(#eyeGlowFilter)"
              animate={{
                opacity: state === "thinking" ? [0.4, 1, 0.4] : [0.8, 1, 0.8],
                scale: state === "speaking" ? [1, 1.1, 1] : 1,
              }}
              transition={{ duration: pulseSpeed, repeat: Infinity }}
            />
          </motion.g>

          {/* Boca (linhas verticais) */}
          <rect x="90" y="130" width="20" height="30" fill="#1f1f1f" opacity="0.6" rx="3" />
          {[135, 142, 149, 156].map((y) => (
            <line
              key={y}
              x1="92"
              y1={y}
              x2="108"
              y2={y}
              stroke="#7f1d1d"
              strokeWidth="1"
            />
          ))}
        </motion.g>

        {/* Queixo */} 
        <path
          d="M 70 180 Q 100 195 130 180 L 130 195 Q 100 210 70 195 Z"
          fill="url(#goldGrad)"
        />
      </svg>

      {/* Texto de status embaixo */}
      <div className="absolute -bottom-8 left-0 right-0 text-center">
        <div className="font-orbitron text-[10px] tracking-[0.3em] text-cyan-400/70">
          {open ? "▸ CLIQUE PARA FECHAR" : "▸ CLIQUE PARA ABRIR"}
        </div>
      </div>
    </div>
  );
}