import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

type State = "idle" | "thinking" | "speaking";

type Pulse = { id: number; power: number };

export function ArcReactor({ state, color }: { state: State; color?: string }) {
  const [themeColor, setThemeColor] = useState(color ?? "#22d3ee");
  const [hovered, setHovered] = useState(false);
  const [pulses, setPulses] = useState<Pulse[]>([]);
  const [zoom, setZoom] = useState(1);
  const [energyLevel, setEnergyLevel] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);
  const pulseIdRef = useRef(0);

  // Mouse tracking para tilt 3D
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 100, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 20 });
  const rotateY = useTransform(springX, [-1, 1], [-15, 15]);
  const rotateX = useTransform(springY, [-1, 1], [12, -12]);

  // Cores
  useEffect(() => {
    if (color) { setThemeColor(color); return; }
    const update = () => {
      const c = getComputedStyle(document.documentElement).getPropertyValue("--theme-primary").trim();
      if (c) setThemeColor(c);
    };
    update();
    const o = new MutationObserver(update);
    o.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
    return () => o.disconnect();
  }, [color]);

  // Mouse follow
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      mouseX.set(Math.max(-1, Math.min(1, (e.clientX - cx) / 300)));
      mouseY.set(Math.max(-1, Math.min(1, (e.clientY - cy) / 300)));
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, [mouseX, mouseY]);

  // Zoom com scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 5) return;
      e.preventDefault();
      setZoom((z) => Math.max(0.7, Math.min(1.4, z - e.deltaY * 0.001)));
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  // Energia regenera
  useEffect(() => {
    const t = setInterval(() => {
      setEnergyLevel((v) => Math.min(100, v + 3));
    }, 1500);
    return () => clearInterval(t);
  }, []);

  // Pulso ao clicar
  const handleClick = () => {
    const id = pulseIdRef.current++;
    setPulses((p) => [...p, { id, power: 1 + Math.random() * 0.5 }]);
    setEnergyLevel((v) => Math.max(20, v - 15));
    setTimeout(() => {
      setPulses((p) => p.filter((x) => x.id !== id));
    }, 1200);
  };

  const isActive = state !== "idle";
  const isSpeaking = state === "speaking";
  const isThinking = state === "thinking";

  const baseColor = isSpeaking ? "#fbbf24" : isThinking ? "#a855f7" : themeColor;
  const pulseSpeed = isSpeaking ? 0.6 : isThinking ? 1.2 : hovered ? 1.8 : 2.8;
  const intensity = (isSpeaking ? 1.4 : isThinking ? 1.2 : hovered ? 1.1 : 0.85) * (energyLevel / 100);

  const hexToRgba = (hex: string, a: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-96 h-96 mx-auto cursor-pointer select-none"
      style={{ perspective: 1400 }}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Clique para liberar energia"
    >
      {/* Zoom container */}
      <motion.div
        className="absolute inset-0"
        style={{
          transform: `scale(${zoom})`,
          rotateY,
          rotateX,
          transformStyle: "preserve-3d",
        }}
        animate={{ scale: zoom }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        {/* CAMADA 1 — Aura externa massiva */}
        <motion.div
          className="absolute -inset-24 rounded-full"
          style={{
            background: `radial-gradient(circle, ${hexToRgba(baseColor, 0.4 * intensity)} 0%, transparent 70%)`,
            filter: "blur(60px)",
          }}
          animate={{
            opacity: [0.4, 0.9, 0.4],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: pulseSpeed * 1.5, repeat: Infinity }}
        />

        {/* CAMADA 2 — Ondas de energia */}
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={`wave-${i}`}
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              border: `1.5px solid ${hexToRgba(baseColor, 0.6)}`,
              boxShadow: `0 0 20px ${hexToRgba(baseColor, 0.4)}, inset 0 0 20px ${hexToRgba(baseColor, 0.2)}`,
            }}
            animate={{
              scale: [0.4, 2.4],
              opacity: [0.7, 0],
            }}
            transition={{
              duration: isSpeaking ? 2 : 3.5,
              repeat: Infinity,
              delay: i * 0.7,
              ease: "easeOut",
            }}
          />
        ))}

        {/* CAMADA 3 — SVG com anéis complexos */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 384 384"
          style={{ filter: `drop-shadow(0 0 8px ${baseColor})` }}
        >
          <defs>
            <linearGradient id={`grad-${baseColor.replace("#", "")}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={baseColor} />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor={baseColor} />
            </linearGradient>
            <radialGradient id={`core-${baseColor.replace("#", "")}`}>
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="40%" stopColor={baseColor} stopOpacity="0.9" />
              <stop offset="100%" stopColor={baseColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Anel externo longo */}
          <motion.circle
            cx="192" cy="192" r="180"
            fill="none"
            stroke={baseColor}
            strokeWidth="2"
            strokeDasharray="90 20 15 20 60 15"
            opacity={0.7 * intensity}
            animate={{ rotate: 360 }}
            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "192px 192px" }}
          />

          {/* Anel externo fino */}
          <motion.circle
            cx="192" cy="192" r="168"
            fill="none"
            stroke={baseColor}
            strokeWidth="1"
            strokeDasharray="3 10"
            opacity={0.5 * intensity}
            animate={{ rotate: -360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "192px 192px" }}
          />

          {/* 60 marcadores radiais */}
          {Array.from({ length: 60 }).map((_, i) => {
            const angle = (i * 360) / 60;
            const rad = (angle * Math.PI) / 180;
            const inner = i % 5 === 0 ? 140 : 148;
            const outer = i % 5 === 0 ? 160 : 154;
            return (
              <line
                key={`tick-${i}`}
                x1={192 + Math.cos(rad) * inner}
                y1={192 + Math.sin(rad) * inner}
                x2={192 + Math.cos(rad) * outer}
                y2={192 + Math.sin(rad) * outer}
                stroke={baseColor}
                strokeWidth={i % 5 === 0 ? 2 : 1}
                opacity={i % 5 === 0 ? 0.9 * intensity : 0.3 * intensity}
              />
            );
          })}

          {/* Anel interno 1 */}
          <motion.circle
            cx="192" cy="192" r="130"
            fill="none"
            stroke={`url(#grad-${baseColor.replace("#", "")})`}
            strokeWidth="2"
            strokeDasharray="30 10 60 10"
            opacity={0.8 * intensity}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "192px 192px" }}
          />

          {/* Anel interno 2 */}
          <motion.circle
            cx="192" cy="192" r="115"
            fill="none"
            stroke={baseColor}
            strokeWidth="1.5"
            strokeDasharray="8 6"
            opacity={0.6 * intensity}
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "192px 192px" }}
          />

          {/* Arcos brilhantes curtos */}
          <motion.circle
            cx="192" cy="192" r="100"
            fill="none"
            stroke={baseColor}
            strokeWidth="3"
            strokeDasharray="40 200"
            strokeLinecap="round"
            opacity={0.9 * intensity}
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "192px 192px", filter: `drop-shadow(0 0 6px ${baseColor})` }}
          />
          <motion.circle
            cx="192" cy="192" r="100"
            fill="none"
            stroke={baseColor}
            strokeWidth="3"
            strokeDasharray="40 200"
            strokeDashoffset="120"
            strokeLinecap="round"
            opacity={0.9 * intensity}
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "192px 192px", filter: `drop-shadow(0 0 6px ${baseColor})` }}
          />
        </svg>

        {/* CAMADA 4 — Anéis DOM girando (duplos) */}
        <motion.div
          className="absolute inset-6 rounded-full border-2"
          style={{
            borderColor: "transparent",
            borderTopColor: baseColor,
            borderRightColor: hexToRgba(baseColor, 0.3),
            filter: `drop-shadow(0 0 10px ${baseColor})`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-12 rounded-full border-2"
          style={{
            borderColor: "transparent",
            borderBottomColor: "#fbbf24",
            borderLeftColor: "rgba(251, 191, 36, 0.3)",
            filter: "drop-shadow(0 0 10px #fbbf24)",
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-20 rounded-full border"
          style={{
            borderColor: "transparent",
            borderTopColor: hexToRgba(baseColor, 0.7),
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />

        {/* CAMADA 5 — Núcleo com múltiplas camadas */}
        <motion.div
          className="absolute inset-28 rounded-full flex items-center justify-center"
          style={{
            background: `radial-gradient(circle, ${hexToRgba(baseColor, 0.3)} 0%, transparent 70%)`,
          }}
          animate={{ scale: isSpeaking ? [1, 1.1, 1] : [1, 1.04, 1] }}
          transition={{ duration: pulseSpeed, repeat: Infinity }}
        />

        {/* Núcleo central — disco com texto */}
        <motion.div
          className="absolute inset-32 rounded-full flex items-center justify-center bg-slate-950 border-2"
          style={{
            borderColor: hexToRgba(baseColor, 0.8),
            boxShadow: `0 0 40px ${hexToRgba(baseColor, 0.6 * intensity)}, inset 0 0 30px ${hexToRgba(baseColor, 0.3)}`,
          }}
          animate={{
            boxShadow: [
              `0 0 30px ${hexToRgba(baseColor, 0.4 * intensity)}, inset 0 0 20px ${hexToRgba(baseColor, 0.2)}`,
              `0 0 60px ${hexToRgba(baseColor, 0.8 * intensity)}, inset 0 0 40px ${hexToRgba(baseColor, 0.4)}`,
              `0 0 30px ${hexToRgba(baseColor, 0.4 * intensity)}, inset 0 0 20px ${hexToRgba(baseColor, 0.2)}`,
            ],
          }}
          transition={{ duration: pulseSpeed, repeat: Infinity }}
        >
          <div className="text-center">
            <div
              className="font-orbitron text-sm tracking-[0.3em]"
              style={{ color: baseColor, textShadow: `0 0 15px ${baseColor}` }}
            >
              {state === "idle" ? "STANDBY" : state === "thinking" ? "THINKING" : "SPEAKING"}
            </div>
            <div className="text-[9px] text-slate-500 mt-1 font-mono tracking-widest">
              {energyLevel.toFixed(0)}% POWER
            </div>
          </div>
        </motion.div>

        {/* Ponto de luz interno */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 30,
            height: 30,
            background: "#ffffff",
            boxShadow: `0 0 40px #ffffff, 0 0 80px ${baseColor}, 0 0 120px ${baseColor}`,
          }}
          animate={{
            scale: isSpeaking ? [1, 1.6, 1] : [1, 1.15, 1],
            opacity: [0.9, 1, 0.9],
          }}
          transition={{ duration: pulseSpeed, repeat: Infinity }}
        />

        {/* CAMADA 6 — Partículas orbitando em 3 planos */}
        {Array.from({ length: 40 }).map((_, i) => {
          const plane = i % 3;
          const radius = 100 + plane * 25 + (i % 4) * 8;
          const duration = 6 + (i % 5) * 1.5;
          const size = i % 5 === 0 ? "w-2 h-2" : i % 3 === 0 ? "w-1.5 h-1.5" : "w-1 h-1";
          const color = i % 4 === 0 ? "#ffffff" : i % 3 === 0 ? "#fbbf24" : baseColor;
          const reverse = i % 2 === 0;
          const tilt = (i % 5) * 0.15;

          return (
            <motion.div
              key={`particle-${i}`}
              className="absolute top-1/2 left-1/2"
              style={{ marginTop: -3, marginLeft: -3, transformStyle: "preserve-3d" }}
              animate={{ rotate: reverse ? -360 : 360 }}
              transition={{ duration, repeat: Infinity, ease: "linear" }}
            >
              <div
                className={`${size} rounded-full`}
                style={{
                  transform: `translateX(${radius}px) rotateX(${tilt}rad)`,
                  background: color,
                  boxShadow: `0 0 10px ${color}, 0 0 20px ${hexToRgba(color.length === 7 ? color : baseColor, 0.5)}`,
                }}
              />
            </motion.div>
          );
        })}

        {/* CAMADA 7 — Pulso ao clicar */}
        {pulses.map((p) => (
          <motion.div
            key={p.id}
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              border: `3px solid ${baseColor}`,
              boxShadow: `0 0 40px ${hexToRgba(baseColor, 0.8)}`,
            }}
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 3 * p.power, opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        ))}

        {/* CAMADA 8 — Anel de energia (indicador de power) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 384 384">
          <circle
            cx="192" cy="192" r="185"
            fill="none"
            stroke={hexToRgba(baseColor, 0.2)}
            strokeWidth="3"
          />
          <circle
            cx="192" cy="192" r="185"
            fill="none"
            stroke={baseColor}
            strokeWidth="3"
            strokeDasharray={`${(energyLevel / 100) * 1162} 1162`}
            strokeLinecap="round"
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "192px 192px",
              filter: `drop-shadow(0 0 6px ${baseColor})`,
              transition: "stroke-dasharray 0.5s ease",
            }}
          />
        </svg>
      </motion.div>

      {/* Texto de instrução (só no hover) */}
      {hovered && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-8 left-0 right-0 text-center text-[9px] font-mono tracking-[0.3em] pointer-events-none"
          style={{ color: `${baseColor}88` }}
        >
          ▸ CLIQUE PARA LIBERAR ENERGIA · SCROLL PARA ZOOM
        </motion.div>
      )}
    </div>
  );
}