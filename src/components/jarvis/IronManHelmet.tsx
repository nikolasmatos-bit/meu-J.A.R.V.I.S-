import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, useAnimationFrame } from "framer-motion";
import { SFX } from "../../lib/sfx";

type State = "idle" | "thinking" | "speaking";

export function IronManHelmet({ state }: { state: State }) {
  const [hovered, setHovered] = useState(false);
  const [blink, setBlink] = useState(false);
  const [booted, setBooted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Boot: aparece com animação ao carregar
  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 300);
    return () => clearTimeout(t);
  }, []);

  // Mouse tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 80, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 80, damping: 20 });

  // Rotação automática (respiração sutil)
  const autoRotateY = useMotionValue(0);
  useAnimationFrame((t) => {
    if (!hovered) autoRotateY.set(Math.sin(t / 2500) * 6);
  });

  const rotateY = useTransform([springX, autoRotateY], ([mx, ar]: number[]) => mx * 14 + ar);
  const rotateX = useTransform(springY, [-1, 1], [10, -10]);

  // Float (flutuação tipo respiração)
  const floatY = useMotionValue(0);
  useAnimationFrame((t) => {
    floatY.set(Math.sin(t / 1800) * 10);
  });

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nx = Math.max(-1, Math.min(1, (e.clientX - cx) / 350));
      const ny = Math.max(-1, Math.min(1, (e.clientY - cy) / 350));
      mouseX.set(nx);
      mouseY.set(ny);
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, [mouseX, mouseY]);

  // Blink ocasional (parece vivo)
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 180);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const eyeGlow = state === "thinking" ? "#f59e0b" : "#22d3ee";
  const pulseSpeed = state === "idle" ? 3 : state === "thinking" ? 0.8 : 1.2;

  // Efeito sonoro ao "acordar"
  useEffect(() => {
    if (booted) SFX.reactorEngage();
  }, [booted]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Container do capacete */}
      <div
        ref={containerRef}
        className="relative w-80 h-96 cursor-pointer select-none"
        style={{ perspective: 1200 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Glow de fundo massivo (aura do assistente) */}
        <motion.div
          className="absolute -inset-12 rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle, ${eyeGlow}70, ${eyeGlow}30, transparent 70%)`,
          }}
          animate={{
            opacity: state === "speaking" ? [0.5, 1, 0.5] : [0.3, 0.8, 0.3],
            scale: state === "speaking" ? [1, 1.2, 1] : [1, 1.1, 1],
          }}
          transition={{ duration: pulseSpeed, repeat: Infinity }}
        />

        {/* Ondas de energia expandindo (nascimento) */}
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={`wave-${i}`}
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ border: `2px solid ${eyeGlow}` }}
            animate={{
              scale: [1, 2.2],
              opacity: [0.6, 0],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              delay: i * 0.9,
              ease: "easeOut",
            }}
          />
        ))}

        {/* Partículas orbitando (sistema de energia) */}
        {Array.from({ length: 10 }).map((_, i) => {
          const angle = (i * 360) / 10;
          const radius = 130 + (i % 3) * 25;
          const duration = 7 + (i % 4) * 2;
          return (
            <motion.div
              key={`particle-${i}`}
              className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full pointer-events-none"
              style={{
                background: i % 3 === 0 ? "#f59e0b" : eyeGlow,
                boxShadow: `0 0 12px ${i % 3 === 0 ? "#f59e0b" : eyeGlow}`,
              }}
              animate={{
                x: [
                  Math.cos((angle * Math.PI) / 180) * radius,
                  Math.cos(((angle + 120) * Math.PI) / 180) * radius,
                  Math.cos(((angle + 240) * Math.PI) / 180) * radius,
                  Math.cos((angle * Math.PI) / 180) * radius,
                ],
                y: [
                  Math.sin((angle * Math.PI) / 180) * radius,
                  Math.sin(((angle + 120) * Math.PI) / 180) * radius,
                  Math.sin(((angle + 240) * Math.PI) / 180) * radius,
                  Math.sin((angle * Math.PI) / 180) * radius,
                ],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          );
        })}

        {/* Container 3D do capacete */}
        <motion.div
          className="absolute inset-0"
          style={{ rotateY, rotateX, transformStyle: "preserve-3d", y: floatY }}
        >
          {/* Imagem do capacete com boot animation */}
          <motion.img
            src="/helmet.png"
            alt="JARVIS Assistant"
            className="absolute inset-0 w-full h-full object-contain"
            draggable={false}
            initial={{ opacity: 0, scale: 0.5, rotateZ: -15, filter: "blur(20px)" }}
            animate={
              booted
                ? {
                    opacity: 1,
                    scale: hovered ? 1.08 : state === "speaking" ? 1.05 : 1,
                    rotateZ: 0,
                    filter: "blur(0px)",
                  }
                : {}
            }
            transition={{
              duration: 1.2,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              filter:
                state === "speaking"
                  ? `brightness(1.25) saturate(1.3) drop-shadow(0 0 50px ${eyeGlow})`
                  : state === "thinking"
                  ? `brightness(1.15) saturate(1.2) drop-shadow(0 0 30px ${eyeGlow})`
                  : hovered
                  ? `brightness(1.1) saturate(1.15) drop-shadow(0 0 25px ${eyeGlow}99)`
                  : `brightness(1) saturate(1) drop-shadow(0 0 15px rgba(34,211,238,0.6))`,
              transition: "filter 0.5s",
            }}
          />

          {/* Scanline varrendo o capacete */}
          <motion.div
            className="absolute inset-x-0 h-10 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, transparent, ${eyeGlow}90, transparent)`,
              mixBlendMode: "screen",
            }}
            animate={{ top: ["-10%", "110%"] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
              repeatDelay: 2,
            }}
          />

          {/* Blink dos olhos (só quando não está falando) */}
          {state !== "speaking" && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ opacity: blink ? 0.9 : 0 }}
              transition={{ duration: 0.1 }}
              style={{
                background: `radial-gradient(ellipse 40% 8% at 50% 42%, ${eyeGlow}, transparent 70%)`,
              }}
            />
          )}

          {/* Ondas de áudio quando speaking (Sexta-Feira vibra) */}
          {state === "speaking" && (
            <>
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={`audio-${i}`}
                  className="absolute inset-x-0 pointer-events-none"
                  style={{
                    bottom: `${20 + i * 4}%`,
                    height: "2px",
                    background: `linear-gradient(90deg, transparent, ${eyeGlow}, transparent)`,
                  }}
                  animate={{
                    scaleX: [0.3, 1, 0.3],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 0.4,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </>
          )}
        </motion.div>

        {/* Aura pulsante extra */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ border: `2px solid ${eyeGlow}`, opacity: 0.4 }}
          animate={{ scale: [1, 1.15], opacity: [0.4, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
      </div>

      {/* Status text embaixo */}
      <motion.div
        className="text-center space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : 20 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <motion.div
          className="font-orbitron text-sm tracking-[0.4em] text-cyan-300/80"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {state === "idle"
            ? "◈ SEXTA-FEIRA ONLINE"
            : state === "thinking"
            ? "◈ PROCESSANDO DADOS"
            : state === "speaking"
            ? "◈ RESPONDENDO"
            : "◈ AGUARDANDO"}
        </motion.div>
        <div className="text-[10px] tracking-[0.3em] text-cyan-400/40 font-mono">
          SYS.JARVIS.v2.0.4
        </div>
      </motion.div>
    </div>
  );
}