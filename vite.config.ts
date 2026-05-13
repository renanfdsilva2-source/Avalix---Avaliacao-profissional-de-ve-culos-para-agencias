import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
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
      includeAssets: ["favicon.ico", "apple-touch-icon.png"],
      manifest: {
        name: "Avalix – Avaliação Automotiva",
        short_name: "Avalix",
        description:
          "Plataforma corporativa de avaliação profissional de veículos.",
        theme_color: "#0d111a",
        background_color: "#07111F",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        lang: "pt-BR",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        // Allow large photo files to be precached/cached at runtime
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: { cacheName: "html", networkTimeoutSeconds: 3 },
          },
          // Cache uploaded photos (Supabase Storage signed URLs) so they
          // remain visible when offline.
          {
            urlPattern: /\/storage\/v1\/object\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "evaluation-photos",
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Cache static assets (fonts, images shipped with the app)
          {
            urlPattern: ({ request }) =>
              ["image", "font", "style", "script"].includes(request.destination),
            handler: "StaleWhileRevalidate",
            options: { cacheName: "static-assets" },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
