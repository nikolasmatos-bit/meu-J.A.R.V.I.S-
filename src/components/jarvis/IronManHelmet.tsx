import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, useAnimationFrame, AnimatePresence } from "framer-motion";
import { SFX } from "../../lib/sfx";

type State = "idle" | "thinking" | "speaking";

const FRAMES = [
  "/Helmetdefrente.jpeg",
  "/helmetdelado.jpeg",
  "/helmetabrindo.jpeg",
  "/helmetabrindodelado.jpeg",
  "/helmetdetras.jpeg",
  "/helmetdebaixo.jpeg",
  "/helmetdesmontado.jpeg",
];

export function IronManHelmet({ state }: { state: State }) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [blink, setBlink] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isOpen = frameIndex > 0;

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 80, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 80, damping: 20 });

  const autoRotateY = useMotionValue(0);
  useAnimationFrame((t) => {
    if (!hovered) autoRotateY.set(Math.sin(t / 2000) * 8);
  });

  const rotateY = useTransform([springX, autoRotateY], ([mx, ar]: number[]) => mx * 12 + ar);
  const rotateX = useTransform(springY, [-1, 1], [8, -8]);

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
    if (frameIndex >= FRAMES.length - 1) {
      setFrameIndex(0);
    } else {
      setFrameIndex((i) => i + 1);
    }
    SFX.servoMove();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={containerRef}
        className="relative w-80 h-96 cursor-pointer select-none"
        style={{ perspective: 1200 }}
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title="Clique para avançar a desmontagem"
      >
        <motion.div
          className="absolute -inset-8 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${eyeGlow}60, transparent 70%)` }}
          animate={{ opacity: [0.3, 0.9, 0.3], scale: [1, 1.15, 1] }}
          transition={{ duration: pulseSpeed, repeat: Infinity }}
        />

        {[0, 1, 2].map((i) => (
          <motion.div
            key={`wave-${i}`}
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ border: `2px solid ${eyeGlow}` }}
            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 1, ease: "easeOut" }}
          />
        ))}

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

        <motion.div
          className="absolute inset-0"
          style={{ rotateY, rotateX, transformStyle: "preserve-3d", y: floatY }}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={frameIndex}
              src={FRAMES[frameIndex]}
              alt={`Iron Man Helmet Frame ${frameIndex + 1}`}
              className="absolute inset-0 w-full h-full object-contain"
              draggable={false}
              initial={{
                opacity: 0,
                scale: 0.85,
                rotateZ: frameIndex === 0 ? -15 : 10,
              }}
              animate={{
                opacity: 1,
                scale: hovered ? 1.08 : 1,
                rotateZ: 0,
              }}
              exit={{
                opacity: 0,
                scale: 1.15,
                rotateZ: -8,
                filter: "blur(6px)",
              }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{
                filter:
                  frameIndex === 0
                    ? hovered
                      ? `brightness(1.1) saturate(1.15) drop-shadow(0 0 25px ${eyeGlow}99)`
                      : `brightness(1) saturate(1) drop-shadow(0 0 15px rgba(239,68,68,0.5))`
                    : `brightness(1.15) saturate(1.2) drop-shadow(0 0 40px ${eyeGlow})`,
              }}
            />
          </AnimatePresence>

          <motion.div
            className="absolute inset-x-0 h-8 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, transparent, ${eyeGlow}80, transparent)`,
              mixBlendMode: "screen",
            }}
            animate={{ top: ["-10%", "110%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
          />

          {frameIndex === 0 && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ opacity: blink ? 0.9 : 0 }}
              transition={{ duration: 0.1 }}
              style={{
                background: `radial-gradient(ellipse 40% 8% at 50% 42%, ${eyeGlow}, transparent 70%)`,
              }}
            />
          )}
        </motion.div>

        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ border: `2px solid ${eyeGlow}`, opacity: 0.3 }}
          animate={{ scale: [1, 1.2], opacity: [0.4, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>

      <div className="text-center">
        <div className="font-orbitron text-[10px] tracking-[0.3em] text-cyan-400/70 mb-2">
          {isOpen
            ? `▸ DESMONTANDO... PASSO ${frameIndex + 1}/${FRAMES.length}`
            : "▸ CLIQUE PARA DESMONTAR"}
        </div>

        <div className="flex gap-2 justify-center">
          {FRAMES.map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: i <= frameIndex ? eyeGlow : "#334155",
                boxShadow: i === frameIndex ? `0 0 8px ${eyeGlow}` : "none",
              }}
              animate={{ scale: i === frameIndex ? 1.4 : 1 }}
              transition={{ duration: 0.2 }}
            />
          ))}
        </div>

        {frameIndex >= FRAMES.length - 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] tracking-[0.3em] text-amber-400 mt-3"
          >
            ▸ CLIQUE NOVAMENTE PARA REMONTAR
          </motion.div>
        )}
      </div>
    </div>
  );
}