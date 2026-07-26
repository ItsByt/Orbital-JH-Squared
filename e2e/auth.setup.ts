import { test as setup, expect } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const workers = JSON.parse(process.env.E2E_WORKERS || "[]");
const password = process.env.E2E_WORKER_PASSWORD as string;

setup("Authenticate all workers", async ({ browser }) => {
    if (workers.length === 0) throw new Error("No workers found in E2E_WORKERS env variable.");

    for (let i = 0; i < workers.length; i++) {
        const email = workers[i].email;

        const context = await browser.newContext();
        const page = await context.newPage();

        await page.goto("/login");
        await page.locator('[data-testid="login-email-input"]').fill(email);
        await page.locator('[data-testid="login-password-input"]').fill(password);
        await page.locator('[data-testid="login-submit-button"]').click();

        await expect(page).toHaveURL(/.*\/timetable\/sem-[12]/);

        // Save the specific state for each worker index
        await context.storageState({ path: `playwright/.auth/user-${i}.json` });
        await context.close();
    }
});
