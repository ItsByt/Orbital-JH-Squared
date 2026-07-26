/// <reference types="node" />
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const numWorkers = JSON.parse(process.env.E2E_WORKERS || "[]").length || 1;

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: numWorkers,
    reporter: "html",
    use: {
        baseURL: "http://localhost:5173",
        trace: "on-first-retry",
        launchOptions: {
            slowMo: 50,
        },
    },

    projects: [
        {
            name: "setup",
            testMatch: /.*\.setup\.ts/,
        },
        {
            name: "chromium",
            use: {
                ...devices["Desktop Chrome"],
            },
            dependencies: ["setup"],
        },
        // Uncomment to test each specific type of browser
        // Due to the sheer number of tests,
        // Having more "workers" to do tests in parallel is ideal to speed up time.
        // But too many workers and too many tests at once kills our computer's RAM

        // {
        //     name: "firefox",
        //     use: {
        //         ...devices["Desktop Firefox"],
        //     },
        //     dependencies: ['setup'],
        // },
        // {
        //     name: "webkit",
        //     use: {
        //         ...devices["Desktop Safari"],
        //     },
        //     dependencies: ['setup'],
        // },
    ],

    webServer: {
        command: "npm run dev",
        url: "http://localhost:5173",
        reuseExistingServer: !process.env.CI,
    },
});
