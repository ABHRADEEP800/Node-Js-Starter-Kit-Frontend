import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      devOptions: {
        enabled: true,
        type: "module",
      },
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,jpg,svg}"],
      },
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      injectManifest: {
        swDest: "dist/sw.js",
      },
      manifest: {
        name: "Starter Kit",
        short_name: "Starter Kit",
        description:
          "Production-ready authentication starter kit — sessions, CSRF, 2FA, passkeys, RBAC.",
        theme_color: "#2563eb",
        start_url: "/",
        icons: [
          {
            src: "pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
          },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Issue 123: only collapse truly heavy vendor deps into their own
        // chunk. Stuffing every node_modules dep into one "vendor" chunk
        // defeats the point of code-splitting.
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("scheduler")) {
              return "react";
            }
            if (id.includes("@reduxjs") || id.includes("react-redux")) {
              return "redux";
            }
            if (id.includes("@simplewebauthn")) {
              return "passkey";
            }
            return "vendor";
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});