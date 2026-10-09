import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, useAnimationFrame } from "framer-motion";
import { SFX } from "../../lib/sfx";

type State = "idle" | "thinking" | "speaking";

export function IronManHelmet({ state }: { state: State }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [blink, setBlink] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 80, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 80, damping: 20 });

  // Rotação automática
  const autoRotateY = useMotionValue(0);
  useAnimationFrame((t) => {
    if (!hovered) autoRotateY.set(Math.sin(t / 2000) * 8);
  });

  const rotateY = useTransform([springX, autoRotateY], ([mx, ar]: number[]) => mx * 12 + ar);
  const rotateX = useTransform(springY, [-1, 1], [8, -8]);

  // Float
  const floatY = useMotionValue(0);
  useAnimationFrame((t) => {
    floatY.set(Math.sin(t / 1500) * 8);
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

  // Blink dos olhos
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const eyeGlow = state === "thinking" ? "#f59e0b" : "#22d3ee";
  const pulseSpeed = state === "idle" ? 3 : state === "thinking" ? 0.8 : 1.2;

  const handleClick = () => {
    setOpen((o) => !o);
    SFX.servoMove();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-80 h-96 mx-auto cursor-pointer select-none"
      style={{ perspective: 1200 }}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={open ? "Fechar capacete" : "Abrir capacete"}
    >
      {/* Glow de fundo */}
      <motion.div
        className="absolute -inset-8 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${eyeGlow}60, transparent 70%)` }}
        animate={{ opacity: [0.3, 0.9, 0.3], scale: [1, 1.15, 1] }}
        transition={{ duration: pulseSpeed, repeat: Infinity }}
      />

      {/* Ondas de energia */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`wave-${i}`}
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ border: `2px solid ${eyeGlow}` }}
          animate={{ scale: [1, 2], opacity: [0.5, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 1, ease: "easeOut" }}
        />
      ))}

      {/* Partículas orbitando */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 360) / 8;
        const radius = 120 + (i % 3) * 20;
        const duration = 6 + (i % 4) * 2;
        return (
          <motion.div
            key={`particle-${i}`}
            className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full pointer-events-none"
            style={{
              background: i % 2 === 0 ? "#22d3ee" : "#f59e0b",
              boxShadow: `0 0 10px ${i % 2 === 0 ? "#22d3ee" : "#f59e0b"}`,
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
              opacity: [0.4, 1, 0.4],
            }}
            transition={{ duration, repeat: Infinity, ease: "linear" }}
          />
        );
      })}

      {/* Container do capacete com rotação e float */}
      <motion.div
        className="absolute inset-0"
        style={{ rotateY, rotateX, transformStyle: "preserve-3d", y: floatY }}
      >
        {/* === BASE TRASEIRA (fica fixa, atrás) === */}
        <motion.img
          src="/helmet.png"
          alt=""
          className="absolute inset-0 w-full h-full object-contain"
          draggable={false}
          animate={{ scale: hovered ? 1.05 : 1 }}
          style={{
            filter: "brightness(0.6) saturate(0.8)",
            transition: "filter 0.5s",
          }}
        />

        {/* === INTERIOR DO CAPACETE (aparece quando abre) === */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: open ? 1 : 0 }}
          transition={{ duration: 0.4, delay: open ? 0.2 : 0 }}
        >
          <div
            className="w-40 h-56 rounded-3xl"
            style={{
              background: `
                radial-gradient(ellipse at 50% 30%, ${eyeGlow}40, transparent 60%),
                radial-gradient(ellipse at 50% 70%, #0a0a0a 0%, #000 100%)
              `,
              boxShadow: `inset 0 0 40px ${eyeGlow}60`,
            }}
          >
            {/* Dois olhos brilhantes dentro */}
            <div className="w-full h-full relative">
              <motion.div
                className="absolute w-8 h-3 rounded-full"
                style={{
                  top: "42%",
                  left: "18%",
                  background: eyeGlow,
                  boxShadow: `0 0 15px ${eyeGlow}, 0 0 30px ${eyeGlow}`,
                }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.div
                className="absolute w-8 h-3 rounded-full"
                style={{
                  top: "42%",
                  right: "18%",
                  background: eyeGlow,
                  boxShadow: `0 0 15px ${eyeGlow}, 0 0 30px ${eyeGlow}`,
                }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              />
            </div>
          </div>
        </motion.div>

        {/* === FACE PLATE (abre levantando) === */}
        <motion.img
          src="/helmet.png"
          alt="Iron Man Helmet"
          className="absolute inset-0 w-full h-full object-contain origin-bottom pointer-events-none"
          draggable={false}
          animate={{
            rotateX: open ? -85 : 0,
            y: open ? -20 : 0,
            scale: hovered ? 1.08 : 1,
            opacity: open ? 0.95 : 1,
          }}
          transition={{
            duration: 0.7,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden",
            filter: open
              ? `brightness(1.1) saturate(1.2) drop-shadow(0 0 40px ${eyeGlow})`
              : hovered
              ? "brightness(1.1) saturate(1.15) drop-shadow(0 0 25px rgba(34,211,238,0.6))"
              : "brightness(1) saturate(1) drop-shadow(0 0 15px rgba(239,68,68,0.5))",
          }}
        />

        {/* Scanline */}
        <motion.div
          className="absolute inset-x-0 h-8 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, transparent, ${eyeGlow}80, transparent)`,
            mixBlendMode: "screen",
          }}
          animate={{ top: ["-10%", "110%"] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
        />

        {/* Blink */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: blink && !open ? 0.9 : 0 }}
          transition={{ duration: 0.1 }}
          style={{
            background: `radial-gradient(ellipse 40% 8% at 50% 42%, ${eyeGlow}, transparent 70%)`,
          }}
        />
      </motion.div>

      {/* Aura pulsante */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ border: `2px solid ${eyeGlow}`, opacity: 0.3 }}
        animate={{ scale: [1, 1.2], opacity: [0.4, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Texto inferior */}
      <motion.div
        className="absolute -bottom-2 left-0 right-0 text-center"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="font-orbitron text-[10px] tracking-[0.3em] text-cyan-400/70">
          {open ? "▸ CLIQUE PARA FECHAR" : "▸ CLIQUE PARA ABRIR"}
        </div>
      </motion.div>
    </div>
  );
}