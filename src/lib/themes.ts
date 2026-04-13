export interface Theme {
  name: string;
  id: string;
  colors: Record<string, string>;
}

export const defaultTheme: Theme = {
  name: "Catppuccin Mocha",
  id: "catppuccin-mocha",
  colors: {
    "bg-primary": "#1e1e2e",
    "bg-secondary": "#181825",
    "bg-surface": "#313244",
    "bg-hover": "#45475a",
    "text-primary": "#cdd6f4",
    "text-secondary": "#a6adc8",
    "text-muted": "#6c7086",
    "accent": "#89b4fa",
    "accent-hover": "#74c7ec",
    "border": "#45475a",
    "log-chat-global": "#a6e3a1",
    "log-chat-help": "#f9e2af",
    "log-chat-nearby": "#89dceb",
    "log-chat-guild": "#cba6f7",
    "log-chat-trade": "#fab387",
    "log-chat-tell": "#f5c2e7",
    "log-chat-emote": "#94e2d5",
    "log-chat-announcement": "#f38ba8",
    "log-chat-info": "#a6adc8",
    "log-chat-error": "#f38ba8",
    "log-chat-custom": "#b4befe",
    "log-combat": "#f38ba8",
    "log-status": "#74c7ec",
    "log-npc": "#f5c2e7",
    "log-action": "#94e2d5",
    "log-system": "#6c7086",
    "log-item": "#f9e2af",
    "log-skill": "#89b4fa",
    "log-quest": "#cba6f7",
    "log-interaction": "#f5c2e7",
    "log-effect": "#74c7ec",
    "log-attribute": "#a6adc8",
    "log-vendor": "#fab387",
    "log-mount": "#94e2d5",
    "log-weather": "#89dceb",
    "log-timestamp": "#585b70",
  },
};

export const builtInThemes: Theme[] = [
  defaultTheme,
  {
    name: "Gorgon Dark",
    id: "gorgon-dark",
    colors: {
      "bg-primary": "#1a1a2e",
      "bg-secondary": "#16213e",
      "bg-surface": "#0f3460",
      "bg-hover": "#1a4080",
      "text-primary": "#e0e0e0",
      "text-secondary": "#b0b0b0",
      "text-muted": "#707070",
      "accent": "#e94560",
      "accent-hover": "#ff6b6b",
      "border": "#0f3460",
      "log-chat-global": "#4ecca3",
      "log-chat-help": "#ffd369",
      "log-chat-nearby": "#00b4d8",
      "log-chat-guild": "#9b59b6",
      "log-chat-trade": "#e67e22",
      "log-chat-tell": "#e84393",
      "log-chat-emote": "#00cec9",
      "log-chat-announcement": "#e74c3c",
      "log-chat-info": "#b0b0b0",
      "log-chat-error": "#e74c3c",
      "log-chat-custom": "#a29bfe",
      "log-combat": "#e74c3c",
      "log-status": "#3498db",
      "log-npc": "#e84393",
      "log-action": "#00cec9",
      "log-system": "#636e72",
      "log-item": "#f39c12",
      "log-skill": "#6c5ce7",
      "log-quest": "#9b59b6",
      "log-interaction": "#e84393",
      "log-effect": "#3498db",
      "log-attribute": "#b0b0b0",
      "log-vendor": "#e67e22",
      "log-mount": "#00cec9",
      "log-weather": "#00b4d8",
      "log-timestamp": "#555555",
    },
  },
  {
    name: "Light",
    id: "light",
    colors: {
      "bg-primary": "#ffffff",
      "bg-secondary": "#f5f5f5",
      "bg-surface": "#e8e8e8",
      "bg-hover": "#dcdcdc",
      "text-primary": "#1a1a1a",
      "text-secondary": "#4a4a4a",
      "text-muted": "#999999",
      "accent": "#2563eb",
      "accent-hover": "#1d4ed8",
      "border": "#d4d4d4",
      "log-chat-global": "#16a34a",
      "log-chat-help": "#ca8a04",
      "log-chat-nearby": "#0891b2",
      "log-chat-guild": "#7c3aed",
      "log-chat-trade": "#ea580c",
      "log-chat-tell": "#db2777",
      "log-chat-emote": "#0d9488",
      "log-chat-announcement": "#dc2626",
      "log-chat-info": "#4a4a4a",
      "log-chat-error": "#dc2626",
      "log-chat-custom": "#6366f1",
      "log-combat": "#dc2626",
      "log-status": "#2563eb",
      "log-npc": "#db2777",
      "log-action": "#0d9488",
      "log-system": "#737373",
      "log-item": "#d97706",
      "log-skill": "#4f46e5",
      "log-quest": "#7c3aed",
      "log-interaction": "#db2777",
      "log-effect": "#2563eb",
      "log-attribute": "#4a4a4a",
      "log-vendor": "#ea580c",
      "log-mount": "#0d9488",
      "log-weather": "#0891b2",
      "log-timestamp": "#a3a3a3",
    },
  },
];

/** Apply a theme by setting CSS custom properties on :root */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.colors)) {
    root.style.setProperty(`--color-${key}`, value);
  }
}

const STORAGE_KEY = "glv-theme-id";

export function loadSavedThemeId(): string {
  return localStorage.getItem(STORAGE_KEY) ?? defaultTheme.id;
}

export function saveThemeId(id: string) {
  localStorage.setItem(STORAGE_KEY, id);
}
