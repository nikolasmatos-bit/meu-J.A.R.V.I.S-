import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useJarvis } from "../components/jarvis/Bootstrap";
import { IronManHelmet } from "../components/jarvis/IronManHelmet";
import { MouseTrail } from "../components/jarvis/MouseTrail";
import { SFX } from "../lib/sfx";
import { THEMES, applyTheme, loadPersona, type Persona } from "../lib/theme";

export function HomePage() {
  const { user } = useJarvis();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<any[]>([]);
  const [booted, setBooted] = useState(false);
  const [time, setTime] = useState(new Date());
  const [persona, setPersona] = useState<Persona>("jarvis");

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
      .select("*")
      .order("updated_at", { ascending: false })
      .then(({ data }) => setThreads(data ?? []));
  }, []);

  const newThread = async () => {
    SFX.reactorEngage();
    const { data, error } = await supabase
      .from("threads")
      .insert({ user_id: user.id, title: "Nova conversa" })
      .select()
      .single();
    if (error) return alert(error.message);
    navigate({ to: "/chat/$threadId", params: { threadId: data.id } });
  };

  const remove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Apagar esta conversa?")) return;
    await supabase.from("threads").delete().eq("id", id);
    setThreads((t) => t.filter((x) => x.id !== id));
    SFX.error();
  };

  return (
    <div className="min-h-screen text-slate-100 relative overflow-hidden bg-slate-950">
      <div className="scanline" />
      <MouseTrail />

      {/* Grid de fundo */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(${theme.primary}22 1px, transparent 1px), linear-gradient(90deg, ${theme.primary}22 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Aura central */}
      <motion.div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-colors duration-700"
        style={{
          width: "100vmin",
          height: "100vmin",
          background: `radial-gradient(circle, ${theme.bg} 0%, transparent 60%)`,
          filter: "blur(60px)",
          zIndex: 1,
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Boot */}
      <AnimatePresence>
        {!booted && (
          <motion.div
            key="boot"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
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
          <div
            className="fixed top-3 left-3 w-10 h-10 border-t-2 border-l-2 z-30 pointer-events-none"
            style={{ borderColor: `${theme.primary}99` }}
          />
          <div
            className="fixed top-3 right-3 w-10 h-10 border-t-2 border-r-2 z-30 pointer-events-none"
            style={{ borderColor: `${theme.primary}99` }}
          />
          <div
            className="fixed bottom-3 left-3 w-10 h-10 border-b-2 border-l-2 z-30 pointer-events-none"
            style={{ borderColor: `${theme.primary}99` }}
          />
          <div
            className="fixed bottom-3 right-3 w-10 h-10 border-b-2 border-r-2 z-30 pointer-events-none"
            style={{ borderColor: `${theme.primary}99` }}
          />
        </>
      )}

      <div className="relative z-10">
        {/* Header */}
        <motion.header
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: booted ? 0 : -80, opacity: booted ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="p-5 border-b backdrop-blur-xl bg-slate-950/40 transition-colors duration-700"
          style={{ borderColor: `${theme.primary}33` }}
        >
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-9 h-9 rounded-full border-2 relative"
                style={{ borderColor: theme.primary, borderTopColor: "transparent" }}
              >
                <div
                  className="absolute inset-1 rounded-full border"
                  style={{ borderColor: `${theme.primary}66`, borderBottomColor: "transparent" }}
                />
              </motion.div>
              <div>
                <h1
                  className="font-orbitron text-xl md:text-2xl tracking-[0.3em]"
                  style={{ color: theme.primary, textShadow: `0 0 20px ${theme.primary}` }}
                >
                  {theme.name}
                </h1>
                <div
                  className="text-[8px] font-mono tracking-[0.4em]"
                  style={{ color: `${theme.primary}88` }}
                >
                  SISTEMA v2.0.4
                </div>
              </div>
            </div>
            <div className="flex gap-3 items-center text-xs font-mono">
              <div
                className="hidden lg:flex items-center gap-2 text-slate-400 px-3 py-1.5 rounded border bg-slate-950/50"
                style={{ borderColor: `${theme.primary}33` }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
                <span className="text-emerald-300">{user.email}</span>
              </div>
              <div
                className="hidden md:block tabular-nums text-xs font-mono"
                style={{ color: `${theme.primary}99` }}
              >
                {time.toLocaleTimeString("pt-BR")}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate({ to: "/configuraciones" })}
                className="px-3 py-1.5 rounded border transition-colors"
                style={{ borderColor: `${theme.primary}55`, color: theme.primary }}
              >
                ⚙
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => supabase.auth.signOut()}
                className="px-3 py-1.5 rounded border border-red-500/30 text-red-300 hover:border-red-400 hover:bg-red-500/10 transition"
              >
                SAIR
              </motion.button>
            </div>
          </div>
        </motion.header>

        {/* Título */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : 30 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="pt-12 pb-4 text-center"
        >
          <div
            className="text-[10px] tracking-[0.6em] font-mono mb-4"
            style={{ color: `${theme.primary}99` }}
          >
            ▸ SISTEMA ONLINE · AGUARDANDO COMANDO
          </div>

          {/* TÍTULO SVG — CORRIGIDO E GARANTIDO */}
          <div className="flex justify-center px-4 w-full">
            <svg
              viewBox="0 0 1200 140"
              className="w-full max-w-5xl"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
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
                <filter id="titleGlow" x="-10%" y="-10%" width="120%" height="120%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <text
                x="600"
                y="75"
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="Orbitron, sans-serif"
                fontSize="72"
                fontWeight="700"
                letterSpacing="2"
                textLength="1120"
                lengthAdjust="spacingAndGlyphs"
                fill="url(#titleGrad)"
                filter="url(#titleGlow)"
              >
                BEM-VINDO DE VOLTA
              </text>
            </svg>
          </div>

          <div className="text-sm md:text-base text-slate-400 mt-4 tracking-[0.3em] font-mono">
            COMO POSSO AJUDAR, SENHOR?
          </div>
        </motion.div>

        {/* Capacete */}
        <div className="relative py-4 z-10">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full transition-colors duration-700"
                style={{
                  width: `${320 + i * 140}px`,
                  height: `${320 + i * 140}px`,
                  border: `1px solid ${theme.primary}20`,
                }}
                animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                transition={{ duration: 30 + i * 12, repeat: Infinity, ease: "linear" }}
              >
                <div
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{
                    top: "50%",
                    left: i % 2 === 0 ? "-3px" : "calc(100% - 3px)",
                    background: i % 3 === 0 ? theme.accent : theme.primary,
                    boxShadow: `0 0 12px ${i % 3 === 0 ? theme.accent : theme.primary}`,
                  }}
                />
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 40 }}
            animate={{ opacity: booted ? 1 : 0, scale: 1.1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.6 }}
            className="relative"
          >
            <IronManHelmet state="idle" />
          </motion.div>
        </div>

        {/* Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : 30 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="max-w-6xl mx-auto px-6 mb-16"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "HORA LOCAL",
                value: time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                color: theme.primary,
              },
              { label: "OPERADOR", value: user.email.split("@")[0], color: theme.accent },
              { label: "CONVERSAS", value: threads.length, color: theme.primary },
              { label: "STATUS", value: "ONLINE", color: "#10b981" },
            ].map((c) => (
              <motion.div
                key={c.label}
                whileHover={{ y: -4 }}
                className="relative p-4 rounded-lg border backdrop-blur-md"
                style={{
                  borderColor: `${c.color}66`,
                  background: "rgba(2, 6, 23, 0.6)",
                  boxShadow: `0 0 25px ${c.color}33`,
                }}
              >
                <div
                  className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2"
                  style={{ borderColor: c.color }}
                />
                <div
                  className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2"
                  style={{ borderColor: c.color }}
                />
                <div
                  className="text-[9px] tracking-[0.3em] font-mono mb-1.5"
                  style={{ color: c.color }}
                >
                  {c.label}
                </div>
                <div
                  className="font-orbitron text-base md:text-lg truncate"
                  style={{ color: c.color, textShadow: `0 0 10px ${c.color}80` }}
                >
                  {c.value}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Lista de conversas */}
        <motion.main
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : 30 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="max-w-6xl mx-auto px-6 pb-32"
        >
          <div className="flex justify-between items-end mb-8 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 rounded-full"
                  style={{ background: theme.primary, boxShadow: `0 0 12px ${theme.primary}` }}
                />
                <h2
                  className="font-orbitron text-sm tracking-[0.5em]"
                  style={{ color: `${theme.primary}cc`, textShadow: `0 0 10px ${theme.primary}` }}
                >
                  HISTÓRICO
                </h2>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-2 ml-5 tracking-widest">
                {threads.length} {threads.length === 1 ? "REGISTRO" : "REGISTROS"}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={newThread}
              className="px-7 py-3 rounded-lg font-orbitron text-xs tracking-[0.25em] text-slate-950 font-bold relative overflow-hidden transition-all"
              style={{
                background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`,
                boxShadow: `0 0 30px ${theme.glow}`,
              }}
            >
              <span className="relative z-10">+ NOVA CONVERSA</span>
              <motion.div
                className="absolute inset-0 bg-white/30"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
              />
            </motion.button>
          </div>

          {threads.length === 0 ? (
            <div
              className="relative text-center py-20 border border-dashed rounded-2xl backdrop-blur-sm bg-slate-950/30"
              style={{ borderColor: `${theme.primary}33` }}
            >
              <div
                className="font-orbitron tracking-[0.4em] text-sm mb-3"
                style={{ color: `${theme.primary}99` }}
              >
                NENHUMA CONVERSA REGISTRADA
              </div>
              <div className="text-slate-500 text-sm tracking-wider">
                Inicie uma nova conversa, senhor.
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {threads.map((t, i) => (
                <motion.li
                  key={t.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  whileHover={{ x: 8 }}
                  onClick={() => navigate({ to: "/chat/$threadId", params: { threadId: t.id } })}
                  className="group relative flex justify-between items-start p-5 border rounded-xl cursor-pointer bg-slate-950/50 backdrop-blur-md transition-all overflow-hidden"
                  style={{ borderColor: `${theme.primary}33` }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = `${theme.primary}99`;
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 0 30px ${theme.glow}`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = `${theme.primary}33`;
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  <div
                    className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 opacity-0 group-hover:opacity-100 transition-all"
                    style={{ borderColor: theme.primary }}
                  />
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 opacity-0 group-hover:opacity-100 transition-all"
                    style={{ borderColor: theme.primary }}
                  />
                  <div className="flex items-start gap-4 flex-1 min-w-0 relative z-10">
                    <div
                      className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                      style={{ background: theme.primary, boxShadow: `0 0 10px ${theme.primary}` }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-100 truncate">{t.title}</div>
                      <div className="text-[10px] text-slate-600 font-mono mt-2 tracking-widest">
                        {new Date(t.updated_at).toLocaleString("pt-BR")}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => remove(t.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition p-2 relative z-10"
                  >
                    ✕
                  </button>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.main>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: booted ? 1 : 0 }}
          transition={{ delay: 1.5 }}
          className="text-center py-8 text-[10px] font-mono tracking-[0.4em] flex items-center justify-center gap-4 flex-wrap"
          style={{ color: `${theme.primary}55` }}
        >
          <span>▸ {theme.name} v2.0.4</span>
          <span>·</span>
          <span>STARK INDUSTRIES</span>
          <span>·</span>
          <span>FAN PROJECT</span>
        </motion.footer>
      </div>
    </div>
  );
}