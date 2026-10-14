import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { SFX } from "../../lib/sfx";

type Fact = { id: string; fact: string; created_at: string };

type Props = {
  open: boolean;
  onClose: () => void;
  facts: Fact[];
  onFactsChange: (facts: Fact[]) => void;
  userId: string;
};

export function MemoryPanel({ open, onClose, facts, onFactsChange, userId }: Props) {
  const [newFact, setNewFact] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [saving, setSaving] = useState(false);

  const addFact = async () => {
    if (!newFact.trim()) return;
    setSaving(true);
    SFX.click();
    const { data, error } = await supabase
      .from("user_facts")
      .insert({ user_id: userId, fact: newFact.trim() })
      .select()
      .single();

    if (!error && data) {
      onFactsChange([...facts, data]);
      setNewFact("");
      SFX.responseDone();
    }
    setSaving(false);
  };

  const deleteFact = async (id: string) => {
    SFX.error();
    const { error } = await supabase.from("user_facts").delete().eq("id", id);
    if (!error) onFactsChange(facts.filter((f) => f.id !== id));
  };

  const startEdit = (f: Fact) => {
    setEditingId(f.id);
    setEditingText(f.fact);
    SFX.click();
  };

  const saveEdit = async () => {
    if (!editingId) return;
    SFX.click();
    const { error } = await supabase
      .from("user_facts")
      .update({ fact: editingText.trim() })
      .eq("id", editingId);

    if (!error) {
      onFactsChange(
        facts.map((f) => (f.id === editingId ? { ...f, fact: editingText.trim() } : f))
      );
      setEditingId(null);
      setEditingText("");
    }
  };

  const clearAll = async () => {
    if (!confirm("Apagar TODAS as memórias? Isso não pode ser desfeito.")) return;
    SFX.error();
    const { error } = await supabase.from("user_facts").delete().eq("user_id", userId);
    if (!error) onFactsChange([]);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[90]"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-[100] bg-slate-950 border-l border-cyan-500/30 shadow-2xl overflow-hidden flex flex-col"
            style={{
              boxShadow: "-20px 0 60px rgba(34, 211, 238, 0.15)",
            }}
          >
            {/* Cantos HUD */}
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-cyan-400/60" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-400/60" />

            {/* Header */}
            <div className="p-5 border-b border-cyan-500/20 backdrop-blur-xl bg-slate-950/80">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 rounded-full border-2 border-cyan-400/60 border-t-transparent"
                  />
                  <div>
                    <h2
                      className="font-orbitron text-lg text-cyan-300 tracking-[0.2em]"
                      style={{ textShadow: "0 0 10px #22d3ee" }}
                    >
                      MEMÓRIA
                    </h2>
                    <div className="text-[9px] font-mono text-cyan-400/50 tracking-widest">
                      O QUE J.A.R.V.I.S. SABE SOBRE VOCÊ
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Add new */}
            <div className="p-5 border-b border-cyan-500/20">
              <div className="text-[10px] font-mono tracking-widest text-cyan-400/70 mb-2">
                ▸ ADICIONAR NOVA MEMÓRIA
              </div>
              <div className="flex gap-2">
                <input
                  value={newFact}
                  onChange={(e) => setNewFact(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addFact()}
                  placeholder="Ex: Meu nome é Nikolas"
                  className="flex-1 bg-slate-900/60 border border-cyan-500/30 rounded px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-cyan-400 transition"
                />
                <button
                  onClick={addFact}
                  disabled={saving || !newFact.trim()}
                  className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-sm transition"
                >
                  +
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-5">
              {facts.length === 0 ? (
                <div className="text-center py-12">
                  <motion.div
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="font-orbitron text-xs tracking-[0.3em] text-cyan-400/50 mb-3"
                  >
                    NENHUMA MEMÓRIA AINDA
                  </motion.div>
                  <div className="text-xs text-slate-500 leading-relaxed">
                    Converse com o JARVIS e ele vai aprender sobre você.
                    <br />
                    Ou adicione manualmente acima.
                  </div>
                </div>
              ) : (
                <ul className="space-y-2">
                  {facts.map((f, i) => (
                    <motion.li
                      key={f.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="group relative p-3 rounded-lg border border-cyan-500/20 hover:border-cyan-400/50 bg-slate-900/40 backdrop-blur-sm transition-all"
                    >
                      {/* Cantos HUD mini */}
                      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400/40" />
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400/40" />

                      {editingId === f.id ? (
                        <div className="flex gap-2">
                          <input
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit();
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            autoFocus
                            className="flex-1 bg-slate-950/60 border border-cyan-500/50 rounded px-2 py-1 text-sm text-slate-100 outline-none"
                          />
                          <button
                            onClick={saveEdit}
                            className="text-cyan-400 hover:text-cyan-200 text-xs px-2"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-red-400 hover:text-red-300 text-xs px-2"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] mt-1.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-slate-200 break-words">{f.fact}</div>
                            <div className="text-[9px] font-mono text-slate-600 mt-1 tracking-widest">
                              {new Date(f.created_at).toLocaleDateString("pt-BR")}
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={() => startEdit(f)}
                              className="w-6 h-6 rounded text-cyan-400 hover:bg-cyan-500/10 text-xs transition flex items-center justify-center"
                              title="Editar"
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => deleteFact(f.id)}
                              className="w-6 h-6 rounded text-red-400 hover:bg-red-500/10 text-xs transition flex items-center justify-center"
                              title="Apagar"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {facts.length > 0 && (
              <div className="p-5 border-t border-cyan-500/20 bg-slate-950/80">
                <div className="flex justify-between items-center">
                  <div className="text-[10px] font-mono text-cyan-400/50 tracking-widest">
                    {facts.length} {facts.length === 1 ? "MEMÓRIA" : "MEMÓRIAS"}
                  </div>
                  <button
                    onClick={clearAll}
                    className="text-[10px] font-mono tracking-widest text-red-400 hover:text-red-300 transition px-3 py-1.5 border border-red-500/30 hover:border-red-400 rounded"
                  >
                    APAGAR TUDO
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}