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
  lastMessage?: string;
};

const BOOT_LINES = [
  "> NÚCLEO NEURAL: ONLINE",
  "> INTERFACE HOLOGRÁFICA: CALIBRADA",
  "> LINK STARK INDUSTRIES: ESTABELECIDO",
  "> PROTOCOLO: ATIVO",
  "> BEM-VINDO DE VOLTA, SENHOR.",
];

const LOG_LINES = [
  "▸ AUTH_HANDSHAKE OK",
  "▸ ENCRYPTING CHANNEL AES-256",
  "▸ SYNCING NEURAL PATTERNS",
  "▸ STARK_DB CONNECTED",
  "▸ THREAT SCAN: CLEAR",
  "▸ SATELLITE LINK: STABLE",
  "▸ POWER CORE: 98.4%",
  "▸ ALL SYSTEMS NOMINAL",
];

export function HomePage() {
  const { user } = useJarvis();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [booted, setBooted] = useState(false);
  const [bootLine, setBootLine] = useState(0);
  const [time, setTime] = useState(new Date());
  const [logIndex, setLogIndex] = useState(0);
  const [persona, setPersona] = useState<Persona>("jarvis");

  const theme = THEMES[persona];

  // Carrega persona salva + aplica tema
  useEffect(() => {
    const saved = loadPersona();
    setPersona(saved);
    applyTheme(saved);
  }, []);

  // Boot sequence
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i++;
      if (i >= BOOT_LINES.length) {
        clearInterval(t);
        setTimeout(() => setBooted(true), 300);
      } else setBootLine(i);
    }, 350);
    return () => clearInterval(t);
  }, []);

  // Relógio
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Log rolando
  useEffect(() => {
    const t = setInterval(() => setLogIndex((i) => (i + 1) % LOG_LINES.length), 1800);
    return () => clearInterval(t);
  }, []);

  // Carrega threads
  useEffect(() => {
    (async () => {
      const { data: threadsData } = await supabase
        .from("threads")
        .select("*")
        .order("updated_at", { ascending: false });

      if (!threadsData) return;

      const withLast: Thread[] = await Promise.all(
        threadsData.map(async (t) => {
          const { data: msgs } = await supabase
            .from("messages")
            .select("content")
            .eq("thread_id", t.id)
            .order("created_at", { ascending: false })
            .limit(1);
          return {
            ...t,
            lastMessage: msgs?.[0]?.content?.slice(0, 80) ?? "",
          };
        })
      );
      setThreads(withLast);
    })();
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
      {/* CAMADA 1: Grid floor 3D */}
      <GridFloor color={theme.primary} />

      {/* CAMADA 2: Data streams */}
      <DataStreams color={theme.primary} />

      {/* CAMADA 3: Scanline */}
      <div className="scanline" />

      {/* CAMADA 4: Cursor trail */}
      <MouseTrail />

      {/* CAMADA 5: Hex grid */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-[1] opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill='none' stroke='${encodeURIComponent(theme.primary)}' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }}
        animate={{ backgroundPosition: ["0px 0px", "60px 60px"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      {/* CAMADA 6: Vinheta */}
      <div
        className="fixed inset-0 pointer-events-none z-[2]"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.8) 100%)",
        }}
      />

      {/* CAMADA 7: Noise */}
      <div
        className="fixed inset-0 pointer-events-none z-[3] opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          animation: "noiseShift 0.4s steps(3) infinite",
        }}
      />

      {/* Aura central */}
      <motion.div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none z-[4] transition-colors duration-700"
        style={{
          width: "100vmin",
          height: "100vmin",
          background: `radial-gradient(circle, ${theme.bg} 0%, transparent 60%)`,
          filter: "blur(60px)",
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* BOOT SEQUENCE */}
      <AnimatePresence>
        {!booted && (
          <motion.div
            key="boot"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[500] bg-slate-950 flex items-center justify-center"
          >
            <div className="max-w-2xl w-full px-8">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
              >
                <div
                  className="font-orbitron text-5xl md:text-7xl tracking-[0.3em]"
                  style={{
                    color: theme.primary,
                    textShadow: `0 0 20px ${theme.primary}, 0 0 40px ${theme.primary}, 0 0 60px ${theme.glow}, 0 0 100px ${theme.glow}`,
                  }}
                >
                  {theme.name}
                </div>
                <div className="text-[10px] md:text-xs text-slate-400 tracking-[0.6em] mt-4 font-mono">
                  {theme.tagline.toUpperCase()}
                </div>
              </motion.div>

              <div className="font-mono text-xs md:text-sm space-y-2 min-h-[160px] mb-6">
                {BOOT_LINES.slice(0, bootLine + 1).map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2"
                    style={{ color: theme.primary }}
                  >
                    <span>{line}</span>
                    {i === bootLine && (
                      <span className="inline-block w-2 h-4 animate-pulse" style={{ background: theme.primary }} />
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="w-full h-1 bg-slate-900 rounded overflow-hidden">
                <motion.div
                  className="h-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((bootLine + 1) / BOOT_LINES.length) * 100}%` }}
                  style={{
                    background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})`,
                    boxShadow: `0 0 20px ${theme.primary}`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2">
                <span>CARREGANDO</span>
                <span>{Math.round(((bootLine + 1) / BOOT_LINES.length) * 100)}%</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="relative z-10">
        {/* HUD ESQUERDO */}
        {booted && (
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="fixed left-6 top-28 space-y-3 z-20 hidden lg:block"
          >
            <StatusBar label="CPU" color={theme.primary} />
            <StatusBar label="MEM" color={theme.accent} />
            <StatusBar label="NET" color={theme.primary} />
            <StatusBar label="PWR" color="#10b981" />

            <div className="w-40 mt-4">
              <div className="text-[9px] font-mono tracking-widest mb-1" style={{ color: theme.primary }}>
                ▸ ACTIVITY
              </div>
              <CpuGraph color={theme.primary} />
            </div>
          </motion.div>
        )}

        {/* HUD DIREITO */}
        {booted && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="fixed right-6 top-28 space-y-4 z-20 hidden lg:block"
          >
            <Radar color={theme.primary} />

            <div
              className="w-48 h-32 border rounded p-2 bg-slate-950/60 backdrop-blur-sm"
              style={{ borderColor: `${theme.primary}33` }}
            >
              <div
                className="text-[8px] font-mono tracking-widest border-b pb-1 mb-1"
                style={{ color: theme.primary, borderColor: `${theme.primary}33` }}
              >
                ▸ TERMINAL
              </div>
              <div className="space-y-0.5">
                {LOG_LINES.slice(Math.max(0, logIndex - 4), logIndex + 1).map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-[8px] font-mono truncate"
                    style={{ color: `${theme.primary}aa` }}
                  >
                    {line}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Cantos HUD */}
        {booted && (
          <>
            <div className="fixed top-3 left-3 w-10 h-10 border-t-2 border-l-2 z-30 pointer-events-none" style={{ borderColor: `${theme.primary}99` }} />
            <div className="fixed top-3 right-3 w-10 h-10 border-t-2 border-r-2 z-30 pointer-events-none" style={{ borderColor: `${theme.primary}99` }} />
            <div className="fixed bottom-3 left-3 w-10 h-10 border-b-2 border-l-2 z-30 pointer-events-none" style={{ borderColor: `${theme.primary}99` }} />
            <div className="fixed bottom-3 right-3 w-10 h-10 border-b-2 border-r-2 z-30 pointer-events-none" style={{ borderColor: `${theme.primary}99` }} />
          </>
        )}

        {/* Texto vertical */}
        <div
          className="fixed left-1 top-1/2 -translate-y-1/2 z-20 hidden lg:block pointer-events-none"
          style={{ writingMode: "vertical-rl" }}
        >
          <div className="font-mono text-[8px] tracking-[0.5em] code-pulse" style={{ color: `${theme.primary}66` }}>
            ▸ {theme.name} v2.0.4 · STARK INDUSTRIES · AES-256
          </div>
        </div>
        <div
          className="fixed right-1 top-1/2 z-20 hidden lg:block pointer-events-none"
          style={{ writingMode: "vertical-rl", transform: "translateY(-50%) rotate(180deg)" }}
        >
          <div className="font-mono text-[8px] tracking-[0.5em] code-pulse" style={{ color: `${theme.primary}66` }}>
            ▸ SECTOR 7G · CLEARANCE: TOP SECRET · MALIBU 90265
          </div>
        </div>

        {/* HEADER */}
        <motion.header
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: booted ? 0 : -80, opacity: booted ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative p-5 border-b backdrop-blur-xl bg-slate-950/40 transition-colors duration-700"
          style={{ borderColor: `${theme.primary}33` }}
        >
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-9 h-9 rounded-full border-2 border-t-transparent relative transition-colors duration-700"
                style={{ borderColor: theme.primary, borderTopColor: "transparent" }}
              >
                <div
                  className="absolute inset-1 rounded-full border border-b-transparent"
                  style={{ borderColor: `${theme.primary}66`, borderBottomColor: "transparent" }}
                />
              </motion.div>
              <div>
                <motion.h1
                  className="font-orbitron text-xl md:text-2xl tracking-[0.3em] transition-colors duration-700"
                  style={{ color: theme.primary, textShadow: `0 0 20px ${theme.primary}` }}
                >
                  {theme.name}
                </motion.h1>
                <div className="text-[8px] font-mono tracking-[0.4em] transition-colors duration-700" style={{ color: `${theme.primary}88` }}>
                  SISTEMA OPERACIONAL v2.0.4
                </div>
              </div>
            </div>

            <div className="flex gap-3 items-center text-xs font-mono flex-wrap">
              <div
                className="hidden lg:flex items-center gap-2 text-slate-400 px-3 py-1.5 rounded border bg-slate-950/50 transition-colors duration-700"
                style={{ borderColor: `${theme.primary}33` }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
                <span className="text-emerald-300">{user.email}</span>
              </div>
              <div className="hidden md:block tabular-nums font-mono text-xs transition-colors duration-700" style={{ color: `${theme.primary}99` }}>
                {time.toLocaleTimeString("pt-BR")}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate({ to: "/configuraciones" })}
                className="px-3 py-1.5 rounded border transition-colors duration-700"
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

        {/* TÍTULO */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : 30 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="relative pt-12 pb-4 text-center"
        >
          <div className="text-[10px] tracking-[0.6em] font-mono mb-4 transition-colors duration-700" style={{ color: `${theme.primary}99` }}>
            ▸ SISTEMA ONLINE · AGUARDANDO COMANDO
          </div>
          <h2
            className="font-orbitron text-4xl md:text-6xl lg:text-7xl tracking-[0.15em] leading-tight"
            style={{
              background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent}, ${theme.primary})`,
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "gradientShift 4s ease infinite",
              filter: `drop-shadow(0 0 40px ${theme.glow})`,
            }}
          >
            BEM-VINDO DE VOLTA
          </h2>
          <div className="text-sm md:text-base text-slate-400 mt-4 tracking-[0.3em] font-mono">
            COMO POSSO AJUDAR, SENHOR?
          </div>
        </motion.div>

        {/* CAPACETE */}
        <div className="relative py-4 z-10">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full transition-colors duration-700"
                style={{
                  width: `${320 + i * 140}px`,
                  height: `${320 + i * 140}px`,
                  border: `1px solid ${theme.primary}${Math.floor((0.08 + 0.02 * (6 - i)) * 255).toString(16).padStart(2, "0")}`,
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
            transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <IronManHelmet state="idle" />
          </motion.div>
        </div>

        {/* CARDS */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : 30 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="max-w-6xl mx-auto px-6 relative z-10 mb-16"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="HORA LOCAL"
              value={time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              color={theme.primary}
              icon="◷"
            />
            <StatCard
              label="OPERADOR"
              value={user.email.split("@")[0]}
              color={theme.accent}
              icon="◉"
            />
            <StatCard label="CONVERSAS" value={threads.length} color={theme.primary} icon="◈" />
            <StatCard label="STATUS" value="ONLINE" color="#10b981" icon="●" pulse />
          </div>
        </motion.div>

        {/* LISTA DE CONVERSAS */}
        <motion.main
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : 30 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="max-w-6xl mx-auto px-6 pb-32 relative z-10"
        >
          <div className="flex justify-between items-end mb-8 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 rounded-full transition-colors duration-700"
                  style={{ background: theme.primary, boxShadow: `0 0 12px ${theme.primary}` }}
                />
                <h2
                  className="font-orbitron text-sm tracking-[0.5em] transition-colors duration-700"
                  style={{ color: `${theme.primary}cc`, textShadow: `0 0 10px ${theme.primary}` }}
                >
                  HISTÓRICO DE CONVERSAS
                </h2>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-2 ml-5 tracking-widest">
                {threads.length} {threads.length === 1 ? "REGISTRO" : "REGISTROS"} NO BANCO DE DADOS
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={newThread}
              className="px-7 py-3 rounded-lg font-orbitron text-xs tracking-[0.25em] text-slate-950 font-bold relative overflow-hidden transition-all duration-700"
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
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative text-center py-20 border border-dashed rounded-2xl backdrop-blur-sm bg-slate-950/30 transition-colors duration-700"
              style={{ borderColor: `${theme.primary}33` }}
            >
              <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 transition-colors duration-700" style={{ borderColor: `${theme.primary}66` }} />
              <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 transition-colors duration-700" style={{ borderColor: `${theme.primary}66` }} />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 transition-colors duration-700" style={{ borderColor: `${theme.primary}66` }} />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 transition-colors duration-700" style={{ borderColor: `${theme.primary}66` }} />
              <motion.div
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="font-orbitron tracking-[0.4em] text-sm mb-3 transition-colors duration-700"
                style={{ color: `${theme.primary}99` }}
              >
                NENHUMA CONVERSA REGISTRADA
              </motion.div>
              <div className="text-slate-500 text-sm tracking-wider">
                Inicie uma nova conversa, senhor.
              </div>
            </motion.div>
          ) : (
            <ul className="space-y-3">
              {threads.map((t, i) => (
                <motion.li
                  key={t.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05, duration: 0.5 }}
                  whileHover={{ x: 8, transition: { duration: 0.2 } }}
                  onClick={() =>
                    navigate({ to: "/chat/$threadId", params: { threadId: t.id } })
                  }
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
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 opacity-0 group-hover:opacity-100 transition-all" style={{ borderColor: theme.primary }} />
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 opacity-0 group-hover:opacity-100 transition-all" style={{ borderColor: theme.primary }} />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 opacity-0 group-hover:opacity-100 transition-all" style={{ borderColor: theme.primary }} />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 opacity-0 group-hover:opacity-100 transition-all" style={{ borderColor: theme.primary }} />

                  <div
                    className="absolute left-0 top-0 bottom-0 w-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: `linear-gradient(180deg, transparent, ${theme.primary}, transparent)` }}
                  />

                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{ background: `radial-gradient(circle at 0% 50%, ${theme.bg}, transparent 60%)` }}
                  />

                  <div className="flex items-start gap-4 flex-1 min-w-0 relative z-10">
                    <div className="mt-1 flex flex-col items-center gap-1.5 shrink-0">
                      <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                        className="w-2 h-2 rounded-full transition-colors duration-700"
                        style={{ background: theme.primary, boxShadow: `0 0 10px ${theme.primary}` }}
                      />
                      <div className="w-px h-6 transition-colors duration-700" style={{ background: `linear-gradient(180deg, ${theme.primary}66, transparent)` }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-100 truncate text-base group-hover:text-white transition">
                        {t.title}
                      </div>
                      {t.lastMessage && (
                        <div className="text-xs text-slate-500 mt-1.5 truncate font-mono">
                          ▸ {t.lastMessage}...
                        </div>
                      )}
                      <div className="text-[10px] text-slate-600 font-mono mt-2 tracking-widest flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full" style={{ background: `${theme.primary}88` }} />
                        {new Date(t.updated_at).toLocaleString("pt-BR")}
                      </div>
                    </div>
                  </div>

                  <motion.button
                    onClick={(e) => remove(t.id, e)}
                    whileHover={{ scale: 1.2, rotate: 90 }}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition p-2 shrink-0 relative z-10"
                  >
                    ✕
                  </motion.button>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.main>

        {/* FOOTER */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: booted ? 1 : 0 }}
          transition={{ delay: 1.5 }}
          className="relative z-10 text-center py-8 text-[10px] font-mono tracking-[0.4em] flex items-center justify-center gap-4 flex-wrap transition-colors duration-700"
          style={{ color: `${theme.primary}55` }}
        >
          <span>▸ {theme.name} v2.0.4</span>
          <span style={{ color: `${theme.primary}33` }}>·</span>
          <span>STARK INDUSTRIES</span>
          <span style={{ color: `${theme.primary}33` }}>·</span>
          <span>FAN PROJECT</span>
        </motion.footer>
      </div>

      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes noiseShift {
          0% { transform: translate(0, 0); }
          33% { transform: translate(-2px, 1px); }
          66% { transform: translate(1px, -1px); }
          100% { transform: translate(0, 0); }
        }
      `}</style>
    </div>
  );
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

function GridFloor({ color }: { color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorRef = useRef(color);

  useEffect(() => {
    colorRef.current = color;
  }, [color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let offset = 0;

    const draw = () => {
      ctx.fillStyle = "rgba(2, 6, 23, 0.2)";
      ctx.fillRect(0, 0, width, height);

      const horizon = height * 0.7;
      const gridSize = 60;
      const lines = 30;

      // Converte hex pra rgb
      const r = parseInt(colorRef.current.slice(1, 3), 16);
      const g = parseInt(colorRef.current.slice(3, 5), 16);
      const b = parseInt(colorRef.current.slice(5, 7), 16);

      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.15)`;
      ctx.lineWidth = 1;

      for (let i = 0; i < lines; i++) {
        const t = i / lines;
        const y = horizon + (height - horizon) * t ** 2;
        const adjustedY = (y + offset) % height;
        ctx.globalAlpha = Math.min(1, (adjustedY - horizon) / (height - horizon));
        ctx.beginPath();
        ctx.moveTo(0, adjustedY);
        ctx.lineTo(width, adjustedY);
        ctx.stroke();
      }

      ctx.globalAlpha = 0.4;
      const centerX = width / 2;
      for (let i = -20; i <= 20; i++) {
        const xTop = centerX + i * 20;
        const xBottom = centerX + i * gridSize * 2;
        ctx.beginPath();
        ctx.moveTo(xTop, horizon);
        ctx.lineTo(xBottom, height);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      offset += 0.5;
      if (offset > height) offset = 0;

      requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.5 }}
    />
  );
}

function DataStreams({ color }: { color: string }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-[2] overflow-hidden">
      {[5, 15, 85, 95].map((x, i) => (
        <motion.div
          key={i}
          className="absolute top-0 bottom-0 w-px"
          style={{
            left: `${x}%`,
            background: `linear-gradient(180deg, transparent, ${color}66, transparent)`,
          }}
          animate={{ y: ["-100%", "100%"] }}
          transition={{ duration: 8 + i * 3, repeat: Infinity, ease: "linear", delay: i * 1.5 }}
        />
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
  pulse,
}: {
  label: string;
  value: string | number;
  color: string;
  icon?: string;
  pulse?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.4 }}
      className="relative p-4 rounded-lg border backdrop-blur-md overflow-hidden group"
      style={{
        borderColor: `${color}66`,
        background: "rgba(2, 6, 23, 0.6)",
        boxShadow: `0 0 25px ${color}33`,
      }}
    >
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: color }} />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: color }} />

      <motion.div
        className="absolute top-0 left-0 h-px"
        style={{ background: color, boxShadow: `0 0 10px ${color}` }}
        animate={{ width: ["0%", "100%", "0%"], left: ["0%", "0%", "100%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[9px] tracking-[0.3em] font-mono" style={{ color }}>
          {label}
        </div>
        {icon && (
          <div className="text-[10px] opacity-40" style={{ color }}>
            {icon}
          </div>
        )}
      </div>
      <div
        className="font-orbitron text-base md:text-lg truncate"
        style={{ color, textShadow: `0 0 10px ${color}80` }}
      >
        {value}
      </div>
      {pulse && (
        <motion.div
          className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

function StatusBar({ label, color }: { label: string; color: string }) {
  const [value, setValue] = useState(20 + Math.random() * 60);
  useEffect(() => {
    const i = setInterval(() => {
      setValue((v) => Math.max(15, Math.min(95, v + (Math.random() - 0.5) * 8)));
    }, 1500);
    return () => clearInterval(i);
  }, []);
  return (
    <div className="w-32">
      <div className="flex justify-between text-[9px] font-mono tracking-widest" style={{ color }}>
        <span>{label}</span>
        <span>{value.toFixed(0)}%</span>
      </div>
      <div className="h-1 bg-slate-900 rounded-sm mt-0.5 overflow-hidden">
        <motion.div
          className="h-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
    </div>
  );
}

function CpuGraph({ color }: { color: string }) {
  const [points, setPoints] = useState<number[]>(Array(30).fill(20));

  useEffect(() => {
    const i = setInterval(() => {
      setPoints((p) => [...p.slice(1), 20 + Math.random() * 70]);
    }, 500);
    return () => clearInterval(i);
  }, []);

  const path = points
    .map((y, i) => {
      const x = (i / (points.length - 1)) * 160;
      return `${i === 0 ? "M" : "L"} ${x} ${40 - (y / 100) * 40}`;
    })
    .join(" ");

  return (
    <svg width="160" height="40" className="overflow-visible">
      <defs>
        <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L 160 40 L 0 40 Z`} fill="url(#cpuGrad)" />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  );
}

function Radar({ color }: { color: string }) {
  const [blips] = useState(() =>
    Array.from({ length: 4 }, () => ({
      angle: Math.random() * Math.PI * 2,
      distance: 0.3 + Math.random() * 0.6,
      delay: Math.random() * 3,
    }))
  );

  return (
    <div className="w-32 h-32 relative">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="absolute rounded-full border"
          style={{ inset: `${(5 - i) * 4}px`, borderColor: `${color}40` }}
        />
      ))}

      <div className="absolute top-1/2 left-0 right-0 h-px" style={{ background: `${color}26` }} />
      <div className="absolute left-1/2 top-0 bottom-0 w-px" style={{ background: `${color}26` }} />

      {blips.map((b, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400"
          style={{
            left: `calc(50% + ${Math.cos(b.angle) * b.distance * 50}px)`,
            top: `calc(50% + ${Math.sin(b.angle) * b.distance * 50}px)`,
            boxShadow: "0 0 8px #10b981",
          }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, delay: b.delay }}
        />
      ))}

      <div className="radar-sweep absolute inset-0">
        <div
          className="absolute top-1/2 left-1/2 w-16 h-px origin-left"
          style={{
            background: `linear-gradient(90deg, ${color}, transparent)`,
            transform: "translateY(-50%)",
          }}
        />
      </div>

      <div
        className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: color, boxShadow: `0 0 10px ${color}` }}
      />
    </div>
  );
}