import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useJarvis } from "../components/jarvis/Bootstrap";
import { IronManHelmet } from "../components/jarvis/IronManHelmet";
import { MouseTrail } from "../components/jarvis/MouseTrail";
import { SFX } from "../lib/sfx";
import { THEMES, applyTheme, loadPersona, type Persona } from "../lib/theme";

type Thread = { id: string; title: string; updated_at: string };

const PERSONAS_LIST: { id: Persona; label: string }[] = [
  { id: "jarvis", label: "J.A.R.V.I.S." },
  { id: "friday", label: "F.R.I.D.A.Y." },
  { id: "ultron", label: "ULTRON" },
  { id: "sextafeira", label: "SEXTA-FEIRA" },
];

const TIPS = [
  "Dica: use ↑ no input para repetir o último comando.",
  "Dica: Ctrl+M troca o modo de raciocínio rapidamente.",
  "Dica: F11 entra em modo tela cheia cinematográfico.",
  "Dica: diga 'JARVIS' para ativar o modo de voz contínua.",
  "Dica: peça 'pesquise X' para buscar na internet em tempo real.",
  "Dica: 'o que é X' consulta a Wikipedia automaticamente.",
];

export function HomePage() {
  const { user } = useJarvis();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [filtered, setFiltered] = useState<Thread[]>([]);
  const [search, setSearch] = useState("");
  const [booted, setBooted] = useState(false);
  const [time, setTime] = useState(new Date());
  const [persona, setPersona] = useState<Persona>("jarvis");
  const [quick, setQuick] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [focused, setFocused] = useState(false);
  const [listening, setListening] = useState(false);
  const [personaOpen, setPersonaOpen] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const theme = THEMES[persona];

  useEffect(() => {
    const p = loadPersona();
    setPersona(p);
    applyTheme(p);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 1000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 6000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    supabase
      .from("threads")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        setThreads(data ?? []);
        setFiltered(data ?? []);
      });
  }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(threads); return; }
    const q = search.toLowerCase();
    setFiltered(threads.filter((t) => t.title.toLowerCase().includes(q)));
  }, [search, threads]);

  const newThread = async (msg?: string) => {
    SFX.reactorEngage();
    const { data, error } = await supabase
      .from("threads")
      .insert({ user_id: user.id, title: msg ? msg.slice(0, 40) : "Nova conversa" })
      .select()
      .single();
    if (error) return alert(error.message);
    navigate({ to: "/chat/$threadId", params: { threadId: data.id } });
  };

  const send = () => {
    if (!quick.trim()) return;
    newThread(quick.trim());
  };

  const removeThread = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Apagar esta conversa?")) return;
    await supabase.from("threads").delete().eq("id", id);
    setThreads((t) => t.filter((x) => x.id !== id));
    SFX.error();
  };

  const toggleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return alert("Voz não suportada.");
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const rec = new SR();
    rec.lang = "pt-BR";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: any) => { setQuick(e.results[0][0].transcript); SFX.click(); };
    rec.onend = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
    SFX.buttonPress();
  };

  const switchPersona = (p: Persona) => {
    setPersona(p);
    applyTheme(p);
    setPersonaOpen(false);
    SFX.personaSwitch();
  };

  const actions = [
    { icon: "🧠", label: "Explique", desc: "Conceito complexo", prompt: "Me explique sobre " },
    { icon: "✍️", label: "Escreva", desc: "Texto ou artigo", prompt: "Escreva um texto sobre " },
    { icon: "💻", label: "Programe", desc: "Código do zero", prompt: "Escreva um código que " },
    { icon: "🔍", label: "Pesquise", desc: "Busca na web", prompt: "Pesquise na internet sobre " },
    { icon: "🎨", label: "Crie", desc: "Brainstorm criativo", prompt: "Me dê 5 ideias sobre " },
    { icon: "📊", label: "Analise", desc: "Prós e contras", prompt: "Analise os prós e contras de " },
  ];

  const hour = time.getHours();
  const greeting = hour < 12 ? "BOM DIA" : hour < 18 ? "BOA TARDE" : "BOA NOITE";

  return (
    <div ref={containerRef} className="min-h-screen text-slate-100 relative overflow-hidden bg-slate-950">
      <div className="scanline" />
      <MouseTrail />

      {/* Aurora rotativa */}
      <motion.div
        className="fixed -top-1/2 -left-1/4 w-[150vmax] h-[150vmax] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${theme.glow} 0%, transparent 60%)`, filter: "blur(80px)", opacity: 0.18 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />

      {/* Grid */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.07]"
        style={{
          backgroundImage: `linear-gradient(${theme.primary} 1px, transparent 1px), linear-gradient(90deg, ${theme.primary} 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Scanline horizontal */}
      <motion.div
        className="fixed left-0 right-0 h-px pointer-events-none z-[1]"
        style={{
          background: `linear-gradient(90deg, transparent, ${theme.primary}, transparent)`,
          boxShadow: `0 0 20px ${theme.primary}`,
          opacity: 0.25,
        }}
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      />

      {/* Partículas */}
      {Array.from({ length: 25 }).map((_, i) => (
        <motion.div
          key={`p-${i}`}
          className="fixed rounded-full pointer-events-none z-[1]"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            background: i % 3 === 0 ? "#fbbf24" : theme.primary,
            boxShadow: `0 0 ${6 + i * 0.5}px ${i % 3 === 0 ? "#fbbf24" : theme.primary}`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{ y: [0, -40 - Math.random() * 60, 0], opacity: [0, 0.9, 0] }}
          transition={{ duration: 6 + Math.random() * 8, repeat: Infinity, delay: Math.random() * 5 }}
        />
      ))}

      {/* Boot */}
      <AnimatePresence>
        {!booted && (
          <motion.div
            key="boot"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[500] bg-slate-950 flex items-center justify-center"
          >
            <div className="text-center">
              <div
                className="font-orbitron text-4xl md:text-6xl tracking-[0.3em]"
                style={{ color: theme.primary, textShadow: `0 0 30px ${theme.primary}, 0 0 60px ${theme.glow}` }}
              >
                {theme.name}
              </div>
              <div className="text-[10px] text-slate-400 tracking-[0.5em] mt-4 font-mono">
                {theme.tagline.toUpperCase()}
              </div>
              <div className="mt-8 w-80 h-1 bg-slate-900 overflow-hidden mx-auto rounded">
                <motion.div
                  className="h-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1 }}
                  style={{ background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})`, boxShadow: `0 0 20px ${theme.primary}` }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD corners */}
      {booted && (
        <>
          <div className="fixed top-3 left-3 w-10 h-10 border-t-2 border-l-2 z-30 pointer-events-none" style={{ borderColor: `${theme.primary}99` }} />
          <div className="fixed top-3 right-3 w-10 h-10 border-t-2 border-r-2 z-30 pointer-events-none" style={{ borderColor: `${theme.primary}99` }} />
          <div className="fixed bottom-3 left-3 w-10 h-10 border-b-2 border-l-2 z-30 pointer-events-none" style={{ borderColor: `${theme.primary}99` }} />
          <div className="fixed bottom-3 right-3 w-10 h-10 border-b-2 border-r-2 z-30 pointer-events-none" style={{ borderColor: `${theme.primary}99` }} />
        </>
      )}

      {/* ============ LAYOUT ============ */}
      <div className="relative z-10 flex h-screen">
        {/* ============ SIDEBAR ============ */}
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: booted ? (sidebarOpen ? 280 : 60) : 0, opacity: booted ? 1 : 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="border-r backdrop-blur-xl bg-slate-950/60 flex flex-col overflow-hidden shrink-0 transition-colors duration-700"
          style={{ borderColor: `${theme.primary}33` }}
        >
          <div className="p-4 flex items-center justify-between border-b shrink-0" style={{ borderColor: `${theme.primary}22` }}>
            {sidebarOpen ? (
              <div className="flex items-center gap-3 min-w-0">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-9 h-9 rounded-full border-2 relative shrink-0"
                  style={{ borderColor: theme.primary, borderTopColor: "transparent" }}
                >
                  <div className="absolute inset-1 rounded-full border" style={{ borderColor: `${theme.primary}66`, borderBottomColor: "transparent" }} />
                </motion.div>
                <div className="min-w-0">
                  <div className="font-orbitron text-sm tracking-[0.2em] truncate" style={{ color: theme.primary }}>
                    {theme.name}
                  </div>
                  <div className="text-[8px] font-mono text-slate-500 tracking-widest">v2.0.4</div>
                </div>
              </div>
            ) : (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-9 h-9 rounded-full border-2 mx-auto"
                style={{ borderColor: theme.primary, borderTopColor: "transparent" }}
              />
            )}
            <button
              onMouseEnter={() => SFX.hover()}
              onClick={() => { SFX.buttonPress(); setSidebarOpen((v) => !v); }}
              className="w-6 h-6 rounded flex items-center justify-center text-[10px] border transition-all hover:bg-white/5 shrink-0"
              style={{ borderColor: `${theme.primary}44`, color: theme.primary }}
            >
              {sidebarOpen ? "◄" : "►"}
            </button>
          </div>

          {sidebarOpen && (
            <div className="p-3 shrink-0">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onMouseEnter={() => SFX.hover()}
                onClick={() => newThread()}
                className="w-full py-2.5 rounded-lg font-orbitron text-[10px] tracking-[0.2em] text-slate-950 font-bold relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`, boxShadow: `0 0 20px ${theme.glow}` }}
              >
                + NOVA CONVERSA
              </motion.button>
            </div>
          )}

          {sidebarOpen && (
            <div className="px-3 pb-2 shrink-0">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border" style={{ borderColor: `${theme.primary}22`, background: "rgba(2,6,23,0.6)" }}>
                <span className="text-[10px] opacity-50">🔍</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar…"
                  className="flex-1 bg-transparent outline-none text-[11px] font-mono text-slate-200 placeholder:text-slate-600"
                />
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {sidebarOpen ? (
              filtered.length === 0 ? (
                <div className="text-center py-8 px-3">
                  <div className="text-[9px] font-mono tracking-[0.3em] text-slate-600 mb-2">
                    {search ? "NENHUM RESULTADO" : "NENHUMA CONVERSA"}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {filtered.map((t, i) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.02 }}
                      onMouseEnter={() => SFX.hover()}
                      onClick={() => { SFX.click(); navigate({ to: "/chat/$threadId", params: { threadId: t.id } }); }}
                      className="group relative flex items-center justify-between p-2.5 rounded-lg cursor-pointer hover:bg-white/5 transition-all border border-transparent hover:border-cyan-500/30"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: theme.primary, boxShadow: `0 0 6px ${theme.primary}` }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] text-slate-200 truncate">{t.title}</div>
                          <div className="text-[8px] text-slate-600 font-mono tracking-widest mt-0.5">
                            {new Date(t.updated_at).toLocaleDateString("pt-BR")}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => removeThread(t.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition p-1 text-[10px]"
                      >
                        ✕
                      </button>
                    </motion.div>
                  ))}
                </div>
              )
            ) : (
              <div className="space-y-1 mt-2">
                {filtered.slice(0, 10).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => navigate({ to: "/chat/$threadId", params: { threadId: t.id } })}
                    className="w-8 h-8 mx-auto rounded-lg border flex items-center justify-center cursor-pointer hover:bg-white/5 transition-all"
                    style={{ borderColor: `${theme.primary}33` }}
                    title={t.title}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: theme.primary }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {sidebarOpen && (
            <div className="p-3 border-t shrink-0 space-y-2" style={{ borderColor: `${theme.primary}22` }}>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border-2"
                  style={{ borderColor: `${theme.primary}66`, color: theme.primary }}
                >
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-slate-200 truncate">{user.email.split("@")[0]}</div>
                  <div className="text-[8px] font-mono text-emerald-400 tracking-widest flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    ONLINE
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onMouseEnter={() => SFX.hover()}
                  onClick={() => { SFX.buttonPress(); navigate({ to: "/configuraciones" }); }}
                  className="flex-1 py-1.5 rounded border text-[9px] font-mono tracking-widest transition-all hover:bg-white/5"
                  style={{ borderColor: `${theme.primary}44`, color: theme.primary }}
                >
                  ⚙ CONFIG
                </button>
                <button
                  onMouseEnter={() => SFX.hover()}
                  onClick={() => { SFX.buttonPress(); supabase.auth.signOut(); }}
                  className="flex-1 py-1.5 rounded border text-[9px] font-mono tracking-widest transition-all hover:bg-red-500/10 border-red-500/30 text-red-300"
                >
                  SAIR
                </button>
              </div>
            </div>
          )}
        </motion.aside>

        {/* ============ MAIN ============ */}
        <main className="flex-1 flex flex-col relative overflow-hidden min-w-0">
          {/* TOP BAR */}
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: booted ? 0 : -30, opacity: booted ? 1 : 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex items-center justify-between px-4 py-3 border-b backdrop-blur-xl shrink-0 gap-3"
            style={{ borderColor: `${theme.primary}22` }}
          >
            <div className="flex items-center gap-3 text-[10px] font-mono tracking-widest min-w-0">
              <div className="flex items-center gap-2 shrink-0" style={{ color: theme.primary }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: theme.primary, boxShadow: `0 0 8px ${theme.primary}` }} />
                ONLINE
              </div>
              <span className="text-slate-600 hidden md:inline">·</span>
              <span className="text-slate-500 hidden md:inline tabular-nums">{time.toLocaleTimeString("pt-BR")}</span>
              <span className="text-slate-600 hidden lg:inline">·</span>
              <span className="text-slate-500 hidden lg:inline">{greeting}, SENHOR</span>
            </div>

            {/* PERSONA SWITCHER */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={() => SFX.hover()}
                onClick={() => { SFX.menuOpen(); setPersonaOpen((v) => !v); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded border text-[10px] font-mono tracking-widest transition-all"
                style={{
                  borderColor: `${theme.primary}88`,
                  color: theme.primary,
                  background: theme.bg,
                  boxShadow: `0 0 15px ${theme.glow}`,
                }}
              >
                {theme.emoji} {theme.name} ▼
              </motion.button>
              <AnimatePresence>
                {personaOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full right-0 mt-2 z-[100] bg-slate-950/95 border border-cyan-500/30 rounded-lg p-2 min-w-[200px] backdrop-blur-xl shadow-2xl"
                  >
                    {PERSONAS_LIST.map((p) => {
                      const pt = THEMES[p.id];
                      const active = persona === p.id;
                      return (
                        <button
                          key={p.id}
                          onMouseEnter={() => SFX.hover()}
                          onClick={() => switchPersona(p.id)}
                          className={`w-full text-left px-3 py-2 rounded transition flex items-center gap-2 mb-1 ${
                            active ? "bg-slate-800/80" : "hover:bg-slate-800/60"
                          }`}
                          style={{ color: pt.primary, borderLeft: active ? `3px solid ${pt.primary}` : "3px solid transparent" }}
                        >
                          <span>{pt.emoji}</span>
                          <span className="text-xs font-mono tracking-widest">{p.label}</span>
                          {active && <span className="ml-auto text-[10px]">●</span>}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* HERO + WIDGETS */}
          <div className="flex-1 flex overflow-hidden">
            {/* CENTER HERO */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 relative overflow-y-auto py-6">
              {/* Helmet + anéis */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        width: `${260 + i * 80}px`,
                        height: `${260 + i * 80}px`,
                        border: `1px solid ${theme.primary}${i === 1 ? "44" : "14"}`,
                      }}
                      animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                      transition={{ duration: 25 + i * 12, repeat: Infinity, ease: "linear" }}
                    >
                      <div
                        className="absolute w-1.5 h-1.5 rounded-full"
                        style={{
                          top: "50%",
                          left: i % 2 === 0 ? "-3px" : "calc(100% - 3px)",
                          background: i % 3 === 0 ? "#fbbf24" : theme.primary,
                          boxShadow: `0 0 10px ${i % 3 === 0 ? "#fbbf24" : theme.primary}`,
                        }}
                      />
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.6, y: 30 }}
                  animate={{ opacity: booted ? 1 : 0, scale: 0.8, y: 0 }}
                  transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="relative"
                >
                  <IronManHelmet state="idle" />
                </motion.div>
              </div>

              {/* Título */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : 20 }}
                transition={{ duration: 0.8, delay: 1 }}
                className="text-center mt-2 mb-5 w-full"
              >
                <div className="text-[10px] tracking-[0.5em] font-mono mb-3" style={{ color: `${theme.primary}99` }}>
                  ▸ BEM-VINDO DE VOLTA, SENHOR
                </div>
                <div className="flex justify-center px-4">
                  <svg viewBox="0 0 900 100" className="w-full max-w-3xl" preserveAspectRatio="xMidYMid meet">
                    <defs>
                      <linearGradient id="homeTitleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={theme.primary} />
                        <stop offset="50%" stopColor={theme.accent} />
                        <stop offset="100%" stopColor={theme.primary} />
                        <animate attributeName="x1" values="0%;-100%;0%" dur="4s" repeatCount="indefinite" />
                        <animate attributeName="x2" values="100%;0%;100%" dur="4s" repeatCount="indefinite" />
                      </linearGradient>
                      <filter id="homeTitleGlow" x="-10%" y="-10%" width="120%" height="120%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <text
                      x="450" y="55"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontFamily="Orbitron, sans-serif"
                      fontSize="54" fontWeight="700" letterSpacing="2"
                      textLength="860" lengthAdjust="spacingAndGlyphs"
                      fill="url(#homeTitleGrad)"
                      filter="url(#homeTitleGlow)"
                    >
                      Como posso ajudar?
                    </text>
                  </svg>
                </div>
              </motion.div>

              {/* INPUT */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : 20 }}
                transition={{ duration: 0.8, delay: 1.2 }}
                className="w-full max-w-2xl mb-4"
              >
                <div
                  className="relative flex items-center gap-2 p-2 rounded-2xl border backdrop-blur-xl transition-all duration-300"
                  style={{
                    borderColor: focused ? theme.primary : `${theme.primary}55`,
                    background: "rgba(2, 6, 23, 0.7)",
                    boxShadow: focused ? `0 0 50px ${theme.glow}, inset 0 0 20px ${theme.bg}` : `0 0 30px ${theme.glow}`,
                  }}
                >
                  <div className="pl-3 text-lg" style={{ color: theme.primary }}>▸</div>
                  <input
                    ref={inputRef}
                    value={quick}
                    onChange={(e) => setQuick(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder="Digite um comando…"
                    className="flex-1 bg-transparent px-2 py-3 outline-none text-slate-100 placeholder:text-slate-500 font-mono text-sm"
                    autoFocus
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={() => SFX.hover()}
                    onClick={toggleVoice}
                    className="px-3 py-3 rounded-xl font-bold transition-all"
                    style={{
                      background: listening ? theme.primary : "transparent",
                      color: listening ? "#020617" : theme.primary,
                      border: `1px solid ${theme.primary}66`,
                    }}
                    title="Voz"
                  >
                    {listening ? "🔴" : "🎙"}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={() => SFX.hover()}
                    onClick={send}
                    disabled={!quick.trim()}
                    className="px-5 py-3 rounded-xl font-orbitron text-[10px] tracking-[0.2em] text-slate-950 font-bold transition-all disabled:opacity-30"
                    style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`, boxShadow: `0 0 20px ${theme.glow}` }}
                  >
                    ENVIAR ▸
                  </motion.button>
                </div>
                <div className="text-[9px] font-mono tracking-widest text-slate-600 mt-2 text-center">
                  ENTER para enviar · 🎙 voz · cria nova conversa
                </div>
              </motion.div>

              {/* ACTIONS */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : 20 }}
                transition={{ duration: 0.8, delay: 1.4 }}
                className="w-full max-w-3xl grid grid-cols-2 md:grid-cols-3 gap-2"
              >
                {actions.map((a) => (
                  <motion.button
                    key={a.label}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onMouseEnter={() => SFX.hover()}
                    onClick={() => { SFX.click(); setQuick(a.prompt); inputRef.current?.focus(); }}
                    className="flex items-start gap-2.5 px-3 py-3 rounded-lg border backdrop-blur-sm bg-slate-950/40 transition-all text-left group relative overflow-hidden"
                    style={{ borderColor: `${theme.primary}22` }}
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = theme.primary;
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 0 25px ${theme.glow}`;
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = `${theme.primary}22`;
                      (e.currentTarget as HTMLElement).style.boxShadow = "none";
                    }}
                  >
                    <motion.span className="text-xl" whileHover={{ scale: 1.2, rotate: 5 }}>{a.icon}</motion.span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-slate-200 tracking-wide">{a.label}</div>
                      <div className="text-[9px] text-slate-500 tracking-wider">{a.desc}</div>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            </div>

            {/* RIGHT WIDGETS PANEL */}
            <motion.aside
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: booted ? 0 : 100, opacity: booted ? 1 : 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="hidden xl:flex flex-col w-72 border-l backdrop-blur-xl bg-slate-950/40 shrink-0 overflow-y-auto"
              style={{ borderColor: `${theme.primary}22` }}
            >
              {/* Clock widget */}
              <div className="p-4 border-b" style={{ borderColor: `${theme.primary}22` }}>
                <div className="text-[9px] font-mono tracking-widest text-slate-500 mb-2">▸ HORA LOCAL</div>
                <div
                  className="font-orbitron text-3xl tracking-widest tabular-nums"
                  style={{ color: theme.primary, textShadow: `0 0 15px ${theme.glow}` }}
                >
                  {time.toLocaleTimeString("pt-BR")}
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-1 tracking-widest">
                  {time.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).toUpperCase()}
                </div>
              </div>

              {/* System widget */}
              <div className="p-4 border-b" style={{ borderColor: `${theme.primary}22` }}>
                <div className="text-[9px] font-mono tracking-widest text-slate-500 mb-3">▸ SISTEMA</div>
                {[
                  { l: "CPU", v: 43, c: theme.primary },
                  { l: "MEM", v: 67, c: theme.accent },
                  { l: "NET", v: 82, c: theme.primary },
                  { l: "PWR", v: 98, c: "#10b981" },
                ].map((m) => (
                  <div key={m.l} className="mb-2">
                    <div className="flex justify-between text-[9px] font-mono tracking-widest mb-1" style={{ color: m.c }}>
                      <span>{m.l}</span><span className="tabular-nums">{m.v}%</span>
                    </div>
                    <div className="h-1 bg-slate-900 rounded overflow-hidden">
                      <motion.div
                        className="h-full"
                        style={{ background: m.c, boxShadow: `0 0 8px ${m.c}` }}
                        animate={{ width: `${m.v}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent activity */}
              <div className="p-4 border-b" style={{ borderColor: `${theme.primary}22` }}>
                <div className="text-[9px] font-mono tracking-widest text-slate-500 mb-3">▸ ATIVIDADE RECENTE</div>
                {threads.length === 0 ? (
                  <div className="text-[10px] text-slate-600 font-mono">Nenhuma atividade</div>
                ) : (
                  <div className="space-y-2">
                    {threads.slice(0, 3).map((t) => (
                      <div
                        key={t.id}
                        onClick={() => navigate({ to: "/chat/$threadId", params: { threadId: t.id } })}
                        className="group flex items-start gap-2 cursor-pointer"
                      >
                        <div className="w-1 h-1 rounded-full mt-1.5 shrink-0 animate-pulse" style={{ background: theme.primary, boxShadow: `0 0 6px ${theme.primary}` }} />
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] text-slate-300 truncate group-hover:text-white transition">{t.title}</div>
                          <div className="text-[8px] text-slate-600 font-mono tracking-widest">
                            {new Date(t.updated_at).toLocaleDateString("pt-BR")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tip */}
              <div className="p-4 flex-1">
                <div className="text-[9px] font-mono tracking-widest text-slate-500 mb-3">▸ DICA</div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tipIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-[11px] text-slate-300 leading-relaxed font-mono"
                  >
                    {TIPS[tipIndex]}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.aside>
          </div>

          {/* BOTTOM STATUS */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: booted ? 1 : 0 }}
            transition={{ delay: 1.6 }}
            className="px-4 py-2 border-t backdrop-blur-xl flex items-center justify-between text-[9px] font-mono tracking-[0.3em] shrink-0 gap-4"
            style={{ borderColor: `${theme.primary}22`, color: `${theme.primary}66` }}
          >
            <div className="flex items-center gap-4">
              <span>▸ {theme.name}</span>
              <span className="hidden md:inline">{threads.length} CONVERSAS</span>
            </div>
            <motion.div
              className="flex items-center gap-2 flex-1 justify-center overflow-hidden"
              key={tipIndex}
            >
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[9px] font-mono tracking-widest truncate"
                style={{ color: `${theme.primary}99` }}
              >
                ◈ {TIPS[tipIndex]}
              </motion.div>
            </motion.div>
            <span className="hidden md:inline">STARK · SYS v2.0.4</span>
          </motion.div>
        </main>
      </div>
    </div>
  );
}