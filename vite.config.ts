import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Daily Fuel",
        short_name: "Daily Fuel",
        description: "A private, local-first calorie and macro tracker.",
        theme_color: "#f7f5ef",
        background_color: "#f7f5ef",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/world\.openfoodfacts\.org\/api\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "open-food-facts",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 }
            }
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("@zxing")) return "scanner";
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("date-fns")) return "dates";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("react") || id.includes("scheduler")) return "react";
          return undefined;
        }
      }
    }
  }
});
