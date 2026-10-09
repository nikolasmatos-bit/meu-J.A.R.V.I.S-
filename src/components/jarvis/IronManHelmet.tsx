import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { SFX } from "../../lib/sfx";

type State = "idle" | "thinking" | "speaking";

export function IronManHelmet({ state }: { state: State }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 80, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 80, damping: 20 });

  const rotateY = useTransform(springX, [-1, 1], [-12, 12]);
  const rotateX = useTransform(springY, [-1, 1], [8, -8]);

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

  const eyeGlow = state === "thinking" ? "#f59e0b" : "#22d3ee";
  const pulseSpeed = state === "idle" ? 3 : state === "thinking" ? 0.8 : 1.2;

  const handleClick = () => {
    setOpen((o) => !o);
    SFX.servoMove();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-72 h-80 mx-auto cursor-pointer select-none"
      style={{ perspective: 1000 }}
      onClick={handleClick}
      title={open ? "Fechar capacete" : "Abrir capacete"}
    >
      {/* Glow de fundo */}
      <motion.div
        className="absolute inset-0 rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, ${eyeGlow}50, transparent 70%)`,
        }}
        animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.08, 1] }}
        transition={{ duration: pulseSpeed, repeat: Infinity }}
      />

      {/* Capacete real com parallax 3D */}
      <motion.img
        src="/helmet.png"
        alt="Iron Man Helmet"
        className="absolute inset-0 w-full h-full object-contain"
        draggable={false}
        style={{
          rotateY,
          rotateX,
          transformStyle: "preserve-3d",
          filter: open
            ? "brightness(1.15) saturate(1.2) drop-shadow(0 0 30px rgba(34,211,238,0.7))"
            : "brightness(1) saturate(1) drop-shadow(0 0 15px rgba(239,68,68,0.5))",
          transition: "filter 0.5s",
        }}
        animate={{
          y: open ? -10 : 0,
          scale: open ? 1.05 : 1,
        }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Aura pulsante */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ border: `2px solid ${eyeGlow}`, opacity: 0.3 }}
        animate={{ scale: [1, 1.2], opacity: [0.4, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Texto inferior */}
      <div className="absolute -bottom-2 left-0 right-0 text-center">
        <div className="font-orbitron text-[10px] tracking-[0.3em] text-cyan-400/70">
          {open ? "▸ CLIQUE PARA FECHAR" : "▸ CLIQUE PARA ABRIR"}
        </div>
      </div>
    </div>
  );
}