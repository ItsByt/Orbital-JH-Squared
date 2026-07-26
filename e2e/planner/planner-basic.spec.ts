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
const Y1_ST1 = `Y1${REVERSE_SEMESTER_CODE_MAP[SEMESTER_CODES.SPECIAL_TERM_1]}`;

const mockNusModsApi = async (page: Page) => {
    await page.route("https://api.nusmods.com/v2/**/*.json", async (route) => {
        const url = route.request().url();
        if (url.includes("CS1101S.json")) {
            await route.fulfill({
                json: {
                    moduleCode: "CS1101S",
                    title: "Programming Methodology",
                    moduleCredit: "4",
                    prereqTree: null,
                    semesterData: [{ semester: 1 }, { semester: 2 }],
                },
            });
        } else {
            await route.fulfill({
                json: [
                    {
                        moduleCode: "CS1101S",
                        title: "Programming Methodology",
                        semesters: [1, 2, 3, 4],
                    },
                ],
            });
        }
    });
};

test.describe("Planner Basic functionality", () => {
    test.beforeEach(async ({ page }, testInfo) => {
        await wipeTestDatabase(testInfo.parallelIndex);
        await mockNusModsApi(page);
        await page.goto("/planner");
        await expect(page.locator('[data-testid="planner-loading-screen"]')).toBeHidden();
    });

    test("Can add a standard API module to a semester", async ({ page }) => {
        await addCourseSafely(page, Y1_S1, "CS1101S");
    });

    test("Can create and add Custom Modules", async ({ page }) => {
        const column = page.locator(`[data-testid="semester-column-${Y1_S2}"]`);

        await page.locator(`[data-testid="add-course-btn-${Y1_S2}"]`).click();
        await page.getByText("+ Create Custom Module").click();

        await page.locator('[data-testid="custom-module-code-input"]').fill("CUSTOM99");
        await page.locator('[data-testid="custom-module-title-input"]').fill("Secret Class");
        await page.locator('[data-testid="custom-module-units-input"]').fill("6");

        const dbInsertPromise = page.waitForResponse(
            (res) => res.url().includes("planner_modules") && res.request().method() === "POST"
        );
        await page.locator('[data-testid="submit-custom-module-btn"]').click();
        await dbInsertPromise;

        await expect(column.locator('[data-testid="module-card-CUSTOM99"]')).toBeVisible();
    });

    test("Can remove a module via the dropdown menu", async ({ page }) => {
        await addCourseSafely(page, Y1_S1, "CS1101S");
        const moduleCard = page.locator('[data-testid="module-card-CS1101S"]');

        const dbDeletePromise = page.waitForResponse(
            (res) => res.url().includes("planner_modules") && res.request().method() === "DELETE"
        );

        await page.locator('[data-testid="module-menu-trigger-CS1101S"]').click();
        await page.locator('[data-testid="module-delete-CS1101S"]').click();

        await dbDeletePromise;
        await expect(moduleCard).toBeHidden();
    });

    test("Can add Special Terms to a Year Block", async ({ page }) => {
        await page.locator('[data-testid="add-special-term-trigger-1"]').click();

        const st1Key = REVERSE_SEMESTER_CODE_MAP[SEMESTER_CODES.SPECIAL_TERM_1];
        await page.locator(`[data-testid="add-term-${st1Key}-year-1"]`).click();

        await expect(page.locator(`[data-testid="semester-column-${Y1_ST1}"]`)).toBeVisible();
    });

    test("Can add and clear modules in the Exemption Row", async ({ page }) => {
        const exemptionZone = page.locator('[data-testid="exemption-row"]');

        await addCourseSafely(page, "exemption", "CS1101S");

        const dbDeletePromise = page.waitForResponse(
            (res) => res.url().includes("planner_modules") && res.request().method() === "DELETE"
        );

        await exemptionZone.hover();
        await page.locator('[data-testid="clear-exemptions-btn"]').click();
        await page.locator('[data-testid="confirm-clear-exemptions"]').click();

        await dbDeletePromise;
        await expect(exemptionZone.locator('[data-testid="module-card-CS1101S"]')).toBeHidden();
    });
});
