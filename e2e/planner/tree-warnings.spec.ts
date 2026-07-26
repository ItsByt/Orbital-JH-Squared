// e2e/planner/tree-warnings.spec.ts
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

const mockPrereqApi = async (page: Page) => {
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
                    prereqTree: "CS1010S", // CS2040S requires CS1010S!
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
                ],
            });
        }
    });
};

test.describe("Planner Prerequisite Warnings", () => {
    test.beforeEach(async ({ page }, testInfo) => {
        await wipeTestDatabase(testInfo.parallelIndex);
        await mockPrereqApi(page);
        await page.goto("/planner");
        await expect(page.locator('[data-testid="planner-loading-screen"]')).toBeHidden();
    });

    test("Scenario 1: Shows warning when prerequisite is entirely missing", async ({ page }) => {
        await addCourseSafely(page, Y1_S1, "CS2040S");
        const warningIndicator = page
            .locator('[data-testid="module-card-CS2040S"]')
            .locator('[data-testid="warning-icon-CS2040S"]');
        await expect(warningIndicator).toBeVisible();
    });

    test("Scenario 2: Warning disappears when prerequisite is added to an earlier semester", async ({
        page,
    }) => {
        await addCourseSafely(page, Y1_S2, "CS2040S"); // Taken in Semester 2
        const warningIndicator = page
            .locator('[data-testid="module-card-CS2040S"]')
            .locator('[data-testid="warning-icon-CS2040S"]');
        await expect(warningIndicator).toBeVisible(); // Initially missing

        // Add prerequisite to Semester 1 (earlier)
        await addCourseSafely(page, Y1_S1, "CS1010S");

        // The warning should clear automatically
        await expect(warningIndicator).toBeHidden();
    });

    test("Scenario 3: Warning REMAINS if prerequisite is taken concurrently in the same semester", async ({
        page,
    }) => {
        await addCourseSafely(page, Y1_S1, "CS1010S"); // Taken in Sem 1
        await addCourseSafely(page, Y1_S1, "CS2040S"); // Taken in Sem 1

        const warningIndicator = page
            .locator('[data-testid="module-card-CS2040S"]')
            .locator('[data-testid="warning-icon-CS2040S"]');

        // Prerequisites cannot usually be taken at the exact same time
        await expect(warningIndicator).toBeVisible();
    });

    test("Scenario 4: Warning REMAINS if prerequisite is taken in a FUTURE semester", async ({
        page,
    }) => {
        await addCourseSafely(page, Y1_S1, "CS2040S"); // Taken early
        await addCourseSafely(page, Y1_S2, "CS1010S"); // Prereq taken late

        const warningIndicator = page
            .locator('[data-testid="module-card-CS2040S"]')
            .locator('[data-testid="warning-icon-CS2040S"]');

        // Taking the prereq later doesn't help!
        await expect(warningIndicator).toBeVisible();
    });
});
