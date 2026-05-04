import { useEffect } from "react";
import { useThemeStore } from "@/store/theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const setTheme = useThemeStore((s) => s.setTheme);
  const theme = useThemeStore((s) => s.theme);
  useEffect(() => {
    setTheme(theme);
  }, [setTheme, theme]);
  return <>{children}</>;
}
