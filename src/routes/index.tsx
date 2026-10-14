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

const PERSONAS_LIST: { id: Persona; label: string; code: string }[] = [
  { id: "jarvis", label: "J.A.R.V.I.S.", code: "JVS-04" },
  { id: "friday", label: "F.R.I.D.A.Y.", code: "FRD-05" },
  { id: "ultron", label: "ULTRON", code: "ULT-06" },
  { id: "sextafeira", label: "SEXTA-FEIRA", code: "SXT-07" },
];

const BOOT_LOG = [
  "init:: neural_core",
  "load:: personality_matrix",
  "link:: stark_industries",
  "sync:: memory_bank",
  "check:: threat_scan ............ clear",
  "auth:: operator verified",
  "ready.",
];

export function HomePage() {
  const { user } = useJarvis();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [filtered, setFiltered] = useState<Thread[]>([]);
  const [search, setSearch] = useState("");
  const [booted, setBooted] = useState(false);
  const [bootLines, setBootLines] = useState<number>(0);
  const [time, setTime] = useState(new Date());
  const [persona, setPersona] = useState<Persona>("jarvis");
  const [quick, setQuick] = useState("");
  const [focused, setFocused] = useState(false);
  const [personaOpen, setPersonaOpen] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const theme = THEMES[persona];

  useEffect(() => {
    const p = loadPersona();
    setPersona(p);
    applyTheme(p);
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

  // Terminal log rotativo
  useEffect(() => {
    if (!booted) return;
    const logs = [
      "ping :: latency 12ms",
      "scan :: no threats detected",
      "sync :: cloud status OK",
      "proc :: neural engine 98.4%",
      "link :: satellite uplink stable",
      "auth :: operator authenticated",
    ];
    let i = 0;
    const t = setInterval(() => {
      setTerminalLines((prev) => [...prev.slice(-4), `[${new Date().toLocaleTimeString("pt-BR")}] ${logs[i % logs.length]}`]);
      i++;
    }, 2500);
    return () => clearInterval(t);
  }, [booted]);

  useEffect(() => {
    supabase
      .from("threads")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .then(({ data }) => { setThreads(data ?? []); setFiltered(data ?? []); });
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

  const switchPersona = (p: Persona) => {
    setPersona(p);
    applyTheme(p);
    setPersonaOpen(false);
    SFX.personaSwitch();
  };

  const currentPersona = PERSONAS_LIST.find((p) => p.id === persona)!;
  const greeting = time.getHours() < 12 ? "BOM DIA" : time.getHours() < 18 ? "BOA TARDE" : "BOA NOITE";

  return (
    <div className="min-h-screen text-slate-100 relative overflow-hidden bg-[#05070d]">
      <MouseTrail />

      {/* BLUEPRINT GRID — fino e técnico */}
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
        }}
      />

      {/* Watermark vertical gigante */}
      <div
        className="fixed top-1/2 -translate-y-1/2 font-orbitron select-none pointer-events-none z-0 hidden lg:block"
        style={{
          right: "-2rem",
          fontSize: "200px",
          lineHeight: 1,
          color: `${theme.primary}08`,
          writingMode: "vertical-rl",
          transform: "translateY(-50%) rotate(180deg)",
          letterSpacing: "0.1em",
        }}
      >
        {currentPersona.code}
      </div>

      {/* Rail esquerdo — vertical */}
      <div
        className="fixed left-0 top-0 bottom-0 w-8 border-r z-20 hidden md:flex flex-col items-center justify-between py-4 shrink-0"
        style={{ borderColor: `${theme.primary}22`, background: "rgba(5,7,13,0.7)" }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4 border"
          style={{ borderColor: theme.primary, borderTopColor: "transparent" }}
        />
        <div
          className="font-mono text-[9px] tracking-[0.4em] rotate-180"
          style={{ color: `${theme.primary}66`, writingMode: "vertical-rl" }}
        >
          STARK INDUSTRIES · 04.2
        </div>
        <div
          className="font-mono text-[9px] tracking-[0.3em]"
          style={{ color: `${theme.primary}66`, writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          SYS.v2.0.4
        </div>
      </div>

      {/* Rail direito — vertical */}
      <div
        className="fixed right-0 top-0 bottom-0 w-8 border-l z-20 hidden md:flex flex-col items-center justify-between py-4 shrink-0"
        style={{ borderColor: `${theme.primary}22`, background: "rgba(5,7,13,0.7)" }}
      >
        <div
          className="font-mono text-[9px] tracking-[0.3em]"
          style={{ color: `${theme.primary}66`, writingMode: "vertical-rl" }}
        >
          LAT -23.5505
        </div>
        <div className="w-px h-16" style={{ background: `${theme.primary}44` }} />
        <div
          className="font-mono text-[9px] tracking-[0.3em]"
          style={{ color: `${theme.primary}66`, writingMode: "vertical-rl" }}
        >
          LNG -46.6333
        </div>
        <div className="w-px h-16" style={{ background: `${theme.primary}44` }} />
        <div
          className="font-mono text-[9px] tracking-[0.3em]"
          style={{ color: `${theme.primary}66`, writingMode: "vertical-rl" }}
        >
          SEC-7G
        </div>
      </div>

      {/* Boot overlay */}
      <AnimatePresence>
        {!booted && (
          <motion.div
            key="boot"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-[#05070d] flex items-center justify-center px-6"
          >
            <div className="font-mono text-sm w-full max-w-lg">
              <div className="mb-6" style={{ color: theme.primary }}>
                <span style={{ color: `${theme.primary}66` }}>┌─[</span> STARK MAINFRAME v2.0.4 <span style={{ color: `${theme.primary}66` }}>]─┐</span>
              </div>
              {BOOT_LOG.slice(0, bootLines).map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="py-0.5"
                  style={{ color: `${theme.primary}cc` }}
                >
                  <span style={{ color: `${theme.primary}66` }}>[{String(i).padStart(2, "0")}]</span> {line}
                </motion.div>
              ))}
              {bootLines >= BOOT_LOG.length && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 flex items-center gap-2" style={{ color: theme.primary }}>
                  <span className="w-2 h-2 animate-pulse" style={{ background: theme.primary }} />
                  ready for input
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTEÚDO */}
      <div className="relative z-10 pl-0 md:pl-8 pr-0 md:pr-8 min-h-screen flex flex-col">
        {/* Top bar — coordenadas e status */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : -20 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex items-center justify-between px-6 py-3 border-b font-mono text-[10px] tracking-[0.25em] gap-4 flex-wrap"
          style={{ borderColor: `${theme.primary}22` }}
        >
          <div className="flex items-center gap-4" style={{ color: `${theme.primary}99` }}>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 animate-pulse" style={{ background: theme.primary }} />
              ONLINE
            </span>
            <span className="text-slate-600">|</span>
            <span className="tabular-nums">{time.toLocaleTimeString("pt-BR")}</span>
            <span className="text-slate-600 hidden md:inline">|</span>
            <span className="hidden md:inline">
              {time.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).toUpperCase()}
            </span>
            <span className="text-slate-600 hidden lg:inline">|</span>
            <span className="hidden lg:inline">{greeting}, {user.email.split("@")[0].toUpperCase()}</span>
          </div>

          {/* Persona switcher */}
          <div className="relative">
            <button
              onMouseEnter={() => SFX.hover()}
              onClick={() => { SFX.menuOpen(); setPersonaOpen((v) => !v); }}
              className="flex items-center gap-2 px-2 py-1 transition-all"
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
                  className="absolute top-full right-0 mt-1 z-[100] border min-w-[180px]"
                  style={{ background: "#05070d", borderColor: `${theme.primary}44` }}
                >
                  {PERSONAS_LIST.map((p) => {
                    const pt = THEMES[p.id];
                    const active = persona === p.id;
                    return (
                      <button
                        key={p.id}
                        onMouseEnter={() => SFX.hover()}
                        onClick={() => switchPersona(p.id)}
                        className="w-full text-left px-3 py-2 text-[10px] font-mono tracking-widest transition-all flex items-center gap-2"
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

        {/* GRID PRINCIPAL — 3 colunas assimétricas */}
        <div className="flex-1 grid grid-cols-12 gap-0 min-h-0">
          {/* COLUNA ESQUERDA (histórico) — 3 cols */}
          <div
            className="col-span-12 lg:col-span-3 border-r flex flex-col min-h-0"
            style={{ borderColor: `${theme.primary}22` }}
          >
            <div className="px-4 py-3 border-b" style={{ borderColor: `${theme.primary}22` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="font-mono text-[9px] tracking-[0.3em]" style={{ color: `${theme.primary}66` }}>
                  // REGISTRO
                </div>
                <button
                  onMouseEnter={() => SFX.hover()}
                  onClick={() => newThread()}
                  className="font-mono text-[9px] tracking-[0.2em] px-2 py-0.5 transition-all"
                  style={{ color: theme.primary, border: `1px solid ${theme.primary}44` }}
                >
                  + NOVO
                </button>
              </div>
              <div
                className="flex items-center gap-2 px-2 py-1 border-b"
                style={{ borderColor: `${theme.primary}22` }}
              >
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
                    style={{ borderColor: `${theme.primary}11` }}
                    onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = `${theme.primary}08`; }}
                    onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <span className="font-mono text-[9px] tabular-nums" style={{ color: `${theme.primary}44` }}>
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
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm("Apagar?")) return;
                        await supabase.from("threads").delete().eq("id", t.id);
                        setThreads((x) => x.filter((y) => y.id !== t.id));
                        SFX.error();
                      }}
                      className="opacity-0 group-hover:opacity-100 font-mono text-[10px] transition"
                      style={{ color: "#ef4444" }}
                    >
                      ×
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {/* User footer */}
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
                  className="flex-1 py-1 font-mono text-[9px] tracking-widest border transition-all"
                  style={{ borderColor: `${theme.primary}33`, color: `${theme.primary}99` }}
                >
                  CONFIG
                </button>
                <button
                  onMouseEnter={() => SFX.hover()}
                  onClick={() => supabase.auth.signOut()}
                  className="flex-1 py-1 font-mono text-[9px] tracking-widest border transition-all"
                  style={{ borderColor: "#ef444433", color: "#ef444499" }}
                >
                  SAIR
                </button>
              </div>
            </div>
          </div>

          {/* COLUNA CENTRAL (hero) — 6 cols */}
          <div className="col-span-12 lg:col-span-6 flex flex-col min-h-0 relative">
            {/* Number header */}
            <div className="px-6 py-2 border-b flex items-center justify-between font-mono text-[9px] tracking-[0.3em]" style={{ borderColor: `${theme.primary}22`, color: `${theme.primary}66` }}>
              <span>// 01 · CONSOLE PRINCIPAL</span>
              <span className="tabular-nums">{time.toLocaleTimeString("pt-BR")}</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 overflow-y-auto relative">
              {/* Helmet à direita, off-center */}
              <div className="w-full flex items-start justify-center relative">
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: booted ? 1 : 0, scale: 1 }}
                  transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="relative translate-x-8 md:translate-x-16"
                >
                  {/* Crosshair */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <motion.div
                        key={i}
                        className="absolute"
                        style={{
                          width: `${240 + i * 70}px`,
                          height: `${240 + i * 70}px`,
                          border: `1px ${i % 2 === 0 ? "dashed" : "solid"} ${theme.primary}${i === 1 ? "33" : "14"}`,
                        }}
                        animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                        transition={{ duration: 30 + i * 15, repeat: Infinity, ease: "linear" }}
                      />
                    ))}
                    {/* Cross lines */}
                    <div className="absolute left-0 right-0 h-px" style={{ background: `${theme.primary}22` }} />
                    <div className="absolute top-0 bottom-0 w-px" style={{ background: `${theme.primary}22` }} />
                  </div>
                  <IronManHelmet state="idle" />
                  {/* Annotation callouts */}
                  <div className="absolute -right-2 top-8 hidden md:block">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-px" style={{ background: `${theme.primary}66` }} />
                      <div className="font-mono text-[8px] tracking-widest" style={{ color: `${theme.primary}88` }}>
                        MK-VII
                      </div>
                    </div>
                  </div>
                  <div className="absolute -left-2 bottom-12 hidden md:block">
                    <div className="flex items-center gap-2">
                      <div className="font-mono text-[8px] tracking-widest" style={{ color: `${theme.primary}88` }}>
                        ALLOY-C
                      </div>
                      <div className="w-12 h-px" style={{ background: `${theme.primary}66` }} />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Hero — tipografia editorial */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : 20 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="w-full max-w-xl mt-6 mb-4 relative -translate-x-4"
              >
                <div className="font-mono text-[9px] tracking-[0.4em] mb-2" style={{ color: `${theme.primary}88` }}>
                  // 02 · DIRETIVA
                </div>
                <h1
                  className="text-3xl md:text-4xl leading-tight"
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontStyle: "italic",
                    fontWeight: 400,
                    color: "#e2e8f0",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Como posso <span style={{ color: theme.primary, fontWeight: 500 }}>ajudá-lo</span>, senhor?
                </h1>
              </motion.div>

              {/* Input — prompt terminal */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : 20 }}
                transition={{ duration: 0.8, delay: 1 }}
                className="w-full max-w-xl"
              >
                <div
                  className="flex items-stretch border transition-all duration-300"
                  style={{
                    borderColor: focused ? theme.primary : `${theme.primary}33`,
                    background: "#05070d",
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
                    style={{ background: quick.trim() ? theme.primary : "transparent", color: quick.trim() ? "#05070d" : theme.primary }}
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

            {/* TERMINAL LOG — bottom */}
            <div
              className="border-t px-4 py-2 font-mono text-[9px] tracking-wider shrink-0 max-h-32 overflow-hidden"
              style={{ borderColor: `${theme.primary}22`, background: "rgba(5,7,13,0.6)" }}
            >
              <div className="flex items-center gap-2 mb-1" style={{ color: `${theme.primary}66` }}>
                <span>// LOG DO SISTEMA</span>
                <span className="w-1 h-1 animate-pulse" style={{ background: theme.primary }} />
              </div>
              {terminalLines.slice(-3).map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="py-0.5 truncate"
                  style={{ color: i === terminalLines.slice(-3).length - 1 ? theme.primary : `${theme.primary}66` }}
                >
                  {line}
                </motion.div>
              ))}
            </div>
          </div>

          {/* COLUNA DIREITA (manifest) — 3 cols */}
          <div
            className="col-span-12 lg:col-span-3 border-l flex flex-col min-h-0"
            style={{ borderColor: `${theme.primary}22` }}
          >
            <div className="px-4 py-2 border-b font-mono text-[9px] tracking-[0.3em]" style={{ borderColor: `${theme.primary}22`, color: `${theme.primary}66` }}>
              // 03 · MANIFESTO
            </div>

            {/* Module 01 */}
            <div className="px-4 py-3 border-b" style={{ borderColor: `${theme.primary}11` }}>
              <div className="font-mono text-[9px] tracking-widest mb-3" style={{ color: `${theme.primary}88` }}>
                SYS.CRITICAL
              </div>
              {[
                { l: "CPU", v: 43, c: theme.primary },
                { l: "MEM", v: 67, c: theme.accent },
                { l: "NET", v: 82, c: theme.primary },
                { l: "PWR", v: 98, c: "#10b981" },
              ].map((m) => (
                <div key={m.l} className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-[9px] w-8" style={{ color: `${theme.primary}88` }}>{m.l}</span>
                  <div className="flex-1 h-0.5" style={{ background: `${theme.primary}22` }}>
                    <motion.div
                      className="h-full"
                      style={{ background: m.c, boxShadow: `0 0 6px ${m.c}` }}
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

            {/* Module 02 */}
            <div className="px-4 py-3 border-b" style={{ borderColor: `${theme.primary}11` }}>
              <div className="font-mono text-[9px] tracking-widest mb-3" style={{ color: `${theme.primary}88` }}>
                ID · OPERADOR
              </div>
              <div className="font-mono text-[10px] text-slate-300 space-y-1">
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
              </div>
            </div>

            {/* Module 03 — recentes */}
            <div className="px-4 py-3 border-b flex-1 overflow-y-auto" style={{ borderColor: `${theme.primary}11` }}>
              <div className="font-mono text-[9px] tracking-widest mb-3" style={{ color: `${theme.primary}88` }}>
                SESSÕES RECENTES
              </div>
              {threads.length === 0 ? (
                <div className="font-mono text-[10px]" style={{ color: `${theme.primary}44` }}>// vazio</div>
              ) : (
                <div className="space-y-2">
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

            {/* Footer rail */}
            <div className="px-4 py-2 font-mono text-[8px] tracking-widest flex justify-between" style={{ color: `${theme.primary}44` }}>
              <span>v2.0.4</span>
              <span>© STARK 2026</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: booted ? 1 : 0 }}
          transition={{ delay: 1.4 }}
          className="border-t px-6 py-2 flex items-center justify-between font-mono text-[9px] tracking-[0.25em] gap-4"
          style={{ borderColor: `${theme.primary}22`, color: `${theme.primary}55` }}
        >
          <div className="flex items-center gap-3">
            <span className="w-1 h-1 animate-pulse" style={{ background: theme.primary }} />
            <span>SISTEMA OPERACIONAL</span>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <span>◈ {threads.length} SESSÕES</span>
            <span>◈ {currentPersona.code}</span>
            <span>◈ SEC-7G</span>
          </div>
          <span>ALL SYSTEMS NOMINAL</span>
        </motion.footer>
      </div>
    </div>
  );
}