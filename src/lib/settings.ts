export type JarvisSettings = {
  tone: "formal" | "classic" | "casual";
  length: "concise" | "detailed";
  volume: number;
};

const KEY = "jarvis.settings.v1";

export const defaultSettings: JarvisSettings = {
  tone: "classic",
  length: "detailed",
  volume: 0.8,
};

export function loadSettings(): JarvisSettings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(s: JarvisSettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
}
