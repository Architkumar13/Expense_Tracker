import { create } from "zustand";

export type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const STORAGE_KEY = "et:theme";

function readStored(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    /* ignore */
  }
  return "system";
}

function resolve(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

function apply(theme: Theme): "light" | "dark" {
  const resolved = resolve(theme);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  return resolved;
}

const initial = typeof window !== "undefined" ? readStored() : "system";

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initial,
  resolvedTheme: typeof window !== "undefined" ? apply(initial) : "dark",
  setTheme: (theme) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
    const resolvedTheme = apply(theme);
    set({ theme, resolvedTheme });
  },
}));

if (typeof window !== "undefined") {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", () => {
    const { theme, setTheme } = useThemeStore.getState();
    if (theme === "system") setTheme("system");
  });
}
