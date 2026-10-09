import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { LoginPage } from "../../routes/login";

type Ctx = { user: any; loading: boolean };
const JarvisCtx = createContext<Ctx>({ user: null, loading: true });

export function Bootstrap({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="font-orbitron text-cyan-300 tracking-widest animate-pulse">
          INICIALIZANDO J.A.R.V.I.S…
        </div>
      </div>
    );

  if (!user) return <LoginPage />;

  return <JarvisCtx.Provider value={{ user, loading }}>{children}</JarvisCtx.Provider>;
}

export const useJarvis = () => useContext(JarvisCtx);
