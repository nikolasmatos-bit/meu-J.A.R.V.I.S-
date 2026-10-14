import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useJarvis } from "../components/jarvis/Bootstrap";
import { IronManHelmet } from "../components/jarvis/IronManHelmet";
import { MouseTrail } from "../components/jarvis/MouseTrail";
import { SFX } from "../lib/sfx";

type Thread = {
  id: string;
  title: string;
  updated_at: string;
  lastMessage?: string;
};

const BOOT_LINES = [
  "> INICIALIZANDO NÚCLEO NEURAL...",
  "> CARREGANDO MÓDULOS DE MEMÓRIA...",
  "> ESTABELECENDO LINK COM STARK INDUSTRIES...",
  "> VERIFICANDO INTEGRIDADE DO SISTEMA...",
  "> CALIBRANDO INTERFACE HOLOGRÁFICA...",
  "> SISTEMA PRONTO.",
];

export function HomePage() {
  const { user } = useJarvis();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [booted, setBooted] = useState(false);
  const [bootLine, setBootLine] = useState(0);
  const [time, setTime] = useState(new Date());

  // Boot sequence
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i >= BOOT_LINES.length) {
        clearInterval(interval);
        setTimeout(() => setBooted(true), 400);
      } else {
        setBootLine(i);
      }
    }, 400);
    return () => clearInterval(interval);
  }, []);

  // Relógio ao vivo
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Carregar threads + última mensagem
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
    <div className="min-h-screen text-slate-100 relative overflow-hidden">
      <div className="scanline" />
      <MouseTrail />

      {/* Aura pulsante central gigante */}
      <motion.div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          width: "120vmin",
          height: "120vmin",
          background: "radial-gradient(circle, rgba(34, 211, 238, 0.08) 0%, transparent 60%)",
          filter: "blur(60px)",
          zIndex: 0,
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Partículas flutuando */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={`p-${i}`}
          className="fixed rounded-full pointer-events-none"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            background: i % 3 === 0 ? "#fbbf24" : "#22d3ee",
            boxShadow: `0 0 ${6 + i}px ${i % 3 === 0 ? "#fbbf24" : "#22d3ee"}`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            zIndex: 1,
          }}
          animate={{
            y: [0, -30 - Math.random() * 50, 0],
            x: [0, Math.random() * 30 - 15, 0],
            opacity: [0, 0.9, 0],
          }}
          transition={{
            duration: 6 + Math.random() * 8,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* === BOOT SEQUENCE === */}
      <AnimatePresence>
        {!booted && (
          <motion.div
            key="boot"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center"
          >
            <div className="max-w-2xl w-full px-6">
              {/* Título com brilho */}
              <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-12"
              >
                <div
                  className="font-orbitron text-5xl md:text-7xl tracking-[0.3em] text-cyan-300"
                  style={{
                    textShadow: "0 0 20px #22d3ee, 0 0 40px #22d3ee, 0 0 60px #22d3ee",
                  }}
                >
                  J.A.R.V.I.S.
                </div>
                <div className="text-[10px] md:text-xs text-cyan-400/60 tracking-[0.6em] mt-4 font-mono">
                  JUST A RATHER VERY INTELLIGENT SYSTEM
                </div>
              </motion.div>

              {/* Linhas de boot */}
              <div className="font-mono text-xs md:text-sm space-y-2 mb-8 min-h-[180px]">
                {BOOT_LINES.slice(0, bootLine + 1).map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-cyan-400/80"
                  >
                    {line}
                    {i === bootLine && (
                      <span className="inline-block w-2 h-4 bg-cyan-400 ml-2 animate-pulse align-middle" />
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Barra de progresso */}
              <div className="w-full h-1 bg-slate-900 rounded overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 via-blue-400 to-cyan-500"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((bootLine + 1) / BOOT_LINES.length) * 100}%` }}
                  transition={{ duration: 0.4 }}
                  style={{ boxShadow: "0 0 20px #22d3ee" }}
                />
              </div>
              <div className="text-right text-[10px] text-cyan-400/40 font-mono mt-2">
                {Math.round(((bootLine + 1) / BOOT_LINES.length) * 100)}%
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD lateral */}
      {booted && (
        <>
          <div className="absolute top-28 left-6 space-y-3 z-20 hidden md:block">
            <StatusBar label="CPU" color="#22d3ee" />
            <StatusBar label="MEM" color="#0ea5e9" />
            <StatusBar label="NET" color="#67e8f9" />
          </div>

          <div className="absolute top-28 right-6 z-20 hidden md:block">
            <Radar />
          </div>

          <div className="absolute bottom-32 left-6 text-[9px] font-mono text-cyan-400/40 space-y-0.5 z-20 hidden md:block code-pulse">
            <div>▸ AUTH_OK</div>
            <div>▸ ENC_AES256</div>
            <div>▸ LINK:STABLE</div>
            <div>▸ PWR:98.4%</div>
          </div>

          <div className="absolute bottom-32 right-6 text-[9px] font-mono text-cyan-400/40 text-right z-20 hidden md:block">
            <div>LAT -23.5505</div>
            <div>LNG -46.6333</div>
            <div>SYS v2.0.4</div>
          </div>
        </>
      )}

      {/* === TOP BAR === */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: booted ? 0 : -80, opacity: booted ? 1 : 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 p-4 border-b border-cyan-500/20 backdrop-blur-xl bg-slate-950/40"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 rounded-full border-2 border-cyan-400/60 border-t-transparent"
            />
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="font-orbitron text-xl md:text-2xl text-cyan-300 tracking-[0.3em]"
              style={{ textShadow: "0 0 20px #22d3ee" }}
            >
              J.A.R.V.I.S.
            </motion.h1>
          </div>

          <div className="flex gap-3 items-center text-xs font-mono">
            <div className="hidden lg:flex items-center gap-2 text-slate-400 px-3 py-1.5 rounded border border-cyan-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{user.email}</span>
            </div>
            <div className="hidden md:block text-cyan-400/60 tabular-nums">
              {time.toLocaleTimeString("pt-BR")}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate({ to: "/configuraciones" })}
              className="px-3 py-1.5 rounded border border-cyan-500/30 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-500/10 transition"
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

      {/* === HERO — TÍTULO + CAPACETE === */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : 30 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="relative z-10 pt-12 pb-8 text-center"
      >
        <div className="text-[10px] tracking-[0.5em] text-cyan-400/60 font-mono mb-3">
          ▸ SISTEMA OPERACIONAL STARK INDUSTRIES v2.0.4
        </div>
        <h2
          className="font-orbitron text-4xl md:text-6xl lg:text-7xl tracking-[0.15em] leading-tight bg-gradient-to-r from-cyan-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent bg-[length:200%_auto]"
          style={{
            animation: "gradientShift 4s ease infinite",
            filter: "drop-shadow(0 0 30px rgba(34, 211, 238, 0.5))",
          }}
        >
          BEM-VINDO DE VOLTA
        </h2>
        <div className="text-sm md:text-base text-slate-400 mt-3 tracking-wider">
          Como posso ajudar hoje, senhor?
        </div>
        <style>{`
          @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}</style>
      </motion.div>

      {/* === CAPACETE COM ANÉIS === */}
      <div className="relative py-6 z-10">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border border-cyan-400/20"
              style={{
                width: `${320 + i * 180}px`,
                height: `${320 + i * 180}px`,
              }}
              animate={{
                rotate: i % 2 === 0 ? 360 : -360,
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                rotate: { duration: 25 + i * 10, repeat: Infinity, ease: "linear" },
                opacity: { duration: 4 + i, repeat: Infinity },
              }}
            >
              <div
                className="absolute w-2 h-2 rounded-full bg-cyan-400"
                style={{
                  top: "50%",
                  left: "-4px",
                  boxShadow: "0 0 12px #22d3ee",
                }}
              />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 40 }}
          animate={{ opacity: booted ? 1 : 0, scale: 1.1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <IronManHelmet state="idle" />
        </motion.div>
      </div>

      {/* === CARDS DE STATUS === */}
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
            color="#22d3ee"
          />
          <StatCard label="OPERADOR" value={user.email.split("@")[0]} color="#0ea5e9" />
          <StatCard label="CONVERSAS" value={threads.length} color="#67e8f9" />
          <StatCard label="STATUS" value="ONLINE" color="#10b981" pulse />
        </div>
      </motion.div>

      {/* === LISTA DE CONVERSAS === */}
      <motion.main
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : 30 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="max-w-6xl mx-auto px-6 pb-32 relative z-10"
      >
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]"
              />
              <h2
                className="font-orbitron text-sm tracking-[0.4em] text-cyan-400/80"
                style={{ textShadow: "0 0 10px #22d3ee" }}
              >
                HISTÓRICO DE CONVERSAS
              </h2>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1 ml-5">
              {threads.length} {threads.length === 1 ? "registro" : "registros"} no banco
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(34, 211, 238, 0.8)" }}
            whileTap={{ scale: 0.95 }}
            onClick={newThread}
            className="px-6 py-3 rounded-lg font-orbitron text-xs tracking-[0.2em] text-slate-950 font-bold relative overflow-hidden group"
            style={{
              background: "linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)",
              boxShadow: "0 0 20px rgba(34, 211, 238, 0.5)",
            }}
          >
            <span className="relative z-10">+ NOVA CONVERSA</span>
            <motion.div
              className="absolute inset-0 bg-white/20"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.6 }}
            />
          </motion.button>
        </div>

        {threads.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 border border-dashed border-cyan-500/20 rounded-2xl backdrop-blur-sm bg-slate-950/30"
          >
            <motion.div
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="font-orbitron text-cyan-400/60 tracking-[0.3em] text-sm mb-3"
            >
              NENHUMA CONVERSA REGISTRADA
            </motion.div>
            <div className="text-slate-500 text-sm">
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
                whileHover={{
                  x: 8,
                  transition: { duration: 0.2 },
                }}
                onClick={() =>
                  navigate({ to: "/chat/$threadId", params: { threadId: t.id } })
                }
                className="group relative flex justify-between items-start p-5 border border-cyan-500/20 hover:border-cyan-400/60 rounded-xl cursor-pointer bg-slate-950/50 backdrop-blur-sm transition-all overflow-hidden"
              >
                {/* Borda lateral luminosa */}
                <motion.div
                  className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-cyan-400 to-transparent"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1, boxShadow: "0 0 20px #22d3ee" }}
                />

                {/* Glow de fundo no hover */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  style={{
                    background:
                      "radial-gradient(circle at 0% 50%, rgba(34, 211, 238, 0.08), transparent 50%)",
                  }}
                />

                <div className="flex items-start gap-4 flex-1 min-w-0 relative z-10">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                    className="mt-1.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-slate-100 truncate text-base">
                      {t.title}
                    </div>
                    {t.lastMessage && (
                      <div className="text-xs text-slate-500 mt-1.5 truncate font-mono">
                        ▸ {t.lastMessage}...
                      </div>
                    )}
                    <div className="text-[10px] text-slate-600 font-mono mt-2 tracking-widest flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-cyan-400/50" />
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

      {/* Rodapé */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: booted ? 1 : 0 }}
        transition={{ delay: 1.5 }}
        className="relative z-10 text-center py-8 text-[10px] text-cyan-400/30 font-mono tracking-[0.3em]"
      >
        ▸ J.A.R.V.I.S. v2.0.4 — STARK INDUSTRIES © 2025 — FAN PROJECT
      </motion.footer>
    </div>
  );
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

function StatCard({
  label,
  value,
  color,
  pulse,
}: {
  label: string;
  value: string | number;
  color: string;
  pulse?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: `0 0 30px ${color}40` }}
      transition={{ duration: 0.4 }}
      className="relative p-4 rounded-lg border backdrop-blur-sm overflow-hidden group"
      style={{
        borderColor: `${color}40`,
        background: "rgba(2, 6, 23, 0.6)",
        boxShadow: `0 0 20px ${color}20`,
      }}
    >
      {/* Cantos HUD */}
      <div
        className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2"
        style={{ borderColor: color }}
      />
      <div
        className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2"
        style={{ borderColor: color }}
      />

      {/* Linha animada no topo */}
      <motion.div
        className="absolute top-0 left-0 h-0.5"
        style={{ background: color, boxShadow: `0 0 10px ${color}` }}
        animate={{ width: ["0%", "100%", "0%"], left: ["0%", "0%", "100%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="text-[9px] tracking-[0.3em] font-mono mb-1.5" style={{ color }}>
        {label}
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
    <div className="w-28">
      <div
        className="flex justify-between text-[9px] font-mono tracking-widest"
        style={{ color }}
      >
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

function Radar() {
  return (
    <div className="w-24 h-24 relative">
      <div className="absolute inset-0 rounded-full border border-cyan-500/40" />
      <div className="absolute inset-3 rounded-full border border-cyan-500/25" />
      <div className="absolute inset-6 rounded-full border border-cyan-500/15" />
      <div className="absolute inset-9 rounded-full border border-cyan-500/10" />
      <div className="absolute top-1/2 left-1/2 w-1 h-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
      <div className="radar-sweep absolute inset-0">
        <div
          className="absolute top-1/2 left-1/2 w-12 h-px origin-left"
          style={{
            background: "linear-gradient(90deg, #22d3ee, transparent)",
            transform: "translateY(-50%)",
          }}
        />
      </div>
    </div>
  );
}