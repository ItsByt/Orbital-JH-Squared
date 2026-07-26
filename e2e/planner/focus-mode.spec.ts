// e2e/planner/focus-mode.spec.ts
import { test, expect } from "./fixtures";
import { Page } from "@playwright/test";
import { wipeTestDatabase } from "./utils/dbTeardown";
import { addCourseSafely } from "./utils/mockModuleUtils";
import {
    SEMESTER_CODES,
    REVERSE_SEMESTER_CODE_MAP,
} from "../../src/utils/plannerUtils/semesterKeyUtils";

const Y1_S1 = `Y1${REVERSE_SEMESTER_CODE_MAP[SEMESTER_CODES.SEM_1]}`;
const Y1_S2 = `Y1${REVERSE_SEMESTER_CODE_MAP[SEMESTER_CODES.SEM_2]}`;

const mockApi = async (page: Page) => {
    await page.route("https://api.nusmods.com/v2/**/*.json", async (route) => {
        const url = route.request().url();
        if (url.includes("CS1010S.json")) {
            await route.fulfill({
                json: {
                    moduleCode: "CS1010S",
                    title: "Programming Methodology",
                    moduleCredit: "4",
                    semesterData: [{ semester: 1 }, { semester: 2 }],
                },
            });
        } else if (url.includes("CS2040S.json")) {
            await route.fulfill({
                json: {
                    moduleCode: "CS2040S",
                    title: "Data Structures and Algorithms",
                    moduleCredit: "4",
                    prereqTree: "CS1010S",
                    semesterData: [{ semester: 1 }, { semester: 2 }],
                },
            });
        } else if (url.includes("MA1521.json")) {
            await route.fulfill({
                json: {
                    moduleCode: "MA1521",
                    title: "Calculus",
                    moduleCredit: "4",
                    semesterData: [{ semester: 1 }, { semester: 2 }],
                },
            });
        } else {
            await route.fulfill({
                json: [
                    { moduleCode: "CS1010S", title: "Programming Methodology", semesters: [1, 2] },
                    {
                        moduleCode: "CS2040S",
                        title: "Data Structures and Algorithms",
                        semesters: [1, 2],
                    },
                    { moduleCode: "MA1521", title: "Calculus", semesters: [1, 2] },
                ],
            });
        }
    });
};

test.describe("Planner Focus Mode", () => {
    test.beforeEach(async ({ page }, testInfo) => {
        await wipeTestDatabase(testInfo.parallelIndex);
        await mockApi(page);
        await page.goto("/planner");
        await expect(page.locator('[data-testid="planner-loading-screen"]')).toBeHidden();

        // Setting up 3 modules: A prereq, a postreq, and an unrelated module
        await addCourseSafely(page, Y1_S1, "CS1010S");
        await addCourseSafely(page, Y1_S1, "MA1521");
        await addCourseSafely(page, Y1_S2, "CS2040S");
    });

    test("Modules enter neutral focus state when Focus Mode is activated", async ({ page }) => {
        const cs1010sCard = page.locator('[data-testid="module-card-CS1010S"]');

        // Verify default state
        await expect(cs1010sCard).toHaveClass(/bg-\[#3070b3\]/);

        // Turn on Focus Mode
        await page.getByRole("button", { name: /Focus Mode/i }).click();

        // Verify "Focus ON, no selection" state
        await expect(cs1010sCard).toHaveClass(/bg-\[#3070b3\]\/80/);
        await expect(cs1010sCard).toHaveClass(/ring-1/);
    });

    test("Correctly applies Active, Postreq, and Unrelated styles", async ({ page }) => {
        await page.getByRole("button", { name: /Focus Mode/i }).click();

        const cs1010sCard = page.locator('[data-testid="module-card-CS1010S"]');
        const cs2040sCard = page.locator('[data-testid="module-card-CS2040S"]');
        const ma1521Card = page.locator('[data-testid="module-card-MA1521"]');

        // Click CS1010S
        await cs1010sCard.click();

        // CS1010S should be Active
        await expect(cs1010sCard).toHaveClass(/bg-blue-600/);

        // CS2040S should be Post Req
        await expect(cs2040sCard).toHaveClass(/bg-rose-600/);

        // MA1521 should be Unrelated
        await expect(ma1521Card).toHaveClass(/grayscale/);
        await expect(ma1521Card).toHaveClass(/bg-zinc-800\/50/);
    });

    test("Correctly applies Prereq styles when a later module is selected", async ({ page }) => {
        await page.getByRole("button", { name: /Focus Mode/i }).click();

        const cs1010sCard = page.locator('[data-testid="module-card-CS1010S"]');
        const cs2040sCard = page.locator('[data-testid="module-card-CS2040S"]');

        // Click CS2040S
        await cs2040sCard.click();

        // CS2040S should be Active
        await expect(cs2040sCard).toHaveClass(/bg-blue-600/);

        // CS1010S should be Pre Req
        await expect(cs1010sCard).toHaveClass(/bg-emerald-600/);
    });
});
