import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { SFX } from "../../lib/sfx";

type State = "idle" | "thinking" | "speaking";

export function IronManHelmet({ state }: { state: State }) {
  const [open, setOpen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 100, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 20 });
  const eyeTranslateX = useTransform(springX, [-1, 1], [-3, 3]);
  const eyeTranslateY = useTransform(springY, [-1, 1], [-1.5, 1.5]);

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

  const eyeColor = state === "thinking" ? "#fbbf24" : "#7dd3fc";
  const eyeGlow = state === "thinking" ? "#f59e0b" : "#0ea5e9";
  const pulseSpeed = state === "idle" ? 3 : state === "thinking" ? 0.8 : 1.2;

  const handleClick = () => {
    setOpen((o) => !o);
    SFX.servoMove();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-72 h-80 mx-auto cursor-pointer select-none"
      onClick={handleClick}
      title={open ? "Fechar capacete" : "Abrir capacete"}
    >
      {/* Glow de fundo */}
      <motion.div
        className="absolute inset-0 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${eyeGlow}40, transparent 70%)` }}
        animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.05, 1] }}
        transition={{ duration: pulseSpeed, repeat: Infinity }}
      />

      <svg viewBox="0 0 300 360" className="absolute inset-0 w-full h-full drop-shadow-2xl">
        <defs>
          {/* Gradiente do capacete — vermelho metálico */}
          <linearGradient id="helmetRed" x1="30%" y1="0%" x2="70%" y2="100%">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="15%" stopColor="#dc2626" />
            <stop offset="40%" stopColor="#991b1b" />
            <stop offset="60%" stopColor="#7f1d1d" />
            <stop offset="85%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#450a0a" />
          </linearGradient>

          {/* Gradiente lateral esquerdo (sombra) */}
          <linearGradient id="helmetDark" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3f0d0d" />
            <stop offset="50%" stopColor="#7f1d1d" />
            <stop offset="100%" stopColor="#450a0a" />
          </linearGradient>

          {/* Gradiente dourado */}
          <linearGradient id="gold" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="20%" stopColor="#fbbf24" />
            <stop offset="60%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          {/* Gradiente dourado lateral */}
          <linearGradient id="goldSide" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#92400e" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          {/* Gradiente do olho (cristal) */}
          <linearGradient id="eyeCrystal" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="30%" stopColor={eyeColor} stopOpacity="1" />
            <stop offset="100%" stopColor={eyeColor} stopOpacity="0.7" />
          </linearGradient>

          {/* Reflexo superior */}
          <linearGradient id="shine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Filtro de glow dos olhos */}
          <filter id="eyeGlowFilter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Filtro de brilho geral */}
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ====== BASE DO CAPACETE (trás) ====== */}
        <path
          d="M 55 140 
             Q 50 60 150 45 
             Q 250 60 245 140 
             L 245 260 
             Q 245 300 210 305 
             L 90 305 
             Q 55 300 55 260 Z"
          fill="url(#helmetRed)"
          stroke="#450a0a"
          strokeWidth="2"
        />

        {/* Sombra esquerda (lateral) */}
        <path
          d="M 55 140 Q 50 60 150 45 Q 130 60 125 140 L 125 305 Q 75 300 55 260 Z"
          fill="url(#helmetDark)"
          opacity="0.5"
        />

        {/* ====== TESTA DOURADA ====== */}
        <path
          d="M 95 90 Q 150 65 205 90 L 200 120 Q 150 105 100 120 Z"
          fill="url(#gold)"
          stroke="#78350f"
          strokeWidth="1.5"
        />

        {/* ====== RACHADURA CENTRAL DOURADA ====== */}
        <path
          d="M 148 80 L 152 80 L 154 130 L 146 130 Z"
          fill="url(#gold)"
          opacity="0.85"
        />

        {/* ====== PARAFUSOS LATERAIS ====== */}
        {[
          { cx: 78, cy: 130 },
          { cx: 78, cy: 165 },
          { cx: 78, cy: 200 },
          { cx: 222, cy: 130 },
          { cx: 222, cy: 165 },
          { cx: 222, cy: 200 },
        ].map((p, i) => (
          <g key={i}>
            <circle cx={p.cx} cy={p.cy} r="4" fill="#450a0a" />
            <circle cx={p.cx - 0.5} cy={p.cy - 0.5} r="2" fill="#7f1d1d" opacity="0.7" />
          </g>
        ))}

        {/* ====== FACE PLATE (abre/fecha) ====== */}
        <motion.g
          animate={{ rotateX: open ? 0 : 75, y: open ? 0 : -25 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: "150px 80px", transformStyle: "preserve-3d" }}
        >
          {/* Rosto principal */}
          <path
            d="M 75 130 
               Q 75 90 150 85 
               Q 225 90 225 130 
               L 225 250 
               Q 225 285 150 295 
               Q 75 285 75 250 Z"
            fill="url(#helmetRed)"
            stroke="#450a0a"
            strokeWidth="2"
          />

          {/* Reflexo superior no rosto */}
          <path
            d="M 85 130 Q 90 95 150 92 L 150 130 Q 110 130 85 130 Z"
            fill="url(#shine)"
            opacity="0.3"
          />

          {/* ====== OLHO ESQUERDO ====== */}
          <motion.g style={{ x: eyeTranslateX, y: eyeTranslateY }}>
            {/* Borda externa do olho */}
            <motion.ellipse
              cx="115" cy="155" rx="22" ry="12"
              fill="#0a0a0a"
              animate={{
                opacity: state === "thinking" ? [0.6, 1, 0.6] : [0.9, 1, 0.9],
              }}
              transition={{ duration: pulseSpeed, repeat: Infinity }}
            />
            {/* Lente interna (cristal) */}
            <motion.ellipse
              cx="115" cy="155" rx="18" ry="9"
              fill="url(#eyeCrystal)"
              filter="url(#eyeGlowFilter)"
              animate={{
                opacity: state === "thinking" ? [0.4, 1, 0.4] : [0.85, 1, 0.85],
                scaleX: state === "speaking" ? [1, 1.08, 1] : 1,
              }}
              transition={{ duration: pulseSpeed, repeat: Infinity }}
            />
            {/* Brilho interno */}
            <ellipse cx="110" cy="152" rx="4" ry="2.5" fill="#ffffff" opacity="0.8" />
          </motion.g>

          {/* ====== OLHO DIREITO ====== */}
          <motion.g style={{ x: eyeTranslateX, y: eyeTranslateY }}>
            <motion.ellipse
              cx="185" cy="155" rx="22" ry="12"
              fill="#0a0a0a"
              animate={{
                opacity: state === "thinking" ? [0.6, 1, 0.6] : [0.9, 1, 0.9],
              }}
              transition={{ duration: pulseSpeed, repeat: Infinity }}
            />
            <motion.ellipse
              cx="185" cy="155" rx="18" ry="9"
              fill="url(#eyeCrystal)"
              filter="url(#eyeGlowFilter)"
              animate={{
                opacity: state === "thinking" ? [0.4, 1, 0.4] : [0.85, 1, 0.85],
                scaleX: state === "speaking" ? [1, 1.08, 1] : 1,
              }}
              transition={{ duration: pulseSpeed, repeat: Infinity }}
            />
            <ellipse cx="180" cy="152" rx="4" ry="2.5" fill="#ffffff" opacity="0.8" />
          </motion.g>

          {/* ====== NARIZ / RIDGE CENTRAL ====== */}
          <path
            d="M 145 145 L 155 145 L 158 175 L 142 175 Z"
            fill="#7f1d1d"
            stroke="#450a0a"
            strokeWidth="1"
          />

          {/* ====== MÁSCARA INFERIOR (boca) ====== */}
          <path
            d="M 100 220 Q 150 235 200 220 L 195 250 Q 150 265 105 250 Z"
            fill="#3f0d0d"
            stroke="#1a0505"
            strokeWidth="1.5"
            opacity="0.9"
          />

          {/* Ranhuras da boca */}
          {[225, 233, 241, 249].map((y, i) => (
            <line
              key={i}
              x1="108" y1={y} x2="192" y2={y}
              stroke="#000"
              strokeWidth="1.5"
              opacity="0.7"
            />
          ))}

          {/* Detalhes dourados na bochecha esquerda */}
          <path
            d="M 90 190 L 100 190 L 100 210 L 90 210 Z"
            fill="url(#goldSide)"
            opacity="0.7"
          />
          {/* Detalhes dourados na bochecha direita */}
          <path
            d="M 200 190 L 210 190 L 210 210 L 200 210 Z"
            fill="url(#goldSide)"
            opacity="0.7"
          />
        </motion.g>

        {/* ====== QUEIXO DOURADO ====== */}
        <path
          d="M 100 285 Q 150 305 200 285 L 195 310 Q 150 328 105 310 Z"
          fill="url(#gold)"
          stroke="#78350f"
          strokeWidth="1.5"
        />

        {/* Linhas verticais do queixo */}
        <line x1="130" y1="295" x2="130" y2="312" stroke="#78350f" strokeWidth="1" opacity="0.6" />
        <line x1="150" y1="298" x2="150" y2="315" stroke="#78350f" strokeWidth="1" opacity="0.6" />
        <line x1="170" y1="295" x2="170" y2="312" stroke="#78350f" strokeWidth="1" opacity="0.6" />
      </svg>

      {/* Texto inferior */}
      <div className="absolute -bottom-2 left-0 right-0 text-center">
        <div className="font-orbitron text-[10px] tracking-[0.3em] text-cyan-400/70">
          {open ? "▸ CLIQUE PARA FECHAR" : "▸ CLIQUE PARA ABRIR"}
        </div>
      </div>
    </div>
  );
}