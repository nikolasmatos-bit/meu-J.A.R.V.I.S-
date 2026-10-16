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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#03050a]">
        <div className="font-orbitron text-cyan-300 tracking-[0.4em] text-sm animate-pulse">
          INICIALIZANDO…
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return <JarvisCtx.Provider value={{ user, loading }}>{children}</JarvisCtx.Provider>;
}

export const useJarvis = () => useContext(JarvisCtx);