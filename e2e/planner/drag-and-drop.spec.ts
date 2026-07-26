// e2e/planner/drag-drop.spec.ts
import { test, expect } from "./fixtures";
import { Page } from "@playwright/test";
import { wipeTestDatabase } from "./utils/dbTeardown";
import { addCourseSafely, retryDragAndDrop } from "./utils/mockModuleUtils";
import {
    SEMESTER_CODES,
    REVERSE_SEMESTER_CODE_MAP,
} from "../../src/utils/plannerUtils/semesterKeyUtils";

const Y1_S1 = `Y1${REVERSE_SEMESTER_CODE_MAP[SEMESTER_CODES.SEM_1]}`;
const Y1_S2 = `Y1${REVERSE_SEMESTER_CODE_MAP[SEMESTER_CODES.SEM_2]}`;

const mockApi = async (page: Page) => {
    await page.route("https://api.nusmods.com/v2/**/*.json", async (route) => {
        const url = route.request().url();
        if (url.includes("CS1101S.json")) {
            await route.fulfill({
                json: {
                    moduleCode: "CS1101S",
                    title: "Programming Methodology",
                    moduleCredit: "4",
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
                    { moduleCode: "CS1101S", title: "Programming Methodology", semesters: [1, 2] },
                    { moduleCode: "MA1521", title: "Calculus", semesters: [1, 2] },
                ],
            });
        }
    });
};

test.describe("Planner Drag and Drop", () => {
    test.beforeEach(async ({ page }, testInfo) => {
        await wipeTestDatabase(testInfo.parallelIndex);
        await mockApi(page);
        await page.goto("/planner");
        await expect(page.locator('[data-testid="planner-loading-screen"]')).toBeHidden();
    });

    test("Can successfully drag a module from Semester 1 to Semester 2", async ({ page }) => {
        await addCourseSafely(page, Y1_S1, "CS1101S");
        const moduleCard = page.locator('[data-testid="module-card-CS1101S"]');

        const semester2Column = page.locator(`[data-testid="semester-column-${Y1_S2}"]`);

        await retryDragAndDrop(page, moduleCard, semester2Column);
        await expect(semester2Column.locator('[data-testid="module-card-CS1101S"]')).toBeVisible();
    });

    test("Can successfully drag a module into the Exemption row", async ({ page }) => {
        await addCourseSafely(page, Y1_S1, "MA1521");
        const moduleCard = page.locator('[data-testid="module-card-MA1521"]');
        const exemptionRow = page.locator('[data-testid="exemption-row"]');

        await retryDragAndDrop(page, moduleCard, exemptionRow);
        await expect(exemptionRow.locator('[data-testid="module-card-MA1521"]')).toBeVisible();
    });

    test("Can successfully drag a module from the Exemption row back into a Semester", async ({
        page,
    }) => {
        await addCourseSafely(page, "exemption", "CS1101S");
        const moduleCard = page.locator('[data-testid="module-card-CS1101S"]');
        const semester1Column = page.locator(`[data-testid="semester-column-${Y1_S1}"]`);

        await retryDragAndDrop(page, moduleCard, semester1Column);
        await expect(semester1Column.locator('[data-testid="module-card-CS1101S"]')).toBeVisible();
    });
});
