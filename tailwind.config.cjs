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
        highlight: "#ff7a18"
      },
      fontFamily: {
        sans: ["Inter", ...fontFamily.sans]
      },
      boxShadow: {
        glow: "0 0 20px rgba(31, 111, 235, 0.35)"
      }
    }
  },
  plugins: []
};
