import { useEffect, useState } from "react";

const THEME_KEY = "nstar::theme";

const getPreferredTheme = () => {
  if (typeof localStorage === "undefined") {
    return "dark";
  }
  return localStorage.getItem(THEME_KEY) ?? "dark";
};

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<string>(() => getPreferredTheme());

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(THEME_KEY, theme);
    }
  }, [theme]);

  return (
    <button
      onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
      className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/70 transition hover:border-highlight hover:text-white"
    >
      {theme === "dark" ? "Dark" : "Light"} mode
    </button>
  );
};
