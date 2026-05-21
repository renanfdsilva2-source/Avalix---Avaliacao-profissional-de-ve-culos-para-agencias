import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: false },
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "logo-avalix.png"],
      manifest: {
        name: "Avalix – Avaliação Automotiva",
        short_name: "Avalix",
        description: "Plataforma corporativa de avaliação profissional de veículos.",
        theme_color: "#0d111a",
        background_color: "#07111F",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        lang: "pt-BR",
        categories: ["business", "productivity"],
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        screenshots: [
          {
            src: "/logo-avalix.png",
            sizes: "1080x1080",
            type: "image/png",
            form_factor: "narrow",
            label: "Avaliação de Veículos Avalix",
          },
        ],
      },
      workbox: {
        navigateFallback: "/",
        navigateFallbackDenylist: [/^\\/~oauth/, /^\\/api\//],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,

        // Pré-cache de todos os assets do build
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],

        runtimeCaching: [
          // Página principal — tenta rede, cai no cache
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "avalix-html",
              networkTimeoutSeconds: 4,
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // Assets estáticos (JS, CSS, fontes, imagens do app)
          {
            urlPattern: ({ request }) =>
              ["script", "style", "font", "image"].includes(request.destination),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "avalix-static",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },

          // Fotos salvas no Supabase Storage — ficam disponíveis offline
          {
            urlPattern: /\/storage\/v1\/object\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "avalix-fotos",
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // API do Supabase — tenta rede, usa cache se offline
          {
            urlPattern: /\/rest\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "avalix-api",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // Auth do Supabase — sempre rede (nunca cachear tokens)
          {
            urlPattern: /\/auth\/v1\/.*/i,
            handler: "NetworkOnly",
          },

          // Edge Functions (consulta-placa etc.) — tenta rede, sem cache
          {
            urlPattern: /\/functions\/v1\/.*/i,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
}));
