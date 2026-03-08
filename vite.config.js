import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logoimg.jpeg'],
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'Finova Academy - CBSE Commerce Tuition',
        short_name: 'Finova Academy',
        description: 'Live online tuition for CBSE Class 11 & 12 Commerce.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'logoimg.jpeg',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: 'logoimg.jpeg',
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      }
    })
  ],
});
