import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        include: ["src/**/__tests__/*.test.{ts,tsx}"], // Only look in __tests__ folders
        exclude: ["e2e/**", "node_modules/**"],       // Ignore Playwright tests
        globals: true,
        setupFiles: "./src/test/setup.ts", 
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});


