import { localIconPlugin } from "./scripts/local-icon-plugin";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig(({ command }) => ({
  base: "./",
  optimizeDeps: { entries: ["index.html"] },
  plugins: [
    localIconPlugin(command),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "捡手机",
        short_name: "捡手机",
        display: "standalone",
        background_color: "#000000",
        theme_color: "#000000",
        icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
      workbox: {
        clientsClaim: true,
        globPatterns: ["**/*.{js,css,html,svg,json,txt,png,jpg}"],
        maximumFileSizeToCacheInBytes: 4000000,
        globIgnores: ["**/story-media/**"],
        runtimeCaching: [
          {
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin &&
              /\/story-media\/[a-f0-9]{64}\.(jpg|png|gif|webp)$/.test(
                url.pathname,
              ),
            handler: "CacheFirst",
            options: {
              cacheName: "foundphone-gallery",
              expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
}));
