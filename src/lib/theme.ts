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

// ============================================
// MODOS DE RACIOCÍNIO
// ============================================
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
    systemPrompt: "Modo RÁPIDO: seja extremamente conciso. Máximo 3 parágrafos curtos. Vá direto ao ponto.",
    temperature: 0.5,
  },
  deep: {
    id: "deep",
    name: "PROFUNDO",
    emoji: "🧠",
    desc: "Raciocínio passo a passo",
    color: "#8b5cf6",
    systemPrompt: "Modo PROFUNDO: raciocine passo a passo. Mostre seu pensamento entre [thinking]...[/thinking] ANTES da resposta final. Depois dê a resposta completa e estruturada.",
    temperature: 0.7,
  },
  creative: {
    id: "creative",
    name: "CRIATIVO",
    emoji: "🎨",
    desc: "Imaginação máxima",
    color: "#ec4899",
    systemPrompt: "Modo CRIATIVO: use metáforas vívidas, analogias inesperadas e imaginação fértil. Ouse nas ideias. Traga ângulos que ninguém pensou.",
    temperature: 1.1,
  },
  expert: {
    id: "expert",
    name: "EXPERT",
    emoji: "🔬",
    desc: "Técnico e preciso",
    color: "#06b6d4",
    systemPrompt: "Modo EXPERT: seja técnico, preciso e detalhado. Use terminologia correta. Cite conceitos avançados. Trate o usuário como especialista.",
    temperature: 0.4,
  },
  debate: {
    id: "debate",
    name: "DEBATE",
    emoji: "⚖️",
    desc: "Argumenta os dois lados",
    color: "#f59e0b",
    systemPrompt: "Modo DEBATE: apresente argumentos dos DOIS lados de qualquer questão. Seja equilibrado. No final, dê sua síntese.",
    temperature: 0.8,
  },
  roleplay: {
    id: "roleplay",
    name: "ROLEPLAY",
    emoji: "🎭",
    desc: "Assume personagens",
    color: "#ef4444",
    systemPrompt: "Modo ROLEPLAY: se o usuário pedir, assuma completamente qualquer personagem, personalidade ou cenário. Mantenha a imersão total.",
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

export function loadMode(): ReasoningMode {
  if (typeof window === "undefined") return "deep";
  const saved = localStorage.getItem("jarvis.mode") as ReasoningMode;
  return saved && MODES[saved] ? saved : "deep";
}

export function saveMode(m: ReasoningMode) {
  localStorage.setItem("jarvis.mode", m);
}