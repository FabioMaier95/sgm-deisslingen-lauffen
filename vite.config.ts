import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.jpg"],
      manifest: {
        name: "SGM Deißlingen-Lauffen",
        short_name: "SGM App",
        description: "Die Vereins-App der SGM Deißlingen-Lauffen",
        theme_color: "#e30613",
        background_color: "#ffffff",
        display: "standalone",
        lang: "de",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" }
        ]
      }
    })
  ]
});