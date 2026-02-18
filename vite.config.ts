import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

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
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/openrouter\.ai\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "openrouter-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60
              }
            }
          },
          {
            urlPattern: /^https:\/\/api\.openai\.com\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "openai-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60
              }
            }
          },
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "cdn-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          }
        ]
      },
      manifest: {
        name: "Horizon PWA",
        short_name: "Horizon",
        description: "Autonomous productivity ecosystem with AI-powered agents, learning, knowledge management, and task organization.",
        theme_color: "#0b0d10",
        background_color: "#0b0d10",
        display: "standalone",
        orientation: "any",
        scope: "/",
        start_url: "/",
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
        ],
        categories: ["productivity", "education", "utilities"],
        shortcuts: [
          {
            name: "Command Center",
            short_name: "Chat",
            description: "Open AI command center",
            url: "/?section=command",
            icons: [{ src: "favicon.svg", sizes: "96x96" }]
          },
          {
            name: "Learning Studio",
            short_name: "Learn",
            description: "Open learning vaults",
            url: "/?section=learning",
            icons: [{ src: "favicon.svg", sizes: "96x96" }]
          },
          {
            name: "Tasks",
            short_name: "Tasks",
            description: "View your tasks",
            url: "/?section=tasks",
            icons: [{ src: "favicon.svg", sizes: "96x96" }]
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
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "zustand", "dexie"],
          ui: ["lucide-react", "framer-motion", "@radix-ui/react-dialog", "@radix-ui/react-scroll-area"],
          editor: ["@tiptap/react", "@tiptap/starter-kit"],
          charts: ["recharts"]
        }
      }
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.ts"
  }
});
