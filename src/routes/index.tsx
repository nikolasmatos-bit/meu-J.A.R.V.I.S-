import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
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

export function HomePage() {
  const { user } = useJarvis();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 1400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: threadsData } = await supabase
        .from("threads")
        .select("*")
        .order("updated_at", { ascending: false });

      if (!threadsData) return;

      // Pega última mensagem de cada thread
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

      {/* Boot overlay */}
      {!booted && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center">
          <div className="text-center">
            <div
              className="font-orbitron text-cyan-400 text-4xl tracking-[0.5em] animate-pulse"
              style={{ textShadow: "0 0 30px #22d3ee, 0 0 60px #22d3ee" }}
            >
              J.A.R.V.I.S.
            </div>
            <div className="text-[10px] text-cyan-400/60 tracking-[0.5em] mt-3 font-mono">
              JUST A RATHER VERY INTELLIGENT SYSTEM
            </div>
            <div className="mt-8 w-80 h-1 bg-slate-900 overflow-hidden mx-auto rounded">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-400 to-cyan-500"
                style={{ animation: "bootBar 1.4s ease-out forwards" }}
              />
            </div>
            <div className="text-[9px] text-slate-500 tracking-widest mt-3 font-mono">
              CARREGANDO MÓDULOS NEURAIS...
            </div>
          </div>
        </div>
      )}

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

      {/* Top bar */}
      <header className="relative z-10 p-5 border-b border-cyan-500/20 backdrop-blur-md bg-slate-950/60">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-orbitron text-2xl text-cyan-300 tracking-[0.3em]"
            style={{ textShadow: "0 0 20px #22d3ee" }}
          >
            J.A.R.V.I.S.
          </motion.h1>

          <div className="flex gap-4 items-center text-xs font-mono">
            <span className="hidden md:flex items-center gap-2 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {user.email}
            </span>
            <button
              onClick={() => navigate({ to: "/configuraciones" })}
              className="px-3 py-1.5 rounded border border-cyan-500/30 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-500/10 transition"
            >
              ⚙
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-3 py-1.5 rounded border border-red-500/30 text-red-300 hover:border-red-400 hover:bg-red-500/10 transition"
            >
              SAIR
            </button>
          </div>
        </div>
      </header>

      {/* === CAPACETE COM ANÉIS CONCÊNTRICOS === */}
      <div className="relative py-12 z-10">
        {/* Anéis de fundo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border border-cyan-400/20"
              style={{
                width: `${300 + i * 180}px`,
                height: `${300 + i * 180}px`,
              }}
              animate={{
                rotate: i % 2 === 0 ? 360 : -360,
                opacity: [0.15, 0.35, 0.15],
              }}
              transition={{
                rotate: { duration: 30 + i * 10, repeat: Infinity, ease: "linear" },
                opacity: { duration: 4, repeat: Infinity },
              }}
            >
              {/* Marcador no anel */}
              <div
                className="absolute w-2 h-2 rounded-full bg-cyan-400"
                style={{
                  top: "50%",
                  left: "-4px",
                  boxShadow: "0 0 10px #22d3ee",
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* Capacete */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 40 }}
          animate={{ opacity: 1, scale: 1.15, y: 0 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <IronManHelmet state="idle" />
        </motion.div>
      </div>

      {/* === CARDS DE STATUS === */}
      <div className="max-w-5xl mx-auto px-6 relative z-10 mb-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="HORA LOCAL" value={new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} color="#22d3ee" pulse />
          <StatCard label="OPERADOR" value={user.email.split("@")[0]} color="#0ea5e9" />
          <StatCard label="CONVERSAS" value={threads.length} color="#67e8f9" />
          <StatCard label="STATUS" value="ONLINE" color="#10b981" />
        </div>
      </div>

      {/* === LISTA DE CONVERSAS === */}
      <main className="max-w-5xl mx-auto px-6 pb-24 relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2
              className="font-orbitron text-sm tracking-[0.4em] text-cyan-400/80"
              style={{ textShadow: "0 0 10px #22d3ee" }}
            >
              ▸ HISTÓRICO DE CONVERSAS
            </h2>
            <div className="text-[10px] text-slate-500 font-mono mt-1">
              {threads.length} {threads.length === 1 ? "registro" : "registros"}
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={newThread}
            className="px-5 py-2.5 rounded-lg font-orbitron text-xs tracking-[0.2em] text-slate-950 font-bold"
            style={{
              background: "linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)",
              boxShadow: "0 0 20px rgba(34, 211, 238, 0.5)",
            }}
          >
            + NOVA CONVERSA
          </motion.button>
        </div>

        {threads.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-cyan-500/20 rounded-xl">
            <p className="font-orbitron text-cyan-400/60 tracking-[0.3em] text-sm mb-2">
              NENHUMA CONVERSA
            </p>
            <p className="text-slate-500 text-sm">
              Inicie uma nova, senhor.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {threads.map((t, i) => (
              <motion.li
                key={t.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ x: 6, boxShadow: "0 0 30px rgba(34, 211, 238, 0.2)" }}
                onClick={() =>
                  navigate({ to: "/chat/$threadId", params: { threadId: t.id } })
                }
                className="group flex justify-between items-start p-5 border border-cyan-500/20 hover:border-cyan-400/60 rounded-xl cursor-pointer bg-slate-950/60 backdrop-blur-sm transition-all relative overflow-hidden"
              >
                {/* Borda lateral esquerda luminosa */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-cyan-400 to-transparent opacity-0 group-hover:opacity-100 transition"
                />

                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="mt-1 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-slate-100 truncate">{t.title}</div>
                    {t.lastMessage && (
                      <div className="text-xs text-slate-500 mt-1 truncate font-mono">
                        ▸ {t.lastMessage}...
                      </div>
                    )}
                    <div className="text-[10px] text-slate-600 font-mono mt-1 tracking-widest">
                      {new Date(t.updated_at).toLocaleString("pt-BR")}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => remove(t.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition p-2 shrink-0"
                >
                  ✕
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

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
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (!pulse) return;
    const i = setInterval(() => {
      setDisplayValue(
        new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }, 1000);
    return () => clearInterval(i);
  }, [pulse]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="relative p-4 rounded-lg border backdrop-blur-sm"
      style={{
        borderColor: `${color}40`,
        background: "rgba(2, 6, 23, 0.6)",
        boxShadow: `0 0 20px ${color}20`,
      }}
    >
      <div
        className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2"
        style={{ borderColor: color }}
      />
      <div
        className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2"
        style={{ borderColor: color }}
      />
      <div className="text-[9px] tracking-[0.3em] font-mono mb-1" style={{ color }}>
        {label}
      </div>
      <div
        className="font-orbitron text-lg md:text-xl truncate"
        style={{ color, textShadow: `0 0 10px ${color}80` }}
      >
        {displayValue}
      </div>
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