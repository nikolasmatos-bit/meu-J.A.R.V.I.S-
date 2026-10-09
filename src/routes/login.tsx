import { useState } from "react";
import { supabase } from "../lib/supabase";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const magic = async () => {
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) alert(error.message);
    else setSent(true);
  };

  const google = () =>
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md p-8 border border-cyan-400/30 rounded-xl bg-slate-900/60 backdrop-blur">
        <h1 className="font-orbitron text-3xl text-cyan-300 tracking-widest text-center mb-2">J.A.R.V.I.S.</h1>
        <p className="text-xs text-center text-cyan-400/60 tracking-widest mb-8">JUST A RATHER VERY INTELLIGENT SYSTEM</p>
        {sent ? (
          <p className="text-center text-cyan-200">✉ Link mágico enviado para <b>{email}</b>. Verifique sua caixa de entrada.</p>
        ) : (
          <>
            <button onClick={google} className="w-full py-3 mb-4 rounded border border-cyan-400/40 hover:border-cyan-300 bg-slate-800/50 text-cyan-100 font-medium transition">
              Entrar com Google
            </button>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-cyan-400/20" />
              <span className="text-xs text-slate-500">ou</span>
              <div className="flex-1 h-px bg-cyan-400/20" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full bg-slate-900 border border-cyan-400/30 rounded px-3 py-2 mb-3 outline-none focus:border-cyan-300 text-slate-100"
            />
            <button onClick={magic} disabled={loading} className="w-full py-3 rounded bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-semibold transition">
              {loading ? "Enviando…" : "Enviar link mágico"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
