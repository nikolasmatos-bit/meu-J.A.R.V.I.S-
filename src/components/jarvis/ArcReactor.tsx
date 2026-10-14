import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

type State = "idle" | "thinking" | "speaking";

type Particle = {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  hue: number;
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

    const size = 700;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const R = size * 0.35;

    const particles: Particle[] = [];
    const sparks: Spark[] = [];

    // 180 partículas cristalinas em 4 camadas
    for (let i = 0; i < 180; i++) {
      const layer = Math.floor(Math.random() * 4);
      const radiusFactor = [0.55, 0.72, 0.88, 1.05][layer];
      particles.push({
        angle: Math.random() * Math.PI * 2,
        radius: R * radiusFactor * (0.95 + Math.random() * 0.1),
        speed: (0.003 + Math.random() * 0.008) * (layer % 2 === 0 ? 1 : -1),
        size: 0.8 + Math.random() * 1.6,
        hue: 35 + Math.random() * 15, // 35-50 (dourado/âmbar)
      });
    }

    const spawnSpark = () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3;
      sparks.push({
        x: cx + Math.cos(angle) * 8,
        y: cy + Math.sin(angle) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 90 + Math.random() * 60,
        maxLife: 90,
        size: 0.5 + Math.random() * 1.2,
      });
    };

    let animId: number;
    let frame = 0;

    const draw = () => {
      const s = stateRef.current;
      const isActive = s !== "idle";
      const isSpeaking = s === "speaking";
      const isThinking = s === "thinking";

      // Fundo escuro limpo
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, size, size);

      const coreHue = isSpeaking ? 45 : isThinking ? 40 : 35;
      const coreColor = `hsl(${coreHue}, 95%, 70%)`;
      const warmColor = `hsl(${coreHue + 5}, 90%, 55%)`;
      const deepColor = `hsl(${coreHue + 10}, 85%, 40%)`;
      const intensity = isSpeaking ? 1.4 : isThinking ? 1.15 : 0.9;

      // ============================================
      // AURA EXTERNA (mais sutil e definida)
      // ============================================
      const auraGrad = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, R * 2.2);
      auraGrad.addColorStop(0, `hsla(${coreHue}, 100%, 60%, ${0.12 * intensity})`);
      auraGrad.addColorStop(0.5, `hsla(${coreHue + 10}, 90%, 50%, ${0.06 * intensity})`);
      auraGrad.addColorStop(1, "transparent");
      ctx.fillStyle = auraGrad;
      ctx.fillRect(0, 0, size, size);

      // ============================================
      // HEXÁGONOS DE FUNDO (HUD sutil)
      // ============================================
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(frame * 0.002);
      ctx.strokeStyle = `hsla(${coreHue}, 80%, 60%, 0.06)`;
      ctx.lineWidth = 1;
      for (let ring = 0; ring < 3; ring++) {
        const hexR = R * (1.35 + ring * 0.25);
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const x = Math.cos(a) * hexR;
          const y = Math.sin(a) * hexR;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();

      // ============================================
      // ANÉIS CONCÊNTRICOS NÍTIDOS
      // ============================================
      const rings = [
        { r: R * 1.08, width: 1.5, dash: [60, 8, 20, 8], speed: 0.001, alpha: 0.7 },
        { r: R * 0.94, width: 1, dash: [2, 6], speed: -0.0008, alpha: 0.5 },
        { r: R * 0.82, width: 2, dash: [40, 15], speed: 0.0015, alpha: 0.8 },
        { r: R * 0.68, width: 1, dash: [8, 4], speed: -0.001, alpha: 0.6 },
        { r: R * 0.54, width: 1.5, dash: [30, 10], speed: 0.0012, alpha: 0.7 },
        { r: R * 0.4, width: 1, dash: [6, 6], speed: -0.0006, alpha: 0.5 },
      ];

      rings.forEach((ring) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(frame * ring.speed * (isActive ? 2 : 1));
        ctx.strokeStyle = `hsla(${coreHue}, 90%, 65%, ${ring.alpha * intensity})`;
        ctx.lineWidth = ring.width;
        ctx.setLineDash(ring.dash);
        ctx.beginPath();
        ctx.arc(0, 0, ring.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      });

      // ============================================
      // 48 MARCADORES RADIAIS
      // ============================================
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        const isMajor = i % 6 === 0;
        const isMedium = i % 3 === 0;
        const innerR = R * 1.08;
        const outerR = R * 1.08 + (isMajor ? 14 : isMedium ? 9 : 5);

        const x1 = cx + Math.cos(a) * innerR;
        const y1 = cy + Math.sin(a) * innerR;
        const x2 = cx + Math.cos(a) * outerR;
        const y2 = cy + Math.sin(a) * outerR;

        ctx.strokeStyle = `hsla(${coreHue}, 90%, 65%, ${isMajor ? 0.9 : isMedium ? 0.6 : 0.35})`;
        ctx.lineWidth = isMajor ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // ============================================
      // ARCO DE PROGRESSO (não fecha 100%)
      // ============================================
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-frame * 0.005);
      const arcGrad = ctx.createLinearGradient(-R, -R, R, R);
      arcGrad.addColorStop(0, `hsla(${coreHue}, 100%, 75%, ${0.9 * intensity})`);
      arcGrad.addColorStop(1, `hsla(${coreHue}, 100%, 60%, 0)`);
      ctx.strokeStyle = arcGrad;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, 0, R * 1.15, 0, Math.PI * 1.4);
      ctx.stroke();
      ctx.restore();

      // ============================================
      // PARTÍCULAS CRISTALINAS (nítidas, não blobs)
      // ============================================
      particles.forEach((p) => {
        p.angle += p.speed * (isActive ? 2 : 1);
        const x = cx + Math.cos(p.angle) * p.radius;
        const y = cy + Math.sin(p.angle) * p.radius;

        // Halo fino (pequeno, não gigante)
        const halo = ctx.createRadialGradient(x, y, 0, x, y, p.size * 4);
        halo.addColorStop(0, `hsla(${p.hue}, 100%, 75%, 0.9)`);
        halo.addColorStop(0.4, `hsla(${p.hue}, 100%, 65%, 0.35)`);
        halo.addColorStop(1, "transparent");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(x, y, p.size * 4, 0, Math.PI * 2);
        ctx.fill();

        // Ponto central NÍTIDO
        ctx.fillStyle = `hsl(${p.hue}, 100%, 90%)`;
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // ============================================
      // SPARKS saindo do centro
      // ============================================
      if (isActive && frame % 2 === 0) spawnSpark();
      if (isSpeaking && frame % 1 === 0) spawnSpark();

      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vx *= 0.98;
        sp.vy *= 0.98;
        sp.life -= 1;

        const alpha = sp.life / sp.maxLife;
        if (alpha > 0) {
          ctx.fillStyle = `hsla(${coreHue + 5}, 100%, 75%, ${alpha})`;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.size * alpha, 0, Math.PI * 2);
          ctx.fill();
        } else {
          sparks.splice(i, 1);
        }
      }

      // ============================================
      // FEIXES DE LUZ RADIAIS
      // ============================================
      const beamCount = isSpeaking ? 8 : isActive ? 4 : 2;
      for (let i = 0; i < beamCount; i++) {
        const angle = (i / beamCount) * Math.PI * 2 + frame * 0.008;
        const beamIntensity = isActive ? 1 : 0.4;

        const x1 = cx;
        const y1 = cy;
        const x2 = cx + Math.cos(angle) * R * 1.8;
        const y2 = cy + Math.sin(angle) * R * 1.8;

        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, `hsla(${coreHue}, 100%, 75%, ${0.35 * beamIntensity})`);
        grad.addColorStop(1, `hsla(${coreHue}, 100%, 60%, 0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // ============================================
      // NÚCLEO BRILHANTE (pequeno e intenso)
      // ============================================
      const pulse = 1 + Math.sin(frame * 0.08) * 0.08;
      const coreR = 35 * pulse * (isSpeaking ? 1.15 : 1);

      // Outer glow (sutil)
      const outerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 3);
      outerGlow.addColorStop(0, `hsla(${coreHue}, 100%, 80%, ${0.5 * intensity})`);
      outerGlow.addColorStop(0.4, `hsla(${coreHue}, 100%, 65%, ${0.2 * intensity})`);
      outerGlow.addColorStop(1, "transparent");
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 3, 0, Math.PI * 2);
      ctx.fill();

      // Mid glow
      const midGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 1.5);
      midGlow.addColorStop(0, `hsla(${coreHue}, 100%, 90%, 1)`);
      midGlow.addColorStop(0.6, `hsla(${coreHue}, 100%, 75%, 0.8)`);
      midGlow.addColorStop(1, `hsla(${coreHue}, 100%, 60%, 0)`);
      ctx.fillStyle = midGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Núcleo sólido (branco)
      ctx.fillStyle = "rgba(255, 255, 255, 0.98)";
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 0.5, 0, Math.PI * 2);
      ctx.fill();

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
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
      />

      {/* Texto status */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <motion.div
          className="font-orbitron text-xs tracking-[0.6em]"
          style={{
            color: "#fde68a",
            textShadow: "0 0 10px #fbbf24, 0 0 20px #f59e0b",
          }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          {state === "idle" ? "STANDBY" : state === "thinking" ? "PROCESSING" : "SPEAKING"}
        </motion.div>
        <div className="text-[8px] text-amber-200/40 mt-1 font-mono tracking-[0.4em]">
          J.A.R.V.I.S. v2.0.4
        </div>
      </div>
    </div>
  );
}