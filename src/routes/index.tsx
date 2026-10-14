import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useJarvis } from "../components/jarvis/Bootstrap";
import { IronManHelmet } from "../components/jarvis/IronManHelmet";
import { MouseTrail } from "../components/jarvis/MouseTrail";
import { SFX } from "../lib/sfx";

export function HomePage() {
  const { user } = useJarvis();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<any[]>([]);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 1400);
    return () => clearTimeout(t);
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

      {/* Capacete */}
      <div className="py-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <IronManHelmet state="idle" />
        </motion.div>
      </div>

      {/* Cards de stats */}
      <div className="max-w-4xl mx-auto px-6 relative z-10 mb-12">
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="CONVERSAS" value={threads.length} color="#22d3ee" />
          <StatCard label="STATUS" value="ONLINE" color="#10b981" />
          <StatCard label="VERSÃO" value="v2.0.4" color="#0ea5e9" />
        </div>
      </div>

      {/* Lista de conversas */}
      <main className="max-w-4xl mx-auto px-6 pb-20 relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h2
            className="font-orbitron text-sm tracking-[0.4em] text-cyan-400/80"
            style={{ textShadow: "0 0 10px #22d3ee" }}
          >
            ▸ HISTÓRICO
          </h2>
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
                whileHover={{ x: 4 }}
                onClick={() =>
                  navigate({ to: "/chat/$threadId", params: { threadId: t.id } })
                }
                className="group flex justify-between items-center p-4 border border-cyan-500/20 hover:border-cyan-400/60 rounded-lg cursor-pointer bg-slate-950/60 backdrop-blur-sm transition-all"
                style={{
                  boxShadow: "0 0 0 rgba(34, 211, 238, 0)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 0 30px rgba(34, 211, 238, 0.15)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 0 0 rgba(34, 211, 238, 0)";
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                  <div>
                    <div className="font-medium text-slate-100">{t.title}</div>
                    <div className="text-xs text-slate-500 font-mono">
                      {new Date(t.updated_at).toLocaleString("pt-BR")}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => remove(t.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition p-2"
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

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
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
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: color }} />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: color }} />
      <div className="text-[9px] tracking-[0.3em] font-mono mb-1" style={{ color }}>
        {label}
      </div>
      <div className="font-orbitron text-xl" style={{ color, textShadow: `0 0 10px ${color}80` }}>
        {value}
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