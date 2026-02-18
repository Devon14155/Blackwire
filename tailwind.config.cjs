const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        background: "#0b0d10",
        foreground: "#f4f5f7",
        accent: {
          DEFAULT: "#1f6feb",
          foreground: "#0b0d10"
        },
        highlight: "#ff7a18",
        surface: {
          DEFAULT: "#0f1117",
          raised: "#151821",
          overlay: "#1a1d26"
        },
        success: "#22c55e",
        warning: "#eab308",
        error: "#ef4444",
        info: "#3b82f6"
      },
      fontFamily: {
        sans: ["Inter", ...fontFamily.sans],
        mono: ["JetBrains Mono", ...fontFamily.mono]
      },
      boxShadow: {
        glow: "0 0 20px rgba(255, 122, 24, 0.35)",
        "glow-accent": "0 0 20px rgba(31, 111, 235, 0.35)",
        "glow-success": "0 0 20px rgba(34, 197, 94, 0.35)"
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 3s linear infinite",
        "bounce-subtle": "bounce 2s infinite"
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        }
      }
    }
  },
  plugins: []
};
