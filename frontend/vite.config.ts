import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: "prompt",
            injectRegister: false,
            pwaAssets: {
                disabled: false,
                config: true,
            },

            manifest: {
                name: "Revoque IMS",
                short_name: "IMS",
                description: "Inventory Management System",
                theme_color: "#0f172a",
                background_color: "#0f172a",
                display: "standalone",
                start_url: "/",
                icons: [
                    {
                        src: "android-chrome-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "android-chrome-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                ],
            },
            workbox: {
                globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                runtimeCaching: [
                    {
                        // 1. Production API
                        urlPattern: /^https:\/\/api-ims\.revoque\.com\.ng\/.*/i,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'prod-api-cache',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24 // 24 hours
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        // 2. Local API
                        urlPattern: /^http:\/\/api.ims\.lvh.me\/.*/i,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'local-api-cache'
                        }
                    },
                    {
                        // 3. Clerk Authentication (Never cache auth)
                        urlPattern: ({ url }) => url.origin.includes('clerk.accounts.dev'),
                        handler: 'NetworkOnly'
                    }
                ]
            },
            devOptions: {
                enabled: true,
                navigateFallback: "index.html",
                suppressWarnings: true,
                type: "module",
            },
        }),
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        host: "0.0.0.0",
        port: 5173,
        allowedHosts: true,
        watch: {
            ignored: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
        },
    },
});
