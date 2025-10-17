import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "@vite-pwa/plugin";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "masked-icon.svg"],
      strategies: "generateSW",
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"]
      },
      manifest: {
        name: "NSTAR Chat Console",
        short_name: "NSTAR Chat",
        description: "Secure, model-agnostic conversational AI console.",
        theme_color: "#0b0d10",
        background_color: "#0b0d10",
        display: "standalone",
        orientation: "portrait",
        icons: [
          {
            src: "favicon.svg",
            sizes: "192x192",
            type: "image/svg+xml"
          },
          {
            src: "masked-icon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      }
    })
  ],
  server: {
    https: false,
    port: 5173
  },
  build: {
    target: "es2022"
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.ts"
  }
});
