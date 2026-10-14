import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useJarvis } from "../components/jarvis/Bootstrap";
import { IronManHelmet } from "../components/jarvis/IronManHelmet";
import { MouseTrail } from "../components/jarvis/MouseTrail";
import { SFX } from "../lib/sfx";
import { THEMES, applyTheme, loadPersona, type Persona } from "../lib/theme";

type Thread = {
  id: string;
  title: string;
  updated_at: string;
};

export function HomePage() {
  const { user } = useJarvis();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [booted, setBooted] = useState(false);
  const [time, setTime] = useState(new Date());
  const [persona, setPersona] = useState<Persona>("jarvis");
  const [quickCommand, setQuickCommand] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const theme = THEMES[persona];

  useEffect(() => {
    const p = loadPersona();
    setPersona(p);
    applyTheme(p);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    supabase
      .from("threads")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .then(({ data }) => setThreads(data ?? []));
  }, []);

  const newThread = async (firstMessage?: string) => {
    SFX.reactorEngage();
    const { data, error } = await supabase
      .from("threads")
      .insert({
        user_id: user.id,
        title: firstMessage ? firstMessage.slice(0, 40) : "Nova conversa",
      })
      .select()
      .single();
    if (error) return alert(error.message);
    navigate({ to: "/chat/$threadId", params: { threadId: data.id } });
  };

  const handleQuickSend = () => {
    if (!quickCommand.trim()) return;
    newThread(quickCommand.trim());
  };

  const removeThread = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Apagar esta conversa?")) return;
    await supabase.from("threads").delete().eq("id", id);
    setThreads((t) => t.filter((x) => x.id !== id));
    SFX.error();
  };

  const quickActions = [
    { icon: "🧠", label: "Explique algo", prompt: "Me explique detalhadamente sobre " },
    { icon: "✍️", label: "Escrever texto", prompt: "Escreva um texto sobre " },
    { icon: "💻", label: "Código", prompt: "Escreva um código que " },
    { icon: "🔍", label: "Pesquisar", prompt: "Pesquise na internet sobre " },
    { icon: "🎨", label: "Ideias criativas", prompt: "Me dê 5 ideias criativas sobre " },
    { icon: "📊", label: "Analisar", prompt: "Analise os prós e contras de " },
  ];

  return (
    <div className="min-h-screen text-slate-100 relative overflow-hidden bg-slate-950">
      <div className="scanline" />
      <MouseTrail />

      {/* Aurora de fundo */}
      <motion.div
        className="fixed -top-1/2 -left-1/4 w-[150vmax] h-[150vmax] rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${theme.glow} 0%, transparent 60%)`,
          filter: "blur(80px)",
          opacity: 0.15,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />

      {/* Grid de fundo */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.08]"
        style={{
          backgroundImage: `linear-gradient(${theme.primary} 1px, transparent 1px), linear-gradient(90deg, ${theme.primary} 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Scanline vertical */}
      <motion.div
        className="fixed top-0 bottom-0 w-px pointer-events-none z-[1]"
        style={{
          background: `linear-gradient(180deg, transparent, ${theme.primary}, transparent)`,
          boxShadow: `0 0 20px ${theme.primary}`,
          opacity: 0.3,
        }}
        animate={{ left: ["0%", "100%"] }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      />

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
                style={{
                  color: theme.primary,
                  textShadow: `0 0 30px ${theme.primary}, 0 0 60px ${theme.glow}`,
                }}
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
                  transition={{ duration: 1.2 }}
                  style={{
                    background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})`,
                    boxShadow: `0 0 20px ${theme.primary}`,
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cantos HUD */}
      {booted && (
        <>
          <div className="fixed top-3 left-3 w-10 h-10 border-t-2 border-l-2 z-30 pointer-events-none" style={{ borderColor: `${theme.primary}99` }} />
          <div className="fixed top-3 right-3 w-10 h-10 border-t-2 border-r-2 z-30 pointer-events-none" style={{ borderColor: `${theme.primary}99` }} />
          <div className="fixed bottom-3 left-3 w-10 h-10 border-b-2 border-l-2 z-30 pointer-events-none" style={{ borderColor: `${theme.primary}99` }} />
          <div className="fixed bottom-3 right-3 w-10 h-10 border-b-2 border-r-2 z-30 pointer-events-none" style={{ borderColor: `${theme.primary}99` }} />
        </>
      )}

      <div className="relative z-10 flex h-screen">
        {/* SIDEBAR */}
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{
            width: booted ? (sidebarOpen ? 280 : 60) : 0,
            opacity: booted ? 1 : 0,
          }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="border-r backdrop-blur-xl bg-slate-950/60 flex flex-col overflow-hidden transition-colors duration-700 shrink-0"
          style={{ borderColor: `${theme.primary}33` }}
        >
          <div className="p-4 flex items-center justify-between shrink-0 border-b" style={{ borderColor: `${theme.primary}22` }}>
            {sidebarOpen ? (
              <div className="flex items-center gap-3 min-w-0">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 rounded-full border-2 relative shrink-0"
                  style={{ borderColor: theme.primary, borderTopColor: "transparent" }}
                >
                  <div className="absolute inset-1 rounded-full border" style={{ borderColor: `${theme.primary}66`, borderBottomColor: "transparent" }} />
                </motion.div>
                <div className="min-w-0">
                  <div className="font-orbitron text-xs tracking-[0.2em] truncate" style={{ color: theme.primary }}>
                    {theme.name}
                  </div>
                  <div className="text-[8px] font-mono text-slate-500 tracking-widest">
                    v2.0.4
                  </div>
                </div>
              </div>
            ) : (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 rounded-full border-2 mx-auto"
                style={{ borderColor: theme.primary, borderTopColor: "transparent" }}
              />
            )}
            <button
              onMouseEnter={() => SFX.hover()}
              onClick={() => {
                SFX.buttonPress();
                setSidebarOpen((v) => !v);
              }}
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
                className="w-full py-2.5 rounded-lg font-orbitron text-[10px] tracking-[0.2em] text-slate-950 font-bold transition-all relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`,
                  boxShadow: `0 0 20px ${theme.glow}`,
                }}
              >
                <span className="relative z-10">+ NOVA CONVERSA</span>
              </motion.button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {sidebarOpen ? (
              threads.length === 0 ? (
                <div className="text-center py-8 px-3">
                  <div className="text-[9px] font-mono tracking-[0.3em] text-slate-600 mb-2">
                    NENHUMA CONVERSA
                  </div>
                  <div className="text-[10px] text-slate-500 leading-relaxed">
                    Comece uma nova conversa acima
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {threads.map((t, i) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.03 }}
                      onMouseEnter={() => SFX.hover()}
                      onClick={() => {
                        SFX.click();
                        navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
                      }}
                      className="group relative flex items-center justify-between p-2.5 rounded-lg cursor-pointer hover:bg-white/5 transition-all border border-transparent"
                      onMouseOver={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = `${theme.primary}55`;
                      }}
                      onMouseOut={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: theme.primary, boxShadow: `0 0 6px ${theme.primary}` }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] text-slate-200 truncate">
                            {t.title}
                          </div>
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
                {threads.slice(0, 8).map((t) => (
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
            <div className="p-3 border-t shrink-0" style={{ borderColor: `${theme.primary}22` }}>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border"
                  style={{ borderColor: `${theme.primary}55`, color: theme.primary }}
                >
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-slate-300 truncate">
                    {user.email.split("@")[0]}
                  </div>
                  <div className="text-[8px] font-mono text-emerald-400 tracking-widest flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    ONLINE
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onMouseEnter={() => SFX.hover()}
                  onClick={() => {
                    SFX.buttonPress();
                    navigate({ to: "/configuraciones" });
                  }}
                  className="flex-1 py-1.5 rounded border text-[9px] font-mono tracking-widest transition-all hover:bg-white/5"
                  style={{ borderColor: `${theme.primary}44`, color: theme.primary }}
                >
                  ⚙ CONFIG
                </button>
                <button
                  onMouseEnter={() => SFX.hover()}
                  onClick={() => {
                    SFX.buttonPress();
                    supabase.auth.signOut();
                  }}
                  className="flex-1 py-1.5 rounded border text-[9px] font-mono tracking-widest transition-all hover:bg-red-500/10 border-red-500/30 text-red-300"
                >
                  SAIR
                </button>
              </div>
            </div>
          )}
        </motion.aside>

        {/* MAIN */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {/* TOP BAR */}
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: booted ? 0 : -30, opacity: booted ? 1 : 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex items-center justify-between p-4 border-b backdrop-blur-xl shrink-0"
            style={{ borderColor: `${theme.primary}22` }}
          >
            <div className="flex items-center gap-4 text-[10px] font-mono tracking-widest">
              <div className="flex items-center gap-2" style={{ color: theme.primary }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: theme.primary, boxShadow: `0 0 8px ${theme.primary}` }} />
                SISTEMA ONLINE
              </div>
              <span className="text-slate-600 hidden md:inline">·</span>
              <span className="text-slate-500 hidden md:inline">{time.toLocaleTimeString("pt-BR")}</span>
              <span className="text-slate-600 hidden md:inline">·</span>
              <span className="text-slate-500 hidden md:inline">
                {time.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {[
                { label: "CPU", value: 43, color: theme.primary },
                { label: "MEM", value: 67, color: theme.accent },
                { label: "PWR", value: 98, color: "#10b981" },
              ].map((m) => (
                <div key={m.label} className="flex items-center gap-2 px-2.5 py-1 rounded border text-[9px] font-mono tracking-widest" style={{ borderColor: `${m.color}33`, color: m.color }}>
                  <span>{m.label}</span>
                  <div className="w-12 h-1 bg-slate-900 rounded overflow-hidden">
                    <motion.div
                      className="h-full"
                      style={{ background: m.color, boxShadow: `0 0 6px ${m.color}` }}
                      animate={{ width: `${m.value}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                  <span className="tabular-nums">{m.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* HERO */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 relative overflow-y-auto py-8">
            {/* Helmet + anéis */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {[1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      width: `${280 + i * 100}px`,
                      height: `${280 + i * 100}px`,
                      border: `1px solid ${theme.primary}${i === 1 ? "33" : "1a"}`,
                    }}
                    animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                    transition={{ duration: 30 + i * 15, repeat: Infinity, ease: "linear" }}
                  >
                    <div
                      className="absolute w-1 h-1 rounded-full"
                      style={{
                        top: "50%",
                        left: i % 2 === 0 ? "-2px" : "calc(100% - 2px)",
                        background: theme.primary,
                        boxShadow: `0 0 8px ${theme.primary}`,
                      }}
                    />
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.6, y: 30 }}
                animate={{ opacity: booted ? 1 : 0, scale: 0.85, y: 0 }}
                transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                <IronManHelmet state="idle" />
              </motion.div>
            </div>

            {/* ✅ TÍTULO COM SVG (correção definitiva do gradiente) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : 20 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="text-center mt-4 mb-6 w-full"
            >
              <div
                className="text-[10px] tracking-[0.5em] font-mono mb-3"
                style={{ color: `${theme.primary}99` }}
              >
                ▸ BEM-VINDO DE VOLTA, SENHOR
              </div>

              {/* TÍTULO SVG — NUNCA BUGARÁ */}
              <div className="flex justify-center px-4">
                <svg
                  viewBox="0 0 900 100"
                  className="w-full max-w-3xl"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <defs>
                    <linearGradient id="homeTitleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={theme.primary} />
                      <stop offset="50%" stopColor={theme.accent} />
                      <stop offset="100%" stopColor={theme.primary} />
                      <animate
                        attributeName="x1"
                        values="0%;-100%;0%"
                        dur="4s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="x2"
                        values="100%;0%;100%"
                        dur="4s"
                        repeatCount="indefinite"
                      />
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
                    x="450"
                    y="55"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="Orbitron, sans-serif"
                    fontSize="56"
                    fontWeight="700"
                    letterSpacing="2"
                    textLength="860"
                    lengthAdjust="spacingAndGlyphs"
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
                  boxShadow: focused
                    ? `0 0 50px ${theme.glow}, inset 0 0 20px ${theme.bg}`
                    : `0 0 30px ${theme.glow}`,
                }}
              >
                <div
                  className="pl-3 text-lg"
                  style={{ color: theme.primary }}
                >
                  ▸
                </div>
                <input
                  ref={inputRef}
                  value={quickCommand}
                  onChange={(e) => setQuickCommand(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleQuickSend()}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="Digite um comando para começar…"
                  className="flex-1 bg-transparent px-2 py-3 outline-none text-slate-100 placeholder:text-slate-500 font-mono text-sm"
                  autoFocus
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onMouseEnter={() => SFX.hover()}
                  onClick={handleQuickSend}
                  disabled={!quickCommand.trim()}
                  className="px-5 py-3 rounded-xl font-orbitron text-[10px] tracking-[0.2em] text-slate-950 font-bold transition-all disabled:opacity-30"
                  style={{
                    background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`,
                    boxShadow: `0 0 20px ${theme.glow}`,
                  }}
                >
                  ENVIAR ▸
                </motion.button>
              </div>
              <div className="text-[9px] font-mono tracking-widest text-slate-600 mt-2 text-center">
                ENTER para enviar · Cria nova conversa
              </div>
            </motion.div>

            {/* QUICK ACTIONS */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : 20 }}
              transition={{ duration: 0.8, delay: 1.4 }}
              className="w-full max-w-3xl grid grid-cols-2 md:grid-cols-3 gap-2 mb-6"
            >
              {quickActions.map((a) => (
                <motion.button
                  key={a.label}
                  whileHover={{ y: -2, borderColor: theme.primary }}
                  whileTap={{ scale: 0.98 }}
                  onMouseEnter={() => SFX.hover()}
                  onClick={() => {
                    SFX.click();
                    setQuickCommand(a.prompt);
                    inputRef.current?.focus();
                  }}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border backdrop-blur-sm bg-slate-950/40 transition-all text-left"
                  style={{ borderColor: `${theme.primary}22` }}
                >
                  <span className="text-lg">{a.icon}</span>
                  <span className="text-[11px] text-slate-300 tracking-wide">{a.label}</span>
                </motion.button>
              ))}
            </motion.div>

            {/* STATS */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: booted ? 1 : 0 }}
              transition={{ duration: 0.8, delay: 1.6 }}
              className="flex items-center gap-6 text-[10px] font-mono tracking-widest text-slate-500 mb-8 flex-wrap justify-center"
            >
              <div className="flex items-center gap-2">
                <span style={{ color: theme.primary }}>◈</span>
                <span>{threads.length} conversas</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: theme.primary }}>◆</span>
                <span>v2.0.4</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Online</span>
              </div>
            </motion.div>
          </div>

          {/* FOOTER */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: booted ? 1 : 0 }}
            transition={{ delay: 1.8 }}
            className="p-3 border-t backdrop-blur-xl flex items-center justify-between text-[9px] font-mono tracking-[0.3em] shrink-0"
            style={{ borderColor: `${theme.primary}22`, color: `${theme.primary}66` }}
          >
            <span>▸ {theme.name}</span>
            <span className="hidden md:inline">STARK INDUSTRIES · FAN PROJECT</span>
            <span>SYS v2.0.4</span>
          </motion.div>
        </main>
      </div>

      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}