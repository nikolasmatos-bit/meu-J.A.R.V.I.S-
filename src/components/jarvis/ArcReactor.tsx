import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

type State = "idle" | "thinking" | "speaking";

type Particle = {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
};

type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
};

export function ArcReactor({ state }: { state: State }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Tamanho em alta resolução
    const size = 700;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const baseRadius = size * 0.32;

    const particles: Particle[] = [];
    const sparks: Spark[] = [];

    // Cria 300 partículas orbitando em camadas
    for (let i = 0; i < 300; i++) {
      const layer = Math.floor(Math.random() * 4);
      const radiusFactor = 0.5 + layer * 0.18 + Math.random() * 0.15;
      particles.push({
        angle: Math.random() * Math.PI * 2,
        radius: baseRadius * radiusFactor,
        speed: (Math.random() * 0.01 + 0.002) * (Math.random() > 0.5 ? 1 : -1),
        size: Math.random() * 2.5 + 0.8,
        color: Math.random() > 0.7 ? "#fde68a" : Math.random() > 0.4 ? "#fbbf24" : "#f59e0b",
        life: Math.random() * 100,
        maxLife: 100,
      });
    }

    // Cria sparks (explosões de energia)
    const spawnSpark = () => {
      const angle = Math.random() * Math.PI * 2;
      const radius = baseRadius * (0.4 + Math.random() * 0.6);
      sparks.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        vx: Math.cos(angle) * (Math.random() * 2 + 0.5),
        vy: Math.sin(angle) * (Math.random() * 2 + 0.5),
        life: 60,
        maxLife: 60,
        size: Math.random() * 2 + 1,
      });
    };

    let animId: number;
    let frame = 0;

    const draw = () => {
      const s = stateRef.current;
      const isActive = s !== "idle";
      const isSpeaking = s === "speaking";
      const isThinking = s === "thinking";

      // Trail de fundo (cria efeito de arrasto)
      ctx.fillStyle = "rgba(2, 6, 23, 0.25)";
      ctx.fillRect(0, 0, size, size);

      const coreColor = isSpeaking ? "#fcd34d" : isThinking ? "#fbbf24" : "#f59e0b";
      const intensity = isSpeaking ? 1.5 : isThinking ? 1.2 : 0.8;

      // === CORE CENTRAL ===
      // Glow massivo
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 1.5);
      coreGrad.addColorStop(0, `rgba(253, 230, 138, ${0.9 * intensity})`);
      coreGrad.addColorStop(0.2, `rgba(252, 211, 77, ${0.7 * intensity})`);
      coreGrad.addColorStop(0.5, `rgba(245, 158, 11, ${0.3 * intensity})`);
      coreGrad.addColorStop(1, "rgba(124, 45, 18, 0)");
      ctx.fillStyle = coreGrad;
      ctx.fillRect(0, 0, size, size);

      // Núcleo brilhante
      const corePulse = 1 + Math.sin(frame * 0.05) * 0.1;
      const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60 * corePulse);
      innerGrad.addColorStop(0, `rgba(255, 255, 255, ${0.95 * intensity})`);
      innerGrad.addColorStop(0.3, `rgba(253, 230, 138, ${0.9 * intensity})`);
      innerGrad.addColorStop(0.7, `rgba(251, 191, 36, ${0.6 * intensity})`);
      innerGrad.addColorStop(1, "rgba(245, 158, 11, 0)");
      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 80 * corePulse, 0, Math.PI * 2);
      ctx.fill();

      // === ANÉIS DE ENERGIA (arcos) ===
      const ringCount = 5;
      for (let i = 0; i < ringCount; i++) {
        const r = baseRadius * (0.4 + i * 0.15) * corePulse;
        const rot = frame * (0.005 + i * 0.003) * (i % 2 === 0 ? 1 : -1);
        const dashCount = 12 + i * 6;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.strokeStyle = `rgba(${i % 2 === 0 ? "252, 211, 77" : "245, 158, 11"}, ${0.5 - i * 0.05})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([15 + i * 5, 8 + i * 2]);
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // === PARTÍCULAS ===
      particles.forEach((p) => {
        p.angle += p.speed * (isActive ? 2 : 1);
        p.life += 1;

        const x = cx + Math.cos(p.angle) * p.radius;
        const y = cy + Math.sin(p.angle) * p.radius;

        const alpha = Math.min(1, p.life / 20) * (0.6 + Math.random() * 0.4);
        const size = p.size * (0.8 + Math.random() * 0.4);

        // Glow
        const grad = ctx.createRadialGradient(x, y, 0, x, y, size * 6);
        grad.addColorStop(0, p.color);
        grad.addColorStop(0.4, p.color + "88");
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, size * 6, 0, Math.PI * 2);
        ctx.fill();

        // Core do ponto
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        // Reset quando sai muito longe
        if (p.radius > baseRadius * 1.6) p.radius = baseRadius * 0.5;
        if (p.radius < baseRadius * 0.4) p.radius = baseRadius * 1.5;
      });

      // === SPARKS ===
      if (isActive && frame % 3 === 0) spawnSpark();
      sparks.forEach((sp, idx) => {
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vx *= 0.97;
        sp.vy *= 0.97;
        sp.life -= 1;

        const alpha = sp.life / sp.maxLife;
        if (alpha > 0) {
          ctx.fillStyle = `rgba(253, 230, 138, ${alpha})`;
          ctx.shadowBlur = 15;
          ctx.shadowColor = "#fbbf24";
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.size * alpha, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          sparks.splice(idx, 1);
        }
      });

      // === FEIXES RADIAIS (quando ativo) ===
      if (isActive) {
        const beamCount = isSpeaking ? 12 : 6;
        for (let i = 0; i < beamCount; i++) {
          const angle = (i / beamCount) * Math.PI * 2 + frame * 0.02;
          const beamAlpha = Math.max(0, Math.sin(frame * 0.1 + i) * 0.5 + 0.5);
          const x1 = cx + Math.cos(angle) * baseRadius * 0.3;
          const y1 = cy + Math.sin(angle) * baseRadius * 0.3;
          const x2 = cx + Math.cos(angle) * baseRadius * 1.8;
          const y2 = cy + Math.sin(angle) * baseRadius * 1.8;

          const beamGrad = ctx.createLinearGradient(x1, y1, x2, y2);
          beamGrad.addColorStop(0, `rgba(253, 230, 138, ${beamAlpha * 0.8})`);
          beamGrad.addColorStop(1, "rgba(245, 158, 11, 0)");
          ctx.strokeStyle = beamGrad;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      frame++;
      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="relative w-[700px] h-[700px] mx-auto flex items-center justify-center">
      {/* Canvas principal */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ filter: "blur(0.5px)" }}
      />

      {/* Core DOM overlay (ponto de luz central) */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 40,
          height: 40,
          background: "#ffffff",
          boxShadow:
            "0 0 40px #fde68a, 0 0 80px #fbbf24, 0 0 120px #f59e0b, 0 0 200px #ea580c",
        }}
        animate={{
          scale: state === "speaking" ? [1, 1.5, 1] : state === "thinking" ? [1, 1.2, 1] : [1, 1.05, 1],
          opacity: [0.85, 1, 0.85],
        }}
        transition={{
          duration: state === "speaking" ? 0.5 : state === "thinking" ? 0.8 : 2,
          repeat: Infinity,
        }}
      />

      {/* Texto de status */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <motion.div
          className="font-orbitron text-sm tracking-[0.5em]"
          style={{
            color: "#fde68a",
            textShadow: "0 0 10px #fbbf24, 0 0 20px #f59e0b, 0 0 30px #ea580c",
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {state === "idle" ? "STANDBY" : state === "thinking" ? "PROCESSING" : "SPEAKING"}
        </motion.div>
        <div className="text-[9px] text-amber-200/40 mt-1 font-mono tracking-widest">
          v2.0.4
        </div>
      </div>
    </div>
  );
}