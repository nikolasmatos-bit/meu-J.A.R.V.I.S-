import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "../lib/supabase";
import { useJarvis } from "../components/jarvis/Bootstrap";
import { SystemWidgets } from "../components/jarvis/SystemWidgets";
import { IronManHelmet } from "../components/jarvis/IronManHelmet";
import { SFX } from "../lib/sfx";

export function HomePage() {
  const { user } = useJarvis();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<any[]>([]);

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
    if (!confirm("Apagar esta conversa e todas as mensagens?")) return;
    await supabase.from("threads").delete().eq("id", id);
    setThreads((t) => t.filter((x) => x.id !== id));
    SFX.error();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative">
      <header className="p-4 border-b border-cyan-400/20 flex justify-between items-center relative z-10">
        <h1 className="font-orbitron text-cyan-300 tracking-widest">J.A.R.V.I.S.</h1>
        <div className="flex gap-3 items-center text-sm">
          <span className="text-slate-400">{user.email}</span>
          <button
            onClick={() => navigate({ to: "/configuraciones" })}
            className="text-cyan-400 hover:text-cyan-200"
          >
            ⚙
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-red-400 hover:text-red-300"
          >
            Sair
          </button>
        </div>
      </header>

      {/* CAPACETE DO HOMEM DE FERRO */}
      <div className="py-12 relative z-10">
        <IronManHelmet state="idle" />
      </div>

      <div className="mb-10 relative z-10">
        <SystemWidgets />
      </div>

      <main className="max-w-4xl mx-auto px-6 pb-16 relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-orbitron text-sm tracking-widest text-cyan-400/70">
            CONVERSAS
          </h2>
          <button
            onClick={newThread}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded text-sm"
          >
            + Nova conversa
          </button>
        </div>

        {threads.length === 0 ? (
          <p className="text-slate-500 text-center py-12">
            Nenhuma conversa ainda. Inicie uma nova, senhor.
          </p>
        ) : (
          <ul className="space-y-2">
            {threads.map((t) => (
              <li
                key={t.id}
                onClick={() =>
                  navigate({ to: "/chat/$threadId", params: { threadId: t.id } })
                }
                className="group flex justify-between items-center p-4 border border-cyan-400/15 hover:border-cyan-400/50 rounded cursor-pointer bg-slate-900/40 transition"
              >
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-slate-500">
                    {new Date(t.updated_at).toLocaleString("pt-BR")}
                  </div>
                </div>
                <button
                  onClick={(e) => remove(t.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}