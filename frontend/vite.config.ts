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
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: {
        name: "MailChat",
        short_name: "MailChat",
        description: "Email messaging reimagined.",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        start_url: "/",
        scope: "/",
        display: "standalone",
        icons: [
          { src: "/app-logo.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
          { src: "/app-logo.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
          { src: "/app-logo.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "/app-logo.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
        ]
      },
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,svg,ico,png}"]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
