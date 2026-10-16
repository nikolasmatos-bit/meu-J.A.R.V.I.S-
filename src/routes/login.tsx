import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { SFX } from "../lib/sfx";
import { THEMES, applyTheme, loadPersona, type Persona } from "../lib/theme";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [persona, setPersona] = useState<Persona>("jarvis");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [time, setTime] = useState(new Date());
  const [terminalLog, setTerminalLog] = useState<string[]>([]);
  const [pulseKey, setPulseKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const theme = THEMES[persona];

  const particles = useMemo(
    () =>
      Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        w: Math.random() * 3 + 1,
        h: Math.random() * 3 + 1,
        top: Math.random() * 100,
        left: Math.random() * 100,
        duration: 6 + Math.random() * 8,
        delay: Math.random() * 5,
        yOffset: -40 - Math.random() * 60,
        color: i % 3 === 0 ? "#fbbf24" : THEMES[persona].primary,
        glow: 6 + i * 0.5,
      })),
    [persona]
  );

  useEffect(() => {
    const p = loadPersona();
    setPersona(p);
    applyTheme(p);
  }, []);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const logs = [
      "scan :: perimeter secure",
      "auth :: awaiting operator",
      "link :: stark uplink stable",
      "system :: all nominal",
      "encryption :: AES-256 active",
      "core :: neural ready",
    ];
    let i = 0;
    const t = setInterval(() => {
      const ts = new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setTerminalLog((prev) => [...prev.slice(-3), `${ts}  ${logs[i % logs.length]}`]);
      i++;
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const magic = async () => {
    if (!email.trim()) return;
    SFX.reactorEngage();
    setLoading(true);
    setPulseKey((k) => k + 1);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });

    setLoading(false);
    if (error) {
      SFX.error();
      alert(error.message);
    } else {
      SFX.responseDone();
      setSent(true);
    }
  };

  const google = () => {
    SFX.reactorEngage();
    setPulseKey((k) => k + 1);
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  const currentPersona = theme.name;

  return (
    <div className="min-h-screen text-slate-100 relative overflow-hidden bg-[#03050a] flex items-center justify-center px-4">
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(${theme.primary}0d 1px, transparent 1px),
            linear-gradient(90deg, ${theme.primary}0d 1px, transparent 1px),
            linear-gradient(${theme.primary}1a 1px, transparent 1px),
            linear-gradient(90deg, ${theme.primary}1a 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px, 20px 20px, 100px 100px, 100px 100px",
          transform: `translate(${mousePos.x * -10}px, ${mousePos.y * -10}px)`,
          transition: "transform 1s ease-out",
        }}
      />

      <motion.div
        className="fixed rounded-full pointer-events-none z-0"
        style={{
          width: "120vmax",
          height: "120vmax",
          top: "50%",
          left: "50%",
          x: "-50%",
          y: "-50%",
          background: `radial-gradient(circle, ${theme.glow} 0%, ${theme.primary}11 30%, transparent 60%)`,
          filter: "blur(100px)",
          opacity: 0.3,
        }}
        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
        transition={{
          rotate: { duration: 120, repeat: Infinity, ease: "linear" },
          scale: { duration: 12, repeat: Infinity, ease: "easeInOut" },
        }}
      />

      <motion.div
        className="fixed top-0 bottom-0 w-px pointer-events-none z-[1]"
        style={{
          background: `linear-gradient(180deg, transparent, ${theme.primary}, transparent)`,
          boxShadow: `0 0 30px ${theme.primary}`,
          opacity: 0.4,
        }}
        animate={{ left: ["0%", "100%"] }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      />

      {particles.map((p) => (
        <motion.div
          key={`particle-${p.id}`}
          className="fixed rounded-full pointer-events-none z-[1]"
          style={{
            width: p.w,
            height: p.h,
            background: p.color,
            boxShadow: `0 0 ${p.glow}px ${p.color}`,
            top: `${p.top}%`,
            left: `${p.left}%`,
          }}
          animate={{
            y: [0, p.yOffset, 0],
            opacity: [0, 0.9, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
          }}
        />
      ))}

      <div className="fixed top-3 left-3 w-10 h-10 border-t-2 border-l-2 z-30 pointer-events-none" style={{ borderColor: `${theme.primary}88` }} />
      <div className="fixed top-3 right-3 w-10 h-10 border-t-2 border-r-2 z-30 pointer-events-none" style={{ borderColor: `${theme.primary}88` }} />
      <div className="fixed bottom-3 left-3 w-10 h-10 border-b-2 border-l-2 z-30 pointer-events-none" style={{ borderColor: `${theme.primary}88` }} />
      <div className="fixed bottom-3 right-3 w-10 h-10 border-b-2 border-r-2 z-30 pointer-events-none" style={{ borderColor: `${theme.primary}88` }} />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="fixed top-4 left-16 right-16 z-30 flex justify-between items-center font-mono text-[10px] tracking-[0.3em]"
        style={{ color: `${theme.primary}88` }}
      >
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 animate-pulse" style={{ background: theme.primary }} />
          <span>SECURE CHANNEL</span>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <span className="tabular-nums">{time.toLocaleTimeString("pt-BR")}</span>
          <span className="opacity-40">│</span>
          <span>{time.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}</span>
        </div>
        <div className="hidden lg:flex items-center gap-3">
          <span>AUTH REQUIRED</span>
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        </div>
      </motion.div>

      <div className="fixed left-0 top-0 bottom-0 w-8 border-r z-20 hidden md:flex flex-col items-center justify-between py-4" style={{ borderColor: `${theme.primary}22`, background: "rgba(3,5,10,0.75)" }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 24, repeat: Infinity, ease: "linear" }} className="w-3 h-3 border" style={{ borderColor: theme.primary, borderTopColor: "transparent" }} />
        <div className="font-mono text-[9px] tracking-[0.4em] rotate-180" style={{ color: `${theme.primary}66`, writingMode: "vertical-rl" }}>
          STARK INDUSTRIES · SEC-7G
        </div>
        <div className="font-mono text-[9px] tracking-[0.3em]" style={{ color: `${theme.primary}66`, writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
          ACCESS CONTROL
        </div>
      </div>

      <div className="fixed right-0 top-0 bottom-0 w-8 border-l z-20 hidden md:flex flex-col items-center justify-between py-4" style={{ borderColor: `${theme.primary}22`, background: "rgba(3,5,10,0.75)" }}>
        <div className="font-mono text-[9px] tracking-[0.3em]" style={{ color: `${theme.primary}66`, writingMode: "vertical-rl" }}>LAT -23.5505</div>
        <div className="w-px h-12" style={{ background: `${theme.primary}44` }} />
        <div className="font-mono text-[9px] tracking-[0.3em]" style={{ color: `${theme.primary}66`, writingMode: "vertical-rl" }}>LNG -46.6333</div>
        <div className="w-px h-12" style={{ background: `${theme.primary}44` }} />
        <div className="font-mono text-[9px] tracking-[0.3em]" style={{ color: `${theme.primary}66`, writingMode: "vertical-rl" }}>v2.0.4</div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="fixed bottom-4 left-16 right-16 z-30 font-mono text-[9px] tracking-wider hidden md:block"
        style={{ color: `${theme.primary}66` }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span>// TERMINAL</span>
          <span className="w-1 h-1 animate-pulse" style={{ background: theme.primary }} />
        </div>
        {terminalLog.map((line, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="truncate" style={{ color: i === terminalLog.length - 1 ? theme.primary : `${theme.primary}55` }}>
            {line}
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 w-full max-w-md"
        style={{
          transform: `translate(${mousePos.x * 5}px, ${mousePos.y * 5}px)`,
          transition: "transform 0.6s ease-out",
        }}
      >
        <div className="absolute -inset-8 rounded-3xl pointer-events-none" style={{ background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`, filter: "blur(50px)", opacity: 0.5 }} />

        <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 z-10" style={{ borderColor: theme.primary }} />
        <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 z-10" style={{ borderColor: theme.primary }} />
        <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 z-10" style={{ borderColor: theme.primary }} />
        <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 z-10" style={{ borderColor: theme.primary }} />

        <div className="relative rounded-2xl border-2 backdrop-blur-xl p-8" style={{ borderColor: `${theme.primary}44`, background: "rgba(3,5,10,0.85)", boxShadow: `0 0 80px ${theme.glow}` }}>
          <AnimatePresence>
            {pulseKey > 0 && (
              <motion.div key={pulseKey} className="absolute inset-0 rounded-2xl pointer-events-none" style={{ border: `2px solid ${theme.primary}` }} initial={{ scale: 1, opacity: 1 }} animate={{ scale: 1.3, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 1, ease: "easeOut" }} />
            )}
          </AnimatePresence>

          <div className="relative flex items-center justify-center mb-6">
            {[1, 2, 3].map((i) => (
              <motion.div key={i} className="absolute rounded-full border" style={{ width: 140 + i * 40, height: 140 + i * 40, borderColor: `${theme.primary}${i === 1 ? "55" : "22"}`, borderStyle: i % 2 === 0 ? "dashed" : "solid" }} animate={{ rotate: i % 2 === 0 ? 360 : -360 }} transition={{ duration: 20 + i * 10, repeat: Infinity, ease: "linear" }}>
                <div className="absolute w-1.5 h-1.5 rounded-full" style={{ top: "50%", left: i % 2 === 0 ? "-3px" : "calc(100% - 3px)", background: i % 3 === 0 ? "#fbbf24" : theme.primary, boxShadow: `0 0 10px ${i % 3 === 0 ? "#fbbf24" : theme.primary}` }} />
              </motion.div>
            ))}

            <motion.div className="absolute rounded-full" style={{ width: 140, height: 140, background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`, filter: "blur(20px)" }} animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />

            <motion.div className="relative" style={{ width: 100, height: 100, borderRadius: "50%", overflow: "hidden", WebkitMaskImage: "radial-gradient(circle, black 50%, transparent 72%)", maskImage: "radial-gradient(circle, black 50%, transparent 72%)" }} animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
              <motion.img src="/JARVIS.webp" alt="JARVIS Core" className="w-full h-full object-contain" style={{ filter: `drop-shadow(0 0 20px ${theme.primary}) drop-shadow(0 0 40px ${theme.glow}) saturate(1.3) brightness(1.1)` }} animate={{ rotate: 360 }} transition={{ duration: 90, repeat: Infinity, ease: "linear" }} />
            </motion.div>
          </div>

          <div className="text-center mb-1">
            <motion.h1 className="font-orbitron text-3xl tracking-[0.4em]" style={{ color: theme.primary, textShadow: `0 0 20px ${theme.primary}, 0 0 40px ${theme.glow}` }} animate={{ opacity: [0.9, 1, 0.9] }} transition={{ duration: 2.5, repeat: Infinity }}>
              {currentPersona}
            </motion.h1>
          </div>

          <div className="text-center mb-8">
            <TypewriterText text="JUST A RATHER VERY INTELLIGENT SYSTEM" color={theme.primary} />
          </div>

          <div className="relative mb-6">
            <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${theme.primary}66, transparent)` }} />
            <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 text-[9px] font-mono tracking-[0.3em]" style={{ color: `${theme.primary}88`, background: "#03050a" }}>ACESSO RESTRITO</div>
          </div>

          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div key="sent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-center py-6">
                <motion.div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: theme.primary, boxShadow: `0 0 30px ${theme.glow}` }} animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <span className="text-2xl">✓</span>
                </motion.div>
                <div className="font-orbitron text-sm tracking-[0.3em] mb-3" style={{ color: theme.primary }}>LINK ENVIADO</div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Verifique <b style={{ color: theme.primary }}>{email}</b>
                  <br />
                  Clique no link para autenticar.
                </p>
                <button onClick={() => { setSent(false); SFX.click(); }} className="mt-6 font-mono text-[10px] tracking-widest px-4 py-2 border transition-all hover:bg-white/5" style={{ borderColor: `${theme.primary}44`, color: `${theme.primary}99` }}>
                  ← VOLTAR
                </button>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onMouseEnter={() => SFX.hover()} onClick={google} className="w-full py-3 rounded-lg border font-medium transition-all flex items-center justify-center gap-3" style={{ borderColor: `${theme.primary}44`, background: "rgba(3,5,10,0.6)", color: theme.primary }}>
                  <GoogleIcon color={theme.primary} />
                  <span className="font-mono text-[11px] tracking-widest">ENTRAR COM GOOGLE</span>
                </motion.button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: `${theme.primary}22` }} />
                  <span className="text-[10px] font-mono tracking-widest" style={{ color: `${theme.primary}66` }}>OU</span>
                  <div className="flex-1 h-px" style={{ background: `${theme.primary}22` }} />
                </div>

                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 flex items-center px-3 border-r font-mono text-[10px] tracking-widest" style={{ borderColor: focusedField === "email" ? `${theme.primary}66` : `${theme.primary}22`, color: focusedField === "email" ? theme.primary : `${theme.primary}66`, transition: "all 0.3s" }}>✉</div>
                  <input ref={inputRef} type="email" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)} onKeyDown={(e) => e.key === "Enter" && magic()} placeholder="seu@email.com" className="w-full pl-12 pr-3 py-3 rounded-lg outline-none transition-all bg-transparent font-mono text-sm" style={{ border: `2px solid ${focusedField === "email" ? theme.primary : `${theme.primary}44`}`, color: "#e2e8f0", boxShadow: focusedField === "email" ? `0 0 25px ${theme.glow}` : "none" }} />
                </div>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onMouseEnter={() => SFX.hover()} onClick={magic} disabled={loading || !email.trim()} className="w-full py-3 rounded-lg font-orbitron text-[11px] tracking-[0.3em] font-bold transition-all disabled:opacity-40 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`, color: "#03050a", boxShadow: `0 0 30px ${theme.glow}` }}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span className="w-3 h-3 border-2 border-t-transparent rounded-full" style={{ borderColor: "#03050a" }} animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                      ENVIANDO…
                    </span>
                  ) : ("ENVIAR LINK MÁGICO")}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 pt-4 border-t flex items-center justify-between text-[9px] font-mono tracking-widest" style={{ borderColor: `${theme.primary}22`, color: `${theme.primary}55` }}>
            <span>SEC.AUTH</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              ENCRYPTED
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function TypewriterText({ text, color }: { text: string; color: string }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      if (i >= text.length) {
        clearInterval(interval);
        setDisplayed(text);
      } else {
        setDisplayed(text.slice(0, i));
      }
    }, 40);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <div className="text-[10px] font-mono tracking-[0.3em] flex justify-center" style={{ color: `${color}88` }}>
      <span>{displayed}</span>
      {displayed.length < text.length && (
        <span className="ml-0.5 animate-pulse" style={{ color }}>▊</span>
      )}
    </div>
  );
}

function GoogleIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill={color} opacity="0.9" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill={color} opacity="0.7" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill={color} opacity="0.5" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill={color} opacity="0.85" />
    </svg>
  );
}