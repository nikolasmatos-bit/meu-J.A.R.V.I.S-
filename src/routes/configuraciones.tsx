import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { loadSettings, saveSettings, JarvisSettings } from "../lib/settings";

export function SettingsPage() {
  const [s, setS] = useState<JarvisSettings>(loadSettings());
  const navigate = useNavigate();

  const update = (patch: Partial<JarvisSettings>) => {
    const next = { ...s, ...patch };
    setS(next);
    saveSettings(next);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="flex justify-between items-center border-b border-cyan-400/20 pb-4">
          <h1 className="font-orbitron text-2xl text-cyan-300 tracking-widest">CONFIGURAÇÕES</h1>
          <button onClick={() => navigate({ to: "/" })} className="text-cyan-400 hover:text-cyan-200 text-sm">← Voltar</button>
        </header>
        <Section title="TOM DE VOZ">
          {(["formal", "classic", "casual"] as const).map((t) => (
            <Option key={t} active={s.tone === t} onClick={() => update({ tone: t })}>
              {t === "formal" ? "Formal" : t === "classic" ? "Clássico (padrão)" : "Descontraído"}
            </Option>
          ))}
        </Section>
        <Section title="EXTENSÃO DAS RESPOSTAS">
          {(["concise", "detailed"] as const).map((l) => (
            <Option key={l} active={s.length === l} onClick={() => update({ length: l })}>
              {l === "concise" ? "Conciso" : "Detalhado"}
            </Option>
          ))}
        </Section>
        <Section title={`VOLUME — ${(s.volume * 100).toFixed(0)}%`}>
          <input type="range" min={0} max={1} step={0.05} value={s.volume} onChange={(e) => update({ volume: parseFloat(e.target.value) })} className="w-full accent-cyan-400" />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xs tracking-widest text-cyan-400/70">{title}</h2>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Option({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded border transition-all ${active ? "bg-cyan-500/20 border-cyan-400 text-cyan-100" : "bg-slate-900 border-slate-700 text-slate-400 hover:border-cyan-400/50"}`}>
      {children}
    </button>
  );
}
