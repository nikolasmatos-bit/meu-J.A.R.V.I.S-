export type Persona = "jarvis" | "friday" | "ultron" | "sextafeira";

export type Theme = {
  primary: string;
  primaryRgb: string;
  accent: string;
  accentRgb: string;
  glow: string;
  bg: string;
  name: string;
  emoji: string;
  tagline: string;
};

export const THEMES: Record<Persona, Theme> = {
  jarvis: {
    primary: "#22d3ee",
    primaryRgb: "34, 211, 238",
    accent: "#0ea5e9",
    accentRgb: "14, 165, 233",
    glow: "rgba(34, 211, 238, 0.5)",
    bg: "rgba(34, 211, 238, 0.08)",
    name: "J.A.R.V.I.S.",
    emoji: "◆",
    tagline: "Just A Rather Very Intelligent System",
  },
  friday: {
    primary: "#a855f7",
    primaryRgb: "168, 85, 247",
    accent: "#ec4899",
    accentRgb: "236, 72, 153",
    glow: "rgba(168, 85, 247, 0.6)",
    bg: "rgba(168, 85, 247, 0.08)",
    name: "F.R.I.D.A.Y.",
    emoji: "◈",
    tagline: "Female Replacement Intelligent Digital Assistant Youth",
  },
  ultron: {
    primary: "#ef4444",
    primaryRgb: "239, 68, 68",
    accent: "#7f1d1d",
    accentRgb: "127, 29, 29",
    glow: "rgba(239, 68, 68, 0.7)",
    bg: "rgba(239, 68, 68, 0.08)",
    name: "U.L.T.R.O.N.",
    emoji: "◉",
    tagline: "There are no strings on me",
  },
  sextafeira: {
    primary: "#fbbf24",
    primaryRgb: "251, 191, 36",
    accent: "#f97316",
    accentRgb: "249, 115, 22",
    glow: "rgba(251, 191, 36, 0.6)",
    bg: "rgba(251, 191, 36, 0.08)",
    name: "SEXTA-FEIRA",
    emoji: "★",
    tagline: "A assistente brasileira mais braba",
  },
};

export function applyTheme(persona: Persona) {
  const t = THEMES[persona];
  const root = document.documentElement;
  root.style.setProperty("--theme-primary", t.primary);
  root.style.setProperty("--theme-primary-rgb", t.primaryRgb);
  root.style.setProperty("--theme-accent", t.accent);
  root.style.setProperty("--theme-accent-rgb", t.accentRgb);
  root.style.setProperty("--theme-glow", t.glow);
  root.style.setProperty("--theme-bg", t.bg);
  root.setAttribute("data-persona", persona);
  localStorage.setItem("jarvis.persona", persona);
}

export function loadPersona(): Persona {
  if (typeof window === "undefined") return "jarvis";
  const saved = localStorage.getItem("jarvis.persona") as Persona;
  return saved && THEMES[saved] ? saved : "jarvis";
}