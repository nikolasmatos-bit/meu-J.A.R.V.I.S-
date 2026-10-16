import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useJarvis } from "../components/jarvis/Bootstrap";
import { MouseTrail } from "../components/jarvis/MouseTrail";
import { SFX } from "../lib/sfx";
import { THEMES, applyTheme, loadPersona, type Persona } from "../lib/theme";

type Thread = { id: string; title: string; updated_at: string };

const PERSONAS_LIST: { id: Persona; label: string; code: string }[] = [
  { id: "jarvis", label: "J.A.R.V.I.S.", code: "JVS-04" },
  { id: "friday", label: "F.R.I.D.A.Y.", code: "FRD-05" },
  { id: "ultron", label: "ULTRON", code: "ULT-06" },
  { id: "sextafeira", label: "SEXTA-FEIRA", code: "SXT-07" },
];

const BOOT_LOG = [
  "neural_core :: INIT",
  "personality_matrix :: LOAD",
  "stark_uplink :: CONNECT",
  "memory_bank :: SYNC",
  "threat_scan :: CLEAR",
  "operator_auth :: VERIFIED",
  "all_systems :: NOMINAL",
];

const TIPS = [
  "↑ no input repete o último comando",
  "Ctrl+M alterna o modo de raciocínio",
  "F11 entra em tela cheia cinematográfica",
  "diga 'JARVIS' para ativar modo voz",
  "peça 'pesquise X' para buscar na web",
  "pergunte 'o que é X' pra consultar Wikipedia",
];

export function HomePage() {
  const { user } = useJarvis();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [filtered, setFiltered] = useState<Thread[]>([]);
  const [search, setSearch] = useState("");
  const [booted, setBooted] = useState(false);
  const [bootLines, setBootLines] = useState(0);
  const [time, setTime] = useState(new Date());
  const [persona, setPersona] = useState<Persona>("jarvis");
  const [quick, setQuick] = useState("");
  const [focused, setFocused] = useState(false);
  const [personaOpen, setPersonaOpen] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [cpuHistory, setCpuHistory] = useState<number[]>(Array(20).fill(40));
  const [memHistory, setMemHistory] = useState<number[]>(Array(20).fill(50));
  const [terminalLog, setTerminalLog] = useState<string[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [orbHover, setOrbHover] = useState(false);
  const [orbPulse, setOrbPulse] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const theme = THEMES[persona];

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
    let i = 0;
    const t = setInterval(() => {
      i++;
      setBootLines(i);
      if (i >= BOOT_LOG.length) {
        clearInterval(t);
        setTimeout(() => setBooted(true), 400);
      }
    }, 180);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 5500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!booted) return;
    const t = setInterval(() => {
      setCpuHistory((h) => [...h.slice(1), 30 + Math.random() * 60]);
      setMemHistory((h) => [...h.slice(1), 40 + Math.random() * 40]);
    }, 1400);
    return () => clearInterval(t);
  }, [booted]);

  useEffect(() => {
    if (!booted) return;
    const logs = [
      "scan :: no threats detected",
      "link :: satellite uplink OK",
      "sync :: cloud storage 100%",
      "core :: neural engine 98.4%",
      "auth :: operator verified",
      "status :: all systems nominal",
      "uplink :: latency 12ms",
      "encryption :: AES-256 active",
    ];
    let i = 0;
    const t = setInterval(() => {
      const ts = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setTerminalLog((prev) => [...prev.slice(-4), `${ts}  ${logs[i % logs.length]}`]);
      i++;
    }, 2800);
    return () => clearInterval(t);
  }, [booted]);

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

  const switchPersona = (p: Persona) => {
    setPersona(p);
    applyTheme(p);
    setPersonaOpen(false);
    SFX.personaSwitch();
  };

  const currentPersona = PERSONAS_LIST.find((p) => p.id === persona)!;
  const hour = time.getHours();
  const greeting = hour < 12 ? "BOM DIA" : hour < 18 ? "BOA TARDE" : "BOA NOITE";

  const cpuPath = cpuHistory
    .map((v, i) => `${i === 0 ? "M" : "L"} ${(i / (cpuHistory.length - 1)) * 100} ${30 - (v / 100) * 30}`)
    .join(" ");

  const memPath = memHistory
    .map((v, i) => `${i === 0 ? "M" : "L"} ${(i / (memHistory.length - 1)) * 100} ${30 - (v / 100) * 30}`)
    .join(" ");

  return (
    <div className="min-h-screen text-slate-100 relative overflow-hidden bg-[#03050a]">
      <MouseTrail />

      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(${theme.primary}08 1px, transparent 1px),
            linear-gradient(90deg, ${theme.primary}08 1px, transparent 1px),
            linear-gradient(${theme.primary}12 1px, transparent 1px),
            linear-gradient(90deg, ${theme.primary}12 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px, 20px 20px, 100px 100px, 100px 100px",
          transform: `translate(${mousePos.x * -8}px, ${mousePos.y * -8}px)`,
          transition: "transform 0.8s ease-out",
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
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <div
        className="fixed top-1/2 -translate-y-1/2 font-orbitron select-none pointer-events-none z-0 hidden xl:block"
        style={{
          right: "-2rem",
          fontSize: "240px",
          lineHeight: 1,
          color: `${theme.primary}06`,
          writingMode: "vertical-rl",
          transform: "translateY(-50%) rotate(180deg)",
          letterSpacing: "0.05em",
          fontWeight: 900,
        }}
      >
        {currentPersona.code}
      </div>

      <div
        className="fixed left-0 top-0 bottom-0 w-8 border-r z-20 hidden md:flex flex-col items-center justify-between py-4"
        style={{ borderColor: `${theme.primary}22`, background: "rgba(3,5,10,0.75)" }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
          className="w-3 h-3 border"
          style={{ borderColor: theme.primary, borderTopColor: "transparent" }}
        />
        <div
          className="font-mono text-[9px] tracking-[0.4em] rotate-180"
          style={{ color: `${theme.primary}66`, writingMode: "vertical-rl" }}
        >
          STARK INDUSTRIES · MK-VII · SEC-7G
        </div>
        <div
          className="font-mono text-[9px] tracking-[0.3em]"
          style={{ color: `${theme.primary}66`, writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          SYS.v2.0.4
        </div>
      </div>

      <div
        className="fixed right-0 top-0 bottom-0 w-8 border-l z-20 hidden md:flex flex-col items-center justify-between py-4"
        style={{ borderColor: `${theme.primary}22`, background: "rgba(3,5,10,0.75)" }}
      >
        <div className="font-mono text-[9px] tracking-[0.3em]" style={{ color: `${theme.primary}66`, writingMode: "vertical-rl" }}>
          LAT -23.5505
        </div>
        <div className="w-px h-12" style={{ background: `${theme.primary}44` }} />
        <div className="font-mono text-[9px] tracking-[0.3em]" style={{ color: `${theme.primary}66`, writingMode: "vertical-rl" }}>
          LNG -46.6333
        </div>
        <div className="w-px h-12" style={{ background: `${theme.primary}44` }} />
        <div className="font-mono text-[9px] tracking-[0.3em]" style={{ color: `${theme.primary}66`, writingMode: "vertical-rl" }}>
          ALT 760M
        </div>
      </div>

      {booted && (
        <>
          <div className="fixed top-3 left-12 w-8 h-8 border-t-2 border-l-2 z-30 pointer-events-none" style={{ borderColor: `${theme.primary}88` }} />
          <div className="fixed top-3 right-12 w-8 h-8 border-t-2 border-r-2 z-30 pointer-events-none" style={{ borderColor: `${theme.primary}88` }} />
          <div className="fixed bottom-3 left-12 w-8 h-8 border-b-2 border-l-2 z-30 pointer-events-none" style={{ borderColor: `${theme.primary}88` }} />
          <div className="fixed bottom-3 right-12 w-8 h-8 border-b-2 border-r-2 z-30 pointer-events-none" style={{ borderColor: `${theme.primary}88` }} />
        </>
      )}

      <AnimatePresence>
        {!booted && (
          <motion.div
            key="boot"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.03 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[500] bg-[#03050a] flex items-center justify-center px-6"
          >
            <div className="font-mono text-sm w-full max-w-lg">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex items-center gap-3"
                style={{ color: theme.primary }}
              >
                <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${theme.primary})` }} />
                <span className="text-[10px] tracking-[0.6em]">STARK MAINFRAME</span>
                <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${theme.primary}, transparent)` }} />
              </motion.div>

              <div className="font-orbitron text-2xl tracking-[0.3em] mb-6" style={{ color: theme.primary, textShadow: `0 0 30px ${theme.primary}` }}>
                {currentPersona.label}
              </div>

              {BOOT_LOG.slice(0, bootLines).map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="py-1 flex items-center gap-3"
                  style={{ color: `${theme.primary}cc` }}
                >
                  <span style={{ color: `${theme.primary}55` }}>[{String(i + 1).padStart(2, "0")}]</span>
                  <span className="flex-1">{line}</span>
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                    style={{ color: "#10b981" }}
                  >
                    ✓ OK
                  </motion.span>
                </motion.div>
              ))}

              {bootLines >= BOOT_LOG.length && (
                <>
                  <div className="mt-6 h-1 w-full overflow-hidden" style={{ background: `${theme.primary}22` }}>
                    <motion.div
                      className="h-full"
                      style={{ background: theme.primary, boxShadow: `0 0 20px ${theme.primary}` }}
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-4 flex items-center gap-2 text-[11px] tracking-widest"
                    style={{ color: theme.primary }}
                  >
                    <span className="w-1.5 h-1.5 animate-pulse" style={{ background: theme.primary }} />
                    READY FOR INPUT
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 pl-0 md:pl-8 pr-0 md:pr-8 min-h-screen flex flex-col">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : -20 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex items-center justify-between px-6 py-3 border-b font-mono text-[10px] tracking-[0.25em] gap-4 flex-wrap backdrop-blur-sm"
          style={{ borderColor: `${theme.primary}22`, background: "rgba(3,5,10,0.6)" }}
        >
          <div className="flex items-center gap-4 flex-wrap" style={{ color: `${theme.primary}99` }}>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 animate-pulse" style={{ background: theme.primary, boxShadow: `0 0 8px ${theme.primary}` }} />
              ONLINE
            </span>
            <span className="text-slate-700">│</span>
            <span className="tabular-nums">{time.toLocaleTimeString("pt-BR")}</span>
            <span className="text-slate-700 hidden md:inline">│</span>
            <span className="hidden md:inline">
              {time.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).toUpperCase()}
            </span>
            <span className="text-slate-700 hidden lg:inline">│</span>
            <span className="hidden lg:inline">
              {greeting}, {user.email.split("@")[0].toUpperCase()}
            </span>
          </div>

          <div className="relative">
            <button
              onMouseEnter={() => SFX.hover()}
              onClick={() => { SFX.menuOpen(); setPersonaOpen((v) => !v); }}
              className="flex items-center gap-2 px-3 py-1 transition-all"
              style={{ color: theme.primary, borderBottom: `1px solid ${theme.primary}66` }}
            >
              <span className="w-1 h-1" style={{ background: theme.primary }} />
              <span>{currentPersona.label}</span>
              <span style={{ color: `${theme.primary}66` }}>[{currentPersona.code}]</span>
            </button>
            <AnimatePresence>
              {personaOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute top-full right-0 mt-1 z-[100] border min-w-[220px] backdrop-blur-md"
                  style={{ background: "rgba(3,5,10,0.95)", borderColor: `${theme.primary}44` }}
                >
                  {PERSONAS_LIST.map((p) => {
                    const pt = THEMES[p.id];
                    const active = persona === p.id;
                    return (
                      <button
                        key={p.id}
                        onMouseEnter={() => SFX.hover()}
                        onClick={() => switchPersona(p.id)}
                        className="w-full text-left px-3 py-2.5 text-[10px] font-mono tracking-widest transition-all flex items-center gap-2"
                        style={{
                          color: active ? pt.primary : `${theme.primary}99`,
                          background: active ? `${pt.primary}11` : "transparent",
                          borderLeft: active ? `2px solid ${pt.primary}` : "2px solid transparent",
                        }}
                      >
                        <span>{active ? "●" : "○"}</span>
                        <span className="flex-1">{p.label}</span>
                        <span style={{ color: `${pt.primary}66` }}>{p.code}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.header>

        <div className="flex-1 grid grid-cols-12 min-h-0">
          <div
            className="col-span-12 lg:col-span-3 border-r flex flex-col min-h-0 backdrop-blur-sm"
            style={{ borderColor: `${theme.primary}22`, background: "rgba(3,5,10,0.4)" }}
          >
            <div className="px-4 py-3 border-b" style={{ borderColor: `${theme.primary}22` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="font-mono text-[9px] tracking-[0.3em]" style={{ color: `${theme.primary}66` }}>
                  // 01 · SESSÕES
                </div>
                <button
                  onMouseEnter={() => SFX.hover()}
                  onClick={() => newThread()}
                  className="font-mono text-[9px] tracking-[0.2em] px-2 py-0.5 transition-all hover:bg-white/5"
                  style={{ color: theme.primary, border: `1px solid ${theme.primary}44` }}
                >
                  + NOVO
                </button>
              </div>
              <div className="flex items-center gap-2 px-2 py-1 border-b" style={{ borderColor: `${theme.primary}22` }}>
                <span className="font-mono text-[10px]" style={{ color: `${theme.primary}66` }}>›</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="buscar…"
                  className="flex-1 bg-transparent outline-none text-[11px] font-mono text-slate-200 placeholder:text-slate-700"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-4 font-mono text-[10px] tracking-widest" style={{ color: `${theme.primary}44` }}>
                  // sem registros
                </div>
              ) : (
                filtered.map((t, i) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.02 }}
                    onMouseEnter={() => SFX.hover()}
                    onClick={() => { SFX.click(); navigate({ to: "/chat/$threadId", params: { threadId: t.id } }); }}
                    className="group px-4 py-2.5 cursor-pointer border-b transition-all flex items-center gap-3"
                    style={{ borderColor: `${theme.primary}0f` }}
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLElement).style.background = `${theme.primary}08`;
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <span className="font-mono text-[9px] tabular-nums" style={{ color: `${theme.primary}55` }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[11px] text-slate-300 truncate group-hover:text-white transition">
                        {t.title}
                      </div>
                      <div className="font-mono text-[8px] tracking-widest mt-0.5" style={{ color: `${theme.primary}44` }}>
                        {new Date(t.updated_at).toLocaleDateString("pt-BR")} ·{" "}
                        {new Date(t.updated_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <button
                      onClick={(e) => removeThread(t.id, e)}
                      className="opacity-0 group-hover:opacity-100 font-mono text-[10px] transition"
                      style={{ color: "#ef4444" }}
                    >
                      ×
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            <div className="px-4 py-3 border-t space-y-2" style={{ borderColor: `${theme.primary}22` }}>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 flex items-center justify-center font-mono text-[10px] border"
                  style={{ borderColor: `${theme.primary}66`, color: theme.primary }}
                >
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[10px] text-slate-300 truncate">
                    {user.email.split("@")[0]}
                  </div>
                  <div className="font-mono text-[8px] tracking-widest" style={{ color: "#10b981" }}>
                    ● AUTENTICADO
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onMouseEnter={() => SFX.hover()}
                  onClick={() => navigate({ to: "/configuraciones" })}
                  className="flex-1 py-1 font-mono text-[9px] tracking-widest border transition-all hover:bg-white/5"
                  style={{ borderColor: `${theme.primary}33`, color: `${theme.primary}99` }}
                >
                  CONFIG
                </button>
                <button
                  onMouseEnter={() => SFX.hover()}
                  onClick={() => supabase.auth.signOut()}
                  className="flex-1 py-1 font-mono text-[9px] tracking-widest border transition-all hover:bg-red-500/10"
                  style={{ borderColor: "#ef444433", color: "#ef444499" }}
                >
                  SAIR
                </button>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6 flex flex-col min-h-0 relative">
            <div
              className="px-6 py-2 border-b flex items-center justify-between font-mono text-[9px] tracking-[0.3em]"
              style={{ borderColor: `${theme.primary}22`, color: `${theme.primary}66`, background: "rgba(3,5,10,0.4)" }}
            >
              <span>// 02 · CONSOLE PRINCIPAL</span>
              <span className="tabular-nums">{time.toLocaleTimeString("pt-BR")}</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 overflow-y-auto relative">
              {/* ORBE + EFEITOS AVANÇADOS */}
              <motion.div
                className="relative flex items-center justify-center my-2"
                style={{ perspective: 1400 }}
                onMouseEnter={() => setOrbHover(true)}
                onMouseLeave={() => setOrbHover(false)}
                onClick={() => {
                  setOrbPulse(true);
                  SFX.click();
                  setTimeout(() => setOrbPulse(false), 1000);
                }}
              >
                {/* Glow massivo */}
                <motion.div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: 800,
                    height: 800,
                    background: `radial-gradient(circle, ${theme.glow} 0%, ${theme.primary}22 25%, transparent 60%)`,
                    filter: "blur(70px)",
                  }}
                  animate={{
                    scale: orbHover ? 1.15 : [1, 1.1, 1],
                    opacity: orbHover ? 1 : [0.5, 0.85, 0.5],
                  }}
                  transition={{
                    scale: orbHover ? { duration: 0.6 } : { duration: 4, repeat: Infinity, ease: "easeInOut" },
                    opacity: orbHover ? { duration: 0.6 } : { duration: 4, repeat: Infinity, ease: "easeInOut" },
                  }}
                />

                {/* SVG com anéis */}
                <svg
                  className="absolute pointer-events-none"
                  style={{
                    width: 660,
                    height: 660,
                    filter: `drop-shadow(0 0 ${orbHover ? 15 : 8}px ${theme.primary})`,
                    transition: "filter 0.4s ease",
                  }}
                  viewBox="0 0 660 660"
                >
                  <defs>
                    <linearGradient id="orbRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={theme.primary} />
                      <stop offset="50%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor={theme.primary} />
                    </linearGradient>
                    <radialGradient id="orbInnerGlow">
                      <stop offset="0%" stopColor={theme.primary} stopOpacity="0.4" />
                      <stop offset="100%" stopColor={theme.primary} stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  <circle cx="330" cy="330" r="300" fill="url(#orbInnerGlow)" />

                  <motion.circle
                    cx="330" cy="330" r="310"
                    fill="none" stroke={theme.primary} strokeWidth={orbHover ? 3 : 2}
                    strokeDasharray="90 20 15 20 60 15" opacity={orbHover ? 1 : 0.7}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                    style={{ transformOrigin: "330px 330px", transition: "stroke-width 0.3s, opacity 0.3s" }}
                  />

                  <motion.circle
                    cx="330" cy="330" r="295"
                    fill="none" stroke={theme.primary} strokeWidth="1"
                    strokeDasharray="3 10" opacity={orbHover ? 0.8 : 0.5}
                    animate={{ rotate: -360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    style={{ transformOrigin: "330px 330px", transition: "opacity 0.3s" }}
                  />

                  {Array.from({ length: 60 }).map((_, i) => {
                    const angle = (i * 360) / 60;
                    const rad = (angle * Math.PI) / 180;
                    const inner = i % 5 === 0 ? 270 : 278;
                    const outer = i % 5 === 0 ? 292 : 284;
                    return (
                      <line
                        key={`tick-${i}`}
                        x1={330 + Math.cos(rad) * inner}
                        y1={330 + Math.sin(rad) * inner}
                        x2={330 + Math.cos(rad) * outer}
                        y2={330 + Math.sin(rad) * outer}
                        stroke={theme.primary}
                        strokeWidth={i % 5 === 0 ? 2 : 1}
                        opacity={i % 5 === 0 ? (orbHover ? 1 : 0.9) : orbHover ? 0.5 : 0.3}
                        style={{ transition: "opacity 0.3s" }}
                      />
                    );
                  })}

                  <motion.circle
                    cx="330" cy="330" r="250"
                    fill="none" stroke="url(#orbRingGrad)" strokeWidth="2"
                    strokeDasharray="30 10 60 10" opacity={orbHover ? 1 : 0.8}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    style={{ transformOrigin: "330px 330px", transition: "opacity 0.3s" }}
                  />

                  <motion.circle
                    cx="330" cy="330" r="228"
                    fill="none" stroke={theme.primary} strokeWidth="1.5"
                    strokeDasharray="8 6" opacity={orbHover ? 0.9 : 0.6}
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    style={{ transformOrigin: "330px 330px", transition: "opacity 0.3s" }}
                  />

                  <motion.circle
                    cx="330" cy="330" r="205"
                    fill="none" stroke={theme.primary} strokeWidth={orbHover ? 4 : 3}
                    strokeDasharray="40 200" strokeLinecap="round" opacity="0.9"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    style={{
                      transformOrigin: "330px 330px",
                      filter: `drop-shadow(0 0 ${orbHover ? 10 : 6}px ${theme.primary})`,
                      transition: "stroke-width 0.3s, filter 0.3s",
                    }}
                  />
                  <motion.circle
                    cx="330" cy="330" r="205"
                    fill="none" stroke={theme.primary} strokeWidth={orbHover ? 4 : 3}
                    strokeDasharray="40 200" strokeDashoffset="120" strokeLinecap="round" opacity="0.9"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    style={{
                      transformOrigin: "330px 330px",
                      filter: `drop-shadow(0 0 ${orbHover ? 10 : 6}px ${theme.primary})`,
                      transition: "stroke-width 0.3s, filter 0.3s",
                    }}
                  />
                </svg>

                <motion.div
                  className="absolute rounded-full border-2 pointer-events-none"
                  style={{
                    width: 550, height: 550,
                    borderColor: "transparent",
                    borderTopColor: theme.primary,
                    borderRightColor: `${theme.primary}44`,
                    filter: `drop-shadow(0 0 ${orbHover ? 15 : 10}px ${theme.primary})`,
                    transition: "filter 0.3s",
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: orbHover ? 2.5 : 5, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute rounded-full border-2 pointer-events-none"
                  style={{
                    width: 480, height: 480,
                    borderColor: "transparent",
                    borderBottomColor: "#fbbf24",
                    borderLeftColor: "rgba(251, 191, 36, 0.3)",
                    filter: `drop-shadow(0 0 ${orbHover ? 15 : 10}px #fbbf24)`,
                    transition: "filter 0.3s",
                  }}
                  animate={{ rotate: -360 }}
                  transition={{ duration: orbHover ? 3.5 : 7, repeat: Infinity, ease: "linear" }}
                />

                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={`wave-${i}`}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width: 420, height: 420,
                      border: `1.5px solid ${theme.primary}${orbHover ? "99" : "66"}`,
                      boxShadow: `0 0 20px ${theme.primary}${orbHover ? "66" : "44"}, inset 0 0 20px ${theme.primary}22`,
                    }}
                    animate={{ scale: orbHover ? [0.9, 2.5] : [0.8, 2.2], opacity: [0.7, 0] }}
                    transition={{ duration: orbHover ? 2.5 : 3.5, repeat: Infinity, delay: i * 0.7, ease: "easeOut" }}
                  />
                ))}

                <AnimatePresence>
                  {orbPulse && (
                    <>
                      <motion.div
                        key="pulse1"
                        className="absolute rounded-full pointer-events-none"
                        style={{
                          width: 420, height: 420,
                          border: `3px solid ${theme.primary}`,
                          boxShadow: `0 0 60px ${theme.primary}, inset 0 0 40px ${theme.primary}66`,
                        }}
                        initial={{ scale: 0.8, opacity: 1 }}
                        animate={{ scale: 3.5, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                      />
                      <motion.div
                        key="pulse2"
                        className="absolute rounded-full pointer-events-none"
                        style={{
                          width: 420, height: 420,
                          border: `2px solid ${theme.primary}`,
                        }}
                        initial={{ scale: 0.8, opacity: 1 }}
                        animate={{ scale: 4.5, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.4, ease: "easeOut", delay: 0.15 }}
                      />
                    </>
                  )}
                </AnimatePresence>

                {Array.from({ length: 32 }).map((_, i) => {
                  const plane = i % 3;
                  const radius = (250 + plane * 25 + (i % 4) * 8) * (orbHover ? 1.05 : 1);
                  const duration = (6 + (i % 5) * 1.5) / (orbHover ? 2 : 1);
                  const size = i % 5 === 0 ? "w-2 h-2" : i % 3 === 0 ? "w-1.5 h-1.5" : "w-1 h-1";
                  const color = i % 4 === 0 ? "#ffffff" : i % 3 === 0 ? "#fbbf24" : theme.primary;
                  const reverse = i % 2 === 0;

                  return (
                    <motion.div
                      key={`particle-${i}`}
                      className="absolute top-1/2 left-1/2 pointer-events-none"
                      style={{ marginTop: -3, marginLeft: -3 }}
                      animate={{ rotate: reverse ? -360 : 360 }}
                      transition={{ duration, repeat: Infinity, ease: "linear" }}
                    >
                      <div
                        className={`${size} rounded-full`}
                        style={{
                          transform: `translateX(${radius}px)`,
                          background: color,
                          boxShadow: `0 0 ${orbHover ? 15 : 10}px ${color}, 0 0 ${orbHover ? 30 : 20}px ${color}80`,
                          transition: "box-shadow 0.3s",
                        }}
                      />
                    </motion.div>
                  );
                })}

                <motion.div
                  className="relative z-10 cursor-pointer"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{
                    opacity: booted ? 1 : 0,
                    scale: orbPulse ? 1.15 : orbHover ? 1.08 : 1,
                    rotateY: mousePos.x * (orbHover ? 12 : 6),
                    rotateX: -mousePos.y * (orbHover ? 12 : 6),
                  }}
                  transition={{
                    opacity: { duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] },
                    scale: { duration: orbPulse ? 0.3 : 0.6, ease: [0.16, 1, 0.3, 1] },
                    rotateY: { type: "spring", stiffness: 80, damping: 15 },
                    rotateX: { type: "spring", stiffness: 80, damping: 15 },
                  }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <motion.div
                    className="absolute -inset-2 rounded-full pointer-events-none"
                    style={{
                      background: `conic-gradient(from 0deg, transparent, ${theme.primary}66, transparent, ${theme.primary}66, transparent)`,
                      filter: "blur(15px)",
                      opacity: orbHover ? 1 : 0.6,
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  />

                  <motion.div
                    className="relative"
                    style={{
                      width: 360,
                      height: 360,
                      borderRadius: "50%",
                      overflow: "hidden",
                      WebkitMaskImage: "radial-gradient(circle, black 58%, transparent 78%)",
                      maskImage: "radial-gradient(circle, black 58%, transparent 78%)",
                    }}
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <motion.img
                      src="/JARVIS.webp"
                      alt="JARVIS Core"
                      className="w-full h-full object-contain"
                      style={{
                        filter: `drop-shadow(0 0 ${orbHover ? 50 : 30}px ${theme.primary}) drop-shadow(0 0 ${orbHover ? 100 : 60}px ${theme.glow}) saturate(${orbHover ? 1.5 : 1.3}) brightness(${orbHover ? 1.2 : 1.1})`,
                        transition: "filter 0.4s ease",
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: orbHover ? 60 : 120, repeat: Infinity, ease: "linear" }}
                    />

                    <motion.div
                      className="absolute inset-8 rounded-full border-2 pointer-events-none"
                      style={{
                        borderColor: "transparent",
                        borderTopColor: `${theme.primary}aa`,
                        borderRightColor: `${theme.primary}44`,
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                      className="absolute inset-16 rounded-full border pointer-events-none"
                      style={{
                        borderColor: "transparent",
                        borderBottomColor: "#fbbf24aa",
                        borderLeftColor: "#fbbf2444",
                      }}
                      animate={{ rotate: -360 }}
                      transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    />

                    <motion.div
                      className="absolute left-0 right-0 h-16 pointer-events-none"
                      style={{
                        background: `linear-gradient(180deg, transparent, ${theme.primary}cc, transparent)`,
                        mixBlendMode: "screen",
                      }}
                      animate={{ top: ["-10%", "110%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                    />

                    <motion.div
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at 50% 20%, ${theme.primary}33, transparent 50%)`,
                        opacity: orbHover ? 1 : 0.6,
                        transition: "opacity 0.3s",
                      }}
                    />
                  </motion.div>

                  <motion.div
                    className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    <div
                      className="font-orbitron text-[11px] tracking-[0.5em]"
                      style={{
                        color: theme.primary,
                        textShadow: `0 0 ${orbHover ? 25 : 15}px ${theme.primary}`,
                        transition: "text-shadow 0.3s",
                      }}
                    >
                      JARVIS
                    </div>
                    <div
                      className="font-mono text-[7px] tracking-[0.35em] mt-1"
                      style={{ color: `${theme.primary}aa` }}
                    >
                      v2.0.4
                    </div>
                    <motion.div
                      className="w-8 h-px mt-1.5"
                      style={{ background: theme.primary }}
                      animate={{ width: orbHover ? [8, 32, 8] : 8, opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>
                </motion.div>

                <AnimatePresence>
                  {orbHover && !orbPulse && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute -bottom-6 left-1/2 -translate-x-1/2 pointer-events-none"
                    >
                      <div className="font-mono text-[9px] tracking-widest" style={{ color: `${theme.primary}aa` }}>
                        ◆ CLIQUE PARA LIBERAR ENERGIA
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : 20 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                className="w-full max-w-xl mt-6 mb-4 relative"
              >
                <div className="font-mono text-[9px] tracking-[0.4em] mb-2 text-center" style={{ color: `${theme.primary}88` }}>
                  // 03 · DIRETIVA
                </div>
                <h1
                  className="text-3xl md:text-4xl leading-tight text-center"
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontStyle: "italic",
                    fontWeight: 400,
                    color: "#e2e8f0",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Como posso{" "}
                  <span style={{ color: theme.primary, fontWeight: 500 }}>ajudá-lo</span>
                  , senhor?
                </h1>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : 20 }}
                transition={{ duration: 0.8, delay: 1.1 }}
                className="w-full max-w-xl"
              >
                <div
                  className="flex items-stretch border transition-all duration-300"
                  style={{
                    borderColor: focused ? theme.primary : `${theme.primary}33`,
                    background: "rgba(3,5,10,0.8)",
                    boxShadow: focused ? `0 0 0 1px ${theme.primary}33, 0 0 30px ${theme.glow}` : "none",
                  }}
                >
                  <div
                    className="flex items-center px-3 border-r font-mono text-[10px] tracking-widest shrink-0"
                    style={{ borderColor: `${theme.primary}33`, color: theme.primary }}
                  >
                    CMD&nbsp;›
                  </div>
                  <input
                    ref={inputRef}
                    value={quick}
                    onChange={(e) => setQuick(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder="digite sua diretiva_"
                    className="flex-1 bg-transparent px-3 py-3 outline-none text-slate-100 placeholder:text-slate-700 font-mono text-sm"
                    autoFocus
                  />
                  <button
                    onMouseEnter={() => SFX.hover()}
                    onClick={send}
                    disabled={!quick.trim()}
                    className="px-4 font-mono text-[10px] tracking-widest transition-all disabled:opacity-30 shrink-0"
                    style={{
                      background: quick.trim() ? theme.primary : "transparent",
                      color: quick.trim() ? "#03050a" : theme.primary,
                    }}
                  >
                    EXEC
                  </button>
                </div>
                <div className="flex justify-between font-mono text-[8px] tracking-widest mt-2" style={{ color: `${theme.primary}66` }}>
                  <span>ENTER para executar</span>
                  <span>{quick.length} chars</span>
                </div>
              </motion.div>
            </div>

            <div
              className="border-t px-4 py-2 font-mono text-[9px] tracking-wider shrink-0 max-h-28 overflow-hidden"
              style={{ borderColor: `${theme.primary}22`, background: "rgba(3,5,10,0.6)" }}
            >
              <div className="flex items-center gap-2 mb-1" style={{ color: `${theme.primary}66` }}>
                <span>// LOG DO SISTEMA</span>
                <span className="w-1 h-1 animate-pulse" style={{ background: theme.primary }} />
              </div>
              {terminalLog.slice(-3).map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="py-0.5 truncate"
                  style={{ color: i === terminalLog.slice(-3).length - 1 ? theme.primary : `${theme.primary}66` }}
                >
                  {line}
                </motion.div>
              ))}
            </div>
          </div>

          <div
            className="col-span-12 lg:col-span-3 border-l flex flex-col min-h-0 backdrop-blur-sm"
            style={{ borderColor: `${theme.primary}22`, background: "rgba(3,5,10,0.4)" }}
          >
            <div
              className="px-4 py-2 border-b font-mono text-[9px] tracking-[0.3em]"
              style={{ borderColor: `${theme.primary}22`, color: `${theme.primary}66` }}
            >
              // 04 · MANIFESTO
            </div>

            <div className="px-4 py-3 border-b" style={{ borderColor: `${theme.primary}0f` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="font-mono text-[9px] tracking-widest" style={{ color: `${theme.primary}88` }}>
                  CPU.LOAD
                </div>
                <div className="font-mono text-[9px] tabular-nums" style={{ color: theme.primary }}>
                  {cpuHistory[cpuHistory.length - 1].toFixed(0)}%
                </div>
              </div>
              <svg viewBox="0 0 100 30" className="w-full h-8" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={theme.primary} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={theme.primary} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={`${cpuPath} L 100 30 L 0 30 Z`} fill="url(#cpuGrad)" />
                <path
                  d={cpuPath}
                  fill="none"
                  stroke={theme.primary}
                  strokeWidth="0.5"
                  style={{ filter: `drop-shadow(0 0 2px ${theme.primary})` }}
                />
              </svg>

              <div className="flex items-center justify-between mb-2 mt-3">
                <div className="font-mono text-[9px] tracking-widest" style={{ color: `${theme.primary}88` }}>
                  MEM.USAGE
                </div>
                <div className="font-mono text-[9px] tabular-nums" style={{ color: theme.accent }}>
                  {memHistory[memHistory.length - 1].toFixed(0)}%
                </div>
              </div>
              <svg viewBox="0 0 100 30" className="w-full h-8" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={theme.accent} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={`${memPath} L 100 30 L 0 30 Z`} fill="url(#memGrad)" />
                <path
                  d={memPath}
                  fill="none"
                  stroke={theme.accent}
                  strokeWidth="0.5"
                  style={{ filter: `drop-shadow(0 0 2px ${theme.accent})` }}
                />
              </svg>
            </div>

            <div className="px-4 py-3 border-b" style={{ borderColor: `${theme.primary}0f` }}>
              <div className="font-mono text-[9px] tracking-widest mb-3" style={{ color: `${theme.primary}88` }}>
                SYS.STATUS
              </div>
              <div className="space-y-1.5">
                {[
                  { l: "NET", v: 82, c: theme.primary },
                  { l: "PWR", v: 98, c: "#10b981" },
                  { l: "DISK", v: 34, c: theme.accent },
                  { l: "TEMP", v: 47, c: "#fbbf24" },
                ].map((m) => (
                  <div key={m.l} className="flex items-center gap-2">
                    <span className="font-mono text-[9px] w-10" style={{ color: `${theme.primary}88` }}>{m.l}</span>
                    <div className="flex-1 h-px" style={{ background: `${theme.primary}22` }}>
                      <motion.div
                        className="h-full"
                        style={{ background: m.c, boxShadow: `0 0 4px ${m.c}` }}
                        animate={{ width: `${m.v}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                    <span className="font-mono text-[9px] tabular-nums w-8 text-right" style={{ color: m.c }}>
                      {m.v}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-4 py-3 border-b" style={{ borderColor: `${theme.primary}0f` }}>
              <div className="font-mono text-[9px] tracking-widest mb-3" style={{ color: `${theme.primary}88` }}>
                ID · OPERADOR
              </div>
              <div className="font-mono text-[10px] text-slate-300 space-y-1.5">
                <div className="flex justify-between">
                  <span style={{ color: `${theme.primary}66` }}>NOME</span>
                  <span className="truncate ml-2">{user.email.split("@")[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: `${theme.primary}66` }}>NÍVEL</span>
                  <span>ADMIN</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: `${theme.primary}66` }}>STATUS</span>
                  <span style={{ color: "#10b981" }}>● ATIVO</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: `${theme.primary}66` }}>ID</span>
                  <span className="truncate ml-2">{user.id.slice(0, 8).toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-b flex-1 overflow-y-auto" style={{ borderColor: `${theme.primary}0f` }}>
              <div className="font-mono text-[9px] tracking-widest mb-3" style={{ color: `${theme.primary}88` }}>
                SESSÕES RECENTES
              </div>
              {threads.length === 0 ? (
                <div className="font-mono text-[10px]" style={{ color: `${theme.primary}44` }}>// vazio</div>
              ) : (
                <div className="space-y-2.5">
                  {threads.slice(0, 4).map((t) => (
                    <div
                      key={t.id}
                      onMouseEnter={() => SFX.hover()}
                      onClick={() => navigate({ to: "/chat/$threadId", params: { threadId: t.id } })}
                      className="cursor-pointer group"
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-mono text-[9px] mt-0.5" style={{ color: theme.primary }}>▸</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-mono text-[10px] text-slate-400 truncate group-hover:text-slate-100 transition">
                            {t.title}
                          </div>
                          <div className="font-mono text-[8px] mt-0.5" style={{ color: `${theme.primary}44` }}>
                            {new Date(t.updated_at).toLocaleDateString("pt-BR")}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-4 py-2 font-mono text-[8px] tracking-widest flex justify-between" style={{ color: `${theme.primary}44` }}>
              <span>v2.0.4</span>
              <span>© STARK 2026</span>
            </div>
          </div>
        </div>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: booted ? 1 : 0 }}
          transition={{ delay: 1.4 }}
          className="border-t px-6 py-2 flex items-center justify-between font-mono text-[9px] tracking-[0.25em] gap-4"
          style={{ borderColor: `${theme.primary}22`, color: `${theme.primary}55`, background: "rgba(3,5,10,0.6)" }}
        >
          <div className="flex items-center gap-3">
            <span className="w-1 h-1 animate-pulse" style={{ background: theme.primary }} />
            <span>SISTEMA OPERACIONAL</span>
          </div>
          <div className="hidden md:flex items-center gap-3 flex-1 justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.span
                key={tipIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="truncate"
                style={{ color: `${theme.primary}99` }}
              >
                ◈ {TIPS[tipIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
          <span>ALL SYSTEMS NOMINAL</span>
        </motion.footer>
      </div>
    </div>
  );
}