import { defineConfig } from "vite";
import plugin from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [plugin(), tailwindcss()],
    server: {
        port: 58133,
    },
    build: {
        // Increase limit for Three.js and React Three Fiber
        chunkSizeWarningLimit: 800,
    },
});
