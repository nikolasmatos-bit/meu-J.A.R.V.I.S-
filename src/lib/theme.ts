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
  voicePitch: number;
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
    voicePitch: 1,
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
    voicePitch: 1.2,
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
    voicePitch: 0.6,
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
    voicePitch: 1.15,
  },
};

export type ReasoningMode = "fast" | "deep" | "creative" | "expert" | "debate" | "roleplay";

export type Mode = {
  id: ReasoningMode;
  name: string;
  emoji: string;
  desc: string;
  color: string;
  systemPrompt: string;
  temperature: number;
};

export const MODES: Record<ReasoningMode, Mode> = {
  fast: {
    id: "fast",
    name: "RÁPIDO",
    emoji: "⚡",
    desc: "Respostas curtas e diretas",
    color: "#10b981",
    systemPrompt: "MODO RÁPIDO: seja extremamente conciso. Máximo 3 parágrafos curtos.",
    temperature: 0.5,
  },
  deep: {
    id: "deep",
    name: "PROFUNDO",
    emoji: "🧠",
    desc: "Raciocínio passo a passo",
    color: "#8b5cf6",
    systemPrompt: "MODO PROFUNDO: raciocine passo a passo.",
    temperature: 0.7,
  },
  creative: {
    id: "creative",
    name: "CRIATIVO",
    emoji: "🎨",
    desc: "Imaginação máxima",
    color: "#ec4899",
    systemPrompt: "MODO CRIATIVO: use metáforas vívidas e imaginação fértil.",
    temperature: 1.1,
  },
  expert: {
    id: "expert",
    name: "EXPERT",
    emoji: "🔬",
    desc: "Técnico e preciso",
    color: "#06b6d4",
    systemPrompt: "MODO EXPERT: seja técnico, preciso e detalhado.",
    temperature: 0.4,
  },
  debate: {
    id: "debate",
    name: "DEBATE",
    emoji: "⚖️",
    desc: "Argumenta os dois lados",
    color: "#f59e0b",
    systemPrompt: "MODO DEBATE: apresente argumentos dos DOIS lados.",
    temperature: 0.8,
  },
  roleplay: {
    id: "roleplay",
    name: "ROLEPLAY",
    emoji: "🎭",
    desc: "Assume personagens",
    color: "#ef4444",
    systemPrompt: "MODO ROLEPLAY: assuma completamente qualquer personagem.",
    temperature: 1.0,
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

// ✅ PADRÃO: RÁPIDO (para economizar tokens no grátis)
export function loadMode(): ReasoningMode {
  if (typeof window === "undefined") return "fast";
  const saved = localStorage.getItem("jarvis.mode") as ReasoningMode;
  return saved && MODES[saved] ? saved : "fast";
}

export function saveMode(m: ReasoningMode) {
  localStorage.setItem("jarvis.mode", m);
}